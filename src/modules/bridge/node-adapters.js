function drawPoint(out, width, height, x, y, strokeRGBA, opacity, mask) {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi < 0 || yi < 0 || xi >= width || yi >= height) return;

  const i = (yi * width + xi) * 4;
  const maskAlpha = mask ? (mask[yi * width + xi] / 255) : 1;
  const srcA = (strokeRGBA[3] / 255) * opacity * maskAlpha;
  const inv = 1 - srcA;

  out[i] = out[i] * inv + strokeRGBA[0] * srcA;
  out[i + 1] = out[i + 1] * inv + strokeRGBA[1] * srcA;
  out[i + 2] = out[i + 2] * inv + strokeRGBA[2] * srcA;
  out[i + 3] = Math.max(out[i + 3], 255 * srcA + out[i + 3] * inv);
}

function drawSegment(out, width, height, a, b, strokeRGBA, opacity, mask) {
  let x0 = Math.round(a.x);
  let y0 = Math.round(a.y);
  const x1 = Math.round(b.x);
  const y1 = Math.round(b.y);

  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  while (true) {
    drawPoint(out, width, height, x0, y0, strokeRGBA, opacity, mask);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

export function vectorToRaster({
  basePixels,
  width,
  height,
  lines,
  strokeRGBA = [0, 0, 0, 255],
  opacity = 1,
  mask = null
}) {
  const out = new Uint8ClampedArray(basePixels);
  for (const line of lines || []) {
    if (!line?.length) continue;
    drawPoint(out, width, height, line[0].x, line[0].y, strokeRGBA, opacity, mask);
    for (let i = 1; i < line.length; i++) {
      drawSegment(out, width, height, line[i - 1], line[i], strokeRGBA, opacity, mask);
    }
  }
  return out;
}
