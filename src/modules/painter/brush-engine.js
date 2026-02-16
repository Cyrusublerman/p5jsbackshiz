function blendPixel(out, i, color, alpha) {
  const a = (color[3] / 255) * alpha;
  const inv = 1 - a;
  out[i] = out[i] * inv + color[0] * a;
  out[i + 1] = out[i + 1] * inv + color[1] * a;
  out[i + 2] = out[i + 2] * inv + color[2] * a;
  out[i + 3] = Math.max(out[i + 3], 255 * a + out[i + 3] * inv);
}

export function paintStamp(pixels, width, height, x, y, color = [0, 0, 0, 255], radius = 2, hardness = 0.8) {
  const out = new Uint8ClampedArray(pixels);
  const rr = radius * radius;
  for (let oy = -radius; oy <= radius; oy++) {
    for (let ox = -radius; ox <= radius; ox++) {
      const d2 = ox * ox + oy * oy;
      if (d2 > rr) continue;
      const px = Math.round(x + ox);
      const py = Math.round(y + oy);
      if (px < 0 || py < 0 || px >= width || py >= height) continue;
      const t = Math.sqrt(d2) / radius;
      const alpha = t <= hardness ? 1 : Math.max(0, 1 - (t - hardness) / (1 - hardness));
      blendPixel(out, (py * width + px) * 4, color, alpha);
    }
  }
  return out;
}

export function paintPolyline(pixels, width, height, points, opts = {}) {
  let out = new Uint8ClampedArray(pixels);
  for (const p of points) out = paintStamp(out, width, height, p.x, p.y, opts.color, opts.radius, opts.hardness);
  return out;
}
