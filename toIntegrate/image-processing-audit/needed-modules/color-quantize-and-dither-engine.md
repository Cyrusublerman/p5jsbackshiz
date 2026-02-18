# Module Spec: color-quantize-and-dither-engine

## Label
`COLOR / QUANTIZE + DITHER`

## IO
- **Input**
  - `ImageAsset` / RGBA buffer
  - palette table
  - optional blue-noise texture
- **Output**
  - quantized `Uint8ClampedArray` preserving alpha

## Options
- `engine: nearest|nearest-opposite`
- `dither: none|blue-noise|floyd-steinberg`
- `blueNoiseTiling: repeat`
- `fallbackOnMissingBlueNoise` (default: true)

## Functions
- `quantizeImage(...)`
- `findNearestPaletteIndex(...)`
- `findOppositePaletteIndex(...)`
- `projectOntoSegment(...)`
- `chooseDitherStrategy(...)`
- `applyBlueNoiseDither(...)`

## Algorithms
- LAB nearest-neighbor palette quantization
- nearest+opposite bracketing strategy
- threshold dithering with tiled blue noise
- optional error-diffusion fallback

## Existing/Target location
- Existing: `src/modules/color/palette-quantizer.js`
- Extend with nearest-opposite strategy + blue-noise kernel.
