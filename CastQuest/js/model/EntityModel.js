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
	constructor(name) {
		super();

		this.eventBus = new EventBus("entityModel");
		this.eventBus.verbose = false;

		this.name = name;

		this.hp_base = 100;
		this.hp_curr = this.hp_base;

		this.xp_level = 1;
		this.xp_next = 0;
		this.xp_curr = 0;

		this.int_base = this.int_curr = 10;
		this.str_base = this.str_curr = 10;
		this.agi_base = this.agi_curr = 10;

		this.items = [];
		
		this.m_abilities = []; 

		this.m_abilityTargets = new CastTarget();

		this.pos = new Vec2D();
		this.facing = Facing.RIGHT;
		
		var abilityJson = g_abilities[0];
		var castCommandModel = new CastCommandModel( abilityJson );
		var castCommandState = new CastCommandState(castCommandModel, this);
		
		this.testAbility = castCommandState;
	}

	Destroy() {
		super.Destroy();
	}
	
	//array of abilities
	getAbilities() {
		return [ this.testAbility ];
	}
	
	canCast() {
		//no abilities are 'casting' or 'channeling'
		for( var a of this.m_abilities ) {
			if( a.isCasting() || a.isChanneling() ) return false;
		}
		return true;
	}
	
	getTarget() {
		return this.m_abilityTargets;
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