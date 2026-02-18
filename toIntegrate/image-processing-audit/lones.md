# lones (`toIntegrate/lones`)

## Scope analyzed
- `toIntegrate/lones/lones/src/index.html`
- `toIntegrate/lones/lones/index (2).html`

## Equivalence verification
- `src/index.html` is byte-identical to `toIntegrate/index (1).html`.
- `index (2).html` is also byte-identical to `toIntegrate/index (1).html`.
- Verification method used: `cmp -s` comparisons for both files.

## Consequence for image-processing coverage
Because these files are identical, the complete image-processing behavior is exactly the same as `index (1)`:

1. Luminance extraction into a `Float32Array` field (`LuminanceField.updateFromDomImage`).
2. Contain/cover coordinate remapping (`FitMapper`).
3. Luminance-driven motion/displacement (`DragModel`, `CurveUtil`).
4. Three engines:
   - wave-front flow,
   - static parallel displacement,
   - serpentine path growth.
5. Tension smoothing (`TensionSolver`).
6. Raster/vector export (`ExportManager`, `SvgBuilder`).

## Key anchors in `lones/lones/src/index.html`
- Global defaults (`CONFIG`): lines 500-519.
- Luminance field extraction/sampling: lines 537-573.
- Fit mapping: lines 579-604.
- Flow engine: lines 691-855.
- Static engine: lines 860-905.
- Serpentine engine: lines 910-963.
- Rendering/export: lines 969-1039+.

## Operational note
For integration planning, treat `lones` as duplicate inventory, not a distinct algorithm implementation.

## Breakdown for integration into the main tool (`src/modules/*` + node runtime)

Because `lones` is functionally identical to `index (1)`, module decomposition is the same target plan:
- source/luma mapping -> `src/modules/core/image-io.js`,
- field composition -> `src/modules/field/*`,
- line generation -> `src/modules/line/*`,
- rasterization bridge -> `src/modules/bridge/node-adapters.js`,
- node wrappers/registry -> `src/nodes/line/*` + `src/nodes/registry.js`,
- export/debug -> `src/modules/export/*`, `src/modules/ui/debug-overlays.js`.

Implementation guidance: do **not** duplicate module work for `lones`; treat it as a duplicate fixture set for regression validation only.
