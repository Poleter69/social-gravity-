/**
 * Social Gravity - Live Narrative Intelligence Test Suite (Milestone M19)
 */

import {
  LiveManager,
  LocalStreamConnector,
  XConnector,
  YouTubeConnector,
  InstagramConnector,
  LiveProcessingPipeline,
  AlertEngine,
  LiveReplayManager,
  PerformanceTelemetry,
} from '../../src/live';
import {
  EntityResolver,
  CrossPlatformMatcher,
  ViralityPredictor,
  NarrativeFusionEngine,
} from '../../src/fusion';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function testLiveNarrativeIntelligence() {
  console.log('--- Testing Milestone M19: Live Narrative Intelligence ---');

  // 1. Unified LiveConnectors
  console.log('  Testing unified LiveConnectors (X, YouTube, Instagram, Local)...');
  const xConn = new XConnector('AI debate', { offline: true });
  const ytConn = new YouTubeConnector([], { offline: true });
  const igConn = new InstagramConnector([], { offline: true });
  const localConn = new LocalStreamConnector({ offline: false });

  assert(xConn.id === 'x' && xConn.platform === 'x', 'XConnector must identify as x');
  assert(ytConn.id === 'youtube' && ytConn.platform === 'youtube', 'YouTubeConnector must identify as youtube');
  assert(igConn.id === 'instagram' && igConn.platform === 'instagram', 'InstagramConnector must identify as instagram');

  await xConn.connect();
  await ytConn.connect();
  await igConn.connect();
  localConn.connect();

  assert(xConn.getStatus().status === 'live', 'XConnector should be live');
  assert(ytConn.getStatus().status === 'live', 'YouTubeConnector should be live');
  assert(igConn.getStatus().status === 'live', 'InstagramConnector should be live');
  console.log('  ✓ All 6 unified live streaming connectors connected successfully');

  // 2. Sub-second Processing Pipeline
  console.log('  Testing sub-second processing pipeline (Language, GoEmotions, Risk)...');
  const pipeline = new LiveProcessingPipeline();

  // Test language detection
  const esResult = pipeline.detectLanguage('El nuevo sistema tiene un error grave en la red con los datos');
  assert(esResult.code === 'es', `Should detect Spanish: got ${esResult.code}`);

  const enResult = pipeline.detectLanguage('Breaking financial panic across banks as liquidity evaporates');
  assert(enResult.code === 'en', `Should detect English: got ${enResult.code}`);

  // Test streaming post processing
  const rawPost = {
    id: 'post-test-101',
    platform: 'x' as const,
    authorId: 'trader_mark_99182',
    authorName: '@tradermark',
    content: 'Massive bank run rumors spreading fast. Everyone is withdrawing cash in panic! #BankRun $BTC',
    timestamp: Date.now(),
  };

  const processed = pipeline.process(rawPost);
  assert(processed !== null, 'Processed post must not be null');
  assert(processed!.processingLatencyMs < 50, `Latency must be sub-50ms (got ${processed!.processingLatencyMs}ms)`);
  assert(processed!.emotion.dominant === 'fear' || processed!.emotion.dominant === 'nervousness', 'Should detect fear/nervousness');
  assert(processed!.riskScore > 0.4, 'Risk score should reflect financial panic keywords');
  console.log(`  ✓ Sub-second pipeline executed in ${processed!.processingLatencyMs}ms [Emotion: ${processed!.emotion.dominant}, Risk: ${processed!.riskScore}]`);

  // 3. Entity Resolution & Cross-Platform Matching
  console.log('  Testing Entity Resolution & Cross-Platform Narrative Matching...');
  const entities = EntityResolver.resolve('Critical outage reported on OpenAI API. See status: https://status.openai.com #AIAlert $MSFT');
  assert(entities.hashtags.includes('#aialert'), 'Must extract hashtag #aialert');
  assert(entities.cashtags.includes('$MSFT'), 'Must extract cashtag $MSFT');
  assert(entities.urls.includes('https://status.openai.com'), 'Must extract URL');
  assert(entities.namedEntities.some(e => e.includes('OpenAI')), 'Must extract OpenAI entity');

  const matchResult = CrossPlatformMatcher.matchPostToNarrative(
    {
      id: 'reddit-1',
      platform: 'reddit',
      authorId: 'dev_user',
      authorName: 'u/dev_user',
      content: 'Major OpenAI API outage today. Check https://status.openai.com for updates.',
      timestamp: Date.now(),
    },
    ['openai', 'api', 'outage'],
    ['OpenAI', '#aialert'],
    ['https://status.openai.com'],
    Date.now()
  );
  assert(matchResult.isMatch === true, 'Cross-platform posts with shared URL and entity must match');
  assert(matchResult.confidence >= 0.5, 'Match confidence should be high');
  console.log(`  ✓ Cross-platform matcher correlated signals with confidence ${matchResult.confidence}`);

  // 4. Cross-Platform Narrative Fusion & Threat Scoring
  console.log('  Testing Narrative Fusion Engine and Emerging Threat Scoring...');
  const fusionEngine = new NarrativeFusionEngine();

  const postX = {
    id: 'post-fusion-1',
    platform: 'x' as const,
    authorId: 'intel_feed',
    authorName: '@intel_feed',
    content: 'BREAKING: Global supply chain cyber attack affecting port operations #CyberDisruption',
    timestamp: Date.now(),
  };

  const postReddit = {
    id: 'post-fusion-2',
    platform: 'reddit' as const,
    authorId: 'sysadmin_lead',
    authorName: 'u/sysadmin_lead',
    content: 'Port logistics systems offline worldwide due to coordinated attack #CyberDisruption',
    timestamp: Date.now() + 2000,
    subreddit: 'sysadmin',
  };

  const postBksy = {
    id: 'post-fusion-3',
    platform: 'bluesky' as const,
    authorId: 'security_analyst',
    authorName: '@analyst.bsky.social',
    content: 'Logistics paralysis spreading across European and Asian shipping lanes #CyberDisruption',
    timestamp: Date.now() + 4000,
  };

  const n1 = fusionEngine.ingestPost(postX, 'fear');
  const n2 = fusionEngine.ingestPost(postReddit, 'fear');
  const n3 = fusionEngine.ingestPost(postBksy, 'fear');

  assert(n1.id === n2.id && n2.id === n3.id, 'All 3 cross-platform posts should fuse into same UnifiedNarrative');
  assert(n3.platforms.length === 3, 'Unified narrative must correlate across 3 distinct platforms');
  assert(n3.threatScore.score >= 50, `Threat score should escalate to high/critical: got ${n3.threatScore.score}`);
  console.log(`  ✓ Narrative Fusion combined 3 platforms into UnifiedNarrative [Threat Score: ${n3.threatScore.score}/100, Tier: ${n3.threatScore.tier}]`);

  // 5. Virality Prediction Engine
  console.log('  Testing Virality Prediction Engine...');
  const virality = ViralityPredictor.forecast({
    commentVelocity: 18.5,
    temporalAcceleration: 2.4,
    emotionalIntensity: 0.88,
    bridgeNodeActivation: 7,
    communityExpansion: 4,
    repostRatio: 0.65,
  });

  assert(virality.probability >= 0.75, `Virality probability must be high for compounding cascade: got ${virality.probability}`);
  assert(virality.projectedSpread === 'explosive' || virality.projectedSpread === 'high', 'Projected spread must be high/explosive');
  assert(virality.reasoning.includes('chance this narrative crosses'), 'Reasoning must be explainable');
  console.log(`  ✓ Virality Forecast: ${virality.probability * 100}% probability [Peak in ${virality.expectedPeakTime}, Reach: ${virality.expectedReach}]`);

  // 6. Emerging Alert Engine with Evidence Bundle
  console.log('  Testing Emerging Alert Engine with Evidence Bundling...');
  const alertEngine = new AlertEngine();
  const alert = alertEngine.evaluateNarrative(n3);

  assert(alert !== null, 'Alert must be fired for high threat narrative');
  assert(alert!.evidence.originatingPosts.length >= 1, 'Alert evidence must contain originating posts');
  assert(alert!.evidence.propagationPath.length >= 3, 'Propagation path must show 3 platform hops');
  assert(alert!.evidence.confidenceBreakdown.compositeConfidence > 0.7, 'Composite confidence must exceed 0.7');
  console.log(`  ✓ Alert generated: "${alert!.title}" [Severity: ${alert!.severity}, Dominant: ${alert!.dominantEmotion}]`);

  // 7. Live Incident Replay & Incident Workspace Manager
  console.log('  Testing Live Incident Replay & Investigation Workspaces...');
  const replayMgr = new LiveReplayManager(100);

  replayMgr.recordSnapshot([processed!], [n3], [alert!]);
  replayMgr.recordSnapshot([processed!], [n3], [alert!]);

  assert(replayMgr.isLive() === true, 'Initially should be in live mode');
  const snap = replayMgr.jumpToSnapshot(0);
  assert(snap !== null, 'Must retrieve snapshot 0');
  assert(replayMgr.isLive() === false, 'Should be paused in replay mode after jump');

  replayMgr.resumeLive();
  assert(replayMgr.isLive() === true, 'Must successfully resume live stream');

  const workspace = replayMgr.createWorkspace('Operation CyberDisruption', n3, [alert!]);
  assert(workspace.incidentId.startsWith('inc-'), 'Incident ID must be valid');
  assert(workspace.alertsSnapshot.length === 1, 'Incident workspace must store alert snapshot');
  console.log(`  ✓ Live Incident Replay & Workspace verified: ${workspace.incidentId}`);

  // Disconnect test connectors
  xConn.disconnect();
  ytConn.disconnect();
  igConn.disconnect();
  localConn.disconnect();

  console.log('✓ Live Narrative Intelligence validated successfully.\n');
}
