/*
    config example:
    {
        pos: { x: 0, y: 0 },
        vel: { x: 0, y: 0 },
        acc: { x: 0, y: 0 },
        collider: {
            x: -15, y: -15,
            w: 30, h: 30
        },
        bounceToMap: false,
        collisionToMap: true,
        world: Worldmap,
        animation: {
            frameWidth: 44,
            frameHeight: 40,
            renderScale: 1 / 2,
            imgName: 'coin',
            speed: 15,
            action: {
                'default': '0-9'
            }
        },
        survivalMode : false,
        survivalTime : -1,
        hitActionData :{
            target: [...],
            action: (ent1, ent2) {...}
        }
    }
 */
class Entity {
    constructor(config) {
        // 目前暫指map
        this.config = config;//直接等於可能會有座標速率被修改的問題，但複製的話感覺太浪費記憶體
        this.world = GetValue(config, 'world', null);

        this.name = GetValue(config, 'name', 'defaultEntity');

        this.pos = GetValue(config, 'pos', new Vector());
        this.pos = new Vector(this.pos.x, this.pos.y);

        this.acc = GetValue(config, 'acc', new Vector());
        this.acc = new Vector(this.acc.x, this.acc.y);

        this.vel = GetValue(config, 'vel', new Vector());
        this.vel = new Vector(this.vel.x, this.vel.y);

        this.survivalMode = GetValue(config, 'survivalMode', false);
        this.survivalTime = GetValue(config, 'survivalTime', -1);

        this.collisionToMap = GetValue(config, 'collisionToMap', true);
        this.bounceToMap = GetValue(config, 'bounceToMap', false);

        /*
        {parent:Entity,target:['name',...],action:function(ent1,ent2){}}
        */
        this.hitActionData = GetValue(config, 'hitActionData', null);
        this.colliderRef = GetValue(config, 'collider', null);
        if (this.colliderRef != null) {
            this.createShape(this.colliderRef);
        }

        this.zindex = GetValue(config, 'zindex', 15);

        this.aniData = GetValue(config, 'animation', null);
        if (this.aniData != null) {
            let ani = this.aniData;
            this.rotate = GetValue(ani, 'rotate', 0);
            this.scaleX = GetValue(ani, 'scaleX', 1);
            this.scaleY = GetValue(ani, 'scaleY', 1);
            this.renderScale = ani.renderScale;
            this.renderWidth = ani.frameWidth * ani.renderScale;
            this.renderHeight = ani.frameHeight * ani.renderScale;
            // console.log(ani)
            let image = asset.imgs[ani.imgName];
            this.sheet = new SpriteSheet(image, ani.frameWidth, ani.frameHeight);
            this.animation = new Animation(this.sheet, ani.speed, ani.action['default'], ani.repeat);
            this.renderBox = new BoundingBox(0, 0, this.renderWidth, this.renderHeight);
        }

        this.drawBase = GetValue(config, 'drawBase', false);
        this.defaultSize = GetValue(config, 'defaultSize', 30);
        this.defaultColor = GetValue(config, 'defaultColor', 'rgba(255,127,127,0.5)');


        // need to delect
        this.isDead = false;
    }

    createShape(data) {
        this.colliderOffset = data.offset || new Vector();
        if (data.polygon) {
            let vertices = []
            for (const v of data.polygon) {
                vertices.push(new Vector(v.x, v.y));
            }
            this.collider = new Polygon(this.pos.clone(), vertices)
        } else if (data.radius) {
            this.collider = new Circle(this.pos.clone(), data.radius)
        }
    }

    update(dt, tick) {
        this.vel.add(this.acc);
        this.pos.add(this.vel.clone().multiplyScalar(dt));

        let tileMap = this.world.tileMap;
        if (this.collisionToMap && this.colliderRef != null && tileMap != null) {
            boxCollisionResponseToMap2(this, tileMap, this.bounceToMap);
        }

        if (this.animation) {
            this.animation.update(dt);
        }

        if (this.survivalMode) {
            this.survivalTime -= dt
            if (this.survivalTime < 0) {
                this.isDead = true;
            }
        }
    }

    draw(ctx, interp) {
        // 莫名耗效能，目前觀察是tile其實沒必要這樣檢查，浪費效能，30x40個tile都new Box()會讓GC負荷太重
        // 讓tile繼承entity，讓他根據camera.pos.x / tile.width之類的方法，檢查有沒有碰到來塞選繪製
        // if(this.name == 'actionBox')debugger
        if (this.world.camera) {
            if (!this.checkInView(world.camera)) return
        }
        ctx.save();
        ctx.translate(Math.round(this.pos.x), Math.round(this.pos.y));// Math.floor()
        ctx.rotate(this.rotate * Math.PI / 180);
        ctx.scale(this.scaleX, this.scaleY);

        if (this.animation) {
            this.animation.draw(ctx, -this.renderWidth / 2, -this.renderHeight / 2, this.renderWidth, this.renderHeight);
        } else if (this.drawBase) {
            ctx.fillStyle = this.defaultColor;
            if (this.collider) {
                ctx.translate(-this.pos.x, -this.pos.y);
                this.collider.fill(ctx)
                ctx.translate(this.pos.x, this.pos.y);
            } else {
                ctx.fillRect(-this.defaultSize / 2, -this.defaultSize / 2, this.defaultSize, this.defaultSize);
            }
        }
        ctx.restore();
    }

    getCollisionBox() {
        // 更新碰撞盒位置
        this.collider.pos.x = this.pos.x + this.colliderOffset.x;
        this.collider.pos.y = this.pos.y + this.colliderOffset.y;
        return this.collider;
    }
    getRenderBox() {
        if (this.animation) {
            this.renderBox.left = this.pos.x;
            this.renderBox.top = this.pos.y;
            return this.renderBox;
        }
        if (this.colliderRef) {
            return this.collider.getBoundingBox();
        }
        return new BoundingBox(this.pos.x - this.defaultSize / 2, this.pos.y - this.defaultSize / 2, this.defaultSize, this.defaultSize);
    }

    checkInView(camera) {
        let box1 = camera.getBoundingBox();
        let box2 = this.getRenderBox();

        return box2box(box1, box2);
    }
}

function boxToPolygon(pos, w, h) {
    return new Polygon(pos, [
        new Vector(-w / 2, -h / w),
        new Vector(w / 2, -h / w),
        new Vector(w / 2, h / w),
        new Vector(-w / 2, h / w)
    ]);
}