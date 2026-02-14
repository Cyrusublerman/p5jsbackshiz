import { GreyscaleNode } from './colour/GreyscaleNode.js';
import { LevelsNode } from './colour/LevelsNode.js';
import { ContrastNode } from './colour/ContrastNode.js';
import { BoxBlurNode } from './blur/BoxBlurNode.js';
import { GaussianBlurNode } from './blur/GaussianBlurNode.js';
import { AffineTransformNode } from './transform/AffineTransformNode.js';
import { FlowFieldNode } from './warp/FlowFieldNode.js';
import { BandShiftNode } from './warp/BandShiftNode.js';
import { RadialRippleNode } from './refraction/RadialRippleNode.js';
import { LensBubblesNode } from './refraction/LensBubblesNode.js';
import { IterativeRewarpNode } from './accumulation/IterativeRewarpNode.js';

export const REGISTRY = {
  'COLOUR / TONE': [
    { type: 'greyscale', label: 'GREYSCALE',     factory: () => new GreyscaleNode() },
    { type: 'levels',    label: 'LEVELS',         factory: () => new LevelsNode() },
    { type: 'contrast',  label: 'LIFT/GAM/GAIN',  factory: () => new ContrastNode() }
  ],
  'BLUR': [
    { type: 'boxblur',   label: 'BOX BLUR',   factory: () => new BoxBlurNode() },
    { type: 'gaussblur', label: 'GAUSS BLUR',  factory: () => new GaussianBlurNode() }
  ],
  'TRANSFORM': [
    { type: 'affine', label: 'AFFINE XFORM', factory: () => new AffineTransformNode() }
  ],
  'WARP': [
    { type: 'flowfield', label: 'FLOW FIELD', factory: () => new FlowFieldNode() },
    { type: 'bandshift', label: 'BAND SHIFT', factory: () => new BandShiftNode() }
  ],
  'REFRACTION': [
    { type: 'ripple',      label: 'RADIAL RIPPLE', factory: () => new RadialRippleNode() },
    { type: 'lensbubbles', label: 'LENS BUBBLES',  factory: () => new LensBubblesNode() }
  ],
  'ACCUMULATION': [
    { type: 'iterrewarp', label: 'ITER REWARP', factory: () => new IterativeRewarpNode() }
  ]
};

export const PRESETS = {
  SCAN: {
    version: 1, globalSeed: 42, previewScale: 0.5,
    nodes: [
      { type: 'greyscale', enabled: true, opacity: 1, params: { wr: 0.33, wg: 0.33, wb: 0.33 } },
      { type: 'levels', enabled: true, opacity: 1, params: { blackPoint: 20, whitePoint: 230, midGamma: 1.2, outBlack: 0, outWhite: 255 } },
      { type: 'bandshift', enabled: true, opacity: 1, params: { axis: 'horizontal', bandSize: 15, intensity: 60, offsetType: 'noise', phase: 0, freq: 1, noiseScale: 3 } },
      { type: 'bandshift', enabled: true, opacity: 0.6, params: { axis: 'vertical', bandSize: 40, intensity: 25, offsetType: 'stepped', phase: 0, freq: 1, noiseScale: 2 } },
      { type: 'gaussblur', enabled: true, opacity: 1, params: { sigma: 0.8, passes: 1 } }
    ]
  },
  LIQUID: {
    version: 1, globalSeed: 77, previewScale: 0.5,
    nodes: [
      { type: 'greyscale', enabled: true, opacity: 1, params: { wr: 0.299, wg: 0.587, wb: 0.114 } },
      { type: 'contrast', enabled: true, opacity: 1, params: { lift: 0, gamma: 0.9, gain: 1.1, contrast: 0.15, pivot: 0.5 } },
      { type: 'flowfield', enabled: true, opacity: 1, params: { noiseScale: 4, octaves: 4, lacunarity: 2, gain: 0.5, strength: 80, curl: 0.3, advectSteps: 4 } },
      { type: 'gaussblur', enabled: true, opacity: 1, params: { sigma: 1.5, passes: 1 } },
      { type: 'levels', enabled: true, opacity: 1, params: { blackPoint: 30, whitePoint: 220, midGamma: 1, outBlack: 5, outWhite: 250 } }
    ]
  },
  DROWNED: {
    version: 1, globalSeed: 123, previewScale: 0.5,
    nodes: [
      { type: 'greyscale', enabled: true, opacity: 1, params: { wr: 0.2, wg: 0.7, wb: 0.1 } },
      { type: 'ripple', enabled: true, opacity: 1, params: { centreX: 0.5, centreY: 0.5, amplitude: 20, frequency: 15, phase: 0, falloff: 1.5 } },
      { type: 'lensbubbles', enabled: true, opacity: 1, params: { count: 8, minRadius: 0.04, maxRadius: 0.15, magnification: 2, edgeSoft: 0.3 } },
      { type: 'iterrewarp', enabled: true, opacity: 1, params: { samples: 8, jitterX: 8, jitterY: 4, opacityMode: 'decay', decay: 0.75, rotJitter: 1.5, scaleJitter: 0.02 } },
      { type: 'gaussblur', enabled: true, opacity: 0.7, params: { sigma: 1.2, passes: 1 } },
      { type: 'levels', enabled: true, opacity: 1, params: { blackPoint: 15, whitePoint: 240, midGamma: 1.1, outBlack: 0, outWhite: 245 } }
    ]
  }
};
