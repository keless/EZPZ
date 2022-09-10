
// Worker for calling and running TiledMapExporter.export() in the background

importScripts('../../../../js/framework/TiledMapChunks.js')

self.onmessage = (e) => {
  const workerData = e.data;

  let task = workerData.task


  //postMessage("[WORKER] Web worker onmessage established");
  switch (task) {
    case "export":
      let imageDataBuffer = workerData.imageData
      // Convert back from transferable ArrayBuffer type to a usable typed array
      let imageData = new Uint8ClampedArray( imageDataBuffer )

      let regionWidth = workerData.regionWidth
      let regionHeight = workerData.regionHeight
      let colorSet = workerData.colorSet

    postMessage({task: "echo", echo: "TiledMapExporterWorker - begin export with imageData of size " + regionWidth + " by " + regionHeight + " and " + colorSet.length + " colorSets" })

      let lastProgress = 0
      //console.log("TiledMapExporterWorker - begin export with imageData of size " + regionWidth + " by " + regionHeight + " and " + colorSet.length + " colorSets")
      let file = TiledMapExporter.export(imageData, regionWidth, regionHeight, colorSet, (progressValue)=> {

        if (progressValue > (lastProgress + 0.01)) {
          postMessage({task: "progress", progress: progressValue})
          lastProgress = progressValue
        }
      })

      console.log("TiledMapExporterWorker - finished export, returning result " + file)
      postMessage({task: "export", result: file })

      break;


    default:

  }
}