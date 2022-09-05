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