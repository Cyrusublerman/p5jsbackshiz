export class SeededRNG {
  constructor(s) {
    this.seed = s >>> 0;
  }

  next() {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  nextRange(a, b) {
    return a + this.next() * (b - a);
  }

  nextInt(a, b) {
    return Math.floor(this.nextRange(a, b));
  }
}

export function hashSeed(g, n, x = 0) {
  let h = g ^ (n * 2654435761) ^ (x * 2246822519);
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}
