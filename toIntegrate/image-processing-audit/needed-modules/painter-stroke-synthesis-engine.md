# Module Spec: painter-stroke-synthesis-engine

## Label
`PAINTER / STROKE SYNTHESIS`

## IO
- **Input**: source image buffer, current canvas buffer, palette, optional weight map
- **Output**: updated raster buffer + layer stats/state

## Options
- `brushMinSize`, `brushMaxSize`
- `minOpacity`, `maxOpacity`
- `iterationsPerFrame`
- `maxAverageLayers`, `maxPixelLayers`

## Functions
- `paintStep(...)`
- `chooseBestPaletteColor(...)`
- `paintGradientStamp(...)`
- `updateLayerOccupancy(...)`
- `computeCompletionMetric(...)`

## Algorithms
- stochastic sample selection
- optional acceptance-rejection by weight map
- blend simulation error minimization
- radial alpha falloff painting

## Existing/Target location
- Existing: `src/modules/painter/brush-engine.js`, `layer-tracker.js`
- Extend with painter-specific strategy and occupancy cap helpers.
