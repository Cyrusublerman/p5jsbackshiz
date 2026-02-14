import { EffectNode } from '../EffectNode.js';

export class InvertNode extends EffectNode {
  constructor() {
    super('invert', 'INVERT', {});
    this.isLUT = true;
  }

  apply(s, d, w, h) {
    for (let i = 0, n = w * h * 4; i < n; i += 4) {
      d[i] = 255 - s[i]; d[i + 1] = 255 - s[i + 1]; d[i + 2] = 255 - s[i + 2];
      d[i + 3] = s[i + 3];
    }
  }

  glsl() {
    return {
      fragment: `#version 300 es
        precision highp float;
        in vec2 v_uv;
        out vec4 fragColor;
        uniform sampler2D u_tex;
        uniform vec2 u_resolution;
        void main() {
          vec4 c = texture(u_tex, v_uv);
          fragColor = vec4(1.0 - c.rgb, c.a);
        }`,
      uniforms: {}
    };
  }

  buildLUT(lutR, lutG, lutB) {
    for (let i = 0; i < 256; i++) {
      lutR[i] = 255 - lutR[i];
      lutG[i] = 255 - lutG[i];
      lutB[i] = 255 - lutB[i];
    }
  }
}
