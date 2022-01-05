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
    ctx = CreateDisplay("myCanvas", maxCol * TS, maxRow * TS);// 12x20,TileSize = 20
    width = ctx.canvas.width; height = ctx.canvas.height;


    document.addEventListener("keydown", keydown, false);
    document.addEventListener("keyup", keyup, false);
    document.addEventListener("mousedown", mousedown, false);
    document.addEventListener("mouseup", mouseup, false);
    document.addEventListener("mousemove", mousemove, false);

    main();

}

// ----------------------------------------------------------
var TS = 40;// TileSize
var maxCol = 12;
var maxRow = 20;

var matrix = [
    [0, 0, 0],
    [1, 1, 1],
    [0, 1, 0]
];

var dropCounter = 0;
var dropInterval = 1;// second

var arena;

var player = {
    pos: { x: 2, y: 2 },
    matrix: createPiece('T')
};

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

//----------------------------------------------------------

function main() {
    console.log("Start");

    arena = createMatrix(12, 20);

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
    }
}

function draw(ctx) {

    drawMatrix(arena, { x: 0, y: 0 });// 背景物體
    drawMatrix(player.matrix, player.pos);// 當前物體
}

//---------------------------------------------

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((val, x) => {
            if (val != 0) {
                ctx.fillStyle = colors[val];
                ctx.fillRect(
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
            if (arena[y][x] == 0) {
                flag = 0;
                break;
            }
        }
        if (flag) {
            let row = arena.splice(y, 1)[0].fill(0);
            arena.unshift(row);
            y++;
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
    dropCounter = Math.max(dropCounter - dropInterval, 0);

    return result;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    let pieces = 'ILJOTSZ';
    player.matrix = createPiece(pieces[Math.floor(pieces.length * Math.random()) | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
    }
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