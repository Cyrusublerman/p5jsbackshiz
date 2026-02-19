# Module Spec: shader-worker-compositor-engine

## Label
`SHADER / WORKER COMPOSITOR`

## IO
- **Input**: image bitmaps/textures + effect params + timing/zoom events
- **Output**: rendered frame stream (offscreen canvas or raster buffer)

## Options
- `effect: passthrough|crossfade|multiply|difference`
- `exposure`, `gamma`
- `fps`
- `zoom {scale, panX, panY}`
- `maxShortSide` resample threshold

## Functions
- `compileProgram(...)`
- `setUniform(...)`
- `loadImages(...)`
- `renderFrame(...)`
- `handleWorkerMessage(...)`

## Algorithms
- dual-texture fragment compositing
- tone mapping (exposure + gamma)
- frame-indexed source selection
- optional CPU fallback when GL unavailable

## Existing/Target location
- Existing skeletons: `src/modules/shader/gl-kernel-runtime.js`, `worker-animation-driver.js`
- Needs full concrete GL worker backend for tile2 parity.
