var maxAIspeed, maxBallspeed;
function Game(liv,ai_liv)
{
	this.default_lives = liv;
	this.lives = liv;
	this.max_ai_lives = ai_liv;
	this.ai_lives = ai_liv;
	this.level = 1;
	this.score = 0;
	this.highest = 0;
	this.change_level = function (lev)
	{
		if(lev)
		{
			this.level = lev;
			this.score = 300*(this.level - 1);
		}
		else
		{
			this.level++;
			this.score += 300;
		}
		maxAIspeed = 0.04 + 0.01*(this.level-1);
		maxBallspeed = 5 + this.level*2;
		this.ai_lives = this.max_ai_lives;

		if (this.score > this.highest){
			this.highest = this.score;
			finalDisplayHighest = true;
		}
	}
	
	this.reduce_life = function()
	{
		this.lives--;
		if(this.lives == 0)
		{
			restart = true;
			finalScore = this.score;
			finalHighest = this.highest;
			drawgameover();
			this.change_level(1);
			this.lives = this.default_lives;
			start = false;
			// finalDisplayHighest = false; is in text.js
		}
	}
	
	this.reduce_ai_life = function()
	{
		this.ai_lives--;
		if(this.ai_lives == 0)
		{
			this.change_level();
			audio_levelup.play();
			this.lives++;
		}
		else
			audio_ai_miss.play();
	}
	
	this.curve_bonus = function(spin)
	{
		var bonus = (Math.floor(spin)/2*50);
		if(bonus > 0)
			text = "CURVE BONUS: " + bonus;
		this.score+= bonus;
		if (this.score > this.highest){
			this.highest = this.score;
			finalDisplayHighest = true;
		}
	}
}