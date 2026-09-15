/**
 * Social Gravity V2 - Edge Dynamics Unit Tests
 *
 * Validates mathematical models for dyadic tie reinforcement, exponential decay,
 * and state threshold transitions.
 */

import { EdgeDynamicsModel, DEFAULT_DYNAMICS_CONFIG } from '../../src/graph/engine/edgeDynamics';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testEdgeDynamics() {
  console.log('--- Testing Relationship Weight Dynamics & Decay ---');

  const model = new EdgeDynamicsModel({
    strengtheningRate: 0.2,
    decayRate: 0.1,
    activeThreshold: 0.5,
    weakThreshold: 0.25,
    dormantThreshold: 0.08,
    removalThreshold: 0.02,
    dormantTicksBeforePruning: 5,
  });

  // Test 1: Asymptotic Strengthening
  // w0 = 0.30 -> w1 = 0.30 + 0.2 * (1 - 0.30) = 0.30 + 0.14 = 0.44
  const w1 = model.calculateStrengthenedWeight(0.3);
  assert(Math.abs(w1 - 0.44) < 0.0001, `Expected w1 ~ 0.44, got ${w1}`);

  // w2 = 0.44 + 0.2 * (1 - 0.44) = 0.44 + 0.112 = 0.552
  const w2 = model.calculateStrengthenedWeight(w1);
  assert(Math.abs(w2 - 0.552) < 0.0001, `Expected w2 ~ 0.552, got ${w2}`);

  // Ceiling clamp at 1.0
  const maxW = model.calculateStrengthenedWeight(0.98);
  assert(maxW <= 1.0, `Weight must not exceed 1.0: ${maxW}`);

  // Test 2: Exponential Temporal Decay
  // w0 = 0.552 -> w1 = 0.552 * 0.9 = 0.4968
  const decayedW1 = model.calculateDecayedWeight(0.552);
  assert(Math.abs(decayedW1 - 0.4968) < 0.0001, `Expected decayedW1 ~ 0.4968, got ${decayedW1}`);

  // Weight below removal threshold drops to 0.0
  const zeroed = model.calculateDecayedWeight(0.015);
  assert(zeroed === 0.0, `Weight below removal threshold must drop to 0.0, got ${zeroed}`);

  // Test 3: Lifecycle State Transitions
  // active -> weak -> dormant -> removed
  assert(model.deriveStatus(0.8) === 'active', 'Weight 0.8 must be active');
  assert(model.deriveStatus(0.5) === 'active', 'Weight 0.5 must be active');
  assert(model.deriveStatus(0.4) === 'weak', 'Weight 0.4 must be weak');
  assert(model.deriveStatus(0.25) === 'weak', 'Weight 0.25 must be weak');
  assert(model.deriveStatus(0.15) === 'dormant', 'Weight 0.15 must be dormant');
  assert(model.deriveStatus(0.01) === 'removed', 'Weight 0.01 must be removed');

  // Consecutive dormant ticks trigger pruning
  assert(
    model.deriveStatus(0.12, 5) === 'removed',
    'Edge dormant for >= dormantTicksBeforePruning must transition to removed'
  );

  console.log('✓ Edge dynamics and decay lifecycle validated.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('edgeDynamics.test.ts')) {
  testEdgeDynamics();
}
