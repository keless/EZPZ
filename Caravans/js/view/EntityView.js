"use strict"; //ES6

class EntityView extends NodeView
{
	constructor( entityModel ) {
		console.log("create EntityView")
		super();
		
		this.pEntityModel = entityModel

		var RP = Service.Get("rp")

    this.entityJson = entityModel.entityJson
    this.iconSize = 25
    this.setCircle( this.iconSize /2, "#445500")
    this.setLabelWithOutline(this.entityJson.label, "12px Arial", "#FFFFFF", "#000000", 1)

		//this.setImage( RP.getImage("gfx/entity_name.png") )

		//this.setAnim( RP.getFourPoleAnimationQuickAttach("gfx/avatars/avatar.anim", entityModel.avatar + "_") )
		this.pixelated = true
		//this.scale = 2.0

		this.progressBar = null
		this.initProgressBarIfNeeded()

		this.SetListener("update", this.onModelUpdate, this.pEntityModel)
	}

	initProgressBarIfNeeded() {
		if (this.progressBar == null && this.pEntityModel.shouldShowProgressBar()) {
			this.progressBar = new NodeView()

			var fillColor = "#FFFF00"
			if (this.pEntityModel.shouldShowHeatBar()) {
				fillColor = "#FF0000"
			}
			
			this.progressBar.setProgressBar(this.iconSize, 4, "rgba(0,0,0,0)", fillColor)
			this.progressBar.pos.setVal(0, this.iconSize/2)
			this.addChild(this.progressBar)
		} else {
			//console.warn("already init'd progress bar")
		}
	}

	onModelUpdate() {
		if (this.progressBar != null) {
			this.progressBar.setProgressVal(this.pEntityModel.getProgressValue())
		}
		
	}
}
