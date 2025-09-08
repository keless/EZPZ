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
                // For type '1' draw a cyan "circle"
                this.setCircle(shapeSize, "#00ffff")
                break;
            case StarForgeModel.TYPE_OUTPUT:
                // For type '2' draw a yellow "circle"
                this.setCircle(shapeSize, "#ffff00")
                break;
            case StarForgeModel.TYPE_PIPE_LR:
                // For type '3', draw a square box, with pipes entering and exiting
                var pipe = new NodeView()
                pipe.setRect(cellSize, shapeSize/4, "#aaaaaa")
                this.addChild(pipe)

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

        var cellSize = 50

        var gridW = this.pModel.gridW
        var gridH = this.pModel.gridH

        var modulesOffsetX = (gridW * cellSize)/2
        var modulesOffsetY = (gridH * cellSize)/2

        var modules = this.pModel.modules
        for(var i=0; i< modules.length; i++) {
            var x = i % gridW
            var y = (i - x) / gridW
            var module = modules[i]

            var moduleView = new StarForgeModuleView(module, cellSize)
            moduleView.pos.setVal( x * cellSize - modulesOffsetX, y * cellSize - modulesOffsetY)

            this.addChild(moduleView)
        }

    }

}