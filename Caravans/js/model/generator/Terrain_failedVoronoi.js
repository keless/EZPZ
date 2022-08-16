
class TerrainGenerator_failedVoronoi {

  constructor() {
    this.gridWidth = 1024
    this.gridHeight = 1024

    this.voronoiPointsStepWidth = 2
    this.voronoiPointsStepHeight = 2
    this.voronoiPointsWidth = this.gridWidth / this.voronoiPointsStepWidth
    this.voronoiPointsHeight = this.gridHeight / this.voronoiPointsStepHeight

    this.initialPoints = []
    for (let y = 0; y < this.voronoiPointsHeight; y++) {
      for (let x = 0; x < this.voronoiPointsWidth; x++) {
        var xPos = this.voronoiPointsStepWidth * x 
        var yPos = this.voronoiPointsStepHeight * y
        this.initialPoints.push([xPos, yPos])

        //zzz todo: add rand() to x and y pos, currently this is just a perfectly distributed grid
      }
    }

    this.delaunay = null
  }


  // Return JSON representing a map
  generate() {
    this.delaunay = document.Delaunay.from(this.initialPoints);
  }

  renderVoronoi(boundsXmin, boundsYmin, boundsXmax, boundsYmax, context2D) {
    var voronoi = this.delaunay.voronoi([boundsXmin, boundsYmin, boundsXmax, boundsYmax])
    voronoi.render(context2D)
    /*
    var svgPathStr = voronoi.render()
    var p = new Path2D(svgPathStr)
    context2D.stroke(p)
    context2D.fill(p)
    */
  }

  createNodeView(boundsXmin, boundsYmin, boundsXmax, boundsYmax) {
    var voronoi = this.delaunay.voronoi([boundsXmin, boundsYmin, boundsXmax, boundsYmax])
    var node = new NodeView()
    node.size.setVal(boundsXmax - boundsXmin, boundsYmax - boundsYmin);
    node.addCustomDraw( function(g, x,y, ct) { 
      voronoi.render(g.ctx)
    })
    return node
  }
}