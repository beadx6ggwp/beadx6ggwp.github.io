
function Ship(){
    this.pos = new Victor(canvas.width/2,canvas.height/2);
    this.r = 20;
    this.heading = 0;
    this.rotation = 0;
    this.vel = new Victor(0,0);
    this.maxvel = 10;
    this.superTime = 180;
    this.superCount = this.superTime;
    playSound(sndSrc[1],0.5);
    
        
    this.boost = function(){
        var force = new Victor(Math.cos(this.heading),Math.sin(this.heading));
        this.vel.add(force.multiply(new Victor(0.1,0.1)));
    }

    this.update = function(){
        this.pos.add(this.vel);
        this.vel.multiply(new Victor(0.99,0.99));        
        this.edge();
        
        if(this.superCount > 0) {
            this.superCount--;
        }
        //console.log(this.vel.length());
    }

    this.render = function(){
        ctx.save();
        
        //setCanvas
        ctx.translate(this.pos.x,this.pos.y);
        ctx.rotate(this.heading+PI/2);
        //my tri is 90
        //so need add 90 to 0
        //rotate is clockwise
        
        //draw
        drawTriangle(-this.r,this.r, 0,-this.r, this.r,this.r);
        var color = random(Ratio(180-this.superCount, 0, this.superTime, 0, 255), 255);
        ctx.strokeStyle = "rgb("+255+","+color+","+color+")";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fill()

        /*
        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, 2*PI);      
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 1;
        ctx.stroke();       
        ctx.closePath();

        //center
        ctx.beginPath();
        ctx.fillStyle = "#F00"
        ctx.fillRect(-1,-1,1,1);
        ctx.closePath();
        */
        
        ctx.restore();
    }
    
    this.edge = function(){
        if(this.pos.x > canvas.width + this.r){
            this.pos.x = -this.r;
        }else if(this.pos.x < -this.r){
            this.pos.x = canvas.width + this.r;
        }
        
        if(this.pos.y > canvas.height + this.r){
            this.pos.y = -this.r;
        }else if(this.pos.y < -this.r){
            this.pos.y = canvas.height + this.r;
        }
    }

    

    this.collision = function(target){
        if(this.superCount > 0)return false;

        var d = Math.sqrt((target.pos.x-this.pos.x)*(target.pos.x-this.pos.x) + (target.pos.y-this.pos.y)*(target.pos.y-this.pos.y));
        if(d < target.r + this.r){
            return true;
        }
        return false;
    }
    
    this.turn = function(){
        this.heading += this.rotation;
    }
    this.setRotation = function(angle){
        this.rotation = +angle;
        //console.log(this.vel);
    }
}