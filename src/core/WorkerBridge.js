/**
 * WorkerBridge — main-thread interface to the render worker.
 * Falls back to synchronous Pipeline.render() if Workers unavailable.
 */
export class WorkerBridge {
  constructor(state, onResult) {
    this.state = state;
    this.onResult = onResult;
    this._worker = null;
    this._pending = false;
    this._queued = false;
    this._fallbackPipeline = null;

    try {
      this._worker = new Worker(
        new URL('./RenderWorker.js', import.meta.url),
        { type: 'module' }
      );
      this._worker.onmessage = (e) => this._onMessage(e.data);
      this._worker.onerror = (err) => {
        console.warn('Worker error, falling back to main thread:', err);
        this._worker = null;
      };
    } catch (e) {
      console.warn('Worker unavailable, using main thread:', e);
      this._worker = null;
    }
  }

  /** Set fallback pipeline for when workers aren't available. */
  setFallback(pipeline) {
    this._fallbackPipeline = pipeline;
  }

  /** Queue a render. Debounces: if a render is in-flight, queues one more. */
  queueRender() {
    if (!this.state.needsRender || !this.state.sourcePixels) return;

    if (!this._worker) {
      this._renderSync();
      return;
    }

    if (this._pending) {
      this._queued = true;
      return;
    }

    this._send();
  }

  _send() {
    this._pending = true;
    const s = this.state;
    const prev = s.quality === 'preview';
    const sc = prev ? s.previewScale : 1;

    // Serialise stack to plain objects
    const stackData = s.stack.map(n => ({
      type: n.type,
      enabled: n.enabled,
      opacity: n.opacity,
      params: { ...n.params }
    }));

    // Send pixel data as transferable copy
    const pixelsCopy = new Uint8ClampedArray(s.sourcePixels);

    this._worker.postMessage({
      type: 'render',
      sourcePixels: pixelsCopy.buffer,
      sourceW: s.sourceW,
      sourceH: s.sourceH,
      quality: s.quality,
      previewScale: s.previewScale,
      globalSeed: s.globalSeed,
      soloNodeId: s.soloNodeId,
      stack: stackData
    }, [pixelsCopy.buffer]);
  }

  _onMessage(data) {
    if (data.type === 'result') {
      this._pending = false;
      const pixels = new Uint8ClampedArray(data.pixels);
      this.state.lastRenderTime = data.renderTime;
      this.state.needsRender = false;
      this.state.rendering = false;
      this.onResult({ pixels, width: data.width, height: data.height });

      if (this._queued) {
        this._queued = false;
        if (this.state.needsRender) this._send();
      }
    }
  }

  _renderSync() {
    if (!this._fallbackPipeline) return;
    const r = this._fallbackPipeline.render();
    if (r) this.onResult(r);
  }

  destroy() {
    if (this._worker) {
      this._worker.terminate();
      this._worker = null;
    }
  }
}
