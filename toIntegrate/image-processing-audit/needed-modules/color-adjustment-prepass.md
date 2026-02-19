# Module Spec: color-adjustment-prepass

## Label
`COLOR / PREPASS (GAMMA-CONTRAST-SAT)`

## IO
- **Input**: RGBA buffer + adjustment params
- **Output**: adjusted RGBA buffer (non-destructive)

## Options
- `gamma` (default: 1.0)
- `contrast` (default: 1.0)
- `saturation` (default: 1.0)
- `order` (default: saturation→contrast→gamma)

## Functions
- `applyImageAdjustments(...)`
- `applySaturation(...)`
- `applyContrast(...)`
- `applyGamma(...)`

## Algorithms
- luminance-relative saturation transform
- normalized contrast around pivot 0.5
- gamma exponent correction with clamp/round

## Existing/Target location
- Target new helper in `src/modules/color/` and reused by color nodes.
