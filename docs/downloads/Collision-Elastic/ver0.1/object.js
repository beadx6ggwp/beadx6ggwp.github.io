function Particle(x, y, radius, color) {
    this.pos = new Vector(x, y);
    this.vel = new Vector();
    this.r = radius;
    this.color = color;
    this.mass = 1;
    this.opacity = 0;

    this.update = function (dt) {
        this.pos.add(this.vel);
        let nowOpacity = this.vel.length() / force;
        if (this.opacity - nowOpacity > 0) {
            this.opacity -= 0.02;
            this.opacity = Math.max(0, this.opacity);
        } else {
            this.opacity += 0.02;
            this.opacity = Math.min(1, this.opacity);
        }
    }
    this.draw = function (ctx) {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2, false);

        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.strokeStyle = this.color;
        ctx.stroke();
        ctx.closePath();
    }
}

function Particles() {
    this.list = [];

    this.update = function (dt) {
        this.list.forEach((obj) => {
            obj.update(dt);

            for (let i = 0; i < this.list.length; i++) {
                if (this.list[i] === obj) continue;
                if (CircleCollision(obj, this.list[i])) {
                    ElasticCollisionDot(obj, this.list[i]);
                    continue;
                }
            }

            if (obj.pos.x - obj.r < 0 && obj.vel.x < 0 || obj.pos.x + obj.r > width && obj.vel.x > 0) obj.vel.x *= -1;
            if (obj.pos.y - obj.r < 0 && obj.vel.y < 0 || obj.pos.y + obj.r > height && obj.vel.y > 0) obj.vel.y *= -1;
        });

    }
    this.draw = function (ctx) {
        this.list.forEach((obj) => {
            obj.draw(ctx);
        });
    }
}


function CircleCollision(obj1, obj2) {
    let dist = new Vector(obj2.pos.x - obj1.pos.x, obj2.pos.y - obj1.pos.y);
    let radius = obj2.r + obj1.r;
    return dist.lengthSq() < radius * radius;
}
function ElasticCollision(obj1, obj2) {
    let VelDiff = new Vector(obj1.vel.x - obj2.vel.x, obj1.vel.y - obj2.vel.y);
    let dist = new Vector(obj2.pos.x - obj1.pos.x, obj2.pos.y - obj1.pos.y);
    if (VelDiff.x * dist.x + VelDiff.y * dist.y >= 0) {
        let phi = (Math.atan2(obj2.pos.y - obj1.pos.y, obj2.pos.x - obj1.pos.x));
        let v1i = obj1.vel.length();
        let v2i = obj2.vel.length();
        let ang1 = obj1.vel.getAngle();
        let ang2 = obj2.vel.getAngle();
        let m1 = obj1.mass;
        let m2 = obj2.mass;

        let v1xr = v1i * Math.cos(ang1 - phi);
        let v1yr = v1i * Math.sin(ang1 - phi);
        let v2xr = v2i * Math.cos(ang2 - phi);
        let v2yr = v2i * Math.sin(ang2 - phi);

        let v1fxr = ((m1 - m2) * v1xr + (m2 + m2) * v2xr) / (m1 + m2);
        let v2fxr = ((m1 + m1) * v1xr + (m2 - m1) * v2xr) / (m1 + m2);
        let v1fyr = v1yr;
        let v2fyr = v2yr;

        let v1fx = Math.cos(phi) * v1fxr + Math.cos(phi + Math.PI / 2) * v1fyr;
        let v1fy = Math.sin(phi) * v1fxr + Math.sin(phi + Math.PI / 2) * v1fyr;
        let v2fx = Math.cos(phi) * v2fxr + Math.cos(phi + Math.PI / 2) * v2fyr;
        let v2fy = Math.sin(phi) * v2fxr + Math.sin(phi + Math.PI / 2) * v2fyr;

        obj1.vel.x = v1fx;
        obj1.vel.y = v1fy;
        obj2.vel.x = v2fx;
        obj2.vel.y = v2fy;
    }

}

function ElasticCollisionDot(obj1, obj2) {
    let VelDiff = new Vector(obj1.vel.x - obj2.vel.x, obj1.vel.y - obj2.vel.y);
    let dist = new Vector(obj2.pos.x - obj1.pos.x, obj2.pos.y - obj1.pos.y);
    //console.log(VelDiff.x * dist.x , VelDiff.y * dist.y);
    if (VelDiff.dot(dist) >= 0) {
        let un = new Vector(obj2.pos.x - obj1.pos.x, obj2.pos.y - obj1.pos.y).norm();
        let ut = un.normalL();
        let m1 = obj1.mass;
        let m2 = obj2.mass;

        let v1n = obj1.vel.dot(un);
        let v1t = obj1.vel.dot(ut);
        let v2n = obj2.vel.dot(un);
        let v2t = obj2.vel.dot(ut);
        // new vel
        let v1nf = ((m1 - m2) * v1n + (m2 + m2) * v2n) / (m1 + m2);
        let v1tf = v1t;
        let v2nf = ((m1 + m1) * v1n + (m2 - m1) * v2n) / (m1 + m2);
        let v2tf = v2t;

        let v1 = new Vector(v1nf * un.x + v1tf * ut.x, v1nf * un.y + v1tf * ut.y);
        let v2 = new Vector(v2nf * un.x + v2tf * ut.x, v2nf * un.y + v2tf * ut.y);

        obj1.vel = v1;
        obj2.vel = v2;
    }
}