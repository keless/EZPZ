"use strict"; //ES6

class AIController {
	constructor( entityModel ) {
		this.pEntityModel = entityModel;
		
		
	}
	
	Update(ct, dt) {
		if( !this.pEntityModel.canCast() ) return;
		
		var BattleStateModel = Service.Get("battleStateModel");
		
		var abilities = this.pEntityModel.getAbilities();
		var ignoreFriendlies = [ this.pEntityModel ];
		for(var a of abilities) {
			//todo: prioritize spell to use
			if( a.isIdle() && a.canAfford() ) {
				//attempt to find target for ability
				
				var abilityRange = a.getRange();
			
				var targetEntities = BattleStateModel.GetEntitiesInRadius( this.pEntityModel.pos, abilityRange, ignoreFriendlies );
				if( targetEntities.length == 0 ) continue;
				
				//todo: prioritise target
				var targetEntity = targetEntities[0];
				
				var targetGroup = this.pEntityModel.getTarget();
				targetGroup.clearTargetEntities();
				targetGroup.addTargetEntity(targetEntity);
				
				//xxx
				a.startCast();
				break;
			}
		}
	}
}