export class LayerTracker {
  constructor() {
    this.layers = [];
  }

  push(name, pixels, meta = {}) {
    const clone = new Uint8ClampedArray(pixels);
    const nonZero = this._countCoverage(clone);
    this.layers.push({ name, pixels: clone, nonZero, meta });
  }

  _countCoverage(pixels) {
    let n = 0;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) n += 1;
    return n;
  }

  stats() {
    const count = this.layers.length;
    const totalPixels = this.layers.reduce((sum, l) => sum + l.pixels.length / 4, 0);
    const totalCoverage = this.layers.reduce((sum, l) => sum + l.nonZero, 0);
    return { count, totalPixels, totalCoverage };
  }

  flatten(mode = 'over') {
    if (!this.layers.length) return null;
    const out = new Uint8ClampedArray(this.layers[0].pixels.length);
    if (mode === 'replace') return new Uint8ClampedArray(this.layers[this.layers.length - 1].pixels);

    for (const layer of this.layers) {
      for (let i = 0; i < out.length; i += 4) {
        const a = layer.pixels[i + 3] / 255;
        const inv = 1 - a;
        out[i] = out[i] * inv + layer.pixels[i] * a;
        out[i + 1] = out[i + 1] * inv + layer.pixels[i + 1] * a;
        out[i + 2] = out[i + 2] * inv + layer.pixels[i + 2] * a;
        out[i + 3] = Math.max(out[i + 3], layer.pixels[i + 3]);
      }
    }
    return out;
  }
}
