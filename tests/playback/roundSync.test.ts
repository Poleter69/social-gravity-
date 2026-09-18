/**
 * Social Gravity — M22 Playback Suite: Round Synchronization Test
 * Verifies that the round reported by PlaybackController strictly matches
 * the RumorEngine state at every step and tick.
 */

import { PlaybackController } from '../../src/simulation/playbackController';
import { createTestRumorEngine, sleep } from './playbackTestHelper';

export async function testRoundSync(): Promise<void> {
  console.log('1. Testing round sync across single steps...');

  const engine = createTestRumorEngine(20);
  const controller = new PlaybackController({ baseIntervalMs: 25 });
  controller.bindEngine(engine);

  // Initial check
  if (controller.getStatus().currentRound !== engine.getState().currentRound) {
    controller.destroy();
    throw new Error(
      `Round mismatch at start: controller=${controller.getStatus().currentRound}, engine=${engine.getState().currentRound}`
    );
  }

  // Step 5 times sequentially
  for (let i = 1; i <= 5; i++) {
    const stepResult = controller.step();
    const ctrlRound = controller.getStatus().currentRound;
    const engRound = engine.getState().currentRound;

    if (ctrlRound !== engRound) {
      controller.destroy();
      throw new Error(`Round mismatch at step ${i}: controller=${ctrlRound}, engine=${engRound}`);
    }

    if (stepResult && stepResult.currentRound !== ctrlRound) {
      controller.destroy();
      throw new Error(`stepResult mismatch at step ${i}: result=${stepResult.currentRound}, ctrl=${ctrlRound}`);
    }
  }
  console.log('  ✓ Verified exact round parity across 5 manual steps.');

  console.log('2. Testing round sync during continuous loop playback...');
  let mismatchCount = 0;
  const unsubscribe = controller.subscribe((simState, status) => {
    if (simState.currentRound !== status.currentRound) {
      mismatchCount++;
    }
  });

  controller.play();
  await sleep(150);
  controller.pause();
  unsubscribe();

  if (mismatchCount > 0) {
    controller.destroy();
    throw new Error(`[RoundSync] Detected ${mismatchCount} round synchronization mismatches during playback!`);
  }

  const finalCtrlRound = controller.getStatus().currentRound;
  const finalEngRound = engine.getState().currentRound;

  if (finalCtrlRound !== finalEngRound) {
    controller.destroy();
    throw new Error(
      `Final round mismatch: controller=${finalCtrlRound}, engine=${finalEngRound}`
    );
  }

  controller.destroy();
  console.log(`  ✓ 100% round synchronization verified between controller and engine (final round: ${finalCtrlRound}).`);
}
