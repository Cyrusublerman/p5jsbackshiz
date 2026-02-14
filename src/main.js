import { AppState } from './core/AppState.js';
import { Pipeline } from './core/Pipeline.js';
import { WorkerBridge } from './core/WorkerBridge.js';
import { UI } from './ui/UI.js';
import { ViewportRenderer } from './render/ViewportRenderer.js';

const state = new AppState();
const pipe = new Pipeline(state);
let ui, viewport;

function handleResult(r) {
  viewport.setResult(r);
  document.getElementById('h-ren').textContent = state.lastRenderTime.toFixed(0) + 'ms';
  document.getElementById('t-info').textContent = r.width + '\u00d7' + r.height;
}

const bridge = new WorkerBridge(state, handleResult);
bridge.setFallback(pipe);

const sketch = (p) => {
  p.setup = function () {
    const vp = document.getElementById('vp');
    p.createCanvas(vp.clientWidth, vp.clientHeight).parent('vp');
    p.pixelDensity(1);
    p.noLoop();
    p.background(26);

    viewport = new ViewportRenderer(p, state);
    ui = new UI(state, () => {
      bridge.queueRender();
      p.redraw();
    });

    setInterval(() => {
      if (viewport.resultBuffer) p.redraw();
    }, 50);
  };

  p.windowResized = function () {
    const vp = document.getElementById('vp');
    p.resizeCanvas(vp.clientWidth, vp.clientHeight);
  };

  p.draw = function () {
    if (viewport) viewport.draw();
  };
};

new p5(sketch);
