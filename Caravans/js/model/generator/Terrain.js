
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
    }

    this.countryVoronoi = null
    this.allVoronoi = null
    this.vornoiCellToFactionMap = {}
    this.voronoiCellToPOIMap = {}

    // array of arrays where inner-array is a sorted array of two Ints representing cell indexes that have a road between them
    // eg: [ [1,4], [4, 120], [15, 120] ]  represents 3 connected road segments from 1<->4<->120<->15
    this.roads = []

    this.searchPathStart = null
    this.searchPath = []

    this.seaColor = "rgb(0, 0, 250)"
    this.grassColor = "rgb(0, 250, 0)"
    this.roadColor = "rgb(133, 42, 42)"
    this.cityColor = "rgb(250, 250, 250)"

    this.colorSet = [
      [0, 0, 250], // sea
      [0, 250, 0], // grass
      [133, 42, 42], // road
      [250, 250, 250], // city
    ]
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

    this._lloydsRelaxation(3)

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

      /* clearly i dont understand what the voronoi circumcenters are..
      let cIdx = i * 2
      let circumCenterX = this.allVoronoi.circumcenters[cIdx]
      let circumCenterY = this.allVoronoi.circumcenters[cIdx + 1]

      if (circumCenterX != pos.x || circumCenterY != pos.y) {
        console.log("moving capital " + cellIndex + " " + pos.x+","+pos.y +" => "+ circumCenterX +","+ circumCenterY ) 
      }
      this.countries[i].capital.pos.setVal(circumCenterX, circumCenterY)
      */

      this.countries[i].capital.pos.setVec(pos)
      this.countries[i].capital.cellIndex = cellIndex
      delaunyPoints.push([ pos.x, pos.y ])

      //console.log("add faction map of Capital cell " + cellIndex)
      this.vornoiCellToFactionMap[cellIndex] = factionIndex
      this.voronoiCellToPOIMap[cellIndex] = this.countries[i].capital
      this.allPOIs.push(this.countries[i].capital)
    }
    
    // Generate the country voronoi graph so we can determine which country each city will end up inside of
    let delauny = document.Delaunay.from(delaunyPoints)
    this.countryVoronoi = delauny.voronoi([0,0, this.regionWidth, this.regionHeight])

    // Choose allegience of city POIs based on inclusion in country's voronoi cell
    for (let i=0; i<points.length; i++) {
      let pos = points[i].pos
      let cellIndex = points[i].index
      let foundCountry = false
      for (let c=0; c< this.countries.length; c++) {
        if (this.countryVoronoi.contains(c, pos.x, pos.y)) {
          let poi = this.countries[c].addRandomPOI(this.nameGenerator, pos, cellIndex)

          this.allPOIs.push(poi)
          this.voronoiCellToPOIMap[cellIndex] = poi

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

    // Fill in neighbors for all POIs, for use in EZAstar
    for(let poi of this.allPOIs) {
      let voronoiNeighbors = this.allVoronoi.neighbors(poi.cellIndex)
      for(let vNeighbor of voronoiNeighbors) {
        if (this.voronoiCellToPOIMap.hasOwnProperty(vNeighbor)) {
          let neighborPOI = this.voronoiCellToPOIMap[vNeighbor]

          // drop neighbors that only have one point in contact, or that have an edge that is too small
          if (this._evaluateNeighbors(poi, neighborPOI)) {
            poi.neighbors.push(neighborPOI)
          }
        }
      }

      /*
      if (poi.type == "Capital") {
        console.log(poi.neighbors)
        console.log("for capital at " + poi.cellIndex)
      }*/
    }

    let allRoadPoints = this.allPOIs.filter((poi) => {
      return poi.type == "Capital" || poi.type == "City"
    })
    let seedPoints = []
    for (let c=0; c<this.countries.length; c++) {
      seedPoints.push(this.countries[c].capital)
    }

    let roadGenerator = new RoadGenerator(allRoadPoints, seedPoints)

    // roads "as the crow flies" need to be converted to segmented roads that path through individual voronoi cells
    let crowRoads = roadGenerator.roads
    for (let road of crowRoads) {
      let startPOI = road[0]
      let endPOI = road[1]
      let result = EZAstar.search(startPOI, endPOI)
      if (result.length > 0) {
        for (let i=0; i< result.length -1; i++) {
          let segment = this._createRoad(result[i], result[i+1])

          // ensure uniqueness (so we dont have doubles of roads)
          if(this.roads.find((r)=> { return r[0].cellIndex == segment[0].cellIndex && r[1].cellIndex == segment[1].cellIndex  }) == undefined) {
            this.roads.push(segment)
          }
        }
      }
    }

    this.roadRunner(this.roads)

    let jsonObject = this.toTiledJson()
    let fileJson = JSON.stringify(jsonObject, null, " ")
    this.downloadFile(fileJson, "generatedMap.json")
  }

  downloadFile(text, filename = 'untitled.dat') {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  _lloydsRelaxation(numRounds) {
    for (let r=0; r<numRounds; r++) {
      let pointsFlat = this.allVoronoi.delaunay.points
      for (let i=0; i< pointsFlat.length/2; i++) {
        let idx = i*2
  
        // move each point to the centroid of the generated Voronoi polygon
        let cX = 0
        let cY = 0
        var poly = this.allVoronoi.cellPolygon(i)
        for (let p=0; p<poly.length; p++) {
          cX += poly[p][0]
          cY += poly[p][1]
        }
        cX = cX / poly.length
        cY = cY / poly.length
  
        pointsFlat[idx] = cX
        pointsFlat[idx+1] = cY
        this.allPoints[i].setVal(cX, cY)
      }

      // regenerate the voronoi
      this.allVoronoi.update()
    }
  }

  // returns true if the cells are allowed (by us) to be neighbors
  _evaluateNeighbors(cellOne, cellTwo) {
    let edge = this.getSharedEdge(cellOne, cellTwo)
    if (edge.length != 2) {
      // edges with only one point are not to be considered neighbors
      return false
    }

    let v1 = new Vec2D(edge[0][0], edge[0][1])
    let v2 = new Vec2D(edge[1][0], edge[1][1])

    let minEdgeDistance = 10
    let edgeDistance = v1.getDistSqFromVec(v2)

    return edgeDistance > minEdgeDistance*minEdgeDistance
  }

  // cellOne: POI
  // cellTwo: POI
  // returns [ [Float, Float], ... n] - array of point arrays
  getSharedEdge(cellOne, cellTwo) {
    // get verticies of each cell
    let v1 = Array.from(this.allVoronoi.cellPolygon(cellOne.cellIndex))
    let v2 = Array.from(this.allVoronoi.cellPolygon(cellTwo.cellIndex))
    let vShared = v1.filter((e1)=>{ return v2.find( (e2)=> { return this._compareFloatVertArray(e1, e2)} ) != undefined  })
    if (vShared.length == 3) {
      // voronoi polygons contain the start/end vertex twice-- remove it
      vShared.splice(2,1)
    }
    return vShared
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

  Draw(g, x,y, ct, showFactionColors, showCellOutlines, showCellNumbers, showSearchPath) {

      // just fill water as background, instead of drawing edge cells
      g.drawRectEx(0, 0, this.regionWidth, this.regionHeight, this.seaColor)

      if(g.drawCentered) {
        g.translate(-this.regionWidth/2, -this.regionHeight/2)
      }

      // draw "water" edge cells first
      /*
      for (let edge of this.edgeCellIndicies) {
        g.ctx.strokeStyle = "rgb(0,0,250)"
        g.ctx.lineWidth = 3
        let fillStyle = "rgb(0, 0, 250)"
        g.ctx.fillStyle = fillStyle
        g.ctx.beginPath()
        this.allVoronoi.renderCell(edge, g.ctx)
        g.ctx.fill()
        g.ctx.stroke()
      }*/


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
        let strokeStyle = "rgb(0,0,0)"
        g.ctx.lineWidth = 2
        let fillStyle = this.factionColors[factionIndex]
        if (!showFactionColors) {
          fillStyle = this.grassColor
          strokeStyle = this.grassColor
        }
        g.ctx.fillStyle = fillStyle
        g.ctx.strokeStyle = strokeStyle
        g.ctx.beginPath()
        this.allVoronoi.renderCell(cellIndex, g.ctx)
        g.ctx.fill()
        g.ctx.stroke()
        
        // draw circle if capital or city
        if (showFactionColors) {
          // dont render these to base map (should do a second higher-layer path?)
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
            if (!showCellOutlines) {
              strokeStyle = ""
            }
            if (!showFactionColors) {
              fillStyle = this.cityColor
            }
            g.drawCircleEx(poi.pos.x, poi.pos.y, radius, fillStyle, strokeStyle, strokeWidth)
          }
        }


        /* draw roads (normal line)
        for (let road of this.roads) {
          // TODO: roads need to cross cells at their actual touching boarder not just directly between centroids
          let startPos = road[0].pos
          let endPos = road[1].pos
          g.drawLineEx(startPos.x, startPos.y, endPos.x, endPos.y, "rgb(133,42,42)", 4)
        }//*/

        //* draw roads (bezier)
        for (let road of this.roads) {
          let v1 = road[0].pos //start
          let edge = this.getSharedEdge(road[0], road[1])
          // todo handle error case (edge.length != 2)
          let v2 = new Vec2D(edge[0][0], edge[0][1])
          let v3 = new Vec2D(edge[1][0], edge[1][1])
          let v4 = road[1].pos //end
          
          g.drawCubicBezierEx(this.normalizeBezier([v1, v2, v3, v4]), "", this.roadColor, 4)
        }
        //*/

        /*
        // draw search path (normal line)
        for (let road of this.searchPath) {
          let startPos = road[0].pos
          let endPos = road[1].pos
          g.drawLineEx(startPos.x, startPos.y, endPos.x, endPos.y, "rgb(255,242,242)", 4)
        }*/

        // draw search path (bezier)
        if (showSearchPath) {
          for (let road of this.searchPath) {
            let v1 = road[0].pos //start
            let edge = this.getSharedEdge(road[0], road[1])
            // todo handle error case (edge.length != 2)
            let v2 = new Vec2D(edge[0][0], edge[0][1])
            let v3 = new Vec2D(edge[1][0], edge[1][1])
            let v4 = road[1].pos //end
            //g.drawCubicBezierEx([v1, v2, v3, v4], "", "rgb(255,242,242)", 4)
            let result = this.normalizeBezier([v1, v2, v3, v4])
            g.drawCubicBezierEx(result, "", "rgb(255,242,242)", 4)
            v2 = result[1]
            v3 = result[2]
            g.drawCircleEx(v2.x, v2.y, 3, "rgb(0,255,0)")
            g.drawCircleEx(v3.x, v3.y, 3, "rgb(255,0,255)")
          }
        }

        // draw cell index
        if (showCellNumbers) {
          g.drawTextEx("" + poi.cellIndex, poi.pos.x, poi.pos.y, "Arial 12pt", "rgb(255, 255, 255)")
          g.drawTextEx("" + poi.cellIndex, poi.pos.x, poi.pos.y, "Arial 8pt", "rgb(0, 0, 0)")
        }
      }

      // Show country voronoi lines
      /*
      g.ctx.strokeStyle = "rgb(0,255,0)"
      g.ctx.beginPath()
      this.countryVoronoi.render(g.ctx)
      g.ctx.stroke()
      */
  }

  // Create a nodeView that renders the given generated terrain
  createNodeView() {
    var node = new NodeView()
    node.shouldCache = true
    node.size.setVal(this.regionWidth, this.regionHeight);
    node.addCustomDraw((g, x,y, ct) => {
      //zzz this.Draw(g, x, y, ct, true, true, true, true)
      // for now, draw the same way we calculate the tileset
      this.Draw(g, x, y, ct, false, false, false, false)
    })

    node.setClick((e, x, y)=> {
      node.InvalidateCachedView()

      x += node.size.x/2
      y += node.size.y/2
      for (let i=0; i<this.allPOIs.length; i++) {
        let cellIndex = this.allPOIs[i].cellIndex

        if (this.allVoronoi.contains(cellIndex, x, y)) {
          console.log("clicked cell " + cellIndex + " at " + x +","+ y +" has neighbors " + this.voronoiCellToPOIMap[cellIndex].neighbors.map((e)=>{ return e.cellIndex }))

          if (e.button == 0) {
            this.searchPathStart = this.voronoiCellToPOIMap[cellIndex]
            console.log("start search from " + cellIndex)

            // left click
            //EventBus.ui.dispatch({evtName: "voronoi left clicked", cell: cellIndex})
          } else if (e.button == 2) {
            if (this.searchPathStart != null && this.voronoiCellToPOIMap.hasOwnProperty(cellIndex)) {
              let endPoint = this.voronoiCellToPOIMap[cellIndex]

              // return path through shared edge MIDPOINT from start to current
              /* 
              let edge = this.getSharedEdge(this.searchPathStart, endPoint)
              if (edge.length == 1) {
                // -- turns out this is nasty; we should not consider 'one point' shared as being a neighbor
                let v1 = this.searchPathStart
                let vM = edge[0]
                let v2 = endPoint
                this.searchPath = [[v1, vM], [vM, v2]]
              } else if (edge.length == 2) {
                let v1 = this.searchPathStart
                let vM = this.getEdgeMidpointObject(edge)
                let v2 = endPoint
                ///todo: 
                console.log("todo: render a path that goes through the middle point of the edge")
                this.searchPath = [[v1, vM], [vM, v2]]
              } else if (edge.length > 2) {
                console.log("bro, what?")
              }*/

              //* create a search path and store it in this.searchPath
              console.log("search from " + this.searchPathStart.cellIndex + " to " + cellIndex)
              
              let result = EZAstar.search(this.searchPathStart, endPoint)

              let resultCellIndexArr = result.map((e)=>{ return e.cellIndex })

              if (result.length == 0) {
                this.searchPath = []
              } else {
                for (let i=0; i< result.length -1; i++) {
                  let segment = this._createRoad(result[i], result[i+1])
                  this.searchPath.push(segment)
                }
              }


              console.log("got result " + resultCellIndexArr.join(", "))
              this.searchPathStart = null
              //*/
            }

            // right click
            //EventBus.ui.dispatch({evtName: "voronoi right clcked", cell: cellIndex})
          }
          return
        }
      }
    })

    return node
  }

  normalizeBezier(vArr) {
    let v1 = vArr[0]
    let c1 = vArr[1]
    let c2 = vArr[2]
    let v2 = vArr[3]

    // fixed distance between control points no matter what
    let direction = c1.getVecSub(c2)
    let midPoint = direction.scalarMult(0.5).getVecAdd(c2)

    let constantDistanceHalf = 3 // half because its applied as an offset from the midpoint, so twice (once each direction +/-)
    let offset = direction.getUnitized().scalarMult(constantDistanceHalf)
    c1 = midPoint.getVecAdd(offset)
    c2 = midPoint.getVecSub(offset)
    
    return [v1, c1, c2, v2]
  }

  // edge: [[Int, Int], [Int, Int]]
  // returns object {pos: Vec2D}
  getEdgeMidpointObject(edge) {
    let v1 = new Vec2D(edge[0][0], edge[0][1])
    let v2 = new Vec2D(edge[1][0], edge[1][1])
    let pos = v1.subVec(v2).scalarMult(0.5).addVec(v2)
    return { pos: pos }
  }

  _compareFloatVertArray(one, two) {
    let tolerance = 0.00001
    if (Math.abs(one[0] - two[0]) > tolerance) {
      return false
    }
    if (Math.abs(one[1] - two[1]) > tolerance) {
      return false
    }
    return true
  }

  // roads: [ RoadSegment, ... n ]
  // returns [ [RoadSegment, ... n], ... n ] where each sub array is a run of roads without any cross roads and can be rendered with a single bezier curve
  roadRunner(roads) {
    let map = new Map()
    for (let i=0; i<roads.length; i++) {
      let road = roads[i]
      if (!map.has(road[0].cellIndex)) { map.set(road[0].cellIndex, new Set()) }
      if (!map.has(road[1].cellIndex)) { map.set(road[1].cellIndex, new Set()) }
      map.get(road[0].cellIndex).add(i)
      map.get(road[1].cellIndex).add(i)
    }

    /* // debug print
    let strArr = []
    for(let key of map.keys()) {
      strArr.push("{ " + key + " : " + map.get(key).size + " }")
    }
    console.log(strArr.join(", "))
    //*/
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

  // Tiled support
  // returns a json object that represents the terrain as a Tiled format
  toTiledJson() {
    let file = new TiledJsonFileFormat()

    // how many tiles one pixel from the terrain represents
    let scaleFactor = 1
    file.height = this.regionHeight * scaleFactor
    file.width = this.regionWidth * scaleFactor

    // just use default
    let tileset = new TiledTilesetJsonFileFormat()
    file.tilesets.push(tileset)

    // Layer1 - base terrain without details
    let g = Service.Get("gfx")
    // make sure we're rendered correctly

    let saveAntialiased = g.ctx.imageSmoothingEnabled
    let saveCentered = g.drawCentered
    g.drawCentered = false
    g.ctx.imageSmoothingEnabled = false
    this.Draw(g, 0, 0, 0, false, false, false, false)
    g.drawCentered = saveCentered
    
    // imgData is a 1D array of r, g, b, a, pixel value sets
    // the location of 'r' of pixel at (0, 1) is imgData[ (0 + 1*imgDataStep) + 0]
    // the location of 'b' of pixel at (10, 0) is imgData[ (10*pixelStep + 0) + 2]
    // eg: colorIndex of pixel at (x, y) = imgData[ (x*pixelStep + y*imgDataStep) + colorIndex]
    let imgData = g.ctx.getImageData(0,0, this.regionWidth, this.regionHeight).data
    let pixelStep = 4 //rgba
    let imgDataStep = this.regionWidth * pixelStep

    let chunkSize = TiledChunkJsonFileFormat.chunkSize

    file.width = Math.ceil(this.regionWidth / file.tileheight)
    file.height = Math.ceil(this.regionHeight / file.tilewidth)
    let numChunksW = Math.ceil(this.regionWidth / chunkSize)
    let numChunksH = Math.ceil(this.regionHeight / chunkSize)
    let numChunks = numChunksW * numChunksH

    //let chunkStep = numChunksW * chunkSize

    // Fill base layer
    let baseLayer = new TiledLayerJsonFileFormat()
    file.layers.push(baseLayer)
    for(let c=0; c< numChunks; c++) {
      let chunkX = c % numChunksW
      let chunkY = Math.floor(c / numChunksW)

      let chunk = new TiledChunkJsonFileFormat()
      baseLayer.chunks.push(chunk)
      chunk.x = chunkX * chunkSize
      chunk.y = chunkY * chunkSize

      console.log("begin chunk " + c + "["+chunkX+","+chunkY+"] @ " + chunk.x + "," + chunk.y)

      let numTiles = chunkSize * chunkSize

      let tileOffsetX = chunk.x 
      let tileOffsetY = chunk.y
      for(let tileIdx=0; tileIdx < numTiles; tileIdx++) {
        let tileX = tileOffsetX + (tileIdx % chunkSize)
        let tileY = tileOffsetY + Math.floor(tileIdx / chunkSize)

        
        
        //remember that one pixel of source image == one tile at destination
        let pixelDataStartIndex = (tileX * pixelStep) + (tileY * imgDataStep)

        let r = imgData[pixelDataStartIndex + 0]
        let g = imgData[pixelDataStartIndex + 1]
        let b = imgData[pixelDataStartIndex + 2]
        //let a = imgData[pixelDataStartIndex + 3]

        // look up the color to find the tile index
        //let color = "rgb("+r+", "+g+", "+b+")"
        let tilesetIdx = this._rgbToTilesetIndex(r, g, b)

        //zzz TODO: what about when its the first pixel of the current chunk?? or if its a different row?!
        if (tilesetIdx == 0) {
          console.log("begin tile " + tileIdx + " @ " + tileX + "," + tileY + " = " + tilesetIdx + " r"+r+"g"+g+"b"+b)

          if (tileX == 0) {
            // look up
            if (tileY != 0) {
              tilesetIdx = baseLayer.getTileData(tileX, tileY - 1)
            }
          } else {
            // look left
            tilesetIdx = baseLayer.getTileData(tileX - 1, tileY)
          }

          if (tilesetIdx == 0 || tilesetIdx == undefined) {
            console.log("wat")
          }
        }

        chunk.data.push(tilesetIdx)

        //zzz todo: calculate transition overlay layer from known existing tiles (eg: up, left, and up+left) to place on upper layer
      }
    }

    return file
  }

  // r,g,b,a: Int - numbers between 0 and 255
  // returns Int - tileset index of corresponding tile
  _rgbToTilesetIndex(r, g, b) {
    for (let i=0; i< this.colorSet.length; i++) {
      if (this._colorNearMatch(r,g,b, 30, i)) {
        return this._colorsetIndexToTilesetIndex(i)
      }
    }

    return 0
  }

  // Hardcoded lookup table from our color constants to the tileset index
  // colorkey: String - ex: "rgb(250, 250, 250)"
  // returns Int - tileset index of corresponding tile
  _colorkeyToTileSetIndex(colorKey) {
    switch(colorKey) {
      case this.seaColor:
        return this._colorsetIndexToTilesetIndex(0)
      case this.grassColor:
        return this._colorsetIndexToTilesetIndex(1)
      case this.roadColor:
        return this._colorsetIndexToTilesetIndex(2)
      case this.cityColor:
        return this._colorsetIndexToTilesetIndex(3)
      default:
        return 0
    }
  }

  // given an index (relative to self.colorset) return the corresponding tileset index
  _colorsetIndexToTilesetIndex(colorIndex) {
    switch(colorIndex) {
      case 0: //sea
        return 123 + 1
      case 1: // grass
        return 190 + 1
      case 2: // road
        return 64 + 1
      case 3: // city
        return 334 + 1
      default:
        return 0
    }
  }

  _colorNearMatch(r, g, b, tolerance, colorSetIndex) {
    let colorSet = this.colorSet[colorSetIndex]
    let r2 = colorSet[0]
    let g2 = colorSet[1]
    let b2 = colorSet[2]


    let totalTolerance = tolerance * 3
    let deltaR = Math.abs(r - r2)
    let deltaG = Math.abs(g - g2)
    let deltaB = Math.abs(b - b2)
    return (deltaR + deltaG + deltaB) < totalTolerance

    /*
    if (r < (r2 - tolerance) || (r > r2 + tolerance)) { return false }
    if (g < (g2 - tolerance) || (g > g2 + tolerance)) { return false }
    if (b < (b2 - tolerance) || (b > b2 + tolerance)) { return false }
    return true
    */
  }

}
 
class POI {
  constructor(name, pos, type, factionIndex, cellIndex) {
    this.name = name
    this.pos = pos
    this.type = type
    this.factionIndex = factionIndex
    this.cellIndex = cellIndex

    this.neighbors = []
  }

  // Implement EZAstarGraphNode protocol
  EZAstar_neighbors() {
    return this.neighbors
  }

  EZAstar_estimatedCostTo(node) {
    let toPos = node.pos
    // simple euclidian distance
    return Math.sqrt( this.pos.getDistSqFromVec(toPos) )
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