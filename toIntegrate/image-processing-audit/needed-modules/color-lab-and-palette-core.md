# Module Spec: color-lab-and-palette-core

## Label
`COLOR / LAB CORE`

## IO
- **Input**: RGB/HEX/palette arrays
- **Output**: LAB tuples, prepared palette tables, distance metrics

## Options
- `distanceMetric: deltaE76|deltaE00` (default: `deltaE00` for module path)
- `cacheEnabled` (default: true)
- `whitePoint` (default: D65)

## Functions
- `hexToRgb(...)`
- `rgbToLab(...)`
- `labToRgb(...)`
- `deltaE(...)`
- `preparePalette(...)`

## Algorithms
- sRGB↔linear gamma transfer
- XYZ matrix transforms
- CIE LAB conversion
- palette precomputation + cache map

## Existing/Target location
- Existing: `src/modules/color/color-science.js`
- Extend with project-parity helper set from colourquantiser source.
