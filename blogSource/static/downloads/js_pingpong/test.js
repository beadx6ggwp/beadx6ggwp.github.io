
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var up = false ,down = false;

var ballRadius = 10;
var x = canvas.width/2;
var y = canvas.height/2;

var dx = 3.5;
var dy = -3.5;

var paddleY1 = (canvas.height-pH1)/2;
var pH1 = 80, pW1 = 15;
var paddleY2 = (canvas.height-pH1)/2;
var pH2 = 80, pW2 = 15;
var aiSeppd = 3.5;

var score1 = 0, score2 = 0;

var showingWin = false;
const WIN_SCORE = 3;

//add event
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);
document.addEventListener("mousedown", mouseDownHandler, false);

setInterval(draw, 10);

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // drawing code    
    if(showingWin){
        ctx.font="20px console";
        if(score1 >= WIN_SCORE ){
            ctx.fillText("Left Player Won",canvas.width/2-100,100);
        }else{
            ctx.fillText("Right Player Won",canvas.width/2-100,100);
        }
        ctx.fillText("Click to continue",canvas.width / 2 - 100,canvas.height - 100);
        return;
    }

    drawNet();
    drawball();
    drawpaddle();
    computerMove()
    
    if(x <= ballRadius){
        //alert("gameover");           
        score2++;
        ballReset();     
    }
    if(x >= canvas.width - ballRadius){
        //alert("gameover");  
        score1++; 
        ballReset();
    }

    if(up && paddleY1 > 0){
        paddleY1-=7;        
    }
    if(down && paddleY1 + pH1 < canvas.height){
        paddleY1+=7;
    }
    
    if( x < ballRadius || x > canvas.width - ballRadius){
        dx=-dx;
    }
    if( y > canvas.height - ballRadius || y < ballRadius){
        dy=-dy;
    }

    if(y > paddleY1 && y < paddleY1+pH1 &&
        x < pW1+ballRadius){ 
        dx=-dx;
        var deltaY = y - (paddleY1+pH1/2);
        dy = deltaY * 0.15;
    }
    if(y > paddleY2 && y < paddleY2 + pH2 &&
        x > canvas.width - pW1 - ballRadius){  
        dx=-dx;
        var deltaY = y - (paddleY2+pH2/2);
        dy = deltaY * 0.15;
    }  

    x+=dx;
    y+=dy;
    ctx.font="20px console";
    ctx.fillText(score1,100,100);
    ctx.fillText(score2,canvas.width - 100,100);
    console.log(dx+","+dy);
}

function computerMove(){
    if(x > canvas.width/2){
        if(paddleY2 + pH2/2 + aiSeppd < y-35){
            paddleY2 += aiSeppd;
        }
        else if(paddleY2 + pH2/2 - aiSeppd > y+35){
            paddleY2 -= aiSeppd;
        }
    }else{
        
    }

}

function ballReset(){    
    if(score1 >= WIN_SCORE || score2 >= WIN_SCORE){
        showingWin = true;
    }
    dx=-dx;
    x = canvas.width/2;
    y = canvas.height/2;
}

function drawNet(){
    for(var i = 0; i < canvas.height; i+=40){
        colorRect(canvas.width/2,i,2,20,"#000000");
    }

}

function drawball(){
    colorCircle(x,y,ballRadius,"#FF0000")
}

function drawpaddle(){
    colorRect(0, paddleY1, pW1, pH1, "#000000");
    colorRect(canvas.width - pW2, paddleY2, pW2, pH2, "#000000")
}



function colorCircle(centerX, centerY, radius, color){
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI*2);//x,y is center
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}
function colorRect(centerX, centerY, w, h, color){
    ctx.beginPath();
    ctx.rect(centerX, centerY, w, h);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();

}

function keyDownHandler(e) {
    if(e.keyCode == 38) {
        up = true;
    }
    else if(e.keyCode == 40) {
        down = true;
    }
}

function keyUpHandler(e) {
    if(e.keyCode == 38) {
        up = false;
    }
    else if(e.keyCode == 40) {
        down = false;
    }
}

function mouseMoveHandler(e) {
    var relativeY = e.clientY - canvas.offsetTop;
    if(relativeY > 0 && relativeY < canvas.height) {
        paddleY1 = relativeY - pH1/2;
    }
}

function mouseDownHandler(e){
    if(showingWin){
        score1 = 0;
        score2 = 0;
        showingWin = false;
    }
}

