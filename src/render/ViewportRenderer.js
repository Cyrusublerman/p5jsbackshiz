export class ViewportRenderer {
  constructor(p5inst, state) {
    this.p = p5inst;
    this.state = state;
    this.resultBuffer = null;
    // Reusable offscreen canvas + ImageData
    this._oc = null;
    this._ocCtx = null;
    this._ocW = 0;
    this._ocH = 0;
    this._imgData = null;
  }

  setResult(result) {
    this.resultBuffer = result;
  }

  _ensureOffscreen(w, h) {
    if (!this._oc || this._ocW !== w || this._ocH !== h) {
      this._oc = new OffscreenCanvas(w, h);
      this._ocCtx = this._oc.getContext('2d');
      this._ocW = w;
      this._ocH = h;
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
      dw = rw * sc;
      dh = rh * sc;
      ox = (p.width - dw) / 2 + s.panX;
      oy = (p.height - dh) / 2 + s.panY;
    } else {
      const sc = s.zoomLevel;
      dw = rw * sc;
      dh = rh * sc;
      ox = (p.width - dw) / 2 + s.panX;
      oy = (p.height - dh) / 2 + s.panY;
    }

    p.drawingContext.imageSmoothingEnabled = true;
    p.drawingContext.drawImage(this._oc, ox, oy, dw, dh);

    // Border
    p.noFill();
    p.stroke(85);
    p.strokeWeight(1);
    p.rect(ox, oy, dw, dh);

    // Corner crop marks
    const cm = 14;
    p.stroke(150);
    p.line(ox, oy, ox + cm, oy);
    p.line(ox, oy, ox, oy + cm);
    p.line(ox + dw, oy, ox + dw - cm, oy);
    p.line(ox + dw, oy, ox + dw, oy + cm);
    p.line(ox, oy + dh, ox + cm, oy + dh);
    p.line(ox, oy + dh, ox, oy + dh - cm);
    p.line(ox + dw, oy + dh, ox + dw - cm, oy + dh);
    p.line(ox + dw, oy + dh, ox + dw, oy + dh - cm);

    // Centre crosshairs (dashed)
    const cx = ox + dw / 2;
    const cy = oy + dh / 2;
    p.stroke(60);
    p.drawingContext.setLineDash([4, 4]);
    p.line(ox, cy, ox + dw, cy);
    p.line(cx, oy, cx, oy + dh);
    p.drawingContext.setLineDash([]);
  }
}
