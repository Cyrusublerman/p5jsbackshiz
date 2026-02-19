import test from 'node:test';
import assert from 'node:assert/strict';

import { mapFitMode, createImageAsset, remapImageAsset, canvasToSource } from '../src/modules/core/image-io.js';
import { sampleField } from '../src/modules/field/vector-field.js';
import { buildLuminanceField, buildGradientField, buildVectorFieldFromGradient } from '../src/modules/field/luminance-vector-builder.js';
import { composeForces, gradientForce, tangentForce, originForce, applyDeadZone } from '../src/modules/field/force-composer.js';
import { vectorToRaster } from '../src/modules/bridge/node-adapters.js';
import { quantizeImage, quantizeImageAdvanced } from '../src/modules/color/palette-quantizer.js';
import { applyImageAdjustments } from '../src/modules/color/adjustment-prepass.js';
import { buildStaticLines, applyStaticDisplacement } from '../src/modules/line/static-line-engine.js';
import { initWavefrontState, advanceWavefrontEngine, getDrawableWavefrontLines } from '../src/modules/line/flow-line-engine.js';
import { initSerpentineState, updateSerpentineState, toSerpentineLineSet } from '../src/modules/line/serpentine-line-engine.js';
import { TimelineRecorder } from '../src/modules/export/timeline-recorder.js';
import { collectFramesFromTimeline, encodeAnimation, buildRecordingSummary } from '../src/modules/export/animation-encoder.js';
import { parseUserSketch, runSandboxedCode, compileAndRunSketch } from '../src/modules/lab/code-runner.js';

test('image io map + remap + canvasToSource', () => {
  const fit = mapFitMode(100, 50, 200, 200, 'contain');
  assert.equal(fit.offsetY, 50);
  const src = createImageAsset(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1);
  const remap = remapImageAsset(src, 2, 2, 'stretch');
  assert.equal(remap.image.pixels[0], 255);
  const point = canvasToSource(fit, 100, 100, 100, 50);
  assert.ok(point);
});

test('luma + gradient + vector field build and sample', () => {
  const pixels = new Uint8ClampedArray([
    0, 0, 0, 255,
    255, 255, 255, 255,
    0, 0, 0, 255,
    255, 255, 255, 255
  ]);
  const l = buildLuminanceField(pixels, 2, 2);
  assert.equal(l.length, 4);
  const g = buildGradientField(l, 2, 2);
  const vf = buildVectorFieldFromGradient(g, { scale: 1 });
  assert.equal(vf.vectors.length, 8);
  const s = sampleField(vf, 0.5, 0.5, 'nearest');
  assert.equal(s.length, 2);
});

test('force composer helpers work', () => {
  const sample = { cosA: 1, sinA: 0, tanCos: 0, tanSin: 1, mag: 0.5 };
  assert.equal(gradientForce(sample, 2).fx, 1);
  assert.equal(tangentForce(sample, 2).fy, 1);
  assert.ok(originForce(1, 0, 0, 0, 2, 3).fx > 0);
  assert.deepEqual(applyDeadZone({ fx: 0.001, fy: 0.001 }, 0.01), { fx: 0, fy: 0 });

  const f = { width: 1, height: 1, vectors: new Float32Array([1, 0]) };
  const c = composeForces([{ field: f, weight: 2 }], { normalize: false });
  assert.equal(c.vectors[0], 2);
});

test('vector adapter stroke width and clear background', () => {
  const out = vectorToRaster({
    basePixels: new Uint8ClampedArray(5 * 5 * 4),
    width: 5,
    height: 5,
    lines: [[{ x: 2, y: 0 }, { x: 2, y: 4 }]],
    strokeRGBA: [255, 0, 0, 255],
    strokeWidth: 3,
    clearRGBA: [10, 20, 30, 255]
  });
  assert.equal(out[0], 10);
  const center = (2 * 5 + 2) * 4;
  assert.equal(out[center], 255);
});

test('color adjustment prepass changes channels deterministically', () => {
  const px = new Uint8ClampedArray([100, 120, 140, 255]);
  const out = applyImageAdjustments(px, { gamma: 1.2, contrast: 1.1, saturation: 0.8 });
  assert.equal(out.length, 4);
  assert.equal(out[3], 255);
  assert.notEqual(out[0], px[0]);
});

test('quantizer supports solid/floyd/blue-noise modes', () => {
  const img = new Uint8ClampedArray([
    240, 240, 240, 255,
    20, 20, 20, 255
  ]);
  const palette = [[0, 0, 0], [255, 255, 255]];
  const qSolid = quantizeImage(img, 2, 1, palette, { dither: false });
  assert.equal(qSolid[0], 255);
  const qFs = quantizeImage(img, 2, 1, palette, { dither: true });
  assert.equal(qFs.length, img.length);

  const blueNoise = {
    width: 1,
    height: 1,
    data: new Uint8ClampedArray([0, 0, 0, 255])
  };
  const qBn = quantizeImageAdvanced(img, 2, 1, palette, { ditherMode: 'blue-noise', blueNoise });
  assert.equal(qBn.length, img.length);
});

test('line engines advanced helpers', () => {
  const staticLines = buildStaticLines({ width: 10, height: 10, spacing: 5 });
  assert.ok(staticLines.lines.length > 0);

  const displaced = applyStaticDisplacement({
    width: 10,
    height: 10,
    luminanceAt: () => 0.5,
    lineSpacing: 5,
    sampleStep: 2,
    maxAmplitude: 2
  });
  assert.ok(displaced.lines.length > 0);

  const wf = initWavefrontState({ width: 10, height: 10, padding: 1 });
  advanceWavefrontEngine(wf, { luminanceAt: () => 0.5, baseSpeed: 1, stopSpawnFrame: 2 });
  const wfl = getDrawableWavefrontLines(wf, 1);
  assert.ok(Array.isArray(wfl));

  const serp = initSerpentineState({ width: 20, height: 20, padding: 1 });
  updateSerpentineState(serp, { luminanceAt: () => 0.3, spawnRate: 2, baseSpeed: 1 });
  const set = toSerpentineLineSet(serp);
  assert.equal(set.lines.length, 1);
});

test('timeline recorder + animation encoder contracts', () => {
  const rec = new TimelineRecorder({ fps: 10 });
  const frame = { width: 1, height: 1, pixels: new Uint8ClampedArray([1, 2, 3, 255]) };
  rec.record(0, 0, { frame });
  rec.record(1, 100, { frame });
  const frames = collectFramesFromTimeline(rec);
  assert.equal(frames.length, 2);
  const encoded = encodeAnimation(frames, { format: 'gif', fps: 10 });
  assert.equal(encoded.frameCount, 2);
  assert.equal(buildRecordingSummary(encoded).format, 'gif');
});

test('code runner parse + sandbox execute', async () => {
  const parsed = parseUserSketch('function setup(){const a=1;}\nfunction draw(){return 4;}');
  assert.ok(parsed.draw.includes('return 4'));
  const fn = await runSandboxedCode({ draw: '() => Math.sqrt(16)' });
  assert.equal(fn(), 4);
  await assert.rejects(() => runSandboxedCode({ draw: '() => window.location.href' }), /Sandbox violation/);
  const compiled = await compileAndRunSketch('function draw(){ return 9; }');
  assert.equal(compiled(), 9);
});
