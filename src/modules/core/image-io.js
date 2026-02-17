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

export function remapImageAsset(asset, dstW, dstH, mode = 'contain') {
  const map = mapFitMode(asset.width, asset.height, dstW, dstH, mode);
  const out = new Uint8ClampedArray(dstW * dstH * 4);

  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      const srcX = (x - map.offsetX) / map.scaleX;
      const srcY = (y - map.offsetY) / map.scaleY;
      const xi = Math.max(0, Math.min(asset.width - 1, Math.round(srcX)));
      const yi = Math.max(0, Math.min(asset.height - 1, Math.round(srcY)));
      const si = (yi * asset.width + xi) * 4;
      const di = (y * dstW + x) * 4;
      out[di] = asset.pixels[si];
      out[di + 1] = asset.pixels[si + 1];
      out[di + 2] = asset.pixels[si + 2];
      out[di + 3] = asset.pixels[si + 3];
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
