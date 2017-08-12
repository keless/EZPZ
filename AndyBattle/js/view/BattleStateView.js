
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

		this._setPortraits(0, 0, 0)
		this._setPortraits(400, 0, 1)
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
	
	_setPortraits(x, y, fIdx) {
		var faction = this.pModel.factions[fIdx]
		var xOff = x
		var margin = 5
		for(var i=0; i< faction.length; i++) {
			var portrait = new PortraitView(faction[i])
			var midX = portrait.size.x / 2
			var midY = portrait.size.y / 2
			portrait.pos.setVal(xOff + midX + margin, y + midY + margin)
			this.overLayer.addChild(portrait)

			console.log("add portrait at " + portrait.pos)

			xOff += portrait.getWidth() + margin
		}
	}
  
}