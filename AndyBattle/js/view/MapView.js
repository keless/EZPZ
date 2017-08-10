"use strict"; //ES6

class MapView extends BaseStateView {
	constructor( mapModel ) {
		super();
		this.model = mapModel;
		
		this.screenSize = new Vec2D();
		
		this.psExplosions = new ParticleSystem( 50 );
		
		//add button to switch to hangar state
		var RP = Service.Get("rp");
		var sprBtnBlue = RP.getSprite("gfx/btn_blue.sprite");
		this.btnHangar = new ButtonView("navHangar", sprBtnBlue, "Oh.. HELLO", "14px Arial", "#FFFF00");
		this.btnHangar.pos.setVal(500, 50);

	}
	
	
	OnMouseDown(e, x,y) {
		//check to see if the hangar nav button was pressed
		this.btnHangar.OnMouseDown(e,x,y);
	}
	
	OnMouseWheel(e, delta) {
		this.model.Zoom(delta);
	}
	
	OnKeyDown(e, x,y) {
		let ship = this.model.userShip;
		if(ship) {
			switch(e.keyCode) {
				case KEY_RIGHT: 
					if(ship) ship.controller.joystick.r = true; 
					break;
				case KEY_LEFT: 
					if(ship) ship.controller.joystick.l = true; 
					break;
				case KEY_UP: 
					if(ship) ship.controller.joystick.d = true; 
					break;
				case KEY_DOWN: 
					if(ship) ship.controller.joystick.u = true; 
					break;

					
					//number 1,2,3,4
				case 49: if(ship) ship.controller.joystick.a1 = true; break;
				case 50: if(ship) ship.controller.joystick.a2 = true; break;
				case 51: if(ship) ship.controller.joystick.a3 = true; break;
				case 52: if(ship) ship.controller.joystick.a4 = true; break;
					
					//*
				case 'S'.charCodeAt(0):
					if(ship) ship.controller.joystick.l = true; 
					break;
				case 'D'.charCodeAt(0):
					if(ship) ship.controller.joystick.d = true; 
					break;
				case 'F'.charCodeAt(0):
					if(ship) ship.controller.joystick.r = true; 
					break;
				case 'E'.charCodeAt(0):
					if(ship) ship.controller.joystick.u = true; 
					break;
					//*/
			}
		}
	}
	
	OnKeyUp(e, x,y) {
		let ship = this.model.userShip;
		switch(e.keyCode) {
			case KEY_RIGHT: 
				if(ship) ship.controller.joystick.r = false; 
				break;
			case KEY_LEFT: 
				if(ship) ship.controller.joystick.l = false; 
				break;
			case KEY_UP: 
				if(ship) ship.controller.joystick.d = false; 
				break;
			case KEY_DOWN: 
				if(ship) ship.controller.joystick.u = false; 
				break;
				
			case 49: if(ship) ship.controller.joystick.a1 = false; break;
			case 50: if(ship) ship.controller.joystick.a2 = false; break;
			case 51: if(ship) ship.controller.joystick.a3 = false; break;
			case 52: if(ship) ship.controller.joystick.a4 = false; break;
				
				//*
			case 'S'.charCodeAt(0):
				if(ship) ship.controller.joystick.l = false; 
				break;
			case 'D'.charCodeAt(0):
				if(ship) ship.controller.joystick.d = false; 
				break;
			case 'F'.charCodeAt(0):
				if(ship) ship.controller.joystick.r = false; 
				break;
			case 'E'.charCodeAt(0):
				if(ship) ship.controller.joystick.u = false; 
				break;
				//*/
		}
	}
	
	Draw( g, x,y, ct) {
		//var model = this.model;
		
		//fill background
		g.drawRectEx(this.screenSize.x/2, this.screenSize.y/2, this.screenSize.x, this.screenSize.y, "#000000");


		
		this.btnHangar.draw(g, 0,0, ct);
		
	}
}