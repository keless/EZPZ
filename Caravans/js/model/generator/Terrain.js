
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
  }

  generate() {
    console.log("todo: generate positions")

    var gridSize = 31

    // 0) Generate points on a regular offset of `{gridSize, gridSize}` with a margin from the edges of `gridSize+1`
    //zzz todo: generate UNIQUE points
    var margin = gridSize + 1
    //var points = []

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

    //zzz TODO: remove edge cells (set them as water or wilderness or something)
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

      console.log("add faction map of Capital cell " + cellIndex)
      this.vornoiCellToFactionMap[cellIndex] = factionIndex
      this.allPOIs.push(this.countries[i].capital)

    }
    
    // Generate the country voronoi graph so we can determine which country each city will end up inside of
    let delauny = document.Delaunay.from(delaunyPoints)
    this.countryVoronoi = delauny.voronoi([0,0, this.regionWidth, this.regionHeight])

    // Choose allegience of city POIs based on inclusion in country's voronoi cell
    for (let i=0; i<points.length; i++) {
      var pos = points[i].pos
      let cellIndex = points[i].index
      let foundCountry = false
      for (let c=0; c< this.countries.length; c++) {
        if (this.countryVoronoi.contains(c, pos.x, pos.y)) {

          let poi = this.countries[c].addRandomPOI(this.nameGenerator, pos, cellIndex)
          // let city = this.countries[c].addCity(this.nameGenerator, pos)
          this.allPOIs.push(poi)
        

          console.log("add faction map of POI cell " + cellIndex)
          let factionIndex = this.countries[c].factionIndex
          this.vornoiCellToFactionMap[cellIndex] = factionIndex
          foundCountry = true
          continue
        }
      }

      if (!foundCountry) {
        print("didnt find country for cell " + cellIndex)
      }
    }
  }

  // returns index of 'fromPoints' closest to 'toPoint'
  _getPointClosest(fromPoints, toPoint) {
    var bestIndex = 0
    var bestDist = toPoint.getDistSqFromVec(fromPoints[bestIndex])
    for (var i=1; i< fromPoints.length; i++) {
      var dist =  toPoint.getDistSqFromVec(fromPoints[i])
      if (dist < bestDist) {
        bestIndex = i
        bestDist = dist
      }
    }

    return bestIndex
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
        //zzz wip - offset
        g.translate(-node.size.x/2, -node.size.y/2)
      }

      for (const cellIndexStr in this.vornoiCellToFactionMap) {
        let cellIndex = parseInt(cellIndexStr)
        let factionIndex = this.vornoiCellToFactionMap[cellIndex]
        g.ctx.strokeStyle = "rgb(0,0,0)"
        g.ctx.lineWidth = 3
        let fillStyle = this.factionColors[factionIndex]
        g.ctx.fillStyle = fillStyle
        g.ctx.beginPath()
        this.allVoronoi.renderCell(cellIndex, g.ctx)
        g.ctx.fill()
        //g.ctx.stroke()
      }

      g.ctx.strokeStyle = "rgb(0,0,0)"
      g.ctx.lineWidth = 3
      g.ctx.beginPath()
      this.allVoronoi.render(g.ctx)
      g.ctx.stroke()


      /*
      g.ctx.strokeStyle = "rgb(50,150,50)"
      g.ctx.lineWidth = 3
      g.ctx.beginPath()
      this.countryVoronoi.render(g.ctx)
      g.ctx.stroke()*/

      for (let poi of this.allPOIs) {
        if (poi.type != "Wilds") {
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

        g.drawTextEx("" + poi.cellIndex, poi.pos.x, poi.pos.y, "Arial 12pt", "rgb(255, 255, 255)")
        g.drawTextEx("" + poi.cellIndex, poi.pos.x, poi.pos.y, "Arial 8pt", "rgb(0, 0, 0)")
      }

      for (let edge of this.edgeCellIndicies) {

        g.ctx.strokeStyle = "rgb(0,0,0)"
        g.ctx.lineWidth = 3
        let fillStyle = "rgb(0, 0, 250)" //this.factionColors[poi.factionIndex]
        g.ctx.fillStyle = fillStyle
        g.ctx.beginPath()
        this.allVoronoi.renderCell(edge, g.ctx)
        g.ctx.fill()
/*
        let pos = this.allPoints[edge]
        let fillStyle = "rgb(0, 0, 250)" //this.factionColors[poi.factionIndex]
        let strokeStyle = "rgb(0, 0, 0)"
        let strokeWidth = 2
        let radius = 10
        g.drawCircleEx(pos.x, pos.y, radius, fillStyle, strokeStyle, strokeWidth)
        */
      }

      g.ctx.strokeStyle = "rgb(0,255,0)"
      g.ctx.beginPath()
      this.countryVoronoi.render(g.ctx)
      g.ctx.stroke()
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