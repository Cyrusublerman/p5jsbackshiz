export class Recipe {
  static exp(state, registry) {
    return JSON.stringify({
      version: 1,
      globalSeed: state.globalSeed,
      src: { w: state.sourceW, h: state.sourceH },
      ps: state.previewScale,
      nodes: state.stack.map(n => n.toJSON())
    }, null, 2);
  }

  /**
   * Morph between two recipe JSONs by interpolating all numeric params.
   * @param {string} jsonA - First recipe
   * @param {string} jsonB - Second recipe
   * @param {number} t - Blend factor 0=A, 1=B
   * @returns {string} Interpolated recipe JSON
   */
  static morph(jsonA, jsonB, t) {
    const a = JSON.parse(jsonA), b = JSON.parse(jsonB);
    const out = JSON.parse(jsonA);
    out.globalSeed = Math.round(a.globalSeed * (1 - t) + (b.globalSeed || a.globalSeed) * t);
    const maxNodes = Math.min(a.nodes?.length || 0, b.nodes?.length || 0);
    for (let i = 0; i < maxNodes; i++) {
      const an = a.nodes[i], bn = b.nodes[i];
      if (an.type !== bn.type) continue;
      out.nodes[i].opacity = an.opacity * (1 - t) + bn.opacity * t;
      for (const k in an.params) {
        if (typeof an.params[k] === 'number' && typeof bn.params[k] === 'number') {
          out.nodes[i].params[k] = an.params[k] * (1 - t) + bn.params[k] * t;
        }
      }
    }
    return JSON.stringify(out);
  }

  static imp(state, json, registry) {
    const d = JSON.parse(json);
    state.globalSeed = d.globalSeed ?? 42;
    state.previewScale = d.ps ?? d.previewScale ?? 0.5;
    state.stack = [];

    const allEntries = Object.values(registry).flat();
    for (const nd of (d.nodes || [])) {
      const entry = allEntries.find(e => e.type === nd.type);
      if (entry) {
        const n = entry.factory();
        n.fromJSON(nd);
        state.stack.push(n);
      }
    }

    state.soloNodeId = null;
    state.needsRender = true;
  }
}
