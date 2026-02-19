# Module Spec: line-serpentine-engine-advanced

## Label
`LINE / SERPENTINE`

## IO
- **Input**: luma field + serpentine/tension config
- **Output**: evolving serpentine line state + `LineSet`

## Options
- `spawnRate`, `oscSpeed`, `baseSpeed`
- `oscTopPercent`, `oscBottomPercent`
- drag curve params
- tension params

## Functions
- `initSerpentineState(...)`
- `spawnSerpentinePoints(...)`
- `updateSerpentine(...)`
- `applyTension(...)`

## Algorithms
- oscillatory inlet spawning
- luminance drag x-advection
- perimeter border phase traversal
- tension smoothing and trailing point retirement

## Existing/Target location
- Existing: `src/modules/line/serpentine-line-engine.js`
- Extend with border-phase + tension parity behavior.
