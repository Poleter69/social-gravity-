/**
 * Social Gravity V2 - Dynamic Graph & Replay Engine Integration Tests
 *
 * Validates deterministic execution, temporal edge decay, checkpointing,
 * and exact bitwise replay across time-travel trajectories.
 */

import { DeterministicGraphGenerator } from '../../src/graph/engine/deterministicGenerator';
import { TickEngine } from '../../src/graph/engine/tickEngine';
import { ReplayEngine } from '../../src/graph/replay/replayEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testDynamicGraphAndReplay() {
  console.log('--- Testing Deterministic Graph Generation, Tick Engine & Replay ---');

  // Test 1: Deterministic Graph Generation from Seed
  const seed = 98765;
  const graphA = DeterministicGraphGenerator.createWattsStrogatz({
    n: 30,
    k: 4,
    p: 0.1,
    seed,
  });
  const graphB = DeterministicGraphGenerator.createWattsStrogatz({
    n: 30,
    k: 4,
    p: 0.1,
    seed,
  });

  const snapA = graphA.createSnapshot();
  const snapB = graphB.createSnapshot();

  const parity1 = ReplayEngine.verifyParity(snapA, snapB);
  assert(parity1.matches, `Initial graphs with identical seeds must match: ${parity1.discrepancies.join(', ')}`);

  // Test 2: Tick Engine with Scheduled Events & Edge Decay
  const tickEngine = new TickEngine(graphA);
  const scheduler = tickEngine.getScheduler();

  // Schedule interactions and mutations at specific ticks
  scheduler.schedule(5, 'INTERACTION', {
    source: 'node_0',
    target: 'node_1',
    multiplier: 1.5,
  });
  scheduler.schedule(10, 'INTERACTION', {
    source: 'node_0',
    target: 'node_1',
    multiplier: 1.2,
  });
  scheduler.schedule(15, 'NODE_JOINED', {
    id: 'node_new_external',
    communityId: 'comm_99',
    currentInfluence: 0.85,
  });
  scheduler.schedule(18, 'EDGE_CREATED', {
    source: 'node_new_external',
    target: 'node_0',
    weight: 0.9,
    relationshipType: 'bridge',
  });

  // Run 30 ticks
  const tickResults = tickEngine.runTicks(30);
  assert(tickResults.length === 30, 'Should have executed 30 ticks');
  assert(graphA.getTick() === 30, `Graph current tick should be 30, got ${graphA.getTick()}`);
  assert(graphA.hasNode('node_new_external'), 'New node scheduled at tick 15 must exist by tick 30');

  // Verify that an inactive edge decayed
  // node_5 and node_6 were not interacted with, so their weight must have decayed
  const edge56 = graphA.getEdgeBetween('node_5', 'node_6');
  if (edge56) {
    assert(
      edge56.weight < 0.55,
      `Inactive edge weight should have decayed over 30 ticks, current weight: ${edge56.weight}`
    );
  }

  // Capture ground-truth state at Tick 30
  const tick30GroundTruth = graphA.createSnapshot();

  // Test 3: Replay Engine Time-Travel
  const replayEngine = new ReplayEngine(
    graphA,
    graphA.getEventLog(),
    tickEngine.getSnapshotStore()
  );

  // Time-travel back to Tick 12 (before node_new_external joined at tick 15)
  replayEngine.goToTick(12);
  assert(graphA.getTick() === 12, `Replay tick should be 12, got ${graphA.getTick()}`);
  assert(
    !graphA.hasNode('node_new_external'),
    'Node joined at tick 15 must NOT exist at tick 12'
  );

  // Time-travel back to Tick 0 (base state)
  replayEngine.goToTick(0);
  assert(graphA.getTick() === 0, `Replay tick should be 0, got ${graphA.getTick()}`);
  const snapTick0 = graphA.createSnapshot();
  const parityTick0 = ReplayEngine.verifyParity(snapA, snapTick0);
  assert(
    parityTick0.matches,
    `Replaying to tick 0 must match initial state exactly: ${parityTick0.discrepancies.join(', ')}`
  );

  // Fast-forward back to Tick 30
  replayEngine.goToTick(30);
  assert(graphA.getTick() === 30, `Replay tick should be 30, got ${graphA.getTick()}`);
  const snapReplay30 = graphA.createSnapshot();
  const parityTick30 = ReplayEngine.verifyParity(tick30GroundTruth, snapReplay30);
  assert(
    parityTick30.matches,
    `Replaying to tick 30 must produce bitwise identical state to original run: ${parityTick30.discrepancies.join(', ')}`
  );

  // Test 4: Isolated Counterfactual Reconstruction
  const isolatedBranch = replayEngine.reconstructIsolatedAtTick(16);
  assert(isolatedBranch.getTick() === 16, 'Isolated branch should be at tick 16');
  assert(
    isolatedBranch.hasNode('node_new_external'),
    'Node joined at tick 15 must exist on branch at tick 16'
  );
  // Base graph should still be at tick 30
  assert(graphA.getTick() === 30, 'Base graph must remain untouched at tick 30');

  // Test 5: Replay with Barabási-Albert Scale-Free Graph
  const baGraph = DeterministicGraphGenerator.createScaleFree({
    n: 40,
    m0: 5,
    m: 2,
    seed: 42,
  });
  const baEngine = new TickEngine(baGraph);
  baEngine.runTicks(15);
  const baSnap15 = baGraph.createSnapshot();

  const baReplay = new ReplayEngine(baGraph, baGraph.getEventLog(), baEngine.getSnapshotStore());
  baReplay.goToTick(5);
  assert(baGraph.getTick() === 5, 'BA graph replay at tick 5');
  baReplay.goToTick(15);
  const baSnapReplay15 = baGraph.createSnapshot();

  const parityBA = ReplayEngine.verifyParity(baSnap15, baSnapReplay15);
  assert(parityBA.matches, `BA replay must match: ${parityBA.discrepancies.join(', ')}`);

  console.log('✓ Deterministic generation, tick engine, and exact time-travel replay validated.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('dynamicGraphAndReplay.test.ts')) {
  testDynamicGraphAndReplay();
}
