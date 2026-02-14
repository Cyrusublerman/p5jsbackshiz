import { EdgeDetection } from '../index.js';
import { blurField, scaleField } from './utils.js';

export class AnalysisEngine {
  constructor() {
    this.result = null;
  }

  update(image, params) {
    image.loadPixels();
    const { width, height } = image;

    const tone = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = image.pixels[idx];
        const g = image.pixels[idx + 1];
        const b = image.pixels[idx + 2];
        tone[y * width + x] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      }
    }

    const smoothed = blurField(tone, width, height, params.smoothRadius);
    const low = Math.min(params.edgeLow, params.edgeHigh - 0.01);
    const high = Math.max(params.edgeHigh, low + 0.01);
    const canny = EdgeDetection.canny(scaleField(smoothed, 255), width, height, {
      lowThreshold: low,
      highThreshold: high
    });

    const magnitude = canny.magnitude;
    let maxEdge = 0;
    for (let i = 0; i < magnitude.length; i++) {
      maxEdge = Math.max(maxEdge, magnitude[i]);
    }

    const edgeMask = new Uint8Array(width * height);
    const edgeNorm = new Float32Array(width * height);
    for (let i = 0; i < magnitude.length; i++) {
      const normalized = maxEdge > 0 ? magnitude[i] / maxEdge : 0;
      edgeNorm[i] = normalized;
      edgeMask[i] = canny.edges[i] > 0 ? 1 : 0;
    }

    const edgeInfluence = blurField(edgeNorm, width, height, params.edgeBlurRadius);

    this.result = {
      width,
      height,
      tone,
      smoothed,
      edgeMagnitude: magnitude,
      edgeMask,
      edgeInfluence
    };

    return this.result;
  }
}
