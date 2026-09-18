/**
 * Social Gravity — M22 Playback Suite: Pause & Resume Test
 * Verifies that pause immediately halts the loop, and resume continues
 * from the exact paused round without drift or resets.
 */

import { PlaybackController } from '../../src/simulation/playbackController';
import { createTestRumorEngine, sleep } from './playbackTestHelper';

export async function testPauseResume(): Promise<void> {
  console.log('1. Testing pause halts playback and preserves round...');

  const engine = createTestRumorEngine(30);
  const controller = new PlaybackController({ baseIntervalMs: 25 });
  controller.bindEngine(engine);

  controller.play();
  await sleep(100); // Allow it to advance ~3-4 rounds

  controller.pause();

  if (!controller.isPaused()) {
    controller.destroy();
    throw new Error(`Expected controller to be paused, got ${controller.getState()}`);
  }

  const pausedRound = controller.getStatus().currentRound;
  console.log(`  Paused at round: ${pausedRound}`);

  if (pausedRound === 0) {
    controller.destroy();
    throw new Error('[PauseResume] Simulation never started or paused at round 0.');
  }

  // Wait 100ms while paused to ensure no ticks fire
  await sleep(100);

  const checkRound = controller.getStatus().currentRound;
  if (checkRound !== pausedRound) {
    controller.destroy();
    throw new Error(
      `[PauseResume] Loop leaked during pause! Round drifted from ${pausedRound} to ${checkRound}.`
    );
  }
  console.log('  ✓ Verified 0 loop ticks during pause period.');

  console.log('2. Testing resume continues from exact paused round...');
  controller.resume();

  if (!controller.isPlaying()) {
    controller.destroy();
    throw new Error(`Expected controller to be playing after resume, got ${controller.getState()}`);
  }

  await sleep(100); // Allow to advance further

  const resumedRound = controller.getStatus().currentRound;
  console.log(`  Advanced to round: ${resumedRound}`);

  if (resumedRound <= pausedRound) {
    controller.destroy();
    throw new Error(
      `[PauseResume] Resume failed to advance past paused round ${pausedRound}. Currently at ${resumedRound}.`
    );
  }

  controller.destroy();
  console.log('  ✓ Pause and resume determinism verified with zero round drift.');
}
