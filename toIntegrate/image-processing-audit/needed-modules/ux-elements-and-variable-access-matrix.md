# UX Elements + Variable Access Matrix (for full toIntegrate parity)

This document answers:
1. **What UX elements must exist** for parity.
2. **Which variables should be accessible** in the main tool.
3. **What was accessible in the original tools** (IDs / runtime config/state).

---

## 1) Global parity rule
For each migrated tool module, preserve access to:
- **Input/source controls** (file/drop, fit/remap, scale).
- **Engine mode controls** (flow/static/serpentine or effect selectors).
- **Core algorithm controls** (frequency, amplitude, thresholds, damping, curve types, gamma/contrast/sat, etc).
- **Lifecycle controls** (play/pause/reset/process/preview).
- **Export controls** (PNG/SVG/GIF/WebM and recorder progress).
- **Diagnostics controls** (status, debug overlays, performance labels).

---

## 2) Original UX controls by project (accessible IDs)

### A) `colourquantiser`
Accessible UX IDs:
- `image-input`, `palette-select`, `palette-swatch-display`, `custom-palette-tools`
- `eyedropper-button`, `custom-color-picker`, `custom-hex-input`, `add-color-button`, `palette-file-input`
- `gamma-slider`, `contrast-slider`, `saturation-slider`
- `reset-adjustments-button`, `dithering-enable`
- `process-button`, `undo-button`, `download-button`
- `status-message`, `canvas`

Variables/states accessible in original runtime:
- `originalImageData`, `previewImageData`, `currentImageData`, `blueNoiseTextureData`
- `customPaletteArray`, selected predefined palette, dither on/off
- adjustment params: gamma/contrast/saturation
- processing lock state: `isProcessing`, eyedropper state

### B) `paint-image`
Accessible UX IDs:
- uploads: `img-upload`, `map-upload`
- palette: `palette-input`, `btn-update-palette`
- brush/speed/limits: `min-size`, `max-size`, `min-opacity`, `max-opacity`, `speed`, `layer-limit`
- actions: `btn-reset`, `btn-pause`, `btn-save`
- status/stats: `status-text`, `stat-avg-layers`

Variables/states accessible:
- `config.brushMinSize`, `brushMaxSize`, `minOpacity`, `maxOpacity`, `iterationsPerFrame`, `maxAverageLayers`, `maxPixelLayers`, `palette`
- source image, weight map, painter active state, average layer metric

### C) `tile2`
Accessible UX IDs:
- status/upload/list: `status`, `multiImageUploader`, `imageList`
- mode/effects: `modeSelect`, `effect`, `classicMode`, `combinationSelect`, `shuffleSelect`
- playback/tonemap/transform: `fps`, `gamma`, `exposure`, `scale`, `panX`, `panY`
- expression/equation controls: `equationMode`, `equationInput`, `paramA`, `paramB`, `paramC`, `paramK`, `paramM`, `seedInput`

Variables/states accessible:
- `_targetFps`, `currentFrame`, `playing`
- shader params: effect/exposure/gamma
- zoom params: scale/panX/panY
- loaded bitmap set and worker readiness

### D) `processing-export`
Accessible UX IDs:
- `framerate`, `frameCount`, `duration`
- `recordBtn`, `downloadBtn`, `loadCodeBtn`
- `codeInput`, `status`, `errorMessage`

Variables/states accessible:
- recording state, frame capture buffer, target dimensions (800x800)
- compiled setup/draw function handles
- encoder output readiness

### E) `luminance-distortion`
Accessible UX IDs (complete processing set):
- source/display: `file-input`, `drop-zone`, `imgScale`, `showImage`
- base style: `patternType`, `spacing`, `strokeW`, `resolution`, `damping`
- magnetism: `magMix`, `magCompress`, `magExpand`
- gradient/tangent: `gradMix`, `gradStr`, `tangMix`, `tangStr`
- origin/orbit: `originMix`, `originStr`, `animateOrigin`, `orbitR`, `orbitSpeed`, `originMode`
- fixed-angle disp: `angleMix`, `amplitude`, `xFactor`, `yFactor`, `dispAngle`
- sine stack: `sineMix`, `sineAmp`, `s1Freq`, `s1Mix`, `s2Freq`, `s2Mix`, `s3Freq`, `s3Mix`, `sinePhaseSpd`, `sineLumScale`
- flow: `flowMix`, `flowStr`, `flowNS`, `flowCurl`
- steering/global: `steerGrad`, `steerTang`, `deadZone`, `edgeMagScale`, `lumScale`, `timeSpeed`, `lumExp`, `bgAlpha`, `colorMode`, `palette`, `showVF`, `showFlow`
- actions: `togglePanel`, `saveBtn`

Variables/states accessible:
- full `ParamManager` numeric map (`c[id]`) and bool/select getters
- vector field channels, displacement matrix, debug flags, animated origin state

### F) `distortion-pipeline`
Accessible UX IDs:
- seed/head status: `seed-input`, `btn-rseed`, `h-img`, `h-mode`, `h-ren`, `h-nodes`, `h-zoom`
- stack/menu: `add-btn`, `stack`, `amenu`
- viewport/telemetry: `vp`, `dropzone`, `t-*` labels, `statpanel`
- function-key actions: `fk1`..`fk11` (load, preview/final, fit/1:1, export, recipe load/save, presets)
- file inputs: `file-input`, `recipe-input`

Variables/states accessible:
- `AppState` fields: source image/pixels, previewScale, quality, globalSeed, stack, solo, zoom/pan, render flags
- all node params for registered effects (tone/blur/transform/warp/refraction/accumulation)

### G) `index (1)` (+ `lones` equivalent)
Accessible UX IDs include:
- source: `file-input`, `dropzone`, `ctrl-fit-mode`, `ctrl-scale`
- engine mode: `mode-toggle`, `ctrl-orientation`, `ctrl-invert`
- flow panel controls (`ctrl-flow-*`)
- static panel controls (`ctrl-static-*`)
- serpentine/osc controls (`ctrl-serp-*`, `ctrl-osc-*`)
- drag/tension controls (`ctrl-drag-*`, `ctrl-curve-*`, `ctrl-tension-*`)
- render style (`ctrl-bg-color`, `ctrl-stroke-color`, `ctrl-weight`, `ctrl-opacity`)
- animation/recording (`ctrl-draw-progress`, `ctrl-anim-frames`, `ctrl-hold-frames`, `ctrl-anim-easing`, `ctrl-fps`, `btn-preview-anim`, `btn-record-webm`, `record-progress-*`)
- export (`btn-export-png`, `btn-export-svg`), lifecycle (`btn-pause`, `btn-reset`)

Variables/states accessible in original:
- full `CONFIG` tree:
  - `canvas`, `engine`, `flow`, `static`, `serpentine`, `drag`, `tension`, `source`, `render`, `animation`
- runtime engine instances and states:
  - flow engine front state,
  - static lines,
  - serpentine live points,
  - paused/recording/export state.

---

## 3) Canonical variable access required in the main tool (by module)

### core-image-ingest-and-fit
Must expose:
- `fitMode`, `scale`, source dimensions, mapped dimensions, offsets.
- luma extraction coefficients and sample mode.

### color-lab-and-palette-core
Must expose:
- whitepoint, distance metric selection, cache enable toggle.
- palette source (predefined/custom/imported).

### color-quantize-and-dither-engine
Must expose:
- quantizer engine mode (`nearest` vs `nearest-opposite`),
- dither mode + blue-noise texture source,
- per-run palette table and fallback behavior.

### color-adjustment-prepass
Must expose:
- gamma, contrast, saturation, order of operations.

### field-luminance-vector-builder
Must expose:
- gradient kernel, dead-zone/threshold controls, normalization toggles.

### field-force-composer-advanced
Must expose:
- per-force weights: gradient/tangent/origin/noise/fixed/sine.
- clamp/normalize/dead-zone controls.

### line engines (`flow/static/serpentine`)
Must expose:
- all spacing/frequency/amplitude/speed/phase controls,
- curve type + curve strength,
- tension and border behavior controls,
- stop-frame/progress controls.

### painter-stroke-synthesis-engine
Must expose:
- brush size/opacity ranges,
- iteration budget,
- max layers (global + per-pixel),
- palette selection and weight-map source.

### bridge-vector-raster-compositor
Must expose:
- stroke RGBA, stroke width, opacity,
- mask source,
- clear/background mode.

### shader-worker-compositor-engine
Must expose:
- effect mode, gamma, exposure,
- FPS, frame index, zoom transform,
- source image list / combinator mode.

### export-animation-recorder-and-encoder
Must expose:
- fps/frame-count/duration coupling,
- recording start/stop state,
- format selection (GIF/WebM),
- progress + encoder status.

### lab-code-runner-sandbox
Must expose:
- code input, parse/compile diagnostics,
- execution limits (timeout/frame cap),
- run/cancel/reload state.

### node-wrapper-and-registry-contract
Must expose per node:
- `enabled`, `solo`, `opacity`, masks/modulation,
- all schema-backed params with defaults,
- deterministic seed controls where applicable.

---

## 4) UX implementation checklist for parity
- [ ] Every original control listed above has a mapped main-tool param.
- [ ] Every mapped param has schema default + label + range/options.
- [ ] Every module exposes programmatic IO equivalent to original runtime access.
- [ ] Node wrappers surface all user-visible params in registry/UI.
- [ ] Export and recorder states are visible in UX and queryable in runtime state.
