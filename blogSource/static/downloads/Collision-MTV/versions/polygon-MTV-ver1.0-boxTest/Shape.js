// constants
var BIG_NUMBER = 1000000;

// abstract class
class Shape {
    constructor() {
        this.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.strokeStyle = '#000';
    }
    update(dt) {
        throw 'Shape.update() not implemented';
    }

    boundingBox() {
        throw 'Shape.boundingBox() not implemented';
    }

    createPath(context) {
        throw 'Shape.createPath(context) not implemented';
    }

    fill(context) {
        context.save();
        context.fillStyle = this.fillStyle;
        this.createPath(context);
        context.fill();
        context.restore();
    }

    stroke(context) {
        context.save();
        ctx.lineWidth = 1;
        context.strokeStyle = this.strokeStyle;
        this.createPath(context);
        context.stroke();
        context.restore();
    }

    collideWith(shape) {
        throw 'Shape.collidesWith(shape, displacement) not implemented';
    }

    getMinMaxOnAxis(axis) {
        throw 'Shape.getMinMaxOnAxis(axis) not implemented';
    }
}

class Polygon extends Shape {
    constructor(pos, verticesRef, rotation = 0) {
        super();
        this.collisionType = 'polygon'

        this.pos = pos;
        this.rotation = rotation;

        // reference center position
        this.verticesRef = verticesRef;
    }
    collideWith(shape) {
        if (shape.collisionType == 'box') {
            return polygonCollidesWithPolygon(shape.getPolygon(), this);
        }
        else if (shape.collisionType == 'polygon') {
            return polygonCollidesWithPolygon(shape, this);
        } else {
            return polygonCollidesWithCircle(this, shape);
        }
    }
    getVertices() {
        let vertices = [];
        // Clockwise
        for (let i = 0; i < this.verticesRef.length; i++) {
            let p1 = this.verticesRef[i];

            let vec = new Vector(this.pos.x + p1.x, this.pos.y + p1.y);
            vec.rotateRefPoint(this.rotation, this.pos);

            vertices.push(vec);
        }
        return vertices;
    }
    getNorms() {
        let vertices = this.getVertices();
        let norms = [];
        let p1, p2, n;
        // Clockwise
        for (let i = 1; i < vertices.length; i++) {
            let p1 = vertices[i - 1],
                p2 = vertices[i];
            n = new Vector(p2.x - p1.x, p2.y - p1.y).normalL().normalize();
            norms.push(n);
        }

        p1 = vertices[vertices.length - 1];
        p2 = vertices[0];
        n = new Vector(p2.x - p1.x, p2.y - p1.y).normalL().normalize();
        norms.push(n);

        return norms;
    }
    getMinMaxOnAxis(axis) {
        let vertices = this.getVertices();

        let length_arr = vertices.map(v => v.dot(axis));

        return new Projection(Math.min(...length_arr), Math.max(...length_arr));
    }

    createPath(ctx) {
        if (this.verticesRef.length == 0) return;

        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.rotation);

        let points = this.verticesRef;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y)
        }
        ctx.closePath();
    }
}

class Circle extends Shape {
    constructor(pos, radius, rotation = 0) {
        super();
        this.collisionType = 'circle'

        this.pos = pos;
        this.rotation = rotation;
        this.radius = radius;
    }
    collideWith(shape) {
        if (shape.collisionType == 'box') {
            return polygonCollidesWithCircle(shape.getPolygon(), this);
        }
        else if (shape.collisionType == 'polygon') {
            return polygonCollidesWithCircle(shape, this);
        } else {
            return circleCollidesWithCircle(shape, this);
        }
    }
    getMinMaxOnAxis(axis) {
        let dot = this.pos.dot(axis);
        let length_arr = [dot, dot + this.radius, dot - this.radius];

        return new Projection(Math.min(...length_arr), Math.max(...length_arr));
    }

    createPath(ctx) {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, false);
        ctx.closePath();
    }
}

class Box extends Shape {
    constructor(pos, w, h) {
        super();
        this.collisionType = 'box'

        this.pos = pos;
        this.w = w;
        this.h = h;

        this.polygon = new Polygon(this.pos, [
            new Vector(0, 0),
            new Vector(w, 0),
            new Vector(w, h),
            new Vector(0, h)
        ]);
    }
    getPolygon() {
        this.polygon.pos = this.pos;
        return this.polygon;
    }

    collideWith(shape) {
        if (shape.collisionType == 'box') {
            return rectCollidesWithRect(shape, this)
        }
        return this.getPolygon().collideWith(shape)
    }

    createPath(ctx) {
        ctx.beginPath();
        ctx.rect(this.pos.x, this.pos.y, this.w, this.h);
        ctx.closePath();
    }
}

class Projection {
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }
    isOverlap(projection) {
        return this.max > projection.min && projection.max > this.min
    }
    getOverlap(projection) {
        if (!this.isOverlap(projection)) return 0;
        /*
        *(a.min)      *(b.min)          *(a.max)          *(b.max)
        |-------------------------------| projectionA
                      |---------------------------------  | projectionB
        */
        // when projection on left
        if (this.max > projection.max)
            return projection.max - this.min;
        else
            return this.max - projection.min;
    }
}

function rectCollidesWithRect2(boxA, boxB) {
    boxA.cx = boxA.pos.x + boxA.w / 2;
    boxA.cy = boxA.pos.y + boxA.h / 2;

    boxB.cx = boxB.pos.x + boxB.w / 2;
    boxB.cy = boxB.pos.y + boxB.h / 2;

    let dx = boxB.cx - boxA.cx;// x difference between centers
    let dy = boxB.cy - boxA.cy;// y difference between centers
    let aw = (boxB.w + boxA.w) * 0.5;// average width(half width)
    let ah = (boxB.h + boxA.h) * 0.5;// average height(half height)
    let mtv = { x: 0, y: 0 };
    let overlap = 0;
    let axis = null;
    /* If either distance is greater than the average dimension there is no collision. */
    if (Math.abs(dx) > aw || Math.abs(dy) > ah) {
        return { axis: axis, overlap: overlap };
    }
    // 按照佔比來判斷該往哪邊推開，這樣比較合理，不是單比dx、dy的大小
    if (Math.abs(dx / boxA.w) > Math.abs(dy / boxA.h)) {
        if (dx < 0) mtv.x = boxA.pos.x - (boxB.pos.x + boxB.w);// left
        else mtv.x = boxA.pos.x + boxA.w - boxB.pos.x; // right
        axis = new Vector(Math.sign(dx), 0);
        overlap = mtv.x;
    } else {
        if (dy < 0) mtv.y = boxA.pos.y - (boxB.pos.y + boxB.h);// left
        else mtv.y = boxA.pos.y + boxA.h - boxB.pos.y; // right
        axis = new Vector(0, Math.sign(dy));
        overlap = mtv.y;
    }
    overlap = Math.abs(overlap);
    return { axis: axis, overlap: overlap };
}

function rectCollidesWithRect(boxA, boxB) {
    var r1x = { min: boxA.pos.x, max: boxA.pos.x + boxA.w }
    var r1y = { min: boxA.pos.y, max: boxA.pos.y + boxA.h }
    var r2x = { min: boxB.pos.x, max: boxB.pos.x + boxB.w }
    var r2y = { min: boxB.pos.y, max: boxB.pos.y + boxB.h }

    var collided = r1x.max > r2x.min && r1x.min < r2x.max && r1y.max > r2y.min && r1y.min < r2y.max;
    var edgediff = [];
    if (collided) {
        edgediff.push({ x: r1x.min - r2x.max, y: 0 });//1左
        edgediff.push({ x: r1x.max - r2x.min, y: 0 });//2右
        edgediff.push({ x: 0, y: r1y.min - r2y.max });//3上
        edgediff.push({ x: 0, y: r1y.max - r2y.min });//4下
    } else {
        return { axis: null, overlap: 0 };
    }
    edgediff.sort(function (a, b) {
        return Math.sqrt((a.x * a.x + a.y * a.y)) - Math.sqrt((b.x * b.x + b.y * b.y))
    });
    let mtv = edgediff[0] || mtv;
    let overlap = mtv.x + mtv.y;
    let axis = new Vector(mtv.x, mtv.y).norm();
    return { axis: axis, overlap: overlap };
}
/**
 * 
 * @param {shape} shapeA static
 * @param {shape} shapeB 
 */
function polygonCollidesWithPolygon(polygonA, polygonB) {
    let axes = polygonA.getNorms().concat(polygonB.getNorms());
    return getMTV(polygonA, polygonB, axes);
}

/**
 * 
 * @param {shape} polygon static
 * @param {shape} circle
 */
function polygonCollidesWithCircle(polygon, circle) {
    let axes = polygon.getNorms();
    // 多加上一條，圓心到多邊型最近的頂點，連成的axis
    axes.push(getCircleAxisWithPolygon(circle, polygon));
    return getMTV(polygon, circle, axes);
}

/**
 * 
 * @param {shape} circleA static
 * @param {shape} circleB
 */
function circleCollidesWithCircle(circleA, circleB) {
    let dist = circleA.pos.clone().subtract(circleB.pos).length();
    let overlap = (circleA.radius + circleB.radius) - dist;
    let mtv = { axis: null, overlap: 0 };

    // not collision
    if (overlap < 0) {
        return { axis: null, overlap: 0 };
    }
    let axis = circleB.pos.clone().subtract(circleA.pos).normalize();
    return { axis: axis, overlap: overlap };
}

function getCircleAxisWithPolygon(circle, polygon) {
    let v1 = getPointClosestToPolygon(circle.pos, polygon);
    let axis = v1.clone().subtract(circle.pos).normalize();
    return axis;
}

function getPointClosestToPolygon(point, polygon) {
    let min = BIG_NUMBER, length, testPoint, closestPoint;
    let vertices = polygon.getVertices();

    for (var i = 0; i < vertices.length; ++i) {
        testPoint = vertices[i];
        length = Math.sqrt(Math.pow(testPoint.x - point.x, 2) + Math.pow(testPoint.y - point.y, 2));
        if (length < min) {
            min = length;
            closestPoint = testPoint;
        }
    }
    return closestPoint;
}

function getMTV(shapeA, shapeB, axes) {
    let normals = axes;

    let mtv, axisWithMinOverlap, minimumOverlap = BIG_NUMBER;
    let projectionA, projectionB, overlap;
    for (let i = 0; i < normals.length; i++) {
        let axis = normals[i];
        projectionA = shapeA.getMinMaxOnAxis(axis);
        projectionB = shapeB.getMinMaxOnAxis(axis);

        // overlap is positive
        overlap = projectionA.getOverlap(projectionB);
        // if isSeparated return
        if (overlap == 0) {
            mtv = { axis: null, overlap: 0 };
            return mtv;
        }

        // keep minimum overlap
        if (overlap < minimumOverlap) {
            minimumOverlap = overlap;
            axisWithMinOverlap = axis;
        }
    }
    mtv = {
        axis: axisWithMinOverlap,
        overlap: minimumOverlap
    };
    return mtv;
}



// 如過要分離物體
// 當物體B撞到A時，要有一個反向的MTV將它推回去，如果MTV的方向跟向量AB不同方向，導致B物體反而往A裡面推
// 這就是為什麼用dot來判斷是否相反

// 回傳的MTV是polygonB要移動的向量，所以當作用力的方向與B與A的相對位置不一致時，需做反向
// 正確的MTV是跟向量AB同方向，這樣才能正確地把B以最短距離推出A的範圍
// vec(B-A) = vecAB
function separate(shapeA, shapeB, mtv) {
    let D = new Vector(mtv.axis.x * mtv.overlap, mtv.axis.y * mtv.overlap)
    let dist = new Vector(shapeB.pos.x - shapeA.pos.x, shapeB.pos.y - shapeA.pos.y);
    if (dist.dot(D) < 0) D.multiplyScalar(-1);

    shapeB.pos.add(D)
}