"use strict"; //ES6

/**
 * Animation class represents a RESOURCE which describes an animation state graph
 * 
 * AnimationInstance class represents an INSTANCE of the Animation class with state
 *  variables specific to that instance.
 * 
 * Sending an appropriate EVENT to an Animation instance will cause it to move from
 *  the current animation state to the next.
 * When an animation state completes, the "end" event is sent, which it can use to 
 *  automatically transition to a new state, or continue looping.
 */

class Animation {
	constructor() {
		this.events = ["end"];
		this.graph = {
			"idle":{ fps:5, transitions:{"end":"idle"} }
		};
		this.defaultAnim = "idle";
		this.sprites = {};
	}
	LoadFromJson( dataJson ) {
		this.events = dataJson.events;
		this.graph = dataJson.graph;
		this.defaultAnim = dataJson.defaultState;
	}
	
	//For each state $s try to AttachSprite( $s, baseName + $s + extName )
	QuickAttach( baseName, extName, fnOnComplete ) {
		var RP = Service.Get("rp");
		var self = this;
		var imgsDownloading = Object.keys(this.graph).length
		for( var state in this.graph ) {
			//console.log("get sprite "+ state);
			
			(function(stateName){
				RP.getSprite( baseName + state + extName, function(e){
					//console.log("got sprite for state " + stateName);
					var sprite = e.res;
					if(sprite) {
						self.AttachSprite(stateName, sprite);
						imgsDownloading--;
						
						if(fnOnComplete && imgsDownloading == 0) {
							fnOnComplete();
						}
					}
				});
			}(state));

		}
	}
	AttachSprite( animState, sprite ) {
		//console.log("attach sprite for " + animState)
		this.sprites[animState] = sprite;
	}
	
	CreateInstance() {
		return new AnimationInstance(this);
	}
}

class AnimationInstance {
	constructor( animation ) {
		this.pAnimation = animation;
		this.startTime = 0;
		this.currAnim = "null";
		
		//frame index of sprite to draw, refreshed in update()
		this.drawFrame = 0;
		this.drawSprite = null;
		this.fps = 5;
		this.startAnim(0, this.pAnimation.defaultAnim);

		this.pause = false
	}
	
	event ( ct, evt ) {
		var state = this.pAnimation.graph[ this.currAnim ];
		var next = state.transitions[evt];
		if(next) {
			//console.log("anIn move from " + this.currAnim + " to " + next);
			this.startAnim(ct, next);
			return true;
		}else {
			if(evt != this.currAnim) console.warn("failed to handle event "+ evt)
		}
		return false;
	}

	startAnim( ct, animState ) {
		animState = animState || this.pAnimation.defaultAnim;
		this.currAnim = animState;
		this.startTime = ct;
		
		this.drawFrame = 0;
		this.drawSprite = this.pAnimation.sprites[ this.currAnim ];
		
		var state = this.pAnimation.graph[ this.currAnim ];
		this.fps = state.fps || this.drawSprite.getFPS();

		if(!this.drawSprite) {
			console.warn("no sprite for startAnim("+animState+")");
		}
	}
	
	Update( ct ) {
		if (this.pause) return

		//var state = this.graph[ this.currAnim ];
		var sprite = this.drawSprite;
		var numFrames =  sprite.getNumFrames();
		var animLengthS = numFrames / this.fps;
		var dt = ct - this.startTime;
		
		if(dt > animLengthS) {
			//handle end of animation
			//var endTime = this.startTime + animLengthS;
			//console.log("anim " + this.currAnim + " ended")
			this.event(ct, "end");
			return;
		}
		else {
			this.drawFrame = Math.floor((dt / animLengthS) * numFrames);
		}
	}
	
	Draw(gfx, x, y, hFlip) {
		this.drawSprite.drawFrame(gfx, x,y, this.drawFrame, hFlip);
	}
	
	getCurrentSprite() {
		return this.drawSprite;
	}
	
}

/**
 * FourPoleAnimation lets you have a top-down sprite with 
 *  animations for multiple directions (up/down/left/right) 
 *  without added complexity
 */
class FourPoleAnimation extends Animation {
	static get DIR_N() { return 0 }
	static get DIR_E() { return 1 }
	static get DIR_S() { return 2 }
	static get DIR_W() { return 3 }

	constructor() {
		super();
		this.directions = ["N", "E", "S", "W"];
	}

	QuickAttach(baseName, extName, fnOnComplete) {
		var RP = Service.Get("rp");
		var self = this;
		var imgsDownloading = 0;
		var finishedProcessing = false
		for( var state in this.graph ) {
			(function(stateName){
				//try to get the sprite without direction added
				if (RP.hasSprite(baseName + stateName + extName)) {
					imgsDownloading++
					RP.getSprite( baseName + stateName + extName, function(e){
						//console.log("got sprite for state " + stateName);
						var sprite = e.res;
						if(sprite) {
							self.AttachSprite(stateName, sprite);
							imgsDownloading--;
							
							if(fnOnComplete && imgsDownloading == 0 && finishedProcessing) {
								fnOnComplete();
							}
						}
					});
				}

				//try to get the sprite with direction added
				for( var dirIdx in self.directions ) {
					(function(dIdx){
						var dir = self.directions[dIdx];
						
						if (RP.hasSprite(baseName + stateName + dir + extName)) {
							imgsDownloading++
							RP.getSprite( baseName + stateName + dir + extName, function(e){
								var sprite = e.res;
								if(sprite) {
									self.AttachSprite(stateName + dir, sprite);
									imgsDownloading--;
									
									if(fnOnComplete && imgsDownloading == 0 && finishedProcessing) {
										fnOnComplete();
									}
								}
							});
						}
					}(dirIdx));
				}
				
			}(state));
		}
		finishedProcessing = true
	}

	CreateInstance() {
		return new FourPoleAnimationInstance(this);
	}
}

class FourPoleAnimationInstance extends AnimationInstance {

	setDirection( ct, iDirIndex ) {
		if (iDirIndex < 0 || iDirIndex > this.pAnimation.directions.length) {
			console.error("invalid direction index " + iDirIndex + " for FourPoleAnimation with " + this.pAnimation.directions.length + " directions" );
		}

		var direction = this.pAnimation.directions[iDirIndex];
		if (direction == this.dir) {
			return; //already in that direction
		}

		this.dir = direction;

		this.startAnim(ct, this.currAnim);
	}

	startAnim( ct, animState ) {
		if (this.dir == undefined) {
			//grab a direction, any direction
			this.dir = this.pAnimation.directions[0];
		}

		animState = animState || this.pAnimation.defaultAnim;
		this.currAnim = animState;
		this.startTime = ct;
		
		this.drawFrame = 0;

		if (this.pAnimation.sprites[ this.currAnim + this.dir ]) {
			//console.log("start anim " + animState + this.dir )
			// check if sprite has direction
			this.drawSprite = this.pAnimation.sprites[ this.currAnim + this.dir ];
		}else {
			// fall back to a sprite without direction
			this.drawSprite = this.pAnimation.sprites[ this.currAnim ];
			//console.log("fall back to non-directional for " + this.currAnim + " sprite " + this.drawSprite.path)
		}

		var state = this.pAnimation.graph[ this.currAnim ];
		this.fps = state.fps || this.drawSprite.getFPS();

		if(!this.drawSprite) {
			console.warn("no sprite for startAnim("+animState+")");
		}
	}
}