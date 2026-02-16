function pathFromLine(line) {
  if (!line?.length) return '';
  return `M ${line.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L ')}`;
}

export function exportLineSetToSVG(lineSet, width, height, { stroke = 'black', strokeWidth = 1 } = {}) {
  const paths = (lineSet.lines || []).map(pathFromLine).filter(Boolean).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><path d="${paths}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}"/></svg>`;
}

export function validateSVG(svg) {
  return svg.startsWith('<svg') && svg.includes('</svg>') && svg.includes('<path');
}
