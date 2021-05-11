function Text(x,y,str,timeLength,textSize){
    this.x = x;
    this.y = y;

    this.str = str;
    this.textsize = 14
    if(textSize)this.textsize = textSize;

    this.timeLength = timeLength;
    this.startTIme = new Date().getTime();

    this.dead = false;
    //------------------
    this.update = function(){
        if(new Date().getTime() - this.startTIme > this.timeLength){
            this.dead = true;
        }
    }

    this.render = function(ctx){
        ctx.save();
        
        var alpha = Math.sin(Math.PI * (new Date().getTime() - this.startTIme) / this.timeLength);
        var color = "rgba(255,255,255,"+alpha+")";
        drawString(ctx, this.str, this.x, this.y, color, this.textsize, "Orbitron", 0, 0, 1);

        ctx.restore();
    }
}