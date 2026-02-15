# Current System Breakdown

This document describes how the existing code behaves today and how responsibilities are divided across modules.

## Entry Point
- `main.js` wires together analysis, stippling, path solving, flow lines, contours, rendering, and UI handling. It owns the p5 sketch loop and dirty flags.

## Modules

### `analysis.js`
- Builds shared fields used by all downstream modules:
  - Tone (luminance)
  - Smoothed tone (box blur)
  - Edge magnitude + edge mask (Canny)
  - Edge influence (blurred normalized magnitude)
- Output is cached in `analysisEngine.result` and reused until analysis parameters change.

### `stipple.js`
- Generates a Poisson disk base distribution.
- Applies density acceptance using tone gamma and edge influence.
- Runs iterative merge (centroid clustering) so points respect minimum distance.
- Stores per-point attributes: tone, edge, edge influence, cluster size.

### `path.js`
- Builds a single-stroke path through all stipple points.
- Starts from the top-left-most point.
- Candidate modes are tried and validated:
  - monotone-y / monotone-x
  - Delaunay greedy
  - nearest-neighbor TSP
  - Christofides TSP
- Valid paths are scored by max segment length, total length, smoothness.
- If no candidate passes, a deterministic monotone-y backbone is used.

### `flow.js`
- Creates a vector field from the negative Sobel gradient of the smoothed tone.
- Integrates streamlines using Euler steps.
- Optional Perlin noise modulation, seeded for determinism.

### `contours.js`
- Extracts marching squares contours from the smoothed tone at fixed intervals.

### `renderer.js`
- Draws the image plus toggled layers (stipple points, path, edges, flow lines, contours).

### `ui.js`
- Binds all UI inputs to the parameter model.
- Triggers dirty flags when parameters change.
- Handles image upload and reset.

### `utils.js`
- Centralized geometry epsilon and math helpers.
- Shared functions for blur, seeded RNG, segment intersection, distance, and top-left selection.

### `merge.js`
- Iterative union-find merging to collapse points closer than min distance.

## Data Flow Summary
1. Analysis computes fields once per change.
2. Stippling uses those fields to create points.
3. Path solver consumes stipple points and produces a single polyline.
4. Flow/contours/edges read analysis fields only.
5. Renderer composes all enabled layers each frame.
