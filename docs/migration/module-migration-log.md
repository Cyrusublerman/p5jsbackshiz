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
