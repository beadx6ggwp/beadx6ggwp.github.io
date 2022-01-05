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
var keys = {}, mousePos = new Point(0, 0), isDown = false;

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

var containers = [];
var rects = [];

var dragRect, offSet = new Point(0, 0);

function main() {
    console.log("Start");
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            containers.push(new Container(new Rect(50 + c * 120, 10 + r * 120, 100, 100), 2));

        }
    }
    for (let i = 0; i < 9; i++) {
        rects.push(new Rect(randomInt(40, width - 40), randomInt(40, height - 40), 80, 80));
    }

    window.requestAnimationFrame(mainLoop);
    //mainLoop();
}


function update(dt) {

}

function draw(ctx) {


    if (dragRect) {
        let container = findMinDist(dragRect);
        if (container.rect.intersects(dragRect))
            container.rect.show(ctx, "rgba(255,153,51,0.7)", true);
    }

    for (let i = 0; i < containers.length; i++) {
        let c = containers[i];
        c.rect.show(ctx, "#FFF", false);

        let obj = c.rect.pos;
        drawString(ctx, i + "",
            obj.x, obj.y,
            "#FFF", 12, "consolas");
    }
    for (let i = 0; i < rects.length; i++) {
        let r = rects[i];
        r.show(ctx, "#FF0", true);

        let obj = r.getCenter();
        drawString(ctx, i + "",
            obj.x, obj.y,
            "#000", 12, "consolas");
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
    isDown = true;

    dragRect = null;
    for (let r of rects) {
        if (r.constains(mousePos)) {
            dragRect = r;
            break;
        }
    }
    if (dragRect) {
        offSet.x = mousePos.x - dragRect.pos.x;
        offSet.y = mousePos.y - dragRect.pos.y;
    }
}

function mouseup(e) {
    isDown = false;

    if (dragRect) {
        let container = findMinDist(dragRect);
        console.log(container);

        if (container.rect.intersects(dragRect)) {
            console.log("撞到");
            let center = container.rect.getCenter();
            dragRect.pos.x = center.x - dragRect.w / 2;
            dragRect.pos.y = center.y - dragRect.h / 2;

            // 先移除再加入
            for (let c of containers) {
                let findIndex = c.objs.indexOf(dragRect);
                if (findIndex != -1) {
                    c.objs.splice(findIndex, 1);
                }
            }
            container.objs.push(dragRect);
        }
    }

    dragRect = null;
}

function mousemove(e) {
    mousePos.x = e.clientX - ctx.canvas.offsetLeft
    mousePos.y = e.clientY - ctx.canvas.offsetTop;

    if (dragRect) {
        dragRect.pos.x = mousePos.x - offSet.x;
        dragRect.pos.y = mousePos.y - offSet.y;
    }
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

function findMinDist(rect) {
    let minDist = 99999, container;
    for (let c of containers) {
        let dist = rect.pos.dist(c.rect.pos);
        if (dist < minDist) {
            container = c;
            minDist = dist;
        }
    }
    return container;
}

//---------------------
function CreateDisplay(id, width, height, border) {
    let canvas = document.createElement("canvas");
    let style_arr = [
        "display: block;",
        "margin: 0 auto;",
        "background: #FFF;",
        "padding: 0;",
        "display: block;"
    ];
    canvas.id = id;
    canvas.width = width | 0;
    canvas.height = height | 0;

    if (border) style_arr.push("border:1px solid #000;");

    if (!width && !height) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    canvas.style.cssText = style_arr.join("");

    document.body.appendChild(canvas);

    return canvas.getContext("2d");
}