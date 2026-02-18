const LUMA_R = 0.299;
const LUMA_G = 0.587;
const LUMA_B = 0.114;

export function mapFitMode(srcW, srcH, dstW, dstH, mode = 'contain') {
  if (srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0) {
    throw new Error('mapFitMode requires positive dimensions');
  }

  const srcRatio = srcW / srcH;
  const dstRatio = dstW / dstH;
  let scaleX = dstW / srcW;
  let scaleY = dstH / srcH;

  if (mode === 'contain') {
    const s = srcRatio > dstRatio ? scaleX : scaleY;
    scaleX = s;
    scaleY = s;
  } else if (mode === 'cover') {
    const s = srcRatio > dstRatio ? scaleY : scaleX;
    scaleX = s;
    scaleY = s;
  } else if (mode !== 'stretch') {
    throw new Error(`Unsupported fit mode: ${mode}`);
  }

  const mappedW = srcW * scaleX;
  const mappedH = srcH * scaleY;
  return {
    fitMode: mode,
    scaleX,
    scaleY,
    mappedWidth: mappedW,
    mappedHeight: mappedH,
    offsetX: (dstW - mappedW) * 0.5,
    offsetY: (dstH - mappedH) * 0.5
  };
}

export function createImageAsset(pixels, width, height, meta = {}) {
  return {
    pixels: pixels instanceof Uint8ClampedArray ? new Uint8ClampedArray(pixels) : new Uint8ClampedArray(pixels || []),
    width,
    height,
    colorSpace: meta.colorSpace || 'srgb',
    source: meta.source || 'unknown'
  };
}

export function canvasToSource(map, canvasX, canvasY, srcW, srcH) {
  if (canvasX < map.offsetX || canvasX > map.offsetX + map.mappedWidth || canvasY < map.offsetY || canvasY > map.offsetY + map.mappedHeight) {
    return null;
  }
  const u = (canvasX - map.offsetX) / Math.max(1e-8, map.mappedWidth);
  const v = (canvasY - map.offsetY) / Math.max(1e-8, map.mappedHeight);
  return {
    x: Math.max(0, Math.min(srcW - 1, u * (srcW - 1))),
    y: Math.max(0, Math.min(srcH - 1, v * (srcH - 1)))
  };
}

function bilinearSample(pixels, width, height, x, y) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const x0 = Math.floor(clamp(x, 0, width - 1));
  const y0 = Math.floor(clamp(y, 0, height - 1));
  const x1 = clamp(x0 + 1, 0, width - 1);
  const y1 = clamp(y0 + 1, 0, height - 1);
  const tx = x - x0;
  const ty = y - y0;

  const at = (xx, yy) => {
    const i = (yy * width + xx) * 4;
    return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
  };

  const a = at(x0, y0), b = at(x1, y0), c = at(x0, y1), d = at(x1, y1);
  const mix = (u, v, t) => u + (v - u) * t;
  return [
    mix(mix(a[0], b[0], tx), mix(c[0], d[0], tx), ty),
    mix(mix(a[1], b[1], tx), mix(c[1], d[1], tx), ty),
    mix(mix(a[2], b[2], tx), mix(c[2], d[2], tx), ty),
    mix(mix(a[3], b[3], tx), mix(c[3], d[3], tx), ty)
  ];
}

export function remapImageAsset(asset, dstW, dstH, mode = 'contain', sampleMode = 'nearest') {
  const map = mapFitMode(asset.width, asset.height, dstW, dstH, mode);
  const out = new Uint8ClampedArray(dstW * dstH * 4);

  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      const src = canvasToSource(map, x, y, asset.width, asset.height);
      const di = (y * dstW + x) * 4;
      if (!src) {
        out[di] = 0; out[di + 1] = 0; out[di + 2] = 0; out[di + 3] = 0;
        continue;
      }

      if (sampleMode === 'bilinear') {
        const c = bilinearSample(asset.pixels, asset.width, asset.height, src.x, src.y);
        out[di] = c[0]; out[di + 1] = c[1]; out[di + 2] = c[2]; out[di + 3] = c[3];
      } else {
        const xi = Math.round(src.x);
        const yi = Math.round(src.y);
        const si = (yi * asset.width + xi) * 4;
        out[di] = asset.pixels[si];
        out[di + 1] = asset.pixels[si + 1];
        out[di + 2] = asset.pixels[si + 2];
        out[di + 3] = asset.pixels[si + 3];
      }
    }
  }

  return { image: createImageAsset(out, dstW, dstH, { colorSpace: asset.colorSpace, source: asset.source }), ...map };
}

export function toLumaMap(pixels) {
  const out = new Float32Array(pixels.length >> 2);
  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    out[p] = pixels[i] * LUMA_R + pixels[i + 1] * LUMA_G + pixels[i + 2] * LUMA_B;
  }
  return out;
}
