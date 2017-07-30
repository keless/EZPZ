"use strict"; //ES6

var bShowDebug = false;

class Config {
	static get areSpritesCentered() {
		return true;
  }
  static get canSerializeNodeViews() {
    return true
  }
}

function game_create()
{
	var app = new Application("UIEditor", "content");
  window.app = app;
  
  window.jsonOutput = document.getElementById("jsonOutput")
	
	var stateController = Service.Get("state");
	stateController.addState("loading", LoadingState);
	stateController.addState("editor", EditorState);
	
	var resources = [
			"gfx/btn_blue.sprite",
			"gfx/btn_dark.sprite",
			"gfx/btn_white.sprite",
			"gfx/aelius_floor.jpg",
			"gfx/explosion_1.sprite",
			"gfx/workbench3.png"
			];
	stateController.gotoState("loading", [resources, "editor"]);
	
	app.Play();
};

window.updateJsonOutput = function() {
  var editorState = Service.Get("state").currentState
  var json = editorState.view.rootView.toJson()
  window.jsonOutput.value = JSON.stringify(json)
}

window.editorReset = function() {
  console.log("doReset")
  var editorState = Service.Get("state").currentState
  editorState.view.clearUI()
}

window.editorLoad = function() {
  console.log("doLoad")

  var editorState = Service.Get("state").currentState
  var json = JSON.parse(window.jsonOutput.value)
  editorState.view.loadFromJson(json)
}

window.editorCopyToClipboard = function() {
  console.log("do copy to clipboard")

  //1) highlight the text in the text area
  window.jsonOutput.select()
  //2) run 'copy' command
  var successful = document.execCommand('copy');
  console.log('Copying text command ' + successful ? 'success' : 'failed')
}