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


        // TODO: load json from somewhere if we're continuing
        var json = null

        this.starForgeModel = new StarForgeModel(json)

		this.SetListener("starForgeEditorModuleClicked", (e)=>{
            if (e.mouseBtn == 0) { 
                // left mouse button
                this.rotateStarForgePipeModule(e.moduleIndex)
            } else if (e.mouseBtn == 2) {
                // right mouse button
                this.changeStarForgeModule(e.moduleIndex)
            }
		})
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

    // index into the modules array of the module to be changed
    changeStarForgeModule(index) {
        if (index < 0 || index >= this.starForgeModel.modules.length) {
			console.error(`invalid index for module index ${index}`)
			return
		}

        var didChange = false;
        var module = this.starForgeModel.modules[index]
        if (module.type >= StarForgeModel.TYPE_PIPE_LR && module.type <= StarForgeModel.TYPE_PIPE_RUD ) {
            // replace pipe with empty
            module.type = StarForgeModel.TYPE_EMPTY
            didChange = true
        } else {
            // get the index of the forge (so we can enforce there is only ever one forge)
            var forgeIndex = this.starForgeModel.findNodeType(StarForgeModel.TYPE_FORGE);

            module.type = module.type + 1

            if (module.type == StarForgeModel.TYPE_FORGE && (forgeIndex != -1 && forgeIndex != index)) {
                // we've just created a second forge module; bump the type one more
                module.type = module.type + 1
            }
            didChange = true
        }

        if (didChange) {
            EventBus.ui.dispatch({ evtName: "starForgeModelUpdated", moduleIndex: index })
        }
    }

    // index into the modules array of the module to be rotated; must be a pipe
	rotateStarForgePipeModule(index) {
		if (index < 0 || index >= this.starForgeModel.modules.length) {
			console.error(`invalid index for module index ${index}`)
			return
		}

		var module = this.starForgeModel.modules[index]
		if (module.type >= StarForgeModel.TYPE_PIPE_LR && module.type <= StarForgeModel.TYPE_PIPE_RUD ) {
			// Module is a pipe, rotate through the different pipe types
			var newType = (module.type + 1)
			if (newType > StarForgeModel.TYPE_PIPE_RUD) {
				// wrap the pipe type if it went out of bounds
				newType = StarForgeModel.TYPE_PIPE_LR
			}
			module.type = newType

			EventBus.ui.dispatch({ evtName: "starForgeModelUpdated", moduleIndex: index })
		}
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