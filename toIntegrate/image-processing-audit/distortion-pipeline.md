# distortion-pipeline (`toIntegrate/distortion-pipeline.html`)

## Scope and runtime architecture
- Source analyzed: `toIntegrate/distortion-pipeline.html`.
- App type: single-file node-graph raster processor with p5 viewport host.
- Important implementation note: processing classes are intentionally minified/compressed into long single lines; function-level behavior is present but line granularity is coarse.

## Core modules required for processing

### 1) Low-level utilities
- `SeededRNG` and `hashSeed` provide deterministic pseudo-random values per node/frame/sample.
- `PerlinNoise` provides procedural fields for warp/distortion nodes.
- `Sampler` provides nearest/bilinear RGBA sampling and bounds clamping.

Source anchors: lines 318-321.

### 2) Node base contract
- `EffectNode` defines:
  - metadata (`type`, `name`),
  - enable/opacity state,
  - parameter definition schema,
  - default parameter instantiation,
  - serialization (`toJSON`) and restore (`fromJSON`).
- All effect nodes implement `apply(src,dst,w,h,ctx)`.

Source anchor: line 323.

### 3) Implemented node classes and mechanisms
From compressed class declarations:
- `GreyscaleNode`: weighted luminance channel collapse.
- `LevelsNode`: LUT-based black/white/gamma remap with output range.
- `ContrastNode`: lift/gamma/gain/pivot contrast shaping.
- `BoxBlurNode`: separable box blur with radius/passes and preview simplification.
- `GaussianBlurNode`: separable gaussian convolution with sigma-based kernel.
- `AffineTransformNode`: translate/rotate/scale around center with resampling mode.
- `FlowFieldNode` (present in registry): procedural field warp.
- `BandShiftNode` (present in registry): banded displacement shift.
- `RadialRippleNode` (present in registry): radial periodic refractive warp.
- `LensBubblesNode`: seeded bubble lenses with magnification and soft edges.
- `IterativeRewarpNode`: multi-sample jitter accumulation with equal/decay weighting.

Primary anchors: lines 325-335 and registry line 337.

### 4) Node registry (`REG`)
- Categories and factories:
  - COLOUR/TONE,
  - BLUR,
  - TRANSFORM,
  - WARP,
  - REFRACTION,
  - ACCUMULATION.
- Registry is the source-of-truth for add-menu capabilities and recipe import mapping.

Source anchor: line 337.

### 5) State module (`AppState`) defaults
Key defaults:
- `previewScale: 0.5`.
- `quality: 'final'`.
- `globalSeed: 42`.
- zoom fit/level/pan defaults.
- empty stack and render invalidation flags.

Source anchor: line 340.

### 6) Execution pipeline (`Pipeline`)
**Mechanism**
1. Skip if no source pixels or already rendering.
2. Choose preview/final resolution.
3. Downsample source for preview (`_ds`) using bilinear sampling.
4. Filter enabled nodes (or solo node).
5. For each node:
   - build execution context including deterministic `nodeSeed`,
   - run `node.apply` into working buffer,
   - if node opacity <1, alpha-blend node output with previous buffer.
6. Swap ping-pong buffers each node.
7. Return final pixel buffer + dimensions.

Also provides `renderFinal()` convenience wrapper.

Source anchor: line 341.

### 7) Recipe module (`Recipe`)
- `exp`: exports full pipeline state as JSON.
- `imp`: recreates stack from type registry, restoring parameters and defaults.

Source anchor: line 342.

### 8) UI and viewport processing path
- UI class handles image load, stack editing, seed changes, presets, and export triggers.
- PNG export path calls `Pipeline.renderFinal()`, writes `ImageData` to temp canvas, then downloads.
- p5 draw step places processed pixel buffer into viewport with zoom/pan framing.

Anchors: lines 344-354, line 367.

## End-to-end process
1. Load image into `state.sourcePixels`.
2. Build/modify node stack using registry factories.
3. `Pipeline.render()` applies enabled nodes in order with deterministic per-node context.
4. p5 viewport draws processed image buffer.
5. Export as PNG or recipe JSON when requested.

## Capability summary
- Full stackable raster effects pipeline (tone, blur, affine, warps, refraction, accumulative rewarps).
- Deterministic seeded behavior for stochastic nodes.
- Preview-performance mode with reduced scale/sampling quality.
- Serializable recipes for exact pipeline replay.

## Limitation note
- Because source is minified inline, individual helper statements within nodes share single-line anchors; references above point to canonical declaration lines containing full implementations.

## Breakdown for integration into the main tool (`src/modules/*` + node runtime)

### Target module decomposition
1. **Node algorithm extraction**
   - Keep per-effect pure kernels in domain modules:
     - color/tone -> `src/modules/color/*`,
     - blur/convolution -> (new `src/modules/filter/*` or existing blur node internals migrated),
     - warp/refraction -> `src/modules/field/*` + dedicated warp kernels,
     - accumulation -> dedicated `src/modules/accumulation/*` utility.

2. **Node contract wrappers**
   - Preserve `EffectNode` wrappers in `src/nodes/*` so pipeline features remain intact (enabled/solo/mask/opacity/serialization).

3. **Pipeline execution compatibility**
   - Continue using `src/core/Pipeline.js` as orchestration boundary.
   - Delegate node internals to `src/modules/*` functions, not vice-versa.

4. **Registry/category mapping**
   - Mirror source categories using `src/nodes/registry.js` groups:
     - Colour/Tone,
     - Blur,
     - Transform,
     - Warp,
     - Refraction/Optics,
     - Accumulation.

5. **Schema-driven params**
   - Move node param definitions toward `src/modules/core/param-schema.js` so UI/recipes share canonical defaults.

6. **Optional shader acceleration path**
   - For heavy blur/warp nodes, add optional backend using `src/modules/shader/gl-kernel-runtime.js` while keeping CPU parity path.

### Recommended migration sequence
1. De-minify into testable pure kernels per node family.  
2. Wire wrappers for one family at a time (tone -> blur -> warp).  
3. Add deterministic checksum tests across preview/final quality modes.  
4. Add optional shader backend for bottleneck nodes once CPU parity is stable.
