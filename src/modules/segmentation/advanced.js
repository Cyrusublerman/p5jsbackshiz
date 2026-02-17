export function regionGrow(luma, w, h, seedX, seedY, threshold = 8) {
  const seed = luma[seedY * w + seedX];
  const out = new Uint8Array(w * h);
  const q = [[seedX, seedY]];
  out[seedY * w + seedX] = 1;
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      const i = yy * w + xx;
      if (out[i]) continue;
      if (Math.abs(luma[i] - seed) <= threshold) { out[i] = 1; q.push([xx, yy]); }
    }
  }
  return out;
}

export function kmeans1D(values, k = 2, iters = 10) {
  let centers = Array.from({ length: k }, (_, i) => (255 * i) / Math.max(1, k - 1));
  const labels = new Uint8Array(values.length);
  for (let t = 0; t < iters; t++) {
    for (let i = 0; i < values.length; i++) {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = Math.abs(values[i] - centers[c]);
        if (d < bestD) { bestD = d; best = c; }
      }
      labels[i] = best;
    }
    const sum = new Float32Array(k), cnt = new Uint32Array(k);
    for (let i = 0; i < values.length; i++) { sum[labels[i]] += values[i]; cnt[labels[i]]++; }
    for (let c = 0; c < k; c++) if (cnt[c]) centers[c] = sum[c] / cnt[c];
  }
  return { labels, centers };
}

export function watershedLite(luma, w, h) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const c = luma[i];
      const rx = x < w - 1 ? luma[i + 1] : c;
      const dy = y < h - 1 ? luma[i + w] : c;
      out[i] = Math.abs(rx - c) + Math.abs(dy - c) > 18 ? 1 : 0;
    }
  }
  return out;
}

export function otsuThreshold(luma) {
  const hist = new Uint32Array(256);
  for (let i = 0; i < luma.length; i++) hist[luma[i]]++;

  let bestT = 0;
  let bestVar = 0;
  let w0 = 0;
  let sum0 = 0;
  let sumTotal = 0;

  for (let i = 0; i < 256; i++) sumTotal += i * hist[i];
  for (let t = 0; t < 256; t++) {
    w0 += hist[t];
    if (w0 === 0) continue;
    const w1 = luma.length - w0;
    if (w1 === 0) break;
    sum0 += t * hist[t];
    const m0 = sum0 / w0;
    const m1 = (sumTotal - sum0) / w1;
    const v = w0 * w1 * (m0 - m1) * (m0 - m1);
    if (v > bestVar) {
      bestVar = v;
      bestT = t;
    }
  }
  return bestT;
}
