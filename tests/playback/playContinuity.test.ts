/**
 * Social Gravity — M22 Playback Suite: Play Continuity Test
 * Verifies that play() advances continuously past Round 2 without stopping.
 */

import { PlaybackController } from '../../src/simulation/playbackController';
import { createTestRumorEngine, sleep } from './playbackTestHelper';

export async function testPlayContinuity(): Promise<void> {
  console.log('1. Verifying continuous playback loop advances past round 2...');

  const engine = createTestRumorEngine(40);
  const controller = new PlaybackController({ baseIntervalMs: 20 });
  controller.bindEngine(engine);

  if (controller.getState() !== 'idle') {
    throw new Error(`Expected initial state to be idle, got ${controller.getState()}`);
  }

  // Start playback
  controller.play();

  if (!controller.isPlaying()) {
    throw new Error('Controller should be playing after play() called');
  }

  // Wait 150ms (with 20ms base, > 5 ticks fire comfortably on Windows)
  await sleep(150);

  const status = controller.getStatus();
  console.log(`  Current round after continuous run: ${status.currentRound}`);

  if (status.currentRound <= 2) {
    controller.destroy();
    throw new Error(
      `[PlayContinuity] Stuck at or before round 2! Reached round ${status.currentRound}. Continuous loop failed.`
    );
  }

  // If the rumor naturally saturated, completed is also a valid state machine completion,
  // but let's ensure it advanced past round 2
  if (status.state === 'playing') {
    // Wait another 120ms to ensure it continues further
    const midRound = status.currentRound;
    await sleep(120);

    const laterStatus = controller.getStatus();
    console.log(`  Later round: ${laterStatus.currentRound}`);

    if (laterStatus.currentRound <= midRound && laterStatus.state === 'playing') {
      controller.destroy();
      throw new Error(
        `[PlayContinuity] Playback did not advance further. Remained at ${laterStatus.currentRound}.`
      );
    }
  }

  controller.destroy();
  console.log('  ✓ Playback continuity verified: ran continuously well past round 2.');
}
