export class WorkerAnimationDriver {
  constructor(handler, { tickMs = 16 } = {}) {
    this.handler = handler;
    this.tickMs = tickMs;
    this.running = false;
    this.cancelled = false;
    this.frame = 0;
  }

  async start(frames = 1) {
    this.running = true;
    this.cancelled = false;

    for (let i = 0; i < frames; i++) {
      if (this.cancelled) break;
      this.frame = i;
      this.handler({ type: 'frame', frame: i });
      await new Promise((resolve) => setTimeout(resolve, this.tickMs));
    }

    this.running = false;
    this.handler({ type: 'done', frame: this.frame });
  }

  cancel() {
    this.cancelled = true;
    this.running = false;
    this.handler({ type: 'cancel', frame: this.frame });
  }

  async retry(frames = 1) {
    this.frame = 0;
    return this.start(frames);
  }
}
