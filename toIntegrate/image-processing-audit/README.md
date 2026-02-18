# toIntegrate Image-Processing Audit

This folder contains deep-dive image-processing audits for every top-level item in `toIntegrate/`.

## Documents
- `colourquantiser.md`
- `distortion-pipeline.md`
- `index-1.md`
- `info.md.md`
- `lones.md`
- `luminance-distortion.md`
- `paint-image.md`
- `processing-export.md`
- `tile2.md`

## Audit structure used in each file
Each audit now includes:
1. Scope and runtime dependencies.
2. Required internal modules/classes.
3. Function-level mechanisms (what each tool does + how it does it).
4. Defaults/configuration and capability surface.
5. End-to-end processing flow.
6. Constraints/limitations where relevant.
7. Source line anchors for traceability.

## Intent
These docs are written for integration planning and migration accuracy, with emphasis on operational detail rather than high-level summaries.

## New integration section added
Every audit now includes a **"Breakdown for integration into the main tool"** section that maps source behavior into this repository's module/node architecture (`src/modules/*`, `src/nodes/*`, `src/core/Pipeline.js`).

## Needed modules folder
A new folder `toIntegrate/image-processing-audit/needed-modules/` now contains implementation-ready module specs (IO, labels, options, functions, algorithms) for fully reproducing the toIntegrate tools inside the main architecture.

Also includes `needed-modules/ux-elements-and-variable-access-matrix.md` for complete UX/control and variable-access parity mapping.


## Execution plan
See `toIntegrate/image-processing-audit/module-implementation-integration-plan.md` for the phased plan to ensure all needed modules are implemented and integrated.
