function Bullet(target, angle){
    this.pos = new Victor(target.x,target.y);
    this.r = 3;
    this.sp = 10;
    this.angle = angle;
    this.vel = new Victor(Math.cos(this.angle), Math.sin(this.angle));
    this.vel.multiply(new Victor(15,15));
    
    this.update = function(){
        this.pos.add(this.vel);
    }

    this.render = function(){
        ctx.save();
        ctx.beginPath();        
        ctx.arc(this.pos.x,this.pos.y,this.r,0,PI*2);
        ctx.fillStyle = "rgb("+ random(127,255) +","+ random(127,255) +","+ random(127,255) +")";
        ctx.fill();
        
        ctx.closePath();
        ctx.restore();
    }
    this.edge = function(){
        if(this.pos.x > canvas.width + this.r || this.pos.x < -this.r){
            return true;
        }        
        if(this.pos.y > canvas.height + this.r || this.pos.y < -this.r){
            return true;
        }
        return false;
    }

    this.collision = function(target){
        var d = Math.sqrt((target.pos.x-this.pos.x)*(target.pos.x-this.pos.x) + (target.pos.y-this.pos.y)*(target.pos.y-this.pos.y));
        if(d < target.r + this.r){
            return true;
        }
        return false;
    }

}