/**
 * Social Gravity - Narrative Evolution Engine Tests (Milestone M11)
 * 
 * Verifies claim lineage trees, semantic drift metrics, cross-community
 * mutation triggers, contradiction emergence, and meta-narrative convergence.
 */

import { NarrativeEvolutionEngine } from '../../src/narrative/narrativeEngine';
import { societyGenerator } from '../../src/society/generators/societyGenerator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testNarrativeEvolution() {
  console.log('\n--- Testing Milestone M11: Narrative Evolution Engine ---');

  const engine = new NarrativeEvolutionEngine();
  const society = societyGenerator.generate({
    name: 'Narrative Test Network',
    archetype: 'online_community',
    populationSize: 60,
    seed: 42,
  });

  // 1. Initialize Root Claim (Variant A)
  const rootVariant = engine.initializeRootClaim(
    '5G Health Effects',
    'Preliminary report questions 5G cellular thermal frequencies.',
    society.agents[0].id,
    society.agents[0].communityId,
    0.45
  );

  assert(rootVariant.id === 'variant_A', 'Root variant ID must be variant_A');
  assert(rootVariant.semanticDriftFromRoot === 0.0, 'Root semantic drift must be 0');
  console.log(`  ✓ Root Claim Initialized: "${rootVariant.claimText}" (Fear: ${rootVariant.fearSalience})`);

  // 2. Transmit across community boundary to trigger polarization mutation
  // Pick an agent from a different community with low trust
  const targetAgent = society.agents.find(a => a.communityId !== society.agents[0].communityId) || society.agents[5];
  targetAgent.traits.trust = 0.2; // High suspicion to ensure mutation triggers

  const mutatedVariant = engine.evaluateTransmissionMutation(
    rootVariant.id,
    society.agents[0],
    targetAgent,
    3,
    society
  );

  assert(mutatedVariant.id === 'variant_B', 'First mutation should produce variant_B');
  assert(mutatedVariant.parentId === 'variant_A', 'Variant B parent must be variant_A');
  assert(mutatedVariant.semanticDriftFromRoot > 0, 'Mutated variant must have semantic drift > 0');
  assert(mutatedVariant.mutationMechanism === 'COMMUNITY_CROSSING_POLARIZATION', 'Mechanism should be cross-community polarization');
  console.log(`  ✓ Mutated Variant Generated: "${mutatedVariant.claimText}" (Drift: ${mutatedVariant.semanticDriftFromRoot})`);

  // 3. Second mutation to produce Variant C
  const thirdAgent = society.agents.find(a => a.id !== targetAgent.id && a.communityId !== targetAgent.communityId) || society.agents[10];
  thirdAgent.traits.trust = 0.1;
  const variantC = engine.evaluateTransmissionMutation(
    mutatedVariant.id,
    targetAgent,
    thirdAgent,
    8,
    society
  );

  assert(variantC.id === 'variant_C', 'Second mutation should produce variant_C');
  assert(variantC.parentId === 'variant_B', 'Variant C parent must be variant_B');

  // 4. Verify Exact Output Requirement
  const summary = engine.getSummary();
  assert(summary.totalVariants >= 3, 'Lineage tree must contain at least 3 variants');
  assert(summary.narrativeLineageStatements.length >= 2, 'Must record mutation lineage statements');

  console.log('  Narrative Lineage Statements:');
  for (const stmt of summary.narrativeLineageStatements) {
    console.log(`    ↳ "${stmt}"`);
  }
  assert(summary.narrativeLineageStatements[0].includes('Claim VARIANT B emerged from VARIANT A'), 'Lineage statement must document variant emergence');

  // 5. Test Meta-Narrative Convergence
  const convergentVariant = engine.registerConvergence(
    'variant_A',
    'variant_C',
    12,
    'Unified Theory: 5G frequencies and grid infrastructure weaponized together.',
    society.communities[0].id,
    society.agents[0].id
  );

  assert(convergentVariant.mutationMechanism === 'SYNTHESIS_CONVERGENCE', 'Mechanism must be synthesis convergence');
  const tree = engine.getTree();
  assert(tree.convergenceEvents.length === 1, 'Convergence event must be logged');
  console.log(`  ✓ Meta-Narrative Convergence Verified: "${convergentVariant.claimText}"`);

  console.log('✓ Narrative Evolution Engine validated successfully.');
}
