function Velocity(spd, dir) {
	this.speed = spd; // Depending on the object, it may be angular or linear
	this.dir = dir; // Depending on the object, it may be direction or rotation axis
}

function Ball(p) {
	this.pos = p;
	this.vel = new Velocity(0., [0., 0., -1.]);
	this.spin = new Velocity(0., [0., 0., 0.]);
	this.R = Number.POSITIVE_INFINITY;
	this.state = "LINEAR"; // Either moving on a curve (CURVED) or a line (LINEAR)
	
	this.check = function() {
		if (this.spin.speed < .1)
			this.state = "LINEAR";
		else {
			var cosTheta = dot(normalize(this.spin.dir), normalize(this.vel.dir));
			var spinSpeed = this.spin.speed * Math.sqrt(1 - cosTheta * cosTheta);
			if (spinSpeed < .1) {
				this.state = "LINEAR";
				return;
			}				
			//(3 * m * V) / (16 * Cl * r * s * b^3 * pi^2)
			this.R = (3 * 2.8 * this.vel.speed) / (4.8 * spinSpeed * Math.pow(radius, 3.) * Math.pow(Math.PI, 2.));
			this.state = "CURVED";
		}
	}
}

function initBallBufs(buf) {
	var latitudeBands = 30;
	var longitudeBands = 30;
	for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
		var theta = latNumber * Math.PI / latitudeBands;
		var sinTheta = Math.sin(theta);
		var cosTheta = Math.cos(theta);
		for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
			var phi = longNumber * 2 * Math.PI / longitudeBands;
			var sinPhi = Math.sin(phi);
			var cosPhi = Math.cos(phi);
			var x = cosPhi * sinTheta;
			var y = cosTheta;
			var z = sinPhi * sinTheta;
			var u = 1 - (longNumber / longitudeBands);
			var v = 1 - (latNumber / latitudeBands);
//			buf.nArr.push(vec4(x,y,z,0.));
			buf.tArr.push([u,v]);
			buf.vArr.push([radius*x, radius*y, radius*z, 1.]);
		}
	}
	
	for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
		for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
			var first = (latNumber * (longitudeBands + 1)) + longNumber;
			var second = first + longitudeBands + 1;
			buf.iArr.push(first);
			buf.iArr.push(second);
			buf.iArr.push(first + 1);
			buf.iArr.push(second);
			buf.iArr.push(second + 1);
			buf.iArr.push(first + 1);
		}
	}
	
//	buf.nArr = flatten(buf.nArr);
	buf.tArr = flatten(buf.tArr);
	buf.vArr = flatten(buf.vArr);
	buf.iArr = new Uint16Array(buf.iArr);
}

function draw_target()
{
	gl.bindBuffer(gl.ARRAY_BUFFER, vShadowBuffer);
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, tShadowBuffer);
	gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
	gl.uniform1i(samplerLoc, 14);
	gl.uniform1i(texIndexLoc, 15);
	varyingModelView = mult(modelView, translate(ball.pos[0], ball.pos[1], -9-0.1));
	//varyingModelView = mult(varyingModelView, rotate(45, 0, 0, 1));
	varyingModelView = mult(varyingModelView, scale(3, 3, 3));
	gl.uniformMatrix4fv(modelViewLoc, false, flatten(varyingModelView));
	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function surviveOrDie(ball, paddle, ai, finish) {
	var n = paddle.findNormal(ball.pos);
	text = "";
	if (n != -1) { // hit			
		// Change texture as needed
		setTex(paddle, n);
		
		n = paddle.normals[n].slice();
		paddle.ballHitPosition = paddle.pos;
		var d = ball.vel.dir;
		// reflection vector = d - 2(d . n)n
		ball.vel.dir = subtract(d, scalarMult(2 * dot(d, n), n));
		if (!ai) {
			audio_player.play();
			ball.pos = [ball.pos[0], ball.pos[1], -radius - 0.01, 1.];
			ballTrans = translate(ball.pos[0], ball.pos[1], ball.pos[2]);
		}
		else
			audio_ai.play();
		if(ball.vel.speed * 1.05 <= maxBallspeed)
			ball.vel.speed *= 1.05;
	}
	else { // miss
		if(!finish)
			return;
		if(ai) {
			game.reduce_ai_life();
			game.score += 200;

			if (game.score > game.highest)
			{
				game.highest = game.score;	
				finalDisplayHighest = true;
			}
			draw_target();

		}
		else {
			game.reduce_life();
			audio_miss.play()
		}
		paused = true;
		window.setTimeout(reset, 700); // Reset game after 0.7s
	}
}

var min = -0.25;
var max = 0.1;
var off = min;
function checkBallPos(ball, paddlePlayer, paddleAI) {
	max = ball.vel.speed/25 - .15; // radius == .2!!
	var x = ball.pos[0], y = ball.pos[1], z = ball.pos[2];
	if ((x < -4.965 && ball.vel.dir[0] < 0) || (x > 4.965 && ball.vel.dir[0] > 0)) // left or right wall
	{
		ball.vel.dir[0] *= -1;
		audio_wall.play();
	}
	if ((y < -3.205 && ball.vel.dir[1] < 0) || (y > 3.205 && ball.vel.dir[1] > 0))
	{		// top or bottom wall
		ball.vel.dir[1] *= -1;
		audio_wall.play();
	}
	if (z > -0.24 && ball.vel.dir[2] > 0) // player paddle
	{
		if(z < max)
			surviveOrDie(ball, paddlePlayer,false,false);
		else
			surviveOrDie(ball, paddlePlayer,false,true);
	}
	else if (z < -8.79 && ball.vel.dir[2] < 0) // AI paddle
		surviveOrDie(ball, paddleAI,true, true);
}

var shadowVertices = [
	[-radius, radius, 0., 1.],
	[-radius, -radius, 0., 1.],
	[radius, -radius, 0., 1.],
	[-radius, radius, 0., 1.],
	[radius, -radius, 0., 1.],
	[radius, radius, 0., 1.]
];

var shadowRotMatrices = [
	rotate(-Math.PI/2, [0, 1, 0]),
	rotate(Math.PI/2, [0, 1, 0]),
	rotate(-Math.PI/2, [1, 0, 0]),
	rotate(Math.PI/2, [1, 0, 0]),	
];

function initShadowBufs(v, t, buf) {
	buf.vArr = flatten(shadowVertices);
	buf.tArr = flatten([t[1], t[0], t[3], t[1], t[3], t[2]]);
}