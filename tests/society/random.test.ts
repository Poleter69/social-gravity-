/**
 * Unit Tests - PRNG Determinism & Distribution Bounds
 */

import { PRNG } from '../../src/society/math/random';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testPRNG() {
  console.log('--- Testing PRNG (Mulberry32) ---');

  // Test 1: Seed reproducibility
  const rng1 = new PRNG(1337);
  const rng2 = new PRNG(1337);

  const seq1 = [rng1.nextFloat(), rng1.nextFloat(), rng1.nextInt(1, 100)];
  const seq2 = [rng2.nextFloat(), rng2.nextFloat(), rng2.nextInt(1, 100)];

  assert(
    JSON.stringify(seq1) === JSON.stringify(seq2),
    'Identical seeds must produce identical pseudorandom streams'
  );

  // Test 2: Floating bounds [0, 1)
  const rng3 = new PRNG(42);
  for (let i = 0; i < 1000; i++) {
    const val = rng3.nextFloat();
    assert(val >= 0 && val < 1, `nextFloat() out of bounds: ${val}`);
  }

  // Test 3: Integer bounds [min, max]
  for (let i = 0; i < 1000; i++) {
    const intVal = rng3.nextInt(5, 15);
    assert(intVal >= 5 && intVal <= 15, `nextInt() out of bounds: ${intVal}`);
  }

  // Test 4: Sample & Shuffle
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const sampled = rng3.sample(arr, 4);
  assert(sampled.length === 4, 'Sample length must match k');
  assert(new Set(sampled).size === 4, 'Sampled elements must be unique');

  console.log('✓ PRNG tests passed successfully.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('random.test.ts')) {
  testPRNG();
}
