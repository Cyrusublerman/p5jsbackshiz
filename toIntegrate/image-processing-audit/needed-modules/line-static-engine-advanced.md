# Module Spec: line-static-engine-advanced

## Label
`LINE / STATIC DISPLACEMENT`

## IO
- **Input**: luma field + static line params
- **Output**: displaced `LineSet`

## Options
- `lineSpacing`, `sampleStep`
- `maxAmplitude`, `frequency`
- `phaseOffset`, `phaseIncrement`
- `ampCurve: linear|exp|log|sigmoid`

## Functions
- `buildStaticLines(...)`
- `applyStaticDisplacement(...)`
- `curveMap(...)`

## Algorithms
- regular line scaffold generation
- luminance→amplitude mapping
- sinusoidal displacement with phase offsets

## Existing/Target location
- Existing: `src/modules/line/static-line-engine.js`
- Extend curve options and luminance inversion parity.
