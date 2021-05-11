/*
當前最大波數 : 8
這版本新增 : 
1.攻速隨等級調整
2.GameOver特效
3.Win特效
4.嘴砲文字
*/

var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var width, height;

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

var wineffDelay = 300;
var loseeffDelay = 400;
var effTimer = 0;

var gameover = 0; // 1:lose 2:win
var endSoundDelay = 8000;
var endSoundTimer = 0;

var slowDownTimer = 0;
var slowDownLength = 6000;

var statusX = 20;
var statusY = 40;

var mapSound = ["sound/slowdown.mp3", "sound/wavestart.mp3", "sound/back.mp3", "sound/lose.mp3", "sound/win.mp3"];
var backSound = new Audio(mapSound[2]);
var endSound = new Audio(mapSound[3]);

var ggText = ["G G !", "太 嫩 囉!", "F5 重 玩 ?", "太 難 了 ?", "笑 你 !", "哈 哈",
    "要加油囉!", "再練練吧!", "還不夠格!", "還早十年!", "就 憑 你?"];

main();

function main() {
    //設定主畫面資訊
    //canvas.width = window.innerWidth;
    //canvas.height = window.innerHeight;
    width = canvas.width = 600;
    height = canvas.height = 800;
    console.log(canvas.width, canvas.height);
    init();
}

function init() {
    // create player
    ship = new Ship(canvas.width / 2, canvas.height * 2 / 3);
    ship.keys[90] = true;

    console.log("Game Start");
    backSound.volume = 0.55;
    backSound.loop = true;
    backSound.play();
    gameloop();
}

function gameloop(timestamp) {
    Timesub = timestamp - lastTime;
    lastTime = timestamp;
    //----------------
    ctx.save();

    update();
    render();

    if (new Date().getTime() - endSoundTimer > endSoundDelay && gameover == 1) {
        endSound.volume = 0.40;
        endSound.play();
        endSoundTimer = new Date().getTime();
    }

    // 這裡待優化
    if (waveNum > 8) {
        let overSec = 2000;
        let alpha = Math.sin((timestamp % overSec) / overSec * Math.PI);
        drawString(ctx, "Mission\nCompleted", width / 2, height / 4, "rgba(255, 200, 36," + alpha + ")", 60, "Orbitron", 0, "center", 1);

        if (new Date().getTime() - effTimer > wineffDelay) {
            explosions.push(new Explosion2(random(width / 5, width * 4 / 5), random(height / 2, height * 4 / 5), 20, 60));
            effTimer = new Date().getTime();
        }
    } else if (ship.lives <= 0) {
        let overSec = 2000;
        let alpha = Math.sin((timestamp % overSec) / overSec * Math.PI);
        drawString(ctx, "Wave 8\nMisson Fail", width / 2, height / 4, "rgba(255, 50, 36," + alpha + ")", 60, "Orbitron", 0, "center", 1);

        if (new Date().getTime() - effTimer > loseeffDelay) {
            let textobj = new Text(random(width / 7, width * 6 / 7), random(height * 2 / 5, height * 6 / 7),
                ggText[random(0, ggText.length - 1)], 2000, 22);

            texts.push(textobj);
            effTimer = new Date().getTime();
        }
    }
    ctx.restore();
    //----------------
    frameCount = 1000 / Timesub;
    animation = requestAnimationFrame(gameloop);
}

function update() {
    //New wave
    if (waveStartTimer == 0 && enemies.length == 0) {
        waveNum++;
        waveStartTimer = new Date().getTime();
        //sound
        playSound(mapSound[1], 0.5);
    } else if ((new Date().getTime() - waveStartTimer) > waveDelay) {
        waveStartTimer = 0;
    }
    //cheak Win
    if (waveNum > 8) {
        gameover = 2;
        enemies.length = 0;
        waveStartTimer = new Date().getTime();
        ship.keys[90] = false;

        //backSound.pause();//終止背景音效
    }

    //轉場結束後出兵
    if (waveStartTimer == 0 && enemies.length == 0) {
        createNewWave(waveNum);
    }

    //update player
    ship.update();

    //update bullets
    for (var i = 0; i < bullets.length; i++) {
        bullets[i].update();
        if (bullets[i].outside) {
            bullets.splice(i, 1);
            i--;
        }
    }


    //update enemies
    for (var i = 0; i < enemies.length; i++) {
        enemies[i].update();
    }

    //update powerups
    for (var i = 0; i < powerups.length; i++) {
        powerups[i].update();
        if (powerups[i].outside) {
            powerups.splice(i, 1);
            i--;
        }
    }

    //update explosions
    for (var i = 0; i < explosions.length; i++) {
        explosions[i].update();
        if (explosions[i].dead) {
            explosions.splice(i, 1);
            i--;
        }
    }

    //update texts
    for (var i = 0; i < texts.length; i++) {
        texts[i].update();
        if (texts[i].dead) {
            texts.splice(i, 1);
            i--;
        }
    }

    //cheak bullet-enemy collision
    for (var i = 0; i < bullets.length; i++) {
        for (var j = 0; j < enemies.length; j++) {
            if (getDist(bullets[i], enemies[j])) {
                let ee = enemies[j];
                bullets.splice(i, 1);
                enemies[j].hit();
                i--;
                break;
            }
        }
    }

    //cheak player-enemy collision
    for (var i = 0; i < enemies.length; i++) {
        if (getDist(ship, enemies[i])) {
            ship.hit();
        }
    }

    //cheak player-powerup collision
    for (var i = 0; i < powerups.length; i++) {
        if (getDist(ship, powerups[i])) {
            getPowerUp(powerups[i].type);
            powerups.splice(i, 1);
            i--;
        }
    }

    //cheak player died
    if (ship.lives <= 0) {
        gameover = 1;
        enemies.length = 0;
        waveStartTimer = new Date().getTime();
        ship.keys[90] = false;

        backSound.pause();//終止背景音效
    }

    //cheak enemies dead
    for (var i = 0; i < enemies.length; i++) {
        if (enemies[i].dead) {
            var ee = enemies[i];
            var rand = Math.random();

            if (rand < 0.001)//0.1% 
                powerups.push(new PowerUp(1, ee.x, ee.y));
            else if (rand < 0.020)//2%
                powerups.push(new PowerUp(3, ee.x, ee.y));
            else if (rand < 0.120)//10%
                powerups.push(new PowerUp(2, ee.x, ee.y));
            else if (rand < 0.135)//1.5%
                powerups.push(new PowerUp(4, ee.x, ee.y));

            ship.score += ee.type * 10 + (ee.rank - 1) * 2;

            if (ExplosionState == 1)
                explosions.push(new Explosion1(ee.x, ee.y, ee.r, ee.r + 30));
            else if (ExplosionState == 2)
                explosions.push(new Explosion2(ee.x, ee.y, ee.r, ee.r + 15));
            ee.break();
            enemies.splice(i, 1);
            i--;
        }
    }

    //update slowDown
    if (slowDownTimer > 0 &&
        new Date().getTime() - slowDownTimer > slowDownLength) {
        slowDownTimer = 0;
        for (var i = 0; i < enemies.length; i++) {
            enemies[i].slow = false;
        }
    }

}

function render() {
    ctx.fillStyle = backcolor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    //-------------------------    
    let str_color = "rgba(255,255,255,0.7)"
    drawString(ctx, "FPS:" + frameCount.toFixed(13) + "", 0, 0, str_color, 11, 0, 0, 0, 0);//drawFps
    drawString(ctx, width + " x " + height, 0, 11, str_color, 11, 0, 0, 0, 0);

    drawString(ctx, "DPS: " + (1000 / ship.firingDelay).toFixed(3), 0, canvas.height - 80, str_color, 16, 0, 0, 0, 1);
    drawString(ctx, "Level: " + ship.powerCount, 0, canvas.height - 64, str_color, 16, 0, 0, 0, 1);
    drawString(ctx, "PowerLevel: " + ship.powerLevel, 0, canvas.height - 48, str_color, 16, 0, 0, 0, 1);
    drawString(ctx, "Bullet: " + bullets.length, 0, canvas.height - 32, str_color, 16, 0, 0, 0, 1);
    drawString(ctx, "Enemy: " + enemies.length, 0, canvas.height - 16, str_color, 16, 0, 0, 0, 1);
    drawString(ctx, "Explosion: " + ExplosionState, 0, canvas.height - 1, str_color, 16, 0, 0, 0, 1);

    //render slowDown screen
    if (slowDownTimer > 0) {
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    //render bullets
    for (var i = 0; i < bullets.length; i++) {
        bullets[i].render(ctx);
    }

    //render enemies
    for (var i = 0; i < enemies.length; i++) {
        enemies[i].render(ctx);
    }

    //render explosions
    for (var i = 0; i < explosions.length; i++) {
        explosions[i].render(ctx);
    }

    //render powerups
    for (var i = 0; i < powerups.length; i++) {
        powerups[i].render(ctx);
    }

    //render player
    ship.render(ctx);

    //render texts
    for (var i = 0; i < texts.length; i++) {
        texts[i].render(ctx);
    }




    //render wave
    if (waveStartTimer != 0) {
        var timeDiff = new Date().getTime() - waveStartTimer;
        var alpha = Math.sin(Math.PI * timeDiff / waveDelay); //0->1->0
        var str = "－ W A V E  " + waveNum + " －";
        var color = "rgba(255,255,255," + alpha + ")";
        var textSize = 36;
        var x = canvas.width / 2;
        var y = canvas.height / 4;
        drawString(ctx, str, x, y, color, textSize, "Orbitron", 0, "center");
    }


    //render player life
    for (var i = 0; i < ship.lives; i++) {
        var r = 10;
        var x = i * r * 2 * 1.5 + statusX + ship.r; //statusX = offset
        var y = 40;

        ctx.fillStyle = ship.colorArr[0][0];
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = ship.colorArr[0][1];
        ctx.beginPath();
        ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
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
    for (var i = 0; i < ship.getRequiredPower(); i++) {
        ctx.strokeRect(x + size * i, y, size, size);
    }

    //render slowDown meter
    if (slowDownTimer > 0) {
        var x = statusX;
        var y = 90;
        var w = 130;
        var h = 13;
        ctx.strokeStyle = "#FFF";
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "#FFF";
        ctx.fillRect(x, y, w - w * (new Date().getTime() - slowDownTimer) / slowDownLength, h);
    }

    //render player score
    var str = "Point : " + ship.score;
    var x = canvas.width * 5 / 7;
    var y = 40;
    var color = "#FFF";
    var textSize = 22;
    drawString(ctx, str, x, y, color, textSize, "Orbitron", 0, 0, 1);
}

//set enemy wave
function createNewWave(num) {
    if (num == 1) {
        for (var i = 0; i < 4; i++) {
            enemies.push(new Enemy(1, 1));
        }
    }
    if (num == 2) {
        for (var i = 0; i < 8; i++) {
            enemies.push(new Enemy(1, 1));
        }
        powerups.push(new PowerUp(2, random(width / 4, width * 3 / 4), 0));
    }
    if (num == 3) {
        for (var i = 0; i < 4; i++) {
            enemies.push(new Enemy(1, 1));
        }
        enemies.push(new Enemy(1, 2));
        enemies.push(new Enemy(1, 2));
        powerups.push(new PowerUp(2, random(width / 4, width * 3 / 4), 0));
    }
    if (num == 4) {
        for (var i = 0; i < 8; i++) {
            enemies.push(new Enemy(2, 1));
        }
        enemies.push(new Enemy(1, 3));
        enemies.push(new Enemy(1, 3));
        powerups.push(new PowerUp(2, random(width / 4, width * 3 / 4), 0));
    }
    if (num == 5) {
        enemies.push(new Enemy(1, 4));
        enemies.push(new Enemy(1, 2));
        enemies.push(new Enemy(2, 3));
    }
    if (num == 6) {
        for (var i = 0; i < 4; i++) {
            enemies.push(new Enemy(2, 1));
            enemies.push(new Enemy(3, 1));
        }
        enemies.push(new Enemy(1, 4));
        enemies.push(new Enemy(2, 3));
        enemies.push(new Enemy(2, 3));
    }
    if (num == 7) {
        powerups.push(new PowerUp(1, random(width / 4, width * 3 / 4), 0));
        enemies.push(new Enemy(1, 3));
        enemies.push(new Enemy(2, 3));
        enemies.push(new Enemy(2, 3));
        enemies.push(new Enemy(2, 4));
        enemies.push(new Enemy(3, 3));
    }
    if (num == 8) {
        enemies.push(new Enemy(1, 4));
        enemies.push(new Enemy(1, 3));
        enemies.push(new Enemy(2, 4));
        enemies.push(new Enemy(2, 3));
        enemies.push(new Enemy(3, 4));
    }

}

function getPowerUp(type) {
    var str;
    switch (type) {
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
            for (var i = 0; i < enemies.length; i++) {
                enemies[i].slow = true;
            }
            // sound
            playSound(mapSound[0], 0.5);
            str = "Slow Down"
            break;
    }
    texts.push(new Text(ship.x + ship.r, ship.y - ship.r, str, 2000));
}

function getDist(obj1, obj2) {
    var dx = obj1.x - obj2.x;
    var dy = obj1.y - obj2.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    return dist <= obj1.r + obj2.r;
}
//---------------------------------

document.addEventListener("keydown", function (e) {
    ship.keys[e.keyCode] = true;
}, false);

document.addEventListener("keyup", function (e) {
    delete ship.keys[e.keyCode];
}, false);

function drawTriangle(c, x1, y1, x2, y2, x3, y3) {
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.lineTo(x3, y3);
    c.closePath();
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function map(v, n1, n2, m1, m2) {
    if (v < n1 || v > n2) return 0;//V 不在n1~n2中
    var x = 0;
    x = (v * (m2 - m1) - n1 * m2 + n2 * m1) / (n2 - n1);
    return x;
}

function playSound(src, vol) {
    let sound = new Audio(src);
    sound.volume = vol;
    sound.play();
}
