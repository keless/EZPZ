"use strict"; //ES6

class Vec2D {
  	constructor( x, y ) {
		this.x = x || 0;
		this.y = y || 0;
	}
	initializeWithPos( posObj ) {
		this.x = posObj.x;
		this.y = posObj.y;
	}
	clone() {
		return new Vec2D( this.x, this.y );
	}
	toString() {
		return this.x.toFixed(4) + "," + this.y.toFixed(4);
	}
	toJson() {
		return {x:this.x, y:this.y};
	}
	setVal( x, y ) {
		this.x = x;
		this.y = y;
		return this;
	}
	setVec( vec2 ) {
		this.x = vec2.x;
		this.y = vec2.y;
		return this;
	}
	addVec( vec2 ) {
		this.x += vec2.x;
		this.y += vec2.y;
		return this;
	}
	subVec( vec2 ) {
		this.x -= vec2.x;
		this.y -= vec2.y;
		return this;
	}
	scalarMult( scalar ) {
		this.x = this.x * scalar;
		this.y = this.y * scalar;
		return this;
	}
	nonZero() {
		if(this.x != 0 || this.y != 0) {
			return true;
		}
		return false;
	}
	getUnitized() {
		var mag = this.getMag();
		return new Vec2D( this.x / mag, this.y / mag );
	}
	getMagSq() {
		return (this.x*this.x) + (this.y*this.y);
	}
	getMag() {
		return Math.sqrt((this.x*this.x) + (this.y*this.y));
	}
	getScalarMult( scalar ) {
		return new Vec2D( this.x * scalar, this.y * scalar );
	}
	getVecAdd( vec2 ) {
		return new Vec2D( this.x + vec2.x, this.y + vec2.y );
	}
	getVecSub( vec2 ) {
		return new Vec2D( this.x - vec2.x, this.y - vec2.y );
	}
	getDotProd( vec2 ) {
		return ((this.x*vec2.x) + (this.y*vec2.y))
	}
	
	getDistSqFromVec( vec2 ) {
		var delta = vec2.getVecSub(this);
		return delta.getMagSq();
	}
	
	equalsVec( vec2 ) {
		if( this.x == vec2.x && this.y == vec2.y ) {
			return true;
		}
		return false;
	}
	
	//returns radians angle from y positive axis
	// vector does NOT have to be a unit vector
	toRadians() {
		if (this.y == 0 && this.x == 0) {
			return 0; //special case, zero length vector
		}
		return Math.atan2 ( this.y, this.x ) + Math.PI / 2;
	}
	
	//phi = angle (from y positive axis) in radians 
	fromRadians( phi ) {
		phi -= Math.PI / 2;
		this.x = Math.cos(phi);
		this.y = Math.sin(phi);
		return this;
	}
	
	//phi = angle (from y positive axis) in radians
	//returns a unit vector
	static getVecFromRadians( phi ) {
		phi -= Math.PI / 2;
		return new Vec2D(Math.cos(phi), Math.sin(phi));
	}
	
	//phi = angle (from y positive axis) in radians
	rotate( phi ) {
		if(this.x == 0 && this.y == 0) return this; //special case
		var c = Math.cos(phi);
		var s = Math.sin(phi);
		var x = this.x * c - this.y * s;
		var y = this.x * s + this.y * c;
		if( Math.abs(x) < 0.0000001 ) x = 0;
		if( Math.abs(y) < 0.0000001 ) y = 0;
		this.x = x;
		this.y = y;
		return this;
	}
	//phi = angle (from y positive axis) in radians
	getVecRotation( phi ) {
		if(this.x == 0 && this.y == 0) return new Vec2D(0, 0); //special case
		var c = Math.cos(phi);
		var s = Math.sin(phi);
		var x = this.x * c - this.y * s;
		var y = this.x * s + this.y * c;
		if( Math.abs(x) < 0.0000001 ) x = 0;
		if( Math.abs(y) < 0.0000001 ) y = 0;
		return new Vec2D(x, y);
	}
}

class Segment2D {
	constructor( startVec, endVec ) {
		this.s = startVec;
		this.e = endVec;
	}
	
	toString() {
		return this.s.toString() + " -> " + this.e.toString()
	}

	getNormalVec() {
		var normalVec = this.e.getVecSub(this.s)
		normalVec.rotate(90 * (Math.PI / 180))
		return normalVec.getUnitized()
	}

	getMagnitude() {
		var distVec = this.e.getVecSub(this.s)
		return distVec.getMag()
	}
	
	SegmentWithValues( x1,y1, x2,y2 ) {
		return new Segment2D( new Vec2D(x1,y1), new Vec2D(x2,y2) );
	}
	
	// returns Vec2D intersection if intersected, or null if not
	getSegmentIntersection( bySegment ) {
		return Segment2D.SegmentIntersectsSegment( this.s, this.e, bySegment.s, bySegment.e); 
	}

	// given a wall segment, a path segment, and an intersecting point
	//  returns new path endpoint Vec2D after reflection
	static GetReflection(wallSegment, pathSegment, intersectVec) {

  //0) get 'normal' vector of wall segment
  var wallNormal = wallSegment.getNormalVec()

  //1) get vector from start to collision
  var incomingVec = intersectVec.getVecSub(pathSegment.s)

  // A) formula: vector - (normal * (2 * Vector2.Dot(vector, normal)));

  var ns = incomingVec.getVecSub( wallNormal.getScalarMult( 2 * incomingVec.getDotProd(wallNormal) ) )

  var reflectedUnitVec = ns.getUnitized()

  //2) get magnitude of pathSegment
  var totalMag = pathSegment.getMagnitude()
  //3) get magnitude of incoming vector
  var incomingMag = incomingVec.getMag()
  //4) multiply reflectedUnitVec by totalMag - incomingMag
  var remainingMag = totalMag - incomingMag
  var resultVec = reflectedUnitVec.scalarMult(remainingMag)
  
  var result = intersectVec.getVecAdd( resultVec  )
  //console.log("vel magnitude " + totalMag)
  //console.log("dist to impact " + incomingMag)
  //console.log("left over distance " + remainingMag)
  //console.log("result mag " + resultVec.getMag())
  return result
}
	
	/// a1 is line1 start, a2 is line1 end, b1 is line2 start, b2 is line2 end
	/// returns Vec2D intersection if intersected, or null if not
	static SegmentIntersectsSegment( a1, a2, b1, b2)
	{
	    var b = a2.getVecSub(a1);
	    var d = b2.getVecSub(b1);
	    var bDotDPerp = b.x * d.y - b.y * d.x;
	
	    // if b dot d == 0, it means the lines are parallel so have infinite intersection points
	    if (bDotDPerp == 0)
	        return null;
	
	    var c = b1.getVecSub(a1);
	    var t = (c.x * d.y - c.y * d.x) / bDotDPerp;
	    if (t < 0 || t > 1)
	        return null;
	
	    var u = (c.x * b.y - c.y * b.x) / bDotDPerp;
	    if (u < 0 || u > 1)
	        return null;
	
	    return a1.getVecAdd( b.getScalarMult(t) ) ;
	}
}

class Rect2D {
	constructor( x, y, w, h ) {
		this.x = x || 0;
		this.y = y || 0;
		this.w = w || 0;
		this.h = h || 0;
	}
	
	static get TOP() { return 0; }
	static get RIGHT() { return 1; }
	static get BOTTOM() { return 2; }
	static get LEFT() { return 3; }
	
	toString() {
		return this.x.toFixed(4) + "," + this.y.toFixed(4) + ":" + this.w.toFixed(4) + "x" + this.h.toFixed(4) ;
	}
	
	clone() {
		return new Rect2D(this.x, this.y, this.w, this.h);
	}
	
	getCenter() {
		return new Vec2D( this.x + this.w/2, this.y + this.h/2 );
	}
	
	getRight() {
		return this.x + this.w;
	}
	getBottom() {
		return this.y + this.h;
	}

	//top left corner
	getVecTL() { 
		return new Vec2D(this.x, this.y);
	}
	getVecTR() {
		return new Vec2D(this.x + this.w, this.y);
	}
	getVecBL() {
		return new Vec2D(this.x, this.y + this.h);
	}
	getVecBR() {
		return new Vec2D(this.x + this.w, this.y + this.h);
	}
	//vector from center to TL corner
	getSpikeTL() {
		return new Vec2D(-this.w/2, -this.h/2);
	}
	getSpikeTR() {
		return new Vec2D(this.w/2, -this.h/2);
	}
	getSpikeBL() {
		return new Vec2D(-this.w/2, this.h/2);
	}
	getSpikeBR() {
		return new Vec2D(this.w/2, this.h/2);
	}
	
	getSegmentTop() { 
		return Segment2D.SegmentWithValues( this.x, this.y, this.x + this.w, this.y);
	}
	getSegmentBottom() { 
		return Segment2D.SegmentWithValues( this.x, this.y + this.h, this.x + this.w, this.y + this.h);
	}
	getSegmentLeft() { 
		return Segment2D.SegmentWithValues( this.x, this.y, this.x, this.y + this.h);
	}
	getSegmentRight() { 
		return Segment2D.SegmentWithValues( this.x, this.y + this.h, this.x + this.w, this.y + this.h);
	}
	
	equalsRect( r2d ) {
		if( this.x == r2d.x && this.y == r2d.y && this.w == r2d.w && this.h == r2d.h ) {
			return true;
		}
		return false;
	}
	
	setRect( r2d ) {
		this.x = r2d.x;
		this.y = r2d.y;
		this.w = r2d.w;
		this.h = r2d.h;
		return this;
	}
	
	setSizeVec( v2d ) {
		this.w = v2d.x;
		this.h = v2d.y;
		return this;
	}
	
	setSize( x, y ) {
		this.w = x;
		this.h = y;
		return this;
	}
	
	getSizeVec() {
		return new Vec2D(this.w, this.h);
	}
	
	setTL(x, y) {
		this.x = x;
		this.y = y;
		return this;
	}

	setCenter(x,y) {
		this.x = x - this.w/2;
		this.y = y - this.h/2;
		return this;
	}
	
	setVecCenter( v2d ) {
		this.x = v2d.x - this.w/2;
		this.y = v2d.y - this.h/2;
		return this;
	}
	
	addVecOffset( v2d ) {
		this.x += v2d.x;
		this.y += v2d.y;
		return this;
	}
	
	subVecOffset( v2d ) {
		this.x -= v2d.x;
		this.y -= v2d.y;
		return this;
	}
	
	addOffset( x, y ) {
		this.x += x;
		this.y += y;
		return this;
	}
	
	isPointInside( v2d ) {
		if( v2d.x < this.x ) return false;
		if( v2d.y < this.y ) return false;
		if( v2d.x > this.x + this.w ) return false;
		if( v2d.y > this.y + this.h ) return false;
		return true;
	}
	
	isRectOverlapped( r2d ) {
		if( r2d.x > this.x + this.w ) return false;
		if( r2d.y > this.y + this.h ) return false;
		if( r2d.x + r2d.w < this.x ) return false;
		if( r2d.y + r2d.h < this.y ) return false;
		return true;
	}

	confineVec( v2d ) {
		if(v2d.x < this.x ) v2d.x = this.x;
		if(v2d.x > this.x + this.w) v2d.x = this.x + this.w;
		if(v2d.y < this.y ) v2d.y = this.y;
		if(v2d.y > this.y + this.h) v2d.y = this.y + this.h;
	}
	
	static isPointInArea(px,py, ax,ay, aw, ah) {
		if(px < ax) return false;
		if(py < ay) return false;
		if(px > ax + aw ) return false;
		if(py > ay + ah ) return false;
		return true;
	}
	//p point to test, a area origin, s size of area
	static isVecInArea(p, a, s) {
		if(p.x < a.x) return false;
		if(p.y < a.y) return false;
		if(p.x > a.x + s.x ) return false;
		if(p.y > a.y + s.y ) return false;
		return true;
	}
	
	static getUnion( r1, r2 ) {
		var r = new Rect2D();
		r.x = (r1.x < r2.x) ? r1.x : r2.x;
		r.y = (r1.y < r2.y) ? r1.y : r2.y;
		
		var xw1 = (r1.x + r1.w);
		var xw2 = (r2.x + r2.w);
		r.w = (xw1 > xw2) ? (xw1 - r.x) : (xw2 - r.x);
		
		var yh1 = (r1.y + r1.h);
		var yh2 = (r2.y + r2.h);
		r.h = (yh1 > yh2) ? (yh1 - r.y) : (yh2 - r.y);
		
		return r;
	}
	
	static getIntersection( r1, r2 ) {
		var r = new Rect2D();
		r.x = (r1.x > r2.x) ? r1.x : r2.x;
		r.y = (r1.y > r2.y) ? r1.y : r2.y;
		
		var xw1 = (r1.x + r1.w);
		var xw2 = (r2.x + r2.w);
		r.w = (xw1 < xw2) ? (xw1 - r.x) : (xw2 - r.x);
		
		var yh1 = (r1.y + r1.h);
		var yh2 = (r2.y + r2.h);
		r.h = (yh1 < yh2) ? (yh1 - r.y) : (yh2 - r.y);
		
		return r;
	}
	
	//Return AABB rect that inscribes given rotated rectangle
	static getInscribedRotatedRect( r, rot ) {
		var center = r.getCenter();
		var spikeTL = r.getSpikeTL().rotate( rot ).addVec(center);
		var spikeTR = r.getSpikeTR().rotate( rot ).addVec(center);
		var spikeBL = r.getSpikeBL().rotate( rot ).addVec(center);
		var spikeBR = r.getSpikeBR().rotate( rot ).addVec(center);
		
		var minX = Math.min(spikeTL.x, spikeTR.x, spikeBL.x, spikeBR.x);
		var maxX = Math.max(spikeTL.x, spikeTR.x, spikeBL.x, spikeBR.x);
		var minY = Math.min(spikeTL.y, spikeTR.y, spikeBL.y, spikeBR.y);
		var maxY = Math.max(spikeTL.y, spikeTR.y, spikeBL.y, spikeBR.y);
		return new Rect2D(minX, minY, maxX - minX, maxY - minY);
	}
	
	static doUnitTest() {
		console.log("Beginning Rect2D unit tests...");

		var r1 = new Rect2D(0,0, 100, 100);
		var r2 = new Rect2D(50, 50, 100, 100);
		var r3 = new Rect2D( -10, -20, 10, 20);
		
		console.log("test unions: ");
		var u1 = Rect2D.getUnion( r1, r2 );
		console.log("expect " + new Rect2D(0,0, 150,150).toString() );
		console.log("result " + u1.toString());
		var u2 = Rect2D.getUnion( r1, r3 );
		console.log("expect " + new Rect2D(-10,-20, 110,120).toString() );
		console.log("result " + u2.toString());
		
		console.log("test intersects: ");
		var i1 = Rect2D.getIntersection( r1, r2 );
		console.log("expect " + new Rect2D(50,50, 50,50).toString() );
		console.log("result " + i1.toString());
		var i2 = Rect2D.getIntersection( r1, r3 );
		console.log("expect " + new Rect2D(0,0, 0,0).toString() );
		console.log("result " + i2.toString());
	}
}