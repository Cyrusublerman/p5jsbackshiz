import { EffectNode } from '../EffectNode.js';

export class LaplacianNode extends EffectNode {
  constructor() {
    super('laplacian', 'LAPLACIAN', {
      mode: { value: '4-conn', options: ['4-conn', '8-conn'], label: 'MODE', type: 'select' },
      normalize: { value: 1, min: 0, max: 1, step: 1, label: 'NORMALIZE' }
    });
  }

  apply(s, d, w, h) {
    const use8 = this.params.mode === '8-conn';
    const n = w * h;
    const lum = new Float32Array(n);
    for (let i = 0; i < n; i++) { const j=i*4; lum[i] = s[j]*0.299 + s[j+1]*0.587 + s[j+2]*0.114; }

    const out = new Float32Array(n);
    let maxV = 0;
    for (let y = 1; y < h-1; y++) for (let x = 1; x < w-1; x++) {
      const i = y*w+x;
      let v;
      if (use8) {
        v = lum[i-w-1]+lum[i-w]+lum[i-w+1]+lum[i-1]-8*lum[i]+lum[i+1]+lum[i+w-1]+lum[i+w]+lum[i+w+1];
      } else {
        v = lum[i-w]+lum[i-1]-4*lum[i]+lum[i+1]+lum[i+w];
      }
      out[i] = Math.abs(v);
      if (out[i] > maxV) maxV = out[i];
    }

    const scale = this.params.normalize && maxV > 0 ? 255 / maxV : 1;
    for (let i = 0; i < n; i++) {
      const v = Math.min(255, out[i] * scale);
      const j = i*4; d[j]=d[j+1]=d[j+2]=v; d[j+3]=s[j+3];
    }
  }
}
