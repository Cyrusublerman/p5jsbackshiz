# Module Capability Assessment (Node Integration)

## Focus: `quantise`

## Problem observed
- `src/modules/color/palette-quantizer.js` supports LAB/DeltaE quantization and optional dithering.
- `src/nodes/colour/QuantiseNode.js` previously used only legacy RGB nearest-distance logic.
- Result: module capabilities existed but were not exposed through the production node path.

## Integration decision
- Preserve existing behavior by default (zero-deviance baseline):
  - `engine = legacy-rgb`
  - `dither = false`
- Add module-backed path as opt-in:
  - `engine = module-lab`
  - optional `dither = true/false`

## Outcome
- Legacy presets/recipes continue to render using original quantise behavior unless engine is explicitly switched.
- New module capabilities are now available in the same legacy node class/UI contract.

## Files updated
- `src/nodes/colour/QuantiseNode.js`
- `tests/modules.test.js`
