function Enemy(type,rank){
    // property
    this.x;
    this.y;
    this.r;

    this.dx;
    this.dy;
    this.rad;
    this.speed = 2;

    this.hp;
    this.type = type;
    this.rank = rank;

    //http://www.ifreesite.com/color/
    this.color1;//7 col
    this.color2;//9 col

    this.ready = false;
    this.dead = false;

    //default
    if(this.type == 1){
        this.color1 = "rgba(0, 0, 204, 0.5)";
        this.color2 = "rgba(0, 0, 255, 0.5)";
        if(rank == 1){
            this.speed = 2;
            this.r = 10;
            this.hp = 1;
        }
    }
    //stronger, faster default
    if(this.type == 2){
        this.color1 = "rgba(204, 0, 0, 0.5)";
        this.color2 = "rgba(255, 0, 0, 0.5)";
        if(rank == 1){
            this.speed = 4;
            this.r = 10;
            this.hp = 2;
        }
    }
    //slow,hard to kill
    if(this.type == 3){
        this.color1 = "rgba(0, 235, 0, 0.5)";
        this.color2 = "rgba(82, 255, 82, 0.5)";
        if(rank == 1){
            this.speed = 1.5;
            this.r = 10;
            this.hp = 5;
        }
    }

    this.x = random(canvas.width/4,canvas.width*3/4);
    this.y = -this.r;
    this.angle = random(20,160);
    this.rad = this.angle * Math.PI / 180;
    this.dx = Math.cos(this.rad) * this.speed;
    this.dy = Math.sin(this.rad) * this.speed;

    //------------------
    this.hit = function(){
        this.hp--;
        if(this.hp <= 0) this.dead = true;
    }

    this.update = function(){
        this.x += this.dx;
        this.y += this.dy;

        //確定是否進入視窗範圍
        if(!this.ready){
            if( !(this.x < -this.r || this.x > canvas.width + this.r ||
                  this.y < -this.r || this.y > canvas.height + this.r)){
                this.ready = true;
            }
        }

        //check edge
        if(this.x < this.r && this.dx < 0) this.dx = -this.dx;
        if(this.y < this.r && this.dy < 0) this.dy = -this.dy;
        if(this.x > canvas.width - this.r && this.dx > 0) this.dx = -this.dx;
        if(this.y > canvas.height - this.r && this.dy > 0) this.dy = -this.dy;
    }

    this.render = function(ctx){        
        ctx.save();

        ctx.fillStyle = this.color1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = this.color2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r*0.8, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }
}