"use strict"; //ES6

class BattleState extends AppState {
	constructor() { 
		super();
		this.model = new BattleStateModel(this);
		this.view = new BattleStateView(this.model);
		
		this.playerController = null;
	}
	
	// Prerequisites:
	//	* tx,ty is empty
	//  * movement from-to is legal for the unit in "from"
	action_moveUnit(fx,fy, tx,ty) {
		this.model.turnState = BattleStateModel.TS_MOV_ANIM

		// Model - Move 
		var unitModel = this.model.gridNodes[fy][fx].entity
		this.model.gridNodes[fy][fx].entity = null
		unitModel.pos.setVal(tx, ty)
		this.model.gridNodes[ty][tx].entity = unitModel

		// View - Animate view node movement
		var fromNode = this.view.gridNodes[fy][fx]
		var unitView = fromNode.getChildByIdx(0)
		var toNode = this.view.gridNodes[ty][tx]
		var delta = toNode.pos.getVecSub(fromNode.pos)

		toNode.addChild(unitView)
		unitView.pos.setVal(-delta.x, -delta.y)

		var self = this
		unitView.tweenPos(1.0, new Vec2D(0,0), function() {
			self.action_resolveDeaths(unitModel)
		})
	}

	// Prerequisites:
	//  * fx,fy has a unit that can attack
	//	* tx,ty has a unit that can be attacked by fx,fy
	action_attackUnit(fx, fy, tx, ty) {
		this.model.turnState = BattleStateModel.TS_ATK_ANIM

		// Model - do attack damage
		var attackModel = this.model.gridNodes[fy][fx].entity
		var dmgDone = attackModel.getDamageDealt()
		var victimModel = this.model.gridNodes[ty][tx].entity
		victimModel.applyDamageDealt(dmgDone)
		var isDead = victimModel.isDead()
		if (isDead) {
			this.model.pendingDeaths.push(victimModel)
		}
		
		// View - do attack animation + damage number
		var fromNode = this.view.gridNodes[fy][fx]
		var unitView = fromNode.getChildByIdx(0)
		var toNode = this.view.gridNodes[ty][tx]
		var victimView = toNode.getChildByIdx(0)
		var delta = toNode.pos.getVecSub(fromNode.pos)
		delta.scalarMult(0.5) //only move half the distance, then move back

		var direction = (fx < tx) ? 1 : -1

		var self = this
		unitView.tweenPos(0.4, delta, function() {

			var dmgNumber = new NodeView()
			dmgNumber.setLabel("" + -1 * dmgDone)
			dmgNumber.pos.setVal(5 * direction, -10)
			victimView.addChild(dmgNumber)
			dmgNumber.tweenPos(0.9, new Vec2D(10*direction, -40), function(){
				dmgNumber.removeFromParent()
			})
			// show damage numbers
			unitView.tweenPos(0.6, new Vec2D(0,0), function() {
				self.action_resolveDeaths(attackModel)
			})
		})
	}

	action_resolveDeaths(activeEntityModel) {
		// check for dead units
		for (var i=0; i<this.model.pendingDeaths.length; i++) {
			var deadEnt = this.model.pendingDeaths[i]
			//remove from model grid
			var x = deadEnt.pos.x
			var y = deadEnt.pos.y
			this.model.gridNodes[y][x].entity = null

			//animate death and remove from view grid
			var deadView = this.view.gridNodes[y][x].getChildByIdx(0)
			deadView.tweenScale(0.5, 0.1, function() {
				deadView.removeFromParent()
			})
		}
		this.model.pendingDeaths.length = 0 //clear array

		this.action_endTurn(activeEntityModel)
	}

	action_handleDeath(deadEnitityModel) {
		if (!deadUnit.isDead) {
			console.error("action_handleDeath called for non-dead unit")
			return
		}

		var x = deadUnit.pos.x
		var y = deadUnit.pos.y
		this.model.gridNodes[y][x].entity = null
	}

	action_endTurn(currentUnit) {
		console.log("turn over")
		if (currentUnit) {
			currentUnit.setHasActed(true)
		}
		
		this.model.changeWhosTurn()
		this.model.turnState = BattleStateModel.TS_IDLE

		if (this.model.isBattleOver()) {
			this.action_endGame()
		} else if (this.model.haveAllEntitiesActed()) {
			this.action_endRound()
		}
	}

	action_endRound() {
		console.log("round over")
		this.model.endRound()
	}

	action_endGame() {
		console.log("game over")
		this.model.turnState = BattleStateModel.TS_GAME_OVER
	}
}

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

	constructor( state ) {
		super();
		
		this.pState = state;
		
		this.whosTurn = 0
		this.turnState = BattleStateModel.TS_IDLE

		this.factions = [[], []] //2d array [factionIdx][unitIdx]
		this.entities = []	//all entities
		this.pendingDeaths = [] //temporary list of entities that died in current turn

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

		this.initTest()
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

	initTest() {
		this.addEntity(0, "bob", 0, 0);
		this.addEntity(0, "sam", 3, 0);

		this.addEntity(1, "derp", 5, 0);
		this.addEntity(1, "san", 5, 1);
	}

	addEntity(factionIdx, name, x, y ) {
		var ent = new EntityModel( name, factionIdx );
		ent.pos.setVal(x, y)
		this.factions[factionIdx].push(ent)
		this.entities.push(ent);
		this.gridNodes[y][x].entity = ent
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

		this.gridNodes = []
		this.gridBase = new NodeView()
		this.rootView.addChild(this.gridBase)
		this._createGridNodes()
	}

	_createGridNodes() {
		var gfx = Service.Get("gfx")
		var screenW = gfx.getWidth()
		var screenH = gfx.getHeight()

		var xOff = screenW / (this.pModel.gridW+1)
		var yOff = 100
		for(var h = 0; h < this.pModel.gridH; h++) {
			this.gridNodes[h] = []
			for(var w = 0; w < this.pModel.gridW; w++) {
				var node = new NodeView()
				node.setCircle(5, "#FF00FF")
				var nodeX = xOff * (w+1)
				var nodeY = screenH - (yOff * (h+1))
				node.pos.setVal(nodeX, nodeY)
				this.gridNodes[h].push(node)
				this.gridBase.addChild(node)
			}
		}

		for (var e=0; e < this.pModel.entities.length; e++) {
			var ent = this.pModel.entities[e]
			var node = this.gridNodes[ent.pos.y][ent.pos.x]
			var entView = new EntityView(ent)
			node.addChild(entView)
		}
	}
}