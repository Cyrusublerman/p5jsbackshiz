# Prompt for Next Agent: Implement All Integration Phases End-to-End

You are the implementation agent for this repository. Your task is to execute **all phases** described in the planning and assessment docs and deliver working code, tests, migration notes, and validated outputs.

## Repository
- Root: `/workspace/p5jsbackshiz`

## Required source docs (read first)
1. `blog/docs/temp/module-build-master-plan.md`
2. `blog/docs/temp/full-assessment-run-v2-deep.md`
3. `blog/docs/temp/vector-image-modules-assessment.md`
4. `blog/docs/temp/tointegrate-module-array-plan.md`
5. `blog/docs/temp/tointegrate-tool-function-audit.md`
6. `blog/docs/temp/tool-module-reference-comparison.md`

## Required data artifacts (use as evidence)
- `blog/docs/temp/assessment-data-v2/*`
- `blog/docs/temp/assessment-data/*`

---

## Primary objective
Implement all phases from `module-build-master-plan.md` (Phase 0 → Phase 9) with production-ready module boundaries, tests, and integration into the existing node-based pipeline.

You must deliver usable modules, not just docs.

---

## Non-negotiable implementation constraints

1. **Build from `src/` logic, not `dist/` wrappers** in `/toIntegrate`.
2. **Preserve existing behavior** for current nodes unless explicitly migrating behind feature flags.
3. **No uncontracted vector/raster coupling** — implement the adapter contract before broad vector-node migration.
4. **Every new module must have tests** (unit and/or integration).
5. **Recipe compatibility must be preserved** via param aliasing/versioning.
6. **Do not block UI thread** for heavy animation/render loops when worker path exists.

---

## Implementation order (must follow)

## Phase 0 — Contracts/spec freeze
Create:
- `docs/specs/module-contracts.md`
- `docs/specs/param-schema-v1.md`
- `docs/specs/vector-raster-adapter.md`

Include:
- canonical types (`ImageAsset`, `MappedImage`, `VectorField`, `Displacement`, `LineSet`, `EngineOutput`)
- versioned schema + migration rules
- vector→raster adapter interface and blend/mask semantics

**Exit criteria:** all later modules compile against these contracts.

---

## Phase 1 — Core modules
Implement:
- `core/image-io`
- `core/param-schema`
- `core/runtime-ticker`

Add tests for:
- image fit-mode mapping determinism
- param coercion + aliasing + serialization round-trip
- fixed-step vs variable-step ticker determinism

---

## Phase 2 — Vector field stack
Implement:
- `field/base-gradient`
- `field/noise-flow`
- `field/origin-force`
- `field/force-composer`
- `field/vector-field`
- `field/displacement-matrix`

Refactor existing vector logic duplication out of nodes where feasible.

Add tests for:
- field normalization invariants
- sampling mode correctness (nearest/bilinear)
- displacement stability across adjacent frames

---

## Phase 3 — Line engines
Implement:
- `line/line-engine-common`
- `line/front-propagation-core`
- `line/flow-line-engine`
- `line/static-line-engine`
- `line/serpentine-line-engine`

Add tests for:
- path bounds/continuity
- deterministic output given seed+params
- occupancy/intersection constraints

---

## Phase 4 — Bridge integration
Implement:
- `bridge/node-adapters`

Integrate with existing node pipeline semantics:
- opacity/mask behavior
- ordering between raster and vector nodes

Add tests:
- mixed-stack golden output tests
- compatibility with existing mask paths

---

## Phase 5 — Color + painter
Implement:
- `color/color-science`
- `color/palette-quantizer`
- `painter/brush-engine`
- `painter/layer-tracker`

Migrate relevant behavior from `colourquantiser` and `paint-image` source logic.

Add tests:
- RGB/LAB/DeltaE correctness bands
- dither regression fixtures
- layer stats invariants

---

## Phase 6 — Shader + worker runtime
Implement:
- `shader/gl-kernel-runtime`
- `shader/worker-animation-driver`

Add tests:
- compile/link error handling
- worker lifecycle/cancel/retry behavior

---

## Phase 7 — Export stack
Implement:
- `export/raster-exporter`
- `export/svg-exporter`
- `export/timeline-recorder`

Add tests:
- deterministic export reproducibility
- SVG geometry validity
- recorder frame count/timing consistency

---

## Phase 8 — UI migration
Implement:
- `ui/tool-panels`
- `ui/debug-overlays`

Requirements:
- schema-driven controls
- support legacy control ID mapping from assessment artifacts
- overlays must not contaminate exports

Add tests for control bindings and overlay isolation.

---

## Phase 9 — Lab code runner
Implement:
- `lab/code-runner`

Requirements:
- sandboxed setup/draw execution
- strict API exposure
- timeout and cancel guardrails

Add sandbox boundary tests.

---

## Required integration targets in existing code

You must wire modules into current app architecture under `src/`:
- pipeline path (`src/core/Pipeline.js`, `RenderWorker`, `WorkerBridge` as needed)
- registry and node definitions (`src/nodes/registry.js` + node classes)
- UI layer (`src/ui/*`) and rendering path (`src/render/*`)

Refactor incrementally with feature flags where migration risk is high.

---

## Required migration strategy

1. Introduce modules behind feature flags.
2. Move one node family at a time to shared module APIs.
3. Maintain old path temporarily for fallback.
4. Remove legacy duplicated logic once parity is validated.

Create `docs/migration/module-migration-log.md` and update it per phase.

---

## Mandatory quality gates (must pass before final handoff)

1. Lint/type/tests pass.
2. New unit tests exist for every new module family.
3. Integration tests cover mixed raster/vector stacks.
4. Export tests cover PNG/SVG/timeline recorder behavior.
5. Performance check (preview and full-res baseline comparisons).
6. No recipe breakage on existing presets.

---

## Deliverables checklist

- [ ] All planned modules implemented in code
- [ ] Specs in `docs/specs/`
- [ ] Migration log in `docs/migration/`
- [ ] Tests added and passing
- [ ] Updated docs for architecture changes
- [ ] Updated registry and node integrations
- [ ] Feature flags removed or documented for remaining risk

---

## Commit strategy expected

Use small, phase-scoped commits:
- `phase0: contracts and schema specs`
- `phase1: core modules + tests`
- `phase2: vector field stack + tests`
- …
- `phase9: code runner + sandbox tests`

Avoid one giant commit.

---

## Final report format required from implementation agent

1. Phase-by-phase completion table (done/partial/blocker)
2. Files changed by phase
3. Test commands + pass/fail outputs
4. Known risks and follow-ups
5. Explicit statement of any deferred modules (with reasons)

