class Player2 extends Entity {
    constructor(config) {
        super(config);

        // 如果要邊跑邊攻擊的話，是不是state要改成陣列
        this.state = 'move';
        this.ismove = false;
        this.facing = 'down';
        this.action = 'idle1';
        this.lastDir = new Vector();

        this.moveSpeed = GetValue(config, 'moveSpeed', 10);
    }

    update(dt) {
        let Alarm = world.Alarm;
        let keys = world.keys;
        // input
        let inputDir = new Vector();
        if (keys['38']) inputDir.y = -1;
        if (keys['40']) inputDir.y = 1;
        if (keys['37']) inputDir.x = -1;
        if (keys['39']) inputDir.x = 1;
        // console.log(Alarm.check('roleCoolDown'))
        // this.state == 'move'
        if (this.state == 'move' && keys['32'] && Alarm.check('roleCoolDown') == null && Alarm.check('roleTime') == null) {
            this.state = 'role';

            let sec = 0.2;
            Alarm.setTime('roleTime', sec * 1000);
            this.vel = this.lastDir.clone().norm().setLength(100 / sec);

            // this.action = 'role';
            // this.animation.setStartEnd(this.aniData.action[this.action])
        }

        // if(目前沒其他狀態 && 按下 && 攻擊CD到了 && 現在還沒攻擊)
        // console.log(this.action)
        if (this.state == 'move' && keys['90'] && Alarm.check('attackCoolDown') == null) {
            this.state = 'attack';
            // console.log('press atk')

            this.action = 'atk1';
            this.animation.setStartEnd(this.aniData.action[this.action])
            this.animation.currentFrame = 0;
            this.animation.repeat = false;
            this.animation.setSpeed(15);

            let atkConfig = this.createAtkConfig();
            atkConfig.animation = null;

            let atkObj = new Entity(atkConfig);
            atkObj.survivalTime = this.animation.animationSequence.length * this.animation.frameSleep / 1000;
            this.world.addGameObj(atkObj);

            // && Alarm.check('attack') == null
            // Alarm.setTime('attack', 1 * 1000);// 僵直時間
            this.vel.multiplyScalar(0);
            this.ismove = false;
        }
        if (this.action == 'atk1' && keys['90'] && this.animation.currentFrame > 3) {
            this.state = 'attack';

            this.action = 'atk2';
            this.animation.setStartEnd(this.aniData.action[this.action])
            this.animation.currentFrame = 0;
            this.animation.repeat = false;
            this.animation.setSpeed(12);

            let atkConfig = this.createAtkConfig();
            atkConfig.animation = null;

            let atkObj = new Entity(atkConfig);
            atkObj.survivalTime = this.animation.animationSequence.length * this.animation.frameSleep / 1000;
            this.world.addGameObj(atkObj);

            this.vel.multiplyScalar(0);
            this.ismove = false;
        }
        console.log(this.action,this.animation.currentFrame)
        if (this.action == 'atk2' && keys['90'] && this.animation.currentFrame > 4) {
            this.state = 'attack';

            this.action = 'atk3';
            this.animation.setStartEnd(this.aniData.action[this.action])
            this.animation.currentFrame = 0;
            this.animation.repeat = false;
            this.animation.setSpeed(10);

            let atkConfig = this.createAtkConfig();
            atkConfig.animation = null;

            let atkObj = new Entity(atkConfig);
            atkObj.survivalTime = this.animation.animationSequence.length * this.animation.frameSleep / 1000;
            this.world.addGameObj(atkObj);

            this.vel.multiplyScalar(0);
            this.ismove = false;
        }

        if (this.state == 'move' && keys['88'] && Alarm.check('shootCoolDown') == null && Alarm.check('shoot') == null) {
            this.state = 'shoot';

            let dir = this.lastDir.clone().norm();
            let atkConfig = this.createAtkConfig();

            atkConfig.vel = {
                x: dir.x * 400,
                y: dir.y * 400
            };
            atkConfig.animation.speed = 8;

            let atkObj = new Entity(atkConfig);
            atkObj.survivalTime = atkObj.animation.animationSequence.length * atkObj.animation.frameSleep / 1000;
            this.world.addGameObj(atkObj);

            Alarm.setTime('shoot', 0.1 * 1000);
            this.vel.multiplyScalar(0);
            this.ismove = false;
        }

        switch (this.state) {
            case 'move':
                this.handleMove(inputDir)
                break;
            case 'role':
                // createParticles(this.world, this.pos.x, this.pos.y, 3)
                if (Alarm.check('roleTime') >= 0) {
                    Alarm.setTime('roleCoolDown', 0.5 * 1000);
                    this.vel.multiplyScalar(0);
                    this.state = 'move';
                }
                break;
            case 'attack':
                if (this.animation.finish) {
                    Alarm.setTime('attackCoolDown', 0.3 * 1000);
                    this.state = 'move';

                    this.animation.finish = false;
                    this.animation.repeat = true;

                    this.action = 'idle1';
                    this.animation.setStartEnd(this.aniData.action[this.action])
                    this.animation.setSpeed(10);
                }
                break;
            case 'shoot':
                if (Alarm.check('shoot') >= 0) {
                    Alarm.setTime('shootCoolDown', 0.3 * 1000);
                    this.state = 'move';
                }
                break;
        }

        super.update(dt);
    }
    draw(ctx) {
        ctx.save();
        // start
        ctx.translate(this.pos.x, this.pos.y);

        ctx.restore();

        super.draw(ctx);
    }

    handleMove(inputDir) {
        let keys = this.world.keys;
        let moveSpeed = this.moveSpeed;
        if (keys['38']) {
            // this.facing = 'up';
        }
        else if (keys['40']) {
            // this.facing = 'down';
        }
        if (keys['37']) {
            this.facing = 'left';
            this.scaleX = -1;
        }
        else if (keys['39']) {
            this.facing = 'right';
            this.scaleX = 1;
        }

        // 處理移動，並使每個8方向速度一致
        if (inputDir.x != 0 || inputDir.y != 0) {
            // debugger
            this.ismove = true;
            this.lastDir = inputDir.clone();
            this.vel = inputDir.norm().setLength(moveSpeed);
        } else {
            this.ismove = false;
            this.vel.multiplyScalar(0);
        }

        this.action = `${this.ismove ? 'walk' : 'idle1'}`;
        this.animation.setStartEnd(this.aniData.action[this.action])
    }

    createAtkConfig() {
        let dir = this.lastDir.clone().norm();
        let mycollider = this.collider.getBoundingBox();
        let scale = swordAnimation.renderScale;
        let box = new BoundingBox(-15 * scale, -15 * scale, 30 * scale, 30 * scale)// hitbox
        let collider = {
            // polygon: [{ x: box.left, y: box.top }, { x: box.left + box.width, y: box.top }, { x: box.left + box.width, y: box.top + box.height }, { x: box.left, y: box.top + box.height }]
            // x: -15 * scale, y: -15 * scale,
            // w: 30 * scale, h: 30 * scale
            radius: 25
        };
        let atkConfig = {
            name: 'player_atk',
            pos: {
                x: this.pos.x + dir.x * mycollider.width,
                y: this.pos.y + dir.y * (box.height / 2 + (dir.y > 0 && dir.y != 0 ? 5 : -5)) * (1 - Math.abs(dir.x)) //1-dir.x 防止斜者打
            },
            survivalMode: true,
            collider: collider,
            collisionToMap: false,
            bounceWithMap: false,
            animation: swordAnimation,
            zindex: this.zindex,
            hitActionData: {
                parent: this,
                target: ['enemy1'],
                action: function (ent1, ent2) {
                    // debugger
                    let collider1 = ent1.getCollisionBox();
                    let collider2 = ent2.getCollisionBox();
                    // debugger
                    let box1 = collider1.getBoundingBox();
                    let box2 = collider2.getBoundingBox();

                    if (box1.left + box1.width < box2.left || box2.left + box2.width < box1.left ||
                        box1.top + box1.height < box2.top || box2.top + box2.height < box1.top)
                        return;
                    let mtv = collider1.collideWith(collider2);
                    if (mtv.axis) {
                        // 對Entity加入Actin系統，在敵人被往右打的時候加入 vec(x, y)之類的加速度，持續n秒
                        let p1 = ent1.pos.clone();
                        let p2 = ent2.pos.clone();
                        let dist = p2.clone().subtract(p1).norm();
                        let playerDir = ent1.hitActionData.parent.lastDir.clone().norm();
                        let maxAngle = 30;
                        // 先用dot判斷夾角，再用cross判斷dist跟dir是順時針關係還是逆時針，來決定要往哪個方向限制
                        // if (Math.acos(playerDir.dot(dist)) * 180 / Math.PI > maxAngle) {
                        //     let rotateDir = Math.sign(playerDir.cross(dist));
                        //     dist = playerDir.rotate(rotateDir * maxAngle * Math.PI / 180);
                        // }
                        let ang1 = dist.getAngleDeg();
                        let ang2 = playerDir.getAngleDeg();
                        let theta = ang2 - ang1;
                        if (Math.abs(theta) > maxAngle) {
                            dist.rotateDeg(theta);
                        }
                        // if()
                        ent2.pos.add(dist.multiplyScalar(1));
                        ent2.hit(1);
                        // ent2.isDead = true;
                    }
                }
            }
        };

        atkConfig.animation.scaleX = Math.sign(dir.x) || 1;
        atkConfig.animation.rotate = 0;
        if (dir.y != 0 && dir.x == 0) {
            atkConfig.animation.rotate = dir.y > 0 ? 90 : -90;
        }

        return atkConfig;
    }
}