"use strict"; //ES6

class LoadingState extends AppState {
	constructor( params /*resNameArr, nextStateName*/ ) {
		super();
		this.view = new LoadingView(params[0], params[1]);
	}
}

/**
 * view class for displaying loading information while ensuring resources are loaded (before moving to a state that assumes they are all loaded)
 * 
 * Accepts an array of resource strings to load
 * 	will parse the strings by extention to determine resource types to load as (defaults to json blob)
 * 
 * Sends EventBus.ui.dispatch({evtName:"loadingComplete"}); when completed
 * 
 * If nextStateName is set, will tell the AppStateController to go to that state (with no parameters)
 */

class LoadingView extends BaseStateView {
	constructor( resNameArr, nextStateName ) {
		super();
		this.resLoaded = 0;
		this.resToLoad = resNameArr.slice(); //copy
		this.numToLoadTotal = resNameArr.length;
		this.resLoaded = [];
		this.loadingName = "";
		this.nextStateName = nextStateName;
		
		this.verbose = false;

		this._loadNext( 5 );
	}
	
	_loadNext( stride ) {
		var RP = Service.Get("rp");
		if(this.resLoaded.length == this.numToLoadTotal) {
			this.loadingName = "completed";
			EventBus.ui.dispatch({evtName:"loadingComplete"});
			if (this.nextStateName) {
				var stateController = Service.Get("state");
				stateController.gotoState(this.nextStateName);
			}
			return;
		}
		else if( this.resToLoad.length == 0) {
			return;
		}
		
		var currLoading = this.resToLoad[0];
		this.loadingName = currLoading;
		this.resToLoad.splice(0,1); //remove from front
		var self = this;
		
		if (this.loadingName.substr(0,4) == "fpql") {
			//Handle fourpoleanimation quickload
			var params = this.loadingName.split(":")
			var fileName = params[1]
			var baseName = params[2]
			console.log("LoadingState - quick load fourpoleanim " + fileName + " " + baseName)
			RP.loadFourPoleAnimationQuickAttach(fileName, baseName, function(e){
				self.resLoaded.push(currLoading);
				self._loadNext( 1 ); //recursion inside of anonymous function, yay!
			})
		}else if (this.loadingName.substr(0,2) == "ql") {
			//Handle animation quickload
			var params = this.loadingName.split(":")
			var fileName = params[1]
			var baseName = params[2]
			console.log("LoadingState - quick load animation " + fileName + " " + baseName)
			RP.loadAnimationQuickAttach(fileName, baseName, function(e){
				self.resLoaded.push(currLoading);
				self._loadNext( 1 ); //recursion inside of anonymous function, yay!
			})
		}else {
			//Handle normal extension detection
			var ext = this.loadingName.substr(this.loadingName.lastIndexOf('.') + 1);
			
			if (this.verbose) {
				console.log("load in stride " + stride + " : " + currLoading);
			}

			switch(ext) {
				case "png":
				case "PNG":
				case "bmp":
				case "BMP":
				case "jpg":
				case "JPG":
					RP.loadImage(currLoading, function(e){
						self.resLoaded.push(currLoading);
						self._loadNext( 1 ); //recursion inside of anonymous function, yay!
					});
				break;
				case "sprite":
					RP.loadSprite(currLoading, function(e){
						self.resLoaded.push(currLoading);
						self._loadNext( 1 ); //recursion inside of anonymous function, yay!
					});
				break;
				case "spb":
					RP.loadSpriteBatch(currLoading, function(e){
						self.resLoaded.push(currLoading);
						self._loadNext( 1 ); //recursion inside of anonymous function, yay!
					});
				break;
				//case "anim":
				//case "json":
				default:
					RP.loadJson(currLoading, function(e){
						self.resLoaded.push(currLoading);
						self._loadNext( 1 ); //recursion inside of anonymous function, yay!
					});
				break;
			}
		}

		if(stride > 0) {
			this._loadNext(stride - 1);
		}
	}
	
	Draw( g, x,y, ct) {
		var pct = ~~(100 * ((this.resLoaded.length) / this.numToLoadTotal));
		g.drawRectEx(g.getWidth()/2,g.getHeight()/2, g.getWidth(), g.getHeight(), "#000000");
		g.drawText("("+pct+"%) loading: " + this.loadingName, g.getWidth()/2, 50);
	}
}