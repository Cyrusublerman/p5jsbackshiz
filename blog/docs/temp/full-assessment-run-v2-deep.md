# Full Assessment Run v2 (Deep Sweep): Missed Details, Risks, and Integration Targets

## Why this rerun exists

The prior assessment pass was accurate at a high level but not detailed enough for execution planning. This rerun adds:

1. File-level manifests (size, hash, src/dist flags)
2. Symbol-level indexes (classes/functions/methods/arrow functions)
3. UI-control index (control IDs and input surfaces)
4. src↔dist parity checks per imported CodePen tool
5. Vector symbol line maps for creator/consumer modules

Artifacts are in `blog/docs/temp/assessment-data-v2/`.

---

## 1) What we previously missed (critical detail gaps now closed)

## Gap A — Incomplete accounting of assessed files
Prior run emphasized executable payload files but did not fully separate:
- all tracked integration files,
- source files with logic,
- wrapper HTML files with zero local logic.

### Closed in v2
- `toIntegrate` total files now explicitly counted as **36** in manifest.
- `src` JS/HTML files counted separately (**8**) from `dist` JS/HTML (**8**).
- Symbol index generated across **19** JS/HTML files to show where executable logic exists vs wrappers.

---

## Gap B — src/dist drift not audited
Previous run assumed most src/dist exports were equivalent but didn’t prove it systematically.

### Closed in v2
Parity results (`src_dist_parity.json`):
- `colourquantiser` scripts are identical, but HTML wrappers differ.
- `paint-image` scripts are identical, HTML wrappers differ.
- `tile2` scripts are identical, HTML wrappers differ.
- `processing-export` HTML differs.
- `lones` HTML differs.

Interpretation: **core JS logic is largely stable**, but exported wrapper HTMLs are inconsistent and include packaging artifacts (nested duplicated head/body scaffolding in some dist files).

---

## Gap C — wrapper quality issues were under-reported
Previous docs noted truncation risk for `lones`, but did not call out packaging corruption patterns elsewhere.

### Closed in v2
Deep diff checks reveal wrapper anomalies:
- duplicated `<!DOCTYPE html>` + nested `<html>` shells in some dist exports,
- non-minimal wrapper drift between src and dist despite same logical tool intent.

Action implication: integration should consume **logic-bearing source sections**, not wrapper scaffolding.

---

## Gap D — vector creator/consumer mapping was high-level only
Previous vector report identified module concepts but not enough symbol-level trace points for implementers.

### Closed in v2
`vector_symbol_lines.json` now captures line-level symbol occurrences for:
- `toIntegrate/luminance-distortion.html`
- `toIntegrate/index (1).html`
- `src/nodes/line/LuminanceFlowNode.js`
- `src/nodes/warp/FlowFieldNode.js`
- `src/nodes/warp/AdvectionNode.js`

This provides direct anchoring for extraction/refactor tasks.

---

## 2) Exhaustive inventory additions (v2)

## A) File manifest completeness
`tointegrate_file_manifest.json` includes for every file:
- relative path
- extension
- byte size
- line count
- SHA-256
- `is_src` / `is_dist`

Largest logic-heavy files confirmed:
1. `toIntegrate/index (1).html`
2. `toIntegrate/distortion-pipeline.html`
3. `toIntegrate/colourquantiser/.../script.js`
4. `toIntegrate/luminance-distortion.html`

These are the highest-value extraction targets.

---

## B) Symbol index completeness
`tointegrate_symbol_index.json` now tracks per-file:
- classes
- functions
- methods
- arrow-assigned functions
- script block count
- executable payload flag

This makes it possible to compare tool complexity without manual reading.

---

## C) UI control surface completeness
`tointegrate_ui_index.json` now tracks per HTML:
- full ID list
- control IDs (`ctrl-*`, `btn-*`)
- file-input IDs
- mode-value attributes

High-control-surface files:
- `index (1).html` (largest control graph)
- `lones` html variants (large but wrapper-like and drift-prone)

---

## 3) Deep vector implementation assessment (creator + consumer)

## Creator modules (from reference tools)

### `VectorFieldMap` and force synthesis (`luminance-distortion`)
Missed previously: the creator path is not just one field sampler; it is a composed force stack (`originVec`, `gradPush`, `tangPush`, noise-based `flow`) with UI-driven mix terms.

**Implementation risk:** if this is ported as one monolith, parameter tuning and testing become unmanageable.

**Implementation target:** split into deterministic submodules:
- `field/base-gradient`
- `field/noise-flow`
- `field/origin-force`
- `field/force-composer`

### `DisplacementMatrix` coupling
Missed previously: displacement generation is intertwined with line logic and debug overlays in source prototype.

**Implementation risk:** hidden coupling creates regressions when adding preview/final quality modes.

**Implementation target:** extract displacement as independent buffer builder with explicit interpolation and temporal smoothing contracts.

---

## Consumer modules (current + reference)

### `WaveFrontFlowEngine` / `FlowWaveFront` (`index (1)`)
Missed previously: consumer uses field sampling plus front lifecycle logic (spawn, decay, termination), not just “line tracing”.

**Implementation target:** a `line/front-propagation-core` submodule should exist under `line/flow-line-engine`.

### `SerpentineEngine`
Missed previously: needs deterministic timeline control consistency with export recorder paths.

**Implementation target:** consume a shared runtime tick service before any exporter integration.

### Current `LuminanceFlowNode`
Missed previously: it carries internal vector helper logic that will conflict with a shared field module unless migrated.

**Implementation target:** migrate node internals to call shared field APIs and deprecate duplicated local vector helpers.

---

## 4) Concrete implementation issues discovered in deep sweep

## Issue 1 — Packaging artifacts in dist wrappers (Severity: High for import automation)
Automated ingestion that trusts dist HTML wrappers will inherit structural noise.

## Issue 2 — Mixed architecture styles (Severity: Medium)
Some tools are pure logic JS, others are monolithic HTML+JS apps; integration plan must normalize first.

## Issue 3 — Symbol duplication across src/dist (Severity: Medium)
Without dedupe policy, extraction scripts may double-count same logic.

## Issue 4 — Vector/raster interface ambiguity (Severity: High)
No formal handoff contract currently standardizes path outputs into raster-node chain.

## Issue 5 — UI schema not yet canonicalized (Severity: Medium)
Control IDs exist but are not mapped to a shared typed schema; this slows feature parity.

---

## 5) Updated recommended execution plan (what to do next)

1. **Lock ingestion policy**: read from `/src` logic first; treat `/dist` as packaging-only reference.
2. **Create symbol deduper** keyed by file hash + normalized symbol signature.
3. **Implement shared vector core** before migrating any additional line/warp node behavior.
4. **Add explicit vector→raster adapter contract** (`paths -> raster buffer`) with mask/opacity semantics.
5. **Auto-generate parameter schemas** from UI control index (`ctrl-*`, `btn-*`) and map manually only exceptions.
6. **Only then** begin module extraction in dependency order (field -> line engines -> adapters -> export).

---

## 6) Deliverables produced in this deep run

New files:
- `assessment-data-v2/tointegrate_file_manifest.json`
- `assessment-data-v2/tointegrate_symbol_index.json`
- `assessment-data-v2/tointegrate_ui_index.json`
- `assessment-data-v2/current_tool_symbol_index.json`
- `assessment-data-v2/algorithms_export_index.json`
- `assessment-data-v2/tointegrate_capability_tags.json`
- `assessment-data-v2/src_dist_parity.json`
- `assessment-data-v2/vector_symbol_lines.json`

These close the “find everything missed” requirement for repository-local assessment detail.
