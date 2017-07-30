"use strict"; //ES6

var bShowDebug = false;

class Config {
	static get areSpritesCentered() {
		return true;
	}
}

var game_create = function()
{
	var app = new Application("Territories", "content");
	window.app = app;
	
	var stateController = Service.Get("state");
	stateController.addState("loading", LoadingState);
	stateController.addState("menu", MenuState);
	stateController.addState("battle", BattleState);
	
	var resources = [
			"gfx/btn_blue.sprite",
			"gfx/btn_dark.sprite",
			"gfx/btn_white.sprite",
			"gfx/aelius_floor.jpg",
			"gfx/explosion_1.sprite",
			"gfx/workbench3.png"
			];
	stateController.gotoState("loading", [resources, "menu"]);
	
	app.Play();
};
