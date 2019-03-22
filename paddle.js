function Paddle(p, dir) {
	this.pos = p;
	this.dir = dir; // the direction it faces
	this.ballHitPosition = null;
	this.texSampler = 0;
	this.normals = [
		normalize([.1, .1, dir*2.]), // bottom-left
		normalize([-.1, .1, dir*2.]), // bottom-right
		normalize([-.1, -.1, dir*2.]), // upper-right
		normalize([.1, -.1, dir*2.]), // upper-left
		normalize([.1, 0., dir*2.]), // middle-left
		normalize([0., .1, dir*2.]), // middle-bottom
		normalize([-.1, 0., dir*2.]), // middle-right
		normalize([0., -.1, dir*2.]), // middle-top
		[0., 0., dir*1.] // center
	];
	
	this.findNormal = function(p) {
		var X = this.pos[0], Y = this.pos[1];
		if (p[0] > X - .8 && p[0] < X + .8 && p[1] > Y - .5 && p[1] < Y + .5) {
			if (p[0] < X - .2 && p[1] < Y - .15) 
				return 0;
			else if (p[0] > X + .2 && p[1] < Y - .15)
				return 1;
			else if (p[0] > X + .2 && p[1] > Y + .15)
				return 2;
			else if (p[0] < X - .2 && p[1] > Y + .15)
				return 3;
			else if (p[0] < X - .2)
				return 4;
			else if (p[1] < Y - .15)
				return 5;
			else if (p[0] > X + .2)
				return 6;
			else if (p[1] > Y + .15)
				return 7;
			else
				return 8;
		}
		else
			return -1;
	}
	
	this.checkSpinning = function(ball) {
		if (this.ballHitPosition != null) {
			var delta = vec2(subtract(this.pos, this.ballHitPosition));
			ball.spin.dir = scalarMult(.5, ball.spin.dir);	
			ball.spin.dir = add([-delta[1], delta[0], 0.], ball.spin.dir); // spinning axis
			ball.spin.speed = (length(ball.spin.dir) / radius) * 4; // speed is in rad/s
			this.ballHitPosition = null;
			if(ball.vel.dir[2] < 0)
				game.curve_bonus(ball.spin.speed);
		}
	}
}

var paddleVertices = [
	[-.7, -.4, 0., 1.],
	[-.7, .4, 0., 1.],
	[.7, .4, 0., 1.],
	[.7, -.4, 0., 1.]
];

var paddleAITrans = translate(0., 0., -9.);

function resetTex() {
	paddlePlayer.texSampler = 0;
	paddleAI.texSampler = 0;
}

function setTex(paddle, n) {
	switch (n) {
	case 0:
		paddle.texSampler = 5; break;
	case 1:
		paddle.texSampler = 6; break;
	case 2:
		paddle.texSampler = 7; break;
	case 3:
		paddle.texSampler = 8; break;
	case 4:
		paddle.texSampler = 9; break;
	case 5:
		paddle.texSampler = 10; break;
	case 6:
		paddle.texSampler = 11; break;
	case 7:
		paddle.texSampler = 12; break;
	case 8:
		paddle.texSampler = 13; break;
	}
	
	window.setTimeout(resetTex, 400);
}

var	move_AI = function(ball)
	{
		var mover = [ball.pos[0] - paddleAI.pos[0],ball.pos[1] - paddleAI.pos[1]];
		if(ball.vel.dir[2] > 0)
		{
			mover = [0 - paddleAI.pos[0],0- paddleAI.pos[1]];
		}
		var move_vec = [0,0];
		if(length(mover)!= 0)
			move_vec = normalize(mover);
		var movespeed = Math.min(maxAIspeed, Math.sqrt(dot(mover,mover)));
		paddleAITrans = mult(translate(movespeed*move_vec[0],movespeed*move_vec[1],0),paddleAITrans);
		paddleAI.pos = mult(paddleAITrans, [0., 0., -9., 1.]);
	}

function initPaddleBufs(v, t, b) {
	//var n0 = [0., 0., 1., 0.], n1 = [0., 0., -1., 0.];
	b.vArr = flatten([v[0], v[3], v[1], v[1], v[3], v[2]]);
	b.tArr = flatten([t[0], t[3], t[1], t[1], t[3], t[2]]);
	//b.nArr = flatten([n0, n0, n0, n0, n0, n0, n1, n1, n1, n1, n1, n1]);
}

function initPaddleTextures() {
	var imageP = new Image();
	imageP.onload = function() {
		texture0 = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture0);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageP);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	}
	imageP.src = "Paddle.png";

	var imageBL = new Image();
	imageBL.onload = function() {
		textureBL = gl.createTexture();
		gl.activeTexture(gl.TEXTURE5);
		gl.bindTexture(gl.TEXTURE_2D, textureBL);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageBL);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	}
	imageBL.src = "Paddle-lowerleft.png";
	
	var imageBR = new Image();
	imageBR.onload = function() {
		textureBR = gl.createTexture();
		gl.activeTexture(gl.TEXTURE6);
		gl.bindTexture(gl.TEXTURE_2D, textureBR);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageBR);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	}
	imageBR.src = "Paddle-lowerright.png";

	var imageUR = new Image();
	imageUR.onload = function() {
		textureUR = gl.createTexture();
		gl.activeTexture(gl.TEXTURE7);
		gl.bindTexture(gl.TEXTURE_2D, textureUR);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageUR);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	}
	imageUR.src = "Paddle-upperright.png";

	var imageUL = new Image();
	imageUL.onload = function() {
		textureUL = gl.createTexture();
		gl.activeTexture(gl.TEXTURE8);
		gl.bindTexture(gl.TEXTURE_2D, textureUL);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageUL);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	}
	imageUL.src = "Paddle-upperleft.png";

	var imageML = new Image();
	imageML.onload = function() {
		textureML = gl.createTexture();
		gl.activeTexture(gl.TEXTURE9);
		gl.bindTexture(gl.TEXTURE_2D, textureML);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageML);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	}
	imageML.src = "Paddle-left.png";

	var imageMB = new Image();
	imageMB.onload = function() {
		textureMB = gl.createTexture();
		gl.activeTexture(gl.TEXTURE10);
		gl.bindTexture(gl.TEXTURE_2D, textureMB);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageMB);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	}
	imageMB.src = "Paddle-lower.png";

	var imageMR = new Image();
	imageMR.onload = function() {
		textureMR = gl.createTexture();
		gl.activeTexture(gl.TEXTURE11);
		gl.bindTexture(gl.TEXTURE_2D, textureMR);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageMR);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	}
	imageMR.src = "Paddle-right.png";

	var imageMT = new Image();
	imageMT.onload = function() {
		textureMT = gl.createTexture();
		gl.activeTexture(gl.TEXTURE12);
		gl.bindTexture(gl.TEXTURE_2D, textureMT);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageMT);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	}
	imageMT.src = "Paddle-upper.png";
	
	var imageCT = new Image();
	imageCT.onload = function() {
		textureCT = gl.createTexture();
		gl.activeTexture(gl.TEXTURE13);
		gl.bindTexture(gl.TEXTURE_2D, textureCT);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageCT);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	}
	imageCT.src = "Paddle-center.png";
}