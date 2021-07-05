class Camera2 {
    constructor(world) {
        this.world = world;
        this.width = 800;
        this.height = 600;

        this.target = null;
        this.traceRange = new Vector(400, 300);
        this.traceSpeed = 300;
        this.pos = new Vector();// leftTop
    }
    follow(dt, gameObj) {
        let world = this.world;
        let tileMap = this.world.tileMap;
        // this.pos.x = gameObj.pos.x - this.width / 2;
        // this.pos.y = gameObj.pos.y - this.height / 2;

        let traceRange = this.traceRange;
        let center = new Vector(this.pos.x + this.width / 2, this.pos.y + this.height / 2);
        let traceRangeBox = new Box(center.x - traceRange.x / 2, center.y - traceRange.y / 2,
            traceRange.x, traceRange.y);

        let speed = gameObj.moveSpeed * 1.2 * dt || this.traceSpeed;
        // 問題:當跟隨速度 > gameObj的移動速度時，會出現超前狀態，導致抖動
        // 解:當p到edge的距離 < 下次移動距離，直接讓邊移動到 p上
        // 先用ray cast求得移動前 center -> p 在邊上的交點 p'
        // 在求向量 a = p'-p，接者讓center + a向量，即可讓邊完美移動到指定的P點
        // need ray cast
        // if (!point2rect(gameObj.pos, traceRangeBox)) {
        //     let dist = gameObj.pos.clone().subtract(center);
        //     this.pos.add(dist.setLength(speed));
        // }

        // 暫時解法:當要超前時，直接貼上
        let dist = gameObj.pos.x - (center.x + traceRange.x / 2);
        if (dist > 0) {
            if (dist < speed) {
                this.pos.x += dist;
            } else {
                this.pos.x += speed;
            }
        }
        dist = (center.x - traceRange.x / 2) - gameObj.pos.x;
        if (dist > 0) {
            if (dist < speed) {
                this.pos.x -= dist;
            } else {
                this.pos.x -= speed;
            }
        }

        dist = gameObj.pos.y - (center.y + traceRange.y / 2);
        if (dist > 0) {
            if (dist < speed) {
                this.pos.y += dist;
            } else {
                this.pos.y += speed;
            }
        }
        dist = (center.y - traceRange.y / 2) - gameObj.pos.y;
        if (dist > 0) {
            if (dist < speed) {
                this.pos.y -= dist;
            } else {
                this.pos.y -= speed;
            }
        }

        // limit min and max
        let maxW = tileMap.cols * tileMap.tileWidth;
        let maxH = tileMap.rows * tileMap.tileHeight;
        // if (this.pos.x < 0) this.pos.x = 0;
        // if (this.pos.y < 0) this.pos.y = 0;
        // if (this.pos.x + this.width > maxW) this.pos.x = maxW - this.width;
        // if (this.pos.y + this.height > maxH) this.pos.y = maxH - this.height;

        this.pos.x = Math.floor(this.pos.x);
        this.pos.y = Math.floor(this.pos.y);
    }
    getMousePos(gameMouse) {
        // 問題:當ctx.scale假設要縮放1024x768，這時滑鼠位置會有偏移
        return {
            x: Math.floor(this.pos.x + gameMouse.x),
            y: Math.floor(this.pos.y + gameMouse.y)
        }
    }
}

class Camera extends Entity {
    constructor(config) {
        super(config);
        this.width = GetValue(config, 'width', 800);
        this.height = GetValue(config, 'height', 600);

        this.target = GetValue(config, 'target', null);
        let _traceRange = GetValue(config, 'traceRange', { width: 0, height: 0 });
        this.traceRange = new Vector(_traceRange.width || 0, _traceRange.height || 0);

        this.traceSpeed = GetValue(config, 'traceSpeed', 300);

        this.pos = new Vector();// leftTop
        this.renderPos = new Vector();

        this.offset = GetValue(config, 'offset', new Vector())
        this.isOffsetToCenter = GetValue(config, 'offsetToCenter', false);
        if (this.isOffsetToCenter) this.offsetToCenter();

        this.collider = new BoundingBox(this.pos.x, this.pos.y, this.width, this.height);
    }
    offsetToCenter() {
        // 渲染放大，所以offset也要修改
        let size = this.screenToWorld(new Vector(this.world.width, this.world.height))
        let sizeW = size.x / 2 - this.width / 2;
        let sizeH = size.y / 2 - this.height / 2;
        this.offset = new Vector(sizeW, sizeH);
        // this.offset = new Vector(100,100)/ this.world.renderScale.x / this.world.renderScale.y
    }

    update(dt) {
        if (this.target) {
            this.follow(dt, this.target);
        }
    }
    draw(ctx) {

    }
    follow(dt, gameObj) {
        let world = this.world;
        let tileMap = this.world.tileMap;

        if (!this.traceRange) {
            this.pos.x = gameObj.pos.x - this.width / 2;
            this.pos.y = gameObj.pos.y - this.height / 2;
        } else {
            let traceRange = this.traceRange;
            let center = new Vector(this.pos.x + this.width / 2, this.pos.y + this.height / 2);
            let traceRangeBox = new Box(center.x - traceRange.x / 2, center.y - traceRange.y / 2,
                traceRange.x, traceRange.y);

            let speed = gameObj.moveSpeed * 1.2 * dt || this.traceSpeed;
            // 問題:當跟隨速度 > gameObj的移動速度時，會出現超前狀態，導致抖動
            // 解:當p到edge的距離 < 下次移動距離，直接讓邊移動到 p上
            // 先用ray cast求得移動前 center -> p 在邊上的交點 p'
            // 在求向量 a = p'-p，接者讓center + a向量，即可讓邊完美移動到指定的P點
            // need ray cast
            // if (!point2rect(gameObj.pos, traceRangeBox)) {
            //     let dist = gameObj.pos.clone().subtract(center);
            //     this.pos.add(dist.setLength(speed));
            // }

            // 暫時解法:當要超前時，直接貼上
            let dist = gameObj.pos.x - (center.x + traceRange.x / 2);
            if (dist > 0) {
                if (dist < speed) {
                    this.pos.x += dist;
                } else {
                    this.pos.x += speed;
                }
            }
            dist = (center.x - traceRange.x / 2) - gameObj.pos.x;
            if (dist > 0) {
                if (dist < speed) {
                    this.pos.x -= dist;
                } else {
                    this.pos.x -= speed;
                }
            }

            dist = gameObj.pos.y - (center.y + traceRange.y / 2);
            if (dist > 0) {
                if (dist < speed) {
                    this.pos.y += dist;
                } else {
                    this.pos.y += speed;
                }
            }
            dist = (center.y - traceRange.y / 2) - gameObj.pos.y;
            if (dist > 0) {
                if (dist < speed) {
                    this.pos.y -= dist;
                } else {
                    this.pos.y -= speed;
                }
            }
        }

        // limit min and max
        let maxW = tileMap.cols * tileMap.tileWidth;
        let maxH = tileMap.rows * tileMap.tileHeight;
        // if (this.pos.x < 0) this.pos.x = 0;
        // if (this.pos.y < 0) this.pos.y = 0;
        // if (this.pos.x + this.width > maxW) this.pos.x = maxW - this.width;
        // if (this.pos.y + this.height > maxH) this.pos.y = maxH - this.height;
        //  Math.floor()
        this.pos.x = (this.pos.x);
        this.pos.y = (this.pos.y);

        this.moveView();
    }

    worldToScreen(worldPos) {
        let pos = new Vector(
            Math.floor((worldPos.x - this.renderPos.x) / this.world.renderScale.x),
            Math.floor((worldPos.y - this.renderPos.y) / this.world.renderScale.y)
        );
        return pos;
    }
    screenToWorld(screenPos) {
        let pos = new Vector(
            Math.floor((screenPos.x / this.world.renderScale.x + this.renderPos.x)),
            Math.floor((screenPos.y / this.world.renderScale.y + this.renderPos.y))
        );
        return pos;
    }

    moveView() {
        this.renderPos.x = this.pos.x - this.offset.x;
        this.renderPos.y = this.pos.y - this.offset.y;
    }
    getBoundingBox() {
        // 更新碰撞盒位置
        this.collider.left = this.pos.x;
        this.collider.top = this.pos.y;
        return this.collider;
    }
}