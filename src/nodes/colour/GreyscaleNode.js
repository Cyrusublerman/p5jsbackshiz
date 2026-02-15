import { EffectNode } from '../EffectNode.js';

export class GreyscaleNode extends EffectNode {
  constructor() {
    super('greyscale', 'GREYSCALE', {
      wr: { value: 0.299, min: 0, max: 1, step: 0.01, label: 'R WEIGHT' },
      wg: { value: 0.587, min: 0, max: 1, step: 0.01, label: 'G WEIGHT' },
      wb: { value: 0.114, min: 0, max: 1, step: 0.01, label: 'B WEIGHT' }
    });
    // NOT LUT-eligible: greyscale is a cross-channel operation
    // (output depends on all 3 input channels, not just one).
    // Per-channel LUTs cannot express this correctly.
    this.isLUT = false;
  }

  apply(s, d, w, h) {
    const { wr, wg, wb } = this.params;
    for (let i = 0, n = w * h * 4; i < n; i += 4) {
      const l = s[i] * wr + s[i + 1] * wg + s[i + 2] * wb;
      d[i] = d[i + 1] = d[i + 2] = l;
      d[i + 3] = s[i + 3];
    }
  }

  glsl() {
    const { wr, wg, wb } = this.params;
    return {
      fragment: `#version 300 es
        precision highp float;
        in vec2 v_uv;
        out vec4 fragColor;
        uniform sampler2D u_tex;
        uniform vec2 u_resolution;
        uniform float u_wr, u_wg, u_wb;
        void main() {
          vec4 c = texture(u_tex, v_uv);
          float l = dot(c.rgb, vec3(u_wr, u_wg, u_wb));
          fragColor = vec4(l, l, l, c.a);
        }`,
      uniforms: { u_wr: wr, u_wg: wg, u_wb: wb }
    };
  }
}
