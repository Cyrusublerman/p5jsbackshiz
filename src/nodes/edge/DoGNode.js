import { EffectNode } from '../EffectNode.js';

export class DoGNode extends EffectNode {
  constructor() {
    super('dog', 'DIFF OF GAUSS', {
      sigma1:    { value: 1, min: 0.1, max: 10, step: 0.1, label: 'SIGMA 1' },
      sigma2:    { value: 1.6, min: 0.2, max: 15, step: 0.1, label: 'SIGMA 2' },
      threshold: { value: 5, min: 0, max: 50, step: 1, label: 'THRESHOLD' }
    });
  }

  apply(s, d, w, h) {
    const { sigma1, sigma2, threshold } = this.params;
    const n = w * h;
    const lum = new Float32Array(n);
    for (let i = 0; i < n; i++) { const j=i*4; lum[i] = s[j]*0.299 + s[j+1]*0.587 + s[j+2]*0.114; }

    const blur = (src, sig) => {
      const rad = Math.ceil(sig * 3);
      const k = new Float32Array(rad*2+1); let ks = 0;
      for (let i=-rad;i<=rad;i++) { k[i+rad]=Math.exp(-(i*i)/(2*sig*sig)); ks+=k[i+rad]; }
      for (let i=0;i<k.length;i++) k[i]/=ks;
      const tmp = new Float32Array(n), out = new Float32Array(n);
      for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
        let v=0; for (let j=-rad;j<=rad;j++) v+=src[y*w+Math.max(0,Math.min(w-1,x+j))]*k[j+rad]; tmp[y*w+x]=v;
      }
      for (let x=0;x<w;x++) for (let y=0;y<h;y++) {
        let v=0; for (let j=-rad;j<=rad;j++) v+=tmp[Math.max(0,Math.min(h-1,y+j))*w+x]*k[j+rad]; out[y*w+x]=v;
      }
      return out;
    };

    const g1 = blur(lum, sigma1), g2 = blur(lum, sigma2);
    for (let i = 0; i < n; i++) {
      const v = Math.abs(g1[i] - g2[i]);
      const val = v > threshold ? Math.min(255, v) : 0;
      const j=i*4; d[j]=d[j+1]=d[j+2]=val; d[j+3]=s[j+3];
    }
  }
}
