"use strict"; //ES6
//#include https://code.jquery.com/ui/1.11.0/jquery-ui.min.js
//NOTE: jQuery using "jQuery()"" format, not "$()"
//#include js/framework/EventBus.js

/*

Generic use input form modal dialog

init json format:
{
title:"Dialog title",
succesEvtName:"OnSuccessEvt",
elements:[
  {type:"text", value:"some text" },
	{type:"intInput", value:343039, label:"someVar:", name:"varName" },
	{type:"strInput", value:"default value", label:"someVar2:", name:"varName2" },
	{type:"select", values:[{value:"someval", text:"Visible text"}], default:0, label:"someVar2:" name:"varName3"}
]
}

events sent
ui:<successEvtName>: { dialog:this, text: someText }
ui:"DialogCancel": { dialog:this }

ex:

show_game_over_dialog = function( didWin )
{
	var title = didWin?"You Win":"You Lose";

	var diag = new FormDialog(jQuery("#content"));
	diag.initWithJson({
		title:title,
		successEvtName:"GameOverOk",
		cancelEvtName:"GameOverOk",
		elements:[
			{type:"text", value:"Would you like to play again?" }
		]
	});

	window.currentDialog = diag
}

*/

class JQFormDialog {
	constructor( parentHtmlElement ) {
		this.parent = parentHtmlElement;
    this.cancelled = false;
	}
  initWithJson( json ) {
    this.cancelled = false;
    var blockThis = this;

		var title = json["title"];
		var successEvtName = json["successEvtName"] || "DialogOk";
		var cancelEvtName = json["cancelEvtName"] || "DialogCancel";
		this.elements = [];
		this.elementDivs = [];

		this.div = jQuery("<div>");

		var div = null;
		var lbl = null;
		jQuery.each( json["elements"], function(idx, value){
			if(value.label) lbl = jQuery("<p>"+value.label+"</p>").css("display", "inline-block");
			switch(value.type){
				case "text":
					div = jQuery("<p>"+value.value+"</p>");
					break;
				case "select":

					div = create_select_div(value.values)
					break;
				case "intInput":
				case "strInput":
					div = jQuery("<input type='text'class='text ui-widget-content ui-corner-all'>").val(value.value);
					break;
				default:
					return true; //continue;
			}
			blockThis.elements.push( value );
			blockThis.elementDivs.push( div );
			if(lbl) blockThis.div.append(lbl);
			blockThis.div.append(div).append("<br>");
		});

    jQuery(this.parentHtmlElement).append(this.div);

    this.div.dialog({
      modal: true,
      title:title,
      buttons: {
        Ok: function() {
					this.done = true;
					var evt = {evtName:successEvtName, dialog:blockThis};
					jQuery.each(blockThis.elements, function(idx, value){
						switch(value.type){
							case "select":
								evt[ value.name ] = blockThis.elementDivs[idx].val();
								break;
							case "intInput":
								evt[ value.name ] = parseInt( blockThis.elementDivs[idx].val() );
								break;
							case "strInput":
								console.log("get strInput " + value.name + " " + blockThis.elementDivs[idx].val());
								evt[ value.name ] = blockThis.elementDivs[idx].val();
								break;
						}
					});
          EventBus.ui.dispatch(evt);
					jQuery(this).dialog("close");
        },
				Cancel: function() {
          //behave same as cancel 'x' button
					this.done = true;
					blockThis.cancelled = true;
					EventBus.ui.dispatch({evtName:cancelEvtName, dialog:blockThis});
					jQuery(this).dialog("close");
				}

      },
			close: function() {
					if( !this.done ) {
            blockThis.cancelled = true;
						EventBus.ui.dispatch({evtName:cancelEvtName, dialog:blockThis});
					}
				}
    });

	}
	getDiv() {
		return this.div;
	}
}
