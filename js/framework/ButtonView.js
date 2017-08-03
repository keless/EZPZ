"use strict"; //ES6

class ButtonView extends NodeView {
	static get STATE_NORMAL() { return 0 }
	static get STATE_PRESSED() { return 1 }
	
	constructor(btnID, sprite, label, labelFont, labelStyle, onClickData ) {
		super()

		this.state = ButtonView.STATE_NORMAL
		this.disabled = false
    
    this.evt = onClickData || {}
    this.evt["evtName"] = btnID || "btnID"
		
		if (sprite || label) {
			this._init(sprite, label, labelFont, labelStyle)
		}
		
		this.unPressHandler = null
	}
	_init(sprite, label, labelFont, labelStyle) {
		if( sprite ) {
			this.setSprite( sprite )
		}
		
		if (label) {
			labelFont = labelFont || "10px Arial"
			labelStyle = labelStyle || "#CCCCCC"
			this.setLabel( label, labelFont, labelStyle )
		}
	}

	toJson(ignoreChildren) {
		if (!this.serializable) {
			console.error("ButtonView - trying to serialize ButtonView when seralizable == false")
			return {}
		}

		var json = super.toJson(ignoreChildren)
		json.classType = "ButtonView"
		json.btnID = this.evt["evtName"]
		if (this.disabled) {
			json.disabled = this.disabled
		}
		//sprite - handled by super
		//label - handled by super

		return json
	}
	loadJson(json) {
		super.loadJson(json)
		this.evt["evtName"] = json.btnID
		this.disabled = json.disabled || false
		this._init(json.sprite, json.label, json.labelFont, json.labelStyle)
	}
	
	Destroy() {
		if(this.unPressHandler) clearTimeout(this.unPressHandler);
		this.unPressHandler = null;
		super.Destroy();
	}
	
	setSprite(sprite) {
		super.setSprite(sprite);
		this.size.setVal(this.sprite.getWidth(), this.sprite.getHeight());
	}
	
	Draw( gfx, x, y, ct ) {
		this.spriteFrame = this.state;
		super.Draw(gfx, x,y, ct);	
	}
	
	OnMouseDown(e,x,y) {
		if(this.disabled) return;
		
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
		
		var originX = 0;
		var originY = 0;
		if( Config.areSpritesCentered ) {
			originX -= this.size.x/2;
			originY -= this.size.y/2;
		}
		if( Rect2D.isPointInArea(x,y, originX, originY, this.size.x, this.size.y) ) {
			//mouse down inside, handle button click
			if(this.state == ButtonView.STATE_NORMAL) {
				this.state = ButtonView.STATE_PRESSED;
				EventBus.ui.dispatch(this.evt);
				var self = this;
				this.unPressHandler = setTimeout(function(){ 
					self.state = ButtonView.STATE_NORMAL;
					}, 0.15 * 1000);
					
				e.isDone = true;return;
			}
		}
		super.OnMouseDown(e,x,y);
	}
}