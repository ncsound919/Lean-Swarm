export class SeededRNG {
  private seed: number;

  constructor(seed: number = 42) {
    this.seed = Math.abs(seed) % 2147483647;
    if (this.seed === 0) this.seed = 42;
  }

  // Mulberry32 deterministic PRNG
  public next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const result = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return result;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  public choice<T>(array: T[]): T {
    if (array.length === 0) throw new Error('Cannot select choice from empty array');
    return array[this.nextInt(0, array.length - 1)];
  }

  public getSeed(): number {
    return this.seed;
  }
}

export const globalRNG = new SeededRNG(1337);
