"use strict"; //ES6

class Facing {
	static get UP() { return FourPoleAnimation.DIR_N; }
	static get RIGHT() { return FourPoleAnimation.DIR_E; }
	static get DOWN() { return FourPoleAnimation.DIR_S; }
	static get LEFT() { return FourPoleAnimation.DIR_W; }

	vecForFacing( facing ) {
		switch(facing) {
			case Facing.UP: 	return new Vec2D(0, 1)
			case Facing.RIGHT: 	return new Vec2D(1, 0)
			case Facing.DOWN: 	return new Vec2D(0, -1)
			case Facing.LEFT: 	return new Vec2D(-1, 0)
		}
	}
}

/*
	dispatches event:
	"update" when Update() is called
	"castStart" when onCastStart, onChannelStart
	"castEnd" when onCastCompleted, onChannelCompleted
*/

class EntityModel extends EventBus {
	
	// in: string name
	constructor(json) {
		super("EntityModel")

		this.eventBus = new EventBus("entityModel");
		this.eventBus.verbose = false;

		this.entityJson = json

		this.name = json.name || "noname"
		this.avatar = json.avatar || "hero"

		this.pos = new Vec2D();
		this.facing = Facing.RIGHT

		this.lifeSpan = this.entityJson.lifeTime || 0
		this.startTick = GameTicks.Get()

		this.maxHeat = this.entityJson.maxHeat || 0
		this.currHeat = 0
	}

	getProgressValue() {
		if (this.shouldShowLifespanBar()) {

			var currTick = GameTicks.Get()
			var lifeDelta = Math.max(currTick - this.startTick, 0) //dont go below 0
			
			return 1 - Math.min(Math.max( lifeDelta / this.lifeSpan, 0), 1) // clamp between 1 and 0 
		} else if (this.shouldShowHeatBar()) {
			return Math.min(Math.max( this.currHeat / this.maxHeat, 0), 1) // clamp between 1 and 0
		}

		return 0.7
	}

	shouldShowProgressBar() {
		return this.shouldShowHeatBar() || this.shouldShowLifespanBar()
	}

	shouldShowLifespanBar() {
		return this.lifeSpan > 0
	}

	shouldShowHeatBar() {
		return this.maxHeat > 0
	}

	UpdateTick(currTick) {
		if (this.shouldShowLifespanBar()) {
			if (this.startTick + this.lifeSpan <= currTick) {
				// life span reached

				//xxx hack: immediately reset
				this.startTick = currTick
			}
		}

		if (this.shouldShowHeatBar()) {
			//xxx hack: automatically grow heat to max for demo
			if (this.currHeat < this.maxHeat) {
				this.currHeat++
			}
		}

		this.dispatch("update", true)
	}

	Update(ct, dt) {
		this.eventBus.dispatch("update", true);
	}

	//EventBus
	addListener(event, listener) {
		this.eventBus.addListener(event, listener);
	}
	removeListener(event, listener) {
		this.eventBus.removeListener(event, listener);
	}
}