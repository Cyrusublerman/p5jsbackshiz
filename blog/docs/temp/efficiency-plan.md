# Efficiency Plan

## Current Bottlenecks (ranked by severity)

### 1. Main-thread blocking
`Pipeline.render()` is synchronous. A 10-node stack on a 2000x1500 image freezes the UI for seconds. Every slider drag triggers a full re-render.

### 2. Full-stack re-render on any change
Changing node 8 of 10 re-runs nodes 1-7 identically. No caching.

### 3. Per-render allocation pressure
Each `render()` call allocates:
- 1x source copy (`new Uint8ClampedArray(sourcePixels)`)
- 1x bufB (`new Uint8ClampedArray(w*h*4)`)
- 1x tmp per fractional-opacity node
- ViewportRenderer: 1x ImageData + 1x `createElement('canvas')` per draw frame (20fps = 20 canvases/sec GC'd)

For a 3000x2000 image: 24MB per buffer. 3 allocations = 72MB churn per render.

### 4. No GPU acceleration
Every pixel loop is scalar JS. Nodes like Greyscale (`3 multiplies + 2 adds per pixel`) are trivially parallelisable but run single-threaded.

### 5. Unoptimised inner loops
- `Sampler.bilinear()` returns `r[]` array (heap alloc per pixel call)
- FlowField/BandShift call `Sampler.sample()` per pixel (function dispatch overhead)
- Opacity blend is a separate 4-channel loop instead of fused

---

## Solutions (ordered by impact÷effort)

### A. Worker Thread Pipeline (high impact, moderate effort)
Move `Pipeline.render()` to a Web Worker.

**Architecture:**
```
Main thread                    Worker thread
───────────                    ─────────────
UI.onRender() ──postMessage──► Pipeline.render()
              ◄─postMessage──  {pixels, w, h, time}
ViewportRenderer.draw()
```

**Key details:**
- Transfer `sourcePixels` via `Transferable` (zero-copy)
- Worker owns all buffers; main thread only receives result for display
- Slider changes post debounced param messages; worker cancels in-flight render
- `SharedArrayBuffer` option: worker writes directly to shared buffer, main thread reads without copy

**Result:** UI never freezes. Render runs at full speed on separate core.

### B. Dirty-Node Caching (high impact, low effort)
Cache the output buffer after each node. On re-render, skip all nodes before the dirty one.

**Architecture:**
```
state.stack[0].cache = Uint8ClampedArray  // greyscale output
state.stack[1].cache = Uint8ClampedArray  // levels output
state.stack[2].cache = null               // ← user changed this param
state.stack[3].cache = null               // invalidated (downstream)
```

**Rules:**
- `node.dirtyIndex`: track which node changed
- On render: start from `dirtyIndex`, feed `stack[dirtyIndex-1].cache` as input
- Invalidate: changing node N invalidates N..end
- Toggling enable/solo invalidates from that node onward
- Reorder invalidates from min(old, new) position

**Cost:** One extra buffer per node (at preview res = small). For 10 nodes on a 1000x750 preview: 30MB total cache. Acceptable.

**Result:** Changing the last node in a 10-node stack is 10x faster.

### C. Buffer Pool (moderate impact, low effort)
Pre-allocate a fixed set of `Uint8ClampedArray` buffers; recycle instead of allocating.

```js
class BufferPool {
  constructor() { this.pool = []; }
  acquire(size) {
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i].length === size) return this.pool.splice(i, 1)[0];
    }
    return new Uint8ClampedArray(size);
  }
  release(buf) { this.pool.push(buf); }
}
```

Apply to:
- `Pipeline.render()`: bufA, bufB, tmp
- `ViewportRenderer.draw()`: reuse single OffscreenCanvas + ImageData

**Result:** Eliminates ~72MB/render GC churn. Smoother frame pacing.

### D. LUT Fusion (moderate impact, low effort)
Consecutive LUT-able nodes (Greyscale→Levels→Contrast→Invert→Posterize) can be fused into a single 256-entry lookup per channel.

**Detection:** Mark nodes with `node.isLUT = true` and a `node.buildLUT(channelLUTs)` method.

**Fusion:**
```js
// Instead of 4 separate pixel loops:
const lutR = new Uint8Array(256);
const lutG = new Uint8Array(256);
const lutB = new Uint8Array(256);
for (let i = 0; i < 256; i++) { lutR[i] = lutG[i] = lutB[i] = i; }
for (const node of consecutiveLUTNodes) {
  node.buildLUT(lutR, lutG, lutB);
}
// Single pass:
for (let i = 0; i < n; i += 4) {
  d[i] = lutR[s[i]]; d[i+1] = lutG[s[i+1]]; d[i+2] = lutB[s[i+2]]; d[i+3] = s[i+3];
}
```

**Applicable to:** Greyscale, Levels, Contrast, Invert, Posterize, Curves, Channel Mixer (partially). Currently 3 of the most-used nodes.

**Result:** 5 consecutive tone nodes become 1 pixel loop. 5x faster for common stacks.

### E. WebGL Shader Nodes (highest ceiling, high effort)
Replace pixel loops with fragment shaders for nodes that are pure per-pixel math.

**Architecture:**
```
Pipeline: texture₀ ──[shader₁]──► texture₁ ──[shader₂]──► texture₂ ──...──► readPixels
```

**Shader-eligible nodes (pure pixel math, no neighbor access):**
- Greyscale, Levels, Contrast, Invert, Quantise, HSL, Channel Mixer, Gradient Map, Vibrance, Colour Balance, Temperature — all expressible as `vec4 process(vec4 pixel, uniforms)`

**Shader-eligible (with texture lookups for neighbors):**
- BoxBlur, GaussianBlur, Sobel, Median, Unsharp Mask, Sharpen

**Must stay CPU:**
- FlowField (noise generation), PaintStroke (iterative), Reaction-Diffusion (simulation), Serpentine (wave fronts)

**Implementation approach:**
1. Add `node.glsl()` method returning fragment shader string
2. Pipeline detects runs of GL-capable nodes, batches them
3. CPU nodes break the chain: readPixels → CPU apply → texImage2D
4. Hybrid: most nodes GPU, heavy generative ones CPU

**Result:** 50-100x speedup for tone/colour/blur nodes. A 4K image with 5 tone nodes renders in <5ms instead of 200ms.

### F. Uint32 Pixel Access (low effort, moderate impact on simple loops)
Read/write RGBA as a single 32-bit integer where channels are independent.

```js
const src32 = new Uint32Array(s.buffer);
const dst32 = new Uint32Array(d.buffer);
// Copy with alpha preservation:
for (let i = 0; i < src32.length; i++) dst32[i] = src32[i];
```

For opacity blending, use bitwise channel extraction:
```js
const r = (px >> 0) & 0xFF;
const g = (px >> 8) & 0xFF;
// etc.
```

Reduces loop iterations by 4x for simple copies. Helps Invert, threshold, mask operations.

### G. Debounced Progressive Rendering
During slider drag: render at 25% resolution, display immediately.
On mouseup: render at full preview (50%) or final (100%).

```js
slider.addEventListener('input', () => {
  state.previewScale = 0.25;  // fast drag
  queueRender();
});
slider.addEventListener('change', () => {
  state.previewScale = 0.5;   // release
  queueRender();
});
```

**Result:** Interactive 60fps feedback even on complex stacks.

### H. Sampler Inlining
`Sampler.bilinear()` allocates a `r[]` array per call (heap). Inline the math and write directly to dst:

```js
// Before (per-pixel heap alloc):
const c = Sampler.bilinear(s, w, h, fx, fy);
d[i] = c[0]; d[i+1] = c[1]; ...

// After (zero alloc):
const x0 = fx|0, y0 = fy|0, dx = fx-x0, dy = fy-y0;
const i00 = (clamp(y0,h)*w + clamp(x0,w)) * 4;
// ... direct computation into d[i], d[i+1], d[i+2], d[i+3]
```

**Applicable to:** FlowField, BandShift, AffineTransform, RadialRipple, LensBubbles, IterativeRewarp — the 6 heaviest nodes.

**Result:** ~30% speedup on warp nodes (eliminates millions of array allocations per render).

---

## Implementation Order

| Phase | Change | Impact | Effort | Notes |
|-------|--------|--------|--------|-------|
| 1 | Buffer Pool (C) | ★★★ | ★ | 30 lines. Eliminates GC stalls. |
| 2 | Dirty-Node Cache (B) | ★★★★ | ★★ | ~60 lines in Pipeline. Biggest single win. |
| 3 | ViewportRenderer reuse | ★★ | ★ | Cache OffscreenCanvas + ImageData. 10 lines. |
| 4 | Sampler inlining (H) | ★★★ | ★★ | Per-node refactor of 6 warp nodes. |
| 5 | LUT fusion (D) | ★★★ | ★★ | Add isLUT protocol + fusion pass in Pipeline. |
| 6 | Progressive preview (G) | ★★★ | ★ | Slider event split. Immediate UX improvement. |
| 7 | Worker thread (A) | ★★★★★ | ★★★ | Biggest architectural change. Unblocks UI. |
| 8 | WebGL shaders (E) | ★★★★★ | ★★★★ | Highest ceiling. Phase over time per-node. |
