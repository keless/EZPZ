"use strict"; //ES6

class ButtonView extends NodeView {
	static get STATE_NORMAL() { return 0 }
	static get STATE_PRESSED() { return 1 }
	
	constructor(btnID, sprite, label, labelFont, labelStyle, onClickData ) {
		labelFont = labelFont || "10px Arial";
		labelStyle = labelStyle || "#CCCCCC";
		super();

		this.state = ButtonView.STATE_NORMAL;
		this.disabled = false;
		
		this.size = new Vec2D();
    
    this.evt = onClickData || {};
    this.evt["evtName"] = btnID;

		if(isString(sprite)) {
			var RP = Service.Get("rp");
			sprite = RP.getSprite(sprite);
		}
		
		if( sprite ) {
			this.setSprite( sprite );
		}
		
		this.setLabel( label, labelFont, labelStyle );
		
		this.unPressHandler = null;
	}
	
	Destroy() {
		if(this.unPressHandler) clearTimeout(this.unPressHandler);
		this.unPressHandler = null;
		super.Destroy();
	}
	
	setSprite(sprite) {
		super.setSprite(sprite);
		this.size.setVal(sprite.getWidth(), sprite.getHeight());
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