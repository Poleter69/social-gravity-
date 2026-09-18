/**
 * Social Gravity — M22 Playback Suite: Speed Control Test
 * Verifies speed multiplier switching (0.5×, 1×, 2×, 4×, 8×),
 * ensures active loops adapt cleanly without double-timers or skipped rounds.
 */

import { PlaybackController, PlaybackSpeed } from '../../src/simulation/playbackController';
import { createTestRumorEngine, sleep } from './playbackTestHelper';

export async function testSpeedControl(): Promise<void> {
  console.log('1. Testing speed multiplier configuration values...');

  const engine = createTestRumorEngine(35);
  const controller = new PlaybackController({ baseIntervalMs: 100 });
  controller.bindEngine(engine);

  const speeds: PlaybackSpeed[] = [0.5, 1, 2, 4, 8];
  for (const spd of speeds) {
    controller.setSpeed(spd);
    if (controller.getSpeed() !== spd) {
      controller.destroy();
      throw new Error(`Expected speed ${spd}, got ${controller.getSpeed()}`);
    }
  }
  console.log('  ✓ All 5 speed multipliers (0.5×, 1×, 2×, 4×, 8×) accepted and stored.');

  console.log('2. Testing live speed adaptation without double-loops...');
  // Start at 1x (base 100ms)
  controller.setSpeed(1);
  controller.play();

  // Run at 1x for 220ms -> should advance ~2 rounds
  await sleep(220);
  const r1 = controller.getStatus().currentRound;
  console.log(`  Rounds advanced at 1× in ~220ms: ${r1}`);

  // Switch to 4x (25ms interval) while running
  controller.setSpeed(4);
  if (controller.getSpeed() !== 4) {
    controller.destroy();
    throw new Error('Failed to switch speed during active playback');
  }

  // Run at 4x for 220ms -> should advance ~8-9 rounds
  await sleep(220);
  const r2 = controller.getStatus().currentRound;
  const deltaAt4x = r2 - r1;
  console.log(`  Rounds advanced at 4× in ~220ms: ${deltaAt4x}`);

  if (deltaAt4x <= r1) {
    controller.destroy();
    throw new Error(
      `4× speed did not advance faster than 1×: delta4x=${deltaAt4x}, delta1x=${r1}`
    );
  }

  controller.pause();
  const pausedRound = controller.getStatus().currentRound;
  await sleep(100);

  // Ensure pause cleanly halted the fast loop
  if (controller.getStatus().currentRound !== pausedRound) {
    controller.destroy();
    throw new Error('Pause after speed switch leaked timer handles!');
  }

  controller.destroy();
  console.log('  ✓ Speed multiplier dynamically adapted active loop with zero timer leaks.');
}
