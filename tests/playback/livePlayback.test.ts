/**
 * Social Gravity — M22 Playback Suite: Live Playback & Completion Integration Test
 * Verifies end-to-end subscription notifications, state transitions,
 * and automatic transition to 'completed' when max rounds are reached.
 */

import { PlaybackController } from '../../src/simulation/playbackController';
import { createTestRumorEngine, sleep } from './playbackTestHelper';

export async function testLivePlayback(): Promise<void> {
  console.log('1. Testing subscriber telemetry reception and round completion...');

  const maxRounds = 8;
  const engine = createTestRumorEngine(maxRounds);
  const controller = new PlaybackController({ baseIntervalMs: 20 });
  controller.bindEngine(engine);

  let updatesReceived = 0;
  let finalStateReached = false;

  const unsubscribe = controller.subscribe((simState, status) => {
    updatesReceived++;
    if (status.state === 'completed' || simState.status === 'completed') {
      finalStateReached = true;
    }
  });

  controller.play();

  // Wait up to 1000ms for rounds to complete (resilient against timer jitter)
  let waited = 0;
  while (waited < 1000 && controller.getState() !== 'completed' && !finalStateReached) {
    await sleep(50);
    waited += 50;
  }

  console.log(`  Telemetry frames received: ${updatesReceived}`);
  console.log(`  Controller state after completion run: ${controller.getState()}`);

  if (updatesReceived === 0) {
    controller.destroy();
    throw new Error('Subscriber never received any telemetry frames during playback.');
  }

  if (controller.getState() !== 'completed' && !finalStateReached) {
    controller.destroy();
    throw new Error(
      `Expected playback state to transition to 'completed', got ${controller.getState()}`
    );
  }

  if (controller.getStatus().isLoopActive) {
    controller.destroy();
    throw new Error('Loop is still active after simulation completed!');
  }

  unsubscribe();
  controller.destroy();
  console.log('  ✓ Verified full playback lifecycle to automated completion with zero residual loops.');
}
