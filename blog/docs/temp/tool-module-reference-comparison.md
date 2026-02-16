# Tool Module Assessment vs. Reference Tools

## Scope

This assessment compares:

1. Runtime algorithm modules shipped in both tool targets:
   - `libraries/p5js-editor/algorithms/`
   - `libraries/codepen/algorithms/`
2. Concept/reference material in `reference/`.

---

## 1) Tool-to-Tool Module Parity (p5js-editor vs CodePen)

### Result: **Parity is complete**

- JS module file count is identical: **54 vs 54**.
- Relative module paths are identical.
- File contents are byte-for-byte identical across both targets.

**Conclusion:** there is no drift between the two tool distributions at algorithm-module level; maintenance burden is currently low because both exports are synchronized.

---

## 2) Module Coverage vs Reference Domains

Legend:
- ✅ Strong coverage: dedicated module(s) and direct algorithm implementations present.
- 🟡 Partial coverage: some related implementations exist, but reference domain breadth is larger.
- ❌ Gap: no clear dedicated runtime module for most of this domain.

| Reference Domain | Ref Files | Runtime Module Match | Coverage | Notes |
|---|---:|---|---|---|
| 01 Edge / Gradient / Differential | 13 | `edge-detection`, `features/hog` | ✅ | Sobel/Scharr/Prewitt/Roberts/Canny/LoG/DoG + structure tensor/HOG are present. |
| 02 Segmentation / Region Extraction | 9 | `segmentation/thresholding` | 🟡 | Otsu + components exist; broader segmentation methods in references exceed current module scope. |
| 03 Raster↔Vector Conversion | 12 | `geometry/marching-squares`, `geometry/stl-generation`, `geometry/grid-scan-transform` | 🟡 | Good contour/vectorization primitives; not full parity with all conversion references. |
| 04 Sampling / Point Distribution | 15 | `sampling/point-distribution` | ✅ | Importance sampling, Poisson disk, Halton, Lloyd-style workflows exist. |
| 05 Space-Filling Curves | 17 | `space-filling/space-filling-curves` | ✅ | Dedicated module for curve generation and traversal workflows. |
| 06 Polygon / Grid / Domain Subdivision | 15 | `geometry/polygon-operations`, `layout/grid-layout`, `geometry/bin-packing`, `geometry/spatial-index` | ✅ | Strong geometry + layout toolchain coverage. |
| 07 TSP-based Space Filling | 7 | `tsp/path-optimization` | ✅ | Nearest-neighbor, 2-opt, Christofides APIs are present. |
| 08 Reaction-Diffusion / PDE | 16 | `physics/reaction-diffusion`, `physics/advection`, `physics/wave-solver` | ✅ | Major simulation families represented. |
| 09 Orientation Fields / Flow | 3 | `features/hog`, `physics/advection` | 🟡 | Some flow/orientation capabilities; domain appears broader than implemented set. |
| 10 Curve Theory / Stroke Geometry | 13 | `geometry/curve-geometry` | 🟡 | Offsets/extrusion/normals implemented; reference breadth (e.g., deeper differential geometry) is larger. |
| 11 Optimization / Numerical Methods | 15 | `tsp`, `sampling`, `distance/geodesic`, `noise` helpers | 🟡 | Optimization appears as embedded methods, not a dedicated numerical-method suite. |
| 12 Triangulation / Meshing | 6 | `geometry/delaunay-triangulation` | ✅ | Core triangulation coverage present. |
| 13 Distance / Morphology / Topology | 9 | `distance/jfa`, `distance/geodesic`, `geometry/sdf-operations` | 🟡 | Distance fields are strong; morphology/topology breadth appears only partially represented. |
| 15 Colour / Perceptual Models | 8 | `color/color-utils`, `color/quantization`, `color/color-similarity-grouping` | ✅ | Good practical color processing support. |
| 16 Graphs / Connectivity / Pathfinding | 7 | `distance/geodesic` (graph-style solving), parts of `tsp` | 🟡 | No standalone graph/pathfinding module (BFS/DFS/A* families not first-class). |
| 17 Noise Functions | 3 | `noise/noise-functions` | ✅ | Dedicated complete module family. |
| 18 Pattern Generation | 1 | `patterns/pattern-generators`, `patterns/halftone-patterns` | ✅ | Coverage exceeds minimal reference set. |
| 19 Interference / Optics | 5 | `optics/interference` | ✅ | Dedicated optics module exists. |
| 20 Physics Simulation | 4 | `physics/wave-solver`, `physics/reaction-diffusion`, `physics/advection` | ✅ | Core simulation categories represented. |

---

## 3) Highest-Value Gaps

1. **Graphs/pathfinding as a first-class module** (Domain 16):
   - Add explicit APIs for BFS, DFS, Dijkstra, A* to align directly with reference taxonomy.
2. **Morphology operators as dedicated module(s)** (Domain 13):
   - Erode/dilate/open/close/hit-or-miss would close major conceptual gaps.
3. **Broader segmentation suite** (Domain 02):
   - Watershed, random walker, GrabCut-style interfaces could reduce mismatch.
4. **Numerical methods package** (Domain 11):
   - Consolidate optimizers/solvers into a dedicated module namespace instead of implicit embedding.

---

## 4) Prioritized Roadmap (Reference Alignment)

1. **Create `algorithms/graphs/pathfinding.js`**
   - BFS, DFS, Dijkstra, A* (+ utility graph builders).
2. **Create `algorithms/morphology/operations.js`**
   - Binary + grayscale morphology and structuring-element helpers.
3. **Expand `algorithms/segmentation/`**
   - Additional methods behind uniform image/field adapters.
4. **Create `algorithms/numerical/`**
   - Shared optimization/linear-solver utilities reusable by physics/geometry modules.

This sequence gives the biggest reference-to-runtime parity gain with minimal disruption to existing module organization.
