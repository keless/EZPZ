"use strict"; //ES6
//#include js/framework/Graphics.js

//scene node heirarchy of sprites/animations

class NodeView extends BaseListener {
	constructor() {
		super();

		this.serializable = Config ? (Config.canSerializeNodeViews || false) : false;
		this.pos = new Vec2D();
		this.size = new Vec2D();
		this.rotation = 0;
		this.scale = 1;
    	this._visible = true;

		this.pUser = null;

		this.children = [];
		this.parent = null;
		
		this.actions = [];

		this.fnCustomDraw = [];
		
		this.alpha = 1.0;
		this.pixelated = false;

		this.fnOnClick = null;
		this.isDraggable = false;
		this.onClickCallChildren = true;
		this.onClickEatClicks = true;

		if (this.serializable) {
			this.serializeData = []
		}
	}
	
	toJson( ignoreChildren ) {
		if (!this.serializable) {
			console.error("NodeView - trying to serialize NodeView when seralizable == false")
			return {}
		}

		ignoreChildren = ignoreChildren || false

		var json = {}
		json.classType = "NodeView"
		json.pos = this.pos.toJson()
		json.size = this.size.toJson()
		if (this.rotation != 0) {
			json.rotation = this.rotation
		}
		if (this.scale != 1) {
			json.scale = this.scale
		}
		if (this._visible != true) {
			json.visible = this._visible
		}
		if (this.alpha != 1.0) {
			json.alpha = this.alpha
		}
		if (this.pixelated != false) {
			json.pixelated = this.pixelated
		}
		if (this.isDraggable != false) {
			json.drag = this.isDraggable
		}
		if (this.onClickCallChildren != true) {
			json.clickChildren = this.onClickCallChildren
		}
		if (this.onClickEatClicks != true) {
			json.eatClicks = this.onClickEatClicks
		}

		if (this.pUser != null) {
			console.warn("NodeView.toJson() - cant serialize pUser")
		}
		if (this.fnOnClick != null) {
			console.warn("NodeView.toJson() - cant serialize fnOnClick")
		}

		if (this.actions.length > 0) {
			console.warn("NodeView.toJson() - cant serialize actions.. yet")
		}

		json.serializeData = this.serializeData

		if (this.children.length > 0 && !ignoreChildren) {
			var children = []
			for (var child of this.children) {
				children.push(child.toJson())
			}
			json.children = children
		}
		
		return json
	}
	loadJson(json) {
		// loadJson is called as super from sub-classes, so suppress this warning
		//if (json.classType != "NodeView") {
		//	console.warn("NodeView.loadJson - loading json that is not of classType NodeView!")
		//}

		this._sterilize()
		
		this.pos = new Vec2D(json.pos.x, json.pos.y)
		this.size = new Vec2D(json.size.x, json.size.y)
		this.rotation = json.rotation || 0
		this.scale = json.scale || 1
		this._visible = json.visible || true
		this.alpha = json.alpha || 1.0
		this.pixelated = json.pixelated || false
		this.isDraggable = json.drag || false
		this.onClickCallChildren = json.clickChildren || true
		this.onClickEatClicks = json.eatClicks || true

		this._loadSerializeData(json.serializeData || [])
		this._loadChildrenJson(json.children || [])
	}
	_sterilize() {
		this.children.length = 0
		this.fnCustomDraw.length = 0
		this.actions.length = 0

		if (this.serializable) {
			this.serializeData = []
		}

		delete this.circleRadius
		delete this.image
		delete this.sprite
		delete this.spriteFrame
		delete this.hFlip
		delete this.labelMultiLine
		delete this.labelText
		delete this.labelStyle
		delete this.labelFont
		delete this.labelOutlineSize
		delete this.labelOutlineStyle
		delete this.textInput
	}
	_loadSerializeData(jsonArr) {
		for(var data of jsonArr) {
			switch(data.call) {
				case "setCircle": this.setCircle(data.radius, data.fillStyle, data.strokeStyle); break;
				case "setRect": this.setRect(data.w, data.h, data.fillStyle); break;
				case "setPolygon": this.setPolygon(data.arrVerts, data.fill, data.stroke, data.strokeSize); break;
				case "setImage": this.setImage(data.image); break;
				case "setImageStretch": this.setImageStretch(data.image, data.x, data.y, data.w, data.h); break;
				case "setSprite": this.setSprite(data.sprite); break;
				case "setLabel": this.setLabel(data.labelText, data.labelFont, data.labelStyle, data.multiLine); break;
				case "setLabelWithOutline": this.setLabelWithOutline(data.labelText, data.labelFont, data.labelStyle, data.outlineStyle, data.size, data.multiLine); break;
				case "setTextInput": this.setTextInput(data.w, data.h); break;
			}
		}
	}
	_loadChildrenJson(jsonArr) {
		this.children.length = 0
		for(var data of jsonArr) {
			var child = null
			switch(data.classType) {
				case "NodeView":
					child = new NodeView();
				break;
				case "ButtonView":
					child = new ButtonView(data.btnID, data.sprite, data.label, data.labelFont, data.labelStyle);
				break;
				case "MenuView":
					child = new MenuView(data.options, data.w, data.h);
				break;
				case "TableView":
					child = new TableView(data.w, data.h, data.sizeToFit);
				break;
				default:
					console.warn("NodeView _loadChildrenJson unknown classType " + data.classType)
					continue; //skip this child
				break;
			}
			child.loadJson(data)
			this.addChild(child)
		}
	}

	Destroy() {
    
    if(this.textInput) {
      this.textInput.destroy();
    }
    
		//override me to clean up
		for(var child of this.children) {
			child.Destroy();
		}
		
		super.Destroy();
	}
  
  get visible() {
    return this._visible;
  }
  set visible(val) {
    this._visible = val;
    if(this.textInput) {
      this.textInput.enabled = val;
    }
  }
	
	getParent() {
		return this.parent
	}
	getChildIdx( child ) {
		for (var i=0; i<this.children.length; i++) {
			if (this.children[i] == child) return i
		}
		return -1
	}
	getChildByIdx(idx) {
		if (idx < 0 || idx >= this.children.length) {
			return null
		} 
		return this.children[idx]
	}
	getNumChildren() {
		return this.children.length
	}
	get worldRotation() {
		if(this.parent) {
			return this.parent.worldRotation + this.rotation;
		}
		return this.rotation;
	}
	get worldPosition() {
		return this.worldTransform.pos
	}
	// return { scale:f, rot:radian, pos:vec2d }
	get worldTransform() {
		var transform = { scale:this.scale, rot:this.rotation, pos:this.pos.clone() }
		if (this.parent) {
			// TODO: apply scale/rot to local pos before adding
			var pTransform = this.parent.worldTransform
			transform.scale += pTransform.scale
			transform.rot += pTransform.rot
			transform.pos.addVec( pTransform.pos )
		}
		return transform
	}
	
	setUserData( data ) {
		this.pUser = data;
	}
	getUserData() {
		return this.pUser;
	}
	
	setCircle( radius, fillStyle, strokeStyle ) {
		if (this.serializable) {
			this.serializeData.push({"call":"setCircle", "radius":radius, "fillStyle":fillStyle, "strokeStyle":strokeStyle })
		}

		if(this.circleRadius) {
			console.error("NodeView: already has a circle, abort!");
			return;
		}
		this.circleRadius = radius;
		var self = this;
		this.fnCustomDraw.push(function(gfx, x,y, ct){
			if(self.alpha != 1.0) gfx.setAlpha(self.alpha);
			gfx.drawCircleEx(x, y, self.circleRadius, fillStyle, strokeStyle);
			if(self.alpha != 1.0) gfx.setAlpha(1.0);
		});
	}
	setRect( w, h, fillStyle ) {
		if (this.serializable) {
			this.serializeData.push({"call":"setRect", "w":w, "h":h, "fillStyle":fillStyle})
		}
		this.size.setVal( Math.max(this.size.x, w), Math.max(this.size.y, h));
		var self = this;
		this.fnCustomDraw.push(function(gfx, x,y, ct){
			if(self.alpha != 1.0) gfx.setAlpha(self.alpha);
			gfx.drawRectEx(x, y, self.size.x, self.size.y, fillStyle);
			if(self.alpha != 1.0) gfx.setAlpha(1.0);
		});
	}
	// arrVerts is an array of Vec2Ds
	setPolygon( arrVerts, fill, stroke, strokeSize ) {
		if (this.serializable) {
			this.serializeData.push({"call":"setPolygon", "arrVerts":arrVerts, "fill":fill, "stroke":stroke, "strokeSize":strokeSize})
		}
		var self = this;
		this.fnCustomDraw.push(function(gfx,x,y,ct) {
			if(self.alpha != 1.0) gfx.setAlpha(self.alpha);
			gfx.drawPolygonEx(arrVerts, fill, stroke, strokeSize );
			if(self.alpha != 1.0) gfx.setAlpha(1.0);
		});
	}
	setImage( image ) {
		if (this.serializable) {
			if (isString(image)) {
				this.serializeData.push({"call":"setImage", "image":image})
			}else {
				console.warn("NodeView - cannot serialize setImage with non-string image parameter")
			}
		}
		if( isString(image) ) {
			var RP = Service.Get("rp");
			image = RP.getImage(image); //load image url into image resource
		}
		
		if(this.image) {
			console.error("NodeView: already has an image, abort!");
			return;
		}
		this.image = image;
		this.size.setVal( Math.max(this.size.x, image.width), Math.max(this.size.y, image.height));
		
		var self = this;
		this.fnCustomDraw.push(function(gfx, x,y, ct){
			if(self.alpha != 1.0) gfx.setAlpha(self.alpha);
			gfx.drawImage(self.image, x, y);
			if(self.alpha != 1.0) gfx.setAlpha(1.0);
		});
	}
	setImageStretch( image, x,y, w,h ) {
		if (this.serializable) {
			if (isString(image)) {
				this.serializeData.push({"call":"setImageStretch", "image":image, "x":x,"y":y, "w":w,"h":h})
			}else {
				console.warn("NodeView - cannot serialize setImageStretch with non-string image parameter")
			}
		}
		if( isString(image) ) {
			var RP = Service.Get("rp");
			image = RP.getImage(image); //load image url into image resource
		}
		
		if(this.image) {
			console.error("NodeView: already has an image, abort!");
			return;
		}
		this.image = image;
		this.size.setVal( Math.max(this.size.x, image.width), Math.max(this.size.y, image.height));
		
		var self = this;
		this.fnCustomDraw.push(function(gfx, x,y, ct){
			if(self.alpha != 1.0) gfx.setAlpha(self.alpha);
			gfx.drawImageEx(self.image, x, y, w, h);
			if(self.alpha != 1.0) gfx.setAlpha(1.0);
		});
	}
	setSprite( sprite, spriteFrame, hFlip ) {		
		if (this.serializable) {
			if (isString(sprite)) {
				this.serializeData.push({"call":"setSprite", "sprite":sprite, "spriteFrame":spriteFrame, "hFlip":hFlip})
			}else {
				console.warn("NodeView - cannot serialize setSprite with non-string image parameter")
			}
		}

		hFlip = hFlip || false;
		
		if( isString(sprite) ) {
			var RP = Service.Get("rp");
			sprite = RP.getSprite(sprite); //load sprite url into sprite resource
		}
		if (!sprite) {
			return;
		}
		
		if(this.sprite) {
			console.error("NodeView: already has a sprite, abort!");
			return;
		}
		this.sprite = sprite;
		this.spriteFrame = spriteFrame;
		this.hFlip = hFlip;
		this.size.setVal( Math.max(this.size.x, sprite.getWidth()), Math.max(this.size.y, sprite.getHeight()));
		var self = this;
		this.fnCustomDraw.push(function(gfx, x,y, ct){
			if(self.alpha != 1.0) gfx.setAlpha(self.alpha);
			self.sprite.drawFrame(gfx, x, y, Math.floor(self.spriteFrame), self.hFlip);
			if(self.alpha != 1.0) gfx.setAlpha(1.0);
		});
	}
	setSpriteLoop(sprite, hFlip) {
		this.setSprite(sprite, 0, hFlip)
		var numFrames = this.sprite.getNumFrames()
		var dt = this.sprite.getFPS() / numFrames

		var self = this
		var fnLoop = function() {
			self.spriteFrame = 0
			self.setTween("spriteFrame", dt, numFrames -1, fnLoop)
		}
		fnLoop()
	}
	setAnim( anim ) {
		if (this.serializable) {
			console.warn("NodeView - cannot serialize setAnim")
		}
		if(this.animInstance) {
			console.error("NodeView: already has an anim, abort!");
			return;			
		}
		this.animInstance = anim.CreateInstance();
		var self = this;
		this.fnCustomDraw.push(function(gfx, x,y, ct){
			if(self.alpha != 1.0) gfx.setAlpha(self.alpha);
			self.animInstance.Update(ct);
			self.animInstance.Draw(gfx, x, y, self.hFlip);
			if(self.alpha != 1.0) gfx.setAlpha(1.0);
		});

		//thin wrappers for AnimationInstance
		this.animEvent = function(ct, evt) {
			this.animInstance.event(ct, evt);
		}
		this.startAnim = function(ct, animState) {
			this.animInstance.startAnim(ct, animState);
		}
		this.setDirection = function (ct, iDirIndex) {
			this.animInstance.setDirection(ct, iDirIndex);
		}
	}
	animEvent(ct, evt) {
		if(this.animInstance) {
			this.animInstance.event(ct, evt);
		}
	}
	setLabel( labelText, labelFont, labelStyle, multiLine ) {
		if (this.serializable) {
			this.serializeData.push({"call":"setLabel", "labelText":labelText, "labelFont":labelFont, "labelStyle":labelStyle, "multiLine":multiLine})
		}
		if(labelText == undefined || labelText == null) return;
		if(this.labelText) {
			console.error("NodeView: already has a label, abort!");
			return;	
		}
		this.labelMultiLine = multiLine || false;
		this.labelText = labelText.toString();
		this.labelFont = labelFont;
		this.labelStyle = labelStyle;
		var gfx = Service.Get("gfx");
		var textSize = gfx.getTextSize(this.labelText, this.labelFont, this.labelMultiLine);
		//textSize.y *= 1.5; //add click padding
		this.size.setVal( Math.max(this.size.x, textSize.x), Math.max(this.size.y, textSize.y));
		var self = this;
		this.fnCustomDraw.push(function(gfx, x,y, ct){
			gfx.drawTextEx(self.labelText, x, y, self.labelFont, self.labelStyle, self.labelMultiLine);
		});
	}
	setLabelWithOutline( labelText, labelFont, labelStyle, outlineStyle, size, multiLine ) {
		if (this.serializable) {
			this.serializeData.push({"call":"setLabelWithOutline", "labelText":labelText, "labelFont":labelFont, "labelStyle":labelStyle, "outlineStyle":outlineStyle, "size":size, "multiLine":multiLine})
		}
		if(labelText == undefined || labelText == null) return;
		if(this.labelText) {
			console.error("NodeView: already has a label, abort!");
			return;	
		}
		this.labelMultiLine = multiLine || false;
		this.labelText = labelText.toString();
		this.labelFont = labelFont;
		this.labelStyle = labelStyle || "#FFFFFF";
		this.labelOutlineStyle = outlineStyle || "#000000";
		this.labelOutlineSize = size || 2;

		var gfx = Service.Get("gfx");
		var textSize = gfx.getTextSize(this.labelText, this.labelFont, this.labelMultiLine);
		this.size.setVal( Math.max(this.size.x, textSize.x), Math.max(this.size.y, textSize.y));


		var self = this;
		this.fnCustomDraw.push(function(gfx, x,y, ct){
			gfx.drawTextOutline(self.labelText, x, y, self.labelFont, self.labelOutlineStyle, self.labelOutlineSize, self.labelMultiLine);
		});

		this.fnCustomDraw.push(function(gfx, x,y, ct){
			gfx.drawTextEx(self.labelText, x, y, self.labelFont, self.labelStyle, self.labelMultiLine);
		});
	}
	updateLabel( labelText ) {
		if( !isString(this.labelText) ) {
			console.error("NodeView: cant update label, dont have one!");
			return;	
		}
		this.labelText = labelText.toString();
	}
	updateLabelStyle( style ) {
		this.labelStyle = style;
	}
  
  	setTextInput( w, h ) {
		if (this.serializable) {
			this.serializeData.push({"call":"setTextInput", "w":w, "h":h})
		}

		if(this.textInput) {
			console.error("NodeView: already has a text input, abort!");
			return;	
		}
		
		var margin = 2;
		var gfx = Service.Get("gfx");
		this.textInput = new CanvasInput({ 
			canvas:gfx.canvas,
			width:w - margin, 
			height:h - margin, 
			padding:0, 
			borderRadius:margin,
			boxShadow: '1px 1px 0px #fff',
			innerShadow: '0px 0px 2px rgba(0, 0, 0, 0.5)'
			});
		this.textInput.vecPos = this.pos;
			
		this.size.setVal( Math.max(this.size.x, w), Math.max(this.size.y, h));
		var self = this;
		this.textInput.onsubmit( function(e, canvasInput) {
			EventBus.ui.dispatch({evtName:"textInputSubmitted", value:canvasInput.value(), node:self });
		});
		this.fnCustomDraw.push(function(gfx, x,y, ct){
			self.textInput.renderNow(x, y);
		});
	}
	getTextInputValue() {
		if( this.textInput ) {
		return this.textInput.value();
		}
		return null;
	}
	setTextInputValue( text ) {
		if( this.textInput ) {
			this.textInput.value(text);
		}
	}
	clearTextInputValue() {
		if( this.textInput ) {
			this.textInput.value('');
		}
	}

	setProgressVal(val) {
		this.progress = val
	}
	setProgressBar(w, h, solidFill, progressFill) {
		if (this.serializable) {
			this.serializeData.push({"call":"setProgressBar", "w":w, "h":h, "solidFill":solidFill, "progressFill":progressFill})
		}

		this.progress = 0.5

		this.size.setVal( Math.max(this.size.x, w), Math.max(this.size.y, h));
		var self = this;
		this.fnCustomDraw.push(function(gfx, x,y, ct){
			if(self.alpha != 1.0) gfx.setAlpha(self.alpha);
			gfx.drawRectEx(x, y, self.size.x, self.size.y, solidFill);
			var w = self.size.x
			var width = self.progress * (w-2);
			//gfx.drawRectEx(x - (w/2) + (width/2) + 1, y, width, h-2, color);
			gfx.drawRectEx(Math.floor(x - (w/2) + (width/2) + 1), y, Math.floor(self.size.x * self.progress), self.size.y, progressFill);
			if(self.alpha != 1.0) gfx.setAlpha(1.0);
		});

	}
  
	///fn(gfx, x,y, ct)
	addCustomDraw( fn ) {
		if (this.serializable) {
			console.warn("NodeView - cannot serialize addCustomDraw")
		}

		this.fnCustomDraw.push(fn);
	}
	
	setClick( fn, shouldEatClicks, shouldCallChildren ) {
		this.onClickEatClicks = shouldEatClicks || true;
		this.onClickCallChildren = shouldCallChildren || true;
		this.fnOnClick = fn;
	}
	eatClicks() {
		if(!this.fnOnClick) {
			this.setClick(function(e, x,y) {
				e.isDone = true;
				return;
			}, true);
		}
	}

	// rectBounds - a Rec2D that represents the area the node can be dragged inside of
	makeDraggable( rectBounds ) {
		this.isDraggable = true;
		this.dragStart = new Vec2D();
		if(rectBounds) {
			this.dragBounds = rectBounds.clone();
		}else {
			this.dragBounds = null;
		}
	}
	
	//x,y should be sent relative to node origin
	OnMouseDown(e, x,y) {
    if(!this.visible || e.isDone) return;
		
		//make local to self origin
		x -= this.pos.x;
		y -= this.pos.y;
		//rotate
		if(this.rotation != 0) {
			var v = new Vec2D(x,y);
			v.rotate(-this.rotation);
			x = v.x;
			y = v.y;
		}

		if( this.onClickCallChildren ) {
			//call children in reverse order (visible-front to visible-back)
			for(var i=this.children.length-1; i>=0; i--) {
				var child = this.children[i];
				child.OnMouseDown(e, x, y);
				if(e.isDone) return;
			}
		}

		var originX = -this.size.x/2;
		var originY = -this.size.y/2;
		if( this.fnOnClick ) {

			if(Rect2D.isPointInArea(x, y, originX, originY, this.size.x, this.size.y)) {
				if(this.fnOnClick) { 
					this.fnOnClick(e, x, y);
					if (this.onClickEatClicks) {
						e.isDone = true;
					}
				 }
				if(e.isDone) return;
			}
		}

		if(this.isDraggable) {
			if(!this.isDragging && Rect2D.isPointInArea(x, y, originX, originY, this.size.x, this.size.y)) {
				this._startDragging();
				e.isDone = true;
				if(e.isDone) return;
			}
		}
	}

	_startDragging() {
		this.isDragging = true;
		var app = Service.Get("app");
		this.dragStart.setVec(app.lastMousePos);
		this.SetListener("onMouseMove", this._handleDragging);
		this.SetListener("onMouseUp", this._stopDragging);
	}

	_handleDragging(e) {
		var delta = this.dragStart.getVecSub(e.mousePos);
		delta.scalarMult(-1);
		this.dragStart.setVec(e.mousePos);
		this.pos.addVec(delta); //todo: negative?
		if(this.dragBounds) {
			this.dragBounds.confineVec(this.pos);
		}
	}

	_stopDragging(e) {
		this.isDragging = false;
		this.RemoveListener("onMouseMove", this._handleDragging);
		this.RemoveListener("onMouseUp", this._stopDragging);
	}
  
  OnKeyDown(e, x,y) {
    if(!this.visible) return;
    
		//make local to self origin
		x -= this.pos.x;
		y -= this.pos.y;
		//rotate
		if(this.rotation != 0) {
			var v = new Vec2D(x,y);
			v.rotate(-this.rotation);
			x = v.x;
			y = v.y;
		}
    
    if(this.textInput) {
      this.textInput.keydown(e, this.textInput);
    }
    
    for(var child of this.children) {
      child.OnKeyDown(e, x, y);
      if(e.isDone) return;
    }
  }
  OnKeyUp(e, x,y) {
    if(!this.visible) return;
    
		//make local to self origin
		x -= this.pos.x;
		y -= this.pos.y;
		//rotate
		if(this.rotation != 0) {
			var v = new Vec2D(x,y);
			v.rotate(-this.rotation);
			x = v.x;
			y = v.y;
		}
    
    if(this.textInput) {
      this.textInput.onkeyup(e, this.textInput);
    }
    
    for(var child of this.children) {
      child.OnKeyUp(e, x, y);
      if(e.isDone) return;
    }
  }
	
	getWidth() {
		return this.size.x;
	}
	getHeight() {
		return this.size.y;
	}
	
	//node heirarchy functions
	addChild( child ) {
		child.removeFromParent();
		
		this.children.push(child);
		child.parent = this;
	}
	addChildKeepingWorldPos( child ) {
		var cwp = child.worldPosition
		var nwp = this.worldPosition
		var delta = cwp.getVecSub(nwp)
		child.pos.setVec(delta)
		this.addChild(child)
	}
	removeFromParent(shouldDestroy) {
		shouldDestroy = shouldDestroy || false;
		if(!this.parent) return;
		this.parent.removeChild(this, shouldDestroy);
		this.parent = null;
	}
	
	removeChild(child, shouldDestroy) {
		shouldDestroy = shouldDestroy || false;
		var childIdx = this.children.indexOf(child);
		this.removeChildByIdx(childIdx, shouldDestroy);
	}
	removeChildByIdx( childIdx, shouldDestroy ) {
		shouldDestroy = shouldDestroy || false;
		if(childIdx < 0) {
			return;
		}
		var child = this.children.splice(childIdx, 1)[0];
		if(child.parent === this) {
			child.parent = null;
		}
		if(shouldDestroy) {
			child.Destroy();
		}
	}
	removeAllChildren( shouldDestroy ) { 
		shouldDestroy = shouldDestroy || false;
		for( var i=(this.children.length-1); i >= 0; i--) {
			var child = this.children[i];
			this.removeChild(child, shouldDestroy);
		}
	}
	//TODO: support string path lookup

	//draw function
	Draw( gfx, x, y, ct ) {
		if(!this.visible) return;
    
		this.handleActions(ct);
		
		gfx.saveMatrix();
		gfx.translate(x + this.pos.x, y + this.pos.y);

		if(this.rotation != 0) {
			gfx.rotate(this.rotation);
		}
		
		if(this.scale != 1) {
			gfx.scale(this.scale);
		}
		
		if(this.pixelated) {
			gfx.setSmoothing(false);
		}
		for(var f of this.fnCustomDraw) {
			f(gfx, 0,0, ct);
		}
		if(this.pixelated) {
			gfx.setSmoothing(true);
		}
		
		for(var child of this.children) {
			//note: dont subtract this.pos, since we're using gfx.translate
			child.Draw(gfx, 0, 0, ct);
		}

		gfx.restoreMatrix();
	}
	
	handleActions( ct ) {
		if( this.actions.length == 0 ) return;
		
		var remove = [];
		for( var i =0; i < this.actions.length; i++ ) {
			var action = this.actions[i];
			
			if( action.isDone ) {
				remove.push(i);
			}else {
				action.Update( ct );
			}
		}
		
		if( remove.length > 0 ) {
			for( var e = remove.length - 1; e >= 0; e --) {
				this.actions.splice( remove[e], 1 );
			}
		}
	}
	clearAllActions() {
		for( var i =0; i < this.actions.length; i++ ) {
			this.actions[i].Destroy();
		}
		this.actions.length = 0;
	}

	tweenWait(dt, fnOnComplete) {
		var action = new NodeAction_noProperty(dt)
		var self = this
		action.fnOnComplete = function() {
			if (fnOnComplete) fnOnComplete()
		}
		this.actions.push(action)
	}
	tweenRemoveFromParent( dt, fnOnComplete ) {
		var self = this
		this.tweenWait(dt, function() {
			self.removeFromParent()
		})
	}
	tweenScale( dt, endVal, fnOnComplete ) {
		this.setTween("scale", dt, endVal, fnOnComplete);	
	}
	tweenPos( dt, endVal, fnOnComplete ) {
		this.setVecTween("pos", dt, endVal, fnOnComplete);
	}
	tweenPosDelta( dt, deltaVal, fnOnComplete ) {
		var endVal = this.pos.getVecAdd(deltaVal)
		this.setVecTween("pos", dt, endVal, fnOnComplete)
	}
	setTween( paramName, dt, endVal, fnOnComplete ) {
		var action = new NodeAction_float(paramName, dt, endVal);
		action.setTarget(this);
		action.fnOnComplete = fnOnComplete || null;
		this.actions.push(action);
	}
	setVecTween( paramName, dt, endVal, fnOnComplete ) {
		var action = new NodeAction_vec2d(paramName, dt, endVal);
		action.setTarget(this);
		action.fnOnComplete = fnOnComplete || null;
		this.actions.push(action);
	}
	setPathTween( paramName, dt, path, fnOnComplete ) {
		var action = new NodeAction_arrayPath(paramName, dt, path);
		action.setTarget(this);
		action.fnOnComplete = fnOnComplete || null;
		this.actions.push(action);
	}
}

class NodeAction {
	constructor( propertyName, lifeTime, endVal ) {
		this.startTime = 0;
		this.lifeTime = lifeTime;
		this.target = null;
		this.propertyName = propertyName;
		this.isDone = false;
		this.fnOnComplete = null;
		this.startVal = null;
		this.endVal = endVal;
	}
	
	Destroy() {
		this.target = null;
	}
	
	setTarget( target ) {
		this.target = target;
		this.startVal = this.target[ this.propertyName ];
	}
	
	_calculateDT( ct ) {
		var dt = ct - this.startTime;
		if( dt < 0 )  return  0;
		else if( dt >= this.lifeTime ) return 1;
		else return dt / this.lifeTime;
	}
	
	Update( ct ) {
		if( this.startTime == 0 ) {
			this.startTime = ct;
		}
		//determine end or continue
		var pct = this._calculateDT(ct);
		//if end
		if( pct >= 1) {
			//end
			this.target[this.propertyName] = this.endVal;
			this.isDone = true;
			if( this.fnOnComplete ) {
				this.fnOnComplete();
				this.fnOnComplete = null;
			}
		}else {
			//continue
			var interp = this.getInterpolatedVal(pct);
			this.target[this.propertyName] = interp;
		}
	}

	getInterpolatedVal( pct ) {
		//override me
	}
}

class NodeAction_float extends NodeAction {	
	getInterpolatedVal( pct ) {
		var delta = this.endVal - this.startVal;
		return this.startVal + delta * pct;
	}
}

class NodeAction_vec2d extends NodeAction {
	getInterpolatedVal( pct ) {
		var delta = this.endVal.getVecSub( this.startVal );
		return this.startVal.getVecAdd( delta.scalarMult( pct ) );
	}
}

class NodeAction_noProperty extends NodeAction {
	constructor( lifeTime ) {
		super(undefined, lifeTime, undefined)
	}

	setTarget( target ) {
		this.target = target;
		this.startVal = 0
	}

	Update( ct ) {
		if( this.startTime == 0 ) {
			this.startTime = ct;
		}
		//determine end or continue
		var pct = this._calculateDT(ct);
		//if end
		if( pct >= 1) {
			//end
			this.isDone = true;
			if( this.fnOnComplete ) {
				this.fnOnComplete();
				this.fnOnComplete = null;
			}
		}
	}
}

//path should be an array of two-element-arrays ex:
// [[sx,sy],[x1,y1],[x2,y2], ... [xN,yN],[ex,ey]]
// where sx,sy is the start point, and ex,ey is the end point
class NodeAction_arrayPath extends NodeAction 
{
	constructor( propertyName, lifeTime, path) {
		super(propertyName, lifeTime, new Vec2D(path[path.length-1][0], path[path.length-1][1]));		
		this.path = path;
	}

	getInterpolatedVal( pct ) {
		var numSegments = this.path.length;
		var idx = ~~(numSegments * pct);
		if(idx >= numSegments-1) idx = numSegments - 2;

		var pctPerSegment = 1.0 / numSegments;
		var segmentRemainder = pct - (idx*pctPerSegment);
		var segmentPercent = segmentRemainder / pctPerSegment;
		if(segmentPercent > 1) segmentPercent = 1;

		var vFrom = new Vec2D( this.path[idx][0], this.path[idx][1] );
		console.log("vTo idx " + (idx+1));
		var vTo = new Vec2D( this.path[idx+1][0], this.path[idx+1][1] );
		var delta = vTo.getVecSub( vFrom );

		//console.log(" pct " + pct + " segs " + this.path.length + " = idx" + idx);
		return vFrom.getVecAdd( delta.scalarMult( segmentPercent ) );
	}
}