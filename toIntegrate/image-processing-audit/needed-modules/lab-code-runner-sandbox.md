# Module Spec: lab-code-runner-sandbox

## Label
`LAB / CODE RUNNER SANDBOX`

## IO
- **Input**: user sketch code + runtime API bindings + safety policy
- **Output**: callable setup/draw hooks + execution diagnostics

## Options
- `timeoutMs`
- `maxFrames`
- `allowedAPIs`
- `strictMode`

## Functions
- `parseUserSketch(...)`
- `compileUserSketch(...)`
- `runSetup(...)`
- `runDraw(...)`
- `cancelExecution(...)`

## Algorithms
- multi-pattern setup/draw extraction
- controlled function compilation
- bounded execution with fail-fast diagnostics

## Existing/Target location
- Existing: `src/modules/lab/code-runner.js`
- Extend with stricter sandboxing and export-recorder integration for processing-export parity.
