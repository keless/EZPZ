
class StarForgeModuleModel 
{
    /*
        types:
        0 = testing,
        1 = star forge,
    */
    constructor(type) {
        this.type = type
    }

}

class StarForgeModel 
{
    static get TYPE_EMPTY() { return 0 }
    static get TYPE_INPUT() { return 1 }
    static get TYPE_OUTPUT() { return 2 }
    static get TYPE_FORGE() { return 3 }
    static get TYPE_PIPE_LR() { return 4 }

    constructor() {

        this.gridW = 10
        this.gridH = 10

        this.modules = []
        for(var y=0; y<this.gridH; y++) {
            for(var x=0; x<this.gridW; x++) {
                this.modules.push(new StarForgeModuleModel( StarForgeModel.TYPE_EMPTY ))
            }
        }

        this.modules[0].type = StarForgeModel.TYPE_INPUT
        this.modules[1].type = StarForgeModel.TYPE_PIPE_LR
        this.modules[2].type = StarForgeModel.TYPE_FORGE
        this.modules[3].type = StarForgeModel.TYPE_PIPE_LR
        this.modules[4].type = StarForgeModel.TYPE_PIPE_LR
        this.modules[5].type = StarForgeModel.TYPE_OUTPUT
    }


    // Returns the int index of the node that has the StarForge module in it
    // Assumes there is only ONE StarForge node
    findForgeNode() {
        for(var i=0; i<this.modules.length; i++) {

        }

    }

}