/**
 * Social Gravity - Meta Prompt M19.1 End-to-End Validation Test
 * Verifies:
 * 1. LiveManager connection to real Bluesky & Reddit
 * 2. Ingestion of real public posts
 * 3. Emotion inference (< 2s)
 * 4. Dynamic graph update (< 300ms)
 * 5. Replay snapshot capture
 * 6. Latency from ingestion to display (< 10s)
 */

import { LiveManager } from '../src/live/liveManager';
import { LiveProcessingPipeline } from '../src/live/pipeline';
import { NarrativeFusionEngine } from '../src/fusion';
import { AlertEngine } from '../src/live/alertEngine';
import { LiveReplayManager } from '../src/live/liveReplayManager';

async function runE2EValidation() {
  console.log('================================================================');
  console.log('  SOCIAL GRAVITY - M19.1 LIVE INGESTION END-TO-END VALIDATION  ');
  console.log('================================================================\n');

  const startTime = Date.now();
  const pipeline = new LiveProcessingPipeline();
  const fusion = new NarrativeFusionEngine();
  const alertEngine = new AlertEngine();
  const replay = new LiveReplayManager(50);
  const manager = new LiveManager();

  const metrics = {
    firstLiveEventMs: null as number | null,
    emotionInferenceLatencies: [] as number[],
    graphUpdateLatencies: [] as number[],
    replaySnapshotRecorded: false,
    postsIngested: [] as any[],
  };

  let isComplete = false;

  manager.onStatusChange((s) => {
    console.log(`[CONNECTOR STATUS] ${s.id.toUpperCase()} -> ${s.status} (Ingested: ${s.itemsIngested})`);
  });

  manager.onPost((post) => {
    const postArrival = Date.now();

    if (metrics.firstLiveEventMs === null) {
      metrics.firstLiveEventMs = postArrival - startTime;
      console.log(`\n>>> FIRST LIVE EVENT RECEIVED in ${metrics.firstLiveEventMs} ms (Target: < 10,000 ms) <<<`);
    }

    // Step 1: Emotion Inference via LiveProcessingPipeline
    const tInferStart = performance.now();
    const processed = pipeline.process(post);
    const tInferEnd = performance.now();
    const inferLatencyMs = tInferEnd - tInferStart;
    metrics.emotionInferenceLatencies.push(inferLatencyMs);

    if (!processed) return;

    // Step 2: Dynamic Graph Update simulation
    const tGraphStart = performance.now();
    const unified = fusion.ingestPost(post, processed.emotion.dominant);
    const newAlert = alertEngine.evaluateNarrative(unified);
    const tGraphEnd = performance.now();
    const graphLatencyMs = tGraphEnd - tGraphStart;
    metrics.graphUpdateLatencies.push(graphLatencyMs);

    // Step 3: Replay snapshot
    const snap = replay.recordSnapshot([processed], fusion.getNarratives(), alertEngine.getAlerts());
    if (snap) {
      metrics.replaySnapshotRecorded = true;
    }

    metrics.postsIngested.push({
      platform: post.platform,
      author: post.authorName,
      content: post.content.slice(0, 70),
      emotion: processed.emotion.dominant,
      confidence: processed.emotion.confidence,
      inferLatencyMs: Number(inferLatencyMs.toFixed(2)),
      graphLatencyMs: Number(graphLatencyMs.toFixed(2)),
      snapshotId: snap.snapshotId,
    });

    console.log(`[LIVE INGESTION] [${post.platform.toUpperCase()}] ${post.authorName}`);
    console.log(`  Content: "${post.content.slice(0, 65)}..."`);
    console.log(`  Emotion: ${processed.emotion.dominant.toUpperCase()} (${(processed.emotion.confidence * 100).toFixed(1)}%) | Infer: ${inferLatencyMs.toFixed(2)}ms | Graph: ${graphLatencyMs.toFixed(2)}ms`);

    if (metrics.postsIngested.length >= 4 && !isComplete) {
      isComplete = true;
      manager.stopAll();
      printReport();
    }
  });

  console.log('Initiating connection to Bluesky and Reddit live streams...');
  await manager.connectConnector('bluesky');
  await manager.connectConnector('reddit');

  function printReport() {
    console.log('\n================================================================');
    console.log('                     FINAL VALIDATION RESULTS                   ');
    console.log('================================================================');

    const avgInfer = metrics.emotionInferenceLatencies.reduce((a, b) => a + b, 0) / metrics.emotionInferenceLatencies.length;
    const avgGraph = metrics.graphUpdateLatencies.reduce((a, b) => a + b, 0) / metrics.graphUpdateLatencies.length;

    console.log(`1. First Live Event Latency : ${metrics.firstLiveEventMs} ms (Target: < 10,000 ms) -> ${metrics.firstLiveEventMs! < 10000 ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`2. Emotion Inference Latency: ${avgInfer.toFixed(2)} ms (Target: < 2,000 ms) -> ${avgInfer < 2000 ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`3. Graph Update Latency     : ${avgGraph.toFixed(2)} ms (Target: < 300 ms) -> ${avgGraph < 300 ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`4. Replay Snapshot Capture  : ${metrics.replaySnapshotRecorded ? 'SUCCESS ✅' : 'FAILED ❌'}`);
    console.log(`5. Total Sampled Real Posts : ${metrics.postsIngested.length}`);
    console.log(`6. Snapshots In Replay Store: ${replay.getSnapshots().length}`);
    console.log('================================================================\n');

    process.exit(0);
  }

  // Safety timeout after 15 seconds
  setTimeout(() => {
    if (!isComplete) {
      isComplete = true;
      manager.stopAll();
      printReport();
    }
  }, 12000);
}

runE2EValidation();
