import { EffectNode } from '../EffectNode.js';

export class LevelsNode extends EffectNode {
  constructor() {
    super('levels', 'LEVELS', {
      blackPoint: { value: 0, min: 0, max: 255, step: 1, label: 'BLACK IN' },
      whitePoint: { value: 255, min: 0, max: 255, step: 1, label: 'WHITE IN' },
      midGamma:   { value: 1, min: 0.1, max: 3, step: 0.01, label: 'GAMMA' },
      outBlack:   { value: 0, min: 0, max: 255, step: 1, label: 'BLACK OUT' },
      outWhite:   { value: 255, min: 0, max: 255, step: 1, label: 'WHITE OUT' }
    });
    this.isLUT = true;
  }

  _buildInternalLUT() {
    const { blackPoint, whitePoint, midGamma, outBlack, outWhite } = this.params;
    const rng = Math.max(whitePoint - blackPoint, 1);
    const oR = outWhite - outBlack;
    const inv = 1 / midGamma;
    const lut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      lut[i] = Math.round(
        outBlack + Math.pow(Math.max(0, Math.min(1, (i - blackPoint) / rng)), inv) * oR
      );
    }
    return lut;
  }

  apply(s, d, w, h) {
    const lut = this._buildInternalLUT();
    for (let i = 0, n = w * h * 4; i < n; i += 4) {
      d[i]     = lut[s[i]];
      d[i + 1] = lut[s[i + 1]];
      d[i + 2] = lut[s[i + 2]];
      d[i + 3] = s[i + 3];
    }
  }

  glsl() {
    const { blackPoint, whitePoint, midGamma, outBlack, outWhite } = this.params;
    return {
      fragment: `#version 300 es
        precision highp float;
        in vec2 v_uv; out vec4 fragColor;
        uniform sampler2D u_tex; uniform vec2 u_resolution;
        uniform float u_bp, u_wp, u_gamma, u_ob, u_ow;
        void main() {
          vec4 c = texture(u_tex, v_uv);
          float rng = max(u_wp - u_bp, 1.0) / 255.0;
          float oR = (u_ow - u_ob) / 255.0;
          float inv = 1.0 / u_gamma;
          vec3 t = clamp((c.rgb - u_bp/255.0) / rng, 0.0, 1.0);
          vec3 out_c = u_ob/255.0 + pow(t, vec3(inv)) * oR;
          fragColor = vec4(out_c, c.a);
        }`,
      uniforms: { u_bp: blackPoint, u_wp: whitePoint, u_gamma: midGamma, u_ob: outBlack, u_ow: outWhite }
    };
  }

  buildLUT(lutR, lutG, lutB) {
    const lut = this._buildInternalLUT();
    for (let i = 0; i < 256; i++) {
      lutR[i] = lut[lutR[i]];
      lutG[i] = lut[lutG[i]];
      lutB[i] = lut[lutB[i]];
    }
  }
}
