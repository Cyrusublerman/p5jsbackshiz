# New Modules Implementation Assessment

Date: current branch audit

## Scope

Assessed all files under `src/modules/*` for:

1. **Implementation depth** (placeholder vs real logic).
2. **Structural fit** with legacy runtime (`EffectNode` + Pipeline + registry/UI patterns).
3. **Integration level** into active app execution paths.
4. **Test coverage** from `tests/modules.test.js`.

## High-level verdict

- **Implementation depth:** generally **implemented** (most modules contain concrete algorithmic/runtime behavior, not stubs).
- **Structure fit to legacy nodes:** **partial** (modules are reusable services; legacy runtime expects class-based `EffectNode` nodes with `paramDefs`, state, serialization, modulation, masks).
- **Integration:** **low-to-partial** (only bridge adapter is directly wired into core pipeline; most modules are not yet consumed by registry nodes/UI rendering path).
- **Tests:** **broad unit coverage** exists for module APIs, but **limited real integration parity** tests against live node stacks.

## Assessment matrix

| Family | Depth | Structural fit | Integration | Notes |
|---|---|---|---|---|
| `core/*` | Implemented | Partial | Partial | Solid utility logic; not yet source of truth for existing node param/UI contracts. |
| `field/*` | Implemented | Partial | Low | Concrete field generation/composition APIs exist; node wrappers still needed for full runtime parity. |
| `line/*` | Implemented | Partial | Low | Deterministic generation present; not fully bound to existing line nodes in registry path. |
| `bridge/*` | Implemented | Good | **Integrated** | `vectorToRaster` is imported by `Pipeline` and exercised in node execution path. |
| `color/*` | Implemented | Partial | Low | Color science + quantizer logic is concrete but not yet replacing existing color nodes end-to-end. |
| `painter/*` | Implemented | Partial | Low | Brush/layer primitives are useful services; node-level wiring remains. |
| `shader/*` | Implemented (shim-level) | Partial | Low | Runtime abstraction exists; not yet a fully connected WebGL worker stack in app flow. |
| `export/*` | Implemented | Partial | Low | Export helpers exist but app export path still primarily legacy UI methods. |
| `ui/*` | Implemented (helper-level) | Partial | Low | Tool panel/overlay helpers not yet integrated as main UI control renderer. |
| `lab/*` | Implemented (guarded executor) | Partial | Low | Sandbox guard exists, but no full lab surface integration path yet. |

## Evidence highlights

- Legacy app contract is class-based `EffectNode` with node state, mask/modulation, cache, and `apply(...)` execution hooks.
- New module layer is predominantly functional service code under `src/modules/*`.
- Core runtime imports only one module family directly today: `vectorToRaster` from bridge adapter in `Pipeline`.
- Test suite exercises all module families and includes a pipeline regression test for vector-only blended execution.

## Risks / gaps

1. **Migration boundary mismatch:** function modules are not drop-in node replacements without wrapper classes.
2. **Recipe/UI parity risk:** existing UI/recipe logic still relies on legacy node `paramDefs` and node instance shape.
3. **Integration confidence:** tests validate module behavior but not yet full before/after image parity across migrated real presets.

## Recommended next actions

1. Add thin wrappers per migrated node family that extend `EffectNode` and delegate internals to `src/modules/*`.
2. Convert one registry family at a time (e.g., line nodes first) and maintain alias-backed params for recipe compatibility.
3. Add golden parity tests using actual registry stacks/presets (legacy path vs migrated path checksums).
4. Promote UI schema helpers from utilities to actual control-rendering path incrementally.

## Final assessment

The new modules are **real implementations**, but as of now they behave primarily as a **shared library layer** rather than complete structural replacements of prior modules/nodes in live app architecture.
