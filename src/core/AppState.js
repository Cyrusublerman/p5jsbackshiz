export class AppState {
  constructor() {
    this.sourceImage = null;
    this.sourcePixels = null;
    this.sourceW = 0;
    this.sourceH = 0;
    this.previewScale = 0.5;
    this.quality = 'final';
    this.globalSeed = 42;
    this.stack = [];
    this.soloNodeId = null;
    this.zoom = 'fit';
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;
    this.lastRenderTime = 0;
    this.needsRender = true;
    this.rendering = false;
  }
}
