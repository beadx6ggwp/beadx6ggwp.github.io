
function SpriteSheet(imgData, frameWidth, frameHeight) {
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;

    if (typeof imgData === "string") {
        // pass src path
        let self_ = this;
        this.image.onload = function (e) {
            self_.framesPerRow = Math.floor(self_.image.width / self_.frameWidth);
            console.log("onload:" + imgPath);
        };
        this.image.src = imgData;
    } else {
        // pass by image object
        this.image = imgData;
        // calculate the number of frames in a row after the image loads
        this.framesPerRow = Math.floor(this.image.width / this.frameWidth);
    }

}
function Animation(spriteSheet, frameSpeedPerSecond, seqStr, repeat = true) {
    this.spriteSheet = spriteSheet;

    this.lastAnimationSequence = [];
    this.animationSequence = [];
    this.currentFrame = 0;

    this.lastTime = new Date().getTime();
    this.accumulator = 0;// ms
    this.setSpeed(frameSpeedPerSecond);

    this.finish = false;
    this.repeat = repeat;

    this.setStartEnd(seqStr);
}
Animation.prototype.setSpeed = function (frameSpeedPerSecond) {
    this.frameSleep = frameSpeedPerSecond == 0 ? 0 : 1000 / frameSpeedPerSecond;
}
Animation.prototype.setStartEnd = function (seqStr) {
    this.lastAnimationSequence = this.animationSequence;
    // '0-9'
    if (seqStr.indexOf('-') != -1) {
        this.animationSequence = [];
        let numarr = seqStr.split('-');
        let startFrame = Number(numarr[0]);
        let endFrame = Number(numarr[1]);
        for (let index = startFrame; index <= endFrame; index++) {
            this.animationSequence.push(index);
        }
    } else {
        // '1,2,3,4,5,6'
        this.animationSequence = seqStr.split(',');
    }

    // 當set seqStr時，currentFrame的處理方法，通常用在切換動作

    // 走路是'3,4,5,6,5,4,3,2,1,0,1,2'
    // 站者是'3'
    // 如果走路到一半(currentFrame = 6)，突然切成站者，會導致list out of range變成underfind
    // this.currentFrame = (this.currentFrame) % this.animationSequence.length;

    // 目前認為較好的解法，檢查當動畫序列不同的時候，reset currentFrame
    if (!arrayEqual(this.lastAnimationSequence, this.animationSequence)) {
        // console.log(this.lastAnimationSequence, this.animationSequence)
        // console.log("Change action")
        this.currentFrame = 0
    }

    // 待解決問題:如果是同樣的動畫序列，想直接重頭播放呢?
    // 1. new新的animation
    // 2. 設定為不循環
}
/*
let timeDiff = new Date().getTime() - this.lastTime;
this.lastTime = new Date().getTime() - (timeDiff - this.frameSleep)
以coin的Animation speed 15來看，不加上這行對準每次計時個開始，會導致有偏差
|----------|----------|----------|----------|      game.update
|---------------|----------------------|-----      anime.update
                [diff]                 [diff]
但離開視窗後再回來，因為基準是Date.Now()，所以會導致快速刷新
所以換成以dt為底做更新，用accumulator處理偏差，再用dt對齊遊戲主循環的時間，解決暫停後的補幀問題
*/
Animation.prototype.update = function (dt) {
    if (this.frameSleep == 0) return;

    this.accumulator += dt * 1000;
    while (!this.finish && this.accumulator > this.frameSleep) {
        if (this.currentFrame + 1 >= this.animationSequence.length && !this.repeat) {
            this.finish = true;
            break;
        }
        this.currentFrame = (this.currentFrame + 1) % this.animationSequence.length;
        this.accumulator -= this.frameSleep;
    }
}

Animation.prototype.draw = function (ctx, x, y, width, height) {
    if (this.finish) return;
    let index = this.animationSequence[this.currentFrame];
    // console.log(index)
    let framesPerRow = this.spriteSheet.framesPerRow;

    let col = Math.floor(index % framesPerRow);
    let row = Math.floor(index / framesPerRow);

    let sw = this.spriteSheet.frameWidth,
        sh = this.spriteSheet.frameHeight;
    let sx = col * sw,
        sy = row * sh;

    let dw = width ? width : sw,
        dh = height ? height : sh;
    ctx.drawImage(
        this.spriteSheet.image,
        sx, sy, sw, sh,
        x, y, dw, dh
    );
}


function arrayEqual(arr1, arr2) {
    if (!arr1 || !arr2)
        return false;

    if (arr1.length != arr2.length)
        return false;

    for (var i = 0; i < arr1.length; i++) {
        if (arr1[i] != arr2[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}