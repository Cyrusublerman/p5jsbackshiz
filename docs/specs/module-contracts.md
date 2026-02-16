# Module Contracts

Canonical types used across modular pipeline:

- `ImageAsset`: `{ pixels: Uint8ClampedArray, width: number, height: number, colorSpace?: string }`
- `MappedImage`: `{ image: ImageAsset, fitMode: "contain"|"cover"|"stretch", offsetX: number, offsetY: number, scaleX: number, scaleY: number }`
- `VectorField`: `{ width: number, height: number, vectors: Float32Array }` where `vectors[i*2]` is x and `vectors[i*2+1]` is y
- `Displacement`: `{ width: number, height: number, offsets: Float32Array }`
- `LineSet`: `{ lines: Array<Array<{x:number,y:number}>>, bounds: {minX:number,minY:number,maxX:number,maxY:number} }`
- `EngineOutput`: union of `{ kind: "raster", image: ImageAsset }`, `{ kind: "vector", lines: LineSet }`, `{ kind: "field", field: VectorField }`

Rules:

1. Modules must return deterministic output for same seed+params.
2. Vector engines never mutate input raster buffers.
3. Adapters convert vector outputs into raster only at bridge boundary.
