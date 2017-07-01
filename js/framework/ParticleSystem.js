"use strict"; //ES6

class ParticleModel {
	constructor() {
		this.pos = new Vec2D();
		this.vel = new Vec2D();

		this.reinit();
	}
	
	reinit() {
		this.pos.setVal(0,0);
		this.vel.setVal(0,0);
		this.startTime = 0;
		this.endTime = 0;
		this.size = 1;
		this.sprite = null;
		this.fillStyle = "#FF0000";
	}
}

class ParticleSystem {
	constructor( poolSize ) {
		this.lastUpdate = 0;
		this.freeParticles = [];
		this.livingParticles = [];
		for( var i=0; i< poolSize; i++ ) {
			this.freeParticles.push(new ParticleModel());
		}
	}
	draw(gfx, x, y, ct) {
		//time logic
		if(this.lastUpdate == 0) this.lastUpdate = ct;
		var dt = ct - this.lastUpdate;
		//update logic
		for( var i=0; i< this.livingParticles.length; i++) {
			var p = this.livingParticles[i];
			if( p.endTime <= ct ) {
				//free up particle
				this.freeParticles.push(p);
				this.livingParticles.splice(i,1);
				p.reinit();
				i--;
			} else {
				p.pos.addVec( p.vel.getScalarMult(dt) );
				
				//draw logic
				if(p.sprite) {
					var _dt = ct - p.startTime;
					var frame = Math.floor(_dt * p.sprite.getFPS()) % p.sprite.getNumFrames();
					p.sprite.drawFrame(gfx, x + p.pos.x, y + p.pos.y, frame );
				} else {
					gfx.drawRectEx(x + p.pos.x, y + p.pos.y, p.size, p.size, p.fillStyle);
				}
				
			}
		}
	}
	spawn( x,y, vx,vy, ct, lifespan) {
		if(this.freeParticles.length < 1) return;
		var p = this.freeParticles.pop();
		this.livingParticles.push(p);
		p.startTime = ct;
		p.endTime = ct + lifespan;
		p.pos.setVal(x,y);
		p.vel.setVal(vx,vy);
		
	}
	spawnAnimated( x,y, vx, vy, ct, sprite) {
		if(this.freeParticles.length < 1) return;
		var p = this.freeParticles.pop();
		this.livingParticles.push(p);
		p.startTime = ct;
		
		var lifespan = sprite.getNumFrames() / sprite.getFPS();
		p.endTime = ct + lifespan;
		p.pos.setVal(x,y);
		p.vel.setVal(vx,vy);
		p.sprite = sprite;
	}

}