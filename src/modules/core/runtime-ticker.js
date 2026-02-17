export class RuntimeTicker {
  constructor({ fps = 60, fixedStep = true } = {}) {
    this.fps = fps;
    this.fixedStep = fixedStep;
    this.stepMs = 1000 / fps;
    this.running = false;
    this.accum = 0;
    this.frame = 0;
    this.lastTime = null;
  }

  start(startTimeMs = 0) {
    this.running = true;
    this.lastTime = startTimeMs;
  }

  pause() { this.running = false; }
  resume(nowMs = this.lastTime ?? 0) { this.running = true; this.lastTime = nowMs; }

  tick(deltaMs, cb) {
    if (!this.running) return 0;
    if (!this.fixedStep) {
      this.frame += 1;
      cb?.({ frame: this.frame, dt: deltaMs / 1000 });
      return 1;
    }

    this.accum += deltaMs;
    let count = 0;
    while (this.accum >= this.stepMs) {
      this.accum -= this.stepMs;
      this.frame += 1;
      cb?.({ frame: this.frame, dt: this.stepMs / 1000 });
      count += 1;
    }
    return count;
  }

  advanceTo(nowMs, cb) {
    if (this.lastTime == null) this.lastTime = nowMs;
    const delta = Math.max(0, nowMs - this.lastTime);
    this.lastTime = nowMs;
    return this.tick(delta, cb);
  }

  reset() {
    this.accum = 0;
    this.frame = 0;
    this.lastTime = null;
  }
}
