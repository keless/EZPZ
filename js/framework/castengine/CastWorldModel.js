"use strict"; //ES6

//TODO: FIX POSSIBLE BUG: to and from could be pointing at entities that die and delete before castPath is finished
class CastEffectPath
{
	constructor() {
		this.startTime = 0; //double
		this.speed = 0; //double
		
		this.from = null; //ICastEntity
		this.to = null; //ICastEntity
		
		this.toPosition = new Vec2D();
		this.radius = 0.0; //float
		
		this.effects = []; //array<CastEffect>
	}
}

/*
 CastWorldModel
 
  simulates a 'world' that casted abilities happen inside of -- 
    basically just handles effects that are "in transit" to their targets
 
 //TODO: hold all ICastEntities, then implement CastEntityHandles instead of ICastEntity*
			and resolve CastEntityHandles into ICastEntities inside of CastWorldModel
	// this will allow us to gracefully abort effects in transit to/from dead entities
	// alternately1-- hold entities in a graveyard until all references to them expire
	// alternately2-- expose "retain/release" in interface
 
 */

class CastWorldModel {
	static Get() {
		if(! CastWorldModel.instance ) {
			CastWorldModel.instance = new CastWorldModel();
		}
		return CastWorldModel.instance;
	}
	
	constructor() {
		this.m_allEntities = {}; //map<ICastentity, ICastEntity>
		
		this.m_effectsInTransit = []; //array<CastEffectPath>
		
		this.m_pPhysics = null; //ICastPhysics
		
	}
	
	AddEntity( entity ) {
		this.m_allEntities[ entity ] = entity;
	}
	
	RemoveEntity( entity ) { 
		if(this.m_allEntities[entity]) {
			delete this.m_allEntities[entity];
		}
	}
	
	// in: ICastPhysics physics
	setPhysicsInterface( physics ) {
		this.m_pPhysics = physics;
	}
	
	//ICastPhysics
	getPhysicsInterface() { 
		return this.m_pPhysics;
	}
	
	// in: ICastEntity fromEntity, CastEffect effect, CastTarget targetList, double startTime
	addEffectInTransit( fromEntity, effect, targetList, startTime ) {
		var speed = effect.getTravelSpeed();
		if( speed == 0.0 ) {
			this.addEffectInstant(fromEntity, effect, targetList, startTime);
			return;
		}
		
		if( targetList.getType() == CastTargetType.ENTITIES ) {
			var path = new CastEffectPath();
			path.from = fromEntity;
			path.radius = 0.0;
			path.speed = speed;
			path.startTime = startTime;
			
			var targets = targetList.getEntityList();
			for( var i=0; i<targets.length; i++) {
				var target = targets[i];
				
				if( !CastWorldModel.Get().isValid( fromEntity )) continue;
				if( !CastWorldModel.Get().isValid( target )) continue;
				console.log("add effect in transit");
				
				path.to = target;
				path.effects.push(effect);
			}
			
			this.m_effectsInTransit.push(path);
		} else {
			console.warn("non-entity target type not yet implemented")
			//TODO: world position
			//TODO: physics
		}
	}
	
	// in: ICastEntity fromEntity, CastEffect effect, CastTarget targetList, double startTime
	addEffectInstant( fromEntity, effect, targetList, startTime ) {

		if( targetList.getType() == CastTargetType.ENTITIES ) {
			var path = new CastEffectPath();
			path.from = fromEntity;
			path.radius = 0.0;
			path.speed = 0.0;
			path.startTime = startTime;
			
			var targets = targetList.getEntityList();
			for( var i=0; i<targets.length; i++) {
				var target = targets[i];
				
				if(!CastWorldModel.Get().isValid( fromEntity )) continue;
				if(!CastWorldModel.Get().isValid( target )) continue;
				
				path.to = target;
				path.effects.push(effect);
			}
			
			this.applyEffectToTarget( path );
			effect = null
		} else {
			console.warn("non-entity target type not yet implemented")
			//TODO: world position
		}
	}
	
	// in: CastEffectPath path
	applyEffectToTarget( path ) {
		var currTime = CastCommandTime.Get();
		for( var i=0; i<path.effects.length; i++)
		{
			var effect = path.effects[i];
			
			var targets = [];
			if( path.to != null ) {
				if( CastWorldModel.Get().isValid( path.to )) {
					targets.push(path.to);
					
					if( effect.isAoe() ) {
						var radius = effect.getDescriptor("aoeRadius");
						var p = this.m_pPhysics.GetEntityPosition(path.to, p);
						if( p ) {
							console.log("possible bug here -- add targets dont overwrite it?"); //TODO
							targets = this.m_pPhysics.GetEntitiesInRadius(p, radius);
						}
					}
				}
			} else {
				//if targeted position, check physics to determine targets
				targets = this.m_pPhysics.GetEntitiesInRadius(path.toPosition, path.radius);
			}
			
			var uniques = {}; //map<ICastEntity, ICastEntity>
			for( var t=0; t<targets.length; t++) {
				var target = targets[t];
				if( uniques[target] ) continue; //already applied
				uniques[target] = target;
				
				var eff = effect;
				if( t > 0 ) eff = effect.clone(); //targets might modify the effect, so give each additional target it's own copy
				
				eff.setTarget( target );
				eff.m_startTime = currTime; //start the clock on the effect's life time
				
				target.applyEffect( eff );
			}
		}
	}
	
	
	// in: float dt in SECONDS
	updateStep( dt ) {
		var resolvedPaths = []; //array<int>
		
		CastCommandTime.UpdateDelta(dt);
		
		var currTime = CastCommandTime.Get();
		for( var i=0; i< this.m_effectsInTransit.length; i++) {
			//TODO: if blockable, check physics collision
			var path = this.m_effectsInTransit[i];
			
			var distToTargetFromOrigin = 1.0; //TODO: add physics checks
			var timeToTargetFromOrigin = distToTargetFromOrigin / path.speed;
			
			//TODO: if path is physics and can hit before stopping, check physics
			
			if( currTime - path.startTime >= timeToTargetFromOrigin )
			{
				this.applyEffectToTarget( path );
				
				//effect path reached target
				resolvedPaths.push(i);
			}
			
			//clean up resolved paths
			for( var i=resolvedPaths.length - 1; i>= 0; i-- )
			{
				for( var e=this.m_effectsInTransit[i].effects.length - 1; e>=0; e-- ) 
				{
					//this.m_effectsInTransit[i].effects[e].release(); //TODO
					this.m_effectsInTransit[i].effects[e] = null;
				}
				this.m_effectsInTransit[i].effects.length = 0;
				
				this.m_effectsInTransit.splice(i, 1);
			}
		}
		
		CastCommandScheduler.Get().Update();
	}
	
	// in: ICastEntity entity
	//bool
	isValid( entity ) {
		if(this.m_allEntities[entity]) return true;
		return false;
	}
	
}

CastWorldModel.instance = null;

class CastCommandTime
{
	//double
	static Get() { 
		return CastCommandTime.s_time;
	}
	
	// in: double dt in SECONDS
	//double
	static UpdateDelta( dt ) {
		CastCommandTime.s_time += dt;
		return CastCommandTime.s_time;
	}
	
	// in: double t
	//double
	static Set( t ) {
		CastCommandTime.s_time = t;
		return CastCommandTime.s_time;
	}
}

CastCommandTime.s_time = 0.0; //double

class ICastPhysics 
{
	// in: ICastEntity fromEntity, ICastEntity toEntity
	// out: null or Vec2D distVec
	GetVecBetween( fromEntity, toEntity ) { return null; }
	
	// in: ICastEntity entity
	// out: null or Vec2D pos
	GetEntityPosition( entity ) { return null; }
	
	// in: Vec2D p, float r, array[ICastEntity] ignoreEntities
	// out: array<ICastEntity> entities
	GetEntitiesInRadius( p, r, ignoreEntities ) { return null; }
}