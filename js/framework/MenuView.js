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
  }


}