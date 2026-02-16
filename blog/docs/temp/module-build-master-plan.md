# Master Build Plan: All Required Integration Modules

## Objective

Build every required module identified in prior assessments and integrate them into the current node-based toolchain with deterministic behavior, testability, and export consistency.

This plan is implementation-first (tasks, deliverables, dependencies, acceptance criteria), not just taxonomy.

---

## Scope of modules to build

### Core
1. `core/image-io`
2. `core/param-schema`
3. `core/runtime-ticker`

### Color
4. `color/color-science`
5. `color/palette-quantizer`

### Field / Vector
6. `field/base-gradient`
7. `field/noise-flow`
8. `field/origin-force`
9. `field/force-composer`
10. `field/vector-field`
11. `field/displacement-matrix`

### Line engines
12. `line/line-engine-common`
13. `line/front-propagation-core`
14. `line/flow-line-engine`
15. `line/static-line-engine`
16. `line/serpentine-line-engine`

### Painter
17. `painter/brush-engine`
18. `painter/layer-tracker`

### Shader / runtime
19. `shader/gl-kernel-runtime`
20. `shader/worker-animation-driver`

### Export
21. `export/raster-exporter`
22. `export/svg-exporter`
23. `export/timeline-recorder`

### Utility lab
24. `lab/code-runner`

### UI
25. `ui/tool-panels`
26. `ui/debug-overlays`

### Integration bridge
27. `bridge/node-adapters`

---

## Build order and dependency graph

## Phase 0 — Foundation contracts (blocking)
- Define shared types/contracts:
  - `ImageAsset`, `MappedImage`, `VectorField`, `Displacement`, `LineSet`, `EngineOutput`
- Define versioned parameter schema format.
- Define vector→raster adapter contract.

**Deliverables**
- `docs/specs/module-contracts.md`
- `docs/specs/param-schema-v1.md`
- `docs/specs/vector-raster-adapter.md`

**Acceptance criteria**
- Contracts reviewed and frozen before module coding starts.

---

## Phase 1 — Core runtime modules

### 1. `core/image-io`
**Build tasks**
- Unified file/url loader.
- Fit mode mapper (`contain`/`cover`/`stretch`).
- Pixel buffer normalizer (RGBA Uint8ClampedArray).

**Tests**
- Decode + mapping tests on mixed aspect ratios.
- Deterministic output dimensions for same inputs.

### 2. `core/param-schema`
**Build tasks**
- Field types: range/select/toggle/color/file/button.
- Clamp/coerce/serialize/deserialize.
- Alias map for legacy param names from `/toIntegrate`.

**Tests**
- Coercion edge cases + round-trip serialization.

### 3. `core/runtime-ticker`
**Build tasks**
- deterministic fixed-step mode
- variable-step preview mode
- pause/resume/fps and frame callbacks

**Tests**
- Tick count determinism at multiple fps configs.

**Acceptance criteria (phase)**
- Core modules usable without UI.

---

## Phase 2 — Vector field stack (highest-risk path)

### 4-9. `field/base-gradient`, `noise-flow`, `origin-force`, `force-composer`, `vector-field`, `displacement-matrix`

**Build tasks**
- Implement gradient extraction from luminance.
- Implement procedural flow force (noise/curl).
- Implement origin radial force.
- Compose forces with weighted mixing.
- Field sampling API (nearest/bilinear).
- Displacement builder + temporal stabilizer.

**Tests**
- Vector normalization consistency tests.
- Sampling determinism tests.
- Displacement stability tests between adjacent frames.

**Acceptance criteria (phase)**
- `LuminanceFlowNode` can consume shared field APIs behind feature flag.

---

## Phase 3 — Line engines

### 10-14. `line/line-engine-common`, `front-propagation-core`, `flow-line-engine`, `static-line-engine`, `serpentine-line-engine`

**Build tasks**
- Common path structs and clipping.
- Front lifecycle (spawn/advance/terminate).
- Flow-driven line propagation.
- Static and serpentine path generators with shared tick.

**Tests**
- Path continuity and bounds checks.
- Deterministic path generation snapshots.
- Occupancy/intersection control tests.

**Acceptance criteria (phase)**
- Engines produce stable `LineSet` outputs for same seed + params.

---

## Phase 4 — Bridge integration with node pipeline

### 15. `bridge/node-adapters`
**Build tasks**
- Adapter for vector outputs to raster buffers.
- Mask + opacity semantics compatibility with existing pipeline.
- Ordering policy for vector nodes among raster nodes.

**Tests**
- Golden image checks for mixed raster/vector stacks.
- Compatibility tests with existing masks and blend modes.

**Acceptance criteria (phase)**
- New engines can run as nodes without breaking existing stacks.

---

## Phase 5 — Color + painter modules

### 16-19. `color/color-science`, `color/palette-quantizer`, `painter/brush-engine`, `painter/layer-tracker`

**Build tasks**
- RGB/LAB/Delta-E utilities.
- Palette quantization + dither strategy pack.
- Painter stroke loop and per-pixel layer tracking.

**Tests**
- Color conversion and Delta-E correctness bands.
- Dither regression samples.
- Layer statistics invariants.

**Acceptance criteria (phase)**
- `PaintStrokeNode` and quantization workflows can delegate to shared modules.

---

## Phase 6 — Shader runtime and worker animation

### 20-21. `shader/gl-kernel-runtime`, `shader/worker-animation-driver`

**Build tasks**
- Program compile/link + uniform registry.
- Texture input/output abstraction.
- Worker message protocol for animation/render queue.

**Tests**
- Shader compile failure handling.
- Worker lifecycle and cancel behavior.

**Acceptance criteria (phase)**
- Tile/shader features can run via worker without blocking UI thread.

---

## Phase 7 — Export stack

### 22-24. `export/raster-exporter`, `svg-exporter`, `timeline-recorder`

**Build tasks**
- Full-res PNG export from pipeline output.
- SVG path export from `LineSet`.
- Frame capture and GIF/WebM abstraction.

**Tests**
- Export reproducibility for same input/seed.
- SVG geometry sanity checks.
- Recorder frame count/timing validation.

**Acceptance criteria (phase)**
- Preview output and exported output match for deterministic runs.

---

## Phase 8 — UI modules and migration

### 25-26. `ui/tool-panels`, `ui/debug-overlays`

**Build tasks**
- Render controls from `core/param-schema`.
- Implement vector debug overlays (VF arrows, flow probes, origin marker).
- Migrate legacy control IDs (`ctrl-*`, `btn-*`) to schema-driven bindings.

**Tests**
- Control binding integration tests.
- Overlay toggle isolation (no export contamination).

**Acceptance criteria (phase)**
- No hardcoded tool-specific control logic required for migrated modules.

---

## Phase 9 — Code lab module

### 27. `lab/code-runner`

**Build tasks**
- Sandboxed setup/draw execution model.
- Limited API exposure and timeout guardrails.
- Recorder integration hooks.

**Tests**
- Sandbox boundary tests.
- Timeout/cancel behavior tests.

**Acceptance criteria (phase)**
- User code can execute safely without mutating core app state.

---

## Delivery milestones

## Milestone A (vector MVP)
- Phases 0-4 complete.
- Existing line nodes migrated to shared field + adapter path.

## Milestone B (creative parity)
- Phases 5-8 complete.
- Color/painter/export/UI parity with key `/toIntegrate` capabilities.

## Milestone C (advanced tooling)
- Phase 9 complete.
- Code lab and shader worker workflows stable.

---

## Team workstreams

### Stream 1 — Runtime/Core
- Phases 0-2

### Stream 2 — Vector/Line + Bridge
- Phases 3-4

### Stream 3 — Color/Painter/Export
- Phases 5 and 7

### Stream 4 — Shader/Worker/Lab
- Phases 6 and 9

### Stream 5 — UI migration
- Phase 8 (parallel after schema freeze)

---

## Risk controls

1. **Feature flags** for all migrated nodes.
2. **Golden outputs** for deterministic regression checks.
3. **Schema versioning** to prevent recipe breakage.
4. **Strict src-over-dist ingestion policy** for extraction.
5. **Performance budgets** per module (ms/frame at preview/full-res).

---

## Definition of done (global)

- All 27 modules implemented and documented.
- All migrated node behaviors reproduce baseline outputs within tolerance.
- Export parity achieved (viewport vs exported assets).
- Vector creator/consumer path uses shared field stack (no duplicated private field math left in nodes).
- CI includes unit + integration + export regression checks for the new modules.
