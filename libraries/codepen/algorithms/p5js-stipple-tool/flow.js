import { EdgeDetection, Advection, Noise } from '../index.js';
import { scaleField } from './utils.js';

export class FlowFieldEngine {
  constructor() {
    this.lines = [];
  }

  generate(analysis, params) {
    if (!analysis) return [];
    const { width, height, smoothed } = analysis;
    Noise.seedNoise(params.seedFlow);
    const sobel = EdgeDetection.sobel(scaleField(smoothed, 255), width, height);
    const gx = sobel.gx;
    const gy = sobel.gy;

    const velocityX = new Float32Array(width * height);
    const velocityY = new Float32Array(width * height);

    for (let i = 0; i < gx.length; i++) {
      velocityX[i] = -gx[i];
      velocityY[i] = -gy[i];
    }

    const spacing = params.flowSpacing;
    const stepSize = params.flowStep;
    const maxSteps = params.flowMaxSteps;
    const noiseStrength = params.flowNoise;

    const lines = [];

    for (let y = spacing / 2; y < height; y += spacing) {
      for (let x = spacing / 2; x < width; x += spacing) {
        const line = [{ x, y }];
        let px = x;
        let py = y;

        for (let i = 0; i < maxSteps; i++) {
          const vx = Advection.bilinearSample(velocityX, width, height, px, py);
          const vy = Advection.bilinearSample(velocityY, width, height, px, py);
          const mag = Math.hypot(vx, vy);
          if (mag < 0.0001) break;

          let nx = vx / mag;
          let ny = vy / mag;

          if (noiseStrength > 0) {
            const noiseValue = Noise.perlin2D(px * 0.01, py * 0.01);
            const angle = noiseValue * Math.PI * 2;
            nx = (1 - noiseStrength) * nx + noiseStrength * Math.cos(angle);
            ny = (1 - noiseStrength) * ny + noiseStrength * Math.sin(angle);
            const norm = Math.hypot(nx, ny) || 1;
            nx /= norm;
            ny /= norm;
          }

          px += nx * stepSize;
          py += ny * stepSize;

          if (px < 0 || px >= width || py < 0 || py >= height) break;
          line.push({ x: px, y: py });
        }

        if (line.length > 1) {
          lines.push(line);
        }
      }
    }

    this.lines = lines;
    return this.lines;
  }
}
