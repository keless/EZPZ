"use strict"; //ES6

class AppState {
	constructor() {
		this.view = null; // type: BaseStateView
		this.model = null; // type: BaseStateModel
	}
	
	Destroy() {
		if(this.view && this.view.Destroy) this.view.Destroy();
		if(this.model && this.model.Destroy) this.model.Destroy();
	}
}

class AppStateController {
	constructor() {
		this.stateMap = {};
		
		this.currentState = null;
		
		Service.Add("state", this);
	}
	
	addState(stateName, stateClass) {
		this.stateMap[stateName] = stateClass;
	}
	
	gotoState(stateName, params) {
		if(!this.stateMap[stateName]) {
			console.error("no state named " + stateName + " available");
			return;
		}
		
		if( this.currentState ) {
			this.currentState.Destroy();
			this.currentState = null;
		}
		
		//todo: Switch to ...rest arguments
		this.currentState = new this.stateMap[stateName](params);
	}
}

class BaseListener {
	constructor() {
		this._listeners = [];
	}
	
	Destroy( ) {
		this.DestroyListeners();
	}
	
	SetListener(evtName, fn, bus) {
		if(!bus) {
			bus = EventBus.ui;
		}
		if(!fn) {
			console.error("SetListener given invalid callback function for " + evtName );
		}
		
		bus.addListener(evtName, fn.bind(this));
		this._listeners.push({bus:bus, evt:evtName, fn:fn});
	}
	RemoveListener(evtName, fn, bus) {
		if(!bus) {
			bus = EventBus.ui;
		}
		bus.removeListener(evtName, fn.bind(this));
	}
	DestroyListeners() {
		for(var l of this._listeners) {
			l.bus.removeListener(l.evt, l.fn);
		}
	}
}

class BaseStateModel extends BaseListener {
	constructor() {
		super();
	}
	
	Destroy() {
		super.Destroy();
	}
	
	Update(ct, dt) {
		
	}
}

class BaseStateView extends BaseListener {
	constructor() {
		super();
		this.rootView = new NodeView();
		var gfx = Service.Get("gfx")
		this.rootView.size.setVal(gfx.getWidth(), gfx.getHeight())
	}
	
	Destroy() {
		super.Destroy();
	}

	_addButton(strEvt, strLabel, x,y) {
		var btn = new ButtonView(strEvt, "gfx/btn_blue.sprite", strLabel, "12px Arial", "#FFFFFF");
		btn.pos.setVal(x,y);
		this.rootView.addChild(btn);
	}
	
	OnMouseDown(e, x,y) {
		if(this.rootView) {
			this.rootView.OnMouseDown(e, x,y);
		}
	}
	
	OnMouseWheel(e, delta) {}
	
	OnKeyDown(e, x,y) { 
    if( this.rootView ) {
      this.rootView.OnKeyDown(e, x,y);
    }
  }
	OnKeyUp(e, x,y) { 
    if( this.rootView ) {
      this.rootView.OnKeyUp(e, x,y);
    }
  }
	Draw( g, x,y, ct) { 
		if(this.rootView) {
			this.rootView.Draw(g, x,y, ct);
		}
	}
}

