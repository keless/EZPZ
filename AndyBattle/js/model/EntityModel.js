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

class EntityModel extends ICastEntity {
	
	// in: string name
	constructor(json, factionIdx) {
		super();

		this.eventBus = new EventBus("entityModel");
		this.eventBus.verbose = false;

		this.name = json.name || "noname"
		this.avatar = json.avatar || "hero"

		this.pos = new Vec2D();
		this.facing = (factionIdx == 0) ? Facing.RIGHT : Facing.LEFT

		this.factionIdx = factionIdx
		this.hasActed = false

		// CastEngine
		this.hp_base = json.hp || 50
		this.hp_curr = this.hp_base;

		this.int_base = this.int_curr = json.int || 10
		this.str_base = this.str_curr = json.str || 10
		this.agi_base = this.agi_curr = json.agi || 10

		this.m_abilities = [];

		this.m_abilityTargets = new CastTarget();
		
		this.meleeAbility = this._createAbility("Melee")
		this.m_abilities.push(this.meleeAbility)

		if (json.avatar == "mage") {
			this.rangedAbility = this._createAbility("Fireball")
			this.m_abilities.push(this.rangedAbility)
		}
	}

	_createAbility(jsonName) {
		var abilityJson = g_abilities[jsonName];
		var castCommandModel = new CastCommandModel( abilityJson );
		var castCommandState = new CastCommandState(castCommandModel, this);
		return castCommandState
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
		console.warn("depreciated") //TODO: remove this method when CastEngine is fully working
		return this.str_curr
	}

	applyDamageDealt( dmg ) {
		console.warn("depreciated") //TODO: remove this method when CastEngine is fully working
		this.hp_curr = Math.max(0, this.hp_curr - dmg) //clamp to zero
	}

	isDead() {
		return (this.hp_curr <= 0)
	}

	Update(ct, dt) {
		this.eventBus.dispatch("update");
	}

	//array of abilities
	getAbilities() {
		return this.m_abilities;
	}
	
	isCastingOrChanneling() {
		for( var a of this.m_abilities ) {
			if( a.isCasting() || a.isChanneling() ) return true;
		}
		return false;
	}
	
	// ICastEntity
	// in: string propName, float value, CastEffect effect
	setProperty( propName, value, effect ) {
		console.log("setProperty " + propName + " to " + value)
		if (propName == "hp_curr") {
			this.hp_curr = Math.max(value, this.hp_base)
		} else {
			this[propName] = value
		}
	}
	// in: string propName, float value, CastEffect effect
	incProperty( propName, value, effect ) {
		if (this.isDead()) {
			return;
		}

		//console.log("incProperty " + propName + " by " + value)
		this[propName] += value

		if (propName == "hp_curr") {
			if (value < 0) {
				//console.log("hp_curr inc to " + this.hp_curr)
				this.hp_curr = Math.max(this.hp_curr, 0) //cap minimum health

				if (this.hp_curr == 0) {
					EventBus.game.dispatch({evtName:"entityDeath", entity:this})
				}
			}else {
				this.hp_curr = Math.min(this.hp_curr, this.hp_base) //cap maximum health
			}
		}
	}
	// in: string propName, float value, CastEffect effect
	startBuffProperty( propName, value, effect ) {
		this[propName] += value
	}
	// in: string propName, float value, CastEffect effect
	endBuffProperty( propName, value, effect ) {
		this[propName] -= value
	}

	// in: string propName
	//float
	getProperty( propName ) { return this[propName] }

	//CastTarget
	getTarget() { return this.m_abilityTargets; }
	
	// in: json reaction, CastEffect source
	handleEffectReaction( reaction, source ) {
		console.log("todo: iCastEntity handleEffectReaction " + reaction)
	}
	
	// in: string effectEventName, CastEffect source
	handleEffectEvent( effectEventName, source ) {
		console.log("todo: iCastEntity handleEffectEvent " + effectEventName)
	}
	
	//effect is ARRIVING at this entity
	// in: CastEffect effect
	applyEffect( effect ) {
		switch(effect.m_type) {
			case CastEffectType.DAMAGE_STAT:
				var dir = this.pos.getVecSub(effect.m_pOrigin.pos)
				EventBus.game.dispatch({evtName:"entityDamaged", damage:effect.m_value, type:effect.m_damageType, entity:this, direction:dir})
				this.incProperty(effect.m_targetStat, -effect.m_value, effect)
			break;
			case CastEffectType.HEAL_STAT:
				EventBus.game.dispatch({evtName:"entityHealed", damage:effect.m_value, type:effect.m_damageType, entity:this})
				this.incProperty(effect.m_targetStat, effect.m_value, effect)
			break;
			case CastEffectType.BUFF_STAT:
				console.log("todo: iCastEntity applyEffect BUFF_STAT")
			break;
			case CastEffectType.SUPPRESS_STAT:
				console.log("todo: iCastEntity applyEffect SUPPRESS_STAT")
			break;
			case CastEffectType.SEND_EVENT:
				console.log("todo: iCastEntity applyEffect SEND_EVENT")
			break;
		}
	}
	// in: CastEffect effect
	removeEffect( effect ) {
		console.log("todo: iCastEntity removeEffect " + effect)
	}

	//EventBus
	addListener(event, listener) {
		this.eventBus.addListener(event, listener);
	}
	removeListener(event, listener) {
		this.eventBus.removeListener(event, listener);
	}

	ce_onCastStart(castEngineTime, descriptor) { this.eventBus.dispatch({evtName:"castStart", anim:descriptor}) }
	ce_onChannelStart(castEngineTime, descriptor) { this.eventBus.dispatch({evtName:"castStart", anim:descriptor}) }
	ce_onCastComplete(castEngineTime) { this.eventBus.dispatch("castEnd") }
	ce_onChannelComplete(castEngineTime) { this.eventBus.dispatch("castEnd") }
}