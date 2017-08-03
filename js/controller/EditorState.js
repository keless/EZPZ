
class EditorState extends AppState {
	constructor() { 
		super();
		this.view = new EditorStateView();
	}
}

class EditorStateView extends BaseStateView {
	constructor() {
		super();
		var RP = Service.Get("rp");

    var self = this;
    setTimeout(function(){
      self._hackTest()
    }, 1)
  }

  _hackTest() {
    var btnTest = new ButtonView("btnTest", "gfx/btn_blue.sprite", "Test")
    btnTest.pos.setVal(150, 100)
    this.rootView.addChild(btnTest)

    var someRect = new NodeView()
    someRect.setRect(50,50, 50, 50, "#FF0000")
    this.rootView.addChild(someRect)

    this.updateJsonOutput()
  }

  loadFromJson(json) {
    this.rootView = new NodeView()
    this.rootView.loadJson(json)

    this.updateJsonOutput()
  }
  
  clearUI() {
    this.rootView = new NodeView()

    this.updateJsonOutput()
  }

  updateJsonOutput() {
    window.updateJsonOutput()
    window.updateTreeOutput()
  }

  updateInspector() {
    
  }
}