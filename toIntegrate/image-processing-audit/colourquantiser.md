# colourquantiser (`toIntegrate/colourquantiser`)

## Scope and runtime dependencies
- Primary implementation: `toIntegrate/colourquantiser/colourquantiser/src/script.js`.
- Runtime model: browser JS + Canvas2D (`ImageData`, `putImageData`, `getImageData`) + DOM controls.
- External dependency/capability used by processing path: loading a blue-noise texture image URL for stochastic thresholding.  

## Required modules/components inside the file

### 1) Color conversion module (`ColorSpaceConverter`)
**Mechanism**
- Converts between hex, sRGB, linear RGB, XYZ, and CIE LAB.
- Uses D65 white point and CIE epsilon/kappa thresholds.
- Caches repeated conversion requests in a map (keyed per conversion input tuple) to avoid redoing transform math during per-pixel loops.

**Functions and behaviors**
- `hexToRgb(hex)`: accepts 3/6-digit hex, normalizes invalid input to black.  
- `rgbToLab(r,g,b)`: sanitizes non-finite values, then applies sRGB→linear→XYZ→LAB.  
- `labToRgb(L,a,b)`: inverse path LAB→XYZ→linear→sRGB with clamping.
- Private helpers implement gamma transfer and 3x3 matrix transforms.

**Source anchors**: lines 14-164.

### 2) LAB math and search primitives
**Mechanism**
- `deltaE76`: Euclidean distance in LAB.
- Vector helpers + segment projection are used to evaluate whether 2-color mixing can better approximate a source point than nearest-solid color.
- `pickNearestInLargePalette`: O(N) nearest search in LAB.
- `findOppositeColor`: chooses directionally opposite palette vector around the target (cosine angle minimization).

**Source anchors**: lines 178-293.

### 3) Dither strategy selector
**Mechanism (`findDitherStrategy_NearestOpposite`)**
1. Find nearest color `C`.
2. Exit solid if perfect hit or palette too small.
3. Find opposite candidate `I`.
4. Project target onto segment `C-I`.
5. If projected point is closer than `C`, emit dither strategy with mixing weight; otherwise emit solid.

**Outputs**
- Solid: `{ type:'solid', idx1 }`
- Dither: `{ type:'dither', idx1, idx2, weight1 }`

**Source anchors**: lines 303-342.

### 4) Pixel kernels
#### `ditherNearestOppositeChecked(...)`
- For each pixel:
  - convert source RGB→LAB,
  - pick strategy,
  - tile blue-noise texture (`x%bnWidth`, `y%bnHeight`),
  - threshold noise value against `weight1` to choose palette color 1/2,
  - preserve source alpha channel.
- Falls back to non-dither kernel if blue-noise texture is missing.

#### `doNoDitherLargePalette(...)`
- For each pixel: nearest LAB palette lookup only, preserve alpha.

**Source anchors**: lines 347-416.

### 5) Pre-quantization adjustment module
#### `applyImageAdjustments(sourceImageData, adjustments)`
- Applies in this order per pixel:
  1. saturation (relative to luminance grayscale),
  2. contrast (around 0.5 pivot in normalized space),
  3. gamma correction (`1/gamma` exponent).
- Clamps and rounds channels to valid 8-bit range.

**Source anchors**: lines 421-435.

## Defaults, initialization, and capabilities

### Built-in defaults/state
- Initial file name: `image`.
- Initial custom palette: `['#000000', '#FFFFFF']`.
- Predefined palettes include 1bit/2bit/3bit/3bit-gray/NES/GameBoy/Primaries/Pastel/GGOST.
- Processing is disabled until required image resources are loaded.

**Source anchors**: lines 443-450, 490-519, 697-707.

### UI-coupled processing capabilities
- Image load into canvas and source buffer capture.
- Blue-noise texture load/parse into `ImageData`.
- Palette import from `.gpl` and plaintext hex formats.
- Eyedropper sampling from current preview image.
- Undo-to-preview and PNG export.

**Source anchors**: lines 565-572, 590-625, 630-686.

## End-to-end processing process (exact operational path)
1. App starts and builds UI references; hard-fails if core elements missing.  
2. Blue-noise texture async-load starts during initialization.  
3. User loads image -> canvas resized to native dimensions -> `originalImageData` captured.  
4. Any slider change recalculates `previewImageData` with `applyImageAdjustments`.  
5. On Process:
   - selected palette is resolved,
   - palette entries converted once to LAB,
   - dither or no-dither kernel runs across all pixels,
   - output is pushed via `putImageData`, then available to download.

**Source anchors**: lines 454-487, 575-587, 590-612, 674-677, 684-686.

## Limitations and operational notes
- Distance metric is CIE76 (not CIEDE2000), so high-chroma perceptual differences may be less accurate than modern metrics.
- Palette search is linear per pixel (`O(width*height*palette_size)`), partially mitigated by conversion caches.
- Dither quality depends on external blue-noise asset availability/CORS correctness.
- Dist build matches src in this project version.

## Breakdown for integration into the main tool (`src/modules/*` + node runtime)

### Target module decomposition
1. **Color science core**
   - Place/extend LAB conversion, delta metric, and palette preprocessing in `src/modules/color/color-science.js` and `src/modules/color/palette-quantizer.js`.
   - Keep conversion caching in module scope for per-frame reuse.

2. **Palette strategy layer**
   - Add a dedicated strategy module (e.g. `src/modules/color/dither-strategies.js`) for:
     - nearest lookup,
     - nearest+opposite candidate search,
     - projection/bracketing weight solve.

3. **Quantization kernel layer**
   - Keep image-wide kernels in `palette-quantizer.js`:
     - solid quantization kernel,
     - blue-noise threshold kernel.
   - Accept `ImageAsset`-style buffers and return `Uint8ClampedArray` output.

4. **Image adjustment pre-pass**
   - Move gamma/contrast/saturation to `src/modules/color/` preprocessor utility so it can be reused by existing color nodes.

5. **Node adapters for runtime compatibility**
   - Wrap kernels in `EffectNode` subclasses under `src/nodes/colour/` (or extend existing `QuantiseNode`/`DitherNode`) so they preserve:
     - node `paramDefs`,
     - mask/modulation behavior,
     - recipe serialization.

6. **Schema and UI wiring**
   - Define canonical params in `src/modules/core/param-schema.js`, then map to UI controls through existing tool panel plumbing.

7. **I/O and export boundaries**
   - Use `src/modules/core/image-io.js` for fit/remap/luma helpers.
   - Keep PNG export in existing export path (`src/modules/export/raster-exporter.js` / UI export actions).

### Recommended migration sequence
1. Port color math + nearest quantizer first (deterministic baseline).  
2. Add blue-noise dithering strategy module.  
3. Wrap in `QuantiseNode` engine toggle (`module-lab` style).  
4. Move palette-file parsing + eyedropper utilities behind UI layer (not core kernels).  
5. Add regression tests against known image/palette fixtures.
