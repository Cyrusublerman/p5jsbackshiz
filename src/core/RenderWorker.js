/**
 * RenderWorker — runs Pipeline.render() off the main thread.
 * Receives serialised state + pixel buffer, returns rendered pixels.
 */
import { AppState } from './AppState.js';
import { Pipeline } from './Pipeline.js';
import { REGISTRY } from '../nodes/registry.js';

const state = new AppState();
const pipeline = new Pipeline(state);

self.onmessage = function (e) {
  const msg = e.data;

  if (msg.type === 'render') {
    const pixels = new Uint8ClampedArray(msg.sourcePixels);
    state.sourcePixels = pixels;
    state.sourceW = msg.sourceW;
    state.sourceH = msg.sourceH;
    state.quality = msg.quality;
    state.previewScale = msg.previewScale;
    state.globalSeed = msg.globalSeed;
    state.soloNodeId = msg.soloNodeId;
    state.needsRender = true;
    state.rendering = false;

    // Rebuild stack from serialised data
    const allEntries = Object.values(REGISTRY).flat();
    state.stack = [];
    for (const nd of msg.stack) {
      const entry = allEntries.find(e => e.type === nd.type);
      if (entry) {
        const node = entry.factory();
        node.enabled = nd.enabled;
        node.opacity = nd.opacity;
        for (const k in nd.params) {
          if (k in node.params) node.params[k] = nd.params[k];
        }
        state.stack.push(node);
      }
    }

    const result = pipeline.render();
    if (result) {
      const buf = result.pixels;
      self.postMessage({
        type: 'result',
        pixels: buf.buffer,
        width: result.width,
        height: result.height,
        renderTime: state.lastRenderTime
      }, [buf.buffer]);
    }
  }
};
