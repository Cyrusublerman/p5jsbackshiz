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
