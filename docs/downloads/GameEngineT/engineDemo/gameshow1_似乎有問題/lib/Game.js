/*
callback = {
    update: func,
    render: func
}

config = {
    width:800,
    height:600,
    canvasOnCenter:1,
    updateStep:1/60
}
*/

// console.log("import game");
class Game {
    constructor(callback, config = {}) {
        // sitting canvas
        this.width = GetValue(config, 'width', 800);
        this.height = GetValue(config, 'height', 600);

        this.canvasOnCenter = GetValue(config, 'canvasOnCenter', 1);
        this.canvas = CreateCanvas("GameCanvas", this.width, this.height, this.canvasOnCenter);
        this.ctx = CreateDisplayEnvironment(this.canvas, this);
        this.ctx.imageSmoothingEnabled = false;
        this.renderScale = { x: 1, y: 1 };
        let scale = GetValue(config, 'renderScale', { x: 1, y: 1 });
        this.changeScale(scale.x, scale.y);

        // sitting input
        this.keys = {}
        this.mouse = {
            downPos: new Vector(),
            pos: new Vector(),
            upPos: new Vector(),
            isDown: false
        };

        // settin gameObj
        this.Alarm = new Alarm();
        this.tileMap = null;
        this.camera = null;
        this.gameObjs = [];

        // sitting loop
        this.updateStep = GetValue(config, 'updateStep', 1 / 120);
        this.callback = callback;

        this.loop = new Timer({
            update: (dt, tick) => {
                callback.update(dt, tick);
                this.Alarm.update(dt);
            },
            render: (interp) => callback.render(this.ctx, interp)
        }, this.updateStep);
    }

    changeScale(scaleX, scaleY) {
        // 目前直接從設定開新遊戲縮放沒問題，但動態縮放會出問題
        this.renderScale.x *= scaleX;
        this.renderScale.y *= scaleY;
        this.ctx.scale(scaleX, scaleY);
    }

    start() {
        this.loop.start()
    }

    setCamera(camera) {
        this.camera = camera;
        if (camera)
            this.addGameObj(camera);
    }
    addGameObj(entity) {
        entity.world = this;
        this.gameObjs.push(entity);
    }
}

function Timer(callback, step) {
    var stats = new Stats();
    document.body.appendChild(stats.dom);
    stats.showPanel(0);

    var rafID,
        lastTime = 0,
        accumulator = 0,
        tickcount = 0,
        stepTime = step || 1 / 120,
        isRunning = false,
        isStarted = false;

    var panicMax = 120;

    var defaultFPS = 60;

    var fps = defaultFPS,
        actualFPS = 0,
        lastFpsUpdate = 0,
        framesThisSecond = 0,
        alpha = 0.25;

    var deltaHistory = [];

    // Runge Kutta order 4(RK4)，數值分析
    // https://gafferongames.com/post/integration_basics/
    // timestamp 相當於 window.performance.now()
    function onFrame(timestamp) {
        // console.log(timestamp)
        stats.begin();

        if (isRunning) {
            accumulator += (timestamp - lastTime) / 1000;
            actualFPS = 1000 / (timestamp - lastTime);
            lastTime = timestamp;
        }

        // callback.begin()

        // FPS Counter
        // exponential moving average: http://alptbag.blogspot.com/2014/02/maema.html
        // alpha表示衰減，用來處理最近幾秒的FPS更新
        // FPS(n+1) = FPS(n) + alpha(FpsNow - FPS(n))
        // (thisSecond - fps)為當前幀數與上秒的物差
        // 預測當前的FPS等於上次結果加上這次的誤差，為了避免數值變化太快，所以加個衰減參數alpha
        if (timestamp > lastFpsUpdate + 1000) {
            fps = alpha * framesThisSecond + (1 - alpha) * fps;
            lastFpsUpdate = timestamp;
            framesThisSecond = 0;
            // console.log(fps);
        }
        framesThisSecond++;

        // 用意就是讓update()以時間做為更新的依據
        // 或是當物體移動距離大的時候，就需要提高update()更新的速度，以更精準檢測每次更新移動的距離
        // 物體移動速度為1000 px/s，在更新率20的狀況，相當於每次更新時移動50px
        // 而更新率100的時候，相當於每次更新時只移動10px，自然能更加精準
        // 但更新率100時，相當於0.01ms更新一次，但raf的更新平率是60hz = 16.67ms
        // 為了達成100hz的更新，所以在每次raf的時候，就要連續更新16次左右，以模擬100hz的更新頻率
        var numUpdateSteps = 0;
        while (accumulator > stepTime && isRunning) {
            callback.update(stepTime, tickcount);
            tickcount++;
            accumulator -= stepTime;

            // 當瀏覽器切窗時raf並不會更新，但切窗回來時timestamp卻還在累加，或是延遲發生時，做的應對處理
            // numUpdateSteps相當於計數這幀更新了幾次，當落後太多的時候，就要執行修正
            // 像是切窗之前 accumulator = 0,回來後變成1000，相當於落後1s
            // 以stepTime:10ms來看下一幀就會需要跑100次來彌補，所以物體就會順移一段之類的
            // 或是短時間大量update()導致下一幀也延遲，然後為了保持模擬又繼續while (accumulator > stepTime){...}
            // 以此類推，最後導致卡死，所以再出現意外的時候需要修正
            if (++numUpdateSteps >= panicMax) {
                // Maybe numUpdateSteps / stepTime >= panicMax ?
                panic()
                break;
            }
        }

        // interp  = accumulator / stepTime
        callback.render(accumulator / stepTime);

        // callback.end()

        stats.end();

        rafID = requestAnimationFrame(onFrame);
    }

    function panic() {
        // 而最簡單的修正方法就是將要追趕的accumulator重製
        console.log('accumulator reset');
        accumulator = 0;
    }

    function start() {
        if (isStarted) return;
        isRunning = true;
        isStarted = true;
        reset();

        rafID = requestAnimationFrame(onFrame);
    }

    // 暫停update()，但繼續render()
    function pause() {
        if (!isRunning) reset();
        isRunning = !isRunning;
    }
    function stop() {
        isRunning = false;
        isStarted = false;
        cancelAnimationFrame(rafID);
    }

    function reset() {
        // reset timestamp
        lastTime = window.performance.now();
        lastFpsUpdate = window.performance.now();
        framesThisSecond = 0;
    }
    function FPS() {
        return fps;
    }
    function getStatus() {
        return {
            isRunning: isRunning,
            isStarted: isStarted
        };
    }

    return {
        start: start,
        pause: pause,
        stop: stop,
        FPS: FPS,
        status: getStatus()
    };
}

class Alarm {
    constructor() {
        this.eventList = {};
    };
    update(dt) {
        dt *= 1000;
        for (let key in this.eventList) {
            let element = this.eventList[key];
            // 假設是處理的時候是先移動再檢查，最後會多跑一次
            // 處理剛設定時，少計算的那一次，以對齊次數            
            // if (element.countTime == 0) element.countTime += dt;
            element.countTime += dt;
        }
    }
    setTime(eventName, ms) {
        if (this.eventList[eventName]) return;
        let now = Date.now();
        this.eventList[eventName] = {
            startTime: now,
            endTIme: now + ms,
            countTime: 0
        };
    }
    check(eventName) {
        if (!this.eventList[eventName]) return null;
        let event = this.eventList[eventName];
        let passTime = event.startTime + event.countTime;
        let timeDiff = passTime - event.endTIme;
        if (timeDiff >= 0) {
            delete this.eventList[eventName];
        }
        return timeDiff;
    }
}

/*
// 原本使用Date.Now()會導致不準確
// 像是0.2秒內移動200，vel = 200/0.2=1000，在更新率1/120時
// 移動0.2秒後會變成208.333或是216.666，會多移動1~2次
// 原因有待確認
// 好像就算有對齊時間也是
Alarm = {
    setTime: function (eventName, ms) {
        if (this[eventName]) return;
        let now = Date.now();
        this[eventName] = {
            startTime: now,
            endTIme: now + ms
        };
    },
    check: function (eventName) {
        if (!this[eventName]) return 0;
        let timeDiff = Date.now() - this[eventName].endTIme;
        if (timeDiff >= 0) {
            delete this[eventName];
        }
        return timeDiff;
    }
};
class Alarm2 {
    constructor() {
        this.eventList = {};
    };
    setTime(eventName, ms) {
        if (this.eventList[eventName]) return;
        let now = Date.now();
        this.eventList[eventName] = {
            startTime: now,
            endTIme: now + ms
        };
    }
    check(eventName) {
        if (!this.eventList[eventName]) return 0;
        let timeDiff = Date.now() - this.eventList[eventName].endTIme;
        if (timeDiff >= 0) {
            delete this.eventList[eventName];
        }
        return timeDiff;
    }
}
*/

function CreateDisplayEnvironment(canvas, world) {
    document.addEventListener("keydown", (e) => world.keys[e.keyCode] = true, false);
    document.addEventListener("keyup", (e) => delete world.keys[e.keyCode], false);
    document.addEventListener("mousedown", (e) => {
        world.mouse.isDown = true;
        world.mouse.downPos = getCtxMousePos(e, world.ctx);
    }, false);
    document.addEventListener("mouseup", (e) => {
        world.mouse.isDown = false;
        world.mouse.upPos = getCtxMousePos(e, world.ctx);
    }, false);
    document.addEventListener("mousemove", (e) => {
        world.mouse.pos = getCtxMousePos(e, world.ctx);
    }, false);
    return canvas.getContext('2d');
}

function getCtxMousePos(e, ctx) {
    var rect = ctx.canvas.getBoundingClientRect();
    return new Vector(e.clientX - Math.floor(rect.left), e.clientY - Math.floor(rect.top));
}

function CreateCanvas(id, width, height, center, border) {
    let div = document.createElement("div");
    div.id = "divForCanvas";

    // canvas sitting
    let canvas = document.createElement("canvas");
    let style_arr = [
        "display: block;",
        "margin: 0 auto;",
        // "background: #FFF;",
        "padding: 0;"
    ];
    canvas.id = id;
    width = width || window.innerWidth;
    height = height || window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    if (border) style_arr.push("border:1px solid #000;");

    canvas.style.cssText = style_arr.join("");

    // 是否要畫面置中
    if (center) {
        div.style.cssText = [
            "position:absolute;",
            "width:" + width + "px;",
            "height:" + height + "px;",
            "left:50%;",
            "top:50%;",
            "margin-top: -" + height / 2 + "px;",
            "margin-left: -" + width / 2 + "px;",
            "background:#000;"
        ].join("");

        document.body.appendChild(div);
        div.appendChild(canvas);
    } else {
        document.body.appendChild(canvas);
    }

    return canvas;
}
