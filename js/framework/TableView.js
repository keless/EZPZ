"use strict"; //ES6

class TableView extends NodeView {
	static get VERTICAL() { return 0; }
	static get HORIZONTAL() { return 1; }
	
	static get ALIGN_LEFT() { return 0; }
	static get ALIGN_CENTER() { return 1; }
	static get ALIGN_RIGHT() { return 2; }

	constructor( w, h, sizeToFit ) {
		super();
		
		this.m_cells = [];
		this.m_scrollOffsetX = 0;
		this.m_scrollOffsetY = 0;
		this.padding = 5;

		this.align = TableView.ALIGN_LEFT;
		
		this.sizeToFit = sizeToFit || false;
		this.size.setVal(w,h);
		
		this.direction = TableView.VERTICAL;
	}
  toJson(ignoreChildren) {
    if (!this.serializable) {
			console.error("TableView - trying to serialize TableView when seralizable == false")
			return {}
		}

		var json = super.toJson(ignoreChildren)
		json.classType = "TableView"
		json.padding = this.padding
		json.align = this.align
		json.sizeToFit = this.sizeToFit
		json.w = this.size.x
		json.h = this.size.y
		json.direction = this.direction

		return json
  }
  loadJson(json) {
		super.loadJson(json)
		this.sizeToFit = json.sizeToFit
		this.size.setVal(json.w,json.h)
		this.padding = json.padding
		this.align = json.align
		this.direction = json.direction
  }
	
	addCell( cell ) {
		this.m_cells.push(cell);
		if (this.sizeToFit) {
			//increase size
			if (this.direction == TableView.VERTICAL) {
				this.size.y += cell.getHeight() + this.padding;
				this.size.x = Math.max(this.size.x, cell.getWidth());
			}else {
				this.size.x += cell.getWidth() + this.padding;
				this.size.y = Math.max(this.size.y, cell.getHeight());
			}
		}
	}
	
	removeCellAtIndex( idx ) { 
		this.m_cells = this.m_cells.splice(idx, 1);
		if (this.sizeToFit) {
			//decrease size
			if (direction == TableView.VERTICAL) {
				this.size.y -= cell.getHeight() + this.padding;
			}else {
				this.size.x -= cell.getWidth() + this.padding;
			}
		}
	}

	removeAllCells() {
		if (!this.sizeToFit) {
			this.m_cells.length = 0;
		} else {
			var numCells = this.m_cells.length;
			for(var i=(numCells-1); i>=0; i--) {
				this.removeCellAtIndex(i);
			}
		}
	}
	
	//x,y should be sent relative to node origin
	OnMouseDown(e, x,y) {

		//make local to self origin
		x -= this.pos.x;
		y -= this.pos.y;
		x -= this.m_scrollOffsetX;
		y -= this.m_scrollOffsetY;	

		var off = 0;
		if (this.sizeToFit && this.m_cells.length > 0) { //xxx WIP
			if (this.direction == TableView.VERTICAL) {
				off -= this.m_cells[0].getHeight();
			} else {
				off -= this.m_cells[0].getWidth();
			}
		}

		var start = 0;
		if( this.direction == TableView.VERTICAL ) {
			for( var i=0; i<this.m_cells.length; i++) {
				this.m_cells[i].OnMouseDown(e, x, (y - off));
				if(e.isDone) return;
				off += this.m_cells[i].getHeight() + this.padding;
			}
		} else {
			if(this.align == TableView.ALIGN_LEFT) {
				start -= this.size.x/2 * 0.8;
			}

			for( var i=0; i<this.m_cells.length; i++) {
				this.m_cells[i].OnMouseDown(e, (x - (start + off)), y);
				if(e.isDone) return;
				off += this.m_cells[i].getWidth() + this.padding;
			}
		}
	}
	
	Draw( gfx, x, y, ct ) {
		
		gfx.saveMatrix();


		gfx.translate(x + this.pos.x, y + this.pos.y);

		if(this.rotation != 0) {
			gfx.rotate(this.rotation);
		}
		
		if(this.scale != 1) {
			gfx.scale(this.scale);
		}

		for(var f of this.fnCustomDraw) {
			f(gfx, 0,0, ct);
		}
		
		x -= this.m_scrollOffsetX;
		y -= this.m_scrollOffsetY;
		
		var off = 0;
		if (this.sizeToFit && this.m_cells.length > 0) { //xxx WIP
			if (this.direction == TableView.VERTICAL) {
				off -= this.m_cells[0].getHeight();
			} else {
				off -= this.m_cells[0].getWidth();
			}
		}

		var start = 0;
		if( this.direction == TableView.VERTICAL ) {
			for( var i=0; i<this.m_cells.length; i++) {
				this.m_cells[i].Draw(gfx, 0, off, ct);
				off += this.m_cells[i].getHeight() + this.padding;
			}
		} else {
			if(this.align == TableView.ALIGN_LEFT) {
				start -= this.size.x/2 * 0.8;
			}

			for( var i=0; i<this.m_cells.length; i++) {
				this.m_cells[i].Draw(gfx, start + off, 0, ct);
				off += this.m_cells[i].getWidth() + this.padding;
			}
		}
		
		for(var child of this.children) {
			//note: dont subtract this.pos, since we're using gfx.translate
			child.Draw(gfx, 0, 0, ct);
		}
		
		gfx.restoreMatrix();
	}
}