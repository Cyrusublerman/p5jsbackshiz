# Module Spec: line-flow-wavefront-engine

## Label
`LINE / FLOW WAVEFRONT`

## IO
- **Input**: vector/luma field, seeds/spawn config, drag config
- **Output**: `LineSet` (active/front/all) + completion flags

## Options
- `lineSpacing`, `sampleStep`, `baseSpeed`
- `phaseIncrement`, `oscAmplitude`, `oscFrequency`
- `stopSpawnFrame`, `padding`

## Functions
- `initFlowWavefrontState(...)`
- `spawnWavefront(...)`
- `updateWavefront(...)`
- `advanceFlowEngine(...)`
- `getDrawableLines(...)`

## Algorithms
- periodic front spawning
- per-point luminance drag advection
- front lifecycle GC/compaction
- progress-gated drawable extraction

## Existing/Target location
- Existing: `src/modules/line/flow-line-engine.js`, `front-propagation-core.js`
- Extend to full wavefront semantics from index/luminance tools.
