"use strict"; //ES6

class MapState extends AppState {
	constructor() {
		super();
		this.model = new MapModel();
		this.view = new MapView(this.model);
	}
}

class MapModel extends BaseStateModel {
	constructor() {
		super();
		console.log("map model loaded")
	}
	
}