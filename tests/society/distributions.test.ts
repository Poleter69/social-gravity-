/**
 * Unit Tests - Mathematical Distribution Samplers
 */

import { PRNG } from '../../src/society/math/random';
import { DistributionSampler } from '../../src/society/math/distributions';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testDistributions() {
  console.log('--- Testing Statistical Distribution Samplers ---');
  const rng = new PRNG(999);
  const sampler = new DistributionSampler(rng);

  // Test 1: Truncated Normal strictly clamped within [0, 1]
  for (let i = 0; i < 500; i++) {
    const val = sampler.truncatedNormal(0.5, 0.25, 0, 1);
    assert(val >= 0 && val <= 1, `Truncated normal value out of bounds: ${val}`);
  }

  // Test 2: Power Law skew & bounds
  let powerSum = 0;
  for (let i = 0; i < 500; i++) {
    const val = sampler.powerLaw(2.5, 0.05, 1.0);
    assert(val >= 0 && val <= 1, `Power law value out of bounds: ${val}`);
    powerSum += val;
  }
  const powerMean = powerSum / 500;
  // In a power law with alpha=2.5 and min=0.05, the mean should be heavily skewed towards the lower end (< 0.35)
  assert(powerMean < 0.35, `Power law should be heavily skewed right, got mean ${powerMean}`);

  // Test 3: Beta distribution bounds
  for (let i = 0; i < 300; i++) {
    const b = sampler.beta(2, 5);
    assert(b >= 0 && b <= 1, `Beta distribution value out of bounds: ${b}`);
  }

  console.log('✓ Distribution sampler tests passed successfully.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('distributions.test.ts')) {
  testDistributions();
}
