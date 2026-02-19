# tile2 (`toIntegrate/tile2`)

## Scope and dependencies
- Source analyzed: `toIntegrate/tile2/tile2/src/script.js`.
- Runtime architecture: main thread controller + worker rendering engine.
- Rendering backends:
  - preferred WebGL2 shader path,
  - fallback Canvas2D path.

## Required internal modules

### 1) Worker source builder (`buildWorkerSource`)
- Generates worker JS as Blob text including vertex/fragment shaders and render loop handlers.
- Bundles all processing logic to avoid external imports.

Source anchors: lines 95-629.

### 2) Shader processing module
#### Vertex shader (`VERT`)
- Applies zoom/pan in pixel space before NDC conversion.
- Passes UVs to fragment stage.

#### Fragment shader (`FRAG`)
- Samples two textures.
- Blend/effect modes:
  - mode 0: passthrough A,
  - mode 1: crossfade (`mix` with `u_mix`),
  - mode 2: multiply,
  - mode 3: absolute difference.
- Post-process tone mapping:
  - exposure as `exp2(exposure)` gain,
  - gamma via `pow(..., invGamma)`.

Source anchors: lines 99-189.

### 3) GL setup and texture upload
- `initGL`: context + program + quad VAO/VBO + uniform setup.
- `createTextureFromSource`: uploads RGBA texture, linear filtering, clamp edges, disables colorspace conversion.
- `setViewport`: updates viewport and canvas-size uniform.

Source anchors: lines 283-393.

### 4) Input resampling module
- `resampleBitmap(bitmap, maxShortSide)` downsamples oversized frames using `OffscreenCanvas` 2D draw.
- In `load-images`, sources above short-side threshold are resampled before texture creation.

Source anchors: lines 395-419, 525-553.

### 5) Worker command protocol
- `init`: initialize backend/context.
- `resize`: adjust output dimensions.
- `load-images`: ingest bitmaps and build texture list.
- `advance` / `seek`: render specific frame index.
- `fps`: set playback cadence.
- `params`: effect/exposure/gamma updates.
- `zoom`: transform updates.

Source anchors: lines 481-625.

### 6) Main-thread orchestration
- `initAnimationEngine`: creates worker, transfers offscreen canvas, watches canvas size changes.
- `_toBitmap` + `loadImagesFromUrls`: fetch→blob→`ImageBitmap` conversion (`colorSpaceConversion:'none'`) and transfer.
- `play/pause/_tick`: frame stepping based on target FPS.
- UI controls push params and zoom continuously.

Source anchors: lines 653-915.

## Defaults and runtime capabilities
- Initial FPS target: 24.
- Initial effect path: `passthrough` with exposure `0.0`, gamma `1.0`.
- Zoom defaults: scale 1, no pan.
- Auto-resize observer keeps worker output matched to canvas pixel size.

Source anchors: lines 83-92, 205-212, 653-723.

## End-to-end processing process
1. Main thread initializes worker and rendering surface.  
2. Images are fetched and decoded to bitmaps.  
3. Worker converts bitmaps into GPU textures (or metadata for 2D fallback).  
4. Playback loop sends `advance(frame)` messages.  
5. Worker renders selected frame pair using chosen effect + tone map + zoom transform.

## Notes
- This is a real-time image compositing/animation renderer, not a static quantizer.
- `src/script.js` and `dist/script.js` are identical in this repository snapshot.

## Breakdown for integration into the main tool (`src/modules/*` + node runtime)

### Target module decomposition
1. **Worker timing/transport**
   - Map playback/tick lifecycle to `src/modules/shader/worker-animation-driver.js`.
   - Keep message protocol (`init/load-images/advance/params/zoom`) as module contract.

2. **Shader compilation/runtime**
   - Place shader program management in `src/modules/shader/gl-kernel-runtime.js`.
   - Add concrete WebGL backend implementation behind current simulation hook.

3. **Image ingest and remap**
   - Reuse `src/modules/core/image-io.js` for image asset creation/remap and color-space metadata handling.

4. **Effect parameter model**
   - Define shader params (`effect`, `exposure`, `gamma`, `zoom`) in `param-schema` so node/UI are synchronized.

5. **Node-level wrappers**
   - Implement/extend node(s) under `src/nodes/composite` or `src/nodes/warp` as GPU-capable compositing nodes.
   - CPU fallback path can delegate to existing raster apply pipeline when GPU unavailable.

6. **Export/timeline hooks**
   - Use `src/modules/export/timeline-recorder.js` for frame telemetry and optional deterministic capture.

### Recommended migration sequence
1. Stabilize worker protocol and timing in module driver.  
2. Land GL runtime backend and uniform mapping.  
3. Add node wrapper with CPU fallback and parity tests.  
4. Wire UI controls to schema-backed params.  
5. Add playback/export integration tests.
