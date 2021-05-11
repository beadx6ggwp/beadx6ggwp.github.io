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
        drawString(ctx, this.str, this.x, this.y, "#FFF", 12, "Orbitron", 0, 0, 1);
    }
}