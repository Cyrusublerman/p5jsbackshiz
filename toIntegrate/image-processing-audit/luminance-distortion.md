# luminance-distortion (`toIntegrate/luminance-distortion.html`)

## Scope and dependencies
- Source analyzed: `toIntegrate/luminance-distortion.html` (single-file app).
- Runtime dependency: p5.js (declared via CDN).
- Processing model: derive vector/luminance field from source image, advect procedural line system under mixed force terms.

## Control/default surface (processing-relevant)
- Core line controls: spacing, stroke width, resolution, damping.
- Vector/gradient/tangent/origin/flow mixes each exposed in UI with defaults in range inputs.
- Global controls include luminance exponent, color mode, palette, debug vector overlays.

Representative anchors: control declarations lines 137-233; parameter manager initialization lines 253-287.

## Internal modules and mechanisms

### 1) `ParamManager`
- Collects all slider/checkbox/select state.
- Provides typed getters for numeric/boolean/string params consumed by renderer.

Source anchors: lines 253-287.

### 2) `VectorFieldMap`
- Builds per-sample descriptors (luminance, gradient angle, magnitude, direction components) and exposes `sample(x,y)`.
- This is the central image-derived field queried by forces, steering, spacing, and color mapping.

Source anchors: lines 290-321.

### 3) `ForceSystem`
- `gradPush(vf,str)`: creates vector along local gradient using sampled magnitude/orientation.
- `flow(...)`: generates procedural directional force from Perlin noise and curl parameter; can scale by luminance.

Source anchors: lines 331-356.

### 4) `Steering`
- Combines contributing vectors (gradient, tangent, origin attraction/orbit, flow) with dead-zone and scaling options.
- Produces final steering vector used for line-point displacement update.

Source anchors: lines 358-391.

### 5) `OriginAnimator`
- Computes moving origin in circular, Lissajous, or noise-driven modes.
- Origin vector contributes to directional behavior when origin mix > 0.

Source anchors: lines 393-405.

### 6) `LineGenerator` and `DisplacementMatrix`
- `LineGenerator` builds initial line/point structure from spacing and canvas size.
- `DisplacementMatrix.resize(lines,res)` maintains per-point displacement state at selected resolution.

Source anchors: lines 412-486.

### 7) `Renderer`
Main processing engine:
- Rebuilds displacement structures when line topology changes.
- For each point:
  - samples vector field (`vf.sample`),
  - applies enabled force terms (gradient/tangent/origin/flow),
  - applies damping and integration,
  - computes luminance-aware spacing adjustments,
  - maps color from luminance when color mode enabled.
- Draws stroke geometry.

Source anchors: lines 488-723.

### 8) `ColorMapper`
- Maps normalized luminance to palette RGB tuples for mono/thermal/ocean/neon modes.

Source anchors: line 407 plus renderer color usage lines 701-710.

### 9) `DebugOverlay`
- Draws sampled vector arrows and flow arrows for diagnostics of field behavior.

Source anchors: lines 725-747.

### 10) Image ingestion/fallback generation
- `applyImage(img,scale)`:
  - resizes canvas,
  - draws image into temporary canvas,
  - reads `ImageData`,
  - copies pixels into p5 image for use by vector-field builder.
- `loadImg(file)` handles file input async loading.
- If no image, procedural noise luminance source is synthesized.

Source anchors: lines 759-769, 787-790, 808-820.

## End-to-end processing process
1. Parameter manager reads control defaults/current values.  
2. Source image (or synthetic noise) is converted to field data.  
3. Line system is generated and state buffers sized.  
4. Each frame computes mixed steering from image-derived vectors + procedural flow.  
5. Geometry updates are rendered with optional luminance color mapping and debug overlays.

## Capability summary
- Hybrid image-reactive + procedural flow art generator.
- Supports vector-field visualization, multiple origin behaviors, luminance-dependent spacing, and palette mapping.

## Breakdown for integration into the main tool (`src/modules/*` + node runtime)

### Target module decomposition
1. **Parameter/state contract**
   - Normalize all controls into `src/modules/core/param-schema.js` and UI bindings in `src/modules/ui/tool-panels.js`.

2. **Vector/luminance field core**
   - Map field sampling to `src/modules/field/vector-field.js` and gradient/noise primitives (`base-gradient.js`, `noise-flow.js`).

3. **Force composition**
   - Use `src/modules/field/force-composer.js` to combine gradient/tangent/origin/noise forces with clamp/normalize options.
   - Origin dynamics map naturally to `src/modules/field/origin-force.js`.

4. **Displacement/state buffers**
   - Store per-line displacement/state in `src/modules/field/displacement-matrix.js`.

5. **Line generation/execution**
   - Reuse `src/modules/line/flow-line-engine.js` plus shared helpers for propagation and spacing behavior.

6. **Rendering and bridge**
   - Raster compositing through `src/modules/bridge/node-adapters.js`.
   - Debug vector/flow overlays through `src/modules/ui/debug-overlays.js`.

7. **Node wrapper**
   - Expose as dedicated node under `src/nodes/line` or `src/nodes/warp` (depending on UI taxonomy), with persistent simulation state and recipe-safe params.

### Recommended migration sequence
1. Port field sampling + force composer parity.  
2. Port displacement matrix behavior and line spacing logic.  
3. Wrap in node with schema-backed controls.  
4. Validate debug overlays and export parity.
