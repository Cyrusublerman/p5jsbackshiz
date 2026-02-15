import { EffectNode } from '../EffectNode.js';

export class ContourNode extends EffectNode {
  constructor() {
    super('contour', 'CONTOUR', {
      levels:      { value: 8, min: 2, max: 32, step: 1, label: 'LEVELS' },
      strokeW:     { value: 1, min: 0.5, max: 4, step: 0.5, label: 'STROKE W' },
      strokeLevel: { value: 0, min: 0, max: 255, step: 1, label: 'STROKE LVL' },
      blendAmt:    { value: 0.7, min: 0, max: 1, step: 0.01, label: 'BLEND' }
    });
  }

  apply(s, d, w, h) {
    const { levels, strokeW, strokeLevel, blendAmt } = this.params;
    const n = w * h;
    // Build luminance
    const lum = new Float32Array(n);
    for (let i = 0; i < n; i++) { const j=i*4; lum[i]=(s[j]*0.299+s[j+1]*0.587+s[j+2]*0.114)/255; }

    // Detect contour edges: where quantised level changes between neighbours
    const edge = new Uint8Array(n);
    for (let y = 0; y < h-1; y++) for (let x = 0; x < w-1; x++) {
      const i = y*w+x;
      const lv = Math.floor(lum[i] * levels);
      const lvR = Math.floor(lum[i+1] * levels);
      const lvB = Math.floor(lum[i+w] * levels);
      if (lv !== lvR || lv !== lvB) edge[i] = 1;
    }

    // Dilate edges by strokeW
    const rad = Math.ceil(strokeW);
    const edgeOut = new Uint8Array(n);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!edge[y*w+x]) continue;
      for (let dy = -rad; dy <= rad; dy++) {
        const ny = y+dy; if (ny < 0 || ny >= h) continue;
        for (let dx = -rad; dx <= rad; dx++) {
          const nx = x+dx; if (nx < 0 || nx >= w) continue;
          if (dx*dx+dy*dy <= rad*rad) edgeOut[ny*w+nx] = 1;
        }
      }
    }

    const inv = 1 - blendAmt;
    for (let i = 0; i < n; i++) {
      const j = i*4;
      if (edgeOut[i]) {
        d[j]=Math.round(s[j]*inv+strokeLevel*blendAmt);
        d[j+1]=Math.round(s[j+1]*inv+strokeLevel*blendAmt);
        d[j+2]=Math.round(s[j+2]*inv+strokeLevel*blendAmt);
      } else { d[j]=s[j]; d[j+1]=s[j+1]; d[j+2]=s[j+2]; }
      d[j+3]=s[j+3];
    }
  }
}
