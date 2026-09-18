/**
 * Social Gravity — M22 Playback Suite: Timeline Scrub & Snapshot Sync Test
 * Verifies that scrubbing to historical rounds correctly accesses snapshots
 * and maintains playback state determinism.
 */

import { PlaybackController } from '../../src/simulation/playbackController';
import { createTestRumorEngine, sleep } from './playbackTestHelper';

export async function testTimelineSync(): Promise<void> {
  console.log('1. Testing timeline scrub to previous rounds while paused...');

  const engine = createTestRumorEngine(20);
  const controller = new PlaybackController({ baseIntervalMs: 25 });
  controller.bindEngine(engine);

  // Advance 6 rounds manually
  for (let i = 0; i < 6; i++) {
    controller.step();
  }

  const currentRound = controller.getStatus().currentRound;
  console.log(`  Engine reached round ${currentRound}`);

  if (currentRound < 6) {
    controller.destroy();
    throw new Error(`Expected at least round 6, got ${currentRound}`);
  }

  // Scrub backward to round 2
  const scrubbedState = controller.scrubToRound(2);
  if (!scrubbedState) {
    controller.destroy();
    throw new Error('scrubToRound(2) returned null despite snapshot existing.');
  }

  if (scrubbedState.currentRound !== 2 || controller.getStatus().currentRound !== 2) {
    controller.destroy();
    throw new Error(
      `scrubToRound(2) failed to restore state: got ${controller.getStatus().currentRound}`
    );
  }

  if (controller.isPlaying()) {
    controller.destroy();
    throw new Error('Controller was paused before scrub; should remain paused after scrub.');
  }
  console.log('  ✓ Successfully scrubbed backward to round 2 with exact state restoration.');

  // Step forward from round 2 -> should reach round 3
  controller.step();
  if (controller.getStatus().currentRound !== 3) {
    controller.destroy();
    throw new Error(`Expected round 3 after step from round 2, got ${controller.getStatus().currentRound}`);
  }
  controller.destroy();
  console.log('  ✓ Stepping forward from scrubbed point proceeds predictably to round 3.');

  console.log('2. Testing scrubbing during active playback...');
  const engine2 = createTestRumorEngine(40);
  const controller2 = new PlaybackController({ baseIntervalMs: 25 });
  controller2.bindEngine(engine2);

  controller2.play();
  await sleep(60); // Advance ~2 rounds

  // Scrub back to round 1 while playing
  controller2.scrubToRound(1);
  if (!controller2.isPlaying()) {
    controller2.destroy();
    throw new Error('Controller was playing before scrub; should resume playing after scrub.');
  }

  await sleep(80);
  controller2.pause();

  const afterPlayRound = controller2.getStatus().currentRound;
  console.log(`  After scrubbing to 1 while playing, advanced to: ${afterPlayRound}`);
  if (afterPlayRound <= 1) {
    controller2.destroy();
    throw new Error(`Playback did not continue after live scrub. Stalled at ${afterPlayRound}`);
  }

  controller2.destroy();
  console.log('  ✓ Timeline scrub & snapshot sync verified under paused and live playback.');
}
