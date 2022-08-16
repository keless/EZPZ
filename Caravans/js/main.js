"use strict"; //ES6

var bShowDebug = false;

class Config {
	static get areSpritesCentered() {
		return true;
	}
}

var game_create = function()
{	
	var app = new Application("Caravans", "content");
	window.app = app;
	
	var RP = Service.Get("rp")
  	RP.baseURL = "Caravans/"

	var stateController = Service.Get("state");
	stateController.addState("loading", LoadingState);
	stateController.addState("menu", MenuState);
	stateController.addState("game", GameState);
	
	var resources = [
		"gfx/ui/btn_blue.sprite",
		"gfx/ui/btn_dark.sprite",
		"gfx/ui/btn_white.sprite",
		"gfx/aelius_floor_pattern.jpg",
		"gfx/aelius_floor.jpg",
		"gfx/aelius_floor.jpg",
			];
	stateController.gotoState("loading", [resources, "game"]);
	
	app.Play();
};
