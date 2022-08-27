
class TerrainGenerator {
  
  // Generate a random terrain with points of interest, road networks, high/low/impassable terrain, and biome features
  // 5 "countries"
  //   each with 1 capital
  //   between 2 and 5 cities
  //   5 to 15 villages

  constructor(w, h) {
    this.regionWidth = w
    this.regionHeight = h

    this.nameGenerator = new NameGenerator()

    this.allPOIs = []
    this.allPoints = []

    // Must correspond to numFactions count
    this.factionColors = ["rgb(255, 0, 0)", "rgb(150, 50, 205)", "rgb(60, 179, 113)", "rgb(255, 165, 0)", "rgb(238, 130, 238)"]

    this.numFactions = 5
    this.factions = []
    for (let i=0; i< this.numFactions; i++) {
      this.factions.push(new Faction(this.nameGenerator.faction(i), i, this.factionColors[i]))
    }

    this.countries = []
    for (let i=0; i < this.numFactions; i++) {
      let country = new Country(this.nameGenerator, i)
      this.countries.push(country)

      this.allPOIs.push(country.capital)
    }

    this.countryVoronoi = null
    this.allVoronoi = null
    this.vornoiCellToFactionMap = {}

    // array of arrays where inner-array is a sorted array of two Ints representing cell indexes that have a road between them
    // eg: [ [1,4], [4, 120], [15, 120] ]  represents 3 connected road segments from 1<->4<->120<->15
    this.roads = []
  }

  generate() {
    var gridSize = 31

    // 0) Generate points on a regular offset of `{gridSize, gridSize}` with a margin from the edges of `gridSize+1`
    var margin = gridSize + 1
    var numCountries = this.countries.length
    var numCities = getRand(2*numCountries, 5*numCountries)
    var numOtherPOI = 150 + getRand(0, 10)
    var numPointsToGenerate = this.countries.length + numCities + numOtherPOI

    this.allPoints = this._generateUniquePoints(numPointsToGenerate, gridSize, margin,  this.regionWidth, this.regionHeight)
    
    var allDelaunyPoints = []
    for (let i=0; i<this.allPoints.length; i++) {
      let pos = this.allPoints[i]
      allDelaunyPoints.push([pos.x, pos.y])
    }
    let allDelauny = document.Delaunay.from(allDelaunyPoints)
    this.allVoronoi = allDelauny.voronoi([0,0, this.regionWidth, this.regionHeight])

    // 'points' is a subset of allPoints which we can begin to assign cities and other interesting things to
    var points = []
    for (let i=0; i<this.allPoints.length; i++) {
      points.push({ pos:this.allPoints[i], index: i})
    }
    this.edgeCellIndicies = []

    // Remove edge cells from points array
    for (let i=  0; i < this.allPoints.length; i++ ) {
      let polygon = this.allVoronoi.cellPolygon(i)

      let isEdge = false
      for (let v=0; v< polygon.length && !isEdge; v++) {
        var posArr = polygon[v]
        if (posArr[0] == 0 || posArr[0] >= this.regionWidth || posArr[1] == 0 || posArr[1] >= this.regionHeight) {
          // edge cell detected, remove from points array
          isEdge = true
        }
      }

      if (isEdge) {
        this.edgeCellIndicies.push(i)
      }
    }

    for (var i = this.edgeCellIndicies.length -1; i >= 0; i--) {
      let cellIndexToRemove = this.edgeCellIndicies[i]
      points.splice(cellIndexToRemove, 1)
    }

    // 1) Choose capital positions:
    // first is random
    var capitalPositions = []
    var pIdx = getRand(0, points.length -1)
    capitalPositions.push(points.splice(pIdx, 1)[0])
    for (let i=1; i< this.countries.length; i++) {
      pIdx = this._getPointFurthest(capitalPositions, points)
      capitalPositions.push(points.splice(pIdx, 1)[0])
    }

    // Set positions on the capitals now 
    var delaunyPoints = []
    for (let i=0; i< capitalPositions.length; i++) {
      let cellIndex = capitalPositions[i].index
      let pos = capitalPositions[i].pos
      let factionIndex = this.countries[i].factionIndex

      this.countries[i].capital.pos.setVec( pos )
      this.countries[i].capital.cellIndex = cellIndex
      delaunyPoints.push([ pos.x, pos.y ])

      //console.log("add faction map of Capital cell " + cellIndex)
      this.vornoiCellToFactionMap[cellIndex] = factionIndex
      this.allPOIs.push(this.countries[i].capital)

    }
    
    // Generate the country voronoi graph so we can determine which country each city will end up inside of
    let delauny = document.Delaunay.from(delaunyPoints)
    this.countryVoronoi = delauny.voronoi([0,0, this.regionWidth, this.regionHeight])

    var nonCapitalRoadNodes = []

    // Choose allegience of city POIs based on inclusion in country's voronoi cell
    for (let i=0; i<points.length; i++) {
      var pos = points[i].pos
      let cellIndex = points[i].index
      let foundCountry = false
      for (let c=0; c< this.countries.length; c++) {
        if (this.countryVoronoi.contains(c, pos.x, pos.y)) {
          let poi = this.countries[c].addRandomPOI(this.nameGenerator, pos, cellIndex)
          this.allPOIs.push(poi)
        
          if (poi.type == "City") {
            nonCapitalRoadNodes.push(poi)
          }

          //console.log("add faction map of POI cell " + cellIndex)
          let factionIndex = this.countries[c].factionIndex
          this.vornoiCellToFactionMap[cellIndex] = factionIndex
          foundCountry = true
          continue
        }
      }

      if (!foundCountry) {
        console.error("didnt find country for cell " + cellIndex)
      }
    }

    var allRoadPoints = this.allPOIs.filter( (poi) => {
      return poi.type == "Capital" || poi.type == "City"
    } )
    var seedPoints = []
    for (let c=0; c<this.countries.length; c++) {
      seedPoints.push(this.countries[c].capital)
    }
    //this._generateRoads(allRoadPoints)
    var roadGenerator = new RoadGenerator(allRoadPoints, seedPoints)
    this.roads = roadGenerator.roads
  }

  // fromPoints: [posObj]  - points to be the furthest from
  // selectFrom: [posObj]  - set of points to chose furthest point in
  // returns index of 'selectFrom'
  _getPointFurthest(fromPoints, selectFrom) {
    if (selectFrom.length == 0) {
      return
    }
    var bestIndex = 0
    var bestDist = this._getAvgDistSQFrom(fromPoints, selectFrom[bestIndex])
    for (var i=1; i< selectFrom.length; i++) {
      var dist = this._getAvgDistSQFrom(fromPoints, selectFrom[i])
      if (dist > bestDist) {
        bestIndex = i
        bestDist = dist
      }
    }

    return bestIndex
  }

  // fromPoints: [posObj]  - points to calculate average distance from
  // toPoint: posObj   - single point to calculate distance to
  // returns avg squared-distance
  _getAvgDistSQFrom(fromPoints, toPoint) {
    var distSQ = 0
    for (var i=0; i< fromPoints.length; i++) {
      distSQ += toPoint.pos.getDistSqFromVec(fromPoints[i].pos)
    }
    return distSQ / fromPoints.length
  }

  // Return a [Vec2D] of length 'numPoints' inside a rect with maxWidth, maxHeight dimensions 
  //  where all points are snapped to gridSize coordinate offsets,
  //  and no two points exist at the same position
  // NOTE: this can result in an infinite loop if number of normalized grid points is less than numPoints
  _generateUniquePoints(numPoints, snapGridSize, margin, maxWidth, maxHeight) {
    var uniqueMap = {}
    let points = []

    while (points.length < numPoints) {
      let newPoint = this._generateNormalizedPoint(snapGridSize, margin, maxWidth, maxHeight)
      let newPointKey = newPoint.toString()
      if (newPointKey in uniqueMap) {
        // not unique
        continue
      } else {
        uniqueMap[newPointKey] = true
        points.push(newPoint)
      }
    }

    return points
  }

  _generateNormalizedPoint(snapGridSize, margin, maxWidth, maxHeight) {
    var rx = getRand(margin, maxWidth - margin)
    var ry = getRand(margin, maxHeight - margin)
    var nx = Math.floor(rx / snapGridSize) * snapGridSize
    var ny = Math.floor(ry / snapGridSize) * snapGridSize
    return new Vec2D(nx, ny)
  }

  // Create a nodeView that renders the given generated terrain
  createNodeView() {
    var node = new NodeView()
    node.size.setVal(this.regionWidth, this.regionHeight);
    node.addCustomDraw((g, x,y, ct) => {

      if(g.drawCentered) {
        g.translate(-node.size.x/2, -node.size.y/2)
      }

      // draw "water" edge cells first
      for (let edge of this.edgeCellIndicies) {
        g.ctx.strokeStyle = "rgb(0,0,250)"
        g.ctx.lineWidth = 3
        let fillStyle = "rgb(0, 0, 250)"
        g.ctx.fillStyle = fillStyle
        g.ctx.beginPath()
        this.allVoronoi.renderCell(edge, g.ctx)
        g.ctx.fill()
        g.ctx.stroke()
      }

      /* black line strokes for ALL cells (including edges)
      g.ctx.strokeStyle = "rgb(0,0,0)"
      g.ctx.lineWidth = 3
      g.ctx.beginPath()
      this.allVoronoi.render(g.ctx)
      g.ctx.stroke()
      */

      for (let poi of this.allPOIs) {
        // stroke and fill faction color
        let cellIndex = poi.cellIndex
        let factionIndex = this.vornoiCellToFactionMap[cellIndex]
        g.ctx.strokeStyle = "rgb(0,0,0)"
        g.ctx.lineWidth = 2
        let fillStyle = this.factionColors[factionIndex]
        g.ctx.fillStyle = fillStyle
        g.ctx.beginPath()
        this.allVoronoi.renderCell(cellIndex, g.ctx)
        g.ctx.fill()
        g.ctx.stroke()

        // draw circle if capital or city
        if (poi.type != "Wilds") {
          // default (village)
          let fillStyle = "rgb(150, 150, 150)" //this.factionColors[poi.factionIndex]
          let strokeStyle = "rgb(0, 0, 0)"
          let strokeWidth = 2
          let radius = 3
          if (poi.type == "City") {
            radius = 5
            fillStyle = "rgb(0, 0, 0)"
          } else if (poi.type == "Capital") {
            radius = 10
            fillStyle = "rgb(255, 255, 255)"
          }
          g.drawCircleEx(poi.pos.x, poi.pos.y, radius, fillStyle, strokeStyle, strokeWidth)
        }

        for (let road of this.roads) {
          let startPos = road[0].pos
          let endPos = road[1].pos
          g.drawLineEx(startPos.x, startPos.y, endPos.x, endPos.y, "rgb(133,42,42)", 4)
        }

        // draw cell index
        /*
        g.drawTextEx("" + poi.cellIndex, poi.pos.x, poi.pos.y, "Arial 12pt", "rgb(255, 255, 255)")
        g.drawTextEx("" + poi.cellIndex, poi.pos.x, poi.pos.y, "Arial 8pt", "rgb(0, 0, 0)")
        */
      }

      // Show country voronoi lines
      /*
      g.ctx.strokeStyle = "rgb(0,255,0)"
      g.ctx.beginPath()
      this.countryVoronoi.render(g.ctx)
      g.ctx.stroke()
      */
    })

    node.setClick((e)=> {
      for (let i=0; i<this.allPOIs.length; i++) {
        if (this.allVoronoi.contains(i, e.x, e.y)) {
          console.log("clicked cell " + i + " at " + e.x +", "+e.y +" which has points " + this.allVoronoi.cellPolygon(i))

          if (e.button == 0) {
            // left click
            EventBus.ui.dispatch({evtName: "voronoi left clicked", cell: i})
          } else if (e.button == 2) {
            // right click
            EventBus.ui.dispatch({evtName: "voronoi right clcked", cell: i})
          }
          return
        }
      }
    })

    return node
  }
}

class POI {
  constructor(name, pos, type, factionIndex, cellIndex) {
    this.name = name
    this.pos = pos
    this.type = type
    this.factionIndex = factionIndex
    this.cellIndex = cellIndex
  }
}

class Faction {
  constructor(name, factionIndex, color) {
    this.name = name
    this.index = factionIndex
    this.color = color
  }
}

class Country {
  constructor(nameGenerator, factionIndex, capitalCellIndex) {
    this.capital = new POI(nameGenerator.city(factionIndex), new Vec2D(0, 0), "Capital", factionIndex, capitalCellIndex)
    this.cities = []
    this.otherPOI = []
  }

  get factionIndex() {
    return this.capital.factionIndex
  }

  addCity(nameGenerator, pos, cellIndex) {
    let city = new POI(nameGenerator.city(this.factionIndex), pos, "City", this.factionIndex, cellIndex)
    this.cities.push(city)
    return city
  }

  addVillage(nameGenerator, pos, cellIndex) {
    let village = new POI(nameGenerator.city(this.factionIndex), pos, "Village", this.factionIndex, cellIndex)
    this.otherPOI.push(village)
    return village
  }

  addWilderness(pos, cellIndex) {
    let wilds = new POI("Wilds", pos, "Wilds", this.factionIndex, cellIndex)
    this.otherPOI.push(wilds)
    return wilds
  }

  addRandomPOI(nameGenerator, pos, cellIndex) {
    let rand = getRand(0,4)
    switch(rand) {
      case 0: 
        return this.addCity(nameGenerator, pos, cellIndex)
      case 1:
        return this.addVillage(nameGenerator, pos, cellIndex)
      default:
        return this.addWilderness(pos, cellIndex)
    }
  }
}

class RoadGenerator { 
  constructor(allRoadPoints, seedPoints) {
    // roads: [ [poi, poi], ..., n ]
    this.roads = []

    // Set this to true if we want to force every city to have a road built to it
    // If false, the roads will grow from the capital and stop once it meets another road
    //  potentially leaving MANY cities with no roads
    this.config_findALLPoints = true

    this._generate(allRoadPoints, seedPoints)
  }

  // allRoadPoints: [POI] a list of all points that roads will consider start/end points
  // seedPoints: [POI] a list of points from which to start the roads (it is okay for these points to exist within allRoadPoints)
  // the result of calling this method will be to populate this.roads
  _generate(allRoadPoints, seedPoints) {
    class Vine {
      constructor( seedPOI, potentialPoints ) {
        this.isGrowing = true
        this.seed = seedPOI
        this.lastBud = seedPOI
        this.livingNodes = [seedPOI]

        // nodes the vine can grow into (remove seed since we've already started there)
        this.potentialNodes = potentialPoints.filter((e)=> { 
          return e != seedPOI })
      }
    }

    let vines = []
    // use each capital as a starting seed
    for (let i=0; i< seedPoints.length; i++) {
      vines.push(new Vine(seedPoints[i], allRoadPoints))
    }

    let numGrowing = vines.length
    while (numGrowing > 0) {
      numGrowing = 0
      for (let v=0; v< vines.length; v++) {
        let vine = vines[v]
        if (!vine.isGrowing) {
          continue
        } else {
          numGrowing += 1
        }

        // 0) if we have exhausted potential nodes, we are done
        if (vine.potentialNodes.length == 0) {
          // do this first in case config_findALLPoints is true and we looped without setting isGrowing = false
          vine.isGrowing = false
          continue
        }

        // 1) find closest city to vine.lastBud
        let i = this._getPointClosest(vine.potentialNodes, vine.lastBud)
        let growTarget = vine.potentialNodes.splice(i, 1)[0]
        // 2) find closest existing node to new node
        let f = this._getPointClosest(vine.livingNodes, growTarget)
        let fromTarget = vine.livingNodes[f]

        if (fromTarget == growTarget) {
          if (!this.config_findALLPoints) {
            vine.isGrowing = false
          }
          
          continue
        }

        // 2) if road doesnt already exist, create it
        let road = this._createRoad(fromTarget, growTarget)
        if (this.roads.includes(road)) {
          vine.isGrowing = false
          continue
        } 

        // and add it to the vine
        this.roads.push(road)
        vine.lastBud = growTarget
        vine.livingNodes.push(growTarget)
        
      }
    }
  }

  // cellOne: POI
  // cellTwo: POI
  // returns [ Int, Int ], where the ints are sorted
  _createRoad(cellOne, cellTwo) {
    if (cellOne.cellIndex == cellTwo.cellIndex) {
      console.error("cannot create a road between the same cellindex and itself " + cellOne.cellIndex)
    }
    if (cellOne.cellIndex < cellTwo.cellIndex) {
      return [cellOne, cellTwo]
    } else {
      return [cellTwo, cellOne]
    }
  }

  // fromPoints: [posObj]
  // toPoint: [posObj]
  // returns index of 'fromPoints' closest to 'toPoint'
  _getPointClosest(fromPoints, toPoint) {
    var bestIndex = 0
    var bestDist = toPoint.pos.getDistSqFromVec(fromPoints[bestIndex].pos)
    for (var i=1; i< fromPoints.length; i++) {
      var dist =  toPoint.pos.getDistSqFromVec(fromPoints[i].pos)
      if (dist < bestDist) {
        bestIndex = i
        bestDist = dist
      }
    }

    return bestIndex
  }
}

class NameGenerator {

  // Return a faction name
  faction(factionIndex) {
    switch(factionIndex) {
      case 0:
        return "Republic of Converts"
      case 1:
        return "The Collective"
      case 2:
        return "The Empire of Dawn"
      case 4: 
        return "New Kaledon"
      default:
        return "unknown"
    }
  }

  // Return a city name particular to a specific faction
  city(factionIndex) {
    switch (factionIndex) {
      default:
        return "cityName"
    }
  }
}