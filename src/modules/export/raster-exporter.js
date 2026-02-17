export function exportRaster(result) {
  return {
    width: result.width,
    height: result.height,
    pixels: new Uint8ClampedArray(result.pixels)
  };
}

export function rasterChecksum(raster) {
  let h = 2166136261;
  for (let i = 0; i < raster.pixels.length; i++) {
    h ^= raster.pixels[i];
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
