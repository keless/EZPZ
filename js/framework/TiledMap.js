"use strict"; //ES6
//#include js/framework/Graphics.js
//#include js/framework/ResourceProvider.js

/**
 * Tiled map .json loader and renderer
 *   also reads physics rectangles with the format:
 * 
 */
 class TiledMap {
	constructor( path, outputW, outputH ) {
		this.path = path.substring(0, path.lastIndexOf("/")+1);
		this.width = outputW;
		this.height = outputH;
		this.isLoaded = false;
		
		this.tileSets = [];

		this.tileLayers = [];
		this.imgLayers = [];

		this.playerLayerName = "player";
		this.fnDrawPlayerLayer = null;
		
		this.groundRects = [];
		this.wallRects = [];
		this.spawnPts = [];
		
		this.pPhysics = null;
		this.physicsBodies = [];
		
		this.verbose = true;
		this.debugShowBoxes = false;
	}
	
	// called by ResourceProvider
	LoadFromJson( dataJson ) {
		var rp = Service.Get("rp");
		this.data = dataJson;

		//pull tile sets
		for( var tilesetIdx=0; tilesetIdx < this.data.tilesets.length; tilesetIdx++) {
			var tileSet =	this.data.tilesets[tilesetIdx];
			var tileSprite = new Sprite(this.path);
			var tileSpriteJson = { image:tileSet.image, format:"grid", width: tileSet.tilewidth, height: tileSet.tileheight  };
			tileSprite._load(tileSpriteJson)

			tileSet.sprite = tileSprite;
			
			this.tileSets.push( tileSet );
		}

		//pull layer data
		for( var layerIdx=0; layerIdx < this.data.layers.length; layerIdx++ ) {
			var layer = this.data.layers[layerIdx];
			if( layer.type == "imagelayer" ) {
				//image layer
				this.imgLayers.push( layer );
				
				//preload image
				rp.loadImage(this.path + layer.image);
			}
			else if( layer.type == "tilelayer" ) {
				//image layer
				console.log("add tile layer")
				this.tileLayers.push( layer );
			}
			else if( layer.type == "objectgroup" && layer.name == "ground") {
				//object layer
				for( var objIdx=0; objIdx < layer.objects.length; objIdx++ ) {
					var object = layer.objects[objIdx];
					this.groundRects.push(object);
				}
			}
			else if( layer.type == "objectgroup" && layer.name == "wall") {
				//object layer
				for( var objIdx=0; objIdx < layer.objects.length; objIdx++ ) {
					var object = layer.objects[objIdx];
					this.wallRects.push(object);
				}
			}
			else if( layer.type == "objectgroup" && layer.name == "spawn") {
				//object layer
				for( var objIdx=0; objIdx < layer.objects.length; objIdx++ ) {
					var object = layer.objects[objIdx];
					this.spawnPts.push(object);
				}
			}
		}
		this.isLoaded = true;
	}
	
	_tileSetIdxForGid( gid ) {
		if (gid == 0) return 0;

		//find appropriate tile set for given gid
		for( var setIdx = 0; setIdx < this.tileSets.length; setIdx++ ) {
			var set = this.tileSets[setIdx];
			if( set.firstgid > gid || setIdx == (this.tileSets.length - 1)) return setIdx;
		}

		console.warn("TiledMap: couldnt find tilesetIdx for gid " + gid)
		return -1;
	}

	Draw( gfx, offsetX, offsetY, ct ) {
		if(!this.isLoaded) return;
		
		gfx.saveMatrix();
		gfx.translate(offsetX, offsetY);

		var rp = Service.Get("rp");
		for( var layerIdx=0; layerIdx < this.imgLayers.length; layerIdx++ ) {
			var layer = this.data.layers[layerIdx];

			//draw image layer
			var layerImg = rp.getImage(this.path + layer.image);
			if(layerImg) {
				gfx.drawImage(layerImg, layer.x, layer.y);
			}

			if (layer.name == this.playerLayerName && this.fnDrawPlayerLayer) {
				this.fnDrawPlayerLayer();
			} 
		}

		
		for( var layerIdx=0; layerIdx < this.tileLayers.length; layerIdx++ ) {
			var tileLayer = this.tileLayers[layerIdx];
			var width = tileLayer.width;
			var height = tileLayer.height;

			//console.log("draw tile layer " + layerIdx)
			
			for (var h = 0; h < height; h++) {
				var row = (h * width);
				for( var w = 0; w < width; w++) {
					var gid = tileLayer.data[w + row];
					var setIdx = this._tileSetIdxForGid(gid);
					if (gid <= 0) continue;
					var set = this.tileSets[setIdx];
					var localId = gid - set.firstgid;

					var tileW = this.tileSets[setIdx].tilewidth;
					var tileH = this.tileSets[setIdx].tileheight;
					var sprite = this.tileSets[setIdx].sprite;
					sprite.drawFrame(gfx, w * tileW, h * tileH, localId);
				}
			}

			if (tileLayer.name == this.playerLayerName && this.fnDrawPlayerLayer) {
				this.fnDrawPlayerLayer(gfx, 0,0, ct);
			} 
		}
		gfx.restoreMatrix();
		
		if(this.debugShowBoxes) {
			//draw physics boxes
			for( var objIdx=0; objIdx < this.groundRects.length; objIdx++ ) {
					var object = this.groundRects[objIdx];
					gfx.drawRect(offsetX + object.x, offsetY + object.y, object.width, object.height);
			}
			for( var objIdx=0; objIdx < this.wallRects.length; objIdx++ ) {
					var object = this.wallRects[objIdx];
					gfx.drawRect(offsetX + object.x, offsetY + object.y, object.width, object.height);
			}
			//draw spawn points
			for( var objIdx=0; objIdx < this.spawnPts.length; objIdx++ ) {
					var object = this.spawnPts[objIdx];
					gfx.drawRect(offsetX + object.x, offsetY + object.y, object.width, object.height);
			}
		}
	}
	
	/** fuzz pop (side scrolling) + Box code
	AttachPhysics( physics ) {
		if(!this.isLoaded) return;
		if(this.physics != null) {
			console.log("warn: already attached to physics");
			return;
		}
		this.physics = physics;
		for( var objIdx=0; objIdx < this.groundRects.length; objIdx++ ) {
				var object = this.groundRects[objIdx];
				//gfx.drawRect(object.x, object.y, object.width, object.height);
				var stdGroundHeight = 10;
				object.height = stdGroundHeight;
				var body = physics.createStaticBody(object.x, object.y, object.width, object.height);
				body.SetUserData({"objLink":this,"isGround":true, "isWall":false});
				this.physicsBodies.push(body);
		}
		
		for( var objIdx=0; objIdx < this.wallRects.length; objIdx++ ) {
				var object = this.wallRects[objIdx];
				//gfx.drawRect(object.x, object.y, object.width, object.height);
				var body = physics.createStaticBody(object.x, object.y, object.width, object.height);
				body.SetUserData({"objLink":this, "isGround":false, "isWall":true});
				this.physicsBodies.push(body);
		}
	}
	DetatchPhysics() {
		if(!this.physics) return;
		
		for( var objIdx=0; objIdx < this.physicsBodies.length; objIdx++ ) {
			var body = this.physicsBodies[objIdx];
			this.physics.destroyBody(body);
		}
		this.physics = null;
	}
	**/
	
	GetSpawnPoint( idx ) {
		return this.spawnPts[idx];
	}
	GetRandomSpawn() {
		var min = 0;
		var max = this.spawnPts.length - 1;
		var idx = Math.floor(Math.random() * (max - min)) + min;
		return this.spawnPts[idx];
	}
	GetSpawnFurthestFrom( x,y ) {
		var dist = 0;
		var idx = 0;
		for(var i=0; i<this.spawnPts.length; i++) {
			var thisDistEst = Math.abs(this.spawnPts.x - x) + Math.abs(this.spawnPts.y - y);
			if(thisDistEst > dist) idx = i;
		}
		
		return this.spawnPts[idx];
	}

	CreateDrawNode() {
		var self = this;
		var node = new NodeView();
		node.addCustomDraw((gfx, x,y, ct)=>{
			var saveDrawCentered = gfx.drawCentered;
			gfx.drawCentered = false;
			self.Draw(gfx, x, y, ct);
			gfx.drawCentered = saveDrawCentered;
		});
		return node;
	}
 }