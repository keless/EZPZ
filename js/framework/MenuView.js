"use strict"; //ES6

class MenuView extends TableView
{
  /**
   * 
   * @param {*} options is a json object in the form of 
   *   {
   *    title:"title of menu" (nullable string),
   *    items:[
   *      { label:"label" (string),
   *        fn: callbackFunction
   *       }
   *    ],
   *    backgroundFill:"fillstyle" (nullable string)
   *   }
   */
  constructor( options, w, h ) {
    super(w || 0, h || 0);
    this.sizeToFit = true;

    if(options.title) {
      //add a heading
      var titleNode = new NodeView();
      titleNode.setLabel(options.title);
      titleNode.eatClicks();
      this.addCell(titleNode);
    }

    for (var itemIdx in options.items) {
      var item = options.items[itemIdx];
      var itemNode = new NodeView();
      itemNode.setLabel(item.label);
      itemNode.setClick(item.fn);
      this.addCell(itemNode);
    }

    var bgFillStyle = options.backgroundFill || "rgb(255,255,255)";
    this.setRect(0,0, bgFillStyle);

    if (this.serializable) {
      this.menuOptionsData = options
    }
  }
  toJson() {
    if (!this.serializable) {
			console.error("MenuView - trying to serialize MenuView when seralizable == false")
			return {}
		}

    var json = super.toJson()
    json.classType = "MenuView"
    json.options = this.menuOptionsData
    //w, h  handled by super
    //sizeToFit handled by super

    return json
  }
  loadJson(json) {
    //NOTE: expects json. options, w, h already sent to constructor
    super.loadJson(json)
  }


}