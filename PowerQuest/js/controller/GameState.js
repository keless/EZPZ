"use strict"; //ES6

class GameState extends AppState {
	constructor() {
		super();

		this.model = new GameStateModel(this);
		this.view = new GameStateView(this.model);

		//this.SetListener("libraryItemClicked", this.onLibraryItemClicked)
		this.SetListener("gridNodeClicked", this.onGridNodeClicked)
		this.SetListener("gridNodeRightClicked", this.onGridNodeRightClicked)
	}

	/*
	onLibraryItemClicked(e) {
		var itemId = e.itemId
		var itemJson = e.itemJson

		console.log("xxx todo: price check + begin drag on library item " + itemId)
	}
	*/

	onGridNodeClicked(e) {
		let gridX = e.x
		let gridY = e.y
		console.log(`xxx clicked grid at ${gridX},${gridY}`)

		let libraryItemSelection = this.view.getLibraryItemSelectionId()
		if (libraryItemSelection != null) {
			console.log("xxx try place entity for " + libraryItemSelection)
			this.doPlaceEntity(libraryItemSelection, gridX, gridY)
		}
	}

	onGridNodeRightClicked(e) {
		// remove entity
		this.doRemoveEntityAt(e.x, e.y)
	}

	doPlaceEntity( entityId, gridX, gridY ) {
		if (this.model.isSpaceEmpty(gridX, gridY)) {
			console.log("xxx add entity at " + gridX + "," + gridY)
			//xxx todo: costs?
			var entityJson = g_gameData[entityId]
			this.model.addEntity(entityJson, gridX, gridY)
		} else {
			console.log("xxx space not empty at " + gridX + "," + gridY)
			// Handle replacement action maybe?
		}
	}

	doRemoveEntityAt( gridX, gridY ) {
		if (!this.model.isSpaceEmpty(gridX, gridY)) {
			let entity = this.model.getEntityAt(gridX, gridY)
			//xxx todo: restore costs?
			this.model.removeEntityAt(gridX, gridY)
		}
	}
}



