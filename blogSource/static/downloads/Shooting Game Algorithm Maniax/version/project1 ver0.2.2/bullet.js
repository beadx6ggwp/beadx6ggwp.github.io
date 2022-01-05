function Bullet(x,y,r,angle,sp){
    // property
    this.x = x;
    this.y = y;
    this.r = r;

    this.rad = angle * Math.PI / 180;
    this.speed = sp ? sp : 10; // 未輸入設定為10
    this.dx = Math.cos(this.rad) * this.speed;
    this.dy = Math.sin(this.rad) * this.speed;

    this.outside = false;

    this.color1 = "yellow";

    //-----------------------
    this.update = function(){
        this.x += this.dx;
        this.y += this.dy;

        //cheak edge
        if(this.x < -this.r || this.x > canvas.width + this.r ||
           this.y < -this.r || this.y > canvas.height + this.r){
                this.outside = true;
           }
    }

    this.render = function(ctx){
        ctx.save();

        ctx.fillStyle = this.color1;
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.r,0,Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}