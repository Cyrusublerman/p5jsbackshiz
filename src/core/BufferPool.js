/**
 * BufferPool — recycles Uint8ClampedArray buffers to avoid GC churn.
 * Keyed by byte length for O(1) lookup.
 */
export class BufferPool {
  constructor() {
    this._pool = new Map(); // size → [buf, buf, ...]
  }

  acquire(size) {
    const list = this._pool.get(size);
    if (list && list.length > 0) {
      const buf = list.pop();
      buf.fill(0);
      return buf;
    }
    return new Uint8ClampedArray(size);
  }

  release(buf) {
    if (!buf || !buf.length) return;
    const size = buf.length;
    let list = this._pool.get(size);
    if (!list) { list = []; this._pool.set(size, list); }
    if (list.length < 8) list.push(buf); // cap per-size to avoid unbounded growth
  }

  clear() {
    this._pool.clear();
  }
}

export const pool = new BufferPool();
