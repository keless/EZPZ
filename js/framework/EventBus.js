"use strict"; //ES6

///EX: EventBus.ui.dispatch({evtName:evtName});
///EX: EventBus.game.addListener("updateEvtName", this.onUpdateFunction.bind(this) );
///EX: EventBus.game.removeListener("updateEvtName", this.onUpdateFunction.bind(this) );
class EventBus {
  constructor( strBusName ) {
    this.listeners = {};
		this.busName = strBusName;
		this.verbose = true;
  }
  
  Destroy() {
    for( var evt of this.listeners ) {
      this.clearListeners(evt);
    }
  }

  addListener ( strEventName, callbackFunction ) {
    if( !(strEventName in this.listeners) )
    {
      this.listeners[strEventName] = [];
    }
    this.listeners[strEventName].push(callbackFunction);
  }
  removeListener ( strEventName, callbackFunction ) {
    if(!(strEventName in this.listeners) ) return; //nothing to remove

    var idx = this.listeners[strEventName].indexOf( callbackFunction );
    this.listeners[strEventName].splice( idx, 1 );
  }
	clearListeners( strEventName ) {
		this.listeners[strEventName] = [];
	}
  //note: expects evtObj.evtName to be the strEventName to send to
  dispatch ( evtObj, quiet ) {
    if (typeof evtObj === 'string' || evtObj instanceof String) {
      evtObj = { 'evtName': evtObj };
    }
    
    if(!evtObj.evtName) { console.log("abort dispatch event -- no evtName %O", evtObj); return; }

		if(this.verbose && !quiet) {
			console.log("EB["+this.busName+"] "+evtObj.evtName+":%O", evtObj);
		}

    if(!this.listeners[evtObj.evtName] ) return; //no one listening

    this.listeners[evtObj.evtName].forEach(function(ele, idx, arr){
      ele( evtObj ); //dispatch the event
    });
  }
  
  static Get(strBusName) {
    if(!this.g_eventBuses) this.g_eventBuses = {};
    
    if( !this.g_eventBuses[strBusName] ) {
      this.g_eventBuses[strBusName] = new EventBus( strBusName ); //create new
    }
    return this.g_eventBuses[strBusName];
  }
  
  //default channels
  static get game() {
    return this.Get("game");
  }
  
  static get ui() {
    return this.Get("ui");
  }
  
  static get sfx() { 
    return this.Get("sfx");
  }
}
