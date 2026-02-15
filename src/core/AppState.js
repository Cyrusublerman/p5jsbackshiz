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
    this.selectedNodeIdx = -1; // for keyboard nav
    this.zoom = 'fit';
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;
    this.lastRenderTime = 0;
    this.needsRender = true;
    this.rendering = false;

    // ── Modulation maps ──
    this.modulationMaps = {};

    // ── Multi-frame / animation ──
    this.frames = [];          // Uint8ClampedArray[] — RGBA per frame
    this.frameCount = 0;
    this.currentFrame = 0;
    this.fps = 24;
    this.isPlaying = false;

    // ── Render progress ──
    this.renderProgress = 0;   // 0..1, updated by Pipeline per node
  }

  /** Set single-frame source (backwards compatible). */
  setSource(pixels, w, h) {
    this.sourcePixels = pixels;
    this.sourceW = w;
    this.sourceH = h;
    this.frames = [pixels];
    this.frameCount = 1;
    this.currentFrame = 0;
  }

  /** Set multi-frame source. */
  setFrames(framesArray, w, h) {
    this.frames = framesArray;
    this.frameCount = framesArray.length;
    this.currentFrame = 0;
    this.sourceW = w;
    this.sourceH = h;
    this.sourcePixels = framesArray[0];
  }

  /** Seek to frame index. */
  seekFrame(idx) {
    this.currentFrame = Math.max(0, Math.min(this.frameCount - 1, idx));
    if (this.frames[this.currentFrame]) {
      this.sourcePixels = this.frames[this.currentFrame];
      this.needsRender = true;
    }
  }

  addModulationMap(name, pixels, w, h) {
    this.modulationMaps[name] = { sourcePixels: pixels, sourceW: w, sourceH: h, name };
  }

  removeModulationMap(name) { delete this.modulationMaps[name]; }
  getModMapNames() { return Object.keys(this.modulationMaps); }
}
