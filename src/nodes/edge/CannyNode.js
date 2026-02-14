import { EffectNode } from '../EffectNode.js';

export class CannyNode extends EffectNode {
  constructor() {
    super('canny', 'CANNY EDGE', {
      sigma:         { value: 1.4, min: 0.5, max: 5, step: 0.1, label: 'SIGMA' },
      lowThreshold:  { value: 0.1, min: 0.01, max: 0.5, step: 0.01, label: 'LOW THRESH' },
      highThreshold: { value: 0.3, min: 0.05, max: 1, step: 0.01, label: 'HIGH THRESH' }
    });
  }

  apply(s, d, w, h) {
    const { sigma, lowThreshold, highThreshold } = this.params;
    const n = w * h;
    // Greyscale
    const grey = new Float32Array(n);
    for (let i = 0; i < n; i++) { const j = i*4; grey[i] = s[j]*0.299 + s[j+1]*0.587 + s[j+2]*0.114; }

    // Simple Gaussian blur
    const rad = Math.ceil(sigma * 3);
    const k = new Float32Array(rad * 2 + 1);
    let kSum = 0;
    for (let i = -rad; i <= rad; i++) { k[i+rad] = Math.exp(-(i*i)/(2*sigma*sigma)); kSum += k[i+rad]; }
    for (let i = 0; i < k.length; i++) k[i] /= kSum;
    const tmp = new Float32Array(n);
    const smooth = new Float32Array(n);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let v = 0; for (let j = -rad; j <= rad; j++) v += grey[y*w+Math.max(0,Math.min(w-1,x+j))] * k[j+rad];
      tmp[y*w+x] = v;
    }
    for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
      let v = 0; for (let j = -rad; j <= rad; j++) v += tmp[Math.max(0,Math.min(h-1,y+j))*w+x] * k[j+rad];
      smooth[y*w+x] = v;
    }

    // Sobel gradients
    const mag = new Float32Array(n), dir = new Float32Array(n);
    let maxM = 0;
    for (let y = 1; y < h-1; y++) for (let x = 1; x < w-1; x++) {
      const i = y*w+x;
      const gx = -smooth[i-w-1]+smooth[i-w+1]-2*smooth[i-1]+2*smooth[i+1]-smooth[i+w-1]+smooth[i+w+1];
      const gy = -smooth[i-w-1]-2*smooth[i-w]-smooth[i-w+1]+smooth[i+w-1]+2*smooth[i+w]+smooth[i+w+1];
      mag[i] = Math.sqrt(gx*gx+gy*gy); dir[i] = Math.atan2(gy,gx);
      if (mag[i] > maxM) maxM = mag[i];
    }

    // Non-maximum suppression
    const nms = new Float32Array(n);
    for (let y = 1; y < h-1; y++) for (let x = 1; x < w-1; x++) {
      const i = y*w+x, a = (dir[i]+Math.PI)%Math.PI;
      let m1,m2;
      if (a < Math.PI/8 || a >= 7*Math.PI/8) { m1=mag[i-1]; m2=mag[i+1]; }
      else if (a < 3*Math.PI/8) { m1=mag[i-w+1]; m2=mag[i+w-1]; }
      else if (a < 5*Math.PI/8) { m1=mag[i-w]; m2=mag[i+w]; }
      else { m1=mag[i-w-1]; m2=mag[i+w+1]; }
      nms[i] = (mag[i]>=m1 && mag[i]>=m2) ? mag[i] : 0;
    }

    // Double threshold + hysteresis
    const lo = lowThreshold * maxM, hi = highThreshold * maxM;
    const edges = new Uint8Array(n);
    for (let i = 0; i < n; i++) edges[i] = nms[i] >= hi ? 255 : nms[i] >= lo ? 128 : 0;
    let changed = true;
    while (changed) {
      changed = false;
      for (let y = 1; y < h-1; y++) for (let x = 1; x < w-1; x++) {
        const i = y*w+x;
        if (edges[i] === 128) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (edges[(y+dy)*w+x+dx] === 255) { edges[i] = 255; changed = true; break; }
          }
        }
      }
    }
    for (let i = 0; i < n; i++) { if (edges[i] === 128) edges[i] = 0; }

    for (let i = 0; i < n; i++) { const j=i*4; d[j]=d[j+1]=d[j+2]=edges[i]; d[j+3]=s[j+3]; }
  }
}
