var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var lastTime = 0, Timesub = 0;
var animation;

var ship;

main();

function main(){
    //設定主畫面資訊
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
}

function init(){
    ship = new Ship(canvas.width/2,canvas.height/2,25);
    console.log(ship);
    gameloop();
}

function gameloop(timestamp){
    Timesub = timestamp - lastTime;
    lastTime = timestamp;
    //----------------
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    update();
    draw();
    
    animation = requestAnimationFrame(gameloop);
}

function update(){

    ship.update();
}

function draw(){
    
    ship.render();
}


document.addEventListener("keydown",function(e){
    ship.keys[e.keyCode] = true;
},false);

document.addEventListener("keyup",function(e){
    delete ship.keys[e.keyCode];    
},false);

function drawTriangle(c,x1,y1,x2,y2,x3,y3){
    c.beginPath();
    c.moveTo(x1,y1);
    c.lineTo(x2,y2);
    c.lineTo(x3,y3);
    c.closePath();
}

//Object---------------------------------------------------------------
function Unit(){

}

function Ship(x,y,size){
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = 5;
    this.s = this.speed * 1 / Math.sqrt(2); // sp * 0.7
    this.keys = {};

    this.update = function(){
        //key move
        if(this.keys[38] && this.keys[37]){ this.x -= this.s; this.y -= this.s} else
        if(this.keys[38] && this.keys[39]){ this.x += this.s; this.y -= this.s} else
        if(this.keys[40] && this.keys[37]){ this.x -= this.s; this.y += this.s} else
        if(this.keys[40] && this.keys[39]){ this.x += this.s; this.y += this.s} else
        
        if(this.keys[37]) this.x -= this.speed; else
        if(this.keys[39]) this.x += this.speed; else
        if(this.keys[38]) this.y -= this.speed; else
        if(this.keys[40]) this.y += this.speed;
        //
    }

    this.render = function(){
        //正三角
        ctx.fillStyle = "#FFF";        
        drawTriangle(ctx,
                     this.x, this.y-this.size,
                     this.x+this.size*Math.sqrt(3)/2, this.y+this.size/2,
                     this.x-this.size*Math.sqrt(3)/2, this.y+this.size/2);
        ctx.fill();
    }
}