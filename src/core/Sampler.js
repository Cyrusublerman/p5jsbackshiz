export class Sampler {
  static clamp(v, mx) {
    return Math.max(0, Math.min(mx - 1, v));
  }

  static bilinear(px, w, h, fx, fy) {
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const dx = fx - x0, dy = fy - y0;
    const cx0 = this.clamp(x0, w), cx1 = this.clamp(x0 + 1, w);
    const cy0 = this.clamp(y0, h), cy1 = this.clamp(y0 + 1, h);
    const i00 = (cy0 * w + cx0) * 4;
    const i10 = (cy0 * w + cx1) * 4;
    const i01 = (cy1 * w + cx0) * 4;
    const i11 = (cy1 * w + cx1) * 4;
    const r = [];
    for (let c = 0; c < 4; c++) {
      r[c] = (px[i00 + c] * (1 - dx) + px[i10 + c] * dx) * (1 - dy) +
              (px[i01 + c] * (1 - dx) + px[i11 + c] * dx) * dy;
    }
    return r;
  }

  static nearest(px, w, h, fx, fy) {
    const x = this.clamp(Math.round(fx), w);
    const y = this.clamp(Math.round(fy), h);
    const i = (y * w + x) * 4;
    return [px[i], px[i + 1], px[i + 2], px[i + 3]];
  }

  static sample(px, w, h, fx, fy, m) {
    return m === 'bilinear'
      ? this.bilinear(px, w, h, fx, fy)
      : this.nearest(px, w, h, fx, fy);
  }
}
