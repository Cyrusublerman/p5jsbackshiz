# Module Spec: bridge-vector-raster-compositor

## Label
`BRIDGE / VECTOR→RASTER COMPOSITOR`

## IO
- **Input**
  - base raster pixels
  - `LineSet`
  - stroke RGBA + width + opacity
  - optional mask
- **Output**
  - composited raster pixels (non-mutating)

## Options
- `strokeWidth` (default: 1)
- `opacity` (default: 1)
- `clearRGBA` optional
- `blendMode` (currently normal alpha-over)

## Functions
- `vectorToRaster(...)`
- `drawPoint(...)`
- `drawSegment(...)`
- `blendPoint(...)`

## Algorithms
- integer segment rasterization
- circular brush footprint for width > 1
- alpha-over compositing with mask-scaled alpha

## Existing/Target location
- Existing: `src/modules/bridge/node-adapters.js`
- Needs cleanup to remove duplicate/overlapping helper definitions and align strictly with adapter spec.
