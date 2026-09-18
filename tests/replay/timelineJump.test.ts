/**
 * Social Gravity — M22.1 Replay Suite: Timeline Scrubbing & Snapshot Jump Test
 * Test 5: Scrub to Round 32 -> verify engine snapshot 32 is restored,
 * state matches snapshot, and replay resumes from 32 to 33 without stall.
 */

import { PlaybackController } from '../../src/simulation/playbackController';
import { createTestRumorEngine, sleep } from '../playback/playbackTestHelper';

export async function testTimelineJump(): Promise<void> {
  console.log('5. Testing timeline scrub to Round 32 and seamless continuation...');

  const engine = createTestRumorEngine(40);
  const controller = new PlaybackController({ baseIntervalMs: 15, maxRounds: 40 });
  controller.bindEngine(engine);

  // Advance simulation past round 32 to generate full history and snapshots
  for (let i = 0; i < 35; i++) {
    controller.step();
  }

  const advancedRound = controller.getStatus().currentRound;
  console.log(`  Initial advance reached round: ${advancedRound}`);
  if (advancedRound < 35) {
    controller.destroy();
    throw new Error(`Simulation failed to reach round 35 before jump test. Stalled at ${advancedRound}`);
  }

  if (!engine.hasSnapshot(32)) {
    controller.destroy();
    throw new Error('Engine does not contain snapshot for Round 32!');
  }

  // Record snapshot 32 state for bitwise comparison
  const snapshot32 = engine.getSnapshot(32);
  if (!snapshot32) {
    controller.destroy();
    throw new Error('Failed to retrieve snapshot 32 from engine.');
  }

  // Jump/Scrub to Round 32
  const scrubbedState = controller.scrubToRound(32);
  if (!scrubbedState) {
    controller.destroy();
    throw new Error('controller.scrubToRound(32) returned null!');
  }

  const statusAfterScrub = controller.getStatus();
  const engineStateAfterScrub = engine.getState();

  console.log(`  After scrub to 32: controller=${statusAfterScrub.currentRound}, engine=${engineStateAfterScrub.currentRound}`);

  // Assertion 1: Both controller and engine must strictly report round 32
  if (statusAfterScrub.currentRound !== 32) {
    controller.destroy();
    throw new Error(`Controller round is ${statusAfterScrub.currentRound}, expected 32.`);
  }
  if (engineStateAfterScrub.currentRound !== 32) {
    controller.destroy();
    throw new Error(`Engine round is ${engineStateAfterScrub.currentRound}, expected 32.`);
  }
  if (statusAfterScrub.uiRound !== 32 || statusAfterScrub.engineRound !== 32) {
    controller.destroy();
    throw new Error(`UI / Engine round parity failure at scrubbed round: ui=${statusAfterScrub.uiRound}, engine=${statusAfterScrub.engineRound}`);
  }

  // Assertion 2: Agent states match snapshot 32 bitwise
  let stateMatches = 0;
  snapshot32.agentStates.forEach((state, agentId) => {
    if (engineStateAfterScrub.agentStates.get(agentId) === state) {
      stateMatches++;
    }
  });
  if (stateMatches !== snapshot32.agentStates.size) {
    controller.destroy();
    throw new Error(`Restored agent state mismatch: ${stateMatches} matched out of ${snapshot32.agentStates.size}`);
  }
  console.log(`  ✓ Snapshot state restoration confirmed: ${stateMatches}/${snapshot32.agentStates.size} agent states bitwise equal.`);

  // Assertion 3: Step forward from 32 must advance monotonically to 33
  const nextState = controller.step();
  const roundAfterStep = controller.getStatus().currentRound;
  console.log(`  After step forward from 32: reached round ${roundAfterStep}`);

  if (roundAfterStep !== 33 || nextState?.currentRound !== 33) {
    controller.destroy();
    throw new Error(`Expected step forward from 32 to reach exactly 33, got ${roundAfterStep}`);
  }

  // Assertion 4: Resume playback from 33 smoothly towards 40
  controller.play();
  await sleep(150);
  controller.pause();

  const finalRound = controller.getStatus().currentRound;
  console.log(`  After resuming playback: advanced to round ${finalRound}`);

  if (finalRound <= 33) {
    controller.destroy();
    throw new Error(`Playback failed to continue after jump to 32. Stalled at ${finalRound}`);
  }

  controller.destroy();
  console.log('  ✓ Test 5 Verified: Scrub to Round 32 restored exact snapshot and resumed seamlessly without stalls.');
}
