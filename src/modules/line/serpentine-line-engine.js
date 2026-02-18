import { lineBounds, seededRandom } from './line-engine-common.js';

export function buildSerpentineLines({
  width,
  height,
  spacing = 8,
  amplitude = 4,
  frequency = 0.15,
  seed = 1,
  jitter = 0
}) {
  const rnd = seededRandom(seed);
  const lines = [];

  for (let y0 = 0; y0 < height; y0 += spacing) {
    const line = [];
    for (let x = 0; x < width; x++) {
      const j = jitter ? (rnd() * 2 - 1) * jitter : 0;
      const y = y0 + Math.sin(x * frequency) * amplitude + j;
      line.push({ x, y });
    }
    lines.push(line);
  }

  return { lines, bounds: lineBounds(lines) };
}

export function initSerpentineState({ width, height, padding = 0 } = {}) {
  return {
    width,
    height,
    padding,
    points: [],
    spawnPhase: 0,
    startY: null,
    complete: false
  };
}

export function updateSerpentineState(state, {
  luminanceAt = () => 0.5,
  drag = (lum) => lum * 0.5,
  baseSpeed = 0.3,
  spawnRate = 8,
  oscSpeed = 1,
  oscTopPercent = 0,
  oscBottomPercent = 100,
  invert = false
} = {}) {
  if (state.complete) return state;
  const { width, height, padding } = state;
  const oscTop = padding + (oscTopPercent / 100) * (height - 2 * padding);
  const oscBottom = padding + (oscBottomPercent / 100) * (height - 2 * padding);
  const amp = (oscBottom - oscTop) / 2;
  const center = (oscBottom + oscTop) / 2;

  for (let i = 0; i < spawnRate; i++) {
    const y = center + Math.sin(state.spawnPhase) * amp;
    state.points.push({ x: padding, y, borderPhase: null });
    if (state.startY == null) state.startY = y;
    state.spawnPhase += oscSpeed * 0.01;
  }

  for (const p of state.points) {
    if (p.borderPhase) continue;
    let lum = luminanceAt(p.x, p.y);
    if (invert) lum = 1 - lum;
    p.x += baseSpeed * (1 - drag(lum));
    if (p.x >= width - padding) { p.x = width - padding; p.borderPhase = 'right'; }
  }

  const speed = baseSpeed * 2;
  const right = width - padding;
  const bottom = height - padding;
  for (const p of state.points) {
    if (!p.borderPhase) continue;
    if (p.borderPhase === 'right') {
      p.y += speed;
      if (p.y >= bottom) { p.y = bottom; p.borderPhase = 'bottom'; }
    } else if (p.borderPhase === 'bottom') {
      p.x -= speed;
      if (p.x <= padding) { p.x = padding; p.borderPhase = 'left'; }
    } else if (p.borderPhase === 'left') {
      p.y -= speed;
      if (state.startY != null && p.y <= state.startY) { p.y = state.startY; p.borderPhase = 'done'; }
    }
  }

  while (state.points.length && state.points[0].borderPhase === 'done') state.points.shift();
  if (state.startY != null && state.points.length === 0) state.complete = true;

  return state;
}

export function toSerpentineLineSet(state) {
  return { lines: [state.points.map((p) => ({ x: p.x, y: p.y }))], bounds: lineBounds([state.points]) };
}
