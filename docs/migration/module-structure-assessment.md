# Module Structure & Function Assessment

This assessment compares the new `src/modules/*` implementations to the existing architecture patterns used by legacy nodes under `src/nodes/*`.

## Executive summary

- **Structure parity:** Partial.
  - Modules are cleanly separated by domain and deterministic-friendly.
  - Legacy code expects `EffectNode` class instances with `params`, `paramDefs`, `apply(src,dst,w,h,ctx)`, mask/modulation state, cache invalidation, and recipe-serializable fields.
  - Most new modules are pure functions/services rather than node classes, so they are **not drop-in structural replacements** for existing nodes.

- **Functional parity:** Partial.
  - Core numerical pieces exist (field generation, line generation, quantization, export helpers, etc.).
  - End-user parity is incomplete where modules are not yet wired into concrete node classes.

## Detailed findings

## 1) Contracts vs legacy node contract

- Legacy node runtime contract is defined by `EffectNode` and concrete node subclasses.
- New modules are largely stateless functional primitives and **do not expose node lifecycle/state directly** (enabled/solo/mask/modulation/serialization).

Impact:
- Good for reuse/testability.
- Requires adapter/wrapper layer in each migrated node class to fully match previous behavior.

## 2) Pipeline compatibility

- `Pipeline` has vector bridge support (`applyVector`) but must preserve existing blend/mask semantics for both raster and vector execution paths.
- A compatibility issue was addressed: vector nodes with opacity/mask blending path now execute through shared `_runNode(...)` instead of forcing `apply(...)`.

Impact:
- Prevents vector-node failures when `apply` is intentionally absent and only `applyVector` exists.

## 3) Parameter schema and UI structure

- New schema module supports aliasing/coercion/serialization.
- Legacy UI currently consumes `paramDefs` from node classes directly.

Impact:
- Schema module is functionally useful but not yet the sole source of truth for all existing controls.

## 4) Functional algorithm parity by family

- **Core/Field/Line/Color/Export**: substantial functional primitives are present.
- **Shader/Lab/UI**: practical guardrails/helpers exist but still utility-level; full end-user parity depends on deeper integration with existing UI/worker paths.

## 5) Migration status conclusion

- The modules are a strong shared-library layer.
- They do **not yet fully follow the structural shape** of previous modules/nodes at the app boundary until node wrappers + registry/UI migration are completed.

## Recommended next steps for full parity

1. Migrate one node family at a time to wrappers that extend `EffectNode` and delegate algorithm internals to `src/modules/*`.
2. Move node `paramDefs` generation to schema-backed adapters and keep legacy aliases for recipe compatibility.
3. Add integration tests that render real registry nodes before/after migration and compare deterministic checksums.
4. Continue removing duplicated logic from legacy node files only after checksum parity is confirmed.
