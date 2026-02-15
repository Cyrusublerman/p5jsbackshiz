export class ViewportRenderer {
  constructor(p5inst, state) {
    this.p = p5inst;
    this.state = state;
    this.resultBuffer = null;
    this._oc = null;
    this._ocCtx = null;
    this._ocW = 0;
    this._ocH = 0;
    this._imgData = null;
  }

  setResult(result) { this.resultBuffer = result; }

  _ensureOffscreen(w, h) {
    if (!this._oc || this._ocW !== w || this._ocH !== h) {
      this._oc = new OffscreenCanvas(w, h);
      this._ocCtx = this._oc.getContext('2d');
      this._ocW = w; this._ocH = h;
      this._imgData = this._ocCtx.createImageData(w, h);
    }
  }

  draw() {
    const p = this.p;
    const s = this.state;
    p.background(26);
    if (!this.resultBuffer) return;

    const { pixels, width: rw, height: rh } = this.resultBuffer;
    this._ensureOffscreen(rw, rh);
    this._imgData.data.set(pixels);
    this._ocCtx.putImageData(this._imgData, 0, 0);

    let dw, dh, ox, oy;

    if (s.zoom === 'fit') {
      const sc = Math.min(p.width / rw, p.height / rh, 1);
      dw = rw * sc; dh = rh * sc;
    } else if (s.zoom === 'fill') {
      const sc = Math.max(p.width / rw, p.height / rh);
      dw = rw * sc; dh = rh * sc;
    } else if (s.zoom === '1:1') {
      dw = rw; dh = rh;
    } else {
      const sc = s.zoomLevel;
      dw = rw * sc; dh = rh * sc;
    }

    ox = (p.width - dw) / 2 + s.panX;
    oy = (p.height - dh) / 2 + s.panY;

    p.drawingContext.imageSmoothingEnabled = true;
    p.drawingContext.drawImage(this._oc, ox, oy, dw, dh);

    // Subtle border only
    p.noFill();
    p.stroke(60);
    p.strokeWeight(1);
    p.rect(ox, oy, dw, dh);
  }
}
