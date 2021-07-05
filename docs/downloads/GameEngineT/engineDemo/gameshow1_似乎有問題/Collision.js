/**
 * 縮放比用途為取得供座標參考用的ColliderBox
 * 
 * @constructor
 * @param {object} rect
 * @param {number} scale - 縮放比
 * 
 * @constructor
 * @param {number} x, y, w, h - 座標 & 寬高
 * @param {number} scale - 縮放比
 */
class Box {
    constructor(x = 0, y = 0, w = 0, h = 0) {
        let o = arguments[0];
        if (typeof o === "object") {
            this.pos = new Vector(o.x, o.y);
            this.w = o.w;
            this.h = o.h;
        } else {
            this.pos = new Vector(x, y);
            this.w = w;
            this.h = h;
        }
    }
    clone() {
        return new Box(this.pos.x, this.pos.y, this.w, this.h);
    }
}


function InRange(value, min, max) {
    return value >= Math.min(min, max) && value <= Math.max(min, max);
}

/*
    min1           max1
    *---------------*
              min2           max2
              *---------------*
*/
function RangeIntersect(min1, max1, min2, max2) {
    // imagine here have two rectangle,and u will know how does it work
    return Math.max(min1, max1) >= Math.min(min2, max2) &&
        Math.min(min1, max1) <= Math.max(min2, max2);
}


// 之後再整理
function rect2rect(boxA, boxB) {
    let horizontal = RangeIntersect(boxA.pos.x, boxA.pos.x + boxA.w, boxB.pos.x, boxB.pos.x + boxB.w)
    let vertical = RangeIntersect(boxA.pos.y, boxA.pos.y + boxA.h, boxB.pos.y, boxB.pos.y + boxB.h);

    return horizontal && vertical;
}

function point2rect(point, box) {
    let horizontal = InRange(point.x, box.pos.x, box.pos.x + box.w);
    let vertical = InRange(point.y, box.pos.y, box.pos.y + box.h);
    return horizontal && vertical;
}

function mtvBounce(gameObj, mtv) {
    // v2 = v1 – 2(v1 dot n)n
    let n = mtv.axis.clone();
    let v = gameObj.vel.clone();
    let dot = 2 * v.dot(n);
    let v2 = v.subtract(n.multiplyScalar(dot));
    // console.log(gameObj.vel, v2);
    gameObj.vel = v2;
}
function separate(shapeA, shapeB, mtv) {
    let D = new Vector(mtv.axis.x * mtv.overlap, mtv.axis.y * mtv.overlap)
    let dist = new Vector(shapeB.pos.x - shapeA.pos.x, shapeB.pos.y - shapeA.pos.y);
    if (dist.dot(D) < 0) D.multiplyScalar(-1);

    shapeB.pos.add(D);
    return D;
}


function boxCollisionResponseToMap(gameObj, map, bounce = false) {
    if (gameObj == null || map == null) return;

    let collider = gameObj.getCollisionBox();

    let checkBox = collider.getBoundingBox();
    let tw = map.tileWidth, th = map.tileHeight;
    let minx = Math.floor(checkBox.left / tw);
    let miny = Math.floor(checkBox.top / th);
    let maxx = Math.floor((checkBox.left + checkBox.width) / tw);
    let maxy = Math.floor((checkBox.top + checkBox.height) / th);

    // 先撈出有可能發生碰撞的地圖物體，並建立碰撞盒
    let contactsTile = [];
    for (let row = miny; row <= maxy; row++) {
        for (let col = minx; col <= maxx; col++) {
            let tileType = map.getCollisionTile(row, col);
            if (tileType == 0) continue;
            // tile center，但為什麼一定要centet，直接標4個點不行嗎
            let cx = col * tw + tw / 2, cy = row * th + th / 2;
            let mapObj = new Polygon(new Vector(cx, cy),
                [{ x: -tw / 2, y: -th / 2 }, { x: tw / 2, y: -th / 2 }, { x: tw / 2, y: th / 2 }, { x: -tw / 2, y: th / 2 }]);
            // 如果這樣建立，會出問題
            // let mapObj = new Polygon(new Vector(col * tw, row * th),
            //     [{ x: 0, y: 0 }, { x: tw, y: 0 }, { x: tw, y: th }, { x: tw, y: 0 }]);
            contactsTile.push(mapObj);
        }
    }
    let isDeal = false;
    // 逐一檢查有可能碰撞的tile collisionBox
    for (let i = 0; i < contactsTile.length; i++) {
        // 之後應該要把entity collision整合出來
        const tile = contactsTile[i];
        let mtv = collider.collideWith(tile);
        if (mtv.axis) {
            mtv.overlap *= 1.0001;
            let v = separate(tile, collider, mtv)
            gameObj.pos.add(v)

            if (bounce && !isDeal) {
                mtvBounce(gameObj, mtv)
                isDeal = true;
            }
            // break;
        }
    }
}

function boxCollisionResponseToMap2(gameObj, map, bounce = false) {
    if (gameObj == null || map == null) return;

    let collider = gameObj.getCollisionBox();

    let checkBox = collider.getBoundingBox();
    let tw = map.tilewidth, th = map.tileheight;
    let minx = Math.floor(checkBox.left / tw);
    let miny = Math.floor(checkBox.top / th);
    let maxx = Math.floor((checkBox.left + checkBox.width) / tw);
    let maxy = Math.floor((checkBox.top + checkBox.height) / th);

    let checkLayer = ~~(gameObj.zindex / 10);

    // 先撈出有可能發生碰撞的地圖物體，並建立碰撞盒
    let contactsTile = [];
    for (let row = miny; row <= maxy; row++) {
        for (let col = minx; col <= maxx; col++) {
            let collisionIndex = map.getTileCollisionWithLayer(checkLayer, row, col);
            if (collisionIndex <= 0 || collisionIndex == undefined) continue;

            let tileIndex = map.getTileWithLayer(checkLayer, row, col);
            if (tileIndex > 0 && tileIndex != undefined) {
                let nowSet = -1;
                for (let i = 0; i < map.firstgidList.length; i++) {
                    if (tileIndex >= map.firstgidList[i]) nowSet = map.firstgidList[i];
                }
                let imgIndex = tileIndex - nowSet;// -1
                // debugger
                let tiles = map.tilesets[nowSet].tiles;
                if (tiles && tiles[imgIndex]) {
                    // debugger
                    let coll = tiles[imgIndex].collisions || [];
                    if(coll == undefined)debugger
                    for (const obj of coll) {
                        let cx = col * tw, cy = row * th;
                        obj.pos.x = cx; obj.pos.y = cy
                        // debugger
                        contactsTile.push(obj.getCollisionBox());
                    }
                    continue;

                }
            }
            // tile center，但為什麼一定要centet，直接標4個點不行嗎
            let cx = col * tw + tw / 2, cy = row * th + th / 2;
            let mapObj = new Polygon(new Vector(cx, cy),
                [{ x: -tw / 2, y: -th / 2 }, { x: tw / 2, y: -th / 2 }, { x: tw / 2, y: th / 2 }, { x: -tw / 2, y: th / 2 }]);
            // 如果這樣建立，會出問題
            // let mapObj = new Polygon(new Vector(col * tw, row * th),
            //     [{ x: 0, y: 0 }, { x: tw, y: 0 }, { x: tw, y: th }, { x: tw, y: 0 }]);
            contactsTile.push(mapObj);
        }
    }
    let isDeal = false;
    // 逐一檢查有可能碰撞的tile collisionBox
    for (let i = 0; i < contactsTile.length; i++) {
        // 之後應該要把entity collision整合出來
        const tile = contactsTile[i];
        let mtv = collider.collideWith(tile);
        if (mtv.axis) {
            mtv.overlap *= 1.0001;
            let v = separate(tile, collider, mtv)
            gameObj.pos.add(v)

            if (bounce && !isDeal) {
                mtvBounce(gameObj, mtv)
                isDeal = true;
            }
            // break;
        }
    }
}

function box2box(box1, box2) {
    if (box1.left + box1.width < box2.left || box2.left + box2.width < box1.left ||
        box1.top + box1.height < box2.top || box2.top + box2.height < box1.top)
        return false;
    return true;
}