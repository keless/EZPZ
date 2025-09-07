"use strict"; //ES6

var bShowDebug = false;

class Config {
	static get areSpritesCentered() {
		return true;
	}
}

var game_create = function()
{
	var app = new Application("Star Forge", "content");
	window.app = app;

	var RP = Service.Get("rp")
    RP.baseURL = "StarForge/"
	
	var stateController = Service.Get("state");
	stateController.addState("forgeEditor", StarForgeEditorState);
	//stateController.addState("menu", MenuState);
	//stateController.addState("battle", BattleState);
	
	var resources = [
			"gfx/btn_blue.sprite",
			"gfx/btn_dark.sprite",
			"gfx/btn_white.sprite",
			"gfx/aelius_floor.jpg",
			"gfx/explosion_1.sprite"
			];
	stateController.gotoState("loading", [resources, "forgeEditor"]);
	
	app.Play();
};
