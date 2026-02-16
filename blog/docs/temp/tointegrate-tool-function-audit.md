# `/toIntegrate` Tool Audit: Functions, Features, and Comparison to Current Tool

## Scope

This audit covers every tool payload under `toIntegrate/` and compares it against the current app/tooling in `src/` + shared algorithm modules.

Compared current-tool surfaces:
- Node/effect inventory in `src/nodes/registry.js`
- Runtime architecture in `src/main.js` + worker/pipeline core
- Shared algorithm namespaces in `libraries/p5js-editor/algorithms/index.js`

---

## Current Tool Baseline (for comparison)

The current tool is already a modular, node-based pipeline with broad category coverage (colour/tone, blur, sharpen, warp, line render, pattern, physics, segmentation, geometric, optics, etc.) through the registry. It includes dedicated nodes for quantization/dithering, serpentine/flow line rendering, paint-stroke generation, tile blend, advection, and more. It also uses a worker bridge for asynchronous rendering and a central pipeline/viewport architecture.

---

## Tool-by-Tool Inventory and Comparison

## 1) `toIntegrate/colourquantiser/colourquantiser`

### Declared classes
- `ColorSpaceConverter`

### Declared functions
- `applyImageAdjustments`
- `clamp`
- `deltaE76`
- `ditherNearestOppositeChecked`
- `doNoDitherLargePalette`
- `findDitherStrategy_NearestOpposite`
- `findOppositeColor`
- `formatHex`
- `getUserPalette`
- `initializeApp`
- `loadBlueNoise`
- `loadImage`
- `logWithTimestamp`
- `main`
- `parsePaletteFile`
- `pickNearestInLargePalette`
- `projectOntoSegment`
- `renderPaletteSwatches`
- `showStatus`
- `updatePreview`
- `vecAdd`
- `vecDot`
- `vecMagSq`
- `vecScale`
- `vecSub`

### Class methods
- `hexToRgb`, `rgbToLab`, `labToRgb`
- `_srgbToLinear`, `_linearToSrgb`, `_linearToXyz`, `_xyzToLinear`, `_xyzToLab`, `_labToXyz`

### Feature profile
- Palette-aware quantization and dither strategies.
- LAB conversions and Delta-E distance logic.
- Palette file parsing + swatch preview flow.

### Comparison to current tool
- **Already covered strongly** by existing quantize/dither and posterize surfaces in nodes, plus shared color algorithm namespaces.
- **Potential delta**: this tool’s explicit LAB/Delta-E and “nearest+opposite” dither strategy can be folded into current quantization presets if desired.

---

## 2) `toIntegrate/distortion-pipeline.html`

### Declared classes
- `EffectNode`, `Pipeline`, `UI`, `Recipe`, `AppState`
- Utility/core classes: `Sampler`, `SeededRNG`, `PerlinNoise`
- Node classes: `GreyscaleNode`, `LevelsNode`, `ContrastNode`, `BoxBlurNode`, `GaussianBlurNode`, `FlowFieldNode`, `BandShiftNode`, `AffineTransformNode`, `RadialRippleNode`, `LensBubblesNode`, `IterativeRewarpNode`

### Declared functions/methods
- Functions: `hashSeed`, `queueRender`
- UI methods: `_buildStatus`, `_clock`, `_dragDrop`, `_exportJSON`, `_exportPNG`, `_fnKeys`, `_loadImg`, `_loadRecipe`, `_menu`, `_p`, `_preset`, `_top`, `_upStatus`, `refreshStack`

### Feature profile
- Single-file Swiss-style node editor.
- Stack editing, image loading, random seed, recipe import/export, PNG export.

### Comparison to current tool
- **Largely superseded/integrated**: core architecture and most node classes in this file already exist as modular files in `src/core/*`, `src/nodes/*`, and UI renderer components.
- Current tool is structurally more maintainable (module split + worker bridge) and broader in node coverage.

---

## 3) `toIntegrate/index (1).html`

### Declared classes
- Engines/models: `WaveFrontFlowEngine`, `ParallelStaticEngine`, `SerpentineEngine`, `FlowWaveFront`, `LuminanceField`, `LinePoint`, `DragModel`, `TensionSolver`
- Rendering/export/UI: `Renderer`, `SvgBuilder`, `ExportManager`, `UIController`, `App`
- Utility: `CurveUtil`, `Easing`, `FitMapper`

### Declared functions/methods
- p5 hooks: `setup`, `draw`
- App/controller methods include: `_bind`, `_handleFile`, `_initCurrentEngine`, `_rebuildCanvas`, `_sync`, `_syncVis`, `_togglePause`, `initFlowEngine`, `initSerpentineEngine`, `loadImage`, `reset`, `setStatus`, `setRecordProgress`, `showRecordProgress`, `update`, `renderFrame`, `getCurrentLines`, `getDrawableLines`, `getDisplayPoints`, etc.

### Feature profile
- Multi-mode line rendering workflow: **flow / static / serpentine**.
- Large control surface (orientation, tension, drag, flow/static/serpentine params, draw progress).
- Export controls (PNG, SVG, WebM preview/recording).

### Comparison to current tool
- **Core rendering concepts are already integrated** via line-render nodes (`LuminanceFlow`, `StaticHalftone`, `Serpentine`) and the node pipeline.
- **Gap area**: standalone animation/export-manager UX (especially explicit WebM workflow) is richer here than in current modular node UI.

---

## 4) `toIntegrate/lones/lones`

### Declared classes/functions
- No complete inline script payload detected in `src/index.html`.

### Feature profile
- HTML/UI appears to mirror the Serpentine Halftone controls from `index (1).html` (same control families visible).
- File appears truncated/incomplete at tail, so executable logic is not fully present in this payload.

### Comparison to current tool
- Treat as **UI shell/reference only** unless full script source is recovered.
- No unique runtime logic identified beyond what already exists in `index (1).html` and current line-render nodes.

---

## 5) `toIntegrate/luminance-distortion.html`

### Declared classes
- `ParamManager`, `DisplacementMatrix`, `VectorFieldMap`, `Steering`, `OriginAnimator`, `ForceSystem`, `LineGenerator`, `ColorMapper`, `Renderer`, `DebugOverlay`

### Declared functions/methods
- Functions: `applyImage`, `loadImg`, `resizeTo`
- Methods include: `build`, `render`, `generate`, `flow`, `gradPush`, `tangPush`, `originVec`, `sample`, `drawFlow`, `drawVF`, `drawOrigin`, `resize`, `update`, and force-field setters/getters.

### Feature profile
- Parametric luminance distortion via displacement/force/vector-field composition.
- Debug overlays for vector fields and flow.
- Palette and save controls.

### Comparison to current tool
- **Partially covered** by existing flow/warp/noise line-node capabilities.
- **Possible integration value**: debug-overlay ergonomics and explicit vector-field decomposition controls are more specialized than current default UI.

---

## 6) `toIntegrate/paint-image/paint-image`

### Declared classes
- `Painter`, `GradientBrush`, `LayerTracker`, `UIManager`

### Declared functions/methods
- Functions: `setup`, `draw`, `handleFileDrop`
- Methods include: `paintStep`, `findBestColor`, `getSourcePixel`, `getPixelLayers`, `getAverageLayers`, `addLayer`, `updatePaletteFromInput`, `updateOpacityLabel`, `updateStats`, `updateStatus`, `bindEvents`, `bindSlider`, `handleUpload`, `loadSourceImage`, `init`, `update`.

### Feature profile
- Image-to-paint process with iterative brush/layer simulation.
- Palette update controls and status/stats feedback.

### Comparison to current tool
- **Conceptually covered** by `PaintStrokeNode` + color modules, but this tool has a dedicated painter-centric UX and layering model that could be ported as a specialized node preset or separate workspace.

---

## 7) `toIntegrate/processing-export/processing-export`

### Declared classes
- `CodeManager`, `FrameCapture`, `UIController`

### Declared functions/methods
- Functions: `setup`, `draw`, `sketch` (plus one regex false-positive token in source parsing).
- Methods include: `parseCode`, `getSetupFunction`, `getDrawFunction`, `loadCode`, `loadDefaultCode`, `startRecording`, `stopRecording`, `toggleRecording`, `addFrame`, `generateGIF`, `downloadGIF`, `getFrameCount`, `isComplete`, `updateFromDuration`, `updateDisplay`, `setStatus`, `updateStatus`, `reset`, `attachListeners`.

### Feature profile
- In-browser p5/Processing-style code loader.
- Frame capture pipeline and GIF export controls.

### Comparison to current tool
- **Mostly a gap**: current app does not expose a code-editor + recorder workflow.
- Could be integrated as a separate “export lab” utility rather than a node.

---

## 8) `toIntegrate/tile2/tile2`

### Declared functions
- `_tick`, `_toBitmap`
- `buildWorkerSource`, `createWorker`
- `compile`, `createProgram`, `getUniformLocations`, `initGL`
- `createTextureFromSource`, `resampleBitmap`, `loadImagesFromUrls`
- `init2D`, `initAnimationEngine`
- `pushParams`, `pushZoom`, `setParams`, `setZoom`, `setViewport`, `setFps`, `play`, `pause`, `render`, `main`

### Feature profile
- GL shader compile/render loop + texture upload.
- Worker-backed timing/animation orchestration.
- Zoom/viewport/FPS controls.

### Comparison to current tool
- **Partially covered** by existing `GLPipeline` and compositing node surfaces.
- **Potential delta**: this tool’s explicit worker-driven animation API and shader harness can inform a dedicated real-time tiling/shader node set.

---

## Integration Readout (High-Level)

### Already integrated/superseded (high confidence)
1. `distortion-pipeline.html` (core architecture and many node equivalents)
2. Major portions of `index (1).html` render logic via line-render nodes
3. Much of `colourquantiser` concept space via quantize/dither/posterize + color modules

### Partial integrations (worth targeted extraction)
1. `luminance-distortion.html` (debug overlays + force decomposition UI)
2. `paint-image` (painter-centric layering UX)
3. `tile2` (shader harness + worker animation control API)

### Mostly net-new utility workflows
1. `processing-export` (code entry + GIF/frame capture tool)

### Data quality caveat
- `toIntegrate/lones/lones/src/index.html` appears incomplete/truncated and should be treated as non-authoritative until recovered.

---

## Recommended Next Steps

1. **Create extraction checklist per tool**
   - Separate “algorithm logic”, “UI behavior”, “export behavior”, and “runtime infra”.
2. **Promote reusable logic into shared algorithm modules**
   - Especially LAB/Delta-E/palette strategies from `colourquantiser`.
3. **Add dedicated integration tracks**
   - Track A: line-render UX parity (WebM/SVG export)
   - Track B: shader/worker animation harness parity (`tile2`)
   - Track C: code-capture utility (`processing-export`) as separate panel/tool.
4. **Ignore/repair broken payloads before integration**
   - Recover full source for `lones` or remove it from integration queue.
