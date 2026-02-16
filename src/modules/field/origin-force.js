export function buildOriginForce(width, height, {
  originX = 0.5,
  originY = 0.5,
  strength = 1,
  mode = 'attract',
  falloff = 1
} = {}) {
  const ox = originX * (width - 1);
  const oy = originY * (height - 1);
  const vectors = new Float32Array(width * height * 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = ox - x;
      const dy = oy - y;
      const d = Math.hypot(dx, dy) || 1;
      const dir = mode === 'repel' ? -1 : 1;
      const s = strength / Math.max(1, d ** falloff);
      const i = (y * width + x) * 2;
      vectors[i] = (dx / d) * s * dir;
      vectors[i + 1] = (dy / d) * s * dir;
    }
  }

  return { width, height, vectors };
}
