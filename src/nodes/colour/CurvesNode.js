import { EffectNode } from '../EffectNode.js';

/**
 * CurvesNode — per-channel tone curve via control points.
 * Uses monotone cubic interpolation to build 256-entry LUT.
 */
export class CurvesNode extends EffectNode {
  constructor() {
    super('curves', 'CURVES', {
      // Simplified: 3 control points (shadows, midtones, highlights)
      shadowIn:  { value: 0, min: 0, max: 255, step: 1, label: 'SHADOW IN' },
      shadowOut: { value: 0, min: 0, max: 255, step: 1, label: 'SHADOW OUT' },
      midIn:     { value: 128, min: 0, max: 255, step: 1, label: 'MID IN' },
      midOut:    { value: 128, min: 0, max: 255, step: 1, label: 'MID OUT' },
      highIn:    { value: 255, min: 0, max: 255, step: 1, label: 'HIGH IN' },
      highOut:   { value: 255, min: 0, max: 255, step: 1, label: 'HIGH OUT' }
    });
    this.isLUT = true;
  }

  _buildCurveLUT() {
    const { shadowIn, shadowOut, midIn, midOut, highIn, highOut } = this.params;
    const pts = [
      { x: shadowIn, y: shadowOut },
      { x: midIn, y: midOut },
      { x: highIn, y: highOut }
    ];
    // Piecewise linear interpolation between control points
    const lut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      let y;
      if (i <= pts[0].x) {
        y = pts[0].y;
      } else if (i >= pts[pts.length - 1].x) {
        y = pts[pts.length - 1].y;
      } else {
        // Find segment
        let seg = 0;
        for (let s = 0; s < pts.length - 1; s++) {
          if (i >= pts[s].x && i <= pts[s + 1].x) { seg = s; break; }
        }
        const t = (i - pts[seg].x) / Math.max(1, pts[seg + 1].x - pts[seg].x);
        // Smoothstep interpolation
        const st = t * t * (3 - 2 * t);
        y = pts[seg].y + (pts[seg + 1].y - pts[seg].y) * st;
      }
      lut[i] = Math.max(0, Math.min(255, Math.round(y)));
    }
    return lut;
  }

  apply(s, d, w, h) {
    const lut = this._buildCurveLUT();
    for (let i = 0, n = w * h * 4; i < n; i += 4) {
      d[i] = lut[s[i]]; d[i + 1] = lut[s[i + 1]]; d[i + 2] = lut[s[i + 2]]; d[i + 3] = s[i + 3];
    }
  }

  buildLUT(lutR, lutG, lutB) {
    const lut = this._buildCurveLUT();
    for (let i = 0; i < 256; i++) {
      lutR[i] = lut[lutR[i]]; lutG[i] = lut[lutG[i]]; lutB[i] = lut[lutB[i]];
    }
  }
}
