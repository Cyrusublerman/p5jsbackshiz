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

    // Cache for dirty-node optimisation
    this._cache = null;
    this._cacheValid = false;

    // LUT fusion protocol — override in subclasses
    this.isLUT = false;
  }

  /** Override in subclasses to apply the effect. */
  apply(src, dst, w, h, ctx) {
    dst.set(src);
  }

  /**
   * LUT fusion: compose this node's transform into per-channel LUTs.
   * Override in LUT-eligible nodes. Called with identity LUTs on first
   * node in chain; each subsequent node composes its transform.
   */
  buildLUT(lutR, lutG, lutB) {
    // no-op default
  }

  /** Invalidate this node's cache and all downstream caches. */
  invalidate(stack) {
    this._cacheValid = false;
    this._cache = null;
    if (stack) {
      const idx = stack.indexOf(this);
      if (idx >= 0) {
        for (let i = idx + 1; i < stack.length; i++) {
          stack[i]._cacheValid = false;
          stack[i]._cache = null;
        }
      }
    }
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
