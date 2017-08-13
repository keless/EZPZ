
class GridNodeModel {
	constructor(x, y) {
		this.x = x
		this.y = y
		this.entity = null
	}
}

// conforms to ICastPhysics 
class BattleStateModel extends BaseStateModel {
	static get TS_IDLE() { return "TS_IDLE"; }
	static get TS_MOV_ANIM() { return "TS_MOV_ANIM"; }
	static get TS_ATK_ANIM() { return "TS_ATK_ANIM"; }
	static get TS_CAST_ANIM() { return "TS_CAST_ANIM"; }
	static get TS_GAME_OVER() { return "TS_GAME_OVER"; }

	constructor( state, factionsJson ) {
		super();
		
		this.pState = state;
		
		this.whosTurn = 0
		this.turnState = BattleStateModel.TS_IDLE

		this.factions = [[], []] //2d array [factionIdx][unitIdx]
		this.entities = []	//all entities
		this.pendingDeaths = [] //temporary list of entities that died in current turn

    this.formationWidth = 3

		this.gridNodes = [] //2D array
		this.gridH = 3
		this.gridW = 6
		for(var h = 0; h < this.gridH; h++) {
			this.gridNodes[h] = []
			for(var w = 0; w < this.gridW; w++) {
				var node = new GridNodeModel(w, h)
				this.gridNodes[h].push(node)
			}
		}

		this.castWorldModel = CastWorldModel.Get();
		this.castWorldModel.setPhysicsInterface( this );

		this.initFactions(factionsJson)

		this.SetListener("entityDeath", this.onEntityDeath, EventBus.game)
	}

	initFactions(factionsJson) {
    for(var f=0; f <factionsJson.length; f++) {
      for( var i=0; i < factionsJson[f].formations.length; i++) {
				var entityJson = factionsJson[f].formations[i]
				if (entityJson == null) continue

        var x = i % this.formationWidth;
        var y = Math.floor(i / this.formationWidth)

				//flip direction if not player faction
        if (f != 0) {
          x = (this.gridW - 1) - x
        }

        this.addEntity(f, entityJson.name, entityJson.avatar, x, y)
      }
    }
	}

	addEntity(factionIdx, name, avatar, x, y ) {
		var ent = new EntityModel( name, avatar, factionIdx );
		ent.pos.setVal(x, y)
		this.factions[factionIdx].push(ent)
		this.entities.push(ent);
		this.gridNodes[y][x].entity = ent
	}

	onEntityDeath(e) {
		var entity = e.entity
		this.pendingDeaths.push(entity)
	}

	doCastEngineStep() {
		//console.log("doCastEngineStep()")
		this.castWorldModel.updateStep(1);
	}

	getFactionDirection(factionIdx) {
		if (factionIdx == 0) return 1
		else return -1
	}

	haveAllEntitiesActed() {
		for(var i=0; i < this.entities.length; i++) {
			if (this.entities[i].canAct()) return false
		}
		return true
	}

	isBattleOver() {
		//for each faction
		for(var f=0; f< this.factions.length; f++) {
			var allDead = true
			//check if all units are dead
			for(var i=0; i < this.factions[f].length; i++) {
				if (!this.entities[i].isDead()) {
					allDead = false
					break;
				}
			}
			if (allDead) {
				console.log("faction " + f + " is defeated")
				return true
			}
		}
		return false
	}

	endRound() {
		// Reset hasActed flag for everyone
		for(var i=0; i < this.entities.length; i++) {
			this.entities[i].setHasActed(false)
		}
	}

	chooseEntityToActForFaction(factionIdx) {
		//todo: select by speed/initiative?
		var actable = []
		for(var i=0; i < this.factions[factionIdx].length; i++) {
			var entity = this.factions[factionIdx][i]
			if (entity.canAct()) {
				actable.push(entity)
			}
		}
		return actable[0]
	}

	changeWhosTurn() {
		if (this.whosTurn == 0) {
			this.whosTurn = 1
		}else {
			this.whosTurn = 0
		}
	}

	isFactionDead(factionIdx) {
		for(var i=0; i < this.factions[factionIdx].length; i++) {
			if (!this.factions[factionIdx][i].isDead()) return false
		}
		return true
	}

	Destroy() {
		for( var e of this.entities ) {
			e.Destroy();
		}
		this.entities = [];

		super.Destroy();
	}
	
	Update(ct, dt) {
		super.Update(ct, dt);
		
		for( var e of this.entities ) {
			e.Update(ct, dt);
		}

		if (this.turnState == BattleStateModel.TS_IDLE) {
			// Select unit and perform action
			var entityModel = this.chooseEntityToActForFaction(this.whosTurn)
			if (entityModel == null) {
				// no units can act for this faction 
				this.pState.action_endTurn(null)
			}else if( entityModel.isCastingOrChanneling() ) {
				//continue casting
				this.pState.action_endTurn(entityModel)
			}else {
				var castPhysics = this
				var factionIdx = entityModel.factionIdx
				var ignoreFriendlies = this.factions[factionIdx]

				var didCast = false
				for(var a of entityModel.getAbilities()) {
					//todo: AI - prioritize spell to use
					if( a.isIdle() && a.canAfford() ) {
						//attempt to find target for ability
						
						var abilityRange = a.getRange();
					
						var targetEntities = castPhysics.GetEntitiesInRadius( entityModel.pos, abilityRange, ignoreFriendlies );
						if( targetEntities.length == 0 ) continue;
						
						//todo: AI - prioritise target
						var targetEntity = targetEntities[0];
						
						this.pState.action_castAbility(entityModel, a, targetEntity)

						didCast = true
						break;
					}
				}

				if (!didCast) {
					var x = entityModel.pos.x
					var y = entityModel.pos.y
					var forwardDirection = this.getFactionDirection(this.whosTurn)
					if (this.isValidPos(x + forwardDirection, y) && this.isSpaceEmpty(x + forwardDirection, y)) {
						//try to move forward
						this.pState.action_moveUnit(x, y, x + forwardDirection, y)
					} else {
						//skip turn
						this.pState.action_endTurn(entityModel)
					}
				}

			}

		}
	}

	// return [] of EntityModels adjacent to 'x,y' that have a different factionIdx than the entity in 'x,y'
	getEnemiesAdjacentTo(x,y) {
		var enemies = []
		var unit = this.unitAtPos(x, y)
		var left = this.unitAtPos(x-1, y)
		if (left != null && left.factionIdx != unit.factionIdx) { enemies.push(left) }
		var right = this.unitAtPos(x+1, y)
		if (right != null && right.factionIdx != unit.factionIdx) { enemies.push(right) }
		var up = this.unitAtPos(x, y+1)
		if (up != null && up.factionIdx != unit.factionIdx) { enemies.push(up) }
		var down = this.unitAtPos(x, y-1)
		if (down != null && down.factionIdx != unit.factionIdx) { enemies.push(down) }
		return enemies
	}


	// return true if 'x,y' is a valid grid node coordinate, otherwise false
	isValidPos(x, y) {
		if (x < 0 || x >= this.gridW) return false
		if (y < 0 || y >= this.gridH) return false
		return true
	}

	// return false if 'x,y' grid coordinate has an entity in it, otherwise true
	isSpaceEmpty(x, y) {
		if (this.isValidPos(x,y)) {
			return (this.gridNodes[y][x].entity == null)
		} else {
			return true
		}
	}
	
	// return EntityModel at grid coordinate 'x,y', otherwise null
	unitAtPos(x, y) {
		if (this.isValidPos(x,y)) {
			return this.gridNodes[y][x].entity
		}else {
			return null
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
	GetEntitiesInRadius( p, r, ignoreList ) { 
		ignoreList = ignoreList || []
		
		var inRadius = [];
		var rSq = r * r;
		
		for( var e of this.entities ) {
			
			if( arrayContains(ignoreList, e) || e.isDead() ) continue;
			
			var dSq = e.pos.getDistSqFromVec(p);
			if( dSq <= rSq ) {
				inRadius.push(e);
			}
		}
		
		return inRadius; 
	}
}