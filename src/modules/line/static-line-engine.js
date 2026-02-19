import { lineBounds } from './line-engine-common.js';

export function buildStaticLines({ width, height, spacing = 8, horizontal = true, zigzag = false }) {
  const lines = [];
  if (horizontal) {
    for (let y = 0; y < height; y += spacing) {
      lines.push(zigzag && ((y / spacing) % 2 === 1)
        ? [{ x: width - 1, y }, { x: 0, y }]
        : [{ x: 0, y }, { x: width - 1, y }]);
    }
  } else {
    for (let x = 0; x < width; x += spacing) {
      lines.push(zigzag && ((x / spacing) % 2 === 1)
        ? [{ x, y: height - 1 }, { x, y: 0 }]
        : [{ x, y: 0 }, { x, y: height - 1 }]);
    }
  }

  return { lines, bounds: lineBounds(lines) };
}

export function curveMap(t, type = 'linear', strength = 2) {
  if (type === 'exponential') return Math.pow(t, strength);
  if (type === 'logarithmic') return Math.log(1 + t * (Math.exp(strength) - 1)) / strength;
  if (type === 'sigmoid') {
    const k = strength * 2;
    return 1 / (1 + Math.exp(-k * (t - 0.5)));
  }
  return t;
}

export function applyStaticDisplacement({
  width,
  height,
  luminanceAt,
  lineSpacing = 8,
  sampleStep = 1,
  maxAmplitude = 3,
  frequency = 60,
  phaseOffset = 0,
  phaseIncrement = 0,
  ampCurve = 'linear',
  ampCurveStrength = 2,
  horizontal = true,
  invert = false,
  padding = 0
}) {
  const lines = [];
  const primaryLength = horizontal ? width : height;
  const crossLength = horizontal ? height : width;
  const count = Math.max(1, Math.floor((crossLength - 2 * padding) / lineSpacing) + 1);

  for (let li = 0; li < count; li++) {
    const base = padding + li * lineSpacing;
    const phase = phaseOffset + li * phaseIncrement;
    const pts = [];
    for (let s = padding; s <= primaryLength - padding; s += sampleStep) {
      const cx = horizontal ? s : base;
      const cy = horizontal ? base : s;
      let lum = luminanceAt(cx, cy);
      if (invert) lum = 1 - lum;
      const mapped = curveMap(1 - lum, ampCurve, ampCurveStrength);
      const disp = maxAmplitude * mapped * Math.sin((s / Math.max(1, primaryLength)) * frequency + phase);
      if (horizontal) pts.push({ x: s, y: base + disp });
      else pts.push({ x: base + disp, y: s });
    }
    lines.push(pts);
  }

  return { lines, bounds: lineBounds(lines) };
}
