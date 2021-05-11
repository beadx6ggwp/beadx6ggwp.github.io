var ctx_font = "Consolas",
    ctx_fontsize = 10,
    ctx_backColor = "rgb(109,194,202)";

//

var world;
var asset;
var player;

var debugMode = false;
// list:entity name
// isInRange:show list or ignore
var debug_entity_conf = {
    list: ['tile'],
    isInRange: false
}

function preload() {
    console.log("PreLoad...");
    asset = new AssetLoader(assetSource, (e, obj, count, total) => {
        let fileType = e.srcElement.constructor.name == 'XMLHttpRequest' ? 'JSON' : e.srcElement.tagName
        console.log(`%cLoaded: ${count}/${total}, ${fileType}, ${obj}`, 'color: #FF0;')
        if (count >= total) {
            init()
        }
    });
}

function init() {

    world = new Game({
        update: update,
        render: draw
    }, gameConfig);

    map = new TileMap(world, Tilemap_Data[nowMap]);
    // map.addToRenderList(entities);
    world.tileMap = map;

    for (let index = 0; index < 50; index++) {
        let test = {
            hp: 2,
            pos: { x: randomInt(32, 1000), y: randomInt(32, 1000) },
            vel: { x: randomInt(-100, 100), y: randomInt(-100, 100) },
            collider: {
                polygon: [{ x: -11, y: -10 }, { x: 11, y: -10 }, { x: 11, y: 10 }, { x: -11, y: 10 }]
            },
            bounceToMap: true,
            animation: robinAnimation
        };
        world.addGameObj(new Enemy1(test));
    }

    player = new Player({
        name: 'player',
        pos: { x: randomInt(200, 400), y: randomInt(200, 400) },
        vel: { x: 0, y: 0 },
        acc: { x: 0, y: 0 },
        moveSpeed: 200,
        collider: {
            polygon: [{ x: -16, y: 0 }, { x: 16, y: 0 }, { x: 16, y: 24 }, { x: -16, y: 24 }],
            offset: { x: 0, y: 0 }
            // radius: 20
        },
        // collisionToMap:false,
        animation: player1Animation
    });
    world.addGameObj(player);

    let cameraConfig = {
        world: world,
        offsetToCenter: true,
        // width: world.width,
        // height: world.height,
        traceRange: {
            width: 400,
            height: 300
        },
        target: player
    }
    world.setCamera(new Camera(cameraConfig));

    // let actionBox1 = {
    //     name: 'actionBox',
    //     pos: {
    //         x: 300,
    //         y: 300
    //     },
    //     collider: {
    //         x: -20, y: -20,
    //         w: 40, h: 40
    //     },
    //     collisionToMap: false,
    //     bounceWithMap: false,
    //     hitActionData: {
    //         parent: null,
    //         target: ['player'],
    //         action: function (ent1, ent2) {
    //             if (rect2rect(ent1.getCollisionBox(), ent2.getCollisionBox())) {
    //                 ent2.zindex = 1;
    //                 ent2.moveSpeed = 200;
    //             }
    //         }
    //     },
    //     zindex: 9,
    //     drawBase: true,
    //     defaultColor: 'rgba(127,255,255,0.5)'
    // };
    // let actionBox2 = {
    //     name: 'actionBox',
    //     pos: {
    //         x: 400,
    //         y: 400
    //     },
    //     collider: {
    //         x: -20, y: -20,
    //         w: 40, h: 40
    //     },
    //     collisionToMap: false,
    //     bounceWithMap: false,
    //     hitActionData: {
    //         parent: null,
    //         target: ['player'],
    //         action: function (ent1, ent2) {
    //             if (rect2rect(ent1.getCollisionBox(), ent2.getCollisionBox())) {
    //                 ent2.zindex = 10;
    //                 ent2.moveSpeed = 500;
    //             }
    //         }
    //     },
    //     zindex: 9,
    //     drawBase: true,
    //     defaultColor: 'rgba(127,255,255,0.5)'
    // };

    // world.addGameObj(new Entity(actionBox1));
    // world.addGameObj(new Entity(actionBox2));

    main();
}

function main() {
    console.log('Start');

    world.start();
}


// dt: sec, 1/120 like 0.008333...
function update(dt, tickcount) {

    // console.log(dt);
    let entities = world.gameObjs;
    for (const entity of entities) {
        entity.update(dt);
    }

    for (let i = entities.length - 1; i >= 0; i--) {
        let entity = entities[i];
        let had = entity.hitActionData;
        if (!had) continue;
        for (let j = entities.length - 1; j >= 0; j--) {
            let entity2 = entities[j];
            if (had.target.indexOf(entity2.name) != -1) {
                had.action(entity, entity2);
            }
        }
    }

    for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i];
        if (entity.isDead) entities.splice(i, 1);
    }
    // camera.follow(dt, player);

    cameraControl();

}


function draw(ctx, interp) {
    let camera = world.camera;
    // clear
    ctx.fillStyle = ctx_backColor;
    ctx.fillRect(0, 0, world.width, world.height);
    ctx.save();
    // draw

    // 所有物品繪製前都先 pos + (-camera.pos)，以camera起始座標為基準繪製
    // 假設camera(100, 0)、BoxA(10,0)、BoxB(120,0)
    // 那麼在攝影視角轉換的時候，相當於整個地圖往左移動100px，BoxA(-90, 0)、BoxB(20, 0)，所以畫面只看到BoxB
    // 要轉換回真實座標的話，只要加回去camera.pos即可
    // ctx.translate(-camera.pos.x, -camera.pos.y);
    ctx.translate(-camera.renderPos.x, -camera.renderPos.y);

    // world.tileMap.drawMapWithCamera(ctx, world.camera);
    let entities = world.gameObjs;

    entities.sort((a, b) => a.zindex - b.zindex);
    for (const entity of entities) {
        entity.draw(ctx);
    }


    ctx.restore();


    if (debugMode)
        showDebugInfo(ctx);
    drawString(ctx, 'FPS : ' + world.loop.FPS().toFixed(3) + "", 0, 0, "#000", 10);
}

function cameraControl() {
    // 待解決，拖動地圖，會因為moveView導致滑鼠座標一直疊加
    let camera = world.camera;
    let keys = world.keys;
    let inputDir = new Vector();
    if (keys['87']) inputDir.y = -1;
    if (keys['83']) inputDir.y = 1;
    if (keys['65']) inputDir.x = -1;
    if (keys['68']) inputDir.x = 1;
    if (inputDir.x != 0 || inputDir.y != 0) {
        camera.target = null;
        inputDir.norm();
        inputDir.setLength(5);
        camera.pos.add(inputDir);
        world.camera.moveView();
    }
}

function showDebugInfo(ctx) {
    // debug
    let camera = world.camera;
    ctx.save();
    // ctx.translate(-camera.pos.x, -camera.pos.y);
    ctx.translate(-camera.renderPos.x, -camera.renderPos.y);

    let center = new Vector(camera.pos.x + camera.width / 2, camera.pos.y + camera.height / 2);
    ctx.strokeStyle = "rgba(255,0,0,1)";
    ctx.strokeRect(center.x - camera.traceRange.x / 2, center.y - camera.traceRange.y / 2, camera.traceRange.x, camera.traceRange.y);

    ctx.strokeStyle = "rgba(255,0,0,0.8)";
    ctx.beginPath();
    ctx.moveTo(center.x - camera.traceRange.x / 2, center.y);
    ctx.lineTo(center.x + camera.traceRange.x / 2, center.y);
    ctx.moveTo(center.x, center.y - camera.traceRange.y / 2);
    ctx.lineTo(center.x, center.y + camera.traceRange.y / 2);
    ctx.stroke();


    let entities = world.gameObjs;
    let conf = debug_entity_conf;
    for (const entity of entities) {
        // 物體為要顯示時，只要在list就不跳過，物體為要排除顯示的話，只要在list中就continue
        if ((conf.isInRange) ^ (conf.list.indexOf(entity.name) != -1)) continue
        ctx.save();
        // start
        ctx.translate(entity.pos.x, entity.pos.y);

        // image size
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.strokeRect(-entity.renderWidth / 2, -entity.renderHeight / 2, entity.renderWidth, entity.renderHeight);

        // center
        let boxhalf = 2;
        ctx.fillStyle = "rgba(255,0,0,0.8)";
        ctx.fillRect(- boxhalf / 2, - boxhalf / 2, boxhalf, boxhalf);

        ctx.restore();

        // collision box range
        if (entity.colliderRef) {
            entity.collider.fill(ctx);
            // ctx.fillStyle = "rgba(255,255,127,0.3)";
            // ctx.fillRect(c.pos.x, c.pos.y, c.w, c.h);
        }

    }

    // 地圖碰撞盒
    let tw = map.tileWidth;
    let th = map.tileHeight;

    let start = {
        x: Math.max(0, Math.floor(camera.pos.x / tw)),
        y: Math.max(0, Math.floor(camera.pos.y / th))
    }
    let end = {
        x: Math.min(Math.floor((camera.pos.x + camera.width) / tw + 1), map.cols),
        y: Math.min(Math.floor((camera.pos.y + camera.height) / th + 1), map.rows)
    }
    for (let row = start.y; row < end.y; row++) {
        for (let col = start.x; col < end.x; col++) {
            let x = (col * tw);
            let y = (row * th);
            let tile = map.getCollisionTile(row, col);
            if (tile == 0) continue;
            ctx.fillStyle = "rgba(255,255,127,0.3)";
            ctx.fillRect(x, y, tw, th);
            ctx.strokeStyle = "#000";
            ctx.strokeRect(x, y, tw, th);
        }
    }

    // show camera view range
    ctx.strokeStyle = "#FFF";
    ctx.strokeRect(camera.pos.x, camera.pos.y, camera.width, camera.height)

    let r = 40;
    let mousePos = camera.screenToWorld(world.mouse.pos);
    drawString(ctx, mousePos.x + ", " + mousePos.y, mousePos.x, mousePos.y - 15, "#000", 10);
    ctx.restore();

    let w = world.width / this.world.renderScale.x;
    let h = world.height / this.world.renderScale.y;
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
}



//--------------------

window.addEventListener("keydown", (e) => {
    // console.log(e);
    if (e.keyCode == 84) {
        debugMode = !debugMode;
    }
    if (e.key == '2') {
        player.zindex++;
        console.log(`player.zindex: ${player.zindex}`);
    }
    if (e.key == '1') {
        player.zindex--;
        console.log(`player.zindex: ${player.zindex}`);
    }

    if (e.keyCode == 82) {
        world.camera.target = player;
    }
}, false);

window.addEventListener("keyup", (e) => {
}, false);
window.addEventListener("mousedown", (e) => {
}, false);
window.addEventListener("mouseup", (e) => {
}, false);
window.addEventListener("mousemove", (e) => {
}, false);

// window.addEventListener("wheel", (e) => {
//     if (e.deltaY < 0) {
//         world.changeScale(2, 2)
//     } else {
//         world.changeScale(0.5, 0.5)
//     }
//     // world.camera.offsetToCenter();
//     world.camera.moveView();
//     // console.log(e.deltaY, scale)
// }, false);
//---------------------
window.onload = function () {
    preload()
}

window.onblur = function () {
    if (world) world.loop.stop()
}

window.onfocus = function () {
    if (world) world.loop.start()
}

