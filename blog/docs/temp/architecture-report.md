# DISTORT — Architecture Report

83 source files. 6553 LOC. 67 EffectNode subclasses. 20 categories. 12 presets.

---

## 1. How It Works

### Data Flow

```
Image File → AppState.sourcePixels (Uint8ClampedArray RGBA)
           → Pipeline.render()
             → for each enabled node:
                 buildMask() if masked
                 node.apply(inputBuf, outputBuf, w, h, ctx)
                 mask blend: out = in*(1-op*mask) + nodeOut*(op*mask)
                 cache output
             → return {pixels, w, h}
           → ViewportRenderer.draw()
             → OffscreenCanvas → p5 drawImage with zoom/pan
```

### Module System

Each node is a self-contained ES module exporting one class that extends `EffectNode`. The class declares its parameter schema in the constructor and implements `apply(src, dst, w, h, ctx)`. Registration happens in `registry.js` which maps `{type, label, factory}` entries under category keys. The UI reads this registry to build the add-node dropdown; Pipeline reads it to reconstruct stacks from JSON recipes.

### Performance Stack

1. **BufferPool**: typed array recycling eliminates GC churn
2. **Dirty-node cache**: per-node output caching, skip unchanged prefixes
3. **LUT fusion**: consecutive per-channel tone nodes fuse into one table pass
4. **Sampler inlining**: zero-alloc bilinear writes directly to dst buffer
5. **Progressive preview**: 0.25x resolution during slider drag
6. **ViewportRenderer reuse**: single OffscreenCanvas + ImageData persisted
7. **WorkerBridge → RenderWorker**: off-main-thread rendering via Transferable
8. **GLPipeline**: WebGL2 ping-pong FBO chain for GPU-capable nodes

### Masking

Per-node mask (single-channel Uint8Array) modulates effect opacity spatially. Sources: luminance auto-extract, radial gradient, uploaded image. Pipeline handles blending universally — no node code changes needed. Masked nodes are excluded from LUT fusion.

### Parameter Modulation

Uploaded images (depth maps, etc.) stored in `AppState.modulationMaps`. Pipeline rescales to render dimensions and extracts luminance. Nodes call `getModulated(key, pixelIdx, ctx)` for spatially-varying parameter values. Five nodes currently support it (ContrastNode, GaussianBlurNode, ChromaticAbNode, FilmGrainNode, VignetteNode).

---

## 2. Swiss Design Audit

### What's Correct

- **Grid**: CSS Grid `300px 1fr` columns, `24px 22px 1fr 24px` rows. Strict two-column layout with fixed sidebar. All elements snap to grid lines.
- **Typography**: Courier New monospace throughout. Uppercase labels. Letter-spacing on section headers. 9-11px range. Three-tier hierarchy: --text-hi (white), --text (grey), --text-dim (dark grey).
- **Chromatic restraint**: Pure monochrome palette (#1a1a1a → #cccccc). No hue anywhere. Only value contrast.
- **Indicator language**: 9x9px squares (on/off binary), 3x11px vertical bars. No rounded corners. No gradients on controls.
- **Structural ornament**: Scanline overlay, vignette, dashed crosshairs, concentric rings, crop marks — all serve as spatial reference, not decoration.
- **Fn-key bar**: DOS/terminal idiom. Fixed at bottom. Keyboard-first design.

### What Violates Swiss Principles

**Problem 1 — Information hierarchy collapse.** Header row 1 packs 9 data cells (clock, seed, image info, mode, render time, node count, zoom) into a single 24px bar. At 1920px width these are legible. At 1280px they compress into unreadable fragments. Swiss design requires every element to have sufficient space to breathe. The cells need minimum widths or the bar needs to wrap to two rows on smaller viewports.

**Problem 2 — Fn-key bar overflow.** 15 buttons at 10px font in a single row. At 1280px each button gets ~85px. At 1024px it's ~68px and labels truncate. The DATAMSH/ENGRAVE/WAVFRM/SIGNAL presets are already abbreviated abbreviations. Swiss design would group these into a separate preset selector rather than cramming them inline. The fn-key bar should hold only the 8 core operations; presets belong in a secondary menu.

**Problem 3 — Left panel has no scroll position indicator.** With 66 nodes available and potentially 15+ in a stack, each with 5-12 parameters plus mask controls plus modulation rows, the left panel becomes a long scroll. No breadcrumb, no minimap, no sticky category headers. The user loses spatial context.

**Problem 4 — Parameter labels truncate.** `.pl` is 68px wide with `text-overflow: ellipsis`. Labels like "TRANSLATE X" and "CURVE STR" are already at the limit. Modulation adds "→ MOD" rows at 52px. On a 300px panel with 30px indent, the label + slider + numeric input fight for space. This could be solved by making the panel width adjustable (resize handle) or switching to a two-line layout for parameters (label above, slider below).

**Problem 5 — No keyboard shortcut discoverability.** Keys 1-8 map to fn-bar operations but this mapping is only communicated by the tiny `<span class="fn">` prefix on each button. No tooltip, no help overlay, no `?` shortcut to reveal bindings. Early terminal programs solved this with a persistent legend or a `F1=HELP` convention.

### What's Missing from the Swiss Canon

- **Baseline grid**: text doesn't align to a consistent vertical rhythm. Header cells are 24px/22px, node rows are 22px, parameter rows are 17px, mask rows are 17px. A strict Swiss layout would use a 4px or 6px baseline module and align everything.
- **Whitespace as structure**: the left panel packs nodes edge-to-edge with 1px borders. No vertical breathing room. Each node card should have 2-4px padding between the header and parameters.
- **Type scale**: only two sizes (10px, 11px) plus 9px for labels. Swiss design uses a clear scale (e.g. 9, 11, 14, 18) with each step serving a distinct hierarchical role.

---

## 3. UX Problems + Fixes

### 3.1 Discovery

**Problem**: 66 nodes in 20 categories. The add-menu is a single flat dropdown with category headers. Finding "DOMAIN WARP" requires scanning 20 category labels and 66 items.

**Fix**: Two-level menu. First click shows categories only. Clicking a category expands its items. Or: a type-to-filter search field at the top of the menu (`<input>` that filters `.mi` elements by textContent match). 5 lines of JS.

### 3.2 Feedback Latency

**Problem**: Heavy nodes (reaction-diffusion, bilateral filter, Delaunay mesh) take 1-10 seconds. During this time the only feedback is the render time counter updating after completion. The user doesn't know if the app is frozen.

**Fix**: A thin progress bar in hdr2 (CSS `width` animated from 0% to 100% based on node index / total active nodes). The Worker can postMessage intermediate progress. For CPU-bound single-node renders, show an indeterminate spinner (CSS animation, not JS).

### 3.3 Undo

**Problem**: No undo. Deleting a node or changing a preset is destructive.

**Fix**: Maintain a history stack of serialised Recipe JSON snapshots. Cap at 30 entries. Ctrl+Z pops the stack and restores. The current Recipe.exp/imp infrastructure already supports this — it's just a matter of snapshotting before each mutation.

### 3.4 Node Bypass vs Delete Confusion

**Problem**: The enable toggle (square), solo button (S), and delete button (×) are all in the same row with similar visual weight. Users accidentally delete when they meant to disable.

**Fix**: Move the delete button to the expanded parameter panel (bottom), or require a confirm gesture (double-click, or hold for 500ms). Keep enable/solo in the header row.

---

## 4. Animation / Multi-Frame Support

### Current State

The pipeline processes a single static image. There is no concept of time, frame index, or sequence.

### Required Architecture

**Frame Source**: `AppState` gains:
```
frames: Uint8ClampedArray[]  // array of pixel buffers
frameCount: number
currentFrame: number
fps: number
isPlaying: boolean
```

**Loading**: accept GIF (via gif.js decoder), image sequences (multi-file select), or video (via `<video>` + canvas extraction). Each frame's RGBA pixels stored in the frames array.

**Pipeline**: `Pipeline.render()` receives `frameIndex` parameter. Nodes that are time-aware receive `ctx.frame` and `ctx.frameCount`. Most nodes are stateless (per-frame application is identical) — they just process whatever sourcePixels is current. Time-varying nodes (reaction-diffusion, cellular automata, wave) could accumulate state across frames if desired.

**Playback**: A transport bar replaces or extends the fn-key bar bottom section:
```
|◄  ◄  ▶  ►  ►|   [━━━━━━●━━━━━━]  012/120  24fps
```
Play/pause, step forward/back, scrub. Frame counter. FPS selector.

**Export**: Render all frames sequentially. Output as:
- WebM video (MediaRecorder on OffscreenCanvas)
- PNG sequence (zip via JSZip)
- GIF (gif.js encoder)

**Performance**: For 120 frames at 1000x750, that's 120 × 3MB = 360MB of frame data. Options:
- Store frames on disk (IndexedDB) and load on demand
- Only keep current + adjacent frames in memory
- Render frames sequentially without storing all at once (streaming export)

### Seed-Based Animation

For generative nodes, animation can be driven by incrementing the seed per frame:
```
ctx.nodeSeed = hashSeed(globalSeed, nodeIndex, nodeId + frameIndex)
```
This makes flow fields, noise, grain, and RNG-dependent effects vary smoothly across frames without storing any frame data. The source image stays static; the processing varies.

### Parameter Keyframing

For full motion graphics: each parameter gets an optional keyframe array `[{frame, value}]`. The pipeline interpolates between keyframes per frame. This turns the static effect stack into a timeline. Complex to implement (requires a timeline UI panel) but makes the tool competitive with After Effects-style workflows.

---

## 5. Making Generative Art Fluid

### Current Friction Points

1. **No randomisation workflow.** The seed input is a text field. There's no "generate 9 variations" grid view. Generative artists work by rapid iteration across random seeds.
2. **No parameter randomisation.** No "randomise this slider within its range" button. No "randomise all parameters" per node.
3. **No blending between recipes.** Can't morph between two presets.
4. **No live coding.** Can't write a custom expression for a parameter (e.g. `sin(frame * 0.1) * 50`).

### Proposed Additions

**Variation Grid**: A modal that renders a 3x3 grid of the current stack with 9 different seeds. Click one to adopt it. Renders at 25% resolution for speed.

**Parameter Dice**: A small ⚄ button next to each slider. Click = randomise that parameter within its min/max range. Shift+click = randomise all parameters on this node.

**Expression Parameters**: Allow typing a JS expression in the numeric input field. If it starts with `=`, evaluate it with `{frame, seed, x, y, lum}` in scope. Store as string; evaluate per-render. Enables `=sin(seed*0.01)*50` for seed-responsive parameters.

**Stack Morphing**: Given two recipe JSONs, interpolate all numeric parameters by a blend factor `t`. This creates smooth transitions between looks — essential for animation.

---

## 6. Module Quality Standards

### What Makes a Node "Good"

1. **Preview-aware**: Reduces work in preview mode (lower resolution, fewer iterations, simpler sampling).
2. **Deterministic**: Same inputs → same output. Uses seeded RNG, not Math.random().
3. **Cache-friendly**: Linear memory access. No random pixel lookups where avoidable.
4. **LUT-eligible** (where applicable): Per-channel nodes implement `buildLUT()` for fusion.
5. **Modulation-capable**: Per-pixel parameters where it makes creative sense.
6. **Bounded parameters**: Every param has min/max/step. No unbounded inputs that can crash the render.
7. **Graceful degradation**: Doesn't allocate unbounded memory. Caps iterations. Uses `pool.acquire()` for temp buffers.

### Current Violations

- **OffscreenCanvas in hot paths**: LuminanceFlowNode, SerpentineNode, StaticHalftoneNode, DelaunayMeshNode all create `new OffscreenCanvas()` inside `apply()`. These should be cached on the node instance and reused across renders.
- **Unbounded point generation**: StippleNode, DelaunayMeshNode generate up to 15000/2000 points. No progress feedback. Should cap based on preview mode and image size.
- **Missing preview scaling**: Some nodes don't check `ctx.quality`. BilateralFilterNode, MedianFilterNode run at full kernel size in preview mode — should halve the radius.
- **DelaunayMeshNode Bowyer-Watson**: O(n²) in worst case with the current naive implementation. For >500 points this becomes slow. Should switch to an incremental algorithm or cap point count in preview.

### Performance Priority Matrix

| Node Category | Bottleneck | Fix |
|---|---|---|
| Per-pixel tone (16 nodes) | Already fast via LUT fusion | Add GLSL shaders for remaining nodes |
| Blur (6 nodes) | Kernel radius × image size | Separable passes already done; add preview radius halving |
| Warp (3 nodes) | Noise evaluation per pixel | Sampler inlined; noise could be precomputed to grid and interpolated |
| Physics (3 nodes) | Simulation steps × grid size | Reduce steps in preview; run on downscaled grid then upscale |
| Line render (3 nodes) | Canvas2D drawing | Cache OffscreenCanvas; skip line segments outside viewport |
| Geometric (3 nodes) | Point count × O(n²) distance | Spatial hash for Voronoi; capped points for Delaunay |

---

## 7. Early Program Design Principles

Programs with limited aesthetics (1980s DOS/terminal, early Mac, Amiga Workbench) succeeded by following strict rules that remain valid:

### Mode Visibility

The user must always know what mode they're in. The current design does this well: FINAL/PREV mode is in the header, active node count displayed, solo mode indicated by underline. But mode for mask editing vs parameter editing vs viewport panning is implicit. Add a status word to hdr2 that shows the current interaction state: `IDLE`, `DRAG`, `MASK EDIT`, `RENDERING`.

### Command Parity

Every mouse action should have a keyboard equivalent. Currently: 1-8 keys map to fn-bar, but node manipulation (add, delete, reorder, enable, solo) has no keyboard bindings. Add: `A` = add node, `D` = delete selected, `E` = toggle enable, `Tab` = next node, `Shift+Tab` = previous, `[`/`]` = reorder up/down.

### Immediate Feedback

Every input must produce visible output within 100ms. The progressive preview (0.25x during drag) achieves this for parameter changes. But adding a node or loading a preset triggers a full-resolution render. These should also use preview mode with a deferred final render.

### Error Recovery

Early programs had no undo — but they had confirmation dialogs. The current tool has neither. At minimum: undo stack (Ctrl+Z). Ideally: full history with named snapshots.

### Progressive Disclosure

Don't show everything at once. The current add-menu dumps 66 nodes in a flat list. Progressive disclosure means: show categories first, then items. Show basic parameters first, then advanced on expand. The mask section already follows this pattern (hidden until M button clicked). Extend it: show only the 3 most-used parameters by default, with a "MORE" expander for the rest.

### Spatial Stability

Controls must not move when the user interacts with them. The current `refreshStack()` rebuilds the entire DOM on every parameter change. This causes scroll position loss and focus loss. Fix: update values in-place rather than rebuilding. Use `node.id` as stable keys and mutate existing DOM elements.

---

## 8. Summary of Recommended Changes

### Critical (blocks usability)

1. **Undo system** — recipe snapshot stack, Ctrl+Z
2. **refreshStack DOM stability** — in-place updates, preserve scroll/focus
3. **Add-menu search/filter** — type-to-filter for 66 nodes
4. **Render progress indicator** — node-level progress bar

### High (blocks generative workflow)

5. **Multi-frame/animation** — frame array, transport controls, sequence export
6. **Variation grid** — 3x3 seed explorer modal
7. **Parameter randomisation** — per-slider and per-node dice buttons
8. **Keyboard bindings** — full node manipulation without mouse

### Medium (polish)

9. **Fn-bar preset overflow** — move presets to submenu, keep 8 core keys
10. **Panel resize handle** — draggable left panel width
11. **OffscreenCanvas caching** — reuse in line/generative nodes
12. **Delete confirmation** — move delete to expanded panel or add confirm gesture
13. **Baseline grid alignment** — 4px vertical rhythm module
14. **Node preview thumbnail** — small before/after preview in collapsed node header

### Low (future)

15. **Expression parameters** — `=sin(frame*0.1)*50` in numeric inputs
16. **Stack morphing** — blend between two recipes
17. **WebGL expansion** — add GLSL to all per-pixel nodes
18. **IndexedDB frame storage** — for large animation sequences
