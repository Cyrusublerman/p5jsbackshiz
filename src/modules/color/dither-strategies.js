import { deltaE00 } from './color-science.js';

function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function mul(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }

export function projectOntoSegment(point, a, b) {
  const v = sub(b, a);
  const w = sub(point, a);
  const vv = dot(v, v);
  if (vv < 1e-12) return { point: a, weightA: 1 };
  const t = Math.max(0, Math.min(1, dot(w, v) / vv));
  return { point: add(a, mul(v, t)), weightA: 1 - t };
}

export function findNearestLabIndex(targetLab, preparedPalette) {
  let idx = 0;
  let best = Infinity;
  for (let i = 0; i < preparedPalette.length; i++) {
    const d = deltaE00(targetLab, preparedPalette[i].lab);
    if (d < best) {
      best = d;
      idx = i;
      if (d < 1e-8) break;
    }
  }
  return idx;
}

export function findOppositeLabIndex(targetLab, nearestIdx, preparedPalette) {
  if (preparedPalette.length < 2) return -1;
  const c = preparedPalette[nearestIdx].lab;
  const oc = sub(c, targetLab);
  const magOC = Math.sqrt(dot(oc, oc));
  if (magOC < 1e-12) return -1;

  let bestIdx = -1;
  let minCos = 1;
  for (let i = 0; i < preparedPalette.length; i++) {
    if (i === nearestIdx) continue;
    const ok = sub(preparedPalette[i].lab, targetLab);
    const magOK = Math.sqrt(dot(ok, ok));
    if (magOK < 1e-12) continue;
    const cos = dot(oc, ok) / (magOC * magOK);
    const clamped = Math.max(-1, Math.min(1, cos));
    if (clamped < minCos) {
      minCos = clamped;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export function chooseNearestOppositeStrategy(targetLab, preparedPalette) {
  const nearest = findNearestLabIndex(targetLab, preparedPalette);
  const cLab = preparedPalette[nearest].lab;
  const distNearest = deltaE00(targetLab, cLab);
  if (distNearest < 1e-8 || preparedPalette.length < 2) {
    return { type: 'solid', idx1: nearest };
  }

  const opposite = findOppositeLabIndex(targetLab, nearest, preparedPalette);
  if (opposite === -1) return { type: 'solid', idx1: nearest };

  const oLab = preparedPalette[opposite].lab;
  const proj = projectOntoSegment(targetLab, cLab, oLab);
  const distProj = deltaE00(targetLab, proj.point);
  if (distProj < distNearest) {
    return { type: 'dither', idx1: nearest, idx2: opposite, weight1: Math.max(0, Math.min(1, proj.weightA)) };
  }
  return { type: 'solid', idx1: nearest };
}
