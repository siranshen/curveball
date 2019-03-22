var i;
var txt;
function draw2D(ctx,text, score, highest, level,lives,ai_lives) {
	ctx.clearRect(0, 0, 800, 540); // Clear <hud>
	ctx.fillStyle = "rgba(22, 46, 100,0.6)";
	ctx.fillRect(16, 0, 87 + 14*level.toString().length, 30);
	ctx.fillStyle = "rgba(22, 46, 100,0.6)";
	ctx.fillRect(canvas.width-198, 0, 96 + 14*score.toString().length, 30);
	if (displayHighest){
		ctx.fillStyle = "rgba(22, 46, 100,0.6)";
		ctx.fillRect(canvas.width-198, 57, 84 + 14*highest.toString().length, 30);
		ctx.font = 'bold 23px Comic Sans MS';
		ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // Set white to the color of letters
		ctx.fillText("Best: " + highest, canvas.width - 193, 78);
	}

	ctx.font = 'bold 23px Comic Sans MS';
	ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // Set white to the color of letters
	ctx.fillText(text, 20, canvas.height - 30);
	ctx.fillText("Level: " + level, 20, 24); 
	ctx.fillText("Score: " + score, canvas.width - 193, 24); 	

	for(i = 0; i < lives; i++)
		ctx.drawImage(imagelife, 31+ 23*i, 34, 20, 20);
	for(i = 0; i < ai_lives; i++)
		ctx.drawImage(imageai, canvas.width-160 + 23*i, 34, 20, 20);
}


function drawgameover()
{
	wtx = welcome.getContext('2d');
	wtx.clearRect(0, 0, 800, 540);
	wtx.fillStyle = "rgba(22, 46, 100,0.7)";
	wtx.fillRect(0, 0, 800, 540);
	wtx.font = 'bold 60px Comic Sans MS';
	wtx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Set white to the color of letters
	wtx.fillText("GAME OVER", 220, 270);
	wtx.font = 'bold 25px Helvetica';
	wtx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // Set white to the color of letters
	wtx.fillText("Press any key to restart", 260, 310);
	wtx.fillText("Score: "+ finalScore, 330, 350);
	if (finalDisplayHighest){
		wtx.fillText("New Highest Score!", 280, 390);		
	}else{
		wtx.fillText("Highest: "+ finalHighest, 307, 390);
	}
	
	if(restart)
		window.requestAnimationFrame(drawgameover);
	else
	{
		wtx.clearRect(-112, -200, 1024, 1024);
		finalDisplayHighest = false;
		return;
	}
}

var s = 0;
function drawwelcome()
{
	wtx = welcome.getContext('2d');
	wtx.clearRect(0, 0, 800, 540);
	wtx.save();
	s++;
	wtx.fillStyle = "rgba(22, 46, 100,0.7)";
	wtx.fillRect(0, 0, 800, 540);
	/*
	wtx.translate(512-112, 512-200);
	wtx.rotate(2*s*Math.PI/180);
	wtx.translate(-512+112, -512+200);
	wtx.drawImage(welcome_image,-112,-200,1024,1024);
	*/
	wtx.restore();
	wtx.font = 'bold 60px Comic Sans MS';
	wtx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Set white to the color of letters
	wtx.fillText("CurveBall", 260, 270);
	wtx.font = 'bold 25px Helvetica';
	wtx.fillStyle = 'rgba(255, 255, 255, .7)'; // Set white to the color of letters
	wtx.fillText("Press any key to play", 265, 310);
	wtx.font = 'bold 20px Helvetica';
	wtx.fillStyle = 'rgba(255, 255, 255, .8)'; // Set white to the color of letters
	wtx.fillText("By Siran, Akash, Ruiming", 510, canvas.height - 30);
	
	if(!start)
		window.requestAnimationFrame(drawwelcome);
	else
	{
		wtx.clearRect(-112, -200, 1024, 1024);
		return;
	}
}