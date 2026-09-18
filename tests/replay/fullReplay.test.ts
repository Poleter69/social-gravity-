/**
 * Social Gravity — M22.1 Replay Suite: Full Continuous Replay Test
 * Test 1: Full replay executing monotonically from Round 1 through Round 40
 * without early termination or loop starvation.
 */

import { PlaybackController } from '../../src/simulation/playbackController';
import { createTestRumorEngine, sleep } from '../playback/playbackTestHelper';

export async function testFullReplay(): Promise<void> {
  console.log('1. Testing full continuous replay from Round 0 through Round 40...');

  const engine = createTestRumorEngine(40);
  const controller = new PlaybackController({ baseIntervalMs: 15, maxRounds: 40 });
  controller.bindEngine(engine);

  const visitedRounds: number[] = [controller.getStatus().currentRound];
  let isCompleted = false;

  const unsubscribe = controller.subscribe((simState, status) => {
    visitedRounds.push(status.currentRound);
    if (status.state === 'completed' || simState.status === 'completed') {
      isCompleted = true;
    }
  });

  controller.play();

  // Wait dynamically until completed with timeout
  const startWait = Date.now();
  while (!isCompleted && Date.now() - startWait < 4000) {
    await sleep(40);
  }

  const finalStatus = controller.getStatus();
  const finalState = engine.getState();

  console.log(`  Initial round: ${visitedRounds[0]}`);
  console.log(`  Final controller round: ${finalStatus.currentRound}`);
  console.log(`  Final engine round: ${finalState.currentRound}`);
  console.log(`  Total recorded ticks: ${visitedRounds.length}`);
  console.log(`  Max recorded round in engine: ${engine.getMaxRecordedRound()}`);

  unsubscribe();
  controller.destroy();

  // Assertion 1: Must reach full maxRounds (40)
  if (finalStatus.currentRound < 40) {
    throw new Error(
      `Replay terminated prematurely at round ${finalStatus.currentRound}. Expected round 40.`
    );
  }

  // Assertion 2: Engine state must also be round 40
  if (finalState.currentRound < 40) {
    throw new Error(
      `Engine terminated prematurely at round ${finalState.currentRound}. Expected round 40.`
    );
  }

  // Assertion 3: Monotonic advancement — no backward round jitter during forward playback
  for (let i = 1; i < visitedRounds.length; i++) {
    if (visitedRounds[i] < visitedRounds[i - 1]) {
      throw new Error(
        `Non-monotonic round advancement detected at step ${i}: ${visitedRounds[i - 1]} -> ${visitedRounds[i]}`
      );
    }
  }

  // Assertion 4: Loop is stopped and status is completed
  if (finalStatus.isLoopActive) {
    throw new Error('Animation/tick loop is still active after reaching round 40!');
  }

  console.log('  ✓ Test 1 Verified: Full replay executed monotonically through Round 40 with zero starvation.');
}
