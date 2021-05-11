class Particle extends Entity {
    constructor(config) {
        super(config);
        this.name = 'particle';

        this.radius = 20;
        this.timeMax = 0.5;
        this.colors = ['255,180,127', '255,127,127', '255,255,0'];
        // let color = this.colors[randomInt(0, this.colors.length)];
        this.color = this.colors[randomInt(0, this.colors.length - 1)];

        this.survivalMode = true;
        this.survivalTime = random(0, this.timeMax);

    }

    update(dt) {
        super.update(dt);
    }
    draw(ctx) {
        ctx.save();

        let r = Ratio(this.survivalTime, 0, this.timeMax, 0, this.radius);
        let alpha = Ratio(this.survivalTime, 0, this.timeMax, 0.5, 1);
        ctx.fillStyle = `rgba(${this.color},${alpha})`;
        ctx.beginPath();
        // ctx.arc(this.pos.x, this.pos.y, r, 0, 2 * Math.PI);
        ctx.rect(this.pos.x - r / 2, this.pos.y - r / 2, r, r);
        ctx.fill();

        super.draw(ctx);
        ctx.restore();
    }
}

function createParticles(world, x, y, num) {
    for (let i = 0; i < num; i++) {
        let config = {
            pos: { x: x, y: y },
            zindex: 9
        }
        let p = new Particle(config);
        p.vel.setLength(random(50, 100));
        p.vel.setAngleDeg(random(0, 360));

        world.addGameObj(p);
    }
}