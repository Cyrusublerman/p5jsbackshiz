export function buildVectorOverlay(field, step = 16, scale = 1) {
  const arrows = [];
  for (let y = 0; y < field.height; y += step) {
    for (let x = 0; x < field.width; x += step) {
      const i = (y * field.width + x) * 2;
      arrows.push({ x, y, vx: field.vectors[i] * scale, vy: field.vectors[i + 1] * scale });
    }
  }
  return arrows;
}

export function buildDebugOverlayState({ showField = false, showOrigins = false, showProbes = false } = {}) {
  return { showField, showOrigins, showProbes };
}

export function shouldRenderOverlayForExport(isExportMode) {
  return !isExportMode;
}
