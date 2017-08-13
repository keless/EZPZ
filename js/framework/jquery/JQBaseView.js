"use strict"; //ES6

class JQBaseView {
	constructor(){
		this.div = null;
		this.updateTarget = null;
	}
	
	destroy() {
	   	//remove any listeners, destroy any children
    	this.setUpdateTarget(null);
  	}
	  
	updateFromModel( model, setAsUpdateTarget ) {
		if(setAsUpdateTarget) {
    		this.setUpdateTarget( model );
    	}
		this._updateFromModel( model );
	}
	_updateFromModel( model ) {
		console.log("TODO: override _updateFromModel in base class");
	}
	
	getDiv() {
		//note: be sure to append this div to something on the HTML view tree or this element wont be visible
		return this.div;
	}
	
	setUpdateTarget( target ) {
	    if( this.updateTarget != null ) {
				this._detachTarget( this.updateTarget );
	    }
	
	    this.updateTarget = target;
	    if(target == null) return;
	
		this._attachTarget( target );
	}
	  
	_detachTarget( target ) {
		console.log("TODO: override _dettachTarget in base class");
		//EX: target.removeListener("updateEvtName", this.onUpdateFunction.bind(this) );
	}
	_attachTarget( target ) {
		console.log("TODO: override _attachTarget in base class");
		//EX: target.addListener("updateEvtName", this.onUpdateFunction.bind(this) );
	}
}
