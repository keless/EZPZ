"use strict"; //ES6

var bShowDebug = false;

class Config {
	static get areSpritesCentered() {
		return true;
	}
}

var game_create = function()
{
	var app = new Application("AndyBattle", "content");
	window.app = app;
	
	var RP = Service.Get("rp")
  RP.baseURL = "AndyBattle/"

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
			"gfx/workbench3.png",
			"gfx/avatars/avatars.spb",
			"fpql:gfx/avatars/avatar.anim:hero_"
			];
	stateController.gotoState("loading", [resources, "battle"]);
	
	app.Play();
};
