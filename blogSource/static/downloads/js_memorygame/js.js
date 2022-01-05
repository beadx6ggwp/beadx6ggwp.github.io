var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var dcard = [];

var click = 0;
var k = [];
var cou = 0;

var myTimer;
var time = 60;


function main(){
    makecard();
    changecard();
    showcard();
    myTimer = setInterval(timestart,1000);
}

//Function
function timestart(){
    document.getElementById("time_p").innerHTML = time;
    if(time<=0){            
        clearInterval(myTimer)
        document.getElementById("time_p").innerHTML = "HIHI,Press F5 to continue";
    }
    time--;  
    console.log(time);
}

function check(p){
    if(dcard[p].checked || k[0] == dcard[p])return;
    click++;
    k.push(dcard[p]);
    console.log(k.length);
	dcard[p].drawfront();
    if(click == 2){
        fillback();
        click = 0;
        k.length = 0;
    }
}

function random(max,min){
	return Math.round(Math.random()*(max-min)+min);
}

function getcard(dx,dy){	
    //rewrite
	var p;
	var d = dcard;
	for(i=0;i<d.length;i++)
	{
		if(d[i].x < dx && dx < d[i].x+d[i].w &&
			d[i].y < dy && dy < d[i].y+d[i].h)
			{
				p = i;
				break;
			}
	}
	return p;
}

function makecard(){    
    var cardd = [];
	var count = 0;
    var val = 1;
	var color = "#F00"
	for(i =0;i<6;i++)
	{
		cardd[i] = [];
		for(j = 0;j<3;j++)
		{			
			if(count==9){color="#00F";val=1;}
			cardd[i][j] = new card(i*110+50,j*160+50,color,val);
            val++;
			count++
            dcard.push(cardd[i][j]);
		}
	}   
}

function changecard(){
    var k1,k2;
    var oldval,oldc;
    for(i=0;i<dcard.length*3;i++)
    {
        k1 = random(0,dcard.length-1);
        k2 = random(0,dcard.length-1);
        oldval = dcard[k1].val;
        oldc = dcard[k1].c;
        dcard[k1].val = dcard[k2].val;
        dcard[k1].c = dcard[k2].c;
        dcard[k2].val = oldval;
        dcard[k2].c = oldc;
    }
}

function showcard(){
	ctx.fillStyle = "#EEE";
	ctx.fillRect(0,0,canvas.width,canvas.height);
    for(i=0;i<dcard.length;i++)
    {
        dcard[i].drawback();
    }
}

function fillback(){
	if(k[0].val==k[1].val){
        k[0].checked = true;
        k[1].checked = true;
        k[0].c = "#EEE";
        k[1].c = "#EEE";
        cou++; 
    }
    setTimeout(showcard,500);
    if(cou ==9){
        alert("win\r\nF5 to continue");
    }
    //showcard();
    console.log("ok");    
}

function clearcard(){
	fcard.x = -500;
	scard.x = -500;
	showcard();
}

function showwin(){		
	ctx.fillStyle = "#EEE";
	ctx.fillRect(0,0,canvas.width,canvas.height);
	ctx.fillStyle = "#000";
	ctx.fillText("你贏了",canvas.width/2,canvas.height/2);
}
//Object
function card(x,y,c,val){
	this.val = val;
	this.c = c;
	this.checked = false;
	this.x = x;
	this.y = y;
	this.w = 105;
	this.h = 150;
	this.drawback = function(){	
		ctx.fillStyle = this.c;	
		ctx.fillRect (this.x, this.y, this.w, this.h);
	}
	this.drawfront = function(){
		ctx.fillStyle = "#FFF";
		ctx.fillRect(this.x,this.y,this.w,this.h);
		ctx.strokeStyle = this.c;
		ctx.strokeRect(this.x,this.y,this.w,this.h);
        ctx.fillStyle = this.c;
		ctx.font = "50px console";
        ctx.fillText(this.val,x+this.w/2-13,y+this.h/2+15);
	}	
}
/*
card.prototype.drawR = function(){
	ctx.fillStyle = "#F00";
	ctx.fillRect (this.x, this.y, this.w, this.h);
}
*/


//Event
document.addEventListener("mousemove", mouseMoveHandler);
document.addEventListener("mousedown", mouseDownHandler);
function mouseMoveHandler(e) {
    var mX = e.clientX - canvas.offsetLeft;
    var mY = e.clientY - canvas.offsetTop;
	//console.log(X+","+Y);
}
function mouseDownHandler(e) {
    var dX = e.clientX - canvas.offsetLeft;
    var dY = e.clientY - canvas.offsetTop;
	//console.log(dX+","+dY);
	check(getcard(dX,dY));
	
}


main();