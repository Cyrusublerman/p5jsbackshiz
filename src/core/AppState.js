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

    /**
     * Modulation maps — uploaded images used to drive parameters spatially.
     * Key: user-assigned name (string)
     * Value: { sourcePixels: Uint8ClampedArray, sourceW, sourceH, name }
     * At render time, Pipeline rescales these to pipeline dimensions
     * and extracts single-channel luminance for each.
     */
    this.modulationMaps = {};
  }

  /** Add a modulation map from an image. */
  addModulationMap(name, pixels, w, h) {
    this.modulationMaps[name] = { sourcePixels: pixels, sourceW: w, sourceH: h, name };
  }

  /** Remove a modulation map. */
  removeModulationMap(name) {
    delete this.modulationMaps[name];
  }

  /** Get list of modulation map names. */
  getModMapNames() {
    return Object.keys(this.modulationMaps);
  }
}
