# Module Spec: core-image-ingest-and-fit

## Label
`CORE / IMAGE INGEST + FIT`

## IO
- **Input**
  - DOM image / ImageBitmap / ImageAsset
  - target canvas dims `{width,height}`
  - `fitMode: contain|cover|stretch`
- **Output**
  - `MappedImage` (`image`, `fitMode`, `offsetX`, `offsetY`, `scaleX`, `scaleY`)
  - optional luma map (`Float32Array`)

## Options
- `fitMode` (default: `contain`)
- `sampleMode` (`nearest|bilinear`, default: `nearest`)
- `colorSpace` (default: `srgb`)

## Functions
- `createImageAsset(...)`
- `mapFitMode(...)`
- `remapImageAsset(...)`
- `toLumaMap(...)`
- `canvasToSource(...)`

## Algorithms
- aspect-preserving contain/cover mapping
- pixel remap with bounds clamp
- luminance transform (Rec.709 / configurable coefficients)

## Existing/Target location
- Existing: `src/modules/core/image-io.js`
- Extend with `canvasToSource` helper and optional bilinear remap path for parity.
