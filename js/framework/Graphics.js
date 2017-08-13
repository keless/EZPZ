"use strict"; //ES6
//#include js/framework/Service.js

class Graphics {
	static get ScreenSize() {
		return Service.Get("gfx").getSize();
	}

	constructor( strCanvasName ) {
		this.canvas = document.getElementById(strCanvasName);
		this.fillStyle = "#FF0000";
		this.strokeStyle = "#FFFFFF";
		this.strokeSize = 1;
		this.font = "30px Arial";
		
		this.ctx = this.canvas.getContext("2d");
		this.drawCentered = Config ? Config.areSpritesCentered : false;
		this.useTextHeightHack = Config ? Config.useTextHeightHack : false;
		this.verbose = false;
		
		Service.Add("gfx", this);
	}
	
	getWidth() {
		return this.canvas.clientWidth;
	}
	getHeight() {
		return this.canvas.clientHeight;
	}
	getSize() {
		return new Vec2D(this.getWidth(), this.getHeight());
	}

	setAlpha(alpha) {
		this.ctx.globalAlpha = alpha;
	}
	
	getSmoothing() {
		return this.ctx.imageSmoothingEnabled;
	}
	setSmoothing( on ) {
		this.ctx.imageSmoothingEnabled = on;
	}
	
	begin( bShouldClear ) {
		this.ctx = this.canvas.getContext("2d");
		if(bShouldClear) {
			this.clearAll();
		}
	}
	clearAll() {
		this.ctx.clearRect(0,0, this.getWidth(), this.getHeight());
	}
	
	saveMatrix() {
		this.ctx.save();
	}
	restoreMatrix() {
		this.ctx.restore();
	}
	translate(x,y) {
		this.ctx.translate(x, y);
	}
	rotate(radians, ccw ) {
		if(ccw) radians *= -1;
		this.ctx.rotate(radians);
	}
	scale( scaleVal ) {
		this.ctx.scale( scaleVal, scaleVal );
	}
	
	_setStyle( param, selfParam ) {
		if( param == "" ) return false;
		if( param == undefined ) return selfParam;
		return param;
	}

	///note: origin (0,0) is top left
	drawRect( x,y,w,h ) {
		
		this.ctx.fillStyle = this.fillStyle;
		
		if(this.verbose) console.log("rect at " + x +"," + y + " x " + w+","+h);
		if(this.drawCentered) {
			x -= w/2;
			y -= h/2;
		}
		this.ctx.fillRect(x,y,w,h);
		
	}
	drawRectEx( x,y,w,h, fillStyle ) {
		this.ctx.fillStyle = fillStyle || this.fillStyle;
		
		if(this.verbose) console.log("rect at " + x +"," + y + " x " + w+","+h);
		if(this.drawCentered) {
			x -= w/2;
			y -= h/2;
		}
		this.ctx.fillRect(x,y,w,h);
		
	}
	drawRectOutline( x,y, w,h ) {
		this.ctx.strokeStyle = this.strokeStyle;
		this.ctx.lineWidth = this.strokeSize;
		
		if(this.verbose) console.log("rect at " + x +"," + y + " x " + w+","+h);
		if(this.drawCentered) {
			x -= w/2;
			y -= h/2;
		}
		this.ctx.strokeRect(x,y,w,h);
	}
	drawRectOutlineEx( x,y, w,h, strokeStyle, strokeWidth ) {
		this.ctx.strokeStyle = strokeStyle || this.strokeStyle;
		this.ctx.lineWidth = strokeWidth || this.strokeSize;
		
		if(this.verbose) console.log("rect at " + x +"," + y + " x " + w+","+h);
		if(this.drawCentered) {
			x -= w/2;
			y -= h/2;
		}
		this.ctx.strokeRect(x,y,w,h);
	}
	drawPolygonEx(verts, fillStyle, strokeStyle, strokeSize) {
		var fs = this._setStyle(fillStyle, this.fillStyle);
		var ss = this._setStyle(strokeStyle , this.strokeStyle);
		this.ctx.fillStyle = fs;
		this.ctx.strokeStyle = ss;
		this.ctx.lineWidth = strokeSize || this.strokeSize;
		
		this.ctx.beginPath();
		var vert = verts[0];
		this.ctx.moveTo(vert.x, vert.y);
		for( var i=1; i<verts.length; i++) {
			this.ctx.lineTo(verts[i].x, verts[i].y);
		}
		
		this.ctx.closePath();
		if(fs) { this.ctx.fill(); }
		if(ss) { this.ctx.stroke(); }
	}
	// same as drawPolygonEx but expects an array of arrays (eg [[x1,y1],[x2,y2],...])
	drawPolygonArrayEx(verts, fillStyle, strokeStyle, strokeSize) {
		var fs = this._setStyle(fillStyle, this.fillStyle);
		var ss = this._setStyle(strokeStyle , this.strokeStyle);
		this.ctx.fillStyle = fs;
		this.ctx.strokeStyle = ss;
		this.ctx.lineWidth = strokeSize || this.strokeSize;
		
		this.ctx.beginPath();
		var vert = verts[0];
		this.ctx.moveTo(vert[0], vert[1]);
		for( var i=1; i<verts.length; i++) {
			this.ctx.lineTo(verts[i][0], verts[i][1]);
		}
		
		this.ctx.closePath();
		if(fs) { this.ctx.fill(); }
		if(ss) { this.ctx.stroke(); }
	}
	drawCubicBezierEx(verts, fillStyle, strokeStyle, strokeSize) {
		var fs = this._setStyle(fillStyle, this.fillStyle);
		var ss = this._setStyle(strokeStyle , this.strokeStyle);
		this.ctx.fillStyle = fs;
		this.ctx.strokeStyle = ss;
		this.ctx.lineWidth = strokeSize || this.strokeSize;
		
		if(verts.length != 4) {
			console.warn("Graphics.drawCubicBezierEx() - invalid number of verts, must be 4");
			return;
		}
		
		this.ctx.beginPath();
		this.ctx.moveTo(verts[0].x, verts[0].y);
		this.ctx.bezierCurveTo(verts[1].x, verts[1].y, verts[2].x, verts[2].y, verts[3].x, verts[3].y);
		this.ctx.closePath();
		if(fs) { this.ctx.fill(); }
		if(ss) { this.ctx.stroke(); }
	}
	drawLine(x1,y1, x2,y2) {
		this.ctx.strokeStyle = this.strokeStyle;
		this.ctx.lineWidth = this.strokeSize;
		
		this.ctx.beginPath();
		this.ctx.moveTo(x1,y1);
		this.ctx.lineTo(x2,y2);
		this.ctx.stroke();
		this.ctx.closePath();
		if(this.verbose) console.log("line at " + x1 +"," + y1 + " x " + x2+","+y2); 
	}
	drawLineEx(x1,y1, x2,y2, strokeStyle, strokeSize) {
		this.ctx.strokeStyle = strokeStyle || this.strokeStyle;
		this.ctx.lineWidth = strokeSize || this.strokeSize;
		
		this.ctx.beginPath();
		this.ctx.moveTo(x1,y1);
		this.ctx.lineTo(x2,y2);
		this.ctx.stroke();
		this.ctx.closePath();
		if(this.verbose) console.log("line at " + x1 +"," + y1 + " x " + x2+","+y2); 
	}
	drawCircle(x1,y1, radius) {
		//set state
		var fs = this.fillStyle;
		var ss = this.strokeStyle;
		this.ctx.fillStyle = fs;
		this.ctx.strokeStyle = ss;
		this.ctx.lineWidth = this.strokeSize;
		
		//draw
		this.ctx.beginPath();
		this.ctx.arc(x1, y1, radius, 0, 2 * Math.PI, false); //false=clockwise
		this.ctx.closePath();
		if(fs) { this.ctx.fill(); }
		if(ss) { this.ctx.stroke(); }
		
		if(this.verbose) console.log("circle at " + x1 +"," + y1 + " x " + radius);
	}
	drawCircleEx(x1,y1, radius, fillStyle, strokeStyle, strokeSize) {
		//set state
		var fs = this._setStyle(fillStyle, this.fillStyle);
		var ss = this._setStyle(strokeStyle , this.strokeStyle);
		this.ctx.fillStyle = fs;
		this.ctx.strokeStyle = ss;
		this.ctx.lineWidth = strokeSize || this.strokeSize;
		
		//draw
		this.ctx.beginPath();
		this.ctx.arc(x1, y1, radius, 0, 2 * Math.PI, false); //false=clockwise
		this.ctx.closePath();
		if(fs) { this.ctx.fill(); }
		if(ss) { this.ctx.stroke(); }
	}
	drawText(strText, x,y ) {
		this.ctx.font = this.font;
		this.ctx.fillStyle = this.fillStyle;
		if(this.drawCentered) {
			var sized = this.ctx.measureText(strText);
			x -= sized.width/2;
			if (this.useTextHeightHack) {
				sized = this.ctx.measureText('M'); //should rotate this
				y += sized.width/2;
			}
		}
		this.ctx.fillText(strText,x,y);
	}
	drawTextEx(strText, x,y, font, fillStyle, multiLine ) {
		var fs = this._setStyle(fillStyle, this.fillStyle);
		this.ctx.font = font || this.font;
		this.ctx.fillStyle = fs;
		
		if(!multiLine) {
			if(this.drawCentered) {
				var sized = this.ctx.measureText(strText);
				x -= sized.width/2;
				if (this.useTextHeightHack) {
					sized = this.ctx.measureText('M'); //should rotate this
					y += sized.width/2;
				}
			}
			this.ctx.fillText(strText,x,y);
		}else {
			var lines = strText.split('\n');
			var h = this.ctx.measureText('m').width * 1.5;
			for( var line of lines) {
				var lx = x;
				if(this.drawCentered) {
					var lineWidth = this.ctx.measureText(line).width;
					lx -= lineWidth/2;
				}
				this.ctx.fillText(line, lx, y);
				y += h;
			}
		}
	}
	drawTextOutline(strText, x, y, font, strokeStyle, strokeSize, multiLine) {
		this.ctx.font = font || this.font;
		var ss = this._setStyle(strokeStyle , this.strokeStyle);
		this.ctx.strokeStyle = ss;
		this.ctx.lineWidth = strokeSize || this.strokeSize;
		
		if(!multiLine) {
			if(this.drawCentered) {
				var sized = this.ctx.measureText(strText);
				x -= sized.width/2;
				if (this.useTextHeightHack) {
					sized = this.ctx.measureText('M'); //should rotate this
					y += sized.width/2;
				}
			}
			this.ctx.strokeText(strText,x,y);
		}else {
			var lines = strText.split('\n');
			var h = this.ctx.measureText('m').width * 1.5;
			for( var line of lines) {
				var lx = x;
				if(this.drawCentered) {
					var lineWidth = this.ctx.measureText(line).width;
					lx -= lineWidth/2;
				}
				this.ctx.strokeText(line, lx, y);
				y += h;
			}
		}
	}
	getTextSize(text, font, multiLine) {
		this.ctx.font = font || this.font;
		
		var numLines = 0;
		var w = 0;
		if( multiLine ) {
			var lines = text.split('\n');
			for( var line of lines) {
				var lineWidth = this.ctx.measureText(line).width;
				if( lineWidth > w ) w = lineWidth;
				numLines++;
			}
		}else {
			numLines = 1;
			w = this.ctx.measureText(text).width;
		}
		
		// fake it 'til you make it
		var h = this.ctx.measureText("m").width * numLines * 1.5;
		return new Vec2D(w, h);
	}
	drawImage(img, x,y) {
		if(this.drawCentered) {
			x -= img.width/2;
			y -= img.height/2;
		}
		this.ctx.drawImage(img, x,y);
	}
	drawImageEx(img, x,y, w,h, hFlip) {
		if(!hFlip) {
			this.ctx.drawImage(img, 0,0,img.width,img.height, x,y, w,h);
		}else {
			this.ctx.save();
			this.ctx.scale(-1,1);			
			this.ctx.drawImage(img, 0,0,img.width,img.height, (x*-1) - img.width ,y, w,h);
			this.ctx.restore();
			//todo: reset scale 1,1 instead of save/restore
		}
	}
	/// dx,dy are destination (on screen) coordinates
	/// srcx,srcy are source image (in texture) coordinates
	/// srcw,srch are source image width and height to capture
	/// this function forces 1:1 scale of source w,h to dest w,h
	drawImageSub(img, dx,dy,  srcx, srcy, srcw, srch, hFlip) {
		
		if(this.drawCentered) {
			dx -= srcw/2;
			dy -= srch/2;
		}
		if(!hFlip) {
			this.ctx.drawImage(img, srcx,srcy,srcw,srch, dx,dy, srcw,srch);
		}else {
			this.ctx.save();
			this.ctx.scale(-1,1);			
			this.ctx.drawImage(img, srcx,srcy,srcw,srch, (dx*-1) - srcw ,dy, srcw,srch);
			this.ctx.restore();
			//todo: reset scale 1,1 instead of save/restore
		}
	}
	
	drawImageTiled(img, x,y, w,h, scale) {
		if(this.drawCentered) {
			x -= w/2;
			y -= h/2;
		}
		
		scale = scale || 1.0;
		var tileW = img.width * scale;
		var tileH = img.height * scale;
		var numTilesW = w / tileW;
		var numTilesH = h / tileH;
		
		for(var ty=0; ty<numTilesH; ty++) {
			for(var tx=0; tx<numTilesW; tx++) {
				this.ctx.drawImage(img, x + tx*tileW,y + ty*tileH, tileW, tileH);
			}
		}
	}
}

/**
 * Sprite class represents a series of frames inside of an atlas texture
 * @image - texture atlas image to use as source image for drawing frames
 * @format - "xywh" for individual rect information per frame, or "grid" for equally spaced grid of frames
 * @width - sprite width (note: in "xywh" format, individual frames are not guaranteed to have the same width)
 * @width - sprite width (note: in "xywh" format, individual frames are not guaranteed to have the same height)
 * @paddingX - optional; space between source edges and interior size
 * @paddingY - optional; space between source edges and interior size
 * @frames - if format is "xywh"; contains all the frame rectangles as an array of arrays
 *  data = {"image":"imageName.png", "format":"xywh", "width":96, "height":96, "frames":[  [x,y,w,h],[x,y,w,h],[x,y,w,h],[x,y,w,h] ]}
 *  data = {"image":"derpy.png", "format":"grid", "width":96, "height":96, "paddingX":5, "paddingY":5 }
 */
class Sprite {
	constructor( path ) {
		this.fullPath = path;
		this.path = path.substring(0, path.lastIndexOf("/")+1);
		this.img = null;
		this.data = null;
		this.isLoaded = false;
	}
	
	//called by ResourceProvider
	_load( dataJson, fnOnLoad ) {
		var resourceProvider = Service.Get("rp");
		this.data = dataJson;
		this.format = dataJson["format"] || "xywh";
		
		var self = this;
		var path = this.path + dataJson["image"];
		this.img = resourceProvider.getImage(path, function(e){
			if(!self.isLoaded) {
				self.img = e.res;
				self.isLoaded = true; //deferred load
				if(self.verbose) console.log("sprite loaded late: " + path);
				if(fnOnLoad) fnOnLoad();
			}
		});
		if(this.img) {
			this.isLoaded = this.img.isLoaded; //check for immediate load
			if(this.verbose) console.log("sprite loaded immediately: " + path)
			if(this.isLoaded && fnOnLoad) fnOnLoad();
		}
	}
	
	getWidth() {
		return this.data.width - this.getPaddingX()*2;
	}
	getHeight() { 
		return this.data.height - this.getPaddingY()*2;
	}
	getPaddingX() {
		return this.data.paddingX || 0;
	}
	getPaddingY() {
		return this.data.paddingY || 0;
	}
	getFPS() {
		return this.data.fps || 30;
	}
	getNumFrames() {
		if( this.format == "xywh" || this.format == "gridSub" ) {
			return this.data.frames.length;
		}
		else if( this.format == "grid" ) {
			var frameW = this.data.width;
			var frameH = this.data.height;
			var texW = this.img.width;
			var framesPerRow = Math.floor(texW / frameW);
			var numRows = Math.floor(this.img.height / frameH);
			return numRows * framesPerRow;
		}
		return 0;
	}
	
	drawFrame( gfx, x, y, frameIdx, hFlip ) {
		if( this.format == "xywh") {
			var frameData = this.data.frames[frameIdx];
			gfx.drawImageSub( this.img, x - this.getPaddingX(), y - this.getPaddingY(),  frameData[0], frameData[1], frameData[2], frameData[3], hFlip);
		}
		else if( this.format == "grid" || this.format == "gridSub") {
			
			if (frameIdx < 0 || frameIdx > this.data.frames.length) {
				console.error("frameIdx OOB")
			}

			if(this.format == "gridSub") {
				//get sub-grid indexed frames
				frameIdx = this.data.frames[frameIdx];
			}
			
			var frameW = this.data.width;
			var frameH = this.data.height;
			var texW = this.img.width;
			var framesPerRow = Math.floor(texW / frameW);
			var row = frameIdx % framesPerRow;
			var col = (frameIdx - row) / framesPerRow;
			gfx.drawImageSub(this.img, x - this.getPaddingX(), y - this.getPaddingY(), row*frameW, col*frameH, frameW, frameH, hFlip);
		}

	}
}


class SpriteBatch {
	constructor(name) {
		this.name = name;
		this.extension = ".sprite";
		this.data = {};
		this.isLoaded = false;
	}

	LoadFromJson( dataJson, fnOnLoad ) {
		this.data = dataJson;

		for(var spriteName in this.data.sprites) {
			this._loadSprite(spriteName);
		}

		this.isLoaded = true;

		//this is hacky, should wait till sprites' onloads are finished
		fnOnLoad();
	}

	_loadSprite( spriteName ) {
		var spriteJson = this.data.sprites[spriteName];
		if(!spriteJson) {
			console.error("sprite batch could not find sprite - " + spriteName);
			return null;
		}

		// populate default values into spriteJson
		for(var key in this.data.default) {
			if(!spriteJson.hasOwnProperty(key)) {
				spriteJson[key] = this.data.default[key];
			}
		}

		//console.log("sb: load sprite with json " + JSON.stringify(spriteJson))

		var fileName = spriteName + this.extension;
		var sprite = new Sprite(fileName);

		// stick the sprite into RP and no one is the wiser.. kekeke
		var RP = Service.Get("rp");
		RP.sprites[fileName] = sprite;

		sprite._load(spriteJson, ()=>{
			RP._didLoad(fileName, RP.sprites[fileName]);
		});

		//console.log("sb: add sprite from spriteBatch - " + fileName)
	}
}