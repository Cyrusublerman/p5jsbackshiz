function clampByte(v) {
  return Math.max(0, Math.min(255, v));
}

function blendPoint(out, width, height, x, y, strokeRGBA, opacity, mask) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;

  const i = (y * width + x) * 4;
  const maskAlpha = mask ? (mask[y * width + x] / 255) : 1;
  const srcA = Math.max(0, Math.min(1, (strokeRGBA[3] / 255) * opacity * maskAlpha));
  const inv = 1 - srcA;

  out[i] = clampByte(out[i] * inv + strokeRGBA[0] * srcA);
  out[i + 1] = clampByte(out[i + 1] * inv + strokeRGBA[1] * srcA);
  out[i + 2] = clampByte(out[i + 2] * inv + strokeRGBA[2] * srcA);
  out[i + 3] = clampByte(255 * srcA + out[i + 3] * inv);
}

function drawPoint(out, width, height, x, y, strokeRGBA, opacity, mask, strokeWidth = 1) {
  const xi = Math.round(x);
  const yi = Math.round(y);
  const sw = Math.max(1, Math.round(strokeWidth || 1));

  if (sw <= 1) {
    blendPoint(out, width, height, xi, yi, strokeRGBA, opacity, mask);
    return;
  }

  const r = Math.floor(sw / 2);
  for (let oy = -r; oy <= r; oy++) {
    for (let ox = -r; ox <= r; ox++) {
      if ((ox * ox + oy * oy) > (r * r + 0.01)) continue;
      blendPoint(out, width, height, xi + ox, yi + oy, strokeRGBA, opacity, mask);
    }
  }
}

function drawSegment(out, width, height, a, b, strokeRGBA, opacity, mask, strokeWidth = 1) {
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
    drawPoint(out, width, height, x0, y0, strokeRGBA, opacity, mask, strokeWidth);
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
  strokeWidth = 1,
  opacity = 1,
  mask = null,
  clearRGBA = null
}) {
  const out = clearRGBA
    ? new Uint8ClampedArray(width * height * 4)
    : new Uint8ClampedArray(basePixels);

  if (clearRGBA) {
    for (let i = 0; i < out.length; i += 4) {
      out[i] = clearRGBA[0];
      out[i + 1] = clearRGBA[1];
      out[i + 2] = clearRGBA[2];
      out[i + 3] = clearRGBA[3] ?? 255;
    }
  }

  for (const line of lines || []) {
    if (!line?.length) continue;
    drawPoint(out, width, height, line[0].x, line[0].y, strokeRGBA, opacity, mask, strokeWidth);
    for (let i = 1; i < line.length; i++) {
      drawSegment(out, width, height, line[i - 1], line[i], strokeRGBA, opacity, mask, strokeWidth);
    }
  }

  return out;
}
