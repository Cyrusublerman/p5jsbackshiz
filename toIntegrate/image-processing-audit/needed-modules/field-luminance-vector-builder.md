# Module Spec: field-luminance-vector-builder

## Label
`FIELD / LUMINANCE + VECTOR MAP`

## IO
- **Input**: remapped image/luma map, dimensions
- **Output**: `VectorField` + auxiliary scalar channels (lum, mag, angle)

## Options
- `gradientKernel: sobel|scharr|central-diff` (default: central-diff)
- `normalizeVectors` (default: true)
- `edgeEpsilon` (default: small > 0)

## Functions
- `buildLuminanceField(...)`
- `buildGradientField(...)`
- `buildVectorField(...)`
- `sampleField(...)`

## Algorithms
- luminance extraction
- local gradient estimation
- magnitude/angle derivation
- nearest/bilinear vector sampling

## Existing/Target location
- Existing: `src/modules/field/vector-field.js`
- Extend with richer channel outputs used by luminance-distortion parity.
