# Glitch Image Editor — Implementation Plan
 
## Architecture Overview
 
A unified, modular image editor built on p5.js that composites **all** existing
effects (distortion pipeline, luminance flow, serpentine halftone, colour
quantiser, paint image, tile compositor) into a single node-based processing
pipeline with a minimal retro Swiss UI.
 
The distortion pipeline (`toIntegrate/distortion-pipeline.html`) is the
architectural seed — its `EffectNode` class hierarchy, drag-reorderable stack,
recipe serialisation, and preview/final quality toggle are the correct
foundation. Every other tool's effects become new `EffectNode` subclasses
plugged into that same pipeline.
 
```
┌─────────────────────────────────────────────────────────┐
│                     APPLICATION                         │
│  AppState  ·  Pipeline  ·  Recipe  ·  UI  ·  Renderer   │
└────────┬────────────────────────────────────────────────┘
         │
    ┌────▼─────────────────────────────────────────────┐
    │              EFFECT NODE REGISTRY                │
    │                                                   │
    │  Category          Nodes                          │
    │  ──────────────    ─────────────────────────────  │
    │  COLOUR/TONE       Greyscale · Levels ·           │
    │                    Lift/Gamma/Gain · Quantise ·    │
    │                    Dither                          │
    │  BLUR              Box Blur · Gaussian Blur       │
    │  TRANSFORM         Affine Transform               │
    │  WARP              Flow Field · Band Shift         │
    │  REFRACTION        Radial Ripple · Lens Bubbles   │
    │  ACCUMULATION      Iterative Rewarp               │
    │  LINE RENDER       Luminance Flow · Serpentine ·   │
    │                    Static Halftone                 │
    │  GENERATIVE        Paint Stroke                   │
    │  COMPOSITE         Tile Blend (multiply/diff/     │
    │                    crossfade)                      │
    │  EDGE              Sobel · Canny                  │
    │  PATTERN           Truchet · Moiré · Halftone ·   │
    │                    Grating                         │
    │  NOISE             Perlin Overlay · Domain Warp   │
    │  PHYSICS           Reaction-Diffusion ·            │
    │                    Wave Distortion                 │
    └──────────────────────────────────────────────────┘
```
 
---
 
## Directory Structure
 
```
src/
├── index.html                  # Shell: grid layout, header bars, fn-key bar
├── style.css                   # Swiss retro design tokens + all component styles
├── main.js                     # Bootstrap: p5 sketch, wire AppState→Pipeline→UI→Renderer
│
├── core/
│   ├── AppState.js             # Global state: source image, stack, zoom, quality, seed
│   ├── Pipeline.js             # Render loop: iterate stack, apply nodes, opacity blend
│   ├── Recipe.js               # JSON serialise/deserialise full state
│   ├── Sampler.js              # Bilinear/nearest pixel sampling (from distortion-pipeline)
│   ├── SeededRNG.js            # LCG random + hash seed utility
│   └── PerlinNoise.js          # 2D Perlin + fBm (from distortion-pipeline)
│
├── nodes/
│   ├── EffectNode.js           # Abstract base class (id, type, name, enabled, solo,
│   │                           #   opacity, params, paramDefs, apply(), toJSON(), fromJSON())
│   │
│   ├── colour/
│   │   ├── GreyscaleNode.js
│   │   ├── LevelsNode.js
│   │   ├── ContrastNode.js     # Lift/Gamma/Gain
│   │   ├── QuantiseNode.js     # Colour quantisation (from colourquantiser)
│   │   └── DitherNode.js       # Blue-noise + Floyd-Steinberg dithering
│   │
│   ├── blur/
│   │   ├── BoxBlurNode.js
│   │   └── GaussianBlurNode.js
│   │
│   ├── transform/
│   │   └── AffineTransformNode.js
│   │
│   ├── warp/
│   │   ├── FlowFieldNode.js
│   │   └── BandShiftNode.js
│   │
│   ├── refraction/
│   │   ├── RadialRippleNode.js
│   │   └── LensBubblesNode.js
│   │
│   ├── accumulation/
│   │   └── IterativeRewarpNode.js
│   │
│   ├── line/
│   │   ├── LuminanceFlowNode.js    # Renders line-displaced output to pixel buffer
│   │   ├── SerpentineNode.js       # Serpentine halftone → pixel buffer
│   │   └── StaticHalftoneNode.js   # Static parallel lines → pixel buffer
│   │
│   ├── generative/
│   │   └── PaintStrokeNode.js      # Iterative brush painting (from paint-image)
│   │
│   ├── composite/
│   │   └── TileBlendNode.js        # Multi-image blend modes (from tile2)
│   │
│   ├── edge/
│   │   ├── SobelNode.js
│   │   └── CannyNode.js
│   │
│   ├── pattern/
│   │   ├── TruchetNode.js
│   │   ├── MoireNode.js
│   │   ├── HalftonePatternNode.js
│   │   └── GratingNode.js
│   │
│   ├── noise/
│   │   ├── PerlinOverlayNode.js
│   │   └── DomainWarpNode.js
│   │
│   ├── physics/
│   │   ├── ReactionDiffusionNode.js
│   │   └── WaveDistortionNode.js
│   │
│   └── registry.js             # Central { category → [{ type, label, factory }] } map
│
├── ui/
│   ├── UI.js                   # Master controller: menu, header, fn-keys, drag/drop,
│   │                           #   stack panel, parameter rows
│   ├── StatusPanel.js          # Right-side viewport status indicators
│   └── Reticle.js              # Viewport crosshair/ring overlay
│
└── render/
    └── ViewportRenderer.js     # p5 draw loop: zoom/pan, crop marks, dashed guides
```
 
---
 
## Step-by-Step Implementation Plan
 
### Phase 1 — Project Scaffold & Core Architecture
 
1. **Create branch and directory structure**
   - `src/` with subdirectories as shown above
   - Single `index.html` entry point
 
2. **Extract `core/` modules from distortion-pipeline**
   - `SeededRNG.js` — class `SeededRNG` + `hashSeed()` function
   - `PerlinNoise.js` — class `PerlinNoise` (2D noise + fBm)
   - `Sampler.js` — class `Sampler` (bilinear, nearest, sample dispatch)
   - `AppState.js` — class `AppState` (source image/pixels, stack, seed, zoom,
     quality, render timing)
   - `Pipeline.js` — class `Pipeline` (render loop with preview downscale,
     opacity blending, solo mode, dirty flags)
   - `Recipe.js` — class `Recipe` (static export/import JSON)
 
3. **Extract `nodes/EffectNode.js` base class**
   - Static ID counter, constructor(type, name, paramDefs)
   - `apply(srcPixels, dstPixels, w, h, ctx)` — abstract
   - `toJSON()` / `fromJSON(data)` — serialisation
   - Properties: `enabled`, `solo`, `opacity`, `expanded`, `params`
 
### Phase 2 — Existing Distortion Pipeline Nodes
 
4. **Port all 11 existing nodes** as individual ES module files:
   - `GreyscaleNode`, `LevelsNode`, `ContrastNode`
   - `BoxBlurNode`, `GaussianBlurNode`
   - `AffineTransformNode`
   - `FlowFieldNode`, `BandShiftNode`
   - `RadialRippleNode`, `LensBubblesNode`
   - `IterativeRewarpNode`
 
5. **Create `nodes/registry.js`** — central map of categories → node factories
 
### Phase 3 — UI Shell (Swiss Retro Design)
 
6. **`index.html`** — minimal HTML grid shell:
   - CSS Grid: `300px 1fr` columns, `24px 22px 1fr 24px` rows
   - Header row 1: app name (inverse block), clock, seed input, image info,
     mode, render time, node count, zoom
   - Header row 2: pipeline label, work/DPO indicators
   - Left panel: scrollable effect stack with `+ ADD` button
   - Viewport: canvas with reticle overlay, corner crop marks, status panel
   - Footer: function-key bar (LOAD, PREVIEW, FINAL, FIT, 1:1, EXPORT,
     RECIPE, LOAD R, + 3 preset slots)
 
7. **`style.css`** — Swiss retro design system:
   - CSS custom properties: `--bg`, `--panel`, `--cell`, `--border`,
     `--text`, `--text-dim`, `--text-vdim`, `--inverse-bg`, `--inverse-text`,
     `--indicator-on`, `--indicator-off`
   - Font: `'Courier New', Courier, monospace`
   - Scanline overlay (`body::before`), vignette (`body::after`)
   - 1px slider thumbs, 9×9px toggle squares, uppercase labels,
     letter-spacing, monochrome palette
   - Node cards: drag handle, index number, enable toggle, solo button,
     expand/collapse, delete
   - Parameter rows: label (uppercase 10px) + thin range slider + numeric input
   - Add menu: grouped dropdown with category headers
 
8. **`ui/UI.js`** — master UI controller:
   - `_menu()` — build add-node dropdown from registry
   - `_top()` — seed input, random seed, file input
   - `_fnKeys()` — bind footer function keys
   - `_dragDrop()` — viewport drag/drop image loading, pan, zoom wheel
   - `refreshStack()` — rebuild node card DOM from state.stack
   - `_p()` — parameter row factory (range+numeric or select)
   - Clock update interval
   - Status panel indicators
 
9. **`ui/StatusPanel.js`** — right-side viewport status
10. **`ui/Reticle.js`** — crosshair, rings, axis labels, scale marks
 
### Phase 4 — Viewport Renderer
 
11. **`render/ViewportRenderer.js`**:
    - p5 `draw()` implementation
    - Fit/1:1/custom zoom modes
    - Pan offset
    - Corner crop marks (L-shaped brackets)
    - Centre crosshairs (dashed)
    - ImageData → offscreen canvas → drawImage with zoom/pan
 
### Phase 5 — Line-Render Nodes (from luminance-distortion & serpentine)
 
12. **`nodes/line/LuminanceFlowNode.js`**
    - Embeds: `VectorFieldMap`, `ForceSystem`, `Steering`, `LineGenerator`,
      `DisplacementMatrix`, `ColorMapper` (from luminance-distortion)
    - `apply()` renders line art to an offscreen canvas, reads back pixels
    - Params: pattern type, spacing, stroke weight, force mixes (fixed angle,
      gradient push, tangent push, origin radial, sine waves, flow field),
      damping, steering, colour mode, iterations
 
13. **`nodes/line/SerpentineNode.js`**
    - Embeds: `LuminanceField`, `FitMapper`, `DragModel`, `TensionSolver`,
      `FlowWaveFront`, `WaveFrontFlowEngine` (from serpentine halftone)
    - `apply()` runs N simulation frames, renders to offscreen canvas, reads back
    - Params: mode (flow/static/serpentine), spacing, amplitude, frequency,
      drag light/dark, tension, iterations, stroke weight, bg/stroke colour
 
14. **`nodes/line/StaticHalftoneNode.js`**
    - Static parallel-line halftone (from serpentine's `ParallelStaticEngine`)
    - Params: spacing, max amplitude, frequency, phase, amp curve
 
### Phase 6 — Colour Quantisation Nodes (from colourquantiser)
 
15. **`nodes/colour/QuantiseNode.js`**
    - Palette selection (1-bit, 2-bit, NES, Game Boy, custom)
    - Nearest-colour quantisation
    - Params: palette preset, custom colours array
 
16. **`nodes/colour/DitherNode.js`**
    - Blue-noise dithering (nearest-opposite strategy)
    - Floyd-Steinberg error diffusion
    - Params: method (blue-noise / floyd-steinberg / none), threshold
 
### Phase 7 — Generative & Composite Nodes
 
17. **`nodes/generative/PaintStrokeNode.js`** (from paint-image)
    - Iterative brush painting with palette matching
    - Params: brush size, opacity, iterations, max layers, palette
 
18. **`nodes/composite/TileBlendNode.js`** (from tile2)
    - Blend modes: crossfade, multiply, difference
    - Secondary image source (upload)
    - Params: blend mode, mix, secondary image
 
### Phase 8 — Algorithm Library Nodes
 
19. **`nodes/edge/SobelNode.js`** — wraps `algorithms/edge-detection/edge-operators.js`
20. **`nodes/edge/CannyNode.js`** — wraps Canny from same module
21. **`nodes/pattern/TruchetNode.js`** — wraps `algorithms/patterns/pattern-generators.js`
22. **`nodes/pattern/MoireNode.js`** — moiré superposition
23. **`nodes/pattern/HalftonePatternNode.js`** — halftone from algorithm library
24. **`nodes/pattern/GratingNode.js`** — linear/radial/angular/spiral gratings
25. **`nodes/noise/PerlinOverlayNode.js`** — additive/multiplicative noise layer
26. **`nodes/noise/DomainWarpNode.js`** — coordinate distortion via noise
27. **`nodes/physics/ReactionDiffusionNode.js`** — Gray-Scott / Turing patterns
28. **`nodes/physics/WaveDistortionNode.js`** — 2D wave equation ripple
 
### Phase 9 — Presets & Recipes
 
29. **Built-in presets** (fn-key bar):
    - `SCANBND` — greyscale → levels → band shift × 2 → blur (existing)
    - `LIQUID` — greyscale → contrast → flow field → blur → levels (existing)
    - `DROWNED` — greyscale → ripple → lens bubbles → iter rewarp → blur → levels
    - `DATAMOSH` — band shift → quantise → dither → flow field
    - `CORRODED` — canny edge → reaction-diffusion → levels → dither
    - `ENGRAVE` — greyscale → luminance flow (static lines)
    - `WAVEFORM` — greyscale → serpentine (flow mode)
    - `SIGNAL` — greyscale → domain warp → band shift → moiré → levels
 
30. **Recipe import/export** — full JSON state serialisation (already implemented)
 
### Phase 10 — Export & Final Polish
 
31. **Export formats**:
    - PNG (full resolution)
    - Recipe JSON (save/load processing chain)
 
32. **Keyboard shortcuts** (matching fn-key bar):
    - `1` Load image, `2` Preview mode, `3` Final mode
    - `4` Fit, `5` 1:1, `6` Export PNG, `7` Export recipe, `8` Load recipe
 
33. **Final integration testing**
    - Verify all nodes apply correctly in pipeline
    - Test preset recipes
    - Test recipe save/load round-trip
    - Test image upload, preview/final modes, zoom/pan
 
---
 
## Design Principles
 
### Swiss Retro Aesthetic
- **Monochrome palette**: `#1a1a1a` bg, `#222` panels, `#ccc/#fff` text
- **Monospace typography**: Courier New, 10-12px, uppercase labels, letter-spacing
- **Scanline overlay**: CSS `repeating-linear-gradient` on `body::before`
- **Vignette**: CSS radial gradient on `body::after`
- **Indicator language**: 9×9px squares (on/off), 3×11px vertical bars
- **Minimal chrome**: 1px borders, no rounded corners, no shadows (except dropdown)
- **Grid-based layout**: strict column/row alignment
- **Functional key bar**: reminiscent of DOS/terminal applications
 
### OOP Patterns
- **Inheritance**: `EffectNode` base → specialised node subclasses
- **Composition**: `Pipeline` composes `EffectNode[]`, `UI` composes `StatusPanel` + `Reticle`
- **Registry pattern**: central factory map for node instantiation
- **State object**: `AppState` as single source of truth
- **Strategy pattern**: `Sampler` dispatch (bilinear vs nearest)
 
### Modularity
- One class per file, ES module exports
- Nodes self-contained: each file defines params, apply logic, serialisation
- Registry is the only coupling point between nodes and UI
- Core utilities (RNG, noise, sampling) shared without circular deps
- Algorithm library functions imported as pure utilities where needed
