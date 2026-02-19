# paint-image (`toIntegrate/paint-image`)

## Scope and dependencies
- Source analyzed: `toIntegrate/paint-image/paint-image/src/script.js`.
- Runtime dependency: p5.js draw loop + Canvas2D drawing context (`drawingContext`).
- Optional processing input: weight-map image (grayscale acceptance mask).

## Modules, defaults, and capabilities

### Global config module (`config`)
Defaults:
- Brush size range: 10..50 px.
- Opacity range: 10..50 (out of 255).
- Iterations per frame: 20.
- Completion controls: average layers `15`, per-pixel layers `20`.
- Palette: empty until UI input parse.

Source anchors: lines 5-14.

### `Painter`
#### Responsibilities
- Owns simulation lifecycle (`isActive`, frame-driven updates).
- Resizes canvas to source image size.
- Drives stochastic stroke placement.

#### Key functions
- `init(img)`
  - Resizes canvas to source resolution.
  - Loads source pixels.
  - Resizes/loads weight-map pixels when present.
  - Resets layer tracker and visual state.
- `update()`
  - Computes average layer density.
  - Stops when threshold reached.
  - Runs `iterationsPerFrame` painting steps.
- `paintStep()`
  - Randomly samples x/y.
  - Optionally rejects sample according to weight-map pixel intensity.
  - Reads source pixel + current canvas pixel.
  - Chooses best palette color under simulated alpha blend.
  - Paints gradient brush and increments layer occupancy.
- `findBestColor(current,target)`
  - For each palette entry, predicts blended RGB outcome via `lerp` and minimizes squared RGB error to source target.

Source anchors: lines 48-143.

### `GradientBrush`
- Draws radial falloff stroke in Canvas2D:
  - center: selected palette color with chosen opacity,
  - edge: same RGB at alpha=0.
- Produces soft additive layering behavior.

Source anchors: lines 146-161.

### `LayerTracker`
- `grid` stores local layer counts in float array.
- `addLayer` increments local region proportional to brush size.
- `getPixelLayers` enforces hard overpaint cap.
- `getAverageLayers` estimates progress from stroke count * average brush area / canvas area.

Source anchors: lines 164-197.

### `UIManager`
- Binds upload controls for source and weight map.
- Parses comma-separated palette string into runtime palette.
- Supports pause/reset/save behavior.

Source anchors: lines 200-290.

## Processing mechanisms and data flow
1. Setup creates default canvas and initializes painter/UI.  
2. Source image load triggers `Painter.init` and pixel cache creation.  
3. Each animation frame, painter runs batched Monte-Carlo paint steps.  
4. Each step picks a location, optionally accepts by weight map, then computes best palette stroke approximation against source pixel.  
5. Gradient stroke compositing accumulates toward source appearance until layer-density completion criterion.

## What the tool does (capability summary)
- Converts an input image into a painterly reconstruction using repeated translucent radial strokes from a restricted palette.
- Supports spatial importance weighting (weight map), speed/quality trade-offs (`iterationsPerFrame`, brush ranges), and output export.

## Limits/assumptions
- Color error metric is RGB squared distance (not perceptual LAB).
- Current canvas pixel reads (`get(x,y)`) can be expensive at large resolutions.
- Quality is stochastic and depends on palette suitability and step budget.

## Breakdown for integration into the main tool (`src/modules/*` + node runtime)

### Target module decomposition
1. **Brush kernel module**
   - Keep radial stamp/falloff in `src/modules/painter/brush-engine.js` (`paintStamp`/`paintPolyline` path).
   - Extend to support gradient-center + alpha profile equivalent to current `GradientBrush`.

2. **Layer accounting module**
   - Use `src/modules/painter/layer-tracker.js` for coverage stats and flattening.
   - Add per-pixel occupancy cap helper to match `maxPixelLayers` behavior.

3. **Color-choice strategy module**
   - Add painter-specific palette chooser in `src/modules/painter/` (blend simulation + RGB/LAB error comparator).
   - Optionally reuse `src/modules/color/palette-quantizer.js` for nearest color proposals.

4. **Weight-map and source sampling**
   - Normalize source/weight map handling via `src/modules/core/image-io.js` image asset wrappers.

5. **Generative node wrapper**
   - Runtime node should live in `src/nodes/generative/` (existing `PaintStrokeNode` is the right anchor).
   - Node must hold persistent simulation state across `apply` calls (stroke budget, tracker, RNG seed).

6. **UI parameter contract**
   - Mirror painter controls in schema (`param-schema`) and expose in node panel instead of stand-alone app controls.

### Recommended migration sequence
1. Port brush + layer tracker parity.  
2. Port best-color search strategy.  
3. Add weighted acceptance map support.  
4. Integrate into `PaintStrokeNode` with deterministic seed handling.  
5. Validate convergence metrics (avg layers, time-to-complete) on fixed fixtures.
