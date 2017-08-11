
class GridNodeModel {
	constructor(x, y) {
		this.x = x
		this.y = y
		this.entity = null
	}
}

// conforms to ICastPhysics 
class BattleStateModel extends BaseStateModel {
	static get TS_IDLE() { return 0; }
	static get TS_MOV_ANIM() { return 1; }
	static get TS_ATK_ANIM() { return 2; }
	static get TS_GAME_OVER() { return 3; }

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
	}

	initFactions(factionsJson) {
    for(var f=0; f <factionsJson.length; f++) {
      for( var i=0; i < factionsJson[f].formations.length; i++) {
				if (factionsJson[f].formations[i] == null) continue

        var x = i % this.formationWidth;
        var y = Math.floor(i / this.formationWidth)

				//flip direction if not player faction
        if (f != 0) {
          x = (this.gridW - 1) - x
        }

        this.addEntity(f, factionsJson[f].formations[i].name, x, y)
      }
    }
	}

	addEntity(factionIdx, name, x, y ) {
		var ent = new EntityModel( name, factionIdx );
		ent.pos.setVal(x, y)
		this.factions[factionIdx].push(ent)
		this.entities.push(ent);
		this.gridNodes[y][x].entity = ent
	}

	doCastEngineStep() {
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
			var unit = this.chooseEntityToActForFaction(this.whosTurn)
			if (unit == null) {
				// no units can act for this faction 
				this.pState.action_endTurn(null)
			}else {	
				var x = unit.pos.x
				var y = unit.pos.y
				var adjacentEnemies = this.getEnemiesAdjacentTo(x, y)
				var forwardDirection = this.getFactionDirection(this.whosTurn)

				//xxx TODO: this.pState.action_castSkill(unit)

				if (adjacentEnemies.length > 0) {
					// do melee attack to an enemy
					var target = adjacentEnemies[0].pos
					//attack 
					this.pState.action_attackUnit(x, y, target.x, target.y)
				} else if (this.isValidPos(x + forwardDirection, y) && this.isSpaceEmpty(x + forwardDirection, y)) {
					//try to move forward
					this.pState.action_moveUnit(x, y, x + forwardDirection, y)
				} else {
					//skip turn
					this.pState.action_endTurn(unit)
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
			if( dSq < rSq ) {
				inRadius.push(e);
			}
		}
		
		return inRadius; 
	}
}