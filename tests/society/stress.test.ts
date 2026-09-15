/**
 * Social Gravity - Society Generator Stress Test Suite
 * Evaluates performance, memory scaling, and structural invariants at extreme boundaries.
 */

import { societyGenerator } from '../../src/society/generators/societyGenerator';
import { SocietyValidator } from '../../src/society/validation/societyValidator';

console.log('--- Stress Testing Society Generator ---');

// Test Case 1: Minimum Population (N = 10)
console.time('N=10 Stress Test');
const socMin = societyGenerator.generate({
  name: 'Minimal Population Micro-Test',
  archetype: 'school',
  populationSize: 10,
  seed: 101,
});
console.timeEnd('N=10 Stress Test');
const valMin = SocietyValidator.validate(socMin);
console.log(`N=10: Nodes=${socMin.agents.length}, Edges=${socMin.edges.length}, Valid=${valMin.isValid}`);

// Test Case 2: Target Research Population (N = 1,000)
console.time('N=1,000 Stress Test');
const soc1000 = societyGenerator.generate({
  name: 'Flagship 1K Society Test',
  archetype: 'city',
  populationSize: 1000,
  influencerRatio: 0.05,
  seed: 42,
});
console.timeEnd('N=1,000 Stress Test');
const val1000 = SocietyValidator.validate(soc1000);
console.log(`N=1,000: Nodes=${soc1000.agents.length}, Edges=${soc1000.edges.length}, Density=${soc1000.metrics.density}, Valid=${val1000.isValid}`);

// Test Case 3: High Scale (N = 5,000)
console.time('N=5,000 Stress Test');
const soc5000 = societyGenerator.generate({
  name: '5K High-Scale Stress Test',
  archetype: 'online_community',
  populationSize: 5000,
  influencerRatio: 0.02,
  seed: 999,
});
console.timeEnd('N=5,000 Stress Test');
const val5000 = SocietyValidator.validate(soc5000);
console.log(`N=5,000: Nodes=${soc5000.agents.length}, Edges=${soc5000.edges.length}, Bridges=${soc5000.summary.bridgeNodeCount}, Valid=${val5000.isValid}`);

console.log('✓ All stress tests completed.');
