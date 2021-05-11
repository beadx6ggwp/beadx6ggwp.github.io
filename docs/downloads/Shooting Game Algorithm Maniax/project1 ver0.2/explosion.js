function Explosion1(x, y, r, maxRadius){
    this.x = x;
    this.y = y;
    this.r = r;
    this.minR = r;
    this.maxR = maxRadius; // this.r + 30

    this.color = "rgba(255, 255, 255,";
    this.alpha = 1;

    this.width;
    this.maxWidth = maxRadius/7;

    this.dead = false;

    //----------------------
    this.update = function(){
        this.r++;
        if(this.r >= this.maxR) 
            this.dead = true;
        
        this.alpha = 1 - map(this.r, 0, this.maxR, 0, 1);
        this.width = this.maxWidth - map(this.r, this.minR, this.maxR, 0, this.maxWidth);
    }

    this.render = function(ctx){
        ctx.strokeStyle = this.color + this.alpha+")";
        ctx.lineWidth = this.width;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
        ctx.stroke();
    }
}