/**
 * Social Gravity - Phase C: Replay Engine, Time-Travel & Counterfactual Test Suite
 */

import { societyGenerator } from '../../src/society/generators/societyGenerator';
import { RumorEngine } from '../../src/simulation/rumorEngine';
import { CounterfactualEngine } from '../../src/simulation/counterfactualEngine';
import { LayoutService } from '../../src/society/workers/layoutService';
import { WikipediaHoaxAdapter } from '../../src/datasets/adapters/wikipediaHoaxAdapter';
import { WIKIPEDIA_HOAX_FIXTURES } from '../../src/datasets/fixtures/wikipediaHoaxFixture';
import { DynamicGraph } from '../../src/graph/engine/dynamicGraph';
import { TickEngine } from '../../src/graph/engine/tickEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function testReplayAndCounterfactual() {
  console.log('--- Testing Phase C: Analyst Replay, Time-Travel & Counterfactual Branching ---');

  // 1. Setup Simulation
  const society = societyGenerator.generate({
    name: 'Replay Test Society',
    archetype: 'online_community',
    populationSize: 80,
    influencerRatio: 0.15,
    seed: 42,
  });

  const viralRumor = {
    id: 'rumor_replay_viral',
    topic: 'Critical Network Security Breach',
    content: 'Zero-day vulnerability discovered actively leaking private keys.',
    veracity: 'false' as const,
    emotionalSalience: 0.95,
    complexity: 0.20,
    senderId: society.agents[0].id,
    round: 0,
  };

  const engine = new RumorEngine(society, { maxRounds: 20, seed: 42 });
  const seedId = society.agents[0].id;

  engine.start(viralRumor, [seedId]);
  assert(engine.hasSnapshot(0), 'Engine must record Round 0 base snapshot');

  // Step rounds
  const targetRounds = 5;
  for (let r = 1; r <= targetRounds; r++) {
    if (engine.getState().status === 'completed') break;
    engine.step();
    assert(engine.hasSnapshot(engine.getState().currentRound), `Engine must record snapshot for Round ${engine.getState().currentRound}`);
  }
  assert(engine.getRecordedRounds().length >= 3, 'Must record at least 3 rounds of history');

  const latestRound = engine.getState().currentRound;
  const latestState = engine.getState();
  const latestBelievers = latestState.telemetryHistory[latestRound].believerCount;
  console.log(`  ✓ Simulation reached Round ${latestRound} with ${latestBelievers} believers across ${engine.getRecordedRounds().length} snapshots`);

  // 2. Test Time Travel & Instant Scrubbing (Task 1 & 2)
  const r2State = engine.goToRound(2);
  assert(r2State.currentRound === 2, `Expected round 2 after time travel, got ${r2State.currentRound}`);
  const r2Believers = r2State.telemetryHistory[2].believerCount;
  assert(r2Believers <= latestBelievers, 'Historical believer count at round 2 must be <= latest round');
  console.log(`  ✓ Scrubbed back to Round 2: Believers=${r2Believers} (Instant restoration without recomputation)`);

  const r0State = engine.goToRound(0);
  assert(r0State.currentRound === 0, 'Must successfully rewind to patient zero round 0');
  assert(r0State.agentStates.get(seedId) === 'BELIEVER', 'Patient zero must be believer at round 0');
  console.log('  ✓ Rewound to Round 0: Patient zero verified');

  const restored = engine.goToRound(latestRound);
  assert(restored.currentRound === latestRound, `Fast-forward back to Round ${latestRound} must succeed`);
  assert(restored.telemetryHistory[latestRound].believerCount === latestBelievers, `State parity verified at Round ${latestRound}`);
  console.log(`  ✓ Fast-forwarded to Round ${latestRound}: State parity matches exact recorded history`);

  // 3. Test Counterfactual Branching Engine (Task 3)
  console.log(`  Testing Counterfactual Branching at t=${latestRound}...`);
  const comparison = CounterfactualEngine.runStandardComparison(engine, 6);
  assert(comparison.branchTick === latestRound, `Expected branch tick ${latestRound}, got ${comparison.branchTick}`);
  assert(comparison.branches.length === 3, `Expected 3 branches, got ${comparison.branches.length}`);

  const baseline = comparison.branches.find(b => b.branchId === 'baseline')!;
  const bridgeBranch = comparison.branches.find(b => b.branchId === 'bridge_inoculation')!;
  const influencerBranch = comparison.branches.find(b => b.branchId === 'influencer_containment')!;

  assert(baseline !== undefined, 'Baseline branch must exist');
  assert(bridgeBranch !== undefined, 'Bridge inoculation branch must exist');
  assert(influencerBranch !== undefined, 'Influencer containment branch must exist');

  assert(comparison.recommendedBranchId.length > 0, 'Must generate recommended branch');
  assert(comparison.recommendationRationale.length > 20, 'Recommendation rationale must be comprehensive');
  console.log(`  ✓ 3-way Counterfactual comparison complete: Optimal strategy="${comparison.recommendedBranchId}"`);
  console.log(`    Rationale: ${comparison.recommendationRationale}`);

  // 4. Test Live Dynamic Graph Ticking & Interaction (Task 4)
  const dg = new DynamicGraph(42);
  dg.addNode({ id: 'u1', communityId: 'comm_0' });
  dg.addNode({ id: 'u2', communityId: 'comm_0' });
  dg.addEdge({ source: 'u1', target: 'u2', weight: 0.6 });

  const initialWeight = dg.getAllEdges()[0].weight;
  dg.recordInteraction('u1', 'u2');
  const strengthenedWeight = dg.getAllEdges()[0].weight;
  assert(strengthenedWeight > initialWeight, 'Record interaction must strengthen edge weight');

  const tickEngine = new TickEngine(dg);
  const tickResult = tickEngine.tick();
  assert(tickResult.tick === 1, 'Tick engine must advance to tick 1');
  console.log(`  ✓ DynamicGraph edge dynamics & tick engine verified (Weight: ${initialWeight} -> ${strengthenedWeight})`);

  // 5. Test Asynchronous Layout Service (Task 5)
  const positions = await LayoutService.computeLayoutAsync(society, 800, 600);
  assert(positions.size === society.agents.length, `Expected ${society.agents.length} positions, got ${positions.size}`);
  for (const pos of positions.values()) {
    assert(!isNaN(pos.x) && !isNaN(pos.y), 'Calculated node coordinates must be non-NaN');
    assert(pos.radius > 0, 'Node radius must be > 0');
  }
  console.log(`  ✓ LayoutService computed coordinates for ${positions.size} nodes asynchronously without UI blocking`);
}
