import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════════════
// PERLIN NOISE 2D
// ═══════════════════════════════════════════════════════════════════════

class Perlin {
  constructor(seed = 0) {
    this.p = new Uint8Array(512);
    this.g = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = seed;
    for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; }
    for (let i = 0; i < 512; i++) this.p[i] = p[i & 255];
  }
  _f(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  n2(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = this._f(xf), v = this._f(yf);
    const p = this.p, g = this.g;
    const d = (gi, dx, dy) => { const gg = g[gi % 8]; return gg[0] * dx + gg[1] * dy; };
    const aa = p[p[X] + Y], ab = p[p[X] + Y + 1], ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
    const l = (a, b, t) => a + t * (b - a);
    return l(l(d(aa, xf, yf), d(ba, xf - 1, yf), u), l(d(ab, xf, yf - 1), d(bb, xf - 1, yf - 1), u), v);
  }
  fbm(x, y, oct = 4) {
    let v = 0, a = 1, f = 1, m = 0;
    for (let i = 0; i < oct; i++) { v += a * this.n2(x * f, y * f); m += a; a *= 0.5; f *= 2; }
    return v / m;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// LOOPABLE NOISE — samples a 2D Perlin at a rotating point in parameter space
// t goes 0→1→0 seamlessly by walking a circle in noise space
// ═══════════════════════════════════════════════════════════════════════

class LoopNoise {
  constructor(seed) { this.p = new Perlin(seed); this.p2 = new Perlin(seed + 777); }
  sample(x, y, t, loopR) {
    // Walk a torus in 4D noise space using two independent circular motions
    // Primary rotation (slow, large): drives the main drift
    const a1 = t * Math.PI * 2;
    // Secondary rotation (faster, smaller): adds complexity
    const a2 = t * Math.PI * 2 * 1.618; // golden ratio for non-repeating overlap
    const r2 = loopR * 0.6;
    // Sample noise with offsets from both circles
    const nx = x + Math.cos(a1) * loopR;
    const ny = y + Math.sin(a1) * loopR;
    // Second noise layer offset by the second rotation
    const n1 = this.p.fbm(nx + Math.cos(a2) * r2, ny + Math.sin(a2) * r2, 4);
    // Blend with a cross-axis sample for more dimensional movement
    const n2 = this.p2.fbm(x + Math.sin(a1) * loopR, y + Math.cos(a2) * r2, 3);
    return n1 * 0.7 + n2 * 0.3;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// GLYPH DATA — 3×3, 4×4, 5×5 uppercase
// ═══════════════════════════════════════════════════════════════════════

const G3={A:{n:[[0,2],[0,1],[1,0],[2,1],[2,2],[1,1]],l:[[0,1],[1,2],[2,3],[3,4],[1,5],[5,3]]},B:{n:[[0,0],[0,1],[0,2],[1,0],[2,0],[2,1],[1,1],[2,2],[1,2]],l:[[0,1],[1,2],[0,3],[3,4],[4,5],[5,6],[6,1],[5,7],[7,8],[8,2]]},C:{n:[[2,0],[1,0],[0,0],[0,1],[0,2],[1,2],[2,2]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]},D:{n:[[0,0],[0,1],[0,2],[1,0],[2,1],[1,2]],l:[[0,1],[1,2],[0,3],[3,4],[4,5],[5,2]]},E:{n:[[2,0],[1,0],[0,0],[0,1],[0,2],[1,2],[2,2],[1,1]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[3,7]]},F:{n:[[2,0],[1,0],[0,0],[0,1],[0,2],[1,1]],l:[[0,1],[1,2],[2,3],[3,4],[3,5]]},G:{n:[[2,0],[1,0],[0,0],[0,1],[0,2],[1,2],[2,2],[2,1],[1,1]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8]]},H:{n:[[0,0],[0,1],[0,2],[2,0],[2,1],[2,2],[1,1]],l:[[0,1],[1,2],[3,4],[4,5],[1,6],[6,4]]},I:{n:[[0,0],[1,0],[2,0],[1,1],[1,2],[0,2],[2,2]],l:[[0,1],[1,2],[1,3],[3,4],[5,4],[4,6]]},J:{n:[[1,0],[2,0],[2,1],[2,2],[1,2],[0,2]],l:[[0,1],[1,2],[2,3],[3,4],[4,5]]},K:{n:[[0,0],[0,1],[0,2],[2,0],[1,1],[2,2]],l:[[0,1],[1,2],[3,4],[4,1],[4,5]]},L:{n:[[0,0],[0,1],[0,2],[1,2],[2,2]],l:[[0,1],[1,2],[2,3],[3,4]]},M:{n:[[0,2],[0,1],[0,0],[1,1],[2,0],[2,1],[2,2]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]},N:{n:[[0,2],[0,1],[0,0],[1,1],[2,2],[2,1],[2,0]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]},O:{n:[[1,0],[2,0],[2,1],[2,2],[1,2],[0,2],[0,1],[0,0]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0]]},P:{n:[[0,2],[0,1],[0,0],[1,0],[2,0],[2,1],[1,1]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,1]]},Q:{n:[[1,0],[2,0],[2,1],[1,2],[0,2],[0,1],[0,0],[2,2]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[2,7]]},R:{n:[[0,2],[0,1],[0,0],[1,0],[2,0],[2,1],[1,1],[2,2]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,1],[6,7]]},S:{n:[[2,0],[1,0],[0,0],[0,1],[1,1],[2,1],[2,2],[1,2],[0,2]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8]]},T:{n:[[0,0],[1,0],[2,0],[1,1],[1,2]],l:[[0,1],[1,2],[1,3],[3,4]]},U:{n:[[0,0],[0,1],[0,2],[1,2],[2,2],[2,1],[2,0]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]},V:{n:[[0,0],[0,1],[1,2],[2,1],[2,0]],l:[[0,1],[1,2],[2,3],[3,4]]},W:{n:[[0,0],[0,1],[0,2],[1,1],[2,2],[2,1],[2,0]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]},X:{n:[[0,0],[1,1],[2,0],[2,2],[0,2]],l:[[0,1],[1,2],[1,3],[1,4]]},Y:{n:[[0,0],[1,1],[2,0],[1,2]],l:[[0,1],[1,2],[1,3]]},Z:{n:[[0,0],[1,0],[2,0],[1,1],[0,2],[1,2],[2,2]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]}};

const G4={A:{n:[[0,3],[0,2],[0,1],[1,0],[2,0],[3,1],[3,2],[3,3],[1,2],[2,2]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[1,8],[8,9],[9,6]]},B:{n:[[0,0],[0,1],[0,2],[0,3],[1,0],[2,0],[3,0],[3,1],[3,2],[2,2],[1,2],[3,3],[2,3],[1,3]],l:[[0,1],[1,2],[2,3],[0,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,2],[8,11],[11,12],[12,13],[13,3]]},C:{n:[[3,0],[2,0],[1,0],[0,1],[0,2],[1,3],[2,3],[3,3]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]]},D:{n:[[0,0],[0,1],[0,2],[0,3],[1,0],[2,0],[3,1],[3,2],[2,3],[1,3]],l:[[0,1],[1,2],[2,3],[0,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,3]]},E:{n:[[3,0],[2,0],[1,0],[0,0],[0,1],[0,2],[0,3],[1,3],[2,3],[3,3],[1,2],[2,2]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[5,10],[10,11]]},F:{n:[[3,0],[2,0],[1,0],[0,0],[0,1],[0,2],[0,3],[1,2],[2,2]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[5,7],[7,8]]},G:{n:[[3,0],[2,0],[1,0],[0,1],[0,2],[1,3],[2,3],[3,3],[3,2],[2,2]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9]]},H:{n:[[0,0],[0,1],[0,2],[0,3],[3,0],[3,1],[3,2],[3,3],[1,2],[2,2]],l:[[0,1],[1,2],[2,3],[4,5],[5,6],[6,7],[2,8],[8,9],[9,6]]},I:{n:[[0,0],[1,0],[2,0],[3,0],[2,1],[2,2],[0,3],[1,3],[2,3],[3,3]],l:[[0,1],[1,2],[2,3],[2,4],[4,5],[6,7],[7,8],[8,9],[5,8]]},J:{n:[[1,0],[2,0],[3,0],[3,1],[3,2],[2,3],[1,3],[0,2]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]]},K:{n:[[0,0],[0,1],[0,2],[0,3],[2,0],[3,0],[1,1],[2,3],[3,3]],l:[[0,1],[1,2],[2,3],[4,5],[5,6],[6,1],[2,6],[6,7],[7,8]]},L:{n:[[0,0],[0,1],[0,2],[0,3],[1,3],[2,3],[3,3]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]},M:{n:[[0,3],[0,2],[0,1],[0,0],[1,1],[2,1],[3,0],[3,1],[3,2],[3,3]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9]]},N:{n:[[0,3],[0,2],[0,1],[0,0],[1,1],[2,2],[3,3],[3,2],[3,1],[3,0]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9]]},O:{n:[[1,0],[2,0],[3,1],[3,2],[2,3],[1,3],[0,2],[0,1]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0]]},P:{n:[[0,3],[0,2],[0,1],[0,0],[1,0],[2,0],[3,1],[2,2],[1,2]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,2]]},Q:{n:[[1,0],[2,0],[3,1],[3,2],[2,3],[1,3],[0,2],[0,1],[2,2],[3,3]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[8,9]]},R:{n:[[0,3],[0,2],[0,1],[0,0],[1,0],[2,0],[3,1],[2,2],[1,2],[2,3],[3,3]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,2],[7,9],[9,10]]},S:{n:[[3,0],[2,0],[1,0],[0,0],[0,1],[1,1],[2,2],[3,2],[3,3],[2,3],[1,3],[0,3]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11]]},T:{n:[[0,0],[1,0],[2,0],[3,0],[2,1],[2,2],[2,3]],l:[[0,1],[1,2],[2,3],[2,4],[4,5],[5,6]]},U:{n:[[0,0],[0,1],[0,2],[1,3],[2,3],[3,2],[3,1],[3,0]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]]},V:{n:[[0,0],[0,1],[1,2],[2,3],[3,2],[3,1],[3,0]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]},W:{n:[[0,0],[0,1],[0,2],[0,3],[1,3],[2,2],[3,3],[3,2],[3,1],[3,0]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9]]},X:{n:[[0,0],[1,1],[2,2],[3,3],[3,0],[2,1],[1,2],[0,3]],l:[[0,1],[1,2],[2,3],[4,5],[5,6],[6,7]]},Y:{n:[[0,0],[1,1],[2,0],[3,0],[2,2],[2,3]],l:[[0,1],[2,3],[3,1],[1,4],[4,5]]},Z:{n:[[0,0],[1,0],[2,0],[3,0],[2,1],[1,2],[0,3],[1,3],[2,3],[3,3]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9]]}};

const G5={A:{n:[[0,4],[0,3],[0,2],[0,1],[1,0],[2,0],[3,0],[4,1],[4,2],[4,3],[4,4],[1,2],[2,2],[3,2]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[2,11],[11,12],[12,13],[13,8]]},B:{n:[[0,0],[0,1],[0,2],[0,3],[0,4],[1,0],[2,0],[3,0],[4,0],[4,1],[4,2],[3,2],[2,2],[1,2],[4,3],[4,4],[3,4],[2,4],[1,4]],l:[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,2],[10,14],[14,15],[15,16],[16,17],[17,18],[18,4]]},C:{n:[[4,0],[3,0],[2,0],[1,0],[0,1],[0,2],[0,3],[1,4],[2,4],[3,4],[4,4]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10]]},D:{n:[[0,0],[0,1],[0,2],[0,3],[0,4],[1,0],[2,0],[3,0],[4,1],[4,2],[4,3],[3,4],[2,4],[1,4]],l:[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,4]]},E:{n:[[4,0],[3,0],[2,0],[1,0],[0,0],[0,1],[0,2],[0,3],[0,4],[1,4],[2,4],[3,4],[4,4],[1,2],[2,2],[3,2]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[6,13],[13,14],[14,15]]},F:{n:[[4,0],[3,0],[2,0],[1,0],[0,0],[0,1],[0,2],[0,3],[0,4],[1,2],[2,2],[3,2]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[6,9],[9,10],[10,11]]},G:{n:[[4,0],[3,0],[2,0],[1,0],[0,1],[0,2],[0,3],[1,4],[2,4],[3,4],[4,4],[4,3],[4,2],[3,2]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13]]},H:{n:[[0,0],[0,1],[0,2],[0,3],[0,4],[4,0],[4,1],[4,2],[4,3],[4,4],[1,2],[2,2],[3,2]],l:[[0,1],[1,2],[2,3],[3,4],[5,6],[6,7],[7,8],[8,9],[2,10],[10,11],[11,12],[12,7]]},I:{n:[[1,0],[2,0],[3,0],[2,1],[2,2],[2,3],[1,4],[2,4],[3,4]],l:[[0,1],[1,2],[1,3],[3,4],[4,5],[6,7],[7,8],[5,7]]},J:{n:[[2,0],[3,0],[4,0],[4,1],[4,2],[4,3],[3,4],[2,4],[1,4],[0,3]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9]]},K:{n:[[0,0],[0,1],[0,2],[0,3],[0,4],[3,0],[4,0],[2,1],[1,2],[2,3],[3,4],[4,4]],l:[[0,1],[1,2],[2,3],[3,4],[5,6],[6,7],[7,8],[8,2],[8,9],[9,10],[10,11]]},L:{n:[[0,0],[0,1],[0,2],[0,3],[0,4],[1,4],[2,4],[3,4],[4,4]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8]]},M:{n:[[0,4],[0,3],[0,2],[0,1],[0,0],[1,1],[2,2],[3,1],[4,0],[4,1],[4,2],[4,3],[4,4]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12]]},N:{n:[[0,4],[0,3],[0,2],[0,1],[0,0],[1,1],[2,2],[3,3],[4,4],[4,3],[4,2],[4,1],[4,0]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12]]},O:{n:[[1,0],[2,0],[3,0],[4,1],[4,2],[4,3],[3,4],[2,4],[1,4],[0,3],[0,2],[0,1]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,0]]},P:{n:[[0,4],[0,3],[0,2],[0,1],[0,0],[1,0],[2,0],[3,0],[4,1],[3,2],[2,2],[1,2]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,2]]},Q:{n:[[1,0],[2,0],[3,0],[4,1],[4,2],[4,3],[3,4],[2,4],[1,4],[0,3],[0,2],[0,1],[3,3],[4,4]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,0],[12,13]]},R:{n:[[0,4],[0,3],[0,2],[0,1],[0,0],[1,0],[2,0],[3,0],[4,1],[3,2],[2,2],[1,2],[2,3],[3,4],[4,4]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,2],[9,12],[12,13],[13,14]]},S:{n:[[4,0],[3,0],[2,0],[1,0],[0,1],[1,2],[2,2],[3,2],[4,3],[3,4],[2,4],[1,4],[0,4]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12]]},T:{n:[[0,0],[1,0],[2,0],[3,0],[4,0],[2,1],[2,2],[2,3],[2,4]],l:[[0,1],[1,2],[2,3],[3,4],[2,5],[5,6],[6,7],[7,8]]},U:{n:[[0,0],[0,1],[0,2],[0,3],[1,4],[2,4],[3,4],[4,3],[4,2],[4,1],[4,0]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10]]},V:{n:[[0,0],[0,1],[0,2],[1,3],[2,4],[3,3],[4,2],[4,1],[4,0]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8]]},W:{n:[[0,0],[0,1],[0,2],[0,3],[1,4],[2,3],[3,4],[4,3],[4,2],[4,1],[4,0]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10]]},X:{n:[[0,0],[1,1],[2,2],[3,3],[4,4],[4,0],[3,1],[1,3],[0,4]],l:[[0,1],[1,2],[2,3],[3,4],[5,6],[6,2],[2,7],[7,8]]},Y:{n:[[0,0],[1,1],[2,2],[3,1],[4,0],[2,3],[2,4]],l:[[0,1],[1,2],[2,3],[3,4],[2,5],[5,6]]},Z:{n:[[0,0],[1,0],[2,0],[3,0],[4,0],[3,1],[2,2],[1,3],[0,4],[1,4],[2,4],[3,4],[4,4]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12]]}};

const GSETS = { 3: G3, 4: G4, 5: G5 };

// ═══════════════════════════════════════════════════════════════════════
// GRID + PLACER
// ═══════════════════════════════════════════════════════════════════════

class Grid {
  constructor(c, r) { this.c = c; this.r = r; this.n = c * r; this.isGlyph = new Uint8Array(this.n); }
  idx(c, r) { return r * this.c + c; }
}

class Placer {
  place(text, defs, gs, grid, margin, align) {
    grid.isGlyph.fill(0);
    const uC = grid.c - 2 * margin, uR = grid.r - 2 * margin;
    const links = [], wordMap = new Int32Array(grid.n).fill(-1), wb = [];
    let wi = 0, curR = 0;
    for (const line of text.split("\n")) {
      const words = line.toUpperCase().split(/\s+/).filter(Boolean);
      if (!words.length) { curR += gs + 1; continue; }
      const rows = []; let cg = [], cc = 0;
      for (const w of words) {
        const ww = w.length * (gs + 1) - 1;
        if (cg.length > 0 && cc + 2 + ww > uC) { rows.push({ w: cg, tw: cc }); cg = []; cc = 0; }
        if (cg.length > 0) cc += 2;
        cg.push({ w, sc: cc }); cc += ww;
      }
      if (cg.length) rows.push({ w: cg, tw: cc });
      for (const grp of rows) {
        if (curR + gs > uR) break;
        let off = 0;
        if (align === "center") off = Math.floor((uC - grp.tw) / 2);
        else if (align === "right") off = uC - grp.tw;
        for (const { w, sc } of grp.w) {
          const wIdx = [];
          for (let ci = 0; ci < w.length; ci++) {
            const g = defs[w[ci]]; if (!g) continue;
            const bC = margin + off + sc + ci * (gs + 1), bR = margin + curR;
            const ngi = [];
            for (const [gc, gr] of g.n) {
              const wc = bC + gc, wr = bR + gr;
              if (wc >= 0 && wc < grid.c && wr >= 0 && wr < grid.r) {
                const idx = grid.idx(wc, wr); grid.isGlyph[idx] = 1; wordMap[idx] = wi;
                ngi.push(idx); wIdx.push(idx);
              }
            }
            for (const [a, b] of g.l) if (a < ngi.length && b < ngi.length) links.push([ngi[a], ngi[b]]);
          }
          wb.push({ word: w, indices: wIdx }); wi++;
        }
        curR += gs + 1;
      }
    }
    return { links, wordMap, wb };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// EFFECTS — pixel-level blur + threshold on ImageData
// ═══════════════════════════════════════════════════════════════════════

class Effects {
  constructor() { this.grain = new LoopNoise(42); this.mod = new LoopNoise(137); }

  boxBlur(d, w, h, r) {
    if (r < 1) return;
    const tmp = new Float32Array(w * h);
    for (let y = 0; y < h; y++) { let s = 0, c = 0; for (let x = 0; x < Math.min(r, w); x++) { s += d[y*w+x]; c++; } for (let x = 0; x < w; x++) { if (x+r<w){s+=d[y*w+x+r];c++;} if(x-r-1>=0){s-=d[y*w+x-r-1];c--;} tmp[y*w+x]=s/c; } }
    for (let x = 0; x < w; x++) { let s = 0, c = 0; for (let y = 0; y < Math.min(r, h); y++) { s += tmp[y*w+x]; c++; } for (let y = 0; y < h; y++) { if (y+r<h){s+=tmp[(y+r)*w+x];c++;} if(y-r-1>=0){s-=tmp[(y-r-1)*w+x];c--;} d[y*w+x]=s/c; } }
  }

  blur(d, w, h, r) { const rr = Math.round(r); for (let i = 0; i < 3; i++) this.boxBlur(d, w, h, Math.round(rr / 3)); }

  process(src, w, h, tNorm, p) {
    const px = w * h, buf = new Float32Array(px);
    for (let i = 0; i < px; i++) buf[i] = src[i * 4] / 255;
    if (p.blur > 0) this.blur(buf, w, h, p.blur);
    if (p.grainAmt > 0) {
      const lr = p.loopR || 1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const mod = 1 + p.grainMod * this.mod.sample(x * 0.008, y * 0.008, tNorm, lr);
        buf[y*w+x] += this.grain.sample(x * p.grainScale, y * p.grainScale, tNorm, lr) * p.grainAmt * mod;
      }
    }
    for (let i = 0; i < px; i++) {
      const v = buf[i] <= p.thresh ? 255 : 0;
      src[i*4] = src[i*4+1] = src[i*4+2] = v; src[i*4+3] = 255;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// RENDERER — draws black dots/links on white canvas
// ═══════════════════════════════════════════════════════════════════════

class Renderer {
  constructor() { this.noise = new LoopNoise(99); }

  draw(ctx, grid, links, cW, cH, tNorm, p) {
    const cs = Math.min(cW, cH);
    const nodeR = p.nodeR * cs;
    const bgR = (p.uniformSize ? p.nodeR : p.bgR) * cs;
    const linkW = p.linkW * cs;
    const lr = p.loopR || 1;
    ctx.lineCap = "round"; ctx.globalAlpha = 1;

    // Compute luminosity for EVERY node: 0 = invisible, 1 = full black
    // This is the single source of truth. Same units as thresh.
    const lum = new Float32Array(grid.n);
    for (let i = 0; i < grid.n; i++) {
      if (grid.isGlyph[i]) {
        lum[i] = 1.0; // text = full black
      } else {
        let v = p.base;
        if (p.noiseAmp > 0) {
          const c = i % grid.c, r = (i / grid.c) | 0;
          v += p.noiseAmp * this.noise.sample(c * p.noiseFreq, r * p.noiseFreq, tNorm, lr);
        }
        lum[i] = Math.max(0, Math.min(1, v));
      }
    }

    // Edge darkening: painted as grey bands. Darkness = edgeA at edge, 0 at inner.
    if (p.edgeW > 0 && p.edgeA > 0) {
      const tw = grid.c * cW, th = grid.r * cH, band = p.edgeW * cs;
      for (let s = 0; s < Math.ceil(band); s++) {
        const f = 1 - s / band;
        const grey = Math.round(255 * (1 - f * p.edgeA));
        ctx.fillStyle = `rgb(${grey},${grey},${grey})`;
        ctx.fillRect(s, s, tw - 2 * s, 1);
        ctx.fillRect(s, th - 1 - s, tw - 2 * s, 1);
        ctx.fillRect(s, s, 1, th - 2 * s);
        ctx.fillRect(tw - 1 - s, s, 1, th - 2 * s);
      }
    }

    // Draw links: grey = 1-min(lumA,lumB). Only draw if both endpoints have lum > 0.
    ctx.lineWidth = linkW;
    for (const [a, b] of links) {
      const l = Math.min(lum[a], lum[b]);
      if (l < 0.005) continue;
      const grey = Math.round(255 * (1 - l));
      ctx.strokeStyle = `rgb(${grey},${grey},${grey})`;
      const ac = a % grid.c, ar = (a / grid.c) | 0;
      const bc = b % grid.c, br = (b / grid.c) | 0;
      ctx.beginPath();
      ctx.moveTo((ac + .5) * cW, (ar + .5) * cH);
      ctx.lineTo((bc + .5) * cW, (br + .5) * cH);
      ctx.stroke();
    }

    // Draw ALL nodes with their grey level
    for (let i = 0; i < grid.n; i++) {
      if (lum[i] < 0.005) continue;
      const c = i % grid.c, r = (i / grid.c) | 0;
      const x = (c + .5) * cW, y = (r + .5) * cH;
      const rad = grid.isGlyph[i] ? nodeR : bgR;
      const grey = Math.round(255 * (1 - lum[i]));
      ctx.fillStyle = `rgb(${grey},${grey},${grey})`;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, 6.2832);
      ctx.fill();
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// UI
// ═══════════════════════════════════════════════════════════════════════

const S = {
  sec: { fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.35, margin: "10px 0 4px", fontFamily: "inherit" },
  row: { display: "flex", flexWrap: "wrap", gap: "4px 10px", alignItems: "center" },
  sl: { display: "flex", flexDirection: "column", gap: 1, fontSize: 8, letterSpacing: "0.06em", textTransform: "uppercase", minWidth: 65 },
  btn: (on) => ({ fontFamily: "inherit", fontSize: 8, padding: "2px 8px", border: "1px solid rgba(128,128,128,0.3)", borderRadius: 3, cursor: "pointer", background: on ? "var(--color-text-primary)" : "transparent", color: on ? "var(--color-background-primary)" : "var(--color-text-secondary)" }),
};

function Sl({ label, value, min, max, step, onChange }) {
  return <label style={S.sl}>{label}: {Number.isInteger(step)?value:value.toFixed(step<0.01?3:2)}<input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))} style={{width:75}}/></label>;
}

// ═══════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════

export default function App() {
  const cvRef = useRef(null), engRef = useRef(null), tRef = useRef(0), playRef = useRef(true);
  const fxRef = useRef(new Effects()), rnRef = useRef(new Renderer());

  const [p, setP] = useState({
    // Layout
    divW: 500, divH: 350, cols: 34, rows: 22, margin: 1, gs: 5, align: "left",
    // Dots
    nodeR: 0.34, bgR: 0.06, linkW: 0.42, uniformSize: false, base: 0.03,
    // Noise (loopable)
    noiseAmp: 0.08, noiseFreq: 0.15, loopDur: 10, loopR: 1.2,
    // Edge
    edgeW: 2, edgeA: 0.4,
    // FX pipeline
    blur: 3, thresh: 0.42, grainAmt: 0.08, grainScale: 0.05, grainMod: 0.4,
    // Text
    text: "ART BLOG\nTOOL",
    filterOn: true, playing: true,
  });
  const set = useCallback((k, v) => setP(pr => ({ ...pr, [k]: v })), []);

  const cW = p.divW / p.cols, cH = p.divH / p.rows;

  const engine = useMemo(() => {
    const defs = GSETS[p.gs]; if (!defs) return null;
    const grid = new Grid(p.cols, p.rows);
    const { links, wordMap, wb } = new Placer().place(p.text, defs, p.gs, grid, p.margin, p.align);
    return { grid, links, wordMap, wb };
  }, [p.cols, p.rows, p.margin, p.gs, p.text, p.align]);

  useEffect(() => { engRef.current = engine; }, [engine]);
  useEffect(() => { playRef.current = p.playing; }, [p.playing]);

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const d = devicePixelRatio;
    cv.width = p.divW * d; cv.height = p.divH * d;
    cv.style.width = p.divW + "px"; cv.style.height = p.divH + "px";
  }, [p.divW, p.divH]);

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    let raf, lastT = performance.now();
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const eng = engRef.current; if (!eng) return;
      if (playRef.current) tRef.current += (now - lastT) / 1000;
      lastT = now;
      const tNorm = (tRef.current % p.loopDur) / p.loopDur; // 0→1 loop
      const d = devicePixelRatio;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.fillStyle = "white"; ctx.fillRect(0, 0, p.divW, p.divH);
      rnRef.current.draw(ctx, eng.grid, eng.links, cW, cH, tNorm, p);
      if (p.filterOn) {
        const img = ctx.getImageData(0, 0, cv.width, cv.height);
        const dprBlur = { ...p, blur: p.blur * d };
        fxRef.current.process(img.data, cv.width, cv.height, tNorm, dprBlur);
        ctx.putImageData(img, 0, 0);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [p, cW, cH]);

  const handleClick = useCallback((e) => {
    const cv = cvRef.current, eng = engRef.current; if (!cv || !eng) return;
    const rect = cv.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / cW);
    const row = Math.floor((e.clientY - rect.top) / cH);
    if (col < 0 || col >= p.cols || row < 0 || row >= p.rows) return;
    const wi = eng.wordMap[row * p.cols + col];
    if (wi >= 0) console.log("Click:", eng.wb[wi].word);
  }, [p.cols, p.rows, cW, cH]);

  const handleSave = useCallback(() => {
    const cv = cvRef.current; if (!cv) return;
    const link = document.createElement("a");
    link.download = "dotmatrix.png";
    link.href = cv.toDataURL("image/png");
    link.click();
  }, []);

  return (
    <div style={{ padding: 12, fontFamily: "'DM Mono',monospace" }}>
      <div style={{ ...S.row, marginBottom: 8 }}>
        <span style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.35 }}>Dot matrix</span>
        <div style={{ display: "flex", gap: 3 }}>{[3,4,5].map(r=><button key={r} onClick={()=>set("gs",r)} style={S.btn(p.gs===r)}>{r}×{r}</button>)}</div>
        <div style={{ display: "flex", gap: 3 }}>{["left","center","right"].map(a=><button key={a} onClick={()=>set("align",a)} style={S.btn(p.align===a)}>{a}</button>)}</div>
        <button onClick={()=>set("filterOn",!p.filterOn)} style={S.btn(p.filterOn)}>fx {p.filterOn?"on":"off"}</button>
        <button onClick={()=>set("playing",!p.playing)} style={S.btn(p.playing)}>{p.playing?"pause":"play"}</button>
        <button onClick={()=>set("uniformSize",!p.uniformSize)} style={S.btn(p.uniformSize)}>uniform dots</button>
        <button onClick={handleSave} style={S.btn(false)}>save png</button>
      </div>

      <div style={S.sec}>layout</div>
      <div style={S.row}>
        <Sl label="W" value={p.divW} min={200} max={1000} step={10} onChange={v=>set("divW",v)}/>
        <Sl label="H" value={p.divH} min={100} max={700} step={10} onChange={v=>set("divH",v)}/>
        <Sl label="Cols" value={p.cols} min={10} max={80} step={1} onChange={v=>set("cols",v)}/>
        <Sl label="Rows" value={p.rows} min={8} max={60} step={1} onChange={v=>set("rows",v)}/>
        <Sl label="Margin" value={p.margin} min={0} max={5} step={1} onChange={v=>set("margin",v)}/>
      </div>

      <div style={S.sec}>dots &amp; links</div>
      <div style={S.row}>
        <Sl label="Node R" value={p.nodeR} min={0.1} max={0.5} step={0.01} onChange={v=>set("nodeR",v)}/>
        {!p.uniformSize && <Sl label="Bg R" value={p.bgR} min={0.01} max={0.3} step={0.005} onChange={v=>set("bgR",v)}/>}
        <Sl label="Link W" value={p.linkW} min={0.05} max={0.8} step={0.01} onChange={v=>set("linkW",v)}/>
        <Sl label="Base" value={p.base} min={0} max={0.5} step={0.005} onChange={v=>set("base",v)}/>
      </div>

      <div style={S.sec}>noise (loopable)</div>
      <div style={S.row}>
        <Sl label="Amp" value={p.noiseAmp} min={0} max={0.5} step={0.005} onChange={v=>set("noiseAmp",v)}/>
        <Sl label="Freq" value={p.noiseFreq} min={0.01} max={1} step={0.01} onChange={v=>set("noiseFreq",v)}/>
        <Sl label="Loop s" value={p.loopDur} min={2} max={30} step={1} onChange={v=>set("loopDur",v)}/>
        <Sl label="Loop R" value={p.loopR} min={0.2} max={3} step={0.1} onChange={v=>set("loopR",v)}/>
      </div>

      <div style={S.sec}>edge</div>
      <div style={S.row}>
        <Sl label="Width" value={p.edgeW} min={0} max={10} step={1} onChange={v=>set("edgeW",v)}/>
        <Sl label="Strength" value={p.edgeA} min={0} max={1} step={0.01} onChange={v=>set("edgeA",v)}/>
      </div>

      <div style={S.sec}>fx pipeline (blur → threshold)</div>
      <div style={S.row}>
        <Sl label="Blur" value={p.blur} min={0} max={20} step={0.5} onChange={v=>set("blur",v)}/>
        <Sl label="Thresh" value={p.thresh} min={0.05} max={0.95} step={0.01} onChange={v=>set("thresh",v)}/>
        <Sl label="Grain" value={p.grainAmt} min={0} max={0.3} step={0.005} onChange={v=>set("grainAmt",v)}/>
        <Sl label="G.scale" value={p.grainScale} min={0.01} max={0.2} step={0.005} onChange={v=>set("grainScale",v)}/>
        <Sl label="G.mod" value={p.grainMod} min={0} max={1.5} step={0.01} onChange={v=>set("grainMod",v)}/>
      </div>

      <textarea value={p.text} onChange={e=>set("text",e.target.value)} rows={3}
        style={{ width: "100%", maxWidth: 500, padding: "4px 8px", marginTop: 8, marginBottom: 8, fontFamily: "inherit", fontSize: 10, border: "1px solid rgba(128,128,128,0.15)", borderRadius: 3, background: "transparent", color: "var(--color-text-primary)", outline: "none", resize: "vertical" }}/>

      <div style={{ width: p.divW, height: p.divH, overflow: "hidden", border: "1px solid rgba(128,128,128,0.1)", borderRadius: 4 }}>
        <canvas ref={cvRef} onClick={handleClick} style={{ display: "block", cursor: "pointer" }}/>
      </div>

      <div style={{ marginTop: 6, fontSize: 7, opacity: 0.2, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {p.divW}×{p.divH} · {p.cols}×{p.rows} · {p.gs}×{p.gs} · cell:{cW.toFixed(1)}×{cH.toFixed(1)} · loop:{p.loopDur}s
      </div>
    </div>
  );
}
