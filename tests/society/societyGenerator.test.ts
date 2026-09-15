/**
 * Unit Tests - End-to-End Society Generator & Serialization
 */

import { SocietyGenerator } from '../../src/society/generators/societyGenerator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testSocietyGenerator() {
  console.log('--- Testing Society Generator (End-to-End) ---');
  const generator = new SocietyGenerator();

  // Test 1: Full generation with metrics
  const society1 = generator.generate({
    name: 'Metropolis Research Simulation',
    archetype: 'city',
    populationSize: 120,
    seed: 42,
  });

  assert(society1.agents.length === 120, 'Expected exactly 120 agents');
  assert(society1.metrics.totalNodes === 120, 'Metrics node count must match');
  assert(society1.metrics.totalEdges > 0, 'Must have active edges');
  assert(society1.metrics.averageDegree > 0, 'Average degree must be positive');
  assert(society1.metrics.globalClusteringCoefficient >= 0, 'Clustering coefficient must be >= 0');

  // Test 2: Seed reproducibility
  const society2 = generator.generate({
    name: 'Metropolis Research Simulation',
    archetype: 'city',
    populationSize: 120,
    seed: 42,
  });

  assert(society1.agents.length === society2.agents.length, 'Reproducibility failed: agent count mismatch');
  assert(society1.edges.length === society2.edges.length, 'Reproducibility failed: edge count mismatch');
  assert(society1.agents[0].name === society2.agents[0].name, 'Reproducibility failed: agent names mismatch');
  assert(society1.metrics.density === society2.metrics.density, 'Reproducibility failed: density mismatch');

  // Test 3: Trait override
  const highTrustSociety = generator.generate({
    name: 'High Trust School',
    archetype: 'school',
    populationSize: 50,
    seed: 777,
    baselineTrust: 0.95,
  });

  for (const agent of highTrustSociety.agents) {
    assert(agent.traits.trust === 0.95, `Expected overridden trust 0.95, got ${agent.traits.trust}`);
  }

  // Test 4: JSON Export and round-trip parse
  const jsonStr = generator.exportJSON(society1);
  const parsed = JSON.parse(jsonStr);
  assert(parsed.id === society1.id, 'JSON export ID mismatch');
  assert(parsed.agents.length === 120, 'JSON export agents count mismatch');
  assert(parsed.communities.length > 0, 'JSON export communities missing');

  console.log('✓ End-to-End Society Generator tests passed successfully.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('societyGenerator.test.ts')) {
  testSocietyGenerator();
}
