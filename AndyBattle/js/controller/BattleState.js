"use strict"; //ES6

class BattleState extends AppState {
	constructor() {
		super();

    var factonsJson = [{formations:[
      {name:"sam", hp:40, str:5, agi:15, int:20, avatar:"mage"}, null, { name:"bob", hp:50, str:10, agi:15, int:5, avatar:"hero"}, null, null, null, null, null, null
    ]}, {formations:[
      null, null, {name:"bob", hp:75, str:15, agi:10, int:5, avatar:"centaur"}, null, { name:"ders", hp:40, str:5, agi:10, int:20, avatar:"mage"}, null, null, null, null
    ]}]

		this.model = new BattleStateModel(this, factonsJson);
		this.view = new BattleStateView(this.model);
	}
	
	action_castAbility(entityModel, ability, targetEntityModel) {
		this.model.turnState = BattleStateModel.TS_CAST_ANIM
		if( entityModel.isCastingOrChanneling() ) {
			console.warn("called action_castAbility on entity that is already casting or channeling")
			this.action_endTurn(entityModel)
			return
		}
		
		//set the target group
		var targetGroup = entityModel.getTarget();
		targetGroup.clearTargetEntities();
		targetGroup.addTargetEntity(targetEntityModel);

		var self = this
		var fnOnAnimationComplete = function() {
			console.log("cast anim complete")
			self.action_endTurn(entityModel)
		}

		//todo: start animation for casting this ability
		var startCast = ability.getDescriptor("startCast")
		if (startCast != null) {
			switch (startCast) {
				case "meleeAttack":
					this.view.animateMeleeAttack(entityModel, targetEntityModel, function() {
						ability.startCast();
					}, fnOnAnimationComplete)
				break;
				case "beginCast":
					ability.startCast()
					this.view.animateBeginCast(entityModel, fnOnAnimationComplete)
				break;
				default:
					console.warn("castAbility has no animation implementation for " + startCast)
					//start the cast
					ability.startCast();
				break;
			}
		}else {
			ability.startCast();
		}
	
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
			self.action_endTurn(unitModel)
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
			victimView.addChild(dmgNumber) //first add to victim to get its offset
			self.view.overLayer.addChildKeepingWorldPos(dmgNumber) //then actually add it to the overLayer
			dmgNumber.tweenPosDelta(0.9, new Vec2D(10*direction, -40), function(){
				dmgNumber.removeFromParent()
			})
			// show damage numbers
			unitView.tweenPos(0.6, new Vec2D(0,0), function() {
				self.action_endTurn(attackModel)
			})
		})
	}

	action_endTurn(currentUnit) {
		//console.log("turn over")
		if (currentUnit) {
			currentUnit.setHasActed(true)
		}

		this.model.doCastEngineStep()
		
		this.action_resolveDeaths()

		this.model.turnState = BattleStateModel.TS_IDLE

		if (this.model.isBattleOver()) {
			this.action_endGame()
		} else if (this.model.haveAllEntitiesActed()) {
			this.action_endRound()
		}
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
			this.view.deathLayer.addChildKeepingWorldPos(deadView)
			deadView.tweenScale(0.5, 0.1, function() {
				deadView.removeFromParent()
			})
		}
		this.model.pendingDeaths.length = 0 //clear array
	}

	action_endRound() {
		//console.log("round over")
		this.model.endRound()
	}

	action_endGame() {
		//console.log("game over")
		this.model.turnState = BattleStateModel.TS_GAME_OVER

		var stateController = Service.Get("state");
		stateController.gotoState("menu")
	}
}

