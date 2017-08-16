
class BattleStateView extends BaseStateView {
	constructor( model ) {
		super();
		
		this.pModel = model;

		this.deathLayer = new NodeView()
		this.rootView.addChild(this.deathLayer)

		this.gridNodes = []
		this.gridBase = new NodeView()
		this.rootView.addChild(this.gridBase)
		this._createGridNodes()

		this.overLayer = new NodeView()
		this.rootView.addChild(this.overLayer)

		var p0 = this._makePortraits(0)
		p0.pos.setVal(5,5)
		this.overLayer.addChild(p0)
		var p1 = this._makePortraits(1)
		p1.pos.setVal( this.rootView.size.x - (p1.size.x + 5), 5 )
		this.overLayer.addChild(p1)

		this.SetListener("entityDamaged", this.onEntityDamaged, EventBus.game)
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
	
	_makePortraits(fIdx) {
		var x = 0
		var y = 0
		var portraits = new NodeView()
		var faction = this.pModel.factions[fIdx]
		var xOff = x
		var margin = 5
		for(var i=0; i< faction.length; i++) {
			var portrait = new PortraitView(faction[i])
			var midX = portrait.size.x / 2
			var midY = portrait.size.y / 2
			portrait.pos.setVal(xOff + midX + margin, y + midY + margin)
			portraits.addChild(portrait)

			portraits.size.y = portrait.size.y
			portraits.size.x += portrait.size.x + margin
			xOff += portrait.getWidth() + margin
		}

		return portraits
	}

	animateBeginCast(fromModel, fnOnAnimComplete) {
		// View - do casting animation
		var fx = fromModel.pos.x
		var fy = fromModel.pos.y

		var fromNode = this.gridNodes[fy][fx]
		var unitView = fromNode.getChildByIdx(0)

		unitView.animEvent(0, "cast")

		// not really doing anything, but wait 1.0
		unitView.tweenPos(1.0, new Vec2D(0,0), function() {
			if (fnOnAnimComplete) fnOnAnimComplete()
		})
	}

	animateMeleeAttack(fromModel, toModel, fnOnHit, fnOnAnimComplete) {
		// View - do attack animation
		var fx = fromModel.pos.x
		var fy = fromModel.pos.y
		var tx = toModel.pos.x
		var ty = toModel.pos.y

		var fromNode = this.gridNodes[fy][fx]
		var unitView = fromNode.getChildByIdx(0)
		var toNode = this.gridNodes[ty][tx]
		var victimView = toNode.getChildByIdx(0)
		var delta = toNode.pos.getVecSub(fromNode.pos)
		delta.scalarMult(0.5) //only move half the distance, then move back

		var direction = (fx < tx) ? 1 : -1

		unitView.animEvent(0, "cast")

		var self = this
		//animate towards target
		console.log(" anim - start")
		unitView.tweenPos(0.4, delta, function() {
			if (fnOnHit) fnOnHit()

			//animate away from target
			unitView.tweenPos(0.6, new Vec2D(0,0), function() {
				unitView.animEvent(0, "idle")
				if (fnOnAnimComplete) fnOnAnimComplete()
			})
		})
	}
	
	onEntityDamaged(e) {
		var dmgDone = e.damage
		var entityModel = e.entity
		var victimView = this.gridNodes[entityModel.pos.y][entityModel.pos.x].getChildByIdx(0)

		if (e.type == "fire") {
			var flame = new NodeView()
			flame.pixelated = true
			flame.setSpriteLoop("gfx/open/flames.sprite", false)
			victimView.addChild(flame) //first add to victim to get its offset
			this.overLayer.addChildKeepingWorldPos(flame)
			flame.tweenRemoveFromParent(0.5)
		}
		
		var direction = (e.direction.x > 0) ? 1 : -1

		var dmgNumber = new NodeView()
		dmgNumber.setLabel("" + -1 * dmgDone)
		dmgNumber.pos.setVal(5 * direction, -10)
		victimView.addChild(dmgNumber) //first add to victim to get its offset
		this.overLayer.addChildKeepingWorldPos(dmgNumber) //then actually add it to the overLayer
		dmgNumber.tweenPosDelta(0.9, new Vec2D(10*direction, -40), function(){
			dmgNumber.removeFromParent()
		})
	}
}