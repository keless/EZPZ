
class GameStateView extends BaseStateView {
	constructor( model ) {
		super();
		
		this.pModel = model;

		this.underLayer = new NodeView()
		this.rootView.addChild(this.underLayer)

		this.gridNodes = []
		this.gridBase = new NodeView()
		//this.rootView.addChild(this.gridBase)
		//this._createGridNodes()

		this.overLayer = new NodeView()
		this.rootView.addChild(this.overLayer)

		this.libraryPanel = new EntityLibraryPanelView(g_gameData)
		this.libraryPanel.pos.setVal(50, 250)
		this.overLayer.addChild(this.libraryPanel)

		this.libraryPanel.visible = false

		this.timer = new NodeView()
		this.timer.setLabel("Time: 00000000", "12px Arial", "#000000")
		this.timer.pos.setVal(50,10)
		this.overLayer.addChild(this.timer)

		this.SetListener("entityAdded", this.onEntityAdded)
		this.SetListener("entityRemoved", this.onEntityRemoved)
		this.SetListener("tick", this.onTick)

		this.terrain = new TerrainGenerator(1024, 1024)
		this.terrain.generate()
		this.terrainNode = this.terrain.createNodeView()
		this.terrainNode.pos.setVal(512, 512)
		this.rootView.addChild(this.terrainNode)
	}

	getLibraryItemSelectionId() {
		return this.libraryPanel.getSelectedItemId()
	}

	_createGridNodes() {
		var gfx = Service.Get("gfx")
		//var screenW = gfx.getWidth()
		var screenH = gfx.getHeight()

		var tileSize = 30

		var xOff = tileSize + 1 // screenW / (this.pModel.gridW+1)
		var yOff = tileSize + 1
		for(let h = 0; h < this.pModel.gridH; h++) {
			this.gridNodes[h] = []
			for(let w = 0; w < this.pModel.gridW; w++) {
				var node = new NodeView()
				//node.setCircle(5, "#FF00FF")
				node.setRect(tileSize, tileSize, "#44BB44")
				var nodeX = xOff * (w+1)
				var nodeY = screenH - (yOff * (h+1))
				node.pos.setVal(nodeX, nodeY)
				this.gridNodes[h].push(node)
				this.gridBase.addChild(node)

				node.setClick((e)=> {
					if (e.button == 0) {
						// left click
						EventBus.ui.dispatch({evtName: "gridNodeClicked", x: w, y: h})
					} else if (e.button == 2) {
						// right click
						EventBus.ui.dispatch({evtName: "gridNodeRightClicked", x: w, y: h})
					}

					
				})
			}
		}

		for (let e=0; e < this.pModel.entities.length; e++) {
			var ent = this.pModel.entities[e]
			var node = this.gridNodes[ent.pos.y][ent.pos.x]
			var entView = new EntityView(ent)
			node.addChild(entView)
		}
  }
	
	onEntityAdded(e) {
		let gridX = e.gridX
		let gridY = e.gridY
		let entityModel = e.entityModel

		var node = this.gridNodes[gridY][gridX]
		var entView = new EntityView(entityModel)
		node.addChild(entView)
	}

	onEntityRemoved(e) {
		let gridX = e.gridX
		let gridY = e.gridY

		var node = this.gridNodes[gridY][gridX]
		node.removeAllChildren()
	}
	
	onTick(e) {
		let currTick = e.currTick
		this.timer.updateLabel(`Timer: ${currTick}`)
	}
}