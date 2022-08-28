// AStar search for non-grid graph
// adapted from https://en.wikipedia.org/wiki/A*_search_algorithm

/* Example usage:

// build a graph of objects that inherit from, or otherwise implement, EZAstarGraphNode's methods
// neighbors() should return all the neighbors of an individual node-- highly dependant on what your graph is like
// estimatedCostTo(node) should return an estimate of the cost to reach 'node' from the given node
//    this can simply be the euclidian distance { this.position.getDist(node.position) }
//    or you can spice it up, for instance if one node represented a change in elevation from the other or 'rough terrain'
//    if a node is 'impassable' you can return Infinity

let graph = buildGraph()

let start = some node in graph
let end = some other node in graph

let result = EZAstar.search(start, end)
if (result.count == 0) {
  // no path found
} else {
  // result is an array of nodes in sequential order from start to end
}

*/


// Nodes 
class EZAstarGraphNode {
  // returns [EZAstarGraphNode] - array of neighbors
  EZAstar_neighbors() { return [] }

  // essentially the 'h(n)' cost function used by Astar
  // h: function(s:AstarGraphNode, g:AStarGraphNode)->Number - the cost heuristic; returns an ESTIMATE number representing the cost to reach node 'g' from node 's'
  // this should return a value that is less than or equal to the actual cost (eg: better to under-estimate than over-estimate)
  // returns Number - a value representing the estimated cost to reach 'node' from 'this'
  EZAstar_estimatedCostTo(node) { return Infinity }
}

// TODO: functionality option to return partial path instead of empty array if no path is found (useful for AI?)
class EZAstar {
  
  // finds a path from start to goal across a graph
  // start: AstarGraphNode - the starting node
  // goal: AstarGraphNode - the end node
  // returns [AstarGraphNode] - the sequence of nodes from start to end, or an empty array if no path found
  static search(start, goal) {
    let openSet = new Set([start])

    // For node n, cameFrom[n] is the node immediately preceding it on the cheapest path from start to n currently known.
    let cameFrom = new Map() // Map<AstarGraphNode:AstarGraphNode>

    // For node n, gScore[n] is the cost of the cheapest path from start to n currently known.
    let gScore = new Map() // Map<AstarGraphNode:Number>
    gScore.set(start, 0)

    // For node n, fScore[n] := gScore[n] + h(n). fScore[n] represents our current best guess as to
    // how cheap a path could be from start to finish if it goes through n.
    let fScore = new Map() // Map<AstarGraphNode:Number>
    fScore.set(start, start.EZAstar_estimatedCostTo(goal))

    console.log("EZAstar search start with initial cost " + fScore.get(start))

    let debug_iterations = 0
    while(openSet.size != 0) {
      debug_iterations += 1
      console.log(" starting iteration " + debug_iterations)

      // This operation can occur in O(Log(N)) time if openSet is a min-heap or a priority queue
      // current is the node in openSet having the lowest fScore[] value
      let current = EZAstar.getKeyWithLowestValue(fScore, openSet)
      if (current == goal) {
        console.log(" reached goal")
        // reached the end, return result
        return EZAstar.reconstruct_path(cameFrom, current)
      }

      // remove current node from openSet
      openSet.delete(current)
      for (let neighbor of current.EZAstar_neighbors()) {
        // d(current,neighbor) is the weight of the edge from current to neighbor
        // tentative_gScore is the distance from start to the neighbor through current
        let tentative_gScore = EZAstar.getMapValueOrInfinity(gScore, current) + current.EZAstar_estimatedCostTo(neighbor)
        console.log(" test neighbor " + neighbor.cellIndex + " of current " + current.cellIndex + " : " + tentative_gScore + " < " + EZAstar.getMapValueOrInfinity(gScore, neighbor)) 
        if (tentative_gScore < EZAstar.getMapValueOrInfinity(gScore, neighbor)) {
          // This path to neighbor is better than any previous one. Record it!
          cameFrom.set(neighbor, current)
          gScore.set(neighbor, tentative_gScore)
          fScore.set(neighbor, tentative_gScore + neighbor.EZAstar_estimatedCostTo(goal))
          if (!openSet.has(neighbor)) {
            openSet.add(neighbor)
          }
        }
      }
    }

    // Failed to find a path
    console.log("zzz failed to find a path")
    return []
  }

  // cameFrom: Map<AstarGraphNode:Number>  - map of nodes that came from other nodes during search
  // current: AstarGraphNode - current node
  // returns [AstarGraphNode] - an array of graph nodes representing the found path from start to end
  static reconstruct_path(cameFrom, current) {
    let total_path = [current]
    for (let current of cameFrom.keys()) {
      current = cameFrom.get(current)
      total_path = EZAstar.prepend(current, total_path)
    }
    return total_path
  }

  // utility for inserting an item at the start of an array
  // value: element type
  // array: [element] array
  // returns [element] - a new array with the value inserted at the front
  static prepend(value, array) {
    var newArray = array.slice();
    newArray.unshift(value);
    return newArray;
  }

  // returns ValueType or Infinity
  static getMapValueOrInfinity(map, key) {
    if (map.has(key)) {
      console.log("getMapValueOrInfinity got " + map.get(key) + " for key.cellindex" + key.cellIndex)
      return map.get(key)
    }
    return Infinity
  }

  // map: Map<KeyType:ValueType> - a map with comparable values
  // keySet: Set<KeyType> - a set of keys (will safely ignore keys that dont exist in map)
  // returns KeyType - returns the key with the lowest associated value
  static getKeyWithLowestValue(map, keySet) {
    let minKey = keySet.values().next().value // grab the first value in the set
    let minValue = Infinity 
    if (map.has(minKey)) {
      minValue = map.get(minKey)
    }
    for (var key of keySet) {
      if (map.has(key)) {
        var val = map.get(key)
        if (val < minValue) {
          minKey = key
          minValue = val
        }
      } // dont need an else here, because Infinity will always be >= minValue
    }
    return minKey
  }

}