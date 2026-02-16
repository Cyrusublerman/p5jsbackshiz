export class TimelineRecorder {
  constructor({ fps = 60 } = {}) {
    this.fps = fps;
    this.frames = [];
  }

  record(frameIndex, timestamp, payload) {
    this.frames.push({ frameIndex, timestamp, payload });
  }

  summary() {
    if (!this.frames.length) return { frameCount: 0, durationMs: 0, avgDeltaMs: 0 };
    let deltaSum = 0;
    for (let i = 1; i < this.frames.length; i++) deltaSum += this.frames[i].timestamp - this.frames[i - 1].timestamp;
    return {
      frameCount: this.frames.length,
      durationMs: this.frames[this.frames.length - 1].timestamp - this.frames[0].timestamp,
      avgDeltaMs: this.frames.length > 1 ? deltaSum / (this.frames.length - 1) : 0
    };
  }

  isTimingConsistent(toleranceMs = 1.0) {
    const expected = 1000 / this.fps;
    return this.frames.slice(1).every((f, i) => Math.abs((f.timestamp - this.frames[i].timestamp) - expected) <= toleranceMs);
  }
}
