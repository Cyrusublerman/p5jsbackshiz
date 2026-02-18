import test from 'node:test';
import assert from 'node:assert/strict';

import { mapFitMode, createImageAsset, remapImageAsset } from '../src/modules/core/image-io.js';
import { coerceParams, serializeParams, deserializeParams, validateSchema } from '../src/modules/core/param-schema.js';
import { RuntimeTicker } from '../src/modules/core/runtime-ticker.js';

import { buildBaseGradient } from '../src/modules/field/base-gradient.js';
import { buildNoiseFlow } from '../src/modules/field/noise-flow.js';
import { buildOriginForce } from '../src/modules/field/origin-force.js';
import { composeForces } from '../src/modules/field/force-composer.js';
import { createVectorField, normalizeField, sampleField } from '../src/modules/field/vector-field.js';
import { buildDisplacement, stabilizeDisplacement, applyDisplacementToImage } from '../src/modules/field/displacement-matrix.js';

import { pathLength } from '../src/modules/line/line-engine-common.js';
import { buildFlowLines } from '../src/modules/line/flow-line-engine.js';
import { buildStaticLines } from '../src/modules/line/static-line-engine.js';
import { buildSerpentineLines } from '../src/modules/line/serpentine-line-engine.js';

import { vectorToRaster } from '../src/modules/bridge/node-adapters.js';

import { rgbToLab, deltaE76, deltaE00 } from '../src/modules/color/color-science.js';
import { quantizePixel, quantizeImage } from '../src/modules/color/palette-quantizer.js';

import { paintStamp } from '../src/modules/painter/brush-engine.js';
import { LayerTracker } from '../src/modules/painter/layer-tracker.js';

import { GLKernelRuntime } from '../src/modules/shader/gl-kernel-runtime.js';
import { WorkerAnimationDriver } from '../src/modules/shader/worker-animation-driver.js';

import { exportRaster, rasterChecksum } from '../src/modules/export/raster-exporter.js';
import { exportLineSetToSVG, validateSVG } from '../src/modules/export/svg-exporter.js';
import { TimelineRecorder } from '../src/modules/export/timeline-recorder.js';

import { buildToolPanelState, mapLegacyControlId } from '../src/modules/ui/tool-panels.js';
import { buildVectorOverlay, shouldRenderOverlayForExport } from '../src/modules/ui/debug-overlays.js';

import { runSandboxedCode } from '../src/modules/lab/code-runner.js';
import { Pipeline } from '../src/core/Pipeline.js';
import { LuminanceFlowNode } from '../src/nodes/line/LuminanceFlowNode.js';
import { SerpentineNode } from '../src/nodes/line/SerpentineNode.js';
import { StaticHalftoneNode } from '../src/nodes/line/StaticHalftoneNode.js';
import { ModuleFlowLinesNode } from '../src/nodes/line/ModuleFlowLinesNode.js';
import { ModuleSerpentineNode } from '../src/nodes/line/ModuleSerpentineNode.js';
import { ModuleStaticLinesNode } from '../src/nodes/line/ModuleStaticLinesNode.js';
import { REGISTRY } from '../src/nodes/registry.js';

test('core image io fit/remap deterministic', () => {
  const map = mapFitMode(100, 50, 200, 200, 'contain');
  assert.equal(map.offsetY, 50);
  const src = createImageAsset(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1);
  const remap = remapImageAsset(src, 2, 2, 'stretch');
  assert.equal(remap.image.pixels[0], 255);
});

test('param schema aliasing + round trip', () => {
  const schema = { version: 1, fields: { amount: { type: 'range', min: 0, max: 10, default: 1 } }, aliases: { oldAmount: 'amount' } };
  validateSchema(schema);
  const p = coerceParams(schema, { oldAmount: 20 });
  assert.equal(p.amount, 10);
  assert.deepEqual(deserializeParams(schema, serializeParams(schema, p)), p);
});

test('runtime ticker fixed and variable modes', () => {
  const fixed = new RuntimeTicker({ fps: 10, fixedStep: true });
  fixed.start(0);
  let count = 0;
  fixed.advanceTo(250, () => count++);
  assert.equal(count, 2);

  const varTick = new RuntimeTicker({ fixedStep: false });
  varTick.start();
  assert.equal(varTick.tick(16), 1);
});

test('field stack composition and sampling', () => {
  const px = new Uint8ClampedArray([
    0, 0, 0, 255,
    255, 255, 255, 255,
    0, 0, 0, 255,
    255, 255, 255, 255
  ]);
  const grad = buildBaseGradient(px, 2, 2, true);
  const noise = buildNoiseFlow(2, 2, { seed: 5 });
  const origin = buildOriginForce(2, 2);
  const composed = composeForces([{ field: grad, weight: 0.5 }, { field: noise, weight: 0.3 }, { field: origin, weight: 0.2 }], { normalize: true });
  const field = normalizeField(createVectorField(2, 2, composed.vectors));
  const s = sampleField(field, 1, 1, 'nearest');
  assert.ok(Math.hypot(s[0], s[1]) <= 1.001);

  const d0 = buildDisplacement(field, 1);
  const d1 = buildDisplacement(field, 2);
  const stable = stabilizeDisplacement(d0, d1, 0.5);
  assert.equal(stable.offsets.length, d0.offsets.length);

  const img = createImageAsset(new Uint8ClampedArray(2 * 2 * 4), 2, 2);
  const warped = applyDisplacementToImage(img, d0);
  assert.equal(warped.pixels.length, img.pixels.length);
});

test('line engines deterministic and bounded', () => {
  const staticSet = buildStaticLines({ width: 32, height: 32, spacing: 8, zigzag: true });
  assert.ok(staticSet.bounds.maxX <= 31);

  const serpA = buildSerpentineLines({ width: 16, height: 16, seed: 42, jitter: 0.4 });
  const serpB = buildSerpentineLines({ width: 16, height: 16, seed: 42, jitter: 0.4 });
  assert.equal(pathLength(serpA.lines[0]), pathLength(serpB.lines[0]));

  const flow = buildFlowLines({
    field: createVectorField(2, 2, new Float32Array([1, 0, 1, 0, 1, 0, 1, 0])),
    seeds: [{ x: 0, y: 0 }],
    iterations: 4
  });
  assert.ok(flow.lines[0].length >= 2);
});

test('bridge adapter rasterizes vector lines', () => {
  const out = vectorToRaster({
    basePixels: new Uint8ClampedArray(3 * 3 * 4),
    width: 3,
    height: 3,
    lines: [[{ x: 0, y: 0 }, { x: 2, y: 2 }]],
    strokeRGBA: [255, 0, 0, 255]
  });
  assert.equal(out[0], 255);
  assert.equal(out[(1 * 3 + 1) * 4], 255);
});

test('color science and quantization', () => {
  const white = rgbToLab(255, 255, 255);
  const black = rgbToLab(0, 0, 0);
  assert.ok(deltaE76(white, white) < 1e-9);
  assert.ok(deltaE00(white, black) > 50);
  assert.deepEqual(quantizePixel([250, 250, 250], [[0, 0, 0], [255, 255, 255]]), [255, 255, 255]);

  const img = new Uint8ClampedArray([
    250, 250, 250, 255,
    20, 20, 20, 255
  ]);
  const q = quantizeImage(img, 2, 1, [[0, 0, 0], [255, 255, 255]], { dither: true });
  assert.equal(q[0], 255);
  assert.equal(q[4], 0);
});

test('painter + layer tracking invariants', () => {
  const base = new Uint8ClampedArray(4 * 4 * 4);
  const painted = paintStamp(base, 4, 4, 1, 1, [255, 0, 0, 255], 1, 1);
  const layers = new LayerTracker();
  layers.push('stroke', painted);
  const stats = layers.stats();
  assert.equal(stats.count, 1);
  assert.ok(stats.totalCoverage > 0);
  const flat = layers.flatten();
  assert.equal(flat.length, painted.length);
});

test('shader runtime and worker animation driver', async () => {
  const gl = new GLKernelRuntime();
  const program = gl.compileProgram('uniform float uTime; void main(){}', 'void main(){}');
  gl.setUniform(program, 'uTime', 1.5);
  assert.equal(program.uniforms.get('uTime').value, 1.5);
  assert.throws(() => gl.compileProgram('', ''), /compile\/link failed/);

  const events = [];
  const driver = new WorkerAnimationDriver((e) => events.push(e.type), { tickMs: 1 });
  await driver.start(2);
  driver.cancel();
  await driver.retry(1);
  assert.ok(events.includes('done'));
  assert.ok(events.includes('cancel'));
});

test('export modules produce deterministic outputs', () => {
  const rasterA = exportRaster({ width: 1, height: 1, pixels: new Uint8ClampedArray([10, 20, 30, 255]) });
  const rasterB = exportRaster({ width: 1, height: 1, pixels: new Uint8ClampedArray([10, 20, 30, 255]) });
  assert.equal(rasterChecksum(rasterA), rasterChecksum(rasterB));

  const svg = exportLineSetToSVG({ lines: [[{ x: 0, y: 0 }, { x: 1, y: 1 }]] }, 10, 10);
  assert.equal(validateSVG(svg), true);

  const rec = new TimelineRecorder({ fps: 60 });
  rec.record(0, 0, {});
  rec.record(1, 1000 / 60, {});
  rec.record(2, 2000 / 60, {});
  assert.equal(rec.summary().frameCount, 3);
  assert.equal(rec.isTimingConsistent(0.01), true);
});

test('ui helpers and overlay isolation', () => {
  const schema = {
    version: 1,
    fields: { amount: { type: 'range', min: 0, max: 1, default: 0.5 } }
  };
  const state = buildToolPanelState(schema, { 'ctrl-amount': 0.7 }, { 'ctrl-amount': 'amount' });
  assert.equal(state.values.amount, 0.7);
  assert.equal(mapLegacyControlId('ctrl-amount', { 'ctrl-amount': 'amount' }), 'amount');

  const overlay = buildVectorOverlay(createVectorField(2, 2, new Float32Array([1, 0, 0, 1, -1, 0, 0, -1])), 1);
  assert.equal(overlay.length, 4);
  assert.equal(shouldRenderOverlayForExport(true), false);
});

test('lab code runner sandbox boundaries', async () => {
  const fn = await runSandboxedCode({ draw: '() => Math.sqrt(9)' });
  assert.equal(fn(), 3);
  await assert.rejects(() => runSandboxedCode({ draw: '() => window.location.href' }), /Sandbox violation/);
});


test('pipeline uses applyVector in blended path', () => {
  const sourcePixels = new Uint8ClampedArray([255, 255, 255, 255]);
  const vectorOnlyNode = {
    id: 1,
    enabled: true,
    opacity: 0.5,
    modulation: {},
    mask: { enabled: false, source: 'none', data: null },
    _cacheValid: false,
    _cache: null,
    buildMask: () => {},
    apply: () => { throw new Error('apply should not be used for vector-only node'); },
    applyVector: () => ({ lines: [[{ x: 0, y: 0 }]] })
  };

  const state = {
    sourcePixels,
    sourceW: 1,
    sourceH: 1,
    rendering: false,
    quality: 'final',
    previewScale: 1,
    soloNodeId: null,
    stack: [vectorOnlyNode],
    modulationMaps: {},
    globalSeed: 1,
    renderProgress: 0,
    lastRenderTime: 0,
    needsRender: true
  };

  const pipeline = new Pipeline(state);
  const out = pipeline.render();
  assert.ok(out);
  assert.ok(out.pixels[0] < 255);
  pipeline.releaseResult(out);
});


test('existing line nodes preserve legacy EffectNode shape', () => {
  const n1 = new LuminanceFlowNode();
  const n2 = new SerpentineNode();
  const n3 = new StaticHalftoneNode();

  assert.equal(typeof n1.apply, 'function');
  assert.equal(typeof n2.apply, 'function');
  assert.equal(typeof n3.apply, 'function');
  assert.ok(n1.paramDefs.spacing);
  assert.ok(n2.paramDefs.spacing);
  assert.ok(n3.paramDefs.spacing);
});

test('new module-backed line nodes match EffectNode format', () => {
  const n1 = new ModuleFlowLinesNode();
  const n2 = new ModuleSerpentineNode();
  const n3 = new ModuleStaticLinesNode();

  assert.equal(typeof n1.apply, 'function');
  assert.equal(typeof n2.apply, 'function');
  assert.equal(typeof n3.apply, 'function');
  assert.ok(n1.paramDefs.spacing);
  assert.ok(n2.paramDefs.spacing);
  assert.ok(n3.paramDefs.spacing);
});

test('new module-backed nodes are grouped and discoverable in registry dropdown source', () => {
  const group = REGISTRY['LINE RENDER (MODULE)'];
  assert.ok(Array.isArray(group));
  assert.equal(group.length, 3);
  assert.equal(group[0].type, 'moduleflowlines');
});


test('add menu css includes max-height scrolling', async () => {
  const fs = await import('node:fs/promises');
  const css = await fs.readFile(new URL('../src/style.css', import.meta.url), 'utf8');
  assert.ok(css.includes('max-height: min(70vh, 520px);'));
  assert.ok(css.includes('overflow-y: auto;'));
});
