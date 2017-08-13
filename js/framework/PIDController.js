"use strict"; //ES6
/** 
 * Attempt at a generic PID controller
 * 
 * Use:

var stepTime = 1/30; //30 fps (target dt==0.0333)
var xVelPID = new PIDController( 1, 1, 1, stepTime );  

var targetXVel = 22;

update(dt) {
  simulation.update(dt);
  currentXVel = simulation.target.getVel().x;
  
  //sample the PID
  // NOTE: if(dt > timestep) your output will not be accurate! make sure dt <= stepTime
  var pidOutput = xVelPID.step( currentXVel, targetXVel, dt );
  
  //use output to modify your simulation control, which will affect the target next step
  targetController.update( pidOutput );
}

* 
* EX2:
	var testVel = 0;
	var testAccel = 0;
	var targetVel = 10;
	var timeStep = 1/10;
	var test = new PIDController(1,1,1, timeStep);
	var testGraph = new PIDTuneGraph();

	for(var i=0; i<60; i++) {
		testVel += testAccel * timeStep;
		
		var output = test.step(testVel, targetVel,timeStep);
		testGraph.addSampleEx(testVel,targetVel, output, test.dbgLastP, test.dbgLastI, test.dbgLastD, i*timeStep);
		testAccel = output;
	}

*
* EX3:
	var testVel = 0;
	var testAccel = 0;
	var targetVel = 10;
	var timeStep = 1/10;
	var test = new PIDController(3,1,0.005, timeStep);
	var testGraph = new PIDTuneGraph();

	for(var i=0; i<60; i++) {
		testVel += testAccel * timeStep;
		
		var target = targetVel/2 + targetVel/2 * Math.sin(i/6);
		
		var output = test.step(testVel, target,timeStep);
		testGraph.addSampleEx(testVel,target, output, test.dbgLastP, test.dbgLastI, test.dbgLastD, i*timeStep);
		testAccel = output;
	}

* TODO: automatic tuning? 

 */
 
class PIDController {
	constructor( Kp, Ki, Kd, timeStep, reverse ) {
		this.reverse = reverse || false;
		
		this.Kp = 0;
		this.Kis = 0;
		this.Kds = 0;
		this.timeStep = timeStep;
		this.setConstants(Kp, Ki, Kd);
		this.outputRange = null;
		this.errorEpsilon = 0.0001;

		this.lastCalcTime = 0;
		this.totalDT = 0;
		
		this.lastInput = 0;
		this.inputValue = 0;
		this.targetValue = 0;
		this.valueI = 0;
		this.outputSignal = 0;
		
		this.dbgLastP = 0;
		this.dbgLastI = 0;
		this.dbgLastD = 0;
	}
	
	resetStateData( resetTime ) {
		this.valueI = 0;
		this.lastInput = 0;
		this.targetValue = 0;
		this.inputValue = 0;
		this.outputSignal = 0;
		
		if(resetTime) {
			this.lastCalcTime = 0;
			this.totalDT = 0;
		}
	}
	 
	setConstants( Kp, Ki, Kd ) {
		if(Kp < 0 || Ki < 0 || Kd < 0) {
			console.log("error, PID constants must be positive!")
		}
		
		if(!this.reverse) {
			this.Kp = Kp;
			this.Ki = Ki;
			this.Kd = Kd;
		} else {
			this.Kp = (0 - Kp);
			this.Ki = (0 - Ki);
			this.Kd = (0 - Kd);
		}
	}
	
	setOutputRange( min, max ) {
		if(!min) {
			this.outputRange = null;
		}
		else {
			this.outputRange = {min:min, max:max};
		}
	}
	
	// currSampleValue AKA "measured process variable"
	// currTargetValue AKA "setpoint"
	// dt is in seconds
	// returns: output signal (will be clamped if outputRange is set)
	// * if you call this more often than timeStep, it will return a cached outputSignal value until the
	//   	cumulative dt adds up to timeStep
	// * if you call this with a dt greater than timeStep, it will perform as many calculations as 
	//      floor(dt / timeStep), assuming the same input and target for each step
	// * given the above, even with an irregular dt, all calculations will be performed with 'timestep' delta
	//      and no 'time' will be 'lost' (though samples might )
	
	step( currSampleValue, currTargetValue, dt ) {
		this.totalDT += dt;
		this.inputValue = currSampleValue;
		this.targetValue = currTargetValue;
		if( this.lastCalcTime == 0 || this.lastCalcTime + this.timeStep <= this.totalDT ) {
			var sampleTime = this.totalDT - (this.lastCalcTime + this.timeStep);
			var numSteps = Math.floor( sampleTime / this.timeStep );
			
			this.lastCalcTime += numSteps * this.timeStep;
//numSteps = Math.min(numSteps, 1);			
			for(var i=0; i<numSteps; i++) {
				this.outputSignal = this._calculate();
			}
		}
		
		return this.outputSignal;
	}
	
	_calculate() {
		var errorDelta = this.targetValue - this.inputValue;
		if(Math.abs(errorDelta) < this.errorEpsilon ) errorDelta = 0;
		var inputDelta = this.inputValue - this.lastInput;
		this.lastInput = this.inputValue;
		
		//P
		var pTerm = this.Kp * errorDelta;
		//I
		this.valueI += (this.Kis * errorDelta);
		this.valueI = this._doClamp(this.valueI);
		var iTerm = this.valueI * this.timeStep;
		//D
		var dTerm = (this.Kds * inputDelta) / this.timeStep;

		this.dbgLastP = pTerm;
		this.dbgLastI = iTerm;
		this.dbgLastD = dTerm;

		return pTerm + iTerm + dTerm;
	}
	 
	_doClamp( value ) {
		if(!this.outputRange) return value;
		if(value > this.outputRange.max) value = this.outputRange.max;
		else if(value < this.outputRange.min) value = this.outputRange.min;
		return value;
	}
}

//untested
class PIDFFController extends PIDController {
	constructor(Kp, Ki, Kd, Kv, Ka, timeStep, reverse) {
		super(Kp, Ki, Kd, timeStep, reverse);
		this.setConstantsFF(Kp, Ki, Kd, Kv, Ka);
	}
	
	setConstantsFF(Kp, Ki, Kd, Kv, Ka) {
		if(Kp < 0 || Ki < 0 || Kd < 0 || Kv < 0 || Ka < 0) {
			console.log("error, PIDFF constants must be positive!")
		}
		
		if(!this.reverse) {
			this.Kp = Kp;
			this.Ki = Ki;
			this.Kd = Kd;
			this.Kv = Kv;
			this.Ka = Ka;
		} else {
			this.Kp = (0 - Kp);
			this.Ki = (0 - Ki);
			this.Kd = (0 - Kd);
			this.Kv = (0 - Kv);
			this.Ka = (0 - Ka);
		}
	}
	
	_calculate() {
		var errorDelta = this.targetValue - this.inputValue;
		if(Math.abs(errorDelta) < this.errorEpsilon ) errorDelta = 0;
		var inputDelta = this.inputValue - this.lastInput;
		this.lastInput = this.inputValue;
		
		//P
		var pTerm = this.Kp * errorDelta;
		//I
		this.valueI += (this.Kis * errorDelta);
		this.valueI = this._doClamp(this.valueI);
		var iTerm = this.valueI * this.timeStep;
		//D
		var dTerm = (this.Kds * inputDelta) / this.timeStep;
		//V
		var vTerm = 0; //TODO
		//A
		var aTerm = 0; //TODO

		this.dbgLastP = pTerm;
		this.dbgLastI = iTerm;
		this.dbgLastD = dTerm;
		this.dbgLastV = vTerm;
		this.dbgLastA = aTerm;

		return pTerm + iTerm + dTerm + vTerm + aTerm;
	}
}

//TODO: show output, P,I,D sample values (not just target and value)
class PIDTuneGraph {
	constructor( pid ) {
		this.pid = pid;
		this.maxValue = 0;
		this.maxConstant = 0;
		this.samples = [];
	}
	
	addSample( value, target, ct ) {
		//if(value > this.maxValue) this.maxValue = value;
		//if(target > this.maxValue) this.maxValue = target;
		if(target*2 > this.maxValue) this.maxValue = target*2;
		this.samples.push({v:value, t:target, time:ct})
	}
	
	addSampleEx( value, target, output, p,i,d, ct ) {
		if(target*2 > this.maxValue) this.maxValue = target*2;
		if(p > this.maxConstant) this.maxConstant = p;
		if(i > this.maxConstant) this.maxConstant = i;
		if(d > this.maxConstant) this.maxConstant = d;
		this.samples.push({v:value, t:target, time:ct, o:output, p:p, i:i, d:d})
	}
	
	graph( gfx, x, y, w, h ) {
		gfx.translate(x,y);
		//note: origin is top left, y down is negative
		
		var timeRange = this.samples[this.samples.length-1].time;

		var backgroundStyle = "#FFFFFF";
		var borderStyle = "#000000";
		gfx.drawRectEx( w/2, h/2, w, h, backgroundStyle );
		gfx.drawLineEx( 0, 0, 0, h, borderStyle ); //top left, bottom left
		gfx.drawLineEx( 0, h, w, h, borderStyle ); //bottom left, bottom right
		
		gfx.drawTextEx("0.0", 0 - 15, h, "10px Arial", "#000000")
		gfx.drawTextEx((this.maxValue/2).toFixed(2), 0 - 15, h/2, "10px Arial", "#000000")
		gfx.drawTextEx((this.maxValue).toFixed(2), 0 - 15, 0, "10px Arial", "#000000")
		
		
		gfx.drawTextEx("0.0", 0, h + 15, "10px Arial", "#000000")
		gfx.drawTextEx((timeRange/2).toFixed(2), w/2, h + 15, "10px Arial", "#000000")
		gfx.drawTextEx((timeRange).toFixed(2), w, h + 15, "10px Arial", "#000000")
		
		//graph target line
		var targetStyle = "#FF0000";
		var valueStyle = "#0000FF";
		var outputStyle = "#000000";
		var pStyle = "#00FF00";
		var iStyle = "#FFFF00";
		var dStyle = "#00FFFF";
		var lastX = 0;
		var lastTY = h;
		var lastVY = h;
		var lastOY = h;
		var lastPY = h;
		var lastIY = h;
		var lastDY = h;
		for(var s of this.samples) {
			var gX = (w / timeRange) * s.time;
			
			var vRange = (h/this.maxValue);
			var cRange = (h/this.maxConstant)
			var tY = h - vRange * s.t;
			var vY = h - vRange * s.v;
			var oY = h - vRange * s.o;
			var pY = h - cRange * s.p;
			var iY = h - cRange * s.i;
			var dY = h - cRange * s.d;
			
			gfx.drawLineEx(lastX, lastTY, gX, tY, targetStyle );
			gfx.drawLineEx(lastX, lastVY, gX, vY, valueStyle );
			gfx.drawLineEx(lastX, lastOY, gX, oY, outputStyle );
			
			//gfx.ctx.setLineDash([5, 15]);
			gfx.drawLineEx(lastX, lastPY, gX, pY, pStyle );
			gfx.drawLineEx(lastX, lastIY, gX, iY, iStyle );
			gfx.drawLineEx(lastX, lastDY, gX, dY, dStyle );
			//gfx.ctx.ctx.setLineDash([]);
			
			lastX = gX;
			lastTY = tY;
			lastVY = vY;
			lastOY = oY;
			lastPY = pY;
			lastIY = iY;
			lastDY = dY;
		}
		
		gfx.translate(-x,-y);
	}
}