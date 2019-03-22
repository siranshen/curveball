var gl;
var canvas;
var program;
var hud;
var start = false; // Whether game has started
var restart = false; // Whether it is on the restart screen
var started = false; // Whether ball has started moving
var paused = false; // Whether game is paused
var blur = true; // Whether motion blur is turned on
var displayHighest = false;
var finalDisplayHighest = false;
var ctx;
var radius = .2; // radius of the ball
var text = "";
var vPosition, vTexCoord, vNormal,vTangent;
var imagelife, imageai;
var paddlePlayer, paddleAI;
var ball, ballNumVertices;
var vWallBuffer, tWallBuffer, nWallBuffer, tanWallBuffer,
	vPaddleBuffer, tPaddleBuffer,
	vBallBuffer, tBallBuffer, nBallBuffer, iBallBuffer,
	vShadowBuffer, tShadowBuffer;
	
var texture0, texture1, texture2, texture3, textureCT,
	textureBL, textureBR, textureUR, textureUL, 
	textureML, textureMR, textureMT, textureMB,target_texture;
var welcome, wtx;
var bumptexture;
var paddlePlayerTrans = mat4();
var ballTrans = translate(0., 0., -radius - .01), ballRot = mat4(), ballAngle = 0.;
var samplerLoc, texIndexLoc;
var modelView, modelViewLoc;
var cameraMove = mat4(), cameraMoveLoc;
var normalMatrix, normalMatrixLoc;
var motionLoc, opacityLoc;
var lightPos = [0., 0., -5., 1.0];
var shininess = 10.0;
var reflectivity = [0.8, 0.8, 0.8, 1.0];
var lightColor = [1., 1., 1., 1.];
var deltaX, deltaY;
var audio_player, audio_ai, audio_wall, audio_miss, audio_start, audio_ai_miss;
var texCoord = [
	[0, 0],
	[0, 1],
	[1, 1],
	[1, 0]
];

var game;
var to_move = true;
var texSize = 256;

// For HUD
var playerScoreElement;
var cpuScoreElement;
var playerScoreNode;
var cpuScoreNode;
var curveScoreElement;
var gameLevelElement;
var curveScoreNode;
var gameLevelNode;

// Bump Data

var data = new Array()
    for (var i = 0; i<= texSize; i++)  data[i] = new Array();
    for (var i = 0; i<= texSize; i++) for (var j=0; j<=texSize; j++) 
        data[i][j] = 0.0;
    for (var i = texSize/4; i<3*texSize/4; i++) for (var j = texSize/4; j<3*texSize/4; j++)
        data[i][j] = 1.0;

// Bump Map Normals
    
var normalst = new Array()
    for (var i=0; i<texSize; i++)  normalst[i] = new Array();
    for (var i=0; i<texSize; i++) for ( var j = 0; j < texSize; j++) 
        normalst[i][j] = new Array();
    for (var i=0; i<texSize; i++) for ( var j = 0; j < texSize; j++) {
        normalst[i][j][0] = data[i][j]-data[i+1][j];
        normalst[i][j][1] = data[i][j]-data[i][j+1];
        normalst[i][j][2] = 1;
    }

// Scale to Texture Coordinates

    for (var i=0; i<texSize; i++) for (var j=0; j<texSize; j++) {
       var d = 0;
       for(k=0;k<3;k++) d+=normalst[i][j][k]*normalst[i][j][k];
       d = Math.sqrt(d);
       for(k=0;k<3;k++) normalst[i][j][k]= 0.5*normalst[i][j][k]/d + 0.5;
    }

// Normal Texture Array

var normals = new Uint8Array(3*texSize*texSize);

    for ( var i = 0; i < texSize; i++ ) 
        for ( var j = 0; j < texSize; j++ ) 
           for(var k =0; k<3; k++) 
                normals[3*texSize*i+3*j+k] = 255*normalst[i][j][k];


function BufferArrs() {
	this.vArr = [];
	this.tArr = [];
	this.nArr = [];
	this.iArr = [];
	this.tanArr = [];
}

function scalarMult(s, v) {
	var u = [];
	for (var i = 0; i < v.length; i++)
		u.push(s * v[i]);
	return u;
}

function reset() {
	started = false;
	//paddlePlayer = new Paddle([0., 0., 0., 1.], -1);
	//paddlePlayerTrans = mat4();
	paddleAI = new Paddle([0., 0., -9., 1.], 1);
	paddleAITrans = translate(0., 0., -9.);
	ball = new Ball([0., 0., -radius - .01, 1.]);
	ballTrans = translate(0., 0., -radius - .01);
	ballRot = mat4();
	paused = false;
}

function handleMouseMove(event) {
	var X = event.clientX, Y = event.clientY, rect = canvas.getBoundingClientRect();
	if (X > rect.right - 100) deltaX = 300;
	else if (X < rect.left + 100) deltaX = -300;
	else deltaX = X - (rect.left + 400);

	if (Y > rect.bottom - 60) deltaY = -210;
	else if (Y < rect.top + 60) deltaY = 210;
	else deltaY = rect.top + 270 - Y;
	
	var XinCoord = 2 * deltaX/136, YinCoord = 40/21 * deltaY/136;
	paddlePlayerTrans = translate(XinCoord, YinCoord, 0.);
	cameraMove = translate(-1/2 * XinCoord, -19/40 * YinCoord, 0.);
	paddlePlayer.pos = [XinCoord, YinCoord, 0., 1.];
}

function handleMouseDown(event) {
	if (!start) {
		start = true;
		return;
	}
	
	if (restart) {
		start = true;
		restart = false;
		return;
	}
	
	if (start && !started) {
		var n = paddlePlayer.findNormal(ball.pos);
		if (n != -1) {
			started = true;
			ball.vel.speed = 6.; // unit/s
			ball.vel.dir = paddlePlayer.normals[n].slice();
			setTex(paddlePlayer, n);
			audio_player.play();
		}
	}
}

function moveBall() {
	var dist = ball.vel.speed * 1/60; // the distance the ball moves
	if (ball.state == "LINEAR") {
		ballTrans = mult(translate(scalarMult(dist, ball.vel.dir)), ballTrans);
		ball.pos = mult(ballTrans, [0., 0., -radius - .01, 1.]);
	}
	else {
		var theta = dist / ball.R;
		var curveDir = normalize(cross(ball.spin.dir, ball.vel.dir));
		var curveCenter = add(vec3(ball.pos), scalarMult(ball.R, curveDir));
		var trans1 = translate(negate(curveCenter)), trans2 = translate(curveCenter);
		rot = rotate(theta, cross(ball.vel.dir, curveDir));
		ball.vel.dir = vec3(mult(rot, vec4(ball.vel.dir)));
		ballTrans = mult(mult(trans2, mult(rot, trans1)), ballTrans);
		ball.pos = mult(ballTrans, [0., 0., -radius - .01, 1.]);
	}
	if (ball.spin.speed > 0) {
		ballAngle += ball.spin.speed * 1/60;
		ballRot = rotate(ballAngle, ball.spin.dir);
	}
}


window.onload = function init(){
	// For the loader of the whole webpage
	$("#loader-wrapper").fadeOut();
	
	/*
	 * Initialize canvas and shaders
	 */
	hud = document.getElementById('hud'); 
	ctx = hud.getContext('2d'); 
	welcome = document.getElementById('welcome');
	wtx = welcome.getContext('2d');
	canvas = document.getElementById("tex-canvas");
	
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) alert("WebGL is not available");
	
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0., 0., 0., 1.);
	
	gl.enable(gl.DEPTH_TEST);
	
	program = initShaders(gl, "vertex-shader", "frag-shader");
	gl.useProgram(program);
	
	var wallBufArrs = new BufferArrs();
	initWallBufs(wallVertices, texCoord, wallBufArrs);
	
	game = new Game(3,3);
	game.change_level(1);

	paddlePlayer = new Paddle([0., 0., 0., 1.], -1);
	paddleAI = new Paddle([0., 0., -9., 1.], 1);
	var paddleBufArrs = new BufferArrs();
	initPaddleBufs(paddleVertices, texCoord, paddleBufArrs);
	initPaddleTextures();
	
	ball = new Ball([0., 0., -radius - .01, 1.]);
	var ballBufArrs = new BufferArrs();
	initBallBufs(ballBufArrs);
	
	var shadowBufArrs = new BufferArrs();
	initShadowBufs(shadowVertices, texCoord, shadowBufArrs);
	lastpos = paddlePlayer.pos;
	// Set score board
	playerScoreElement = document.getElementById("playerScore");
	cpuScoreElement = document.getElementById("aiScore");
	curveScoreElement = document.getElementById("curveScore");
	gameLevelElement = document.getElementById("gameLevel");
	playerScoreNode = document.createTextNode("");
	cpuScoreNode = document.createTextNode("");
	curveScoreNode = document.createTextNode("");
	gameLevelNode = document.createTextNode("");
	playerScoreElement.appendChild(playerScoreNode);
	cpuScoreElement.appendChild(cpuScoreNode);
	curveScoreElement.appendChild(curveScoreNode);
	gameLevelElement.appendChild(gameLevelNode);

	/*
	 * Send buffer data
	 */
	vWallBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vWallBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, wallBufArrs.vArr, gl.STATIC_DRAW);
    
    tWallBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tWallBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, wallBufArrs.tArr, gl.STATIC_DRAW);
	
	nWallBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, nWallBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, wallBufArrs.nArr, gl.STATIC_DRAW);
	
	tanWallBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tanWallBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, wallBufArrs.tanArr, gl.STATIC_DRAW);
	
    vPaddleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vPaddleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, paddleBufArrs.vArr, gl.STATIC_DRAW);
    
    tPaddleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tPaddleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, paddleBufArrs.tArr, gl.STATIC_DRAW);
	
	vBallBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBallBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, ballBufArrs.vArr, gl.STATIC_DRAW);
	
	tBallBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tBallBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, ballBufArrs.tArr, gl.STATIC_DRAW);
	
	iBallBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBallBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ballBufArrs.iArr, gl.STATIC_DRAW);
	ballNumVertices = ballBufArrs.iArr.length;
	
	vShadowBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vShadowBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, shadowBufArrs.vArr, gl.STATIC_DRAW);
	
	tShadowBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tShadowBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, shadowBufArrs.tArr, gl.STATIC_DRAW);
	
	
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vPosition);	
    vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.enableVertexAttribArray(vTexCoord);
	vNormal = gl.getAttribLocation(program, "vNormal");
	vTangent = gl.getAttribLocation(program, "vTangent");
	
	/*
	 * Load images and send to textures in shaders
	 * function for "onload" is to ensure the steps initializing textures
	 *    are done after the images are loaded
	 */	

	var imageW = new Image();
	imageW.onload = function() {
		texture1 = gl.createTexture();
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, texture1);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageW);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	}
	
	imageW.src = "Walls.png";
	
	imageB = new Image();
	imageB.onload = function() {
		texture2 = gl.createTexture();
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, texture2);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageB);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	}

	imageB.src = "Ball.png";

	var imageS = new Image();
	imageS.onload = function() {
		texture3 = gl.createTexture();
		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_2D, texture3);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageS);
		//gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	}
	imageS.src = "Shadow.png";
	
	var imageT = new Image();
	imageT.onload = function() {
		bumptexture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE4);
		gl.bindTexture(gl.TEXTURE_2D, bumptexture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imageT);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.uniform1i(gl.getUniformLocation(program, "texMap"), 4);
	}
	imageT.src = "normal.jpg";
	
	var imagescore = new Image();
	imagescore.onload = function() {
		target_texture= gl.createTexture();
		gl.activeTexture(gl.TEXTURE14);
		gl.bindTexture(gl.TEXTURE_2D, target_texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imagescore);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	}
	imagescore.src = "target.png";
	
	
	imagelife = new Image();
	imagelife.src = "lifeball.png";
	
	imageai = new Image();
	imageai.src = "aiball.png";
	
	audio_player = new Audio("tball1.mp3");
	audio_ai = new Audio("tball2.mp3");
	audio_wall = new Audio('wall.mp3');
	audio_start = new Audio('waiting.mp3');
	audio_ai_miss = new Audio('ai_miss.mp3');
	audio_miss = new Audio('laugh.mp3');
	audio_levelup = new Audio('joy.mp3');

	/*
	 * Get uniform locations and send model view and projection matrices
	 */
	cameraMoveLoc = gl.getUniformLocation(program, "cameraMove");
	texIndexLoc = gl.getUniformLocation(program, "texIndex");
	samplerLoc = gl.getUniformLocation(program, "tsampler");
	thetaLoc = gl.getUniformLocation(program, "theta");
	normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
	motionLoc = gl.getUniformLocation(program, "motion");
	opacityLoc = gl.getUniformLocation(program, "opacity");
	modelView = translate(0., 0., -2.);
	modelViewLoc = gl.getUniformLocation(program, "modelView");
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "projection"), false, 
					flatten(perspective(90, canvas.width/canvas.height, .1, 20.)));
	var ambientProduct = [.4, .4, .4, 1.0];
	gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
					flatten(ambientProduct));
	var specularProduct = mult(lightColor, reflectivity);
	gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
					flatten(specularProduct));
	var diffuseProduct = [.8, .8, .8, 1.0];
	gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), 
					flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "lightPos"), flatten(lightPos));
	gl.uniform1f(gl.getUniformLocation(program, "shininess"), shininess);
	
	document.onmousemove = handleMouseMove;
	welcome.onmousedown = handleMouseDown;
	
	window.onkeydown = function(event) {
		if (start && event.keyCode == 80) // p
			paused = !paused;
		else if (restart) {
			restart = false;
			start = true;
		}
		else if(!start) {
			start = true;
			audio_start.pause();
		}
		else if (event.keyCode == 66) { // b
			if (blur) moveposarray = [];
			else lastpos = paddlePlayer.pos;
			blur = !blur;
		}
		else if (event.keyCode == 72){
			displayHighest = !displayHighest;
		}
	}
	render();
	audio_start.play();
	drawwelcome();
	setInterval(render, 1000/60); // 60 fps
}

var movearray = [];
var ballmovearray = [];
var count = 0;
var moveposarray = [];//hold last n positions of the motion 
var n = 4;
var lastpos;
var newpos;
var detail = 60; //how much detail in blur

function render() {
	if (paused)
		return;
	gl.uniform1i(motionLoc,0);
	// Update score board
	draw2D(ctx,text,game.score, game.highest, game.level, game.lives, game.ai_lives);
	playerScoreNode.nodeValue = game.lives;
	cpuScoreNode.nodeValue = game.ai_lives;
	curveScoreNode.nodeValue = game.score;
	gameLevelNode.nodeValue = game.level;

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	gl.uniformMatrix4fv(cameraMoveLoc, false, flatten(cameraMove));
	/*
	 * Send the data to shaders
	 */
	// Walls
	gl.bindBuffer(gl.ARRAY_BUFFER, vWallBuffer);
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, tWallBuffer);
	gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, nWallBuffer);
	gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vNormal);
	gl.vertexAttribPointer(vTangent, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vTangent);
	
	gl.uniform1i(samplerLoc, 1);
	gl.uniform1i(texIndexLoc, 1);
	gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelView));
	normalMatrix = mat4ToInverseMat3(mult(cameraMove,modelView));
	gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));
	gl.drawArrays(gl.TRIANGLES, 0, 24);
	gl.disableVertexAttribArray(vTangent);
	
	// Ball
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vBallBuffer);
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, tBallBuffer);
	gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
/*	gl.bindBuffer(gl.ARRAY_BUFFER, nBallBuffer);
	gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);*/
	gl.disableVertexAttribArray(vNormal);
	gl.disableVertexAttribArray(vTangent);
	
	if (started) {
		paddlePlayer.checkSpinning(ball);
		paddleAI.checkSpinning(ball);
		ball.check();
		moveBall();
		checkBallPos(ball, paddlePlayer, paddleAI);
		move_AI(ball);
	}
	
	var varyingModelView = mult(modelView, mult(ballTrans, ballRot));
	gl.uniform1i(samplerLoc, 2);
	gl.uniform1i(texIndexLoc, 2);
	gl.uniformMatrix4fv(modelViewLoc, false, flatten(varyingModelView));
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBallBuffer);
	gl.drawElements(gl.TRIANGLES, ballNumVertices, gl.UNSIGNED_SHORT, 0);
	
	// Shadows
	gl.bindBuffer(gl.ARRAY_BUFFER, vShadowBuffer);
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, tShadowBuffer);
	gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
	gl.uniform1i(samplerLoc, 3);
	gl.uniform1i(texIndexLoc, 3);
	
	var w = wallWidth/2, h = wallHeight/2;
	varyingModelView = mult(modelView, translate(w - 0.01, ball.pos[1], ball.pos[2]));
	varyingModelView = mult(varyingModelView, shadowRotMatrices[0]);
	var s = Math.max(1.1, Math.abs(ball.pos[0] - w)/3.);
	varyingModelView = mult(varyingModelView, scale(s, s, s));
	gl.uniformMatrix4fv(modelViewLoc, false, flatten(varyingModelView));
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	
	varyingModelView = mult(modelView, translate(0.01 - w, ball.pos[1], ball.pos[2]));
	varyingModelView = mult(varyingModelView, shadowRotMatrices[1]);
	var s = Math.max(1.1, Math.abs(ball.pos[0] + w)/3.);
	varyingModelView = mult(varyingModelView, scale(s, s, s));
	gl.uniformMatrix4fv(modelViewLoc, false, flatten(varyingModelView));
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	
	varyingModelView = mult(modelView, translate(ball.pos[0], h - 0.01, ball.pos[2]));
	varyingModelView = mult(varyingModelView, shadowRotMatrices[2]);
	var s = Math.max(1.1, Math.abs(ball.pos[1] - h)/3.);
	varyingModelView = mult(varyingModelView, scale(s, s, s));
	gl.uniformMatrix4fv(modelViewLoc, false, flatten(varyingModelView));
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	
	/*varyingModelView = mult(modelView, translate(ball.pos[0], 0.01 - h, ball.pos[2]));
	varyingModelView = mult(varyingModelView, shadowRotMatrices[3]);
	var s = Math.max(1.1, Math.abs(ball.pos[1] + h)/3.);
	varyingModelView = mult(varyingModelView, scale(s, s, s));
	gl.uniformMatrix4fv(modelViewLoc, false, flatten(varyingModelView));
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	*/
	
	// Paddles	
	gl.bindBuffer(gl.ARRAY_BUFFER, vPaddleBuffer);
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, tPaddleBuffer);
	gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
		
	gl.uniform1i(samplerLoc, paddleAI.texSampler);
	gl.uniform1i(texIndexLoc, paddleAI.texSampler);
	varyingModelView = mult(modelView, paddleAITrans);
	gl.uniformMatrix4fv(modelViewLoc, false, flatten(varyingModelView));
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	
	gl.uniform1i(samplerLoc, paddlePlayer.texSampler);
	gl.uniform1i(texIndexLoc, paddlePlayer.texSampler);
	varyingModelView = mult(modelView, paddlePlayerTrans);
	gl.uniformMatrix4fv(modelViewLoc, false, flatten(varyingModelView));
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	count++;
	
	//motion 
	if (blur) {
		gl.uniform1i(motionLoc,1);
		moveposarray.push(paddlePlayer.pos);
		if(moveposarray.length >= n)
		{
			moveposarray.shift();
			lastpos = moveposarray[0];
		}	
		for( var i = 0; i < detail; i++)
		{
			newpos = add(mult([1-i/detail],lastpos),mult([i/detail],paddlePlayer.pos));
			varyingModelView = mult(modelView, translate(newpos[0],newpos[1],newpos[2]));
			gl.uniformMatrix4fv(modelViewLoc, false, flatten(varyingModelView));
			gl.uniform1f(opacityLoc, 0.1 + i/detail);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
		}
		lastpos = paddlePlayer.pos;
		gl.uniform1i(motionLoc,0);
	}
	
	gl.disable(gl.BLEND);
}