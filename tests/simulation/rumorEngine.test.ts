/**
 * Social Gravity - Rumor Engine & Diffusion Telemetry Unit & Integration Tests
 */

import { TransmissionPriorityQueue } from '../../src/simulation/queue';
import { CascadeTracker } from '../../src/simulation/cascadeTracker';
import { RumorEngine } from '../../src/simulation/rumorEngine';
import { TransmissionEvent } from '../../src/simulation/types';
import { InformationSignal } from '../../src/psychology/types';
import { societyGenerator } from '../../src/society/generators/societyGenerator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testRumorEngine() {
  console.log('--- Testing Transmission Priority Queue ---');

  const queue = new TransmissionPriorityQueue();
  const dummySignal: InformationSignal = {
    id: 'sig_1',
    topic: 'Test Rumor',
    content: 'Test content',
    veracity: 'false',
    emotionalSalience: 0.8,
    complexity: 0.3,
    senderId: 'src_1',
    round: 0,
  };

  const e1: TransmissionEvent = {
    id: 'e1',
    sourceId: 'a',
    targetId: 'b',
    signal: dummySignal,
    scheduledRound: 2,
    priority: 5,
    transmitted: false,
  };

  const e2: TransmissionEvent = {
    id: 'e2',
    sourceId: 'a',
    targetId: 'c',
    signal: dummySignal,
    scheduledRound: 1,
    priority: 10,
    transmitted: false,
  };

  const e3: TransmissionEvent = {
    id: 'e3',
    sourceId: 'a',
    targetId: 'd',
    signal: dummySignal,
    scheduledRound: 2,
    priority: 9, // Higher priority in round 2
    transmitted: false,
  };

  queue.enqueue(e1);
  queue.enqueue(e2);
  queue.enqueue(e3);

  assert(queue.size === 3, 'Queue should hold 3 events');

  // Pop round 1
  const round1Events = queue.popReady(1);
  assert(round1Events.length === 1, 'Round 1 should have 1 event');
  assert(round1Events[0].id === 'e2', 'e2 should pop first at round 1');

  // Pop round 2
  const round2Events = queue.popReady(2);
  assert(round2Events.length === 2, 'Round 2 should have 2 events');
  assert(round2Events[0].id === 'e3', 'Higher priority e3 should pop before e1 in round 2');
  assert(round2Events[1].id === 'e1', 'e1 should pop after e3');
  assert(queue.size === 0, 'Queue should now be empty');
  console.log('  ✓ Priority queue sorting and multi-round dispatch validated');

  console.log('--- Testing Cascade Telemetry & Echo Chamber Index ---');
  const sampleSociety = societyGenerator.generate({
    name: 'Epidemic Test Society',
    archetype: 'online_community',
    populationSize: 60,
    seed: 42,
  });

  const echoIndexUniform = CascadeTracker.calculateEchoChamberIndex({ c1: 0.5, c2: 0.5 });
  assert(echoIndexUniform === 0, 'Uniform distribution should have 0 echo chamber index');

  const echoIndexPolarized = CascadeTracker.calculateEchoChamberIndex({ c1: 0.95, c2: 0.05 });
  assert(echoIndexPolarized > 0.8, 'Polarized distribution should have high echo chamber index');
  console.log(`  ✓ Echo chamber polarization index validated (polarized index: ${echoIndexPolarized})`);

  console.log('--- Testing Rumor Engine End-to-End Simulation ---');
  const viralRumor: InformationSignal = {
    id: 'rumor_viral',
    topic: 'Campus Shutdown Scandal',
    content: 'Administration is secretly preparing to cancel all degrees.',
    veracity: 'false',
    emotionalSalience: 0.95,
    complexity: 0.20,
    senderId: sampleSociety.agents[0].id,
    round: 0,
  };

  const engine = new RumorEngine(sampleSociety, {
    maxRounds: 15,
    seed: 1234,
  });

  const initialState = engine.start(viralRumor, [sampleSociety.agents[0].id]);
  assert(initialState.status === 'running', 'Simulation should be running');
  assert(initialState.currentRound === 0, 'Initial round should be 0');
  assert(initialState.agentStates.get(sampleSociety.agents[0].id) === 'BELIEVER', 'Patient Zero must be BELIEVER');

  // Step 3 rounds forward
  engine.step(); // Round 1
  engine.step(); // Round 2
  const round3State = engine.step(); // Round 3

  assert(round3State.currentRound === 3, 'Should be at round 3');
  const round3Telemetry = round3State.telemetryHistory[round3State.telemetryHistory.length - 1];
  assert(round3Telemetry.believerCount >= 1, 'Believer count must be tracked');
  console.log(`  ✓ Rumor diffusion stepped to Round 3: Believers=${round3Telemetry.believerCount}, Skeptics=${round3Telemetry.skepticCount}, R0=${round3Telemetry.r0}`);

  console.log('--- Testing Debunking Counter-Intervention ---');
  const debunkSignal: InformationSignal = {
    id: 'debunk_verified',
    topic: 'Fact Check: Campus Shutdown',
    content: 'Official audit confirms no shutdown plans exist. Disinformation debunked.',
    veracity: 'true',
    emotionalSalience: 0.15,
    complexity: 0.25,
    senderId: 'fact_checker_node',
    round: 3,
  };

  // Inject debunking counter-narrative
  engine.injectDebunking(debunkSignal);
  assert(engine.getState().activeDebunk !== null, 'Active debunk should be registered');

  // Step 2 more rounds
  engine.step();
  const round5State = engine.step();
  const round5Telemetry = round5State.telemetryHistory[round5State.telemetryHistory.length - 1];
  assert(round5Telemetry.debunkerCount > 0, `Expected at least 1 debunker after intervention, got ${round5Telemetry.debunkerCount}`);
  console.log(`  ✓ Debunking intervention adopted by ${round5Telemetry.debunkerCount} debunkers by Round 5`);

  console.log('✓ All Rumor Engine & Diffusion tests passed successfully.');
}
