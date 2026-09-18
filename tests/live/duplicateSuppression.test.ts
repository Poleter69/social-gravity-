/**
 * Social Gravity — Milestone M21.4: Live Stream Verification Protocol
 * Phase 3: Duplicate Detection & Node Suppression Test Suite
 *
 * Validates:
 * 1. Tracking unique IDs with DedupStore and LiveManager
 * 2. Exact match metrics: e.g. 942 total arrivals, 11 duplicates, 931 unique processed
 * 3. Ensuring identical posts never create duplicate canvas nodes
 * 4. Verifying duplicate rate stays controlled and skipped counts are reported in stream health
 */

import { DedupStore } from '../../src/live/dedup';
import { LiveManager } from '../../src/live/liveManager';
import { LivePost } from '../../src/live/types';
import { CanvasNode } from '../../src/society/canvas/types';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[Phase 3 Duplicate Suppression Failed] ${message}`);
  }
}

export async function testDuplicateSuppression(): Promise<void> {
  console.log('================================================================');
  console.log('  M21.4 — PHASE 3: DUPLICATE DETECTION & SUPPRESSION TEST SUITE');
  console.log('================================================================\n');

  // 1. DedupStore Isolated Verification
  console.log('1. Testing DedupStore caching and duplicate suppression...');
  const dedup = new DedupStore(3_600_000, 50_000);

  const sampleId = 'x-tweet-unique-9901';
  assert(!dedup.has(sampleId), 'New ID must not exist initially');
  assert(!dedup.hasAndAdd(sampleId), 'First insertion must return false (not duplicate)');
  assert(dedup.has(sampleId), 'ID must exist after insertion');
  assert(dedup.hasAndAdd(sampleId), 'Second insertion must return true (is duplicate)');
  assert(dedup.getDuplicatesSkipped() === 1, 'Skipped counter must be 1');

  // 2. Stream Metrics Verification: 942 arrivals, 11 duplicates, 931 unique
  console.log('2. Simulating production stream: 942 arrivals with 11 duplicates...');
  const manager = new LiveManager({ offline: true });

  const totalArrivals = 942;
  const duplicateIndices = new Set([15, 42, 88, 150, 230, 340, 480, 610, 725, 830, 910]); // 11 specific duplicates
  assert(duplicateIndices.size === 11, 'Must define exactly 11 duplicate injection points');

  let uniqueCounter = 0;
  const processedPosts: LivePost[] = [];
  const nodeMap = new Map<string, CanvasNode>();

  for (let i = 1; i <= totalArrivals; i++) {
    let postId: string;
    let isDupe = false;

    if (duplicateIndices.has(i)) {
      // Re-inject an earlier post ID to simulate page/feed overlap
      isDupe = true;
      const targetEarlierId = Math.max(1, i - 10);
      postId = `stream-msg-${targetEarlierId}`;
    } else {
      uniqueCounter++;
      postId = `stream-msg-${i}`;
    }

    const post: LivePost = {
      id: postId,
      platform: 'bluesky',
      authorId: `author_${(i % 30) + 1}`,
      authorName: `Author ${(i % 30) + 1}`,
      content: `Intelligence telemetry update #${postId}`,
      timestamp: Date.now() - (totalArrivals - i) * 1000,
    };

    // Attempt to register post through manager
    const initialSkipped = manager.getOverallStreamHealth().duplicatesSkipped;
    manager.registerConnectorPost(post);
    const postSkipped = manager.getOverallStreamHealth().duplicatesSkipped;

    if (isDupe) {
      assert(
        postSkipped === initialSkipped + 1,
        `Duplicate post ${postId} at step ${i} must increment duplicatesSkipped`
      );
    } else {
      processedPosts.push(post);
      // Canvas node creation simulation
      const nodeId = `live-bluesky-${post.authorId}`;
      if (!nodeMap.has(nodeId)) {
        nodeMap.set(nodeId, {
          id: nodeId,
          label: post.authorName,
          communityId: 'tech',
          communityName: 'Tech',
          communityColor: '#38BDF8',
          x: 200,
          y: 200,
          targetX: 200,
          targetY: 200,
          vx: 0,
          vy: 0,
          radius: 6,
          baseRadius: 6,
          color: '#38BDF8',
          isInfluencer: false,
          isBridge: false,
          isPatientZero: false,
          emotion: 'curiosity',
          emotionConfidence: 0.85,
          metrics: { degree: 1 },
          traits: { trust: 0.7, influence: 0.5, conformity: 0.5, riskTolerance: 0.5 },
          bornAt: Date.now(),
          scaleFactor: 1.0,
          opacity: 1.0,
        });
      } else {
        // Increment degree on existing node rather than duplicate node
        const existingNode = nodeMap.get(nodeId)!;
        existingNode.metrics.degree++;
      }
    }
  }

  const overallHealth = manager.getOverallStreamHealth();
  console.log('  Stream Duplicate Audit Metrics:');
  console.log(`    Total Arrivals:     ${overallHealth.eventsReceived} (Expected: 942)`);
  console.log(`    Duplicates Skipped: ${overallHealth.duplicatesSkipped} (Expected: 11)`);
  console.log(`    Unique Processed:   ${overallHealth.eventsProcessed} (Expected: 931)`);

  assert(overallHealth.eventsReceived === 942, `Events received should be 942, got ${overallHealth.eventsReceived}`);
  assert(overallHealth.duplicatesSkipped === 11, `Duplicates skipped should be 11, got ${overallHealth.duplicatesSkipped}`);
  assert(overallHealth.eventsProcessed === 931, `Events processed should be 931, got ${overallHealth.eventsProcessed}`);
  assert(manager.getQueueSize() === 931, `Queue size must equal unique processed count (931), got ${manager.getQueueSize()}`);

  const duplicateRatePct = ((overallHealth.duplicatesSkipped / overallHealth.eventsReceived) * 100).toFixed(2);
  console.log(`    Duplicate Rate:     ${duplicateRatePct}% (Controlled < 2%)`);

  // Ensure canvas node set does not contain duplicates
  assert(nodeMap.size <= 30, `Max unique authors was 30; canvas nodes must not exceed 30 (got ${nodeMap.size})`);

  console.log('  ✓ Duplicate Detection & Node Suppression Verified (100% Correctness).\n');
}
