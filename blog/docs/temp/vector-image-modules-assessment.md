# Image-Vector Module Assessment (Issues + Implementation Potential)

## Scope Clarification

This assessment focuses only on modules that **create image-derived vectors** or **consume those vectors** for rendering/warping.

Vector here means:
- per-pixel vector field samples (`vx`, `vy`, `mag`, direction), or
- vector geometry outputs (polylines/paths) driven by image fields.

---

## A) Modules that CREATE image vectors

## 1) `field/vector-field` (proposed)
**Source evidence:**
- `VectorFieldMap.sample(x, y)` in `luminance-distortion`
- force construction functions `gradPush`, `tangPush`, `flow`, `originVec`
- current `LuminanceFlowNode` internal `VectorFieldMap`

### Core responsibility
Build a reusable field from image luminance/gradient/noise/tangent/origin terms and expose deterministic sampling.

### Implementation issues
1. **Normalization drift risk**
   - Different source tools use different scale constants and exponent curves (e.g., luminance exponent + fixed multipliers).
   - If not normalized, same params produce very different flow strength between modules.
2. **Coordinate-space mismatch**
   - Source tools mix canvas-space and normalized-space assumptions.
   - Sampling errors appear at resize/zoom boundaries.
3. **Directional discontinuities**
   - Gradient/tangent direction flips at low magnitude/noisy zones.
   - Can cause line zig-zag and unstable displacement.
4. **Hot-path sampling cost**
   - Recomputing gradients/noise per sample can become the dominant render cost.

### Potential / upside
1. **Single shared field primitive** usable by line, warp, displacement, and debug overlays.
2. **Better feature parity** across `luminance-distortion`, `index (1)`, and `LuminanceFlowNode`.
3. **GPU-ready future** if field buffers are represented as typed arrays/textures.

### Minimum contract needed
- `buildField(image, params) -> { width, height, vx, vy, mag, lum }`
- `sampleField(field, x, y, mode='bilinear')`
- `composeForces(baseField, forceConfig)`

---

## 2) `field/displacement-matrix` (proposed)
**Source evidence:**
- `DisplacementMatrix` class in `luminance-distortion`
- field-driven warp application paths in same file

### Core responsibility
Convert vector field semantics into displacement textures/matrices for downstream warping nodes.

### Implementation issues
1. **Aliasing at high displacement**
   - Large vector magnitudes cause foldover and pixel tearing without clamped step strategy.
2. **Temporal instability**
   - Animated origins/noise can flicker if displacement is rebuilt without smoothing.
3. **Memory pressure**
   - Multiple cached displacement buffers at full resolution are expensive.

### Potential / upside
1. **Decouples field creation from warp consumption** (clean API boundaries).
2. **Reusable by FlowField/Advection-like nodes** and prospective GL kernels.
3. **Enables preview vs final-quality displacement levels**.

### Minimum contract needed
- `buildDisplacement(field, params) -> {dx, dy, width, height}`
- `sampleDisplacement(disp, x, y)`
- `stabilizeDisplacement(prev, next, alpha)`

---

## B) Modules that USE image vectors

## 3) `line/flow-line-engine`
**Source evidence:**
- `WaveFrontFlowEngine`, `FlowWaveFront` in `index (1)`
- current `LuminanceFlowNode` sampling `vf.sample(...)`

### Core responsibility
Trace and update polylines by stepping through image-derived vector fields.

### Implementation issues
1. **Termination criteria tuning**
   - Need robust stop conditions (low magnitude, bounds, max curvature, min progress).
2. **Path self-intersection / clutter**
   - Dense regions can overdraw unless occupancy checks or spacing masks are used.
3. **Parameter coupling complexity**
   - drag/tension/speed/luminance exponent interact nonlinearly; presets are necessary.

### Potential / upside
1. **High visual payoff** and unique “engraved flow” style.
2. **Natural bridge to SVG export** because output is already vector geometry.
3. **Can share occupancy grid with stipple/path modules later**.

---

## 4) `line/serpentine-line-engine`
**Source evidence:**
- `SerpentineEngine` in `index (1)`
- current `SerpentineNode`

### Core responsibility
Generate scanline-like paths modulated by image luminance and optional vector-like drift.

### Implementation issues
1. **Determinism across frame rates**
   - animation params can diverge when time-step handling changes.
2. **Banding artifacts**
   - fixed spacing/frequency combinations can produce visible moiré.

### Potential / upside
1. **Excellent print/export path quality** (continuous stroke behavior).
2. **Simple mental model for users** compared to full flow simulation.

---

## 5) `line/static-line-engine`
**Source evidence:**
- static mode in `index (1)`
- current `StaticHalftoneNode`

### Core responsibility
Use luminance-derived directional/oscillation cues to produce deterministic vector paths.

### Implementation issues
1. **Insufficient local directionality** if only luminance is used without gradient context.
2. **Fine-detail loss** at coarse spacing/resolution.

### Potential / upside
1. **Fastest vector-path mode** for preview and export.
2. **Stable baseline module** for regression testing of vector pipeline.

---

## 6) `ui/debug-overlays`
**Source evidence:**
- `drawVF`, `drawFlow` in `luminance-distortion`

### Core responsibility
Visualize field vectors, flow probes, and direction quality diagnostics.

### Implementation issues
1. **Overlay cost on large canvases** if every arrow is drawn each frame.
2. **Debug/production leakage** risk (overlays accidentally affecting capture/export).

### Potential / upside
1. **Huge engineering leverage** for tuning field and line modules.
2. **Shortens bug cycles** for “why does this path bend here?” class of issues.

---

## 7) `bridge/node-adapters` for vector outputs
**Source evidence:**
- existing node system in `src/nodes/registry.js`
- mixed pixel + line/path concepts in reference tools

### Core responsibility
Adapt vector-producing modules (line/path engines) to the existing pixel-buffer node pipeline.

### Implementation issues
1. **Type impedance mismatch**
   - Node pipeline expects pixel buffers; vector engines output polylines.
2. **Ordering semantics**
   - Need explicit rules when vector outputs are composited between raster nodes.
3. **Masking/opacity compatibility**
   - Existing mask logic is pixel-centric.

### Potential / upside
1. **Preserves current architecture** while adding vector-capable modules.
2. **Enables mixed workflows** (e.g., raster preprocessing → vector line generation → raster post FX).

### Minimum contract needed
- `engine.run(input, params) -> { kind:'vector-paths', paths:[...] }`
- `adapter.rasterize(engineOutput, targetBuffer, style)`
- `adapter.getBounds(engineOutput)`

---

## Priority Risks (Cross-Module)

1. **Field consistency risk**: multiple modules computing their own field math differently.
2. **Performance risk**: too many per-sample computations in JS hot loops.
3. **Pipeline mismatch risk**: vector outputs forced into raster nodes without explicit adapter contract.
4. **Export divergence risk**: viewport render and SVG/WebM/GIF exports using different stepping logic.

---

## Highest-Value Potentials

1. **Unified image-vector core** (`field/vector-field`) used everywhere.
2. **Shared deterministic tick** for line animation + exports.
3. **One vector-output adapter path** for node pipeline compatibility.
4. **Debug overlay suite** as first-class dev feature.

---

## Recommended Implementation Sequence (Vector-specific)

1. Build `field/vector-field` + tests (sampling determinism, normalization).
2. Build `ui/debug-overlays` to validate field quality early.
3. Refactor `LuminanceFlowNode` to consume shared field module.
4. Introduce `line/flow-line-engine` adapter and rasterization boundary.
5. Add `field/displacement-matrix` to unify warp consumption.
6. Align `serpentine/static` engines on same tick + sampling contracts.
7. Integrate SVG/WebM/GIF exporters against identical path stepping.

This order minimizes rework and surfaces correctness problems before API spread.
