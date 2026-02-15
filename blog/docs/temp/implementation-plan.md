# Implementation Plan — 48 Nodes + 8 Performance Optimisations

Total: 26 general-purpose nodes + 22 algorithm-derived nodes + 8 perf upgrades.
Interleaved so perf infrastructure lands before the node count makes it necessary.

---

## Sprint 1 — Performance Foundation

### 1.1 BufferPool
New file: `core/BufferPool.js`
- `acquire(size)` returns recycled or new `Uint8ClampedArray`
- `release(buf)` returns buffer to pool
- Wire into `Pipeline.render()` for bufA, bufB, opacity tmp

### 1.2 Dirty-Node Cache
Modify: `core/Pipeline.js`, `nodes/EffectNode.js`
- Add `_cache: Uint8ClampedArray|null` and `_cacheValid: boolean` to EffectNode
- Pipeline tracks `dirtyIndex`; on render, starts from first invalid node
- `UI._p()` setter calls `node.invalidate()` which clears cache for node..end
- Reorder/delete/toggle invalidates from affected index

### 1.3 ViewportRenderer Reuse
Modify: `render/ViewportRenderer.js`
- Cache one `OffscreenCanvas` and one `ImageData`; resize only when dimensions change
- Eliminate per-frame `createElement('canvas')` and `new ImageData`

### 1.4 Progressive Preview
Modify: `ui/UI.js` parameter row factory
- `input` event → `state.previewScale = 0.25`, queue render
- `change` event → `state.previewScale = 0.5`, queue render
- Debounce: cancel pending render on new input within 16ms

---

## Sprint 2 — General-Purpose Colour/Tone Nodes (8 nodes)

### 2.1 InvertNode
`nodes/colour/InvertNode.js` — `d[i] = 255 - s[i]` per channel. LUT-eligible.

### 2.2 HSLAdjustNode
`nodes/colour/HSLAdjustNode.js` — hue shift, saturation multiply, lightness offset.
Params: hue (-180..180), saturation (0..3), lightness (-1..1).
Convert RGB→HSL per pixel, adjust, convert back.

### 2.3 ChannelMixerNode
`nodes/colour/ChannelMixerNode.js` — 3x3 matrix multiply on [R,G,B].
Params: rr, rg, rb, gr, gg, gb, br, bg, bb (9 weights). LUT-eligible (per-channel).

### 2.4 ColourBalanceNode
`nodes/colour/ColourBalanceNode.js` — shadows/midtones/highlights tinting.
Params: shadowR, shadowG, shadowB, midR, midG, midB, highR, highG, highB.
Classify each pixel luminance into shadow/mid/high, apply weighted offset.

### 2.5 GradientMapNode
`nodes/colour/GradientMapNode.js` — luminance → 2-stop or 5-stop colour ramp.
Params: colorA, colorB (hex strings or RGB triplets), stops. LUT-eligible.

### 2.6 TemperatureTintNode
`nodes/colour/TemperatureTintNode.js` — white balance shift.
Params: temperature (-100..100), tint (-100..100).
Apply blue↔yellow (temperature) and green↔magenta (tint) offset scaled by luminance.

### 2.7 VibranceNode
`nodes/colour/VibranceNode.js` — selective saturation boost.
Params: vibrance (-1..1).
Boost saturation inversely proportional to current saturation. Protects already-saturated pixels.

### 2.8 CurvesNode
`nodes/colour/CurvesNode.js` — arbitrary per-channel transfer function.
Params: curvePoints (array of {x,y} control points per channel). Internally spline-interpolated to 256-entry LUT. LUT-eligible.

---

## Sprint 3 — Sampler Inlining + LUT Fusion

### 3.1 Sampler Inlining
Modify 6 warp nodes: FlowFieldNode, BandShiftNode, AffineTransformNode, RadialRippleNode, LensBubblesNode, IterativeRewarpNode.
- Inline bilinear/nearest math directly in `apply()` loops
- Eliminate per-pixel array allocation from `Sampler.bilinear()`
- Keep `Sampler` class as utility for non-hot-path uses

### 3.2 LUT Fusion
Modify: `core/Pipeline.js`, `nodes/EffectNode.js`
- Add `EffectNode.isLUT` flag (default false)
- Add `EffectNode.buildLUT(lutR, lutG, lutB)` method (no-op default)
- Implement `buildLUT` on: GreyscaleNode, LevelsNode, ContrastNode, InvertNode, CurvesNode, ChannelMixerNode, GradientMapNode
- Pipeline detects consecutive runs of LUT nodes, fuses into single pass

---

## Sprint 4 — Sharpening + Blur Extensions (6 nodes)

### 4.1 UnsharpMaskNode
`nodes/sharpen/UnsharpMaskNode.js` — subtract Gaussian blur, add back scaled.
Params: amount (0..5), radius (0.1..20), threshold (0..255).
Reuses GaussianBlur internals.

### 4.2 HighPassNode
`nodes/sharpen/HighPassNode.js` — src minus blur, shifted to mid-grey.
Params: radius (0.1..50). Output is detail extraction; blend as overlay for sharpening.

### 4.3 MotionBlurNode
`nodes/blur/MotionBlurNode.js` — directional 1D blur along angle.
Params: angle (0..360), distance (1..100).
Sample along line using bilinear interpolation.

### 4.4 RadialBlurNode
`nodes/blur/RadialBlurNode.js` — spin or zoom blur from centre.
Params: type (spin/zoom), centreX, centreY, amount (1..50), samples (4..32).
Accumulate rotated/scaled samples.

### 4.5 MedianFilterNode
`nodes/blur/MedianFilterNode.js` — non-linear noise reduction.
Params: radius (1..5).
Per-pixel: gather neighbourhood, sort per channel, take median. Use histogram-based O(1) sliding window for radius>2.

### 4.6 BilateralFilterNode
`nodes/blur/BilateralFilterNode.js` — edge-preserving smooth.
Params: spatialSigma (1..20), rangeSigma (10..100).
Gaussian spatial weight × range weight per neighbour.

---

## Sprint 5 — Distortion + Film Nodes (8 nodes)

### 5.1 PixelateNode
`nodes/distortion/PixelateNode.js` — block mosaic.
Params: blockSize (2..100).
Average each block, fill block with average colour.

### 5.2 PolarCoordsNode
`nodes/distortion/PolarCoordsNode.js` — rect↔polar transform.
Params: mode (rectToPolar/polarToRect), centreX, centreY.

### 5.3 SpherizeNode
`nodes/distortion/SpherizeNode.js` — bulge/pinch mapped to sphere.
Params: amount (-1..1), centreX, centreY, radius (0..1).

### 5.4 TwirlNode
`nodes/distortion/TwirlNode.js` — angular displacement by distance.
Params: angle (-720..720), centreX, centreY, radius (0..1).

### 5.5 ChromaticAbNode
`nodes/distortion/ChromaticAbNode.js` — per-channel radial offset.
Params: redShift, blueShift (-20..20), centreX, centreY.
Sample R, G, B channels at slightly different radial positions.

### 5.6 FilmGrainNode
`nodes/texture/FilmGrainNode.js` — photographic noise.
Params: amount (0..100), size (1..3), luminanceResponse (0..1), chromatic (bool).
Seeded RNG per pixel, luminance-weighted variance.

### 5.7 VignetteNode
`nodes/texture/VignetteNode.js` — radial exposure falloff.
Params: amount (0..1), softness (0..1), roundness (0..1).
Multiply pixel by radial gradient.

### 5.8 ScanlinesNode
`nodes/texture/ScanlinesNode.js` — periodic horizontal darkening.
Params: spacing (1..10), thickness (0..1), opacity (0..1).
Multiply pixels on even rows by darkening factor.

---

## Sprint 6 — Morphological + Histogram Nodes (4 nodes)

### 6.1 DilateErodeNode
`nodes/morphology/DilateErodeNode.js` — expand or shrink bright regions.
Params: mode (dilate/erode), radius (1..10), shape (square/circle).
Max/min filter over structuring element.

### 6.2 OpenCloseNode
`nodes/morphology/OpenCloseNode.js` — compound morphological operation.
Params: mode (open/close), radius (1..10).
Open = erode then dilate. Close = dilate then erode.

### 6.3 HistogramEQNode
`nodes/colour/HistogramEQNode.js` — global histogram equalisation.
Compute CDF from histogram, build LUT, apply. LUT-eligible.

### 6.4 CLAHENode
`nodes/colour/CLAHENode.js` — contrast-limited adaptive histogram equalisation.
Params: tileSize (8..64), clipLimit (1..10).
Divide image into tiles, equalise each with clip limit, bilinear interpolate between tiles.

---

## Sprint 7 — Worker Thread Pipeline

### 7.1 RenderWorker
New file: `core/RenderWorker.js` (worker entry point)
- Receives: `{type:'render', stack, sourcePixels, params}` via postMessage
- Imports Pipeline, all node classes, registry
- Runs `Pipeline.render()`, posts result back via Transferable
- Supports `{type:'cancel'}` to abort in-flight render

### 7.2 WorkerBridge
New file: `core/WorkerBridge.js` (main thread)
- Manages worker lifecycle
- `queueRender(state)` → serialise stack + params, post to worker
- On result message → update ViewportRenderer
- Debounce: new render cancels pending one
- Fallback: if Worker unavailable, run Pipeline synchronously (current behaviour)

### 7.3 Wire into main.js
- Replace direct `pipe.render()` with `bridge.queueRender()`
- UI callbacks unchanged; only the render path changes

---

## Sprint 8 — Algorithm-Derived Nodes: Edge + Pattern (8 nodes)

### 8.1-8.4 Edge Nodes
`nodes/edge/SobelNode.js`, `CannyNode.js`, `LaplacianNode.js`, `DoGNode.js`
- Inline convolution kernels (avoid `algorithms/core/matrix.js` import complexity)
- Each extracts greyscale from src, runs operator, maps magnitude→pixel buffer

### 8.5-8.8 Pattern Nodes
`nodes/pattern/TruchetNode.js`, `GratingNode.js`, `MoireNode.js`, `HalftonePatternNode.js`
- Truchet: generate grid from seed, evaluate SDF per pixel
- Grating: pure per-pixel math (linear/radial/angular/spiral)
- Moire: two gratings combined (product/sum/xor/min/max)
- Halftone: line family/crosshatch/dyadic, render to offscreen canvas

---

## Sprint 9 — Algorithm-Derived Nodes: Noise + Physics (5 nodes)

### 9.1-9.2 Noise Nodes
`nodes/noise/PerlinOverlayNode.js`, `DomainWarpNode.js`
- PerlinOverlay: generate simplex/perlin fBm field, blend with src (add/multiply/screen)
- DomainWarp: warp src coordinates via noise, sample with bilinear

### 9.3-9.5 Physics Nodes
`nodes/physics/ReactionDiffusionNode.js`, `WaveDistortionNode.js`, `CellularAutomataNode.js`
- RD: init from src luminance, run Gray-Scott N steps, map V→pixels
- Wave: init 2D wave, step N times, use height as displacement to warp src
- CA: threshold src→seed, run automaton N steps, output as binary mask blended with src

---

## Sprint 10 — Algorithm-Derived Nodes: Tier 2+3 (9 nodes)

### 10.1-10.3 Image Processing
`nodes/colour/PosterizeNode.js`, `nodes/segmentation/OtsuThresholdNode.js`, `nodes/warp/AdvectionNode.js`

### 10.4-10.6 Geometric
`nodes/geometric/VoronoiNode.js`, `ContourNode.js`, `SDFShapeNode.js`

### 10.7-10.9 Composite Render
`nodes/composite/StippleNode.js`, `DelaunayMeshNode.js`, `nodes/optics/InterferenceNode.js`

---

## Sprint 11 — WebGL Shader Pipeline

### 11.1 GLPipeline
New file: `core/GLPipeline.js`
- Create WebGL2 context on OffscreenCanvas (in worker)
- Fullscreen quad VAO, ping-pong framebuffer textures
- `runShaderChain(texIn, shaderNodes)` → texOut
- `readPixels()` for CPU node handoff

### 11.2 EffectNode GLSL Protocol
Modify: `nodes/EffectNode.js`
- Add `glsl()` method returning `{fragment: string, uniforms: {name→value}}`
- Default returns `null` (CPU-only)
- Pipeline checks: if all consecutive nodes have `glsl()`, batch into GL chain

### 11.3 Shader Implementations
Add `glsl()` to: GreyscaleNode, LevelsNode, ContrastNode, InvertNode, HSLAdjustNode, ChannelMixerNode, ColourBalanceNode, GradientMapNode, VibranceNode, TemperatureTintNode, QuantiseNode, VignetteNode, ChromaticAbNode, GratingNode, MoireNode.
15 nodes → GPU. Covers the most common stacks.

### 11.4 Blur Shaders
Add `glsl()` to: BoxBlurNode, GaussianBlurNode, UnsharpMaskNode.
Two-pass separable: horizontal then vertical. Requires ping-pong FBO.

---

## Sprint 12 — Registry, Presets, Integration

### 12.1 Update Registry
Add all 48 new nodes to `nodes/registry.js` in appropriate categories.
New categories: SHARPEN, DISTORTION, TEXTURE, MORPHOLOGY, SEGMENTATION, GEOMETRIC, OPTICS.

### 12.2 New Presets
Add preset recipes exercising new nodes:
- CORRODED: canny → reaction-diffusion → levels → dither
- ENGRAVE: greyscale → luminance flow (static lines)
- HOLOGRAM: chromatic aberration → grating → scanlines → vignette
- LITHO: greyscale → posterize → halftone pattern
- GLITCH: pixelate → band shift → chromatic ab → scanlines
- WATERCOLOUR: bilateral → paint stroke → vignette
- DARKROOM: curves → vibrance → vignette → film grain
- ETCH: sobel → invert → levels → dither

### 12.3 Fn-Key Bar
Update `index.html` fn-key bar with best 3 new presets.
Total preset slots: 11 (existing) + 3 = 14.

---

## Totals

| Item | Count |
|------|-------|
| Existing nodes | 18 |
| New general-purpose nodes (sprints 2,4,5,6) | 26 |
| New algorithm-derived nodes (sprints 8,9,10) | 22 |
| **Total nodes** | **66** |
| Performance upgrades | 8 |
| New core files | 4 (BufferPool, RenderWorker, WorkerBridge, GLPipeline) |
| Modified core files | 4 (Pipeline, EffectNode, ViewportRenderer, main.js) |
| New categories | 7 (SHARPEN, DISTORTION, TEXTURE, MORPHOLOGY, SEGMENTATION, GEOMETRIC, OPTICS) |
| New preset recipes | 8 |

## Sprint Dependency Graph

```
Sprint 1 (perf foundation)
  ├──► Sprint 2 (colour nodes) ──► Sprint 3 (LUT fusion + sampler inline)
  ├──► Sprint 4 (sharpen + blur)
  ├──► Sprint 5 (distortion + film)
  ├──► Sprint 6 (morphology + histogram)
  │
  ├──► Sprint 7 (worker thread) ──► Sprint 11 (WebGL)
  │
  ├──► Sprint 8 (edge + pattern)
  ├──► Sprint 9 (noise + physics)
  └──► Sprint 10 (tier 2+3)

Sprint 12 (registry + presets) ← all above
```

Sprints 2-6 and 8-10 are independent of each other; parallelisable.
Sprint 7 depends on Sprint 1. Sprint 11 depends on Sprint 7.
Sprint 12 is final integration after all others complete.
