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

    // http://www.ifreesite.com/color/ 7 col 9 col
    this.colorType = 0;
    this.colorType_old = 0;
    // outside -> inside 
    // 淡 -> 深
    this.colorArr = [["rgba(222, 222, 222, 0.7)","rgba(255, 255, 255, 0.3)"],// 傷害色 
                    ["rgba(0, 0, 204, 0.5)","rgba(0, 0, 255, 0.5)"],// t1
                    ["rgba(204, 0, 0, 0.5)","rgba(255, 0, 0, 0.5)"],// t2
                    ["rgba(0, 235, 0, 0.5)","rgba(82, 255, 82, 0.5)"]];// t3

    this.ready = false;
    this.dead = false;

    this.slow = false;
    this.slowSpeed = 0.3;

    this.flash = false;
    this.flashLength = 50;
    this.flashTime = 0;
    
    // r = r + r*rank
    //default
    if(this.type == 1){
        this.colorType = 1;
        if(rank == 1){
            this.speed = 2;
            this.r = 13;
            this.hp = 1;
        }
        if(rank == 2){
            this.speed = 2;
            this.r = 26;
            this.hp = 2;
        }
        if(rank == 3){
            this.speed = 2;
            this.r = 50;
            this.hp = 3;
        }
        if(rank == 4){
            this.speed = 2;
            this.r = 70;
            this.hp = 4;
        }
    }
    //stronger, faster default
    if(this.type == 2){
        this.colorType = 2;
        if(rank == 1){
            this.speed = 4;
            this.r = 10;
            this.hp = 2;
        }
        if(rank == 2){
            this.speed = 4;
            this.r = 20;
            this.hp = 3;
        }
        if(rank == 3){
            this.speed = 3;
            this.r = 40;
            this.hp = 3;
        }
        if(rank == 4){
            this.speed = 3;
            this.r = 60;
            this.hp = 4;
        }
    }
    //slow,hard to kill
    if(this.type == 3){
        this.colorType = 3;
        if(rank == 1){
            this.speed = 1.5;
            this.r = 13;
            this.hp = 5;
        }
        if(rank == 2){
            this.speed = 1.5;
            this.r = 26;
            this.hp = 6;
        }
        if(rank == 3){
            this.speed = 1.25;
            this.r = 40;
            this.hp = 7;
        }
        if(rank == 4){
            this.speed = 1.0;
            this.r = 55;
            this.hp = 8;
        }
    }

    this.x = random(canvas.width/4,canvas.width*3/4);
    this.y = -this.r;    

    //this.setDir(random(20,160));
    this.angle = random(20,160);
    this.rad = this.angle * Math.PI / 180;
    this.dx = Math.cos(this.rad) * this.speed;
    this.dy = Math.sin(this.rad) * this.speed;
    
    //------------------
    this.setDir = function(angle){
        this.angle = angle;
        this.rad = angle * Math.PI / 180;
        this.dx = Math.cos(this.rad) * this.speed;
        this.dy = Math.sin(this.rad) * this.speed;
    }
    this.hit = function(){
        this.hp--;
        if(this.hp <= 0) this.dead = true;

        //避免colorType在回復之前就把colorType_old給清掉
        //會導致colorType,colorType_old 都是傷害色
        //發身在兩發以上一起打中時
        if(this.flash) return;
        this.colorType_old = this.colorType;
        this.colorType = 0;
        this.flash = true;
        this.flashTime = new Date().getTime();
    }
    this.break = function(){
        if( this.rank == 1) return;

        var amount = 0;
        if(this.type == 1){
            amount = 4;
        }
        if(this.type == 2){
            amount = 3;
        }
        if(this.type == 3){
            amount = 2;
        }

        for(var i = 0;i < amount;i++){
            var ee = new Enemy(this.type, this.rank - 1);
            ee.x = this.x;
            ee.y = this.y;
            if(this.ready)
                ee.setDir(random(0,360));
            else
                ee.setDir(random(20,180));
            enemies.push(ee);
        }
    }

    this.update = function(){
        if(this.slow){
            this.x += this.dx * this.slowSpeed;
            this.y += this.dy * this.slowSpeed;
        }
        else{
            this.x += this.dx;
            this.y += this.dy;
        }

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

        //flashing
        if(this.flash && 
           new Date().getTime() - this.flashTime > this.flashLength){
            this.colorType = this.colorType_old;
            this.flashTime = 0;
            this.flash = false;
        }
    }

    this.render = function(ctx){        
        ctx.save();

        ctx.fillStyle = this.colorArr[this.colorType][0];
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = this.colorArr[this.colorType][1];
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r*0.8, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }
}