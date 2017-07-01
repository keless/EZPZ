"use strict"; //ES6

/*
 CastTarget 
  used to describe what a cast ability is trying to affect
*/

class CastTargetType
{
	static get ENTITIES() { return 0; }
	static get WORLD_POSITION() { return 1; }
	static get RELATIVE_POSITION() { return 2; }
}

class CastTarget
{
	// in: CastTargetType
	constructor( ctype ) {
		ctype = ctype || CastTargetType.ENTITIES;
		this.m_type = ctype;
		this.m_position = new Vec2D();
		this.m_entityList = []; //array<ICastEntity>
	}
	
	//array<ICastEntity>
	getEntityList() { 
		return this.m_entityList;
	}
	//CastTargetType
	getType() { return this.m_type; }
	
	clearTargetEntities() {
		this.m_entityList.length = 0;
	}
	
	// in: ICastEntity target
	addTargetEntity( target ) {
		if(!target) return;
		
		this.m_type = CastTargetType.ENTITIES;
		this.m_entityList.push(target);
	}
	
	// in: Vec2D target
	setTargetPosition( target ) {
		this.m_position = target;
	}
	
	//will purge pointers to entities that are invalid
	validateTargets() {
		var world = CastWorldModel.Get();
		for( var i=this.m_entityList.length - 1; i>=0; i-- ) 
		{
			if( !world.isValid( this.m_entityList[i] )) {
				this.m_entityList.splice( i, 1 );
			}
		}
	}
	
	// in: float range, ICAstEntity fromEntity
	//bool
	hasTargetsAtRangeFromEntity( range, fromEntity ) {
		var rangeSq = range*range;
		if( this.m_type == CastTargetType.ENTITIES ) {
			var foundTarget = false;
			var world = CastWorldModel.Get();
			for( var i=this.m_entityList.length - 1; i>=0; i-- ) 
			{
				if( !world.isValid( this.m_entityList[i] )) {
					this.m_entityList.splice( i, 1 );
				} else {
					if( !foundTarget ) {
						var to = this.m_entityList[i];
						var distVec = world.getPhysicsInterface().GetVecBetween( fromEntity, to );
						
						if( distVec && distVec.getMagSq() <= rangeSq ) {
							foundTarget = true;
							//note: dont break here, we still want to perform world->isValid on the rest of the elements
						}
					}
				}
			}
			
			return foundTarget;
		} else {
			return true; //TODO: physics targeting (aka skill shots)
		}
	}
	
	//bool
	hasValidTarget() {
		if( this.m_type == CastTargetType.ENTITIES )
		{
			this.validateTargets();
			return this.m_entityList.length > 0;
		} else {
			return true; //TODO: physics targeting (aka skill shots)
		}
	}
}