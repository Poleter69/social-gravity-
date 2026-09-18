/**
 * Social Gravity — M22.1: Replay Engine Desynchronization Verification Suite Runner
 * Executes all 5 test scenarios:
 * 1. Full replay 1..40 without early termination
 * 2. Frame-by-frame UI & Engine round synchronization
 * 3. Pause at round 17 with zero drift
 * 4. Resume from paused round to 18
 * 5. Scrub jump to round 32 with snapshot restoration and smooth resumption
 */

import { testFullReplay } from './fullReplay.test';
import { testRoundSync } from './roundSync.test';
import { testPauseResume } from './pauseResume.test';
import { testTimelineJump } from './timelineJump.test';

export async function testM22_1ReplaySuite(): Promise<void> {
  console.log('========================================================');
  console.log('  MILESTONE M22.1: REPLAY SYNCHRONIZATION TEST SUITE');
  console.log('========================================================\n');

  console.log('--- Test 1: Full Monotonic Replay (1..40) ---');
  await testFullReplay();
  console.log('');

  console.log('--- Test 2: Frame-by-Frame Parity (UI Round === Engine Round) ---');
  await testRoundSync();
  console.log('');

  console.log('--- Test 3 & 4: Deterministic Pause (t=17) & Resume (t=18) ---');
  await testPauseResume();
  console.log('');

  console.log('--- Test 5: Snapshot Jump (t=32) & Forward Resumption ---');
  await testTimelineJump();
  console.log('');

  console.log('========================================================');
  console.log('  MILESTONE M22.1: REPLAY SUITE PASSED (100% PARITY)');
  console.log('========================================================\n');
}
