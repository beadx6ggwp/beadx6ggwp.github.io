var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

var t, loop;
var size, s, food;

function main(){
    clearTimeout(t);
    loop = true;
    console.log("Start");
    size = 20
    s = new snake(size);
    getfood();
    Game();
}

function Game() {
    //draw background
    ctx.fillStyle="#333";//777
    ctx.fillRect(0,0,canvas.width,canvas.height);
    
     
    s.update();
    s.draw();    
  
    if(s.eat(food)){
      getfood();
    }
    ctx.fillStyle = "#F00";
    ctx.fillRect(food.x,food.y,size,size);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(food.x,food.y,size,size);
    
    ctx.fillStyle = "yellow";
    ctx.font="30px Verdana";
    ctx.fillText("Score:"+s.total,20,40);
    
    if(s.dead){
        ctx.fillStyle = "#yellow";
        ctx.font="50px Verdana";
        ctx.fillText("Game Over",250,150);
        ctx.fillText("Press R to restart",200,250)
    }
    
    if(loop){ t = setTimeout(Game,1000/10); }
    //clearTimeout(t) stop game
}

function random(max,min){
	return Math.round(Math.random()*(max-min)+min);
}

function getfood(){
    food = getloc();
    console.log(food);
}
function getloc(){    
    var cols = canvas.width/size;
    var rows = canvas.height/size;
    return new point(Math.floor(random(0, cols - 1))*20, Math.floor(random(0, rows - 1))*20);
}


function point(x, y){
    this.x = x;
    this.y = y;
}

function snake(size){
    this.p = getloc();
    this.xspeed = 0;
    this.yspeed = 1;
    this.size = size;
    this.tail = [];
    this.total = 0;
    this.dead = false;
    
    this.eat = function(target){
        var d = Math.sqrt( Math.pow((target.x - this.p.x),2) + Math.pow((target.y - this.p.y),2) );
        if(d<1){
            this.total++;
            return true;
        }
        return false;
    }
    
    this.dir = function(x, y){
        this.xspeed = x;
        this.yspeed = y;
    }    
    
    this.death = function() {
        for (var i = 0; i < this.tail.length; i++) {
          var pos = this.tail[i];
          var d = Math.sqrt( Math.pow((pos.x - this.p.x),2) + Math.pow((pos.y - this.p.y),2) );
          if (d < 1){
            console.log("Game Over");
            loop = false;
            this.dead = true;
            //this.total = 0;
            //this.tail = [];
          }
        }
    }
    
    this.update = function(){
        console.log(this.total+","+this.tail.length);
        if (this.total === this.tail.length) {
            for (var i = 0; i < this.tail.length - 1; i++) {
                this.tail[i] = this.tail[i + 1];
            }
        }
        
        if(this.tail.length<this.total){
            this.tail.push(new point(this.p.x, this.p.y));
        }else if(this.total > 0){
            this.tail[this.total - 1] = new point(this.p.x, this.p.y);
        }
        
        this.p.x += this.xspeed * this.size;
        this.p.y += this.yspeed * this.size;
        
        if(this.p.x + this.size > canvas.width){
            this.p.x = 0;
        }
        if(this.p.x < 0){
            this.p.x = canvas.width - size;
        }
        if(this.p.y + this.size > canvas.height){
            this.p.y = 0;
        }
        if(this.p.y < 0){
            this.p.y = canvas.height - size;
        }
        
        this.death();
    }
    
    this.draw = function(){
        for (var i = 0; i < this.tail.length; i++) {
            ctx.fillStyle = "#EEE";
            ctx.fillRect(this.tail[i].x,this.tail[i].y,this.size,this.size);
            ctx.strokeStyle = "#000";
            ctx.strokeRect(this.tail[i].x,this.tail[i].y,this.size,this.size);
        }
        ctx.fillStyle = "#FFF";
        ctx.fillRect(this.p.x,this.p.y,this.size,this.size);
        ctx.strokeStyle = "#000";
        ctx.strokeRect(this.p.x,this.p.y,this.size,this.size);
    }
}

function keyDownHandler(e){
    switch(e.keyCode){
        case 82:
            main();
            break;
        case 37:
        if(s.yspeed==0)return;
        s.dir(-1,0);//left
            break;
        case 38:
        if(s.xspeed==0)return;
        s.dir(0,-1);//up
            break;
        case 39:
        if(s.yspeed==0)return;
        s.dir(1,0);//rigth
            break;
        case 40:
        if(s.xspeed==0)return;
        s.dir(0,1);//down
            break;            
    }
}

function keyUpHandler(e){
    
}


main();