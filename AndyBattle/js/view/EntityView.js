"use strict"; //ES6

class EntityView extends NodeView
{
	constructor( entityModel ) {
		super();
		
		this.pEntityModel = entityModel;

		var RP = Service.Get("rp")
		this.setAnim( RP.getFourPoleAnimationQuickAttach("gfx/avatars/avatar.anim", entityModel.avatar + "_") )
		this.pixelated = true
		this.scale = 2.0
		this.animInstance.setDirection(0, this.pEntityModel.facing)
		
		this.SetListener("castStart", this.onCastStart, this.pEntityModel.eventBus )
		this.SetListener("castEnd", this.onCastEnd, this.pEntityModel.eventBus )
	}

	onCastStart(e) {
		console.log(this.pEntityModel.name + " start cast anim", e.anim)
		this._lastAnim = e.anim
		this.animEvent(0, e.anim || "cast")
	}
	onCastEnd(e) {
		if (this._lastAnim == undefined) {
			console.log("wtf")
		}
		
		if (this._lastAnim != "attack") {
			console.log(this.pEntityModel.name + " end cast anim " + this._lastAnim)
			this.animEvent(0, "idle")
		}
		
	}
}

/*
class AbilityView extends NodeView
{
	constructor( abilityModel ) {
		super();
		
		this.progress = 0;
		
		this.m_pAbility = abilityModel;
		//todo: this.m_pAbility.retain()
		//todo
		
		var w = 100;
		var h = 50;
		
		this.setRect(w, h, "#999999");
		var self = this;
		this.fnCustomDraw.push(function(gfx, x,y, ct){
			var width = self.progress * (w-2);
			var color = "#CCFF11";
			if( self.m_pAbility.isOnCooldown() ) {
				color = "#669900";
			}
			
			gfx.drawRectEx(x - (w/2) + (width/2) + 1, y, width, h-2, color);
		});
		this.setLabel(this.m_pAbility.getName(), "18px Arial", "#FFFFFF");		
		
		this.updateFromModel();
	}
	
	updateFromModel() {
		if( this.m_pAbility.isChanneling() ) {
			this.progress = this.m_pAbility.getChannelPct();
		}else if( this.m_pAbility.isOnCooldown() ) {
			this.progress = this.m_pAbility.getCooldownPct();
		}else if( this.m_pAbility.isCasting() ) {
			this.progress = this.m_pAbility.getCastPct();
		}else {
			this.progress = 1.0;
		}
 	}
}
*/