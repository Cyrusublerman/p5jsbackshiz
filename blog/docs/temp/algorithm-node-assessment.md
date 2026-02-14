# Algorithm → Node Assessment

## Status: 18 nodes implemented. 22 additional nodes identified below.

---

## Tier 1 — Direct Wraps (algorithm → EffectNode, minimal glue)

### EDGE (4 nodes)

| Node | Source | Params | Notes |
|------|--------|--------|-------|
| SobelNode | `edge-detection/edge-operators.js` → `sobel()` | threshold, normalize | Outputs magnitude as greyscale pixel buffer |
| CannyNode | `edge-detection/edge-operators.js` → `canny()` | sigma, lowThreshold, highThreshold | Binary edge map → pixel buffer |
| LaplacianNode | `edge-detection/edge-operators.js` → `laplacian()`, `laplacianOfGaussian()` | mode (4-conn/8-conn/LoG), sigma | Zero-crossing or abs-value output |
| DoGNode | `edge-detection/edge-operators.js` → `differenceOfGaussians()` | sigma1, sigma2, threshold | Band-pass edge/blob detection |

### PATTERN (4 nodes)

| Node | Source | Params | Notes |
|------|--------|--------|-------|
| TruchetNode | `patterns/pattern-generators.js` → `generateTruchetGrid()`, `truchetSDF()` | tileSize, strokeWidth, seed | SDF evaluation per-pixel → greyscale |
| GratingNode | `patterns/pattern-generators.js` → `linearGrating()`, `radialGrating()`, `angularGrating()`, `spiralGrating()` | type (linear/radial/angular/spiral), wavelength, phase, angle, spiralRate | Pure per-pixel math |
| MoireNode | `patterns/pattern-generators.js` → `combineMoire()` | type1, type2, wavelength1, wavelength2, angle1, angle2, combineMode | Superposition of two gratings |
| HalftonePatternNode | `patterns/halftone-patterns.js` → `lineHalftone()`, `crossHatchHalftone()`, `dyadicHalftone()` | mode (line/crosshatch/dyadic), angle, spacing, levels | Render lines/dots to offscreen canvas |

### NOISE (2 nodes)

| Node | Source | Params | Notes |
|------|--------|--------|-------|
| PerlinOverlayNode | `noise/noise-functions.js` → `simplex2D()`, `fbm2D()`, `perlin2D()` | noiseType (simplex/perlin), scale, octaves, lacunarity, persistence, blendMode (add/multiply/screen), strength | Generate noise field, blend with src |
| DomainWarpNode | `noise/noise-functions.js` → `domainWarp2D()`, `multiWarp2D()` | strength, scale, octaves, layers, warpType (single/multi) | Warp src pixel coordinates via noise displacement |

### PHYSICS (3 nodes)

| Node | Source | Params | Notes |
|------|--------|--------|-------|
| ReactionDiffusionNode | `physics/reaction-diffusion.js` → `initGrayScott()`, `runGrayScott()` | preset (mitosis/coral/spots/maze/worms/solitons/pulsating/chaos), steps, seedSize | Init from src luminance, run N steps, map V→pixels |
| WaveDistortionNode | `physics/wave-solver.js` → `initWave2D()`, `stepWave2D()` | speed, damping, steps, initType (gaussian/ripple), radius | Run 2D wave sim, use displacement to warp src |
| CellularAutomataNode | `physics/reaction-diffusion.js` → `stepCellularAutomaton()`, `initCellularAutomaton()` | rule (life/highLife/seeds/dayNight/maze/anneal), steps, density, initFromImage | Threshold src → seed, run CA, output as mask |

---

## Tier 2 — Moderate Integration (need luminance extraction + render pipeline)

### IMAGE PROCESSING (3 nodes)

| Node | Source | Params | Notes |
|------|--------|--------|-------|
| PosterizeNode | `image/posterization.js` → `posterize()` + curve variants | levels, curve (uniform/log/adaptive), channel (rgb/hsl) | Per-channel tone quantization |
| OtsuThresholdNode | `segmentation/thresholding.js` → Otsu's method | mode (binary/adaptive), blockSize, sensitivity | Auto-threshold → binary or multi-level |
| AdvectionNode | `physics/advection.js` → bilinear advection step | velocitySource (noise/gradient/radial), steps, speed, decay | Fluid transport of pixel values |

### GEOMETRIC (3 nodes)

| Node | Source | Params | Notes |
|------|--------|--------|-------|
| VoronoiNode | `distance/jfa.js` → JFA distance transform | pointCount, seed, colorMode (distance/cell/edge) | Generate Voronoi from random seeds or luminance-thresholded seeds |
| ContourNode | `geometry/marching-squares.js` → marching squares | levels, spacing, strokeWeight | Extract iso-contours from luminance, render as line overlay |
| SDFShapeNode | `geometry/sdf-operations.js` → SDF primitives + booleans | shape, size, position, operation (union/intersect/subtract), smoothK | Generate SDF mask, apply as alpha or blend |

---

## Tier 3 — Complex Integration (multiple algorithm modules composed)

### COMPOSITE RENDER (3 nodes)

| Node | Source | Params | Notes |
|------|--------|--------|-------|
| StippleNode | `sampling/point-distribution.js` → Poisson disk + luminance weighting | minDist, maxDist, dotRadius, densityFromLuminance | Importance-sampled dot placement, render to buffer |
| DelaunayMeshNode | `geometry/delaunay-triangulation.js` + `sampling/point-distribution.js` | pointCount, samplingMethod, colorMode (flat/gradient/wire) | Sample points → triangulate → fill triangles with avg color |
| InterferenceNode | `optics/interference.js` → thin-film, two-beam | filmThickness, viewAngle, wavelengthRange, iridescence | Map luminance→thickness, compute spectral RGB per pixel |

---

## Summary

| Category | Existing | New Tier 1 | New Tier 2 | New Tier 3 | Total |
|----------|----------|------------|------------|------------|-------|
| COLOUR/TONE | 5 | — | 1 | — | 6 |
| BLUR | 2 | — | — | — | 2 |
| TRANSFORM | 1 | — | — | — | 1 |
| WARP | 2 | — | — | — | 2 |
| REFRACTION | 2 | — | — | — | 2 |
| ACCUMULATION | 1 | — | — | — | 1 |
| LINE RENDER | 3 | — | — | — | 3 |
| GENERATIVE | 1 | — | — | — | 1 |
| COMPOSITE | 1 | — | — | 1 | 2 |
| EDGE | 0 | 4 | — | — | 4 |
| PATTERN | 0 | 4 | — | — | 4 |
| NOISE | 0 | 2 | — | — | 2 |
| PHYSICS | 0 | 3 | — | — | 3 |
| IMAGE PROC | 0 | — | 2 | — | 2 |
| SEGMENTATION | 0 | — | 1 | — | 1 |
| GEOMETRIC | 0 | — | 3 | — | 3 |
| STIPPLE/MESH | 0 | — | — | 2 | 2 |
| OPTICS | 0 | — | — | 1 | 1 |
| **TOTAL** | **18** | **13** | **6** | **3** | **40** |

## Dependency Note

Tier 1 nodes (13) are self-contained; algorithm functions are pure and can be inlined or imported directly. No external dependency beyond `algorithms/`.

Tier 2 nodes (6) require `algorithms/core/matrix.js` for convolution kernels (edge operators use it), plus luminance extraction helpers already present in the library.

Tier 3 nodes (3) compose multiple algorithm modules and need offscreen canvas rendering for point/triangle/contour output.

## Implementation Priority

1. **EDGE** (4) — highest visual impact, cleanest wraps
2. **PATTERN** (4) — pure per-pixel math, no deps
3. **NOISE** (2) — domain warp is the most creatively useful
4. **PHYSICS** (3) — reaction-diffusion + wave are strong visual effects
5. **IMAGE PROC** (3) — posterize/threshold/advection fill gaps
6. **GEOMETRIC** (3) — voronoi/contour/SDF are unique capabilities
7. **TIER 3** (3) — stipple/delaunay/interference are showcase effects
