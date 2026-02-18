# Module Spec: field-force-composer-advanced

## Label
`FIELD / FORCE COMPOSER ADVANCED`

## IO
- **Input**: multiple force fields/components + weights
- **Output**: composed `VectorField`

## Options
- per-force weights
- `normalize` (default: false)
- `clamp` magnitude cap
- `deadZone` threshold

## Functions
- `composeForces(...)`
- `gradientForce(...)`
- `tangentForce(...)`
- `originForce(...)`
- `noiseFlowForce(...)`

## Algorithms
- weighted vector superposition
- optional normalization/clamp
- dead-zone suppression
- procedural noise/curl force injection

## Existing/Target location
- Existing: `src/modules/field/force-composer.js`, `noise-flow.js`, `origin-force.js`
- Extend with tangent/origin orbit variants from luminance tools.
