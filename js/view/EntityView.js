"use strict"; //ES6

class EntityView extends NodeView
{
	constructor( entityModel ) {
		super();
		
		super.setRect(400, 400, "#000000");
		
		this.pEntityModel = entityModel;
		
		var title = new NodeView();
		title.setLabel( entityModel.name, "20px Arial", "#FFFFFF" );
		super.addChild(title);
		
		this.pos.setVec( entityModel.pos );
		
		this.abilityViews = [];
		
		var abilities = entityModel.getAbilities();
		var x = 0;
		var y = 50;
		for( var i=0; i< abilities.length; i++) {
			if( i % 2 == 0 ) x = -60;
			else x = 60;
			
			var a = abilities[i];
			var av = new AbilityView(a);
			av.pos.setVal(x, y);
			//todo: set pos
			this.addChild(av);
			this.abilityViews.push(av);
			y += 50;
		}
		
		this.pEntityModel.addListener("update", this.updateFromModel.bind(this));
	}
	
	Destroy() {
		this.pEntityModel.removeListener("update", this.updateFromModel.bind(this));
		this.pEntityModel = null;
		this.abilityViews = {};
		super.Destroy();
	}
	
	updateFromModel() {
		//update any dynamic visuals based on model data
		
		this.pos.setVec( this.pEntityModel.pos );
		
		for( var i in this.abilityViews ) {
			var av = this.abilityViews[i];
			av.updateFromModel();
		}
	}
	
}

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