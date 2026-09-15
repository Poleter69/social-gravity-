/**
 * Social Gravity - Statistical & Mathematical Distributions
 * Provides probability distribution samplers for agent traits and network dynamics.
 */

import { PRNG } from './random';

export class DistributionSampler {
  private rng: PRNG;

  constructor(rng: PRNG) {
    this.rng = rng;
  }

  /**
   * Samples standard Gaussian using Box-Muller transform.
   * N(mean, stdDev^2)
   */
  public normal(mean: number = 0, stdDev: number = 1): number {
    let u1 = this.rng.nextFloat();
    let u2 = this.rng.nextFloat();

    // Prevent log(0)
    while (u1 <= 1e-15) {
      u1 = this.rng.nextFloat();
    }

    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  }

  /**
   * Truncated normal distribution strictly clamped within [min, max].
   */
  public truncatedNormal(mean: number, stdDev: number, min: number = 0, max: number = 1): number {
    let attempts = 0;
    while (attempts < 10) {
      const val = this.normal(mean, stdDev);
      if (val >= min && val <= max) {
        return val;
      }
      attempts++;
    }
    // Fallback clamp if sampling outside bounds repeatedly
    const fallback = this.normal(mean, stdDev);
    return Math.max(min, Math.min(max, fallback));
  }

  /**
   * Power-Law / Pareto distribution for heavy-tailed social traits (e.g. Influence).
   * alpha > 1 (e.g., 2.5 for typical social networks).
   * Returns a value normalized to [0, 1].
   */
  public powerLaw(alpha: number = 2.5, minVal: number = 0.05, maxVal: number = 1.0): number {
    // Avoid singularity at alpha = 1
    const safeAlpha = Math.abs(alpha - 1.0) < 1e-4 ? 1.0001 : alpha;
    const u = this.rng.nextFloat();
    // Inverse transform sampling for bounded power-law
    const oneMinusAlpha = 1.0 - safeAlpha;
    const minPow = Math.pow(minVal, oneMinusAlpha);
    const maxPow = Math.pow(maxVal, oneMinusAlpha);
    const sample = Math.pow(minPow + u * (maxPow - minPow), 1.0 / oneMinusAlpha);
    return Math.max(0, Math.min(1, sample));
  }

  /**
   * Beta distribution sampler on interval [0, 1].
   * Uses gamma variates via Marsaglia and Tsang method.
   */
  public beta(alpha: number, beta: number): number {
    const safeAlpha = Math.max(0.01, alpha);
    const safeBeta = Math.max(0.01, beta);
    const x = this.gamma(safeAlpha, 1);
    const y = this.gamma(safeBeta, 1);
    if (x + y === 0) return 0.5;
    return Math.max(0, Math.min(1, x / (x + y)));
  }

  /**
   * Gamma distribution generator (Marsaglia and Tsang, 2000).
   * Shape alpha, scale beta = 1.
   */
  public gamma(shape: number, scale: number = 1): number {
    if (shape < 1) {
      // Weibull / boost for shape < 1
      const u = this.rng.nextFloat();
      return this.gamma(1 + shape, scale) * Math.pow(u, 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let z = this.normal(0, 1);
      let v = 1 + c * z;
      if (v <= 0) continue;

      v = v * v * v;
      const u = this.rng.nextFloat();

      if (u < 1 - 0.0331 * (z * z) * (z * z)) {
        return d * v * scale;
      }

      if (Math.log(u) < 0.5 * z * z + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }

  /**
   * Uniform distribution between min and max.
   */
  public uniform(min: number = 0, max: number = 1): number {
    return min + this.rng.nextFloat() * (max - min);
  }
}
