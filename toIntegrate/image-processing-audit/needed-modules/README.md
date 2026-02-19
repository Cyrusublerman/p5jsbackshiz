# Needed Modules (to fully mimic `toIntegrate` projects)

This folder defines module-spec documents that follow the same practical standards used across this repo’s moduleized architecture:

- explicit **Label**
- explicit **IO contract**
- explicit **Options / params**
- explicit **Functions**
- explicit **Algorithms**
- clear **mapping to existing or new modules** under `src/modules/*`

These specs are intentionally implementation-ready and aligned to:
- module contracts: `docs/specs/module-contracts.md`
- vector/raster bridge contract: `docs/specs/vector-raster-adapter.md`
- current module families in `src/modules/*`.

## Module spec files
1. `core-image-ingest-and-fit.md`
2. `color-lab-and-palette-core.md`
3. `color-quantize-and-dither-engine.md`
4. `color-adjustment-prepass.md`
5. `field-luminance-vector-builder.md`
6. `field-force-composer-advanced.md`
7. `line-flow-wavefront-engine.md`
8. `line-static-engine-advanced.md`
9. `line-serpentine-engine-advanced.md`
10. `painter-stroke-synthesis-engine.md`
11. `bridge-vector-raster-compositor.md`
12. `shader-worker-compositor-engine.md`
13. `export-animation-recorder-and-encoder.md`
14. `lab-code-runner-sandbox.md`
15. `node-wrapper-and-registry-contract.md`
16. `ux-elements-and-variable-access-matrix.md`


Related execution plan: `../module-implementation-integration-plan.md`.
