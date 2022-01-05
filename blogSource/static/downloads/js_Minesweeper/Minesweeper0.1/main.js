var canvas,
    ctx,
    width,
    height;
var animation,
    lastTime = 0,
    Timesub = 0,
    loop = true;

var ctx_font = "Consolas",
    ctx_fontsize = 10,
    ctx_backColor = "#CCC";

//Init
window.onload = function () {
    canvas = document.getElementById('myCanvas')
    ctx = canvas.getContext('2d');
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight - canvas.offsetTop;

    main();
}

var map,
    sx,
    sy,
    cols,
    rows,
    w = 600,
    h = 600,
    size = 60,
    bombCount = 0,
    backCount = 0,
    finishStatue = 2;

function main() {
    console.log("Width: " + width + ", " + "Height: " + height);
    console.log("Start");

    sx = Math.floor((width - w) / 2);
    sy = Math.floor((height - h) / 2);
    cols = Math.floor(w / size);
    rows = Math.floor(h / size);
    map = Create2DArray(cols, rows);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            map[i][j] = new Cell(i, j, size);
        }
    }
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            CountBee(i, j);
        }
    }
    // ----------測試用---------
    let str = "", str2 = "", s = "";
    bombCount = 0;
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            if (map[j][i].bee) {
                bombCount++;
                s = "#"
            } else {
                s = "-";
            }
            str2 += s + "  "
            str += map[j][i].neighborCount + "  ";
        }
        str += "\n"
        str2 += "\n"
    }
    console.log(str);
    console.log(str2);
    console.log("Bomb num = " + bombCount);

    // -------------------------

    mainLoop();
}

// 方便測試用
// 正常等點擊時再做更新即可，不需要用到即時更新
function mainLoop(timestamp) {
    Timesub = timestamp - lastTime;
    lastTime = timestamp;
    //Clear
    ctx.fillStyle = ctx_backColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    //--------Begin-----------

    draw();

    //--------End---------------
    ctx.textAlign = "start";
    ctx.font = ctx_fontsize + "px " + ctx_font;
    ctx.fillStyle = "#000";
    ctx.fillText("Sleep:" + Timesub, 0, height - 1);
    ctx.fillText("Fps:" + 1000 / Timesub, 0, height - ctx_fontsize - 1);

    if (loop) {
        animation = window.requestAnimationFrame(mainLoop);
    } else {
        // over
    }
}


function draw() {
    ctx.fillStyle = "#FFF";
    ctx.fillRect(sx, sy, w, h);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            map[i][j].Show();
        }
    }


    if (finishStatue != 2) {
        ShowMap();

        ctx.save();

        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.translate(width / 2, height / 2)
        ctx.rotate(15 * Math.PI / 180);
        ctx.textAlign = "center";
        ctx.font = 90 + "px " + ctx_font;
        ctx.fillStyle = "#F00";
        let s = finishStatue == 1 ? "Finish" : "Bomb~";
        ctx.fillText(s, 0, 0);

        ctx.restore();
    }
}

document.addEventListener("mousedown", function (e) {
    let mX = e.clientX - canvas.offsetLeft;
    let mY = e.clientY - canvas.offsetTop;

    if (mX < sx || mX > sx + w ||
        mY < sy || mY > sy + h) return;

    // -1 防踩右、下邊線
    let i = Math.floor((mX - sx - 1) / size);
    let j = Math.floor((mY - sy - 1) / size);
    Hit(i, j);
}, false);

function Hit(i, j) {
    if (map[i][j].statue != 0) return;
    if (map[i][j].bee) {
        ShowMap();
        finishStatue = 0;
        return;
    }
    backCount = 0;
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            if (map[i][j].statue == 0) {
                backCount++;
            }
        }
    }
    if (backCount == bombCount + 1) {
        finishStatue = 1;
        console.log("Win");
    }
    Reveal(i, j);
}

function Reveal(i, j) {
    map[i][j].statue = 1;

    // Flood fill DFS
    if (map[i][j].neighborCount == 0) {
        for (let offX = -1; offX < 2; offX++) {
            for (let offY = -1; offY < 2; offY++) {
                let x = i + offX;
                let y = j + offY;
                if (x < 0 || x > cols - 1 || y < 0 || y > rows - 1) continue;
                if (map[x][y].statue == 1) continue; // 關鍵
                Reveal(x, y);
            }
        }
    }
}

function CountBee(i, j) {
    if (map[i][j].bee) {
        map[i][j].neighborCount = 9;
        return;
    }

    let count = 0;

    for (let offX = -1; offX < 2; offX++) {
        for (let offY = -1; offY < 2; offY++) {
            let x = i + offX;
            let y = j + offY;
            if (x < 0 || x > cols - 1 ||
                y < 0 || y > rows - 1) continue;
            let obj = map[x][y];
            if (obj.bee) count++;
        }
    }
    map[i][j].neighborCount = count;
}

function ShowMap() {
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            map[i][j].statue = 1;
        }
    }
}



function Create2DArray(cols, rows) {
    var arr = new Array(cols);
    for (let i = 0; i < cols; i++) {
        arr[i] = new Array(rows);
    }
    return arr;
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
