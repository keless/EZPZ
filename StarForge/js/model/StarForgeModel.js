

// Represents an individual module in the StarForgeEditor grid
class StarForgeModuleModel 
{
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
    static get TYPE_PIPE_UD() { return 5 }
    static get TYPE_PIPE_LRD() { return 6 }
    static get TYPE_PIPE_LRU() { return 7 }
    static get TYPE_PIPE_LUD() { return 8 }
    static get TYPE_PIPE_RUD() { return 9 }

    constructor(json) {

        this.gridW = 0
        this.gridH = 0

        this.inputs = []

        this.modules = []

        if (json == null) {
            this.loadDefault()
        } else {
            this.loadJson(json)
        }

    }

    loadDefault() {
        this.gridW = 10
        this.gridH = 10

        for(var y=0; y<this.gridH; y++) {
            for(var x=0; x<this.gridW; x++) {
                this.modules.push(new StarForgeModuleModel( StarForgeModel.TYPE_EMPTY ))
            }
        }

        this.modules[0].type = StarForgeModel.TYPE_INPUT
        this.modules[1].type = StarForgeModel.TYPE_PIPE_LR
        this.modules[2].type = StarForgeModel.TYPE_FORGE
        this.modules[3].type = StarForgeModel.TYPE_PIPE_LR
        this.modules[4].type = StarForgeModel.TYPE_PIPE_LUD

        this.modules[14].type = StarForgeModel.TYPE_PIPE_RUD
        this.modules[15].type = StarForgeModel.TYPE_OUTPUT
    }


    static get FILE_FORMAT_VERSION() { return 1 }

    loadJson(json) {
        //deserialize

        if (json.version != StarForgeModel.FILE_FORMAT_VERSION) {
            console.error("incompatible StarForgeModel file format version; load default")
            this.loadDefault()
            return
        }

        this.gridW = json.gridW
        this.gridH = json.gridH

        const jsonModulesLength = json.modules.length
        if (jsonModulesLength != this.gridW * this.gridH) {
            console.error("modules length "+ jsonModulesLength +"is not the correct size for "+ this.gridW +" * "+ this.gridH)
            this.loadDefault()
            return
        }

        for (moduleType in json.modules) {
            this.modules.push(new StarForgeModuleModel( moduleType ))
        }
    }

    toJson() {
        //serialize

        var json = {
            version: StarForgeModel.FILE_FORMAT_VERSION,
            gridW: this.gridW,
            gridH: this.gridH,
            modules: []
        }

        for (module in this.modules) {
            json.modules.push(module.type)
        }
    }

    // Returns index (into the modules array) of the FIRST node of the given type, or -1 if not found
    findNodeType(nodeType) {
        for (let i = 0; i < this.modules.length; i++) {
            if (this.modules[i].type === nodeType) {
                return i;
            }
        }
        return -1; // Return -1 if no forge node is found
    }

    // Returns an array with indexes (into the modules array) of the nodes of the given type
    findAllNodesOfType(nodeType) {
        var result = []
        for (let i = 0; i < this.modules.length; i++) {
            if (this.modules[i].type === nodeType) {
                result.push(i)
            }
        }
        return result
    }

    // Get index (into modules array) of neighbors of a node at given index
    // Returns [up, down, left, right] with null for invalid neighbors
    getNeighbors(index) {
        const x = index % this.gridW;
        const y = Math.floor(index / this.gridW);

        const neighbors = [null, null, null, null]; // [up, down, left, right]

        // Check up
        if (y > 0) {
            neighbors[0] = index - this.gridW;
        }
        // Check down
        if (y < this.gridH - 1) {
            neighbors[1] = index + this.gridW;
        }
        // Check left
        if (x > 0) {
            neighbors[2] = index - 1;
        }
        // Check right
        if (x < this.gridW - 1) {
            neighbors[3] = index + 1;
        }

        return neighbors;
    }

    // Check if a pipe type can connect in a specific direction
    // direction: 0=up, 1=down, 2=left, 3=right
    canPipeConnect(pipeType, direction) {
        switch (pipeType) {
            case StarForgeModel.TYPE_PIPE_LR:
                return direction === 2 || direction === 3; // left or right
            case StarForgeModel.TYPE_PIPE_UD:
                return direction === 0 || direction === 1; // up or down
            case StarForgeModel.TYPE_PIPE_LRD:
                return direction === 2 || direction === 3 || direction === 1; // left, right, or down
            case StarForgeModel.TYPE_PIPE_LRU:
                return direction === 2 || direction === 3 || direction === 0; // left, right, or up
            case StarForgeModel.TYPE_PIPE_LUD:
                return direction === 2 || direction === 0 || direction === 1; // left, up, or down
            case StarForgeModel.TYPE_PIPE_RUD:
                return direction === 3 || direction === 0 || direction === 1; // right, up, or down
            default:
                return false;
        }
    }

    // Check if we can move from one node to a neighbor in a specific direction
    canMoveToNeighbor(fromIndex, toIndex, direction) {
        const fromType = this.modules[fromIndex].type;
        const toType = this.modules[toIndex].type;

        // If target is empty, we cannot traverse through it
        if (toType === StarForgeModel.TYPE_EMPTY) {
            return false;
        }

        // Check if the current node can connect in the specified direction
        let canConnectFrom = false;
        if (fromType === StarForgeModel.TYPE_FORGE || fromType === StarForgeModel.TYPE_INPUT) {
            // INPUT, OUTPUT, and FORGE nodes can connect in any direction
            canConnectFrom = true;
        } else {
            // For pipe nodes, check if they can connect in this direction
            canConnectFrom = this.canPipeConnect(fromType, direction);
        }

        if (!canConnectFrom) {
            return false;
        }

        // If target is INPUT, OUTPUT, or FORGE, we can reach it (since we already verified fromNode can connect)
        if (toType === StarForgeModel.TYPE_INPUT || toType === StarForgeModel.TYPE_OUTPUT || toType === StarForgeModel.TYPE_FORGE) {
            return true;
        }

        // If target is a pipe, check if it can connect in the opposite direction
        const oppositeDirection = [1, 0, 3, 2][direction]; // up<->down, left<->right
        return this.canPipeConnect(toType, oppositeDirection);
    }

    // Return true if we can reach a target type from start index
    canReachType(startIndex, targetType) {
        const visited = new Set();
        const queue = [startIndex];
        visited.add(startIndex);

        while (queue.length > 0) {
            const currentIndex = queue.shift();
            const currentType = this.modules[currentIndex].type;

            // If we found the target type, return true
            if (currentType === targetType) {
                return true;
            }

            // Get neighbors and check valid connections
            const neighbors = this.getNeighbors(currentIndex);
            for (let direction = 0; direction < neighbors.length; direction++) {
                const neighborIndex = neighbors[direction];
                
                if (neighborIndex !== null && !visited.has(neighborIndex)) {
                    // Check if we can move to this neighbor based on pipe orientations
                    if (this.canMoveToNeighbor(currentIndex, neighborIndex, direction)) {
                        visited.add(neighborIndex);
                        queue.push(neighborIndex);
                    }
                }
            }
        }

        return false;
    }

    validateForgeGraph() {
        // Find the forge node
        const forgeIndex = this.findNodeType(StarForgeModel.TYPE_FORGE);
        if (forgeIndex === -1) {
            return false; // No forge node found
        }

        // Check if forge can reach both INPUT and OUTPUT
        const canReachInput = this.canReachType(forgeIndex, StarForgeModel.TYPE_INPUT);
        const canReachOutput = this.canReachType(forgeIndex, StarForgeModel.TYPE_OUTPUT);

        return canReachInput && canReachOutput;
    }

    validateGraphFromInputNode(inputNodeIndex) {
        // Ensure given node exists as input to start
        var inputNode = this.modules[inputNodeIndex]
        if (inputNode == null || inputNode.type != StarForgeModel.TYPE_INPUT) {
            // Input node graph is not valid, because given start node is not an Input node
            return false
        }



    }

}