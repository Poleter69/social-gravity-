/**
 * Social Gravity — M22.1 Replay Suite: Round Counter Single Source of Truth Test
 * Test 2: Frame-by-frame assertion that uiRound === engineRound.
 * Proves that the UI can never display a round different from the engine state.
 */

import { PlaybackController } from '../../src/simulation/playbackController';
import { createTestRumorEngine, sleep } from '../playback/playbackTestHelper';

export async function testRoundSync(): Promise<void> {
  console.log('2. Testing frame-by-frame assertion that uiRound === engineRound...');

  const engine = createTestRumorEngine(40);
  const controller = new PlaybackController({ baseIntervalMs: 20, maxRounds: 40 });
  controller.bindEngine(engine);

  let frameCount = 0;
  let parityViolations = 0;

  const unsubscribe = controller.subscribe((simState, status) => {
    frameCount++;
    const actualEngineRound = engine.getState().currentRound;

    // Verify all 3 round indicators strictly agree
    if (status.uiRound !== status.engineRound) {
      parityViolations++;
      console.error(
        `[Parity Failure] uiRound (${status.uiRound}) !== engineRound (${status.engineRound})`
      );
    }
    if (status.currentRound !== actualEngineRound) {
      parityViolations++;
      console.error(
        `[Parity Failure] status.currentRound (${status.currentRound}) !== engine.currentRound (${actualEngineRound})`
      );
    }
    if (simState.currentRound !== actualEngineRound) {
      parityViolations++;
      console.error(
        `[Parity Failure] simState.currentRound (${simState.currentRound}) !== actualEngineRound (${actualEngineRound})`
      );
    }
  });

  // Execute 15 single steps manually and check frame parity on every step
  for (let s = 1; s <= 15; s++) {
    controller.step();
    const status = controller.getStatus();
    const engRound = engine.getState().currentRound;
    if (status.uiRound !== engRound || status.engineRound !== engRound) {
      parityViolations++;
    }
  }

  console.log(`  Step phase completed: 15 steps tested, ${parityViolations} parity violations.`);

  // Now execute live playback for 10 rounds and check frame parity continuously
  controller.play();
  await sleep(250);
  controller.pause();

  console.log(`  Continuous loop phase completed: ${frameCount} total frames audited.`);

  unsubscribe();
  controller.destroy();

  if (parityViolations > 0) {
    throw new Error(
      `Detected ${parityViolations} frame-by-frame round desync violations between UI and Engine!`
    );
  }

  if (frameCount < 15) {
    throw new Error(`Insufficient frames audited: ${frameCount}`);
  }

  console.log('  ✓ Test 2 Verified: 100% frame-by-frame parity confirmed (uiRound === engineRound across all frames).');
}
