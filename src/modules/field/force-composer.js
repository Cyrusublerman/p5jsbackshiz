export function composeForces(fields, { normalize = false, clamp = null } = {}) {
  if (!fields?.length) return { width: 0, height: 0, vectors: new Float32Array(0) };
  const { width, height } = fields[0].field;
  const len = width * height * 2;
  const out = new Float32Array(len);

  for (const entry of fields) {
    const weight = entry.weight ?? 1;
    for (let i = 0; i < len; i++) out[i] += entry.field.vectors[i] * weight;
  }

  for (let i = 0; i < len; i += 2) {
    let x = out[i];
    let y = out[i + 1];
    if (normalize) {
      const d = Math.hypot(x, y) || 1;
      x /= d;
      y /= d;
    }
    if (clamp != null) {
      x = Math.max(-clamp, Math.min(clamp, x));
      y = Math.max(-clamp, Math.min(clamp, y));
    }
    out[i] = x;
    out[i + 1] = y;
  }

  return { width, height, vectors: out };
}
