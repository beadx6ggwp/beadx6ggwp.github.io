// Class 7 Auto Wave
var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');
var width = canvas.width;
var height = canvas.height;

var player;//玩家
var bullet = [];
var enemies = [];

var wavenum = 0;
var waveStartTime = 0; // >0 代表開始動畫
var waveDelay = 2000;

var HpImg = new Image();
HpImg.src = "img/hp.png";
var ImgMode = 1;



main();

function main() {
    //load
    console.log("Start");
    player = new Player(width/2, height*3/4, 20);
    loop();
}

function loop() {
    update();
    render();
    
    if(player.hp == 0){
        drawString(ctx, "Game Over", width/2, height/3, "#F97", 60, "Consolas", 0, "center", 0);
        return;
    }

    requestAnimationFrame(loop);//16ms 60FPS
}

function update() {
    /*
    <<流程>>
    
    >當現在沒有敵人時，使StartTime設為現在時間，表示從現在開始計時
     如果時間差距超過預期的延遲時間，則產生新的敵人，並重製StartTime

    >逐一更新玩家、子彈、敵人的狀態

    >進行子彈與敵人的碰撞檢測

    >檢查是否有物件需要移除
    */

    //update wave
    if (waveStartTime == 0 && enemies.length == 0) {
        wavenum++;
        waveStartTime = getNow();
    } else if (getNow() - waveStartTime > waveDelay) {
        waveStartTime = 0;
    }

    if (waveStartTime == 0 && enemies.length == 0) {
        for (var i = 0; i < 3+wavenum*2; i++) {
            enemies.push(new Enemy());
        }
    }


    // move
    player.update();

    for (var i = 0; i < bullet.length; i++) {
        bullet[i].update();
    }

    for (var i = 0; i < enemies.length; i++) {
        enemies[i].update();
    }

    // cheak bullet -> enemy
    for (let i = 0; i < bullet.length; i++) {
        for (let j = 0; j < enemies.length; j++) {
            if (getDist(bullet[i], enemies[j])) {
                // -hp
                enemies[j].hit(1);
                bullet.splice(i, 1);
                i--;
                break;
            }
        }
    }

    //cheak enemy -> player
    for (var i = 0; i < enemies.length; i++) {
        if (getDist(player, enemies[i])) {
            player.hit(1);
        }
    }


    // cheak enemy dead
    for (let i = 0; i < enemies.length; i++) {
        if (enemies[i].dead) {
            player.score += 2;

            enemies.splice(i, 1);
            i--;
            break;
        }
    }
}

function render() {
    ctx.fillStyle = "#444";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Clear Background

    // player
    player.render(ImgMode);

    // bullet
    for (var i = 0; i < bullet.length; i++) {
        bullet[i].render(ImgMode);
    }

    // enemies
    for (var i = 0; i < enemies.length; i++) {
        enemies[i].render(ImgMode);
    }

    // wave
    if (waveStartTime > 0) {
        var x = width / 2;
        var y = height / 4;
        var timeDiff = getNow() - waveStartTime;
        var alpha = Math.sin(Math.PI * timeDiff / waveDelay);// 0->1->0
        var color = "rgba(255,255,255," + alpha + ")";
        var str = "－W A V E " + wavenum + " －";
        var font = "Consolas";
        var textSize = 40;

        /*
        ctx.font = textSize + "px " + font;
        ctx.textAlign = "center";
        ctx.fillStyle = color;
        ctx.fillText(str, x, y);
        */
        drawString(ctx, str, x, y, color, textSize, font, 0, "center", 0);
    }

    // player hp
    for (var i = 0; i < player.hp; i++) {
        var r = 10;
        var offset = 20
        var x = i * r * 2 * 1.5 + offset + r; //statusX = offset
        var y = 20;

        switch (ImgMode) {
            case 0:
                ctx.fillStyle = "#F77";
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 1:
                ctx.drawImage(HpImg, x - r, y - r, r * 2, r * 2);
                break;
        }
    }

    //score
    var str = "Point : " + player.score;
    var x = canvas.width * 7 / 9;
    var y = 40;
    var color = "#FFF";
    var textSize = 22;
    drawString(ctx, str, x, y, color, textSize, "Consolas", 0, 0, 1);


}

// ---------------Tool Fuction----------------------

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);// min<=value<=max
}

function getDist(obj1, obj2) {
    let dx = obj1.x - obj2.x;
    let dy = obj1.y - obj2.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    return dist <= obj1.r + obj2.r;
}

function getNow() {
    return new Date().getTime();
}

// ---------------------Event---------------------
document.addEventListener("keydown", keydown, false);//註冊按下鍵盤
document.addEventListener("keyup", keyup, false);//註冊放開鍵盤
function keydown(e) {
    //console.log(e.keyCode);
    if (e.keyCode == 38) player.dir[0] = 1;
    if (e.keyCode == 40) player.dir[1] = 1;
    if (e.keyCode == 37) player.dir[2] = 1;
    if (e.keyCode == 39) player.dir[3] = 1;
    if (e.keyCode == 32) player.shoot = 1;
}
function keyup(e) {
    if (e.keyCode == 38) player.dir[0] = 0;
    if (e.keyCode == 40) player.dir[1] = 0;
    if (e.keyCode == 37) player.dir[2] = 0;
    if (e.keyCode == 39) player.dir[3] = 0;
    if (e.keyCode == 32) player.shoot = 0;
}

// ------------------Object---------------------

function Player(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.sp = 5;

    this.color = "#FFF";

    this.hp = 3;
    this.covering = false;
    this.coverTimer = 0;
    this.coverDelay = 2000;

    this.lastshoot = 0;
    this.delay = 200;

    this.dir = [0, 0, 0, 0];//上下左右
    this.shoot = 0;

    this.score = 0;

    this.Img = new Image();
    this.Img.src = "img/ship.png";

    this.hit = function (dmg) {
        if (this.covering) return;
        this.hp = Math.max(this.hp - dmg, 0);
        this.covering = true;
        this.color = "#F77";
        this.coverTimer = getNow();
    }

    this.update = function () {
        if (this.dir[0] == 1) this.y -= this.sp;
        if (this.dir[1] == 1) this.y += this.sp;
        if (this.dir[2] == 1) this.x -= this.sp;
        if (this.dir[3] == 1) this.x += this.sp;

        if (this.x < this.r) this.x = this.r;
        if (this.y < this.r) this.y = this.r;
        if (this.x > width - this.r) this.x = width - this.r;
        if (this.y > height - this.r) this.y = height - this.r;

        if (this.shoot == 1 && (getNow() - this.lastshoot) > this.delay) {
            bullet.push(new Bullet(this.x, this.y, 270));
            this.lastshoot = getNow();
        }

        // cover
        if (this.covering == true && (getNow() - this.coverTimer) > this.coverDelay) {
            this.covering = false;
            this.coverTimer = 0;
            this.color = "#FFF";
        }
    }
    this.render = function (mode) {
        switch (mode) {
            case 0:
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 1:
                ctx.drawImage(this.Img, this.x - this.r, this.y - this.r, this.r * 2, this.r * 2);
                break;
        }
    }

}


function Bullet(x, y, angle) {
    this.x = x;
    this.y = y;
    this.r = 5;
    this.sp = 10;
    this.vx = Math.cos(angle * Math.PI / 180) * this.sp;
    this.vy = Math.sin(angle * Math.PI / 180) * this.sp;

    this.Img = new Image();
    this.Img.src = "img/bullet.png";


    this.update = function () {
        this.x += this.vx;
        this.y += this.vy;
    }
    this.render = function (mode) {
        switch (mode) {
            case 0:
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                ctx.fillStyle = "#FFF";
                ctx.fill();
                break;
            case 1:
                let offy = 20;
                ctx.drawImage(this.Img, this.x - this.r, this.y - this.r - offy, this.r * 2, this.r * 2 + offy);
                break;
        }
    }
}

function Enemy() {
    this.r = 15;
    this.x = random(width * 1 / 4, width * 3 / 4);
    this.y = -this.r;

    this.hp = 1;
    this.dead = 0;

    this.sp = 2;
    this.rad = random(20, 160) * Math.PI / 180;
    this.vx = Math.cos(this.rad) * this.sp;
    this.vy = Math.sin(this.rad) * this.sp;

    this.Img = new Image();
    this.Img.src = "img/enemy.png";

    this.update = function () {
        this.x += this.vx;
        this.y += this.vy;
        // 反彈防卡邊
        if (this.x < this.r && this.vx < 0) this.vx = -this.vx;
        if (this.y < this.r && this.vy < 0) this.vy = -this.vy;
        if (this.x > width - this.r && this.vx > 0) this.vx = -this.vx;
        if (this.y > height - this.r && this.vy > 0) this.vy = -this.vy;
    }
    this.render = function (mode) {
        switch (mode) {
            case 0:
                ctx.fillStyle = "#FF0";
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 1:
                ctx.drawImage(this.Img, this.x - this.r, this.y - this.r, this.r * 2, this.r * 2);
                break;
        }
    }

    this.hit = function (dmg) {
        this.hp = Math.max(this.hp - dmg, 0);

        if (this.hp <= 0)
            this.dead = 1;
    }
}