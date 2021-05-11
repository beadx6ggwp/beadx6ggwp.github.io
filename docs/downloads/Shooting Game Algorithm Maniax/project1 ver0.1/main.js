var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var lastTime = 0, Timesub = 0;
var animation;

var backcolor = "#2894FF";

var frameCount = 0;

var ship;
var bullets = [];
var enemies = [];
var powerups = [];

var waveNum = 0;
var waveDelay = 2500;
var waveStartTimer = 0;

var statusX = 20;
var statusY = 40;

main();

function main(){
    //設定主畫面資訊
    //canvas.width = window.innerWidth;
    //canvas.height = window.innerHeight;
    canvas.width = 600;
    canvas.height = 800;
    console.log(canvas.width,canvas.height);
    init();
}

function init(){
    // create player
    ship = new Ship(canvas.width/2, canvas.height/2);
    testUp = new PowerUp(1,100,50);
    console.log(ship);
    gameloop();
}

function gameloop(timestamp){
    Timesub = timestamp - lastTime;
    lastTime = timestamp;
    //----------------
    ctx.save();

    update();
    render();

    ctx.restore();
    //----------------
    frameCount = 1000/Timesub;
    animation = requestAnimationFrame(gameloop);
}

function update(){
    //New wave
    if(waveStartTimer == 0 && enemies.length == 0){
        waveNum++;
        waveStartTimer = new Date().getTime();
    }else if((new Date().getTime() - waveStartTimer) > waveDelay){
        waveStartTimer = 0;
    }

    //update player
    ship.update();

    //update bullets
    for(var i = 0;i < bullets.length;i++){
        bullets[i].update();
        if(bullets[i].outside){
            bullets.splice(i,1);
            i--;
        }
    }

    //create enemy
    if(waveStartTimer == 0 && enemies.length == 0){
        createNewWave(waveNum);
    }

    //update enemies
    for(var i = 0;i < enemies.length;i++){
        enemies[i].update();
    }

    //update powerups
    for(var i = 0;i < powerups.length;i++){
        powerups[i].update();
        if(powerups[i].outside){
            powerups.splice(i,1);
            i--;
        }
    }

    //cheak bullet-enemy collision
    for(var i = 0; i < bullets.length;i++){
        for(var j = 0; j < enemies.length;j++){
            if( getDist(bullets[i], enemies[j]) ){                
                bullets.splice(i,1);
                enemies[j].hit();
                i--;
                break;
            }
        }
    }

    //cheak player-enemy collision
    for(var i = 0;i < enemies.length;i++){
        if( getDist(ship,enemies[i]) ){
            ship.hit();
        }
    }

    //cheak player-powerup collision
    for(var i = 0;i < powerups.length;i++){
        if( getDist(ship,powerups[i]) ){
            getPowerUp(powerups[i].type);
            powerups.splice(i,1);
            i--;
        }
    }

    //cheak enemies dead
    for(var i = 0;i < enemies.length;i++){
        if(enemies[i].dead){
            var ee = enemies[i];
            var rand = Math.random();

            if(rand < 0.001)//0.1% 
                powerups.push(new PowerUp(1, ee.x, ee.y));
            else if(rand < 0.020)//2%
                powerups.push(new PowerUp(3, ee.x, ee.y));
            else if(rand < 0.170)//15%
                powerups.push(new PowerUp(2, ee.x, ee.y));

            ship.score += ee.type*10 + ee.rank;

            enemies.splice(i,1);
            i--;
        }
    }
}

function render(){
    ctx.fillStyle = backcolor;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    //-------------------------    
    drawString(ctx,"FPS:"+frameCount.toFixed(13)+"",0,canvas.height-40,"#FFF",0,0,0,0,1);//drawFps
    drawString(ctx,"bullet num:"+bullets.length,0,canvas.height-20,"#FFF",0,0,0,0,1);
    drawString(ctx,"enemy num:"+enemies.length,0,canvas.height,"#FFF",0,0,0,0,1);
    
    //render player
    ship.render(ctx);

    //render bullets
    for(var i = 0;i < bullets.length;i++){
        bullets[i].render(ctx);
    }

    //render enemies
    for(var i = 0;i < enemies.length;i++){
        enemies[i].render(ctx);
    }

    //render powerups
    for(var i = 0;i < powerups.length;i++){
        powerups[i].render(ctx);
    }

    //render wave
    if(waveStartTimer != 0){
        var timeDiff = new Date().getTime() - waveStartTimer;
        var alpha = Math.sin(Math.PI * timeDiff / waveDelay); //0->1->0
        var str = "－ W A V E  " + waveNum + " －";
        var color = "rgba(255,255,255," + alpha + ")";
        var textSize = 36;
        var x = canvas.width/2;
        var y = canvas.height/4;
        drawString(ctx, str, x, y, color, textSize, "Orbitron",0,"center");
    }    

    //render player life
    for(var i = 0; i < ship.lives;i++){
        var x = i * ship.r*2 * 1.5 + statusX + ship.r; //statusX = offset
        var y = statusY;

        ctx.fillStyle = ship.colorArr[0][0];
        ctx.beginPath();
        ctx.arc(x, y, ship.r, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = ship.colorArr[0][1];
        ctx.beginPath();
        ctx.arc(x, y, ship.r * 0.55, 0, Math.PI*2);
        ctx.fill();
    }

    //render player power
    var x = statusX;
    var y = statusY*2;
    var size = 15;
    ctx.fillStyle = "#FF0";
    ctx.fillRect(x, y, ship.power * size, size);
    ctx.strokeStyle = "rgba(255, 217, 0, 0.7)";
    ctx.lineWidth = 3;
    for(var i = 0;i < ship.getRequiredPower();i++){
        ctx.strokeRect(x + size * i,y,size,size);
    }


    //render player score
    var str = "Point : "+ship.score;
    var x = canvas.width * 5/7;
    var y = statusY;
    var color = "#FFF";
    var textSize = 22;
    drawString(ctx, str, x, y, color, textSize, "Orbitron", 0, 0, 1);    
}

function createNewWave(num){
    if(num == 1){
        for(var i = 0;i < 4;i++){
            enemies.push(new Enemy(1,1));
        }
    }
    if(num == 2){
        for(var i = 0;i < 8;i++){
            enemies.push(new Enemy(1,1));
        }
    }
    if(num == 3){
        for(var i = 0;i < 4;i++){
            enemies.push(new Enemy(2,1));
        }
        for(var i = 0;i < 4;i++){
            enemies.push(new Enemy(3,1));
        }
    }
}

function getPowerUp(type){
    switch(type){
        case 1:
            ship.gainLife();
            break;
        case 2:
            ship.increasePower(1);
            break;
        case 3:
            ship.increasePower(2);
            break;
    }
}

function getDist(obj1,obj2){
    var dx = obj1.x - obj2.x;
    var dy = obj1.y - obj2.y;
    var dist = Math.sqrt(dx*dx + dy*dy);
    return dist <= obj1.r + obj2.r;
}
//---------------------------------

document.addEventListener("keydown",function(e){
    ship.keys[e.keyCode] = true;
},false);

document.addEventListener("keyup",function(e){
    delete ship.keys[e.keyCode];    
},false);

function drawTriangle(c,x1,y1,x2,y2,x3,y3){
    c.beginPath();
    c.moveTo(x1,y1);
    c.lineTo(x2,y2);
    c.lineTo(x3,y3);
    c.closePath();
}

function random(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}
