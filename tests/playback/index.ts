/**
 * Social Gravity — M22: Playback Control System Test Suite Runner
 */

import { testPlayContinuity } from './playContinuity.test';
import { testPauseResume } from './pauseResume.test';
import { testRoundSync } from './roundSync.test';
import { testTimelineSync } from './timelineSync.test';
import { testSpeedControl } from './speedControl.test';
import { testLivePlayback } from './livePlayback.test';

export async function testPlaybackSuite(): Promise<void> {
  console.log('========================================================');
  console.log('  MILESTONE M22: PLAYBACK CONTROL SYSTEM TEST SUITE');
  console.log('========================================================\n');

  console.log('--- Phase 1: Continuous Playback Loop ---');
  await testPlayContinuity();
  console.log('');

  console.log('--- Phase 2: Deterministic Pause & Resume ---');
  await testPauseResume();
  console.log('');

  console.log('--- Phase 3: Round Counter & Telemetry Synchronization ---');
  await testRoundSync();
  console.log('');

  console.log('--- Phase 4: Timeline Scrubbing & Snapshot Sync ---');
  await testTimelineSync();
  console.log('');

  console.log('--- Phase 5: Speed Multiplier Adaptation (0.5×–8×) ---');
  await testSpeedControl();
  console.log('');

  console.log('--- Phase 6: Full Playback & Lifecycle Completion ---');
  await testLivePlayback();
  console.log('');

  console.log('========================================================');
  console.log('  MILESTONE M22: PLAYBACK CONTROL SYSTEM PASSED (100%)');
  console.log('========================================================\n');
}
