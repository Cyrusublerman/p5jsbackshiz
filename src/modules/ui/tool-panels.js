import { coerceParams } from '../core/param-schema.js';

export function buildToolPanelState(schema, rawValues = {}, legacyControlMap = {}) {
  const remapped = {};
  for (const [key, value] of Object.entries(rawValues)) {
    remapped[legacyControlMap[key] || key] = value;
  }
  return {
    schemaVersion: schema.version,
    values: coerceParams(schema, remapped),
    controls: Object.entries(schema.fields).map(([id, field]) => ({ id, type: field.type, label: field.label || id }))
  };
}

export function mapLegacyControlId(id, map = {}) {
  return map[id] || id;
}
