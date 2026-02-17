# Module Migration Log

## Phase 0 — Contracts/spec freeze
- Added contract docs in `docs/specs/` for canonical types, param schema v1, and vector-raster adapter semantics.

## Phase 1 — Core modules
- Implemented `core/image-io` with deterministic fit mapping and image remapping.
- Implemented `core/param-schema` with alias resolution, coercion, validation, and versioned serialization.
- Implemented `core/runtime-ticker` with fixed-step and variable-step modes.

## Phase 2 — Vector field stack
- Implemented Sobel-like luminance gradients, noise curl flow, origin force, force composition, field normalization/sampling, and displacement build/stabilization/apply.

## Phase 3 — Line engines
- Implemented line helpers, front propagation, flow/static/serpentine engines with deterministic seeded behavior.

## Phase 4 — Bridge integration
- Implemented vector-to-raster adapter with line segment rasterization and alpha-mask semantics.
- Pipeline supports opt-in `applyVector` path through bridge adapter.

## Phase 5 — Color + painter
- Implemented LAB conversion and DeltaE metrics (76 + 2000).
- Implemented palette quantization and optional Floyd-Steinberg dithering.
- Implemented brush stamp/polyline painting and layer tracking with flatten/stats.

## Phase 6 — Shader + worker runtime
- Implemented shader runtime with compile/link validation, uniform parsing, uniform registry, and kernel execution shim.
- Implemented worker animation driver with start/cancel/retry lifecycle.

## Phase 7 — Export stack
- Implemented raster exporter + deterministic checksum.
- Implemented SVG exporter + validity checks.
- Implemented timeline recorder with timing consistency checks.

## Phase 8 — UI migration helpers
- Implemented schema-driven tool panel state generation and legacy control ID mapping.
- Implemented debug overlay state/vector overlay builders and export isolation hook.

## Phase 9 — Lab code runner
- Implemented sandboxed code runner with forbidden token guard and timeout guardrail.

- Integration update: `LuminanceFlowNode`, `SerpentineNode`, and `StaticHalftoneNode` now retain legacy `EffectNode` shape while delegating core generation logic to `src/modules` primitives.
- Integration update: added `ModuleFlowLinesNode`, `ModuleSerpentineNode`, and `ModuleStaticLinesNode` as legacy-style `EffectNode` wrappers in a dedicated `LINE RENDER (MODULE)` registry group for dropdown discoverability.
- UI update: add-node dropdown now has explicit max-height and internal scrolling behavior to support large registries.

## Phase 10 — Registry/preset compatibility hardening
- Added automated coverage in `tests/modules.test.js` to validate that every node type referenced by `PRESETS` resolves to a registered factory.
- Added preset hydration round-trip checks (`fromJSON`/`toJSON`) to ensure migration safety for legacy recipe payload shapes.
- Added invariant checks that instantiated preset nodes retain `EffectNode` runtime contract (`type`, `apply`).

## Phase 11 — Runtime portability hardening for legacy line nodes
- Removed hard dependency on `OffscreenCanvas` in `LuminanceFlowNode`, `SerpentineNode`, and `StaticHalftoneNode` by routing their line rendering through shared `vectorToRaster` bridge logic.
- Preserved existing node contracts (`EffectNode` shape and `apply(...)`) while making execution consistent in non-browser runtimes (Node test environment).
- Added regression test coverage to ensure all three legacy line nodes render without `OffscreenCanvas` availability.
- Added end-to-end preset pipeline coverage to ensure all bundled presets render through `Pipeline` in the Node runtime test environment.


## Phase 12 — Cross-family module integration expansion
- Integrated morphology nodes (`DilateErodeNode`, `OpenCloseNode`) with new grayscale morphology module operators, replacing duplicated node-local kernels.
- Integrated segmentation node (`OtsuThresholdNode`) with shared segmentation module helper (`otsuThreshold`) to centralize threshold logic.
- Integrated generative painter node (`PaintStrokeNode`) with painter modules (`paintStamp`, `LayerTracker`) for shared brush/layer primitives.
- Added regression tests for morphology grayscale operators, segmentation Otsu helper, and module-backed paint stroke rendering behavior.
