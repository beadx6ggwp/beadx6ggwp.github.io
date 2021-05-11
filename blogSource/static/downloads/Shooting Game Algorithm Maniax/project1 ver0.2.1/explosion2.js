function Explosion2(x, y, r, maxRadius){
    this.x = x;
    this.y = y;
    this.r = r;
    this.minR = r;
    this.maxR = maxRadius;
    this.count = 0;

    this.color = "rgba(255, 205, 0,";
    this.alpha = 1;

    this.width;
    this.maxWidth = maxRadius/5;
    //https://www.w3schools.com/colors/colors_shades.asp
    this.colorArr = [["rgba(255, 255, 0,"],//y
                      "rgba(255, 153, 0,"];//o
    this.colorPoint = 0;

    this.dead = false;

    //----------------------
    this.clone = function(){
        if(this.dead && !this.count){
            var explo = new Explosion2(this.x,this.y,this.maxR,this.maxR + 15);
            explo.count++;
            explo.colorPoint++;
            explosions.push(explo);
        }
    }
    this.update = function(){
        this.r++;

        if(this.r >= this.maxR){
            this.dead = true;
            this.clone();
        }

        
        this.alpha = 1 - map(this.r, 0, this.maxR, 0, 0.3);
        this.width = this.maxWidth - map(this.r, this.minR, this.maxR, 0, this.maxWidth);
        // this.width = this.maxWidth - map(this.r, 0, this.maxR - this.minR, 0, this.maxWidth); 連爆
    }

    this.render = function(ctx){
        ctx.save();

        ctx.strokeStyle = this.colorArr[this.colorPoint] + this.alpha+")";
        ctx.lineWidth = this.width;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
        ctx.stroke();

        ctx.restore();
    }
}