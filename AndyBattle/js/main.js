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
			"gfx/ui/btn_blue.sprite",
			"gfx/ui/btn_dark.sprite",
			"gfx/ui/btn_white.sprite",
			"gfx/avatars/avatars.spb",
			"fpql:gfx/avatars/avatar.anim:hero_"
			];
	stateController.gotoState("loading", [resources, "battle"]);
	
	app.Play();
};
