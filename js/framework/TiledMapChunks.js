/**
 * Tiled map .json loader and renderer that supports chunked Tiled json maps
 *   also reads physics rectangles with the format:
 * 
 */

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
    this.orientation = orthogonal
    this.renderorder = right-down
    this.tiledversion = "1.9.1"
    this.tileheight = 32
    this.tilewidth = 32

    // tilesets: [TiledTilesetJsonFileFormat]
    this.tilesets = []

    this.type = "map"
    this.version = "1.9"
  }
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
}

class TiledChunkJsonFileFormat {
  constructor() {
    // data: [Int] - tile index of each tile (in a 2d array represented as 1d array with wrap size = this.width)
    this.data = []
    this.height = 16
    this.width = 16
    this.x = 0
    this.y = 0
  }
}

class TiledTilesetJsonFileFormat {
  constructor() {
    this.firstgid = 1,
    this.source = "terrain.tsx"
  }
}