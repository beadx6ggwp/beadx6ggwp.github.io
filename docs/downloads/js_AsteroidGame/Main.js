var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var PI = Math.PI;

var lastTime = 0,Timesub;
var animation;
var loop = true;

var ship,hp;
var asteroids=[], asteroids_total;
var bullet=[], pushTime=10, Timecount = 0;
var score = 0,level = 0, scoreList = [200,100,50];

var sndSrc = ["sound/bomb.mp3","sound/powerup02.mp3","sound/powerdown03.mp3","sound/hiding.mp3"];
var shootSound = ["sound/shoot1.mp3","sound/laser4.mp3"];

var pass = false;

//Key Event
var keysDown = {};
document.addEventListener("keydown", function(e){    
    keysDown[e.keyCode] = true;
    keysDown.down = true;
    //press r to restart
    if(e.keyCode == 82){
        init();
    }
    //press p to pass
    if(e.keyCode == 80){
        if(!pass)
            cancelAnimationFrame(animation);
        else
            animation = requestAnimationFrame(gameloop);
        pass = !pass;
    }
    //console.log(e.keyCode,pass);
}, false);
document.addEventListener("keyup", function (e) {
    delete keysDown[e.keyCode];
    keysDown.down = false;
}, false);


main();

function main(){
    //offsetTop , Left canvas location
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();    
}
function init(){
    cancelAnimationFrame(animation);
    loop = true;

    keysDown = {};

    score = 0;

    ship = new Ship();
    hp = 3;
    asteroids_total = 6;
    asteroids = [];
    bullet = [];

    makeAsteroid();

    gameloop();
}

function gameloop(timestamp){
    Timesub = timestamp - lastTime;
    lastTime = timestamp;
    //Clear
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    
    update();
    draw();
    
                    

    if(loop){
        animation = window.requestAnimationFrame(gameloop);
    }else{
        //gameover
        playSound(sndSrc[2],0.3);
        ctx.fillText("Game Over",canvas.width/2-100,canvas.height/2-100);
        ctx.fillText("Point: "+score,canvas.width/2-100,canvas.height/2);
        ctx.fillText("Lv: "+level,canvas.width/2-100,canvas.height/2+100);
        ctx.fillText("Press \"R\" to restart",canvas.width/2-200,canvas.height/2+200);
    }
    //console.log(animation);
    console.log("sleep:"+Timesub,"fps:"+1000/Timesub);
}

function update(){   
    Timecount++;
    key();


    ship.turn();
    ship.update();

    for(var i=0;i < asteroids.length;i++){        
        asteroids[i].update();
    }
    for(var i = 0;i < bullet.length;i++){
        bullet[i].update();        
        if(bullet[i].edge()){
            bullet.splice(i,1);//remove element
        }
    }
    
    for(var i = 0;i < asteroids.length;i++){
        if(ship.collision(asteroids[i])){
            hp--;
            if(hp <= 0){
                loop = false;                
            }else{
                ship = new Ship();
            }
        }
    }

    for(var i = 0;i < asteroids.length;i++){
        for(var j = 0;j < bullet.length;j++){
            if(bullet[j].collision(asteroids[i])){
                var s = getSize(asteroids[i].r);
                score += scoreList[s];
                if(asteroids[i].r >= asteroids[i].min){
                    var b = asteroids[i].break();
                    asteroids = asteroids.concat(b);
                }

                bullet.splice(j,1);
                asteroids.splice(i,1);

                //sound
                playSound(sndSrc[0],0.3);

                //console.log(asteroids);
                break;
            }
        }
    }

    //next lv
    if(asteroids.length == 0){
        playSound(sndSrc[3],0.6);//hiding.mp3
        level++;
        asteroids_total+=2;
        ship.superCount = 180;
        makeAsteroid();
    }

    //console.log("radio:"+(ship.heading) % (2 * PI) + 
    //    ",angle:"+(ship.heading * 180 / PI) % 360);
    //console.log(ship.vel.length());
}

function draw(){

    for(var i = 0;i < bullet.length;i++){
        bullet[i].render();
    }

    for(var i = 0;i < asteroids.length;i++){
        asteroids[i].render();
    }

    ship.render();

    ctx.font="50px consolas";
    ctx.fillStyle = "#FFF";
    ctx.fillText(score,canvas.width/2,40);//draw score
    var hps = "";
    for(var i = 0;i < hp;i++){
        hps += "Δ";
    }
    ctx.fillText(hps,canvas.width/2,80);//draw hp
    ctx.fillText("Lv"+level,10,40)
}

function key(){
    //shoot
    if(keysDown[32]){        
        if(Timecount > pushTime){
            bullet.push(new Bullet(ship.pos,ship.heading));
            
            //sound
            playSound(shootSound[random(0,1)*random(0,1)],0.3);

            Timecount = 0;
        }
    }

    if(keysDown[38]){
        ship.boost();
        UpPress = true;
    }
    if(keysDown[37]){
        ship.setRotation(-0.1);
    }else if(keysDown[39]){
        ship.setRotation(0.1);
    }else{
        ship.setRotation(0);
    }
}

function getSize(size){
    console.log(size);
    if(size <= 30){
        return 0;
    }else if(size<=60){
        return 1;
    }else{
        return 2;
    }
}

function makeAsteroid(){
    for(var i=0;i < asteroids_total;i++){        
        asteroids.push(new Asteroid());
    }
}

function playSound(src,vol){
    var s = new Audio(src);
    s.volume = vol;
    s.play();
}

function drawTriangle(x1, y1, x2, y2, x3, y3){  
    //順時針畫clockwise
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);    
    ctx.closePath();    
}

function random(max,min){
	return Math.round(Math.random()*(max-min)+min);
}

function Ratio(v, n1, n2, m1, m2){
    if (v < n1 || v > n2) return 0;//V 不在n1~n2中
    var x = 0;
    x = (v * (m2 - m1) - n1 * m2 + n2 * m1) / (n2 - n1);
    return x;
}