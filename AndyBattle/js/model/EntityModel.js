"use strict"; //ES6

class Facing {
	static get UP() { return 0; }
	static get RIGHT() { return 1; }
	static get DOWN() { return 2; }
	static get LEFT() { return 3; }
}

/*
	dispatches event:
	"update" when Update() is called
*/

class EntityModel extends ICastEntity {
	
	// in: string name
	constructor(name, factionIdx) {
		super();

		this.eventBus = new EventBus("entityModel");
		this.eventBus.verbose = false;

		this.name = name;

		this.hp_base = 50;
		this.hp_curr = this.hp_base;

		this.str = 10

		this.pos = new Vec2D();
		this.facing = Facing.RIGHT;

		this.factionIdx = factionIdx
		this.hasActed = false
	}

	canAct() {
		return !(this.hasActed || this.isDead())
	}
	setHasActed(value) {
		this.hasActed = value
	}
	isSameFaction(entity) {
		return this.factionIdx == entity.factionIdx
	}

	getDamageDealt() {
		return this.str
	}

	applyDamageDealt( dmg ) {
		this.hp_curr = Math.max(0, this.hp_curr - dmg) //clamp to zero
	}

	isDead() {
		return (this.hp_curr <= 0)
	}

	Update(ct, dt) {
		//console.log("entity update")	
		this.eventBus.dispatch("update");
	}
	
	addListener(event, listener) {
		this.eventBus.addListener(event, listener);
	}
	removeListener(event, listener) {
		this.eventBus.removeListener(event, listener);
	}
	
}