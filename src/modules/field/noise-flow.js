function fract(x) { return x - Math.floor(x); }
function hash(x, y, seed) { return fract(Math.sin(x * 127.1 + y * 311.7 + seed * 91.7) * 43758.5453123); }
function smoothstep(t) { return t * t * (3 - 2 * t); }

function valueNoise2(x, y, seed) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = x0 + 1, y1 = y0 + 1;
  const tx = smoothstep(x - x0), ty = smoothstep(y - y0);

  const a = hash(x0, y0, seed);
  const b = hash(x1, y0, seed);
  const c = hash(x0, y1, seed);
  const d = hash(x1, y1, seed);

  const ab = a + (b - a) * tx;
  const cd = c + (d - c) * tx;
  return ab + (cd - ab) * ty;
}

export function buildNoiseFlow(width, height, { scale = 0.04, strength = 1, seed = 1, curl = 1 } = {}) {
  const vectors = new Float32Array(width * height * 2);

  const sample = (x, y) => valueNoise2(x * scale, y * scale, seed);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // approximate curl of scalar field: [dN/dy, -dN/dx]
      const e = 1;
      const dx = sample(x + e, y) - sample(x - e, y);
      const dy = sample(x, y + e) - sample(x, y - e);
      const vx = dy * curl;
      const vy = -dx * curl;
      const d = Math.hypot(vx, vy) || 1;
      const i = (y * width + x) * 2;
      vectors[i] = (vx / d) * strength;
      vectors[i + 1] = (vy / d) * strength;
    }
  }

  return { width, height, vectors };
}
