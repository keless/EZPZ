"use strict"; //ES6

class ICastEntity {
	
	constructor() { 
		CastWorldModel.Get().AddEntity(this); 
	}
	Destroy() {
		CastWorldModel.Get().RemoveEntity(this);
	}
	
	// in: string propName, float value, CastEffect effect
	setProperty( propName, value, effect ) {}
	// in: string propName, float value, CastEffect effect
	incProperty( propName, value, effect ) {}
	// in: string propName, float value, CastEffect effect
	startBuffProperty( propName, value, effect ) {}
	// in: string propName, float value, CastEffect effect
	endBuffProperty( propName, value, effect ) {}

	// in: string propName
	//float
	getProperty( propName ) { return 0; }

	//CastTarget
	getTarget() { return null; }
	
	// in: json reaction, CastEffect source
	handleEffectReaction( reaction, source ) {}
	
	// in: string effectEventName, CastEffect source
	handleEffectEvent( effectEventName, source ) {}
	
	//effect is ARRIVING at this entity
	// in: CastEffect effect
	applyEffect( effect ) {}
	// in: CastEffect effect
	removeEffect( effect ) {}

	//state notifications
	ce_onCastStart(castEngineTime, anim) {}
	ce_onChannelStart(castEngineTime, anim) {}
	ce_onCastComplete(castEngineTime) {}
	ce_onChannelComplete(castEngineTime) {}
}
