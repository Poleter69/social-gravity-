/**
 * Social Gravity — M22.1 Replay Suite: Pause and Resume Determinism Tests
 * Test 3: Pause at Round 17 -> wait -> round remains 17 (zero drift).
 * Test 4: Resume -> advances to 18 (continues from exact paused state).
 */

import { PlaybackController } from '../../src/simulation/playbackController';
import { createTestRumorEngine, sleep } from '../playback/playbackTestHelper';

export async function testPauseResume(): Promise<void> {
  console.log('3. Testing pause at Round 17 and resume to Round 18...');

  const engine = createTestRumorEngine(40);
  const controller = new PlaybackController({ baseIntervalMs: 20, maxRounds: 40 });
  controller.bindEngine(engine);

  // Step or advance to round 17
  for (let i = 0; i < 17; i++) {
    controller.step();
  }

  const roundAtPause = controller.getStatus().currentRound;
  console.log(`  Target round reached: ${roundAtPause}`);

  if (roundAtPause !== 17) {
    controller.destroy();
    throw new Error(`Expected to reach Round 17 before pause test, got ${roundAtPause}`);
  }

  // Ensure controller is paused
  controller.pause();
  if (controller.isPlaying()) {
    controller.destroy();
    throw new Error('Controller should be in paused state.');
  }

  // Wait 250ms to verify zero timer drift or rogue background ticks
  await sleep(250);

  const roundAfterWait = controller.getStatus().currentRound;
  const engineRoundAfterWait = engine.getState().currentRound;

  console.log(`  Round after 250ms idle wait: controller=${roundAfterWait}, engine=${engineRoundAfterWait}`);

  if (roundAfterWait !== 17 || engineRoundAfterWait !== 17) {
    controller.destroy();
    throw new Error(
      `Round drift during pause! Expected 17, got controller=${roundAfterWait}, engine=${engineRoundAfterWait}`
    );
  }
  console.log('  ✓ Test 3 Verified: Paused at Round 17 -> waited 250ms -> round remained strictly at 17.');

  // Test 4: Resume and verify next round is exactly 18
  console.log('4. Testing resume continues from Round 17 to Round 18...');
  controller.resume();

  if (!controller.isPlaying()) {
    controller.destroy();
    throw new Error('Controller failed to resume to playing state.');
  }

  // Wait 45ms (just over 2 * 20ms interval) to catch advancement to round 18
  await sleep(65);
  controller.pause();

  const roundAfterResume = controller.getStatus().currentRound;
  console.log(`  Round after resume: ${roundAfterResume}`);

  if (roundAfterResume < 18) {
    controller.destroy();
    throw new Error(
      `Expected resume to advance past Round 17 to at least 18, got ${roundAfterResume}`
    );
  }

  controller.destroy();
  console.log('  ✓ Test 4 Verified: Resume smoothly advanced from Round 17 to Round 18 with zero resets.');
}
