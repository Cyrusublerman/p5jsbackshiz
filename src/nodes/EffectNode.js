export class EffectNode {
  static _id = 0;

  constructor(type, name, paramDefs) {
    this.id = EffectNode._id++;
    this.type = type;
    this.name = name;
    this.enabled = true;
    this.solo = false;
    this.opacity = 1;
    this.expanded = true;
    this.params = {};
    this.paramDefs = paramDefs;
    for (const [k, v] of Object.entries(paramDefs)) {
      this.params[k] = v.value;
    }
  }

  apply(src, dst, w, h, ctx) {
    dst.set(src);
  }

  toJSON() {
    return {
      type: this.type,
      enabled: this.enabled,
      opacity: this.opacity,
      params: { ...this.params }
    };
  }

  fromJSON(data) {
    this.enabled = data.enabled ?? true;
    this.opacity = data.opacity ?? 1;
    for (const k in data.params) {
      if (k in this.params) this.params[k] = data.params[k];
    }
  }
}
