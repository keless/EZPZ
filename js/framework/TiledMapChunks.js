/**
 * Tiled map .json loader and renderer that supports chunked Tiled json maps
 *   also reads physics rectangles with the format:
 * 
 */

class TiledMapExporter {

  // mapImageData: Data - 
  // progressReportFn: Function (reportValue) - a function that can be called multiple times each sending the progress value (from 0.0 to 1.0) as export happens
  // returns TiledJsonFileFormat object
  static export(mapImageData, regionWidth, regionHeight, colorSet, progressReportFn) {

    let file = new TiledJsonFileFormat()
    progressReportFn(0.01)

    // how many tiles one pixel from the terrain represents
    file.height = regionHeight
    file.width = regionWidth

    //HARDCODED: just use default hardcoded tile set
    let tileset = new TiledTilesetJsonFileFormat()
    file.tilesets.push(tileset)

    let pixelStep = 4 //rgba
    let imgDataStep = regionWidth * pixelStep

    let chunkSize = TiledChunkJsonFileFormat.chunkSize

    file.width = Math.ceil(regionWidth / file.tileheight)
    file.height = Math.ceil(regionHeight / file.tilewidth)
    let numChunksW = Math.ceil(regionWidth / chunkSize)
    let numChunksH = Math.ceil(regionHeight / chunkSize)
    let numChunks = numChunksW * numChunksH

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

      //console.log("begin chunk " + c + "["+chunkX+","+chunkY+"] @ " + chunk.x + "," + chunk.y)
      let numTiles = chunkSize * chunkSize

      let tileOffsetX = chunk.x
      let tileOffsetY = chunk.y
      for(let tileIdx=0; tileIdx < numTiles; tileIdx++) {
        let tileX = tileOffsetX + (tileIdx % chunkSize)
        let tileY = tileOffsetY + Math.floor(tileIdx / chunkSize)

        // remember that one pixel of source image == one tile at destination
        let pixelDataStartIndex = (tileX * pixelStep) + (tileY * imgDataStep)

        let r = mapImageData[pixelDataStartIndex + 0]
        let g = mapImageData[pixelDataStartIndex + 1]
        let b = mapImageData[pixelDataStartIndex + 2]
        //let a = mapImageData[pixelDataStartIndex + 3]

        // look up the color to find the tile index
        let tilesetIdx = this._rgbToTilesetIndex(r, g, b, colorSet)

        if (tilesetIdx == 0) {
          //console.log("begin tile " + tileIdx + " @ " + tileX + "," + tileY + " = " + tilesetIdx + " r"+r+"g"+g+"b"+b)

          if (tileX == 0) {
            // look up
            if (tileY != 0) {
              tilesetIdx = baseLayer.getTileData(tileX, tileY - 1)
            }
          } else {
            // look left
            tilesetIdx = baseLayer.getTileData(tileX - 1, tileY)
          }
        }

        chunk.data.push(tilesetIdx)

      }

      progressReportFn( c / (numChunks*2))
    }

    let transitionTileLayer = new TiledLayerJsonFileFormat()
    transitionTileLayer.name = "Transition Tile Layer"
    file.layers.push(transitionTileLayer)

    let undefinedTransitions = {}

    for(let c=0; c< numChunks; c++) {
      let chunkX = c % numChunksW
      let chunkY = Math.floor(c / numChunksW)

      let chunk = new TiledChunkJsonFileFormat()
      transitionTileLayer.chunks.push(chunk)
      chunk.x = chunkX * chunkSize
      chunk.y = chunkY * chunkSize

      //console.log("begin chunk " + c + "["+chunkX+","+chunkY+"] @ " + chunk.x + "," + chunk.y)
      let numTiles = chunkSize * chunkSize

      let tileOffsetX = chunk.x
      let tileOffsetY = chunk.y
      for(let tileIdx=0; tileIdx < numTiles; tileIdx++) {
        let tileX = tileOffsetX + (tileIdx % chunkSize)
        let tileY = tileOffsetY + Math.floor(tileIdx / chunkSize)

        //TODO: optimize building the neighbor map by keeping a sliding window instead of rebuilding every step
        let currentTileIdx = baseLayer.getTileData(tileX, tileY)
        
        // assumes orientation where positive-x = east, postitive-y = south
        let west = currentTileIdx
        if (tileX > 0) {
          west = baseLayer.getTileData(tileX-1, tileY)
        }
        let east = currentTileIdx
        if (tileX < regionWidth-1) {
          east = baseLayer.getTileData(tileX+1, tileY)
        }

        let north = currentTileIdx
        if (tileY > 0) {
          north = baseLayer.getTileData(tileX, tileY-1)
        }
        let south = currentTileIdx
        if (tileY < regionHeight-1) {
          south = baseLayer.getTileData(tileX, tileY+1)
        }

        let northWest = north
        if (tileX > 0 && tileY > 0) {
          northWest = baseLayer.getTileData(tileX-1, tileY-1)
        }
        let northEast = north
        if (tileX < regionWidth-1 && tileY > 0) {
          northEast = baseLayer.getTileData(tileX+1, tileY-1)
        }

        let southWest = south
        if (tileX > 0 && tileY < regionHeight-1) {
          southWest = baseLayer.getTileData(tileX-1, tileY+1)
        }
        let southEast = south
        if (tileX < regionWidth-1 && tileY < regionHeight-1) {
          southEast = baseLayer.getTileData(tileX+1, tileY+1)
        }

        let neighborMap = [northWest, north, northEast, west, currentTileIdx, east, southWest, south, southEast]

        let transitionTileIdx = this._getTransitionTile(neighborMap)

        if (transitionTileIdx == undefined) {
          undefinedTransitions[ neighborMap.join(",") ] = true
          transitionTileIdx = 0
        }

        chunk.data.push(transitionTileIdx)
      }

      progressReportFn( (c + numChunks) / (numChunks*2))
    }

    for(let key in undefinedTransitions) {
      console.log("no map for " + key)
    }

    return file
  }

  // r,g,b,a: Int - numbers between 0 and 255
  // returns Int - tileset index of corresponding tile
  static _rgbToTilesetIndex(r, g, b, colorSet) {
    for (let i=0; i< colorSet.length; i++) {
      if (this._colorNearMatch(r,g,b, 30, colorSet[i])) {
        return this._colorsetIndexToTilesetIndex(i)
      }
    }

    return 0
  }

  // r, g, b: Int - color value from 0-255
  // tolerance: Int - range specifying how different from the target value the input can be
  // targetColorValue: [Int] - [r, g, b] color value array, where each value is 0-255
  // returns Bool - true if rgb color is within +/- tolerance of targetColorValue
  static _colorNearMatch(r, g, b, tolerance, targetColorValue) {
    let r2 = targetColorValue[0]
    let g2 = targetColorValue[1]
    let b2 = targetColorValue[2]

    let totalTolerance = tolerance * 3
    let deltaR = Math.abs(r - r2)
    let deltaG = Math.abs(g - g2)
    let deltaB = Math.abs(b - b2)
    return (deltaR + deltaG + deltaB) < totalTolerance
  }

  //HARDCODED: given an index (relative to self.colorset) return the corresponding tileset index
  static _colorsetIndexToTilesetIndex(colorIndex) {
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

  // neighborMap: [Int] - 3x3 (1dimensional) array of neighbors' (and self at idx=4) tile set index
  // returns Int - tileset index for transitional tile overlay layer (or 0 if no tile)
  static _getTransitionTile(neighborMap) {

    let key = neighborMap.join(",")
    switch(key) {
      // grass over water
      case "191,191,191,124,191,191,191,191,191":
      case "191,191,124,191,191,191,191,191,191":
      case "124,191,191,191,191,191,191,191,191":
      case "191,191,191,191,191,191,191,191,124":
      case "191,191,191,191,191,191,191,124,124":
      case "191,191,124,191,191,124,191,124,124":
      case "124,124,191,124,191,191,191,191,191":
      case "191,191,191,191,191,124,124,124,124":
        return 0 // grass, no transition to water

      case "124,124,191,124,124,191,191,191,191":
      case "124,124,124,124,124,191,191,191,191":
      case "124,124,124,124,124,191,124,191,191":
      case "124,124,191,124,124,191,124,191,191": 
        return 150 // grass over water (nw corner)
        
      case "191,124,124,191,124,124,191,191,191":
      case "191,124,124,191,124,124,191,191,124":
      case "124,124,124,191,124,124,191,191,124":
      case "124,124,124,191,124,124,191,191,191": 
        return 149  // grass over water (ne corner)

      case "191,191,191,124,124,191,124,124,124":
      case "124,191,191,124,124,191,124,124,124":
      case "124,191,191,124,124,191,124,124,191":
      case "191,191,191,124,124,191,124,124,191":
        return 129 // grass over water (sw corner)

      case "191,191,124,191,124,124,124,124,124":
      case "191,191,124,191,124,124,191,124,124":
      case "191,191,191,191,124,124,124,124,124":
      case "191,191,191,191,124,124,191,124,124": 
        return 128 // grass over water (se corner)


      case "124,124,124,124,124,124,124,124,191": return 169 // grass over water (nw edge)

      case "124,124,124,124,124,124,191,124,124": return 171 // grass over water (ne edge)
        
      case "124,124,191,124,124,124,124,124,124": return 211 // grass over water (sw edge)

      case "191,124,124,124,124,124,124,124,124": return 213 // grass over water (se edge)
      
      case "124,124,124,124,124,124,191,191,191":
      case "124,124,124,124,124,124,191,191,124":
      case "124,124,124,124,124,124,124,191,191":
      case "124,124,124,124,124,124,124,191,124":
        return 170 // grass into water (n edge)

        case "191,124,124,124,124,124,191,124,124": // special fill edge
      case "124,124,124,191,124,124,124,124,124":
      case "191,124,124,191,124,124,124,124,124":
      case "124,124,124,191,124,124,191,124,124":
      case "191,124,124,191,124,124,191,124,124":
        return 192 // grass into water (e edge)

      case "191,191,124,124,124,124,124,124,124":
      case "191,191,191,124,124,124,124,124,124":
      case "124,191,124,124,124,124,124,124,124":
      case "124,191,191,124,124,124,124,124,124":
        return 212 // grass into water (s edge)

      case "124,124,124,124,124,191,124,124,124":
      case "124,124,124,124,124,191,124,124,191":
      case "124,124,191,124,124,191,124,124,191":
      case "124,124,191,124,124,191,124,124,124":
        return 190 // grass over water (w edge)

      case "191,191,124,191,124,124,191,191,124":
        return 232 //special fill


      // road over grass

      case "191,65,65,191,65,65,191,191,65": return 0 // road, no transition to grass

      case "191,191,65,191,191,65,65,191,65": //special fill
      case "191,191,191,191,191,65,65,191,65": //special fill
      case "191,191,191,191,191,65,65,65,65": 
      case "191,191,65,191,191,65,65,65,65": 
      case "191,191,191,191,191,65,191,65,65": 
      case "191,191,65,191,191,65,191,65,65": 
        return 24 // road into grass (nw corner)

      case "65,191,191,65,191,191,65,191,65": //special fill
      case "65,191,191,65,191,191,65,65,65":
      case "191,191,191,65,191,191,65,65,191":
      case "191,191,191,65,191,191,65,65,65":
      case "65,191,191,65,191,191,65,65,191":
        return 23 // road into grass (ne corner)

      case "65,65,65,191,191,65,191,191,65":
      case "191,65,65,191,191,65,191,191,191":
      case "65,65,65,191,191,65,191,191,191":
      case "191,65,65,191,191,65,191,191,65":
        return 3 // road into grass (sw corner)

      case "65,65,65,65,191,191,65,191,191":
      case "65,65,191,65,191,191,191,191,191":
      case "65,65,65,65,191,191,191,191,191":
      case "65,65,191,65,191,191,65,191,191":
        return 2 // road into grass (se corner)


      case "191,191,191,191,191,191,191,191,65": return 43 // road into grass (nw edge)

      case "191,191,191,191,191,191,65,191,191": return 45 // road into grass (ne edge)

      case "191,191,65,191,191,191,191,191,191": return 85 // road into grass (sw edge)

      case "65,191,191,191,191,191,191,191,191": return 87 // road into grass (se edge)

      case "191,191,191,191,191,191,65,65,65":
      case "191,191,191,191,191,191,191,65,65":
      case "191,191,191,191,191,191,65,65,191":
      case "191,191,191,191,191,191,191,65,191": 
        return 44 // road into grass (n edge)

      case "191,191,191,65,191,191,65,191,191":
      case "65,191,191,65,191,191,191,191,191":
      case "65,191,191,65,191,191,65,191,191":
      case "191,191,191,65,191,191,191,191,191":
        return 66 // road into grass (e edge)

      case "65,65,65,191,191,191,191,191,191":
      case "191,65,65,191,191,191,191,191,191":
      case "65,65,191,191,191,191,191,191,191":
      case "191,65,191,191,191,191,191,191,191": 
        return 86 // road into grass (s edge)

      case "191,191,65,191,191,191,191,191,65": //special fill
      case "191,191,191,191,191,65,191,191,191":
      case "191,191,65,191,191,65,191,191,191":
      case "191,191,65,191,191,65,191,191,65":
      case "191,191,191,191,191,65,191,191,65": 
        return 64 // road into grass (w edge)

      case "191,191,191,65,191,65,65,65,65":
      case "191,191,65,65,191,65,65,65,65":
      case "65,191,191,65,191,65,65,65,65":
      case "191,65,65,191,191,65,191,65,65":
        return 108 // special fill road


      // No transition:
      case "124,124,124,124,124,124,124,124,124": // all ocean
      case "191,191,191,191,191,191,191,191,191": // all grass
      case "65,65,65,65,65,65,65,65,65": // all dirt road
        return 0
      default:
        return undefined
    }
  }
}

class TiledJsonFileFormat {
  constructor() {
    this.compressionlevel = -1
    this.infinite = true
    this.height = 0
    this.width = 0
    // layers: [TiledLayerJsonFileFormat]
    this.layers = []

    this.nextlayerid = 4
    this.nextobjectid = 1
    this.orientation = "orthogonal"
    this.renderorder = "right-down"
    this.tiledversion = "1.9.1"
    this.tileheight = TiledTilesetJsonFileFormat.tileSize
    this.tilewidth = TiledTilesetJsonFileFormat.tileSize

    // tilesets: [TiledTilesetJsonFileFormat]
    this.tilesets = []

    this.type = "map"
    this.version = "1.9"
  }

  static chunkSize
}

class TiledLayerJsonFileFormat {
  constructor() {
    // chunks: [TiledChunkJsonFileFormat]
    this.chunks = []
    this.height = 32
    this.width = 32
    this.id = 1
    this.name = "Tile Layer 1"
    this.opacity = 1
    this.startx = -16
    this.starty = -16
    this.type = "tilelayer"
    this.visible = true
    this.x = 0
    this.y = 0
  }

  // x, y: Int - globally scoped tile coordinates (not pixel coordinates)
  // returns Int - the tileset index data for the tile at the given coordinates
  getTileData(x, y) {
    for (let c=0; c< this.chunks.length; c++) {
      let chunk = this.chunks[c]
      let rangeXmax = chunk.x + chunk.width
      let rangeYmax = chunk.y + chunk.height
      if (rangeXmax > x && rangeYmax > y) {
        return chunk.getTileData(x, y)
      }
    }
  }
}

class TiledChunkJsonFileFormat {

  static chunkSize = 16

  constructor() {
    // data: [Int] - tile index of each tile (in a 2d array represented as 1d array with wrap size = this.width)
    this.data = []
    this.height = TiledChunkJsonFileFormat.chunkSize
    this.width = TiledChunkJsonFileFormat.chunkSize
    this.x = 0
    this.y = 0
  }

  // x, y: Int - globally scoped coordinates (eg: 0,0 is only valid if this chunk.x,y == 0,0)
  // returns Int - the tileset index data for the tile at the given coordinates
  getTileData(x, y) {
    let localX = x - this.x
    let localY = y - this.y
    return this.data[ localX + (localY * this.width) ]
  }
}

// embedded hardcoded tileset
class TiledTilesetJsonFileFormat {

  static tileSize = 32

  constructor() {
    this.columns = 21
    this.firstgid = 1,
    this.image = "terrain.png"
    this.imageheight = 736
    this.imagewidth = 672
    this.margin = 0
    this.name = "terrain"
    this.spacing = 0
    this.tilecount = 483
    this.tileheight = TiledTilesetJsonFileFormat.tileSize
    this.tilewidth = TiledTilesetJsonFileFormat.tileSize
  }
}

/* external tileset
class TiledTilesetJsonFileFormat {
  constructor() {
    this.firstgid = 1,
    this.source = "terrain.tsx"
  }
}*/