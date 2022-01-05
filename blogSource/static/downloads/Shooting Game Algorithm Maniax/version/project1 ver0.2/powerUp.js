function PowerUp(type, x, y){    
    // property
    this.x = x;
    this.y = y;
    this.r = 5;

    this.dx = 0;
    this.dy = 2;
    
    this.outside = false;

    this.colorArr = [["#DDA0DD","rgba(255, 194, 204, 0.7)"],
                     ["#FFD700","rgba(255, 255, 0, 0.7)"]];
    this.colorType = 0;
    this.type = type;
    /*
    1 -> +1 life
    2 -> +1 power
    3 -> +2 power
    */
    switch(this.type){
        case 1:
            this.r = 5;
            this.colorType = 0;
            break;
        case 2:
            this.r = 5;
            this.colorType = 1;
            break;
        case 3:
            this.r = 8;
            this.colorType = 1;
            break;
    }

    //function
    this.update = function(){
        this.y += this.dy

        if(this.y > canvas.height - this.r){
            this.outside = true;
        }
    }
    this.render = function(ctx){
        ctx.save();

        ctx.fillStyle = this.colorArr[this.colorType][0];
        ctx.fillRect(this.x - this.r, this.y - this.r, 
                     this.r * 2, this.r * 2);
        
        ctx.fillStyle = this.colorArr[this.colorType][1];
        ctx.fillRect(this.x - this.r*0.5, this.y - this.r*0.5, 
                     this.r*0.5 * 2, this.r*0.5 * 2);

        ctx.restore();
    }
}