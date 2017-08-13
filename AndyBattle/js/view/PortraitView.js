class PortraitView extends NodeView
{
	constructor( entityModel ) {
		super();
		
		this.pEntityModel = entityModel;

		var h = 80
		var w = 80
    this.setRect(h, w, "#000000")

		var RP = Service.Get("rp")
		this.setAnim( RP.getFourPoleAnimationQuickAttach("gfx/avatars/avatar.anim","hero_") )
		this.pixelated = true
		this.animInstance.setDirection(0, this.pEntityModel.facing)
    
		this.healthBar = new NodeView();
		this.healthBar.setProgressBar( w * 0.8, 10, "#FF1111", "#11FF11")
		this.healthBar.pos.setVal(0, h/2 - this.healthBar.size.y)
		this.addChild(this.healthBar)

		//this.pEntityModel.addListener("update", this.updateFromModel.bind(this));
		this.SetListener("update", this.updateFromModel, this.pEntityModel.eventBus)
	}

	updateFromModel() {
		var pctHealth = this.pEntityModel.hp_curr / this.pEntityModel.hp_base
		this.healthBar.setProgressVal(pctHealth)

		if (this.pEntityModel.isDead()) { 
			this.animInstance.pause = true
			this.pEntityModel.removeListener("update", this.updateFromModel.bind(this));
		}
	}
}