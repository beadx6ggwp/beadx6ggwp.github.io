var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var lastTime = 0, Timesub = 0;
var animation;

var backcolor = "#2894FF";//#2894FF

var frameCount = 0;

var ship;
var bullets = [];
var enemies = [];
var powerups = [];
var explosions = [];
var texts = [];

var ExplosionState = 2;//switch explosion status

var waveNum = 0;
var waveDelay = 3000;//轉場動畫時間
var waveStartTimer = 0;

var slowDownTimer = 0;
var slowDownLength = 6000;

var statusX = 40;
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
    ship = new Ship(canvas.width/2, canvas.height*2/3);

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
    
    //轉場結束後出兵
    if(waveStartTimer == 0 && enemies.length == 0){
        createNewWave(waveNum);
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

    //update explosions
    for(var i = 0;i < explosions.length;i++){
        explosions[i].update();
        if(explosions[i].dead){
            explosions.splice(i,1);
            i--;
        }
    }

    //update texts
    for(var i = 0;i < texts.length;i++){
        texts[i].update();
        if(texts[i].dead){
            texts.splice(i,1);
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
            else if(rand < 0.120)//10%
                powerups.push(new PowerUp(2, ee.x, ee.y));
            else if(rand < 0.130)//1%
                powerups.push(new PowerUp(4, ee.x, ee.y));

            ship.score += ee.type*10 + (ee.rank-1)*2;

            if(ExplosionState == 1)
                explosions.push(new Explosion1(ee.x, ee.y, ee.r, ee.r + 30));
            else if(ExplosionState == 2)
                explosions.push(new Explosion2(ee.x, ee.y, ee.r, ee.r + 15));
            ee.break();
            enemies.splice(i,1);
            i--;
        }
    }

    //update slowDown
    if(slowDownTimer > 0 &&
       new Date().getTime() - slowDownTimer > slowDownLength){
        slowDownTimer = 0;
        for(var i = 0;i < enemies.length;i++){
            enemies[i].slow = false;
        }
    }

}

function render(){
    ctx.fillStyle = backcolor;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    //-------------------------    
    drawString(ctx,"FPS:"+frameCount.toFixed(13)+"",0,canvas.height-60,"#FFF",0,0,0,0,1);//drawFps
    drawString(ctx,"bullet:"+bullets.length,0,canvas.height-40,"#FFF",0,0,0,0,1);
    drawString(ctx,"enemy:"+enemies.length,0,canvas.height-20,"#FFF",0,0,0,0,1);
    drawString(ctx,"explosion:"+ExplosionState,0,canvas.height-2,"#FFF",0,0,0,0,1);    

    //render slowDown screen
    if(slowDownTimer > 0){
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.fillRect(0,0,canvas.width,canvas.height);
    }

    //render bullets
    for(var i = 0;i < bullets.length;i++){
        bullets[i].render(ctx);
    }

    //render enemies
    for(var i = 0;i < enemies.length;i++){
        enemies[i].render(ctx);
    }

    //render explosions
    for(var i = 0;i < explosions.length;i++){
        explosions[i].render(ctx);
    }

    //render powerups
    for(var i = 0;i < powerups.length;i++){
        powerups[i].render(ctx);
    }

    //render player
    ship.render(ctx);

    //render texts
    for(var i = 0;i < texts.length;i++){
        texts[i].render(ctx);
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
        var r = 10;
        var x = i * r*2 * 1.5 + statusX + ship.r; //statusX = offset
        var y = 40;

        ctx.fillStyle = ship.colorArr[0][0];
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = ship.colorArr[0][1];
        ctx.beginPath();
        ctx.arc(x, y, r * 0.55, 0, Math.PI*2);
        ctx.fill();
    }

    //render player power
    var x = statusX;
    var y = 60;
    var size = 17;
    ctx.fillStyle = "#FF0";
    ctx.fillRect(x, y, ship.power * size, size);
    ctx.strokeStyle = "rgba(255, 217, 0, 0.7)";
    ctx.lineWidth = 3;
    for(var i = 0;i < ship.getRequiredPower();i++){
        ctx.strokeRect(x + size * i,y,size,size);
    }
    
    //render slowDown meter
    if(slowDownTimer > 0){
        var x = statusX;
        var y = 90;
        var w = 130;
        var h = 13;
        ctx.strokeStyle = "#FFF";
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "#FFF";
        ctx.fillRect(x, y, w - w*(new Date().getTime() - slowDownTimer)/slowDownLength, h);
    }

    //render player score
    var str = "Point : "+ship.score;
    var x = canvas.width * 5/7;
    var y = 40;
    var color = "#FFF";
    var textSize = 22;
    drawString(ctx, str, x, y, color, textSize, "Orbitron", 0, 0, 1);    
}

//set enemy wave
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
            enemies.push(new Enemy(1,1));
        }
        enemies.push(new Enemy(1,2));
        enemies.push(new Enemy(1,2));
    }
    if(num == 4){
        for(var i = 0;i < 8;i++){
            enemies.push(new Enemy(2,1));
        }
        enemies.push(new Enemy(1,3));
        enemies.push(new Enemy(1,3));
    }
    if(num == 5){
        enemies.push(new Enemy(1,4));        
        enemies.push(new Enemy(1,3));
        enemies.push(new Enemy(2,3));
    }
    if(num == 6){
        for(var i = 0;i < 4;i++){
            enemies.push(new Enemy(2,1));
            enemies.push(new Enemy(3,1));
        }
        enemies.push(new Enemy(1,3));
    }
    if(num == 7){        
        enemies.push(new Enemy(1,3));
        enemies.push(new Enemy(2,3));
        enemies.push(new Enemy(2,3));
        enemies.push(new Enemy(3,3));
    }
    if(num == 8){
        enemies.push(new Enemy(1,4));
        enemies.push(new Enemy(1,3));
        enemies.push(new Enemy(2,4));
        enemies.push(new Enemy(2,3));
        enemies.push(new Enemy(3,4));
    }

}

function getPowerUp(type){
    var str;
    switch(type){
        case 1:
            ship.lives++;
            str = "Extra Life";
            break;
        case 2:
            ship.increasePower(1);
            str = "PowerUp"
            break;
        case 3:
            ship.increasePower(2);
            str = "Double PowerUp";
            break;
        case 4:
            slowDownTimer = new Date().getTime();
            for(var i = 0;i < enemies.length;i++){
                enemies[i].slow = true;
            }
            str = "Slow Down"
            break;
    }
    texts.push(new Text(ship.x + ship.r, ship.y - ship.r, str, 2000));
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

function map(v, n1, n2, m1, m2){
    if (v < n1 || v > n2) return 0;//V 不在n1~n2中
    var x = 0;
    x = (v * (m2 - m1) - n1 * m2 + n2 * m1) / (n2 - n1);
    return x;
}
