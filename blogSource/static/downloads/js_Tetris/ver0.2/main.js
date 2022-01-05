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
    ctx_backColor = "#000";

var keys = {}, mousePos = { x: 0, y: 0 };

window.onload = function () {
    ctx = CreateDisplay("myCanvas", maxCol * TS + sideMenuWidth, maxRow * TS);// 12x20,TileSize = 20
    width = ctx.canvas.width; height = ctx.canvas.height;


    document.addEventListener("keydown", keydown, false);
    document.addEventListener("keyup", keyup, false);
    document.addEventListener("mousedown", mousedown, false);
    document.addEventListener("mouseup", mouseup, false);
    document.addEventListener("mousemove", mousemove, false);

    main();

}

//----------------------------------------------------------

function main() {
    console.log("Start");

    arena = createMatrix(12, 20);

    for (let i = 0; i < 3; i++) {
        queue.push(getRandomBlack());
    }

    window.requestAnimationFrame(mainLoop);
    //mainLoop();
}

//----------------Loop-------------------------

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
        "rgba(255,255,255,0.3)", 10, "consolas",
        0, 0, 0);
    if (loop) {
        animation = window.requestAnimationFrame(mainLoop);
    } else {
        // over
    }
}

function update(dt) {
    dropCounter += dt;
    if (dropCounter > dropInterval) {
        playerDrop();
        dropCounter = Math.max(dropCounter - dropInterval, 0);
    }

    if (isShake) {
        let i = shakeIndex % next.length;
        canvasPos.x = next[i].x;
        canvasPos.y = next[i].y;

        shakeIndex++;
        shakeCounter += dt;
        if (shakeCounter >= shakeTime) {
            isShake = 0;
            shakeCounter = 0;
            shakeIndex = 0;
            ctx.resetTransform();
        }
    }
}

function draw(ctx) {
    if (isShake) {
        ctx.translate(canvasPos.x, canvasPos.y);
    }

    drawMatrix(arena, { x: 0, y: 0 });// 背景物體
    drawMatrix(player.matrix, player.pos);// 當前物體

    drawMenu();
    drawString(ctx, score + "",
        10, 10,
        "rgba(255,255,255)", 36, "consolas",
        0, 0, 0);
}

// ----------------------------------------------------------
var sideMenuWidth = 100;

var shakeTime = 0.2;
var isShake = 0;
var shakeCounter = 0;
var canvasPos = { x: 0, y: 0 };
var shakeIndex = 0;
var shakePower = 3;
var next = [
    { x: shakePower, y: 0 },
    { x: 0, y: shakePower },
    { x: -shakePower, y: 0 },
    { x: 0, y: -shakePower }
];

var TS = 40;// TileSize
var maxCol = 12;
var maxRow = 20;


var dropCounter = 0;
var dropInterval = 1;// second

var arena;

var score = 0;
var player = {
    pos: { x: 2, y: 2 },
    matrix: getRandomBlack()
};

var queue = [];

var colors = [
    null,
    'red',
    'blue',
    'violet',
    'green',
    'purple',
    'orange',
    'pink'
];

//---------------------------------------------

function drawMenu() {
    // 畫出預測位置
    var clone = {
        matrix: player.matrix,
        pos: Object.assign({}, player.pos)
    };
    while (!collide(arena, clone)) {
        clone.pos.y++;
    }
    clone.pos.y--;
    ctx.globalAlpha = 0.3;
    drawMatrix(clone.matrix, clone.pos);
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#222";
    ctx.fillRect(width - sideMenuWidth, 0, sideMenuWidth, height);

    // 方塊佇列
    let size = 30;
    let offsetY = 50;
    let offsetX = width - size * queue.length;
    queue.forEach((arr, index) => {
        arr.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val != 0) {
                    ctx.fillStyle = colors[val];
                    ctx.fillRect(
                        (x) * size + offsetX,
                        (y) * size + offsetY,
                        size, size);
                }
            });
        });

        offsetY += size * 5;
    });

    drawString(ctx, "Next",
        offsetX, 0,
        "rgba(255,255,255)", 32, "consolas",
        0, 0, 0);
    //↑→↓←
    drawString(ctx, "Move:\nLeft,Right\n\nRotate:\nUp\n\nSoft Drop:\nDown\n\nHard Drop:\nSpace",
        offsetX, height * 3 / 4,
        "rgba(255,255,255)", 14, "consolas",
        0, 0, 0);
}

function drawMatrix(matrix, offset, color) {
    matrix.forEach((row, y) => {
        row.forEach((val, x) => {
            if (val != 0) {
                ctx.fillStyle = color ? color : colors[val];
                ctx.fillRect(
                    (x + offset.x) * TS,
                    (y + offset.y) * TS,
                    TS, TS);
                ctx.strokeStyle = color ? color : colors[val];
                ctx.strokeRect(
                    (x + offset.x) * TS,
                    (y + offset.y) * TS,
                    TS, TS);
            }
        });
    });
}

function arenaSweep() {
    for (let y = arena.length - 1; y >= 0; y--) {
        let flag = 1;
        for (let x = arena[y].length - 1; x >= 0; x--) {
            // 只要那一行有一格是0表示沒機會一條，先跳掉
            if (arena[y][x] == 0) {
                flag = 0;
                break;
            }
        }
        // 如果每一格都是1，刪除該行，並從前端加入新的一行
        if (flag) {
            let row = arena.splice(y, 1)[0].fill(0);
            arena.unshift(row);
            y++;
            score++;

            isShake = 1;
        }
    }
}

function createMatrix(w, h) {
    let matrix = [];
    while (h-- > 0) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value != 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                    matrix[y][x],
                    matrix[x][y],
                ];
        }
    }

    if (dir > 0) {
        // 右旋
        matrix.forEach(row => row.reverse());
    } else {
        // 左旋
        matrix.reverse();
    }
}
function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function collide(arena, player) {
    var m = player.matrix;
    var o = player.pos;

    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }

    return false;
}

function playerDrop() {
    let result = 1;
    player.pos.y++;
    //console.log(collide(arena, player));
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        result = 0;
    }

    return result;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    queue.push(getRandomBlack());
    player.matrix = queue.shift();
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

    // gameover
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        score = 0;
    }
}

function getRandomBlack() {
    let pieces = 'ILJOTSZ';
    return createPiece(pieces[Math.floor(pieces.length * Math.random()) | 0]);
}
function createPiece(type) {
    if (type === 'T') {
        return [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ];
    } else if (type === 'O') {
        return [
            [2, 2],
            [2, 2],
        ];
    } else if (type === 'L') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3],
        ];
    } else if (type === 'J') {
        return [
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0],
        ];
    } else if (type === 'I') {
        return [
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'Z') {
        return [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0],
        ];
    }
}
//---evnt---
function keydown(e) {
    keys[e.keyCode] = true;
    //console.log(keys);

    if (e.keyCode == 37) {
        playerMove(-1);
    } else if (e.keyCode == 39) {
        playerMove(1);
    } else if (e.keyCode == 40) {
        playerDrop();
    } else if (e.keyCode == 81) {
        playerRotate(-1);
    } else if (e.keyCode == 87) {
        playerRotate(1);
    } else if (e.keyCode == 38) {
        playerRotate(1);
    } else if (e.keyCode == 32) {
        while (playerDrop()) {
        }
    }
}

function keyup(e) {
    delete keys[e.keyCode];
}

function mousedown(e) {

}

function mouseup(e) {

}

function mousemove(e) {
    mousePos.x = e.clientX - ctx.canvas.offsetLeft;
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