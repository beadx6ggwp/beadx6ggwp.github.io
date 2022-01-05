var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var widht, height;

var lastTime = 0, Timesub = 0, frameCount = 0;

var symbolSize = 20;
var streams = [];

main();

function main() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    //console.log(String.fromCharCode(0x1F3A4));
    createStream();

    loop();
}

function loop(timestamp) {
    frameCount = Math.floor(timestamp);
    Timesub = timestamp - lastTime;
    lastTime = timestamp;
    //------------------------------------
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < streams.length; i++) {
        streams[i].move();
    }

    //-----------------------------------
    requestAnimationFrame(loop);
}

function createStream() {
    var col = width / symbolSize;
    var x = 0; y = 0;
    for (var i = 0; i < col; i++) {
        var stream = new Stream();
        stream.generateSymbols(x, random(-2000, 0));
        streams.push(stream);
        x += symbolSize;
    }
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
function getNow() {
    return new Date().getTime();
}

//-----obj--------------------------
function Symbol(x, y, speed, first, opacity) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.value;
    this.switchDelay = random(50, 1000);// ms
    this.switchStart = 0;
    this.first = first;
    this.opacity = opacity;

    this.setRandomSymbol = function () {
        // 0x標記為HEX
        if (getNow() - this.switchStart > this.switchDelay) {
            this.value = String.fromCharCode(0x30A0 + random(0, 96));
            this.switchStart = getNow();
        }
    }
    this.update = function () {
        this.y += this.speed;
        if (this.y > height) this.y = 0;
        this.setRandomSymbol();
    }
    this.render = function () {
        ctx.save();
        ctx.font = symbolSize + "px audiowide";
        ctx.fillStyle = this.first ? "rgba(160,255,180," + this.opacity + ")" : "rgba(0,255,90," + this.opacity + ")";
        ctx.fillText(this.value, this.x, this.y);
        ctx.restore();
    }
}

function Stream() {
    this.symbols = [];
    this.totalSymbols = random(5, 15);
    this.speed = random(2, 10);

    this.generateSymbols = function (x, y) {
        var first = random(0, 3) == 0;
        var opacity = 1;
        for (var i = 0; i < this.totalSymbols; i++) {
            var symbol = new Symbol(x, y, this.speed, first, opacity);
            symbol.setRandomSymbol();
            this.symbols.push(symbol);

            opacity = 1 - (i / (this.totalSymbols + 1));
            y -= symbolSize;
            first = false;
        }
    }

    this.move = function () {
        for (var i = 0; i < this.totalSymbols; i++) {
            this.symbols[i].update();
            this.symbols[i].render();;
        }
    }
}