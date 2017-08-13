"use strict"; //ES6
//#include js/framework/Service.js

var KEY_LEFT = 37;
var KEY_UP = 38;
var KEY_RIGHT = 39;
var KEY_DOWN = 40;

class Application {
	static getTime() {
		var app = Service.Get("app");
		return app.elapsedTime;
	}

	constructor( strAppName, strCanvas2DName, fnOnLoad ) {
		
		this.appName = strAppName;
		this.lastMousePos = new Vec2D();

		//setup canvas keypress handlers
		var appSelf = this;	
		document.title = strAppName;

		document.onkeydown = function(e) {
			appSelf.OnKeyDown(e);
		}
		document.onkeyup = function(e) {
			appSelf.OnKeyUp(e);
		}

		var updateLastMousePos = function(e) {
			var canvas = Service.Get("gfx").canvas;
			var mouseX = e.clientX - (canvas.left || canvas.offsetLeft);
			var mouseY = e.clientY - (canvas.top || canvas.offsetTop);
			appSelf.lastMousePos.setVal(mouseX, mouseY);
		}
		
		//todo: focusin - set selected, EventBus.ui.dispatch({evtName:"focus", hasFocus:true});
		//todo: focusout - set unselected, EventBus.ui.dispatch({evtName:"focus", hasFocus:false});
		document.onmousedown = function(e) {
			updateLastMousePos(e);
			appSelf.OnMouseDown(e, appSelf.lastMousePos.x, appSelf.lastMousePos.y, e.which);
		}
		document.onmousemove = function(e) {
			updateLastMousePos(e);
			EventBus.ui.dispatch({evtName:"onMouseMove", mousePos:appSelf.lastMousePos}, true);
		}
		document.onmouseup = function(e) {
			updateLastMousePos(e);
			EventBus.ui.dispatch({evtName:"onMouseUp", mousePos:appSelf.lastMousePos}, true);
		}
		document.onmouseout = function(e) {
			updateLastMousePos(e);
		}
		
		document.onmousewheel = function(e) {
			var delta = e.wheelDelta;
			appSelf.OnMouseWheel(e, delta);
		}
	
		//update loop vars
		this.lastUpdateTick = 0;
		this.elapsedTime = 0;
		
		Service.Add("app", this);
		this.instanciateSingletons( strAppName, strCanvas2DName );
		
	}
	
	instanciateSingletons( strAppName, strCanvas2DName ) {
			new ResourceProvider();
			new Graphics(strCanvas2DName);
			new AudioManager();
			new Physics();
			new SaveData(strAppName);
			new AppStateController();
	}
	
	Play()
	{
		this._runUpdateLoop();
	}
	Pause()
	{
		this._stopUpdateLoop();
	}
	IsPaused()
	{
		return ( this.UpdateLoopInterval == null ); 
	}
	
	_runUpdateLoop() {
		if( this.UpdateLoopInterval != null ) return; //already running
		this.lastUpdateTick = (new Date()).getTime();
		this.UpdateLoopInterval = setInterval( this._updateLoop.bind(this), 33 );
	}
	_stopUpdateLoop() {
		if( this.UpdateLoopInterval == null ) return; //already stopped
		clearInterval( this.UpdateLoopInterval.bind(this) ); 
		this.UpdateLoopInterval = null;
	}

	_updateLoop() {
		//arguments.callee.minTickPeriod = 1;
		var stateController = Service.Get("state");
		var state = stateController.currentState;
		
		var ct = Date.now(); 
		ct /= 1000.0; //convert to seconds
  	var dt = Math.abs(ct - this.lastUpdateTick);
		this.lastUpdateTick = ct;

		this.elapsedTime += dt;
		
		this.OnUpdateBegin( dt, this.elapsedTime );
		if(state.model) {
			state.model.Update(ct,dt);
		}
		
		var physics = Service.Get("physics");
		physics.Tick();
		
		this.OnUpdateEnd( dt, this.elapsedTime );
		
		var gfx = Service.Get("gfx");
		
		gfx.begin(true);
		
		if(state.view) {
			state.view.Draw(gfx, 0, 0, this.elapsedTime);
		}
		this.OnDraw( gfx, dt, this.elapsedTime );
	}
	
	OnLoad() {
		console.log("override me: Application.onApplicationLoaded()");
	}
	
	/// @param: dtSeconds - delta time for current frame from last frame
	/// @param: ctSeconds - current elapsed app time in seconds
	OnUpdateBegin( dtSeconds, ctSeconds ) {
		//override me
	}
	/// @param: dtSeconds - delta time for current frame from last frame
	/// @param: ctSeconds - current elapsed app time in seconds
	OnUpdateEnd( dtSeconds, ctSeconds ) {
		//override me
	}
	
	/// @param: dtSeconds - delta time for current frame from last frame
	/// @param: ctSeconds - current elapsed app time in seconds
	OnDraw( gfx, dtSeconds, ctSeconds ) {
		//override me
	}
	
	/// @param: e - event object, read key value from e.keyCode
	OnKeyDown(e) {
		//override me
		var stateController = Service.Get("state");
		var state = stateController.currentState;
		state.view.OnKeyDown(e, this.lastMousePos.x, this.lastMousePos.y);
	}
	/// @param: e - event object, read key value from e.keyCode
	OnKeyUp(e) {
		//override me
		var stateController = Service.Get("state");
		var state = stateController.currentState;
		state.view.OnKeyUp(e, this.lastMousePos.x, this.lastMousePos.y);
	}
	/// @param: e - event object, read key value from e.keyCode
	/// @param: mouseX - mouse X position at time of event
	/// @param: mouseY - mouse Y position at time of event
	OnMouseDown(e, mouseX, mouseY) {
		//override me
		var stateController = Service.Get("state");
		var state = stateController.currentState;
		state.view.OnMouseDown(e, mouseX, mouseY);
	}
	
	OnMouseWheel(e, delta) {
		//override me
		//todo
	}
	
	//ex: load game -- json = JSON.parse( localStorage.getItem("sudoku.save") );
	
}