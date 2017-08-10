"use strict"; //ES6

class EntityView extends NodeView
{
	constructor( entityModel ) {
		super();
		
		super.setRect(40, 80, "#00AAAA");
		
		this.pEntityModel = entityModel;
		
		this.pEntityModel.addListener("update", this.updateFromModel.bind(this));
	}
	
	Destroy() {
		this.pEntityModel.removeListener("update", this.updateFromModel.bind(this));
		this.pEntityModel = null;
		super.Destroy();
	}

	updateFromModel(e) {
		
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