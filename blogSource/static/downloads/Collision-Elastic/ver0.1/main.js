var ctx,
    width,
    height;
var animation,
    lastTime = 0,
    Timesub = 0,
    DeltaTime = 0,
    loop = true;
var ctx_font = "Consolas",
    ctx_fontsize = 10,
    ctx_backColor = "#222";

var keys = {}, mousePos = {};

window.onload = function () {
    ctx = CreateDisplay("myCanvas", 800, 600);
    width = ctx.canvas.width; height = ctx.canvas.height;


    document.addEventListener("keydown", keydown, false);
    document.addEventListener("keyup", keyup, false);
    document.addEventListener("mousedown", mousedown, false);
    document.addEventListener("mouseup", mouseup, false);
    document.addEventListener("mousemove", mousemove, false);

    main();

}

// ----------------------------------------------------------
var particles = new Particles();
var num = 10;
var radius = 10;
var force = 10;
var maxMass = 5;

function main() {
    console.log("Start");


    for (var i = 0; i < num; i++) {
        let obj = new Particle(random(radius, width - radius), random(radius, height - radius), radius, randomColor());
        obj.mass = randomInt(1, maxMass);
        obj.vel.setLength(force / obj.mass);
        obj.vel.setAngle(Math.random() * Math.PI * 2);
        obj.r *= obj.mass;
        particles.list.push(obj);
    }
    /*
    let obj = new Particle(100, 200, radius, randomColor());
    obj.mass = 8;
    obj.vel.setLength(force / obj.mass);
    obj.vel.setAngle(0);
    obj.r *= obj.mass;
    particles.list.push(obj);

    obj = new Particle(300, 200, radius, randomColor());
    obj.mass = 10;
    obj.vel.setLength(force / obj.mass);
    obj.vel.setAngle(Math.PI);
    obj.r *= obj.mass;
    particles.list.push(obj);
    */
    window.requestAnimationFrame(mainLoop);
    //mainLoop();
}
var colors = [
    "#2185C5",
    "#7ECEFD",
    "#FFF6E5",
    "#FF7F66"
];
function randomColor() {
    return colors[randomInt(0, colors.length)];
}


function update(dt) {
    particles.update(dt);
}

function draw(ctx) {
    particles.draw(ctx);
}

function mainLoop(timestamp) {
    Timesub = timestamp - lastTime;// get sleep
    DeltaTime = Timesub / 1000;
    lastTime = timestamp;
    //Clear
    ctx.fillStyle = ctx_backColor;
    ctx.fillRect(0, 0, width, height);
    //--------Begin-----------

    update(DeltaTime);
    draw(ctx);

    //--------End---------------
    let str1 = "Fps: " + 1000 / Timesub, str2 = "Timesub: " + Timesub, str3 = "DeltaTime: " + DeltaTime;
    drawString(ctx, str1 + "\n" + str2 + "\n" + str3,
        0, height - 31,
        "#FFF", 10, "consolas",
        0, 0, 0);
    if (loop) {
        animation = window.requestAnimationFrame(mainLoop);
    } else {
        // over
    }
}
//---evnt---
function keydown(e) {
    keys[e.keyCode] = true;
}

function keyup(e) {
    delete keys[e.keyCode];
}

function mousedown(e) {

}

function mouseup(e) {

}

function mousemove(e) {
    mousePos.x = e.clientX - ctx.canvas.offsetLeft
    mousePos.y = e.clientY - ctx.canvas.offsetTop;

}

//----tool-------
function toRadio(angle) {
    return angle * Math.PI / 180;
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
function random(min, max) {
    return Math.random() * (max - min) + min;
}

//---------------------
function CreateDisplay(id, width, height) {
    let canvas = document.createElement("canvas");
    canvas.id = id;
    canvas.width = width;
    canvas.height = height;
    canvas.style.cssText = [
        "display: block;",
        "margin: 0 auto;",
        "background: #FFF;",
        "border:1px solid #000;"
    ].join("");
    document.body.appendChild(canvas);

    return canvas.getContext("2d");
}