# Module Implementation + Integration Plan (toIntegrate parity)

This plan ensures all required modules are actually **implemented**, **wrapped as nodes**, **wired to UI/registry**, and **validated** against the original `toIntegrate` tools.

---

## 0) Scope of completion
A module is only “done” when all five are true:
1. Algorithm implemented in `src/modules/*`.
2. Node wrapper integrated in `src/nodes/*` (EffectNode contract).
3. Registry/UI wiring complete (`src/nodes/registry.js`, UI controls/schema).
4. Export/recording/debug pathways wired where applicable.
5. Deterministic parity tests pass.

---

## 1) Canonical module backlog

### Core + Color
1. `core-image-ingest-and-fit`
2. `color-lab-and-palette-core`
3. `color-adjustment-prepass`
4. `color-quantize-and-dither-engine`

### Field + Line
5. `field-luminance-vector-builder`
6. `field-force-composer-advanced`
7. `line-flow-wavefront-engine`
8. `line-static-engine-advanced`
9. `line-serpentine-engine-advanced`

### Painter + Bridge + Shader
10. `painter-stroke-synthesis-engine`
11. `bridge-vector-raster-compositor`
12. `shader-worker-compositor-engine`

### Export + Runtime Contracts
13. `export-animation-recorder-and-encoder`
14. `lab-code-runner-sandbox`
15. `node-wrapper-and-registry-contract`
16. `ux-elements-and-variable-access-matrix` (control parity tracking)

Reference specs: `toIntegrate/image-processing-audit/needed-modules/*.md`.

---

## 2) Integration map (where each module lands)

| Module | Implementation Target | Node Wrapper Target | UI/Registry Target |
|---|---|---|---|
| core-image-ingest-and-fit | `src/modules/core/image-io.js` | N/A utility | source panels / fit controls |
| color-lab-and-palette-core | `src/modules/color/color-science.js` | used by colour nodes | color controls |
| color-adjustment-prepass | `src/modules/color/*` (new helper) | color prepass node(s) | sliders (gamma/contrast/sat) |
| color-quantize-and-dither-engine | `src/modules/color/palette-quantizer.js` (+ strategy helper) | `src/nodes/colour/QuantiseNode.js`, `DitherNode.js` | palette + dither controls |
| field-luminance-vector-builder | `src/modules/field/vector-field.js` (+ gradient helper) | line/field nodes | field controls |
| field-force-composer-advanced | `src/modules/field/force-composer.js` + `noise-flow.js` + `origin-force.js` | flow/warp/line nodes | force mix controls |
| line-flow-wavefront-engine | `src/modules/line/flow-line-engine.js` | `src/nodes/line/ModuleFlowLinesNode.js` | flow panel |
| line-static-engine-advanced | `src/modules/line/static-line-engine.js` | `src/nodes/line/ModuleStaticLinesNode.js` | static panel |
| line-serpentine-engine-advanced | `src/modules/line/serpentine-line-engine.js` | `src/nodes/line/ModuleSerpentineNode.js` | serpentine panel |
| painter-stroke-synthesis-engine | `src/modules/painter/*` | `src/nodes/generative/PaintStrokeNode.js` | painter panel |
| bridge-vector-raster-compositor | `src/modules/bridge/node-adapters.js` | invoked by vector nodes | internal |
| shader-worker-compositor-engine | `src/modules/shader/*` | composite/warp shader node(s) | shader controls |
| export-animation-recorder-and-encoder | `src/modules/export/*` | export actions | export panel |
| lab-code-runner-sandbox | `src/modules/lab/code-runner.js` | lab/sandbox node/tool | code runner panel |
| node-wrapper-and-registry-contract | `src/nodes/EffectNode.js`, `src/core/Pipeline.js` | all new wrappers | `src/nodes/registry.js` |
| ux-elements-and-variable-access-matrix | spec tracking doc | N/A | used as migration checklist |

---

## 3) Phased delivery plan

## Phase 1 — Foundation parity (Core/Color)
Goal: input loading + quantization parity.

Tasks:
- Extend `image-io` with source mapping helpers required by toIntegrate parity.
- Extend `color-science` and `palette-quantizer` with nearest-opposite + blue-noise path.
- Add adjustment prepass helper and wire to existing colour nodes.
- Expose schema-backed params for all quantization controls.

Exit criteria:
- Quantize/dither outputs match fixture tolerances.
- All colourquantiser controls are mapped in UX matrix.

## Phase 2 — Vector field + line engines
Goal: index/lones/luminance-distortion line behavior parity.

Tasks:
- Add luminance/gradient channel outputs to field builder.
- Extend force composer for gradient/tangent/origin/noise blends.
- Implement wavefront lifecycle behavior (spawn/stop/GC/progress).
- Extend static + serpentine advanced controls.
- Ensure vector→raster adapter matches stroke/opacity/mask semantics.

Exit criteria:
- ModuleFlowLines/Static/Serpentine nodes render deterministically.
- Exported PNG/SVG geometry parity within agreed tolerance.

## Phase 3 — Painter + shader path
Goal: paint-image + tile2 parity.

Tasks:
- Extend painter engine for blend-simulated color choice and weight-map acceptance.
- Clean/refactor `node-adapters` duplicate helpers.
- Implement concrete shader runtime backend and worker message protocol.
- Add GPU node wrapper with CPU fallback.

Exit criteria:
- Painter convergence metrics stable on fixed seeds.
- Tile compositor modes render correctly in worker and fallback paths.

## Phase 4 — Export + lab runtime
Goal: processing-export parity + robust integration contract.

Tasks:
- Add animation encoder adapters (GIF/WebM).
- Integrate recorder timeline into export panel and progress state.
- Harden lab code runner with bounded execution controls.
- Finalize wrapper contract checks for all added nodes.

Exit criteria:
- Record/export flows pass frame-count/FPS correctness tests.
- No module remains “implemented but not integrated”.

---

## 4) UX/control integration checklist
Use `needed-modules/ux-elements-and-variable-access-matrix.md` as the canonical checklist.

Mandatory closure rule:
- Each original control ID must map to:
  - a schema param,
  - a node/module field,
  - a UI control binding,
  - serialization path (recipe/export state) when applicable.

---

## 5) Testing strategy and gates

## Unit gates (per module)
- deterministic outputs for fixed seeds/inputs
- edge-case clamps and invalid-input handling
- serialization round-trip where applicable

## Integration gates
- node wrapper parity: `apply()` output + opacity/mask behavior
- pipeline order parity with mixed raster/vector nodes
- registry/UI parameter binding checks

## Parity gates (against toIntegrate fixtures)
- Quantization image diff thresholds
- Line engine path checksum / bounds checks
- Recorder frame-count/timing checks
- Shader mode output snapshots (GPU + fallback)

## Regression gate
- Add tests to `tests/modules.test.js` (and related suites) before enabling default paths.

---

## 6) Tracking board format (recommended)
Maintain a per-module status table with states:
- `SPECED` → `IMPLEMENTED` → `NODE_WRAPPED` → `UI_WIRED` → `PARITY_TESTED` → `DONE`

Suggested file for live tracking:
- `docs/migration/module-migration-log.md`

---

## 7) Immediate next actions (execution order)
1. Start with `color-quantize-and-dither-engine` and `color-adjustment-prepass` (fastest parity win).
2. Implement wavefront extensions in `line-flow-wavefront-engine`.
3. Clean `bridge/node-adapters.js` and lock adapter semantics.
4. Add shader runtime concrete backend scaffolding.
5. Wire export animation adapters and recorder UI state.

This sequence gives visible parity gains early while de-risking shared infrastructure.
