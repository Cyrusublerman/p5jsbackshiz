# Module Spec: export-animation-recorder-and-encoder

## Label
`EXPORT / FRAME RECORDER + ENCODER`

## IO
- **Input**: frame raster stream + timing metadata
- **Output**: encoded animation artifact (GIF/WebM) + summary

## Options
- `fps`
- `frameCount`
- `dimensions`
- `format: gif|webm`

## Functions
- `recordFrame(...)`
- `isComplete(...)`
- `encodeGif(...)`
- `encodeWebm(...)`
- `buildRecordingSummary(...)`

## Algorithms
- deterministic frame capture timeline
- per-frame delay mapping from FPS
- encoder adapter abstraction per output format

## Existing/Target location
- Existing: `src/modules/export/timeline-recorder.js`
- Extend with concrete GIF/WebM encoding adapters in `src/modules/export/`.
