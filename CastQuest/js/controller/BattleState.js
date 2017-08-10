"use strict"; //ES6

class BattleState extends AppState {
	constructor() { 
		super();
		this.model = new BattleStateModel(this);
		this.view = new BattleStateView(this.model);
		
		this.playerController = null;
		
		this.initTest();
	}
	
	createTestEntity( name, pos ) {
		var ent = new EntityModel( name );
		ent.pos.setVec(pos);
		this.model.addEntity(ent);
		var entView = new EntityView(ent);
		this.view.addView(entView);
		
		return ent;
	}
		
	initTest() {
		this.createTestEntity("bob", new Vec2D(0, 50));
		this.createTestEntity("sam", new Vec2D(450, 50));
	}
}

// conforms to ICastPhysics 
class BattleStateModel extends BaseStateModel {
	constructor( state ) {
		super();
		
		this.pState = state;
		
		this.entities = [];
		this.controllers = [];

		this.castWorldModel = CastWorldModel.Get();
		this.castWorldModel.setPhysicsInterface( this );
		
		Service.Add("battleStateModel", this);
	}
	
	
	Destroy() {
		for( var e of this.entities ) {
			e.Destroy();
		}
		this.entities = [];
		this.controllers = [];

		super.Destroy();
	}
	
	addEntity( ent ) {
		this.entities.push(ent);
		var controller = new AIController(ent);
		this.controllers.push(controller);
	}

	
	Update(ct, dt) {
		super.Update(ct, dt);
		
		this.castWorldModel.updateStep(dt);
		
		for( var e of this.entities ) {
			e.Update(ct, dt);
		}
		
		for( var c of this.controllers ) {
			c.Update(ct, dt);
		}
	}
	
	// conforms to ICastPhysics
	// in: ICastEntity fromEntity, ICastEntity toEntity
	// out: null or Vec2D distVec
	GetVecBetween( fromEntity, toEntity ) { 
		var from = fromEntity.pos;
		var to = toEntity.pos;

		return to.getVecSub(from); 
	}
	
	// in: ICastEntity entity
	// out: null or Vec2D pos
	GetEntityPosition( entity ) { 
		return entity.pos;
	}
	
	// in: Vec2D p, float r
	// out: array<ICastEntity> entities
	GetEntitiesInRadius( p, r, ignore ) { 
		
		var inRadius = [];
		var rSq = r * r;
		
		for( var e of this.entities ) {
			
			if( ignore && arrayContains(ignore, e) ) continue;
			
			var dSq = e.pos.getDistSqFromVec(p);
			if( dSq < rSq ) {
				inRadius.push(e);
			}
		}
		
		return inRadius; 
	}
}

class BattleStateView extends BaseStateView {
	constructor( model ) {
		super();
		
		this.pModel = model;

		this.rootView = new ButtonView("btnBack", "gfx/btn_blue.sprite", "Back");
		this.rootView.pos.setVal(150, 25);
	}
	
	addView(view) {
		this.rootView.addChild(view);
	}
	
	Destroy() {
		this.pModel = null;
		super.Destroy();
	}
	
}