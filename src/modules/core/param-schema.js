const TYPE_COERCERS = {
  range: (v, f) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return f.default;
    return Math.min(f.max, Math.max(f.min, n));
  },
  select: (v, f) => (f.options || []).includes(v) ? v : f.default,
  toggle: (v) => Boolean(v),
  color: (v, f) => {
    const s = String(v || '').trim();
    const m = s.match(/^#?([0-9a-fA-F]{6})$/);
    return m ? `#${m[1].toLowerCase()}` : f.default;
  },
  file: (v) => v ?? null,
  button: () => null
};

export function resolveAliases(schema, input = {}) {
  const out = { ...input };
  for (const [legacy, next] of Object.entries(schema.aliases || {})) {
    if (legacy in out && !(next in out)) out[next] = out[legacy];
  }
  return out;
}

export function coerceParams(schema, input = {}, opts = {}) {
  const resolved = resolveAliases(schema, input);
  const out = {};
  for (const [key, field] of Object.entries(schema.fields || {})) {
    const raw = key in resolved ? resolved[key] : field.default;
    const fn = TYPE_COERCERS[field.type] || ((v) => v);
    out[key] = fn(raw, field);
  }
  if (opts.passthrough) {
    for (const [k, v] of Object.entries(resolved)) {
      if (!(k in out)) out[k] = v;
    }
  }
  return out;
}

export function validateSchema(schema) {
  if (!schema || schema.version !== 1 || typeof schema.fields !== 'object') {
    throw new Error('Invalid schema v1');
  }
  for (const [name, field] of Object.entries(schema.fields)) {
    if (!field.type) throw new Error(`Field ${name} missing type`);
    if (field.type === 'range' && !(Number.isFinite(field.min) && Number.isFinite(field.max))) {
      throw new Error(`Field ${name} range requires min/max`);
    }
  }
}

export function serializeParams(schema, params = {}) {
  validateSchema(schema);
  const coerced = coerceParams(schema, params);
  const ordered = {};
  for (const key of Object.keys(schema.fields)) ordered[key] = coerced[key];
  return JSON.stringify({ version: schema.version, values: ordered });
}

export function deserializeParams(schema, text) {
  validateSchema(schema);
  const payload = JSON.parse(text);
  if (payload.version !== schema.version) throw new Error(`Version mismatch ${payload.version} !== ${schema.version}`);
  return coerceParams(schema, payload.values || {});
}
