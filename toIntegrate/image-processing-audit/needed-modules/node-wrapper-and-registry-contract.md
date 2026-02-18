# Module Spec: node-wrapper-and-registry-contract

## Label
`RUNTIME / NODE WRAPPER CONTRACT`

## IO
- **Input**: module outputs (raster/vector/field) + node params + pipeline context
- **Output**: pipeline-compatible node application output

## Options
- `enabled`, `solo`, `opacity`
- mask/modulation controls
- schema-backed param defaults and aliases

## Functions
- `apply(src,dst,w,h,ctx)` per node wrapper
- `toJSON()/fromJSON()` serialization
- `applyVector(...)` bridge hook where needed
- registry `factory()` constructors

## Algorithms
- deterministic node execution order
- node-level opacity blend with pipeline buffers
- vector-to-raster bridge compositing at node boundary

## Existing/Target location
- Runtime contract: `src/nodes/EffectNode.js`, `src/core/Pipeline.js`, `src/nodes/registry.js`
- Requirement: every migrated feature module must be exposed through these wrappers for full tool parity.
