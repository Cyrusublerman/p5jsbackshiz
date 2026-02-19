# processing-export (`toIntegrate/processing-export`)

## Scope and dependencies
- Source analyzed: `toIntegrate/processing-export/processing-export/src/index.html` (inline JS block).
- Dependencies:
  - p5.js runtime for drawing user sketches,
  - gif.js for GIF encoding.

## Modules and mechanisms

### 1) `FrameCapture`
**State**
- width, height, framerate, target frameCount, frame array.

**Processing functions**
- `addFrame(canvas)`: captures raw RGBA frame via `getImageData`.
- `isComplete/getFrameCount`: recording progress checks.
- `generateGIF`: reconstructs each frame into temp canvases using `putImageData`, then feeds gif.js with per-frame delay `1000/fps`.

Source anchors: lines 215-271.

### 2) `CodeManager`
- Parses user text to extract `setup` and `draw` bodies (supports multiple declaration syntaxes).
- Builds executable functions via `new Function`.
- If no draw function pattern found, treats full text as draw body.

Source anchors: lines 273-346.

### 3) `UIController`
- Binds controls for loading code, recording, duration/framerate/frame count relationships, and downloading GIF.
- `startRecording`: creates `FrameCapture(800,800,fps,frameCount)` and toggles UI state.
- `stopRecording`: freezes capture and enables export.
- `downloadGIF`: runs encoder and emits downloadable blob URL.

Source anchors: lines 348-501.

### 4) p5 integration loop
- `p.setup`: creates 800x800 render canvas and executes parsed setup function.
- `p.draw`: executes parsed draw function each frame; when recording, captures current frame and auto-stops at target frame count.

Source anchors: lines 508-546.

## Defaults and capabilities
- Render/capture resolution: 800×800.
- Recording is frame-count bounded with user-specified FPS.
- Supports recording arbitrary user-supplied p5 drawing logic (as long as it executes in this runtime).

Source anchors: lines 454, 510, 423-439.

## End-to-end processing process
1. User loads or edits p5 code.  
2. Parser extracts and compiles executable setup/draw functions.  
3. Sketch runs in p5 canvas.  
4. During recording, each frame is copied into `ImageData`.  
5. On download, stored frames are raster-restored and encoded into GIF via gif.js.

## Notes and limitations
- No intrinsic filter chain; this tool is a frame capture/export wrapper around user code.
- Memory cost grows with `frameCount * width * height * 4` bytes plus overhead.

## Breakdown for integration into the main tool (`src/modules/*` + node runtime)

### Target module decomposition
1. **Frame timeline recorder**
   - Use `src/modules/export/timeline-recorder.js` for canonical frame/time capture and consistency checks.

2. **Raster frame export module**
   - Route frame extraction through `src/modules/export/raster-exporter.js` for still-frame handling.

3. **Animation export adapter**
   - Add GIF/WebM adapter layer in `src/modules/export/` that consumes recorded timeline frames.
   - Keep codec/library-specific logic isolated from p5/UI code.

4. **User-code execution sandbox**
   - If this capability is retained, integrate with `src/modules/lab/code-runner.js` instead of ad-hoc `new Function` in UI.
   - Add safety limits (timeouts, frame budget, allowlist APIs).

5. **UI contract integration**
   - Duration/FPS/frame-count relationships should be schema-driven so exports are reproducible across tools.

### Recommended migration sequence
1. Replace in-page frame list with `TimelineRecorder` payload format.  
2. Implement GIF/WebM exporter adapter in `src/modules/export/`.  
3. Move code parsing/execution into `lab/code-runner`.  
4. Expose recording controls in main tool export panel.
