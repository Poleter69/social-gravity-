/**
 * Unit Tests - All 4 Society Archetypes (School, Workplace, City, Online Community)
 */

import { PRNG } from '../../src/society/math/random';
import { DistributionSampler } from '../../src/society/math/distributions';
import { generateSchoolSociety } from '../../src/society/archetypes/school';
import { generateWorkplaceSociety } from '../../src/society/archetypes/workplace';
import { generateCitySociety } from '../../src/society/archetypes/city';
import { generateOnlineCommunitySociety } from '../../src/society/archetypes/onlineCommunity';
import { SocietyArchetype } from '../../src/society/types/community';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testArchetypes() {
  console.log('--- Testing Society Archetypes ---');
  const rng = new PRNG(2025);
  const sampler = new DistributionSampler(rng);

  const testCases: { name: string; archetype: SocietyArchetype; gen: Function }[] = [
    { name: 'School', archetype: 'school', gen: generateSchoolSociety },
    { name: 'Workplace', archetype: 'workplace', gen: generateWorkplaceSociety },
    { name: 'City', archetype: 'city', gen: generateCitySociety },
    { name: 'Online Community', archetype: 'online_community', gen: generateOnlineCommunitySociety },
  ];

  for (const tc of testCases) {
    const pop = 80;
    const res = tc.gen(pop, rng, sampler);

    // 1. Population count check
    assert(res.agents.length === pop, `${tc.name}: Expected ${pop} agents, got ${res.agents.length}`);

    // 2. Trait range check [0, 1]
    for (const agent of res.agents) {
      assert(agent.traits.trust >= 0 && agent.traits.trust <= 1, `${tc.name}: Trust out of bounds`);
      assert(agent.traits.conformity >= 0 && agent.traits.conformity <= 1, `${tc.name}: Conformity out of bounds`);
      assert(agent.traits.influence >= 0 && agent.traits.influence <= 1, `${tc.name}: Influence out of bounds`);
      assert(agent.traits.riskTolerance >= 0 && agent.traits.riskTolerance <= 1, `${tc.name}: Risk tolerance out of bounds`);
      assert(agent.role.length > 0, `${tc.name}: Agent role must not be empty`);
      assert(agent.communityId.length > 0, `${tc.name}: Community ID must be set`);
    }

    // 3. Community membership check
    const commIds = new Set(res.communities.map((c: any) => c.id));
    for (const agent of res.agents) {
      assert(commIds.has(agent.communityId), `${tc.name}: Agent ${agent.id} assigned to nonexistent community`);
    }

    // 4. Edge valid endpoint check
    const agentIdSet = new Set(res.agents.map((a: any) => a.id));
    for (const edge of res.edges) {
      assert(agentIdSet.has(edge.source), `${tc.name}: Edge source ${edge.source} does not exist`);
      assert(agentIdSet.has(edge.target), `${tc.name}: Edge target ${edge.target} does not exist`);
      assert(edge.source !== edge.target, `${tc.name}: Self-loop in edge ${edge.id}`);
    }

    console.log(`  ✓ ${tc.name} archetype validated (${res.agents.length} agents, ${res.edges.length} edges, ${res.communities.length} sub-communities)`);
  }

  console.log('✓ All 4 society archetypes passed validation.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('archetypes.test.ts')) {
  testArchetypes();
}
