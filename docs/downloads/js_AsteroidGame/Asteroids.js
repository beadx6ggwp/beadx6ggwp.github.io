

function Asteroid(pos,r){
    this.max = 80;
    this.min = 20;
    if(pos){
        this.pos = new Victor(0,0).copy(pos);
    }else{
        this.pos = new Victor(random(0,canvas.width),random(0,canvas.height));
    }
    if(r){
        this.r = r/2;
    }else{
        this.r = random(this.min,this.max);
    }

    this.turnTotal = random(5,15);

    this.velMuit = Math.random() * (3-1) + 1;//min:1,max3
    this.vel = new Victor(Math.random(),Math.random())
    .multiply(new Victor(this.velMuit,this.velMuit));

    this.offset = [];
    for(var i = 0;i < this.turnTotal;i++){
        this.offset[i] = random(-this.r/3, this.r/3);
    }

    this.break = function(){        
        var t = [];
        t[0] = new Asteroid(this.pos,this.r);
        t[1] = new Asteroid(this.pos,this.r);
        return t;
    }

    this.update = function(){
        this.pos.add(this.vel);
        this.edge();
    }

    this.render = function(){
        ctx.save();
        
        //setCanvas
        ctx.translate(this.pos.x,this.pos.y);
        ctx.rotate(0);

        //draw
        var moveTo = true;
        ctx.beginPath();
        for(var i = 0; i < this.turnTotal;i++){
            //逆時針counterclockwise
            var angle = Ratio(i, 0, this.turnTotal, 0, PI*2);
            var r = this.r + this.offset[i];
            var x = r * Math.sin(angle);
            var y = r * Math.cos(angle);
            if(moveTo){
                ctx.moveTo(x,y);
                moveTo = false;
            }else{
                ctx.lineTo(x,y);
            }

        }                                              
        ctx.closePath();
        ctx.strokeStyle = "#FFF";
        ctx.stroke();      

        /*
        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, 2*PI);      
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.stroke();       
        ctx.closePath();

        //center
        ctx.fillStyle = "#F00"
        ctx.fillRect(-1,-1,1,1);
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
}