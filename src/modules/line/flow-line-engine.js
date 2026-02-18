import { sampleField } from '../field/vector-field.js';
import { clipPoint, lineBounds } from './line-engine-common.js';
import { propagateFront } from './front-propagation-core.js';

export function buildFlowLines({
  field,
  seeds = [],
  iterations = 64,
  step = 1,
  minMove = 0.0001,
  occupancy = null
}) {
  const lines = [];

  for (const seed of seeds) {
    const line = propagateFront(seed, {
      steps: iterations,
      stepFn: (p) => {
        const [vx, vy] = sampleField(field, p.x, p.y, 'bilinear');
        const nx = p.x + vx * step;
        const ny = p.y + vy * step;
        const moved = Math.hypot(nx - p.x, ny - p.y);
        if (moved < minMove) return null;
        const next = clipPoint(nx, ny, field.width, field.height);
        if (occupancy) {
          const key = `${Math.round(next.x)},${Math.round(next.y)}`;
          if (occupancy.has(key)) return null;
          occupancy.add(key);
        }
        return next;
      }
    });
    lines.push(line);
  }

  return { lines, bounds: lineBounds(lines) };
}

export function initWavefrontState({ width, height, padding = 0, orientation = 'horizontal' } = {}) {
  const isHoriz = orientation === 'horizontal';
  return {
    fronts: [],
    gcHead: 0,
    frame: 0,
    frontIndex: 0,
    isHoriz,
    lineStart: padding,
    lineEnd: (isHoriz ? width : height) - padding,
    flowStart: padding,
    farEdge: (isHoriz ? height : width) - padding,
    complete: false
  };
}

function spawnFront(state, {
  lineSpacing = 6,
  sampleStep = 1,
  oscAmplitude = 0,
  oscFreq = 1,
  phaseIncrement = 0,
  baseSpeed = 0.5,
  stopSpawnFrame = 0
}) {
  const spawnInterval = Math.max(1, Math.round(lineSpacing / Math.max(0.01, baseSpeed)));
  if (state.frame % spawnInterval !== 0) return;
  if (stopSpawnFrame > 0 && state.frame >= stopSpawnFrame) return;

  const phase = state.frontIndex * phaseIncrement;
  const points = [];
  for (let s = state.lineStart; s <= state.lineEnd; s += sampleStep) {
    points.push({ linePos: s, flowPos: state.flowStart + Math.sin((s * oscFreq) / Math.max(1, state.lineEnd)) * oscAmplitude });
  }
  state.fronts.push({ points, complete: false });
  state.frontIndex += 1;
}

export function advanceWavefrontEngine(state, {
  luminanceAt = () => 0.5,
  drag = (lum) => lum * 0.5,
  baseSpeed = 0.5,
  lineSpacing = 6,
  sampleStep = 1,
  oscAmplitude = 0,
  oscFreq = 1,
  phaseIncrement = 0,
  stopSpawnFrame = 0,
  invert = false
} = {}) {
  if (state.complete) return state;

  spawnFront(state, { lineSpacing, sampleStep, oscAmplitude, oscFreq, phaseIncrement, baseSpeed, stopSpawnFrame });

  for (let i = state.gcHead; i < state.fronts.length; i++) {
    const front = state.fronts[i];
    if (!front || front.complete) continue;

    let allDone = true;
    for (const p of front.points) {
      if (p.flowPos >= state.farEdge) continue;
      const cx = state.isHoriz ? p.linePos : p.flowPos;
      const cy = state.isHoriz ? p.flowPos : p.linePos;
      let lum = luminanceAt(cx, cy);
      if (invert) lum = 1 - lum;
      p.flowPos += baseSpeed * (1 - drag(lum));
      if (p.flowPos < state.farEdge) allDone = false;
      if (p.flowPos > state.farEdge) p.flowPos = state.farEdge;
    }
    front.complete = allDone;
  }

  while (state.gcHead < state.fronts.length && state.fronts[state.gcHead]?.complete) {
    state.fronts[state.gcHead] = null;
    state.gcHead += 1;
  }

  if (stopSpawnFrame > 0 && state.frame >= stopSpawnFrame && state.gcHead >= state.fronts.length) {
    state.complete = true;
  }

  state.frame += 1;
  return state;
}

export function getDrawableWavefrontLines(state, progress = 1) {
  const active = [];
  for (let i = state.gcHead; i < state.fronts.length; i++) {
    const front = state.fronts[i];
    if (!front) continue;
    const line = front.points.map((p) => ({
      x: state.isHoriz ? p.linePos : p.flowPos,
      y: state.isHoriz ? p.flowPos : p.linePos
    }));
    active.push(line);
  }
  if (progress >= 1) return active;
  const count = Math.max(1, Math.ceil(active.length * progress));
  return active.slice(0, count);
}
