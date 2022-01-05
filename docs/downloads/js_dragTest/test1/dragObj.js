class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    dist(point) {
        let dx = point.x - this.x;
        let dy = point.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    clone() {
        return new Point(this.x, this.y);
    }
}

class Rect {
    constructor(x, y, w, h) {
        this.pos = new Point(x, y);
        this.w = w;
        this.h = h;
    }

    constains(point) {
        return (point.x >= this.pos.x &&
            point.x <= this.pos.x + this.w &&
            point.y >= this.pos.y &&
            point.y <= this.pos.y + this.h);
    }
    intersects(range) {
        return !(this.pos.x + this.w < range.pos.x ||
            this.pos.x > range.pos.x + range.w ||
            this.pos.y + this.h < range.pos.y ||
            this.pos.y > range.pos.y + range.h);
    }
    getCenter() {
        return new Point(this.pos.x + this.w / 2, this.pos.y + this.h / 2);
    }

    show(ctx, style = "#FFF", fill) {
        if (fill) {
            ctx.fillStyle = style;
            ctx.fillRect(this.pos.x, this.pos.y, this.w, this.h);
        }
        else {
            ctx.strokeStyle = style;
            ctx.strokeRect(this.pos.x, this.pos.y, this.w, this.h);
        }


    }
}

class Container {
    constructor(rect) {
        this.rect = rect;
        this.objs = [];
    }
}