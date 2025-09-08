"use strict"; //ES6

class StarForgeModuleView extends NodeView {
    constructor(model, cellSize) {
        super();

        this.pModel = model

        this.setRectOutline(cellSize, cellSize, "#aaaaaa", 2)

        var padding = 2
        var shapeSize = (cellSize/2) - padding

        switch(this.pModel.type) {
            case StarForgeModel.TYPE_EMPTY:
                break; 
            case StarForgeModel.TYPE_INPUT:
                // For input, draw a cyan "circle"
                this.setCircle(shapeSize, "#00ffff")
                break;
            case StarForgeModel.TYPE_OUTPUT:
                // For output, draw a yellow "circle"
                this.setCircle(shapeSize, "#ffff00")
                break;
            case StarForgeModel.TYPE_PIPE_LR:
                // Draw a square box, with pipes entering and exiting
                var pipe = new NodeView() //lr
                pipe.setRect(cellSize, shapeSize/4, "#aaaaaa")
                this.addChild(pipe)

                var node = new NodeView()
                node.setRect(shapeSize/2, shapeSize/2, "#aaaaaa")
                this.addChild(node)
                break;
            case StarForgeModel.TYPE_PIPE_UD:
                // Draw a square box, with pipes entering and exiting
                var pipe = new NodeView() //ud
                pipe.setRect(shapeSize/4, cellSize, "#aaaaaa")
                this.addChild(pipe)

                var node = new NodeView()
                node.setRect(shapeSize/2, shapeSize/2, "#aaaaaa")
                this.addChild(node)
                break;
            case StarForgeModel.TYPE_PIPE_LRD:
                // Draw a square box, with pipes entering and exiting
                var pipe = new NodeView() //lr
                pipe.setRect(cellSize, shapeSize/4, "#aaaaaa")
                this.addChild(pipe)

                var segment = new NodeView() //down
                segment.setRect(shapeSize/4, cellSize/2, "#aaaaaa")
                segment.pos.setVal(0, cellSize/4)
                this.addChild(segment)

                var node = new NodeView()
                node.setRect(shapeSize/2, shapeSize/2, "#aaaaaa")
                this.addChild(node)
                break;
            case StarForgeModel.TYPE_PIPE_LRU:
                // Draw a square box, with pipes entering and exiting
                var pipe = new NodeView() //lr
                pipe.setRect(cellSize, shapeSize/4, "#aaaaaa")
                this.addChild(pipe)

                var segment = new NodeView() //up
                segment.setRect(shapeSize/4, cellSize/2, "#aaaaaa")
                segment.pos.setVal(0, -cellSize/4)
                this.addChild(segment)

                var node = new NodeView()
                node.setRect(shapeSize/2, shapeSize/2, "#aaaaaa")
                this.addChild(node)
                break;

            case StarForgeModel.TYPE_PIPE_LUD:
                // Draw a square box, with pipes entering and exiting
                var pipe = new NodeView() //ud
                pipe.setRect(shapeSize/4, cellSize, "#aaaaaa")
                this.addChild(pipe)

                var segment = new NodeView() //left
                segment.setRect(cellSize/2, shapeSize/4, "#aaaaaa")
                segment.pos.setVal(-cellSize/4, 0)
                this.addChild(segment)

                var node = new NodeView()
                node.setRect(shapeSize/2, shapeSize/2, "#aaaaaa")
                this.addChild(node)
                break;

            case StarForgeModel.TYPE_PIPE_RUD:
                // Draw a square box, with pipes entering and exiting
                var pipe = new NodeView() //ud
                pipe.setRect(shapeSize/4, cellSize, "#aaaaaa")
                this.addChild(pipe)

                var segment = new NodeView() //right
                segment.setRect(cellSize/2, shapeSize/4, "#aaaaaa")
                segment.pos.setVal(cellSize/4, 0)
                this.addChild(segment)

                var node = new NodeView()
                node.setRect(shapeSize/2, shapeSize/2, "#aaaaaa")
                this.addChild(node)
                break;

            case StarForgeModel.TYPE_FORGE:
                // For type '4' draw a "star"
                var arrVerts = [ {x:0, y:-1*(shapeSize)}, 
                    {x:0.16*(shapeSize), y:-0.33*(shapeSize)}, 
                    {x:1*(shapeSize), y:-0.33*(shapeSize)}, 
                    {x:0.33*(shapeSize), y:0.05*(shapeSize)}, 
                    {x:0.5*(shapeSize), y:0.83*(shapeSize)}, 
                    {x:0, y:0.33*(shapeSize)}, 
                    {x:-0.5*(shapeSize), y:0.83*(shapeSize)}, 
                    {x:-0.33*(shapeSize), y:0.16*(shapeSize)}, 
                    {x:-1*(shapeSize), y:-0.33*(shapeSize)}, 
                    {x:-0.16*(shapeSize), y:-0.33*(shapeSize)}, 
                    {x:0, y:-1*(shapeSize)}]
                this.setPolygon(arrVerts, "#ff0000")
                break;

        }
    }
}

class StarForgeEditorView extends NodeView {
	constructor( starForgeEditorModel, width, height ) {
        super();

        this.pModel = starForgeEditorModel;

        this.width = width;
        this.height = height;

        // Background
        this.setRect(this.width, this.height, "#000000")

        this.cellSize = 50

        this.SetListener("starForgeModelUpdated", (e)=>{
            //todo: refresh module view
            this.refreshModuleRoot()
        })


        this.moduleRoot = new NodeView()
        this.addChild(this.moduleRoot)

        this.refreshModuleRoot()
    }

    refreshModuleRoot() {
        this.moduleRoot.removeAllChildren(true)

        var cellSize = this.cellSize

        var gridW = this.pModel.gridW
        var gridH = this.pModel.gridH

        var modulesOffsetX = (gridW * cellSize)/2
        var modulesOffsetY = (gridH * cellSize)/2

        // Create module node views
        var modules = this.pModel.modules
        for(var i=0; i< modules.length; i++) {
            const x = i % gridW
            const y = (i - x) / gridW
            var module = modules[i]

            var moduleView = new StarForgeModuleView(module, cellSize)
            moduleView.pos.setVal( x * cellSize - modulesOffsetX, y * cellSize - modulesOffsetY)

            const moduleIndex = i
            moduleView.setClick((e)=>{
                EventBus.ui.dispatch({ evtName: "starForgeEditorModuleClicked", moduleIndex: moduleIndex })
            })

            this.moduleRoot.addChild(moduleView)
        }

        var isValid = this.pModel.validateForgeGraph()
        var statusColor = isValid ? "#11CC11" : "#CC1111"
        var statusIndicator = new NodeView()
        statusIndicator.setCircle(15, statusColor)
        statusIndicator.pos.setVal(260, -25)
        this.moduleRoot.addChild(statusIndicator)
    }



}