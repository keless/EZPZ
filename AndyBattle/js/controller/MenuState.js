"use strict"; //ES6

class MenuState extends AppState {
	constructor() { 
		super();
		this.view = new MenuStateView();
	}
}

class MenuStateView extends BaseStateView {
	constructor() {
		super();
		var RP = Service.Get("rp");
		var sprBtnBlue = RP.getSprite("gfx/ui/btn_blue.sprite");
		
		var btnMain = new ButtonView("btnMain", sprBtnBlue, "Main");
		btnMain.pos.setVal(150, 150);
		this.rootView.addChild(btnMain);
		
		
		this.SetListener("btnMain", this.onBtnMain);
	}
	
	onBtnMain() {
		Service.Get("state").gotoState("battle");
	}
}