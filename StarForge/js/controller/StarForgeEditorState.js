"use strict"; //ES6

class StarForgeEditorState extends AppState {
	constructor() { 
		super();

        this.model = new StarForgeEditorStateModel(this);
		this.view = new StarForgeEditorStateView(this.model);
    }


}


class StarForgeEditorStateModel extends BaseStateModel {
	constructor( state ) {
		super();
		
		this.pState = state;

        this.starForgeModel = new StarForgeModel()
    }

    Destroy() {
        /*
		for( var e of this.entities ) {
			e.Destroy();
		}
		this.entities = [];
		this.controllers = [];
        */

		super.Destroy();
	}

    Update(ct, dt) {
		super.Update(ct, dt);
		
        /*
		this.castWorldModel.updateStep(dt);
		
		for( var e of this.entities ) {
			e.Update(ct, dt);
		}
		
		for( var c of this.controllers ) {
			c.Update(ct, dt);
		}
        */
	}


}


class StarForgeEditorStateView extends BaseStateView {
	constructor( model ) {
		super();
		
		this.pModel = model;

        this.rootView = new NodeView()


        var gfx = Service.Get("gfx")
		var screenW = gfx.getWidth()
		var screenH = gfx.getHeight()

        var editorView = new StarForgeEditorView(this.pModel.starForgeModel, screenW, screenH)
        editorView.pos.setVal(screenW/2, screenH/2)
        this.addView(editorView)

        var btn = new ButtonView("btnBack", "gfx/btn_blue.sprite", "Back")
        btn.pos.setVal(150, 25)
        this.addView(btn)
	}
	
	addView(view) {
		this.rootView.addChild(view);
	}
	
	Destroy() {
		this.pModel = null;
		super.Destroy();
	}
	
}