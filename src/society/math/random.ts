/**
 * Social Gravity - Seedable Deterministic Pseudo-Random Number Generator (PRNG)
 * Implements Mulberry32 algorithm for ultra-fast, reproducible social simulations.
 */

export class PRNG {
  private state: number;

  constructor(seed: number = 42) {
    this.state = seed >>> 0;
    if (this.state === 0) {
      this.state = 1;
    }
  }

  /**
   * Generates a pseudorandom 32-bit unsigned integer.
   */
  public nextUint32(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }

  /**
   * Generates a floating point number in range [0, 1).
   */
  public nextFloat(): number {
    return this.nextUint32() / 4294967296.0;
  }

  /**
   * Generates an integer in range [min, max] inclusive.
   */
  public nextInt(min: number, max: number): number {
    if (min > max) {
      const temp = min;
      min = max;
      max = temp;
    }
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  /**
   * Random boolean with probability p of being true.
   */
  public nextBoolean(p: number = 0.5): boolean {
    return this.nextFloat() < p;
  }

  /**
   * Returns a random element from an array.
   */
  public choice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from an empty array.');
    }
    const idx = Math.floor(this.nextFloat() * array.length);
    return array[idx];
  }

  /**
   * Selects k unique elements from an array without replacement.
   */
  public sample<T>(array: T[], k: number): T[] {
    if (k > array.length) {
      k = array.length;
    }
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.nextFloat() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy.slice(0, k);
  }

  /**
   * In-place Fisher-Yates shuffle.
   */
  public shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.nextFloat() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }
}

export { PRNG as Mulberry32 };
