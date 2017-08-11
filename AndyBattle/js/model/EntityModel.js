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
*/

class EntityModel extends ICastEntity {
	
	// in: string name
	constructor(name, factionIdx) {
		super();

		this.eventBus = new EventBus("entityModel");
		this.eventBus.verbose = false;

		this.name = name;

		this.pos = new Vec2D();
		this.facing = (factionIdx == 0) ? Facing.RIGHT : Facing.LEFT

		this.factionIdx = factionIdx
		this.hasActed = false

		// CastEngine
		this.hp_base = 50;
		this.hp_curr = this.hp_base;

		this.int_base = this.int_curr = 10;
		this.str_base = this.str_curr = 10;
		this.agi_base = this.agi_curr = 10;

		this.m_abilities = [];

		this.m_abilityTargets = new CastTarget();

		var abilityJson = g_abilities["Melee"];
		var castCommandModel = new CastCommandModel( abilityJson );
		var castCommandState = new CastCommandState(castCommandModel, this);
		
		this.meleeAbility = castCommandState;
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
		return this.str_curr
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

	//array of abilities
	getAbilities() {
		return [ this.testAbility ];
	}
	
	isCastingOrChanneling() {
		for( var a of this.m_abilities ) {
			if( a.isCasting() || a.isChanneling() ) return true;
		}
		return false;
	}
	
	getTarget() {
		return this.m_abilityTargets;
	}
	
	//EventBus
	addListener(event, listener) {
		this.eventBus.addListener(event, listener);
	}
	removeListener(event, listener) {
		this.eventBus.removeListener(event, listener);
	}
}