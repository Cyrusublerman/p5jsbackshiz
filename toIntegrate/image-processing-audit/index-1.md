# index (1).html (`toIntegrate/index (1).html`)

## Scope and dependencies
- Source analyzed: `toIntegrate/index (1).html`.
- Runtime dependency: p5.js (drawing, canvas lifecycle, export helpers).
- Processing model: derive a luminance field from source image, then generate geometry whose motion/displacement is luminance-driven.

## Global modules and defaults

### `CONFIG` (all major defaults)
- Canvas: `600x700`, `scale 0.5`, white background, padding `5`.
- Engine mode default: `flow`, horizontal orientation.
- Flow defaults: spacing `6`, amplitude `2.5`, frequency `1.0`, step `1.0`, speed `0.5`, phase increment `0`.
- Static defaults: spacing `6`, max amplitude `3`, frequency `60`, step `1.0`.
- Serpentine defaults: spawn `20`, osc speed `1`, base speed `0.3`.
- Drag model defaults: light drag `0`, dark drag `0.5`, linear curve.
- Source defaults: `contain`, non-inverted luminance.
- Render defaults: black stroke, weight `1`, alpha `255`.

Source anchors: lines 500-519.

## Image-processing modules

### 1) `LuminanceField`
- `updateFromDomImage` reads source pixels from temporary canvas.
- Converts each RGB pixel to luminance using Rec.709 coefficients.
- Stores field in `Float32Array` for fast sampling.
- `lumAt(cx,cy)` maps canvas coordinates to source coordinates (via fit mapper) and returns clamped nearest luminance sample.

Source anchors: lines 537-573.

### 2) `FitMapper`
- Encapsulates contain/cover projection from source image rectangle into canvas rectangle.
- Provides reverse map `canvasToSource` used by `lumAt`.

Source anchors: lines 579-604.

### 3) Intensity-to-motion transforms
- `DragModel.calculate(lum, dragCfg)`: converts luminance to drag factor with optional nonlinear curves.
- `CurveUtil.apply`: general nonlinear curve mapper used by static displacement amplitude.
- `Easing.apply`: animation progress easing.

Source anchors: lines 609-647.

### 4) Geometry regularization
- `TensionSolver.apply(points, tc)`: smooths geometry and constrains segment behavior according to tension parameters.

Source anchors: lines 652 onward in `TensionSolver` block.

## Engine modules (capabilities)

### A) `WaveFrontFlowEngine` + `FlowWaveFront`
- Spawns fronts over time; each front contains sampled points across line axis.
- Each point advances along flow axis at `baseSpeed*(1-drag(lum))`.
- Dark regions (higher drag) slow movement and increase local line density.
- Supports stop frame and GC compaction for completed fronts.

Source anchors: lines 691-855.

### B) `ParallelStaticEngine`
- Generates static parallel lines.
- For each sample position, reads luminance and converts it to sinusoidal displacement amplitude (with curve shaping).

Source anchors: lines 860-905.

### C) `SerpentineEngine`
- Spawns points on oscillating inlet, advances x by luminance-drag speed.
- When reaching border, points travel around perimeter phases.
- Uses tension solver for shape continuity.

Source anchors: lines 910-963.

## Render/export modules
- `Renderer` converts engine point arrays to p5 polylines.
- `SvgBuilder` serializes line sets into SVG paths.
- `ExportManager` exports PNG/SVG and handles WebM recording flow.

Source anchors: lines 969-1045+.

## End-to-end processing process
1. Load image into `LuminanceField` (`Float32Array`).  
2. Chosen engine repeatedly samples `lumAt` to convert luminance into velocity/displacement.  
3. Optional tension smoothing regularizes line shape.  
4. Renderer draws current geometry to canvas.  
5. Export module serializes raster/vector outputs.

## Limits/notes
- Sampling is nearest-neighbor luminance lookup in `lumAt`.
- Quality/performance trade-off controlled by sample step, spacing, and engine-specific frame budgets.

## Breakdown for integration into the main tool (`src/modules/*` + node runtime)

### Target module decomposition
1. **Image/luminance ingestion**
   - Use `src/modules/core/image-io.js` for source asset creation, fit mapping, and luma-map generation.
   - Keep `fitMode` semantics aligned with module contract (`contain/cover/stretch`).

2. **Field and force modules**
   - Move luminance-derived vector construction into `src/modules/field/vector-field.js` + `base-gradient.js`.
   - Compose multiple influences via `src/modules/field/force-composer.js`.

3. **Line engines**
   - Map modes directly:
     - Flow -> `src/modules/line/flow-line-engine.js` (+ `front-propagation-core.js`),
     - Static -> `src/modules/line/static-line-engine.js`,
     - Serpentine -> `src/modules/line/serpentine-line-engine.js`.

4. **Raster bridge**
   - Convert vector line outputs to raster with `src/modules/bridge/node-adapters.js` at pipeline boundary.

5. **Node wrappers and registry**
   - Keep user-facing nodes in `src/nodes/line/` (`ModuleFlowLinesNode`, `ModuleStaticLinesNode`, `ModuleSerpentineNode`) and register in `src/nodes/registry.js`.

6. **Export/debug layers**
   - SVG/PNG through `src/modules/export/svg-exporter.js` and `raster-exporter.js`.
   - Overlay toggles through `src/modules/ui/debug-overlays.js`.

### Recommended migration sequence
1. Achieve field + line engine parity on deterministic fixtures.  
2. Validate vector->raster bridge stroke parity (alpha/order).  
3. Integrate node wrappers + registry wiring.  
4. Add export parity tests (PNG/SVG) for identical seeds/config.
