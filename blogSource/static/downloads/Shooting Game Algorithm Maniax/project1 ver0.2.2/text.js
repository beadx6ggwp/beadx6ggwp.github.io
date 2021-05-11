function Text(x,y,str,timeLength){
    this.x = x;
    this.y = y;

    this.str = str;

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
        drawString(ctx, this.str, this.x, this.y, color, 12, "Orbitron", 0, 0, 1);

        ctx.restore();
    }
}