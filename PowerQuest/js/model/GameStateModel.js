
class GridNodeModel {
	constructor(x, y) {
		this.x = x
		this.y = y
		this.entity = null
	}
}

class GameTicks
{
	//double
	static Get() { 
		return GameTicks.s_time;
	}
	
	// in: double dt in SECONDS
	//double
	static UpdateDelta( dt ) {
		GameTicks.s_time += dt;
		return GameTicks.s_time;
	}
	
	// in: double t
	//double
	static Set( t ) {
		GameTicks.s_time = t;
		return GameTicks.s_time;
	}
}

GameTicks.s_time = 0.0; //double

// conforms to ICastPhysics 
class GameStateModel extends BaseStateModel {
	constructor( state, factionsJson ) {
		super();
		
		GameTicks.Set(0)

		// tick period 1 == 1 tick per second
		// tick period 5 == 1 tick per 5 seconds
		this.tickPeriod = 1
		this.lastTickUpdate = 0 

		this.pState = state;

		this.entities = []	//all entities
		
		// initialize grid
		this.gridNodes = [] //2D array
		this.gridH = 18
		this.gridW = 25
		for(var h = 0; h < this.gridH; h++) {
			this.gridNodes[h] = []
			for(var w = 0; w < this.gridW; w++) {
				var node = new GridNodeModel(w, h)
				this.gridNodes[h].push(node)
			}
		}

	}

	addEntity(json, x, y ) {
		var ent = new EntityModel( json );
		ent.pos.setVal(x, y)

		this.entities.push(ent);
		this.gridNodes[y][x].entity = ent

		EventBus.ui.dispatch({ evtName: "entityAdded", entityModel: ent, gridX: x, gridY: y })
	}

	removeEntityAt(x, y) {
		let ent = this.gridNodes[y][x].entity
		this.gridNodes[y][x].entity = null
		EventBus.ui.dispatch({ evtName: "entityRemoved", entityModel: ent, gridX: x, gridY: y })
	}

	getEntityAt(x, y) {
		return this.gridNodes[y][x].entity
	}

	Destroy() {
		for( var e of this.entities ) {
			e.Destroy();
		}
		this.entities = [];

		super.Destroy();
	}
	
	Update(ct, dt) {
		super.Update(ct, dt);
		
		if (this.lastTickUpdate == 0) {
			this.lastTickUpdate = ct
		}

		var tickDt = ct - this.lastTickUpdate
		if (tickDt > this.tickPeriod ) {
			var numTicks = Math.floor(tickDt / this.tickPeriod)

			for (let tick = 0; tick < numTicks; tick++) {
				var currTick = GameTicks.Get() + 1
				GameTicks.Set(currTick)

				for( var e of this.entities ) {
					e.UpdateTick(currTick)
				}

				EventBus.ui.dispatch({ evtName:"tick", currTick: currTick}, true)
			}

			this.lastTickUpdate = ct
		}

		for( var e of this.entities ) {
			e.Update(ct, dt);
		}

		//xxx todo
	}

	/* astar
	getAstarForEntity(entityModel, targetPos) {
		var graph = this.getPathingGridForEntity(entityModel, targetPos)
		var start = graph.grid[entityModel.pos.x][entityModel.pos.y];  //expects nodes[x][y]
		var end = graph.grid[targetPos.x][targetPos.y];
		return astar.search(graph, start, end);
	}

	getPathingGridForEntity(entityModel, toPos) {
		var grid = []
		for (var x=0; x<this.gridW; x++) {
			var row = []
			for (var y=0; y<this.gridH; y++) {
				row.push((this.gridNodes[y][x].entity == null) ? 1 : 0)
			}
			grid.push(row)
		}

		//finally, make the starting point (the entity's position) and end point open
		grid[entityModel.pos.x][entityModel.pos.y] = 1
		grid[toPos.x][toPos.y] = 1

		return new Graph(grid)
	}*/

	// out: closest entity that passes testFn check (not including fromEntity)
	//  where  testFn(entity) -> bool
	getNearestEntity(fromEntity, testFn) {
		var potentialEntities = this.entities.filter(entity => {
			entity != fromEntity && testFn(entity)
		})

		if (potentialEntities.length == 0) {
			return null
		}

		var pos = fromEntity.pos.clone()
		
		//sort by closest distance
		potentialEntities.sort(function(a,b){
			return a.pos.getDistSqFromVec(pos) - b.pos.getDistSqFromVec(pos)
		})

		return potentialEntities[0]
	}

	// return [] of EntityModels adjacent to 'x,y' that pass testFn check
	getEntitiesAdjacentTo(x,y, testFn) {
		var entities = []
		var unit = this.unitAtPos(x, y)
		var left = this.unitAtPos(x-1, y)
		if (left != null) { entities.push(left) }
		var right = this.unitAtPos(x+1, y)
		if (right != null) { entities.push(right) }
		var up = this.unitAtPos(x, y+1)
		if (up != null) { entities.push(up) }
		var down = this.unitAtPos(x, y-1)
		if (down != null) { entities.push(down) }
		return entities.filter(entity => testFn(entity))
	}


	// return true if 'x,y' is a valid grid node coordinate, otherwise false
	isValidPos(x, y) {
		if (x < 0 || x >= this.gridW) return false
		if (y < 0 || y >= this.gridH) return false
		return true
	}

	// return false if 'x,y' grid coordinate has an entity in it, otherwise true
	isSpaceEmpty(x, y) {
		if (this.isValidPos(x,y)) {
			return (this.gridNodes[y][x].entity == null)
		} else {
			return true
		}
	}
	
	// return EntityModel at grid coordinate 'x,y', otherwise null
	unitAtPos(x, y) {
		if (this.isValidPos(x,y)) {
			return this.gridNodes[y][x].entity
		}else {
			return null
		}
	}

	// conforms to ICastPhysics
	// in: ICastEntity fromEntity, ICastEntity toEntity
	// out: null or Vec2D distVec
	GetVecBetween( fromEntity, toEntity ) { 
		var from = fromEntity.pos;
		var to = toEntity.pos;

		return to.getVecSub(from);
	}
	
	// in: ICastEntity entity
	// out: null or Vec2D pos
	GetEntityPosition( entity ) { 
		return entity.pos;
	}
	
	// in: Vec2D p, float r
	// out: array<ICastEntity> entities
	GetEntitiesInRadius( p, r, ignoreList ) { 
		ignoreList = ignoreList || []
		
		var inRadius = [];
		var rSq = r * r;
		
		for( var e of this.entities ) {
			
			if( arrayContains(ignoreList, e)  ) continue;
			
			var dSq = e.pos.getDistSqFromVec(p);
			if( dSq <= rSq ) {
				inRadius.push(e);
			}
		}
		
		return inRadius; 
	}
}