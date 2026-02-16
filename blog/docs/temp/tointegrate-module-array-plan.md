# `/toIntegrate` → Modular Integration Array Plan

## Goal

Define a **module array** (like the current `src/` architecture) that decomposes all useful capabilities from `/toIntegrate` into interoperable modules, with explicit responsibilities, dependencies, and required functionality.

This plan uses `/toIntegrate` tools as reference inputs:
- `colourquantiser`
- `distortion-pipeline`
- `index (1)` / `lones`
- `luminance-distortion`
- `paint-image`
- `processing-export`
- `tile2`

---

## Proposed Integration Module Array

```js
const integrationModules = [
  'core/image-io',
  'core/param-schema',
  'core/runtime-ticker',
  'color/color-science',
  'color/palette-quantizer',
  'field/vector-field',
  'field/displacement-matrix',
  'line/line-engine-common',
  'line/flow-line-engine',
  'line/static-line-engine',
  'line/serpentine-line-engine',
  'painter/brush-engine',
  'painter/layer-tracker',
  'shader/gl-kernel-runtime',
  'shader/worker-animation-driver',
  'export/svg-exporter',
  'export/raster-exporter',
  'export/timeline-recorder',
  'lab/code-runner',
  'ui/tool-panels',
  'ui/debug-overlays',
  'bridge/node-adapters'
];
```

---

## Module Specifications (Needed Functionality)

## 1) `core/image-io`
**Source refs:** `distortion-pipeline`, `index (1)`, `paint-image`, `luminance-distortion`

### Must provide
- Drag/drop + file input image loading.
- Source metadata extraction (width/height/type).
- Fit/cover/contain mapping into working buffer.
- Shared decoded pixel buffer API for node and non-node engines.

### Output contracts
- `loadImage(file|url) -> ImageAsset`
- `mapToViewport(asset, mode, targetW, targetH) -> MappedImage`

---

## 2) `core/param-schema`
**Source refs:** all tools (large control surfaces)

### Must provide
- Typed param descriptors (range/select/toggle/color).
- Validation/clamping and serialization to recipes.
- Compatibility layer for old tool parameter names.

### Output contracts
- `registerParamSchema(moduleId, schema)`
- `coerceParams(moduleId, rawParams)`

---

## 3) `core/runtime-ticker`
**Source refs:** `tile2`, `processing-export`, `index (1)`

### Must provide
- Deterministic frame tick + pause/play + fps control.
- Time scaling and fixed-step updates.
- Shared hooks for recording and preview rendering.

### Output contracts
- `start({fps})`, `pause()`, `resume()`, `setFps(n)`
- `onTick(cb)`

---

## 4) `color/color-science`
**Source refs:** `colourquantiser`

### Must provide
- RGB/HEX/LAB conversions.
- Delta-E distance metrics.
- Palette parsing/normalization helpers.

### Output contracts
- `rgbToLab()`, `labToRgb()`, `hexToRgb()`
- `deltaE(labA, labB, method)`

---

## 5) `color/palette-quantizer`
**Source refs:** `colourquantiser`, current quantize/dither nodes

### Must provide
- Palette-constrained nearest-color assignment.
- Optional “nearest-opposite” strategy.
- Dither modes (none, bayer, error diffusion, blue-noise when available).

### Output contracts
- `quantize(image, palette, options)`
- `dither(image, palette, strategy)`

---

## 6) `field/vector-field`
**Source refs:** `luminance-distortion`, `index (1)`

### Must provide
- Vector generation from luminance/gradient/noise/tangent/origin forces.
- Per-pixel vector sampling.
- Blend/mix multiple force contributors.

### Output contracts
- `buildField(image, params) -> VectorField`
- `sampleField(field, x, y) -> {vx, vy}`

---

## 7) `field/displacement-matrix`
**Source refs:** `luminance-distortion`

### Must provide
- Displacement map construction + compositing.
- Magnitude compression/expansion controls.
- Cached matrix updates for interactive edits.

### Output contracts
- `buildDisplacement(field, params) -> Displacement`
- `warpSample(src, disp, x, y)`

---

## 8) `line/line-engine-common`
**Source refs:** `index (1)`, `lones`

### Must provide
- Shared polyline structure + smoothing/tension helpers.
- Draw progress clipping.
- Stroke style application (weight, opacity, color).

### Output contracts
- `generateLines(input, params) -> LineSet`
- `clipLines(lines, progressPct)`

---

## 9) `line/flow-line-engine`
**Source refs:** `index (1)`, `luminance-distortion`, current `LuminanceFlowNode`

### Must provide
- Flow-following line propagation.
- Drag/tension coupling with luminance.
- Orientation constraints and spawn/termination controls.

---

## 10) `line/static-line-engine`
**Source refs:** `index (1)`, current `StaticHalftoneNode`

### Must provide
- Deterministic static oscillation/halftone line generation.
- Frequency/amplitude/phase controls.
- Multi-orientation pattern support.

---

## 11) `line/serpentine-line-engine`
**Source refs:** `index (1)`, current `SerpentineNode`

### Must provide
- Serpentine scanline path generation.
- Flow/static hybrid mode.
- Spawn-rate/speed parameterization for animation.

---

## 12) `painter/brush-engine`
**Source refs:** `paint-image`, current `PaintStrokeNode`

### Must provide
- Iterative paint-step simulation.
- Gradient brush behavior.
- Source-driven color targeting per stroke.

---

## 13) `painter/layer-tracker`
**Source refs:** `paint-image`

### Must provide
- Per-pixel layer accumulation tracking.
- Stats (coverage, average layers, variance).
- Layer-state queries for adaptive stroke decisions.

---

## 14) `shader/gl-kernel-runtime`
**Source refs:** `tile2`, current `GLPipeline`

### Must provide
- Shader compile/link and uniform binding.
- Texture upload from image/video/buffer.
- Viewport and zoom aware draw pipeline.

### Output contracts
- `compileProgram(vs, fs)`
- `runKernel(program, uniforms, inputs) -> Framebuffer`

---

## 15) `shader/worker-animation-driver`
**Source refs:** `tile2`, `processing-export`

### Must provide
- Worker-owned animation loop.
- Main-thread safe message protocol.
- Frame queueing for preview + recording.

### Output contracts
- `createAnimationWorker(config)`
- `postFrameRequest(state)`

---

## 16) `export/svg-exporter`
**Source refs:** `index (1)`

### Must provide
- Polyline/path export to SVG.
- Style mapping (stroke width/color/opacity).
- ViewBox and sizing normalization.

---

## 17) `export/raster-exporter`
**Source refs:** `distortion-pipeline`, `paint-image`

### Must provide
- PNG export of current viewport or full-res buffer.
- Optional background flattening and alpha policy.

---

## 18) `export/timeline-recorder`
**Source refs:** `index (1)`, `processing-export`

### Must provide
- Frame capture buffer.
- GIF/WebM generation path abstraction.
- Progress reporting and cancellation.

---

## 19) `lab/code-runner`
**Source refs:** `processing-export`

### Must provide
- User code parsing/validation/sandbox boundaries.
- Setup/draw extraction and execution lifecycle.
- Controlled API exposure to avoid full app mutation.

---

## 20) `ui/tool-panels`
**Source refs:** all tools

### Must provide
- Declarative panel rendering from `core/param-schema`.
- Reusable controls (range/select/color/toggle/file/dropzone).
- Preset loading and per-module panel sections.

---

## 21) `ui/debug-overlays`
**Source refs:** `luminance-distortion`

### Must provide
- Toggleable overlays: vector field, flow vectors, origin marker, diagnostics.
- Overlay rendering independent of main raster pipeline.

---

## 22) `bridge/node-adapters`
**Source refs:** current `src/nodes/*` + all above

### Must provide
- Adapter layer that wraps module engines as `EffectNode`-compatible units.
- Node registration metadata + parameter bridge.
- Strategy to host non-pixel outputs (lines/strokes/paths) as composited buffers.

---

## Dependency Order (Build Sequence)

1. `core/image-io`
2. `core/param-schema`
3. `core/runtime-ticker`
4. `color/*`
5. `field/*`
6. `line/*`
7. `painter/*`
8. `shader/*`
9. `export/*`
10. `ui/*`
11. `bridge/node-adapters`

This order lets all feature modules share one stable core and be exposed in the existing node pipeline without re-architecting the app.

---

## Coverage Matrix: Reference Tool → Target Modules

| Reference tool | Target modules |
|---|---|
| `colourquantiser` | `color/color-science`, `color/palette-quantizer`, `ui/tool-panels` |
| `distortion-pipeline` | `core/image-io`, `core/param-schema`, `export/raster-exporter`, `bridge/node-adapters` |
| `index (1)` | `line/line-engine-common`, `line/flow-line-engine`, `line/static-line-engine`, `line/serpentine-line-engine`, `export/svg-exporter`, `export/timeline-recorder` |
| `lones` | `ui/tool-panels` (layout patterns only until source recovered) |
| `luminance-distortion` | `field/vector-field`, `field/displacement-matrix`, `ui/debug-overlays` |
| `paint-image` | `painter/brush-engine`, `painter/layer-tracker`, `export/raster-exporter` |
| `processing-export` | `lab/code-runner`, `export/timeline-recorder`, `core/runtime-ticker` |
| `tile2` | `shader/gl-kernel-runtime`, `shader/worker-animation-driver`, `core/runtime-ticker` |

---

## “Done” Criteria for Full Integration

- Every module above has a typed parameter schema and testable API contract.
- All reference-tool capabilities map to at least one module (no orphan functionality).
- Each new engine module has either:
  1) a node adapter in `src/nodes/`, or
  2) an explicit non-node utility surface (e.g., `lab/code-runner`).
- Export pathways (PNG/SVG/GIF/WebM) are unified behind `export/*` abstractions.
- Debug overlays are optional and do not alter render outputs.
