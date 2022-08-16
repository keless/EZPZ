
class TerrainGenerator {
  
  // Generate a random terrain with points of interest, road networks, high/low/impassable terrain, and biome features
  // 5 "countries"
  //   each with 1 capital
  //   between 2 and 5 cities
  //   5 to 15 villages

  constructor() {
    this.regionWidth = 1024
    this.regionHeight = 1024

    this.nameGenerator = new NameGenerator()

    this.allPOIs = []

    // Must correspond to numFactions count
    this.factionColors = ["rgb(255, 0, 0)", "rgb(0, 0, 255)", "rgb(60, 179, 113)", "rgb(255, 165, 0)", "rgb(238, 130, 238)"]

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
      /* do not initally generate cities
      for (let c=0; c < country.cities.length; c++) {
        this.allPOIs.push(country.cities[c])
      }*/
    }

    this.countryVoronoi = null
    this.cityVoronoi = null

    console.log("created 5 countries with " + this.allPOIs.length  + " total cities")
    console.log("in order " + this.factions[0].color + "," + this.factions[1].color + "," + this.factions[2].color + "," + this.factions[3].color + "," + this.factions[4].color)
  }

  generate() {
    console.log("todo: generate positions")

    var gridSize = 31

    // 0) Generate points on a regular offset of `{gridSize, gridSize}` with a margin from the edges of `gridSize+1`
    //zzz todo: generate UNIQUE points
    var margin = gridSize + 1
    var points = []

    var numCountries = this.countries.length
    var numPointsToGenerate = this.countries.length + getRand(2*numCountries, 5*numCountries)
    for (let i=0; i< numPointsToGenerate; i++) {
      var vec = new Vec2D(getRand(margin, this.regionWidth - margin), getRand(margin, this.regionHeight - margin))
      vec.setVal(Math.floor(vec.x / gridSize) * gridSize, Math.floor(vec.y / gridSize) * gridSize)
      points.push(vec)
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
      let pos = capitalPositions[i]
      this.countries[i].capital.pos.setVec( pos )
      delaunyPoints.push([ pos.x, pos.y ])
    }
    
    // Generate the country voronoi graph so we can determine which country each city will end up inside of
    let delauny = document.Delaunay.from(delaunyPoints)
    let voronoi = delauny.voronoi([0,0, this.regionWidth, this.regionHeight])
    this.countryVoronoi = voronoi


    var allDelaunyPoints = delaunyPoints.slice() // copy array then add to it
    // Choose allegience of city POIs based on inclusion in country's voronoi cell
    for (let i=0; i< points.length; i++) {
      var pos = points[i]
      for (let c=0; c< this.countries.length; c++) {
        if (voronoi.contains(c, pos.x, pos.y)) {
          let city = this.countries[c].addCity(this.nameGenerator, pos)
          this.allPOIs.push(city)
          allDelaunyPoints.push([pos.x, pos.y])
          continue
        }
      }
      
    }


    /*
    for (var i=0; i< this.countries.length; i++) {
      var country = this.countries[i]
      for (var c=0; c< country.cities.length; c++) {
        pIdx = this._getPointClosest(points, country.capital.pos)

        let pos = points.splice(pIdx, 1)[0]
        this.countries[i].cities[c].pos.setVec( pos )
        allDelaunyPoints.push([ pos.x, pos.y ])
      }
    }
    */



    let allDelauny = document.Delaunay.from(allDelaunyPoints)
    let allVoronoi = allDelauny.voronoi([0,0, this.regionWidth, this.regionHeight])
    this.cityVoronoi = allVoronoi

    // blindly set all cities randomly
    //zzz todo: replace this
    /*
    var pointsOffset = 0
    for (var i=0; i< this.allPOIs.length; i++) {
      if (this.allPOIs[i].type == "Capital") {
        pointsOffset += 1
        continue
      }

      this.allPOIs[i].pos.setVec(points[i - pointsOffset])
    }*/

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

  // fromPoints: [Vec2D]  - points to be the furthest from
  // selectFrom: [Vec2D]  - set of points to chose furthest point in
  // returns index of 'selectFrom'
  _getPointFurthest(fromPoints, selectFrom) {
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

  // fromPoints: [Vec2D]  - points to calculate average distance from
  // toPoint: Vec2D   - single point to calculate distance to
  // returns avg squared-distance
  _getAvgDistSQFrom(fromPoints, toPoint) {
    var distSQ = 0
    for (var i=0; i< fromPoints.length; i++) {
      distSQ += toPoint.getDistSqFromVec(fromPoints[i])
    }
    return distSQ / fromPoints.length
  }

  // Create a nodeView that renders the given generated terrain
  createNodeView(boundsXmin, boundsYmin, boundsXmax, boundsYmax) {
    var node = new NodeView()
    node.size.setVal(boundsXmax - boundsXmin, boundsYmax - boundsYmin);
    node.addCustomDraw((g, x,y, ct) => {
      for (let poi of this.allPOIs) {
        let fillStyle = this.factionColors[poi.factionIndex]
        let strokeStyle = "rgb(0, 0, 0)"
        let strokeWidth = 2
        let radius = 5
        if (poi.type == "Capital") {
          radius = 10
        }
        g.drawCircleEx(poi.pos.x, poi.pos.y, radius, fillStyle, strokeStyle, strokeWidth)
      }

      //g.ctx.beginPath()
      //this.delauny.render(g.ctx)
      //g.ctx.stroke()
      g.ctx.strokeStyle = "rgb(0,0,0)"
      g.ctx.lineWidth = 3
      g.ctx.beginPath()
      this.cityVoronoi.render(g.ctx)
      g.ctx.stroke()

      /*
      g.ctx.strokeStyle = "rgb(50,150,50)"
      g.ctx.lineWidth = 3
      g.ctx.beginPath()
      this.countryVoronoi.render(g.ctx)
      g.ctx.stroke()*/
    })
    return node
  }
}

class POI {
  constructor(name, pos, type, factionIndex) {
    this.name = name
    this.pos = pos
    this.type = type
    this.factionIndex = factionIndex
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
  constructor(nameGenerator, factionIndex) {
    this.capital = new POI(nameGenerator.city(factionIndex), new Vec2D(0, 0), "Capital", factionIndex)
    this.cities = []
    /* dont immediately create cities-- use voronoi cells to determine cities that belong to this country during generation instead
    for (let i=0; i< getRand(this.minCities, this.maxCities); i++) {
      this.cities.push( new POI(nameGenerator.city(factionIndex), 0, 0, "City", factionIndex))
    }*/
  }

  addCity(nameGenerator, pos) {
    let factionIndex = this.capital.factionIndex
    let city = new POI(nameGenerator.city(factionIndex), pos, "City", factionIndex)
    this.cities.push(city)
    return city
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