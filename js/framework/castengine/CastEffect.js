"use strict"; //ES6

class CastEffectType {
	static get DAMAGE_STAT() { return "DAMAGE_STAT"; } 	//decrements stats that can be decremented (health, mana, etc)
	static get SUPPRESS_STAT() { return "SUPPRESS_STAT"; } //temporarily decrements stats while in effect (str, agi, etc)
	static get HEAL_STAT() { return "HEAL_STAT"; }  	//increments stats that can be incremented
	static get BUFF_STAT() { return "BUFF_STAT"; } 		//temporarily increases stats while in effect
	static get SEND_EVENT() { return "SEND_EVENT"; } 	//causes an event to be sent to the game bus
}

/*
 
 effects supported:
   * 
 
 todo support:
   * effects that spawn more effects that jump to nearby targets
   * effects that target nearby targets
   * stacking buffs/debuffs (game code specific?)
   * 
 
 */

class CastEffect {
	constructor() {
		this.m_type = CastEffectType.DAMAGE_STAT; //CastEffectType
		this.m_startTime = 0.0; //double
		this.m_lifeTime = 0.0; //double
		this.m_tickFreq = 0.0; //float
		this.m_ticksCompleted = 0; //int
		
		this.m_isChannelEffect = false; //bool
		this.m_isReturnEffect = false; //bool
		this.m_isAoeEffect = false; //bool
		
		this.m_name = ""; //string
		this.m_damageType = ""; //string
		this.m_targetStat = ""; //string
		this.m_stackFlag = ""; //string
		
		this.m_numTicksCompleted = 0; //int
		this.m_value = 0.0; //float - how much damage, or how much suppression, or how much buff, etc
		
		this.m_pTarget = null; //ICastEntity
		this.m_pOrigin = null; //ICastEntity
		
		this.m_pModel = null; //CastCommandModel
		this.m_pParent = null; //CastCommandState
		this.m_modelEffectIndex = 0; //int - index into list of effects held by CastCommandModel
	}

	Destroy() {
		this.cancelTicks();
	}
	
	// in: CastEffect parent
	_initReturnEffect(parent) {
		this.m_isReturnEffect = true;

		var originState = parent.getParentState();
		var from = parent.getOriginEntity();
		var effectIdx = parent.m_modelEffectIndex;
		var isChannelEffect = parent.m_isChannelEffect;
		this.init(originState, effectIdx, from, isChannelEffect);
	}
	
	/// in: CastCommandState originState, int effectIdx, ICastEntity fromEntity, bool isChannelEffect
	init(originState, effectIdx, fromEntity, isChannelEffect) {
		this.m_pParent = originState;
		this.m_pModel = originState.m_pModel;
		//TODO: this.m_pModel.retain();
		this.m_modelEffectIndex = effectIdx;
		this.m_isChannelEffect = isChannelEffect;
		
		var json = this.getDescriptor();
	
	
		if( json.hasOwnProperty("name") )
			this.m_name = json["name"].asString();
		else
			this.m_name = this.m_pModel.getName();
	
		var type = json["effectType"] || "damage";
		if( type == "damage" ){
			this.m_type = CastEffectType.DAMAGE_STAT;
		}else if( type == "heal" ) {
			this.m_type = CastEffectType.HEAL_STAT;
		}else if( type == "buff" ) {
			this.m_type = CastEffectType.BUFF_STAT;
		}else if( type == "debuff" ) {
			this.m_type = CastEffectType.SUPPRESS_STAT;
		}else if( type == "event" ) {
			this.m_type = CastEffectType.SEND_EVENT;
		}
	
		this.m_pOrigin = fromEntity;
	
		this.m_isAoeEffect = json["aoeRadius"] || false;
		this.m_damageType = json["damageType"] || ""; //ex: fire
		this.m_targetStat = json["targetStat"] || ""; //ex: hp_curr
	
		this.m_value = json["valueBase"] || 0.0; //ex: 10 damage

		//handle caster stat modifiers
		if (json["valueStat"]) {
			var valueStat = this.m_pOrigin.getProperty(json["valueStat"])
			if (valueStat == undefined) {
				console.error("entity does not define value stat " + json["valueStat"])
			}else {
				var valueStatMult = json["valueMultiplier"]
				this.m_value += valueStat * valueStatMult
			}
		}

		this.m_lifeTime = json["effectLifetime"] || 0.0; //ex: 1.0 seconds
	
		this.m_tickFreq = json["tickFreq"] || this.m_tickFreq;
	}
	
	// in: ICastEntity to
	setTarget(target) {
		if( !CastWorldModel.Get().isValid( target ) ) return;
		this.m_pTarget = target;
	}

	startTicks() {
		if( this.m_type == CastEffectType.BUFF_STAT || this.m_type == CastEffectType.SUPPRESS_STAT || this.m_type == CastEffectType.SEND_EVENT ) {
			this.doEffect();
		}else {
			this.m_numTicksCompleted = 0;
			CastCommandScheduler.Get().scheduleSelector(this.onTick.bind(this), this.m_tickFreq);
		}
	}
	
	numTicks() {
		return (this.m_lifeTime / this.m_tickFreq) + 1;
	}
	
	//string
	getName() {
		return this.m_name;
	}
	//CastEffectType
	getType() {
		return this.m_type;
	}
	//double
	getStartTime() {
		return this.m_startTime;
	}
	
	//ICastEntity
	getTarget() {
		return this.m_pTarget;
	}
	//ICastEntity
	getOrigin() {
		return this.m_pOrigin;
	}
	
	//double
	getLifeTime() {
		return this.m_lifeTime;
	}
	
	//CastCommandState
	getParentState() {
		return this.m_pParent;
	}
	
	//CastCommandEntity
	getOriginEntity() {
		return this.m_pOrigin;
	}
	
	// in: double currtime
	//double
	getElapsedTime(currTime) {
		return currTime - this.m_lifeTime;
	}
	
	//bool
	isPositiveEffect() {
		return this.m_type == CastEffectType.BUFF_STAT || this.m_type == CastEffectType.HEAL_STAT;
	}

	initReturnEffect() {
		this.m_isReturnEffect = true;

		var originState = parent.m_pParent;
		//ICastEntity* to = parent.m_pTarget;
		var from = parent.m_pOrigin;
		var effectIdx = parent.m_modelEffectIndex;
		var isChannelEffect = parent.m_isChannelEffect;
		this.init( originState, effectIdx, from, isChannelEffect);
	}
	
	//bool
	hasReturnEffect() {
		var json = this.getDescriptor();
		return json.hasOwnMember("returnEffect");
	}
	
	//bool
	isAoe() {
		return this.m_isAoeEffect;
	}
	
	//float
	getTravelSpeed() {
		return this.m_pModel.descriptor["travelSpeed"] || 0.0;
	}
	
	// in: float dt
	onTick(dt) {
		if( !CastWorldModel.Get().isValid( this.m_pTarget ) ) return;

		var currTime = CastCommandTime.Get();
		var delta = currTime - this.m_startTime;
		if( delta > this.m_lifeTime ) delta = this.m_lifeTime;
	
		if( this.m_type == CastEffectType.SUPPRESS_STAT || this.m_type == CastEffectType.BUFF_STAT ) {
			//handle buff/debuff end
			if( delta == this.m_lifeTime ) {
				CastCommandScheduler.Get().unscheduleSelector( this.onTick.bind(this) );
				if( this.m_type == CastEffectType.BUFF_STAT ) {
					this.m_pTarget.endBuffProperty( this.m_targetStat, -1* this.m_value, this );
				}else {
					this.m_pTarget.endBuffProperty( this.m_targetStat, this.m_value, this );
				}
	
				this.m_pTarget.removeEffect(this);
			}
			
		}else {
			//handle dmg/heal over time ticks
			var numTicksPassed = delta / this.m_tickFreq;
	
			var ticksToDo = numTicksPassed - this.m_numTicksCompleted;
			for( var i=0; i< ticksToDo; i++) {
				this.doEffect();
				this.m_numTicksCompleted++;
			}
	
			if( delta >= this.m_lifeTime ) 
			{
				this.m_pTarget.removeEffect(this);
				this.cancelTicks(); 
			}
		}
	}

	cancelTicks() {
		CastCommandScheduler.Get().unscheduleSelector( this.onTick.bind(this) );
	}

	doEffect() {
		var world = CastWorldModel.Get();
		
		if( !world.isValid(this.m_pTarget) ) return;
		
		if( this.m_startTime == 0 ) this.m_startTime = CastCommandTime.Get();
		
		var json = this.getDescriptor();
		
		if( json.hasOwnProperty("react") ) {
			this.m_pTarget.handleEffectReaction( json["react"], this );
		}
		
		switch( this.m_type ) {
			case CastEffectType.DAMAGE_STAT:
				this.m_pTarget.incProperty( this.m_targetStat, -1 * this.m_value, this );
			break;
			case CastEffectType.HEAL_STAT:
				this.m_pTarget.incProperty( this.m_targetStat, this.m_value, this );
			break;
			case CastEffectType.SUPPRESS_STAT:
				this.m_pTarget.startBuffProperty( this.m_targetStat, -1* this.m_value, this );
				CastCommandScheduler.Get().scheduleSelector( this.onTick.bind(this), this.m_lifeTime );
			break;
			case CastEffectType.BUFF_STAT:
				this.m_pTarget.startBuffProperty( this.m_targetStat, this.m_value, this );
				CastCommandScheduler.Get().scheduleSelector( this.onTick.bind(this), this.m_lifeTime );
			break;
			case CastEffectType.SEND_EVENT:
				this.m_pTarget.handleEffectEvent( this.m_name, this );
			break;
			default:
				console.log("TODO: handle effect type " + this.m_type);
			break;
		}
		
		if( json.hasOwnMember("returnEffect") ) {
			json = json["returnEffect"];
			
			//validate
			if( !world.isValid(this.m_pOrigin) ) return;
			
			var bounce = new CastEffect();
			bounce.initReturnEffect(this);
			bounce.m_value = this.m_value;
			//swap direction
			var from = this.m_pTarget;
			var to = this.m_pOrigin;
			
			var ghostTarget = new CastTarget();
			ghostTarget.addTargetEntity(to);
			
			world.addEffectInTransit(from, bounce, ghostTarget, CastCommandTime.Get());
			
			ghostTarget = null; //TODO: release()
		}
	}
	
	// in: string name
	//json
	getDescriptor( descriptorName ) {

		if( this.m_pModel == null || this.m_modelEffectIndex < 0 ) return {};
	
		if( descriptorName ) {
			return json[descriptorName] || {};
		}
	
		var json;
		if( this.m_isChannelEffect ) {
			json = this.m_pModel.getEffectOnChannel(this.m_modelEffectIndex);
		}else {
			json = this.m_pModel.getEffectOnCast(this.m_modelEffectIndex);
		}
	
		if( this.m_isReturnEffect )
		{
			json = json["returnEffect"] || {};
		}
	
		return json;
	}
	
	//CastEffect
	clone() {
		var effect = new CastEffect();
		
		effect.m_type = this.m_type;
		effect.m_startTime = this.m_startTime;
		effect.m_lifeTime = this.m_lifeTime;
		effect.m_tickFreq = this.m_tickFreq;
		effect.m_damageType = this.m_damageType;
		effect.m_targetStat = this.m_targetStat;
		effect.m_stackFlag = this.m_stackFlag;
		effect.m_numTicksCompleted = this.m_numTicksCompleted;
		effect.m_value = this.m_value;
		effect.m_pTarget = this.m_pTarget;
		effect.m_pOrigin = this.m_pOrigin;
		effect.m_pModel = this.m_pModel;
		effect.m_pParent = this.m_pParent;
		effect.m_modelEffectIndex = this.m_modelEffectIndex;
		effect.m_isChannelEffect = this.m_isChannelEffect;
		effect.m_isReturnEffect = this.m_isReturnEffect;
		effect.m_name = this.m_name;
	
		return effect;
	}
}