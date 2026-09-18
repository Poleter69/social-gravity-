/**
 * Social Gravity — Milestone M21.2: Emotion Graph Pipeline Repair Test Suite
 *
 * Validates the complete pipeline repair:
 * 1. EmotionEngine accuracy on benchmark emotion phrases:
 *    - "I hate this." -> Anger (Red #EF4444)
 *    - "This is terrifying." -> Fear (Orange #F97316)
 *    - "Amazing breakthrough!" -> Joy (Green #10B981)
 *    - "Interesting research." -> Curiosity (Blue #06B6D4)
 * 2. Agent Psychological State & Archetype Non-Neutrality (Trait-driven & Content-driven)
 * 3. AdaptiveForceLayout CanvasNode Generation with mandatory EmotionProfile & real colors
 * 4. HeatmapRenderer centralized color mapping fidelity across view modes (no neutral fallback)
 * 5. End-to-End Live Post Ingestion -> Node Inheritance -> DynamicGraph integration
 */

import { EmotionEngine } from '../../src/nlp/emotionEngine';
import { EMOTION_COLOR_MAP, GoEmotionLabel } from '../../src/nlp/types';
import { createInitialPsychologicalState, synthesizeEmotionProfileFromTraits } from '../../src/psychology/defaults';
import { AdaptiveForceLayout } from '../../src/society/canvas/adaptiveLayout';
import { HeatmapRenderer } from '../../src/society/canvas/heatmapRenderer';
import { CanvasNode } from '../../src/society/canvas/types';
import { SocietyGenerator } from '../../src/society/generators/societyGenerator';
import { LiveProcessingPipeline } from '../../src/live/pipeline';
import { LivePost } from '../../src/live/types';
import { DynamicGraph } from '../../src/graph/engine/dynamicGraph';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[M21.2 Assertion Failed] ${message}`);
  }
}

export async function testM21_2EmotionGraphPipeline(): Promise<void> {
  console.log('================================================================');
  console.log('  MILESTONE M21.2: EMOTION GRAPH PIPELINE REPAIR TEST SUITE');
  console.log('================================================================\n');

  const engine = EmotionEngine.getInstance();

  // ---------------------------------------------------------------------------
  // 1. EmotionEngine Benchmark Prediction & Required Color Mapping
  // ---------------------------------------------------------------------------
  console.log('1. Testing EmotionEngine Prediction & Color Mapping on Benchmark Signals...');

  const benchmarks = [
    {
      text: 'I hate this.',
      expectedEmotion: 'anger' as GoEmotionLabel,
      expectedColor: '#EF4444',
      description: 'Anger / Disapproval cue',
    },
    {
      text: 'This is terrifying.',
      expectedEmotion: 'fear' as GoEmotionLabel,
      expectedColor: '#F97316',
      description: 'Fear / Panic cue',
    },
    {
      text: 'Amazing breakthrough!',
      expectedEmotion: 'joy' as GoEmotionLabel,
      expectedColor: '#10B981',
      description: 'Joy / Triumph cue',
    },
    {
      text: 'Interesting research.',
      expectedEmotion: 'curiosity' as GoEmotionLabel,
      expectedColor: '#06B6D4',
      description: 'Curiosity / Inquiry cue',
    },
  ];

  for (const item of benchmarks) {
    const profile = engine.predictSync(item.text);
    console.log(`  - "${item.text}" -> ${profile.primaryEmotion} (${(profile.confidence * 100).toFixed(1)}%)`);

    assert(
      profile.primaryEmotion === item.expectedEmotion,
      `Expected "${item.text}" to predict '${item.expectedEmotion}', got '${profile.primaryEmotion}'`
    );
    assert(
      profile.primaryEmotion !== 'neutral',
      `"${item.text}" must NEVER be classified as neutral`
    );

    const color = EMOTION_COLOR_MAP[profile.primaryEmotion];
    assert(
      color === item.expectedColor,
      `Expected color for ${item.expectedEmotion} to be ${item.expectedColor}, got ${color}`
    );
  }

  // Verify genuine neutral is still respected when text is genuinely neutral
  const genuineNeutral = engine.predictSync('The scheduled report timestamp is normal.');
  console.log(`  - Genuinely neutral text -> ${genuineNeutral.primaryEmotion} (${(genuineNeutral.confidence * 100).toFixed(1)}%)`);
  assert(
    genuineNeutral.primaryEmotion === 'neutral',
    `Genuinely neutral text should predict neutral, got ${genuineNeutral.primaryEmotion}`
  );
  assert(
    EMOTION_COLOR_MAP[genuineNeutral.primaryEmotion] === '#64748B',
    'Neutral color must be #64748B'
  );

  // ---------------------------------------------------------------------------
  // 2. Trait-Driven Emotion Profile Generation (No Empty Defaults)
  // ---------------------------------------------------------------------------
  console.log('\n2. Testing Trait-Driven Emotion Profile Synthesis...');

  const highFearTraits = {
    trust: 0.15,
    riskTolerance: 0.1,
    influence: 0.2,
    conformity: 0.6,
  };
  const fearProfile = synthesizeEmotionProfileFromTraits(highFearTraits);
  assert(
    fearProfile.primaryEmotion === 'fear' || fearProfile.primaryEmotion === 'anger' || fearProfile.primaryEmotion === 'nervousness',
    `Low trust/risk traits must yield vigilant emotion, got ${fearProfile.primaryEmotion}`
  );
  assert(fearProfile.primaryEmotion !== 'neutral', 'Vigilant traits must not be neutral');
  assert(fearProfile.topEmotions.length >= 3, 'Top emotions breakdown must have at least 3 entries');

  const highInfluenceTraits = {
    trust: 0.85,
    riskTolerance: 0.8,
    influence: 0.9,
    conformity: 0.2,
  };
  const influenceProfile = synthesizeEmotionProfileFromTraits(highInfluenceTraits);
  assert(
    influenceProfile.primaryEmotion === 'pride' || 
    influenceProfile.primaryEmotion === 'admiration' || 
    influenceProfile.primaryEmotion === 'joy' || 
    influenceProfile.primaryEmotion === 'curiosity' ||
    influenceProfile.primaryEmotion === 'optimism',
    `High influence/trust traits must yield constructive emotion, got ${influenceProfile.primaryEmotion}`
  );

  const state = createInitialPsychologicalState(highFearTraits);
  assert(state.emotionProfile !== undefined, 'Initial psychological state must include emotionProfile');
  assert(state.emotionProfile?.primaryEmotion !== 'neutral', 'Initial psychological state must not be neutral');

  // ---------------------------------------------------------------------------
  // 3. AdaptiveForceLayout: Mandatory Emotion & Real Colors in Graph Nodes
  // ---------------------------------------------------------------------------
  console.log('\n3. Testing AdaptiveForceLayout CanvasNode Generation...');

  const generator = new SocietyGenerator();
  const society = generator.generate({
    name: 'Online Forum Test',
    archetype: 'online_community',
    populationSize: 25,
    seed: 42,
  });

  const layout = AdaptiveForceLayout.computeLayout(society);
  assert(layout.nodes.length === 25, `Expected 25 nodes, got ${layout.nodes.length}`);

  let nonNeutralCount = 0;
  for (const node of layout.nodes) {
    assert(node.emotion !== undefined, `Node ${node.id} must have an emotion`);
    assert(node.emotionConfidence > 0, `Node ${node.id} must have positive confidence`);
    assert(node.emotionProfile !== undefined, `Node ${node.id} must have emotionProfile attached`);

    const expectedNodeColor = EMOTION_COLOR_MAP[node.emotion as GoEmotionLabel];
    assert(
      node.color === expectedNodeColor,
      `Node ${node.id} color must match EMOTION_COLOR_MAP[${node.emotion}], expected ${expectedNodeColor}, got ${node.color}`
    );

    if (node.emotion !== 'neutral') {
      nonNeutralCount++;
      assert(
        node.color !== '#64748B',
        `Non-neutral node ${node.id} (${node.emotion}) must not have neutral gray color`
      );
    }
  }

  console.log(`  - Non-neutral nodes generated: ${nonNeutralCount} / ${layout.nodes.length} (${((nonNeutralCount / layout.nodes.length) * 100).toFixed(0)}%)`);
  assert(nonNeutralCount > 0.8 * layout.nodes.length, 'At least 80% of nodes in archetype society must be non-neutral');

  // ---------------------------------------------------------------------------
  // 4. HeatmapRenderer Centralized Color Mapping Across ViewModes
  // ---------------------------------------------------------------------------
  console.log('\n4. Testing HeatmapRenderer Node Color Logic Across ViewModes...');

  const sampleNode: CanvasNode = {
    id: 'test-node-1',
    label: 'Test Node',
    communityId: 'c1',
    communityName: 'Tech',
    communityColor: '#38BDF8',
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    vx: 0,
    vy: 0,
    radius: 6.5,
    baseRadius: 6.5,
    color: '#EF4444',
    isInfluencer: false,
    isBridge: false,
    isPatientZero: false,
    emotion: 'anger',
    emotionConfidence: 0.92,
    emotionProfile: engine.predictSync('I hate this.'),
    riskLevel: 'high',
    riskScore: 0.65,
    source: 'x',
    metrics: { degree: 3 },
    traits: { trust: 0.3, influence: 0.5, conformity: 0.4, riskTolerance: 0.5 },
    bornAt: Date.now(),
    scaleFactor: 1.0,
    opacity: 1.0,
    pulseTimer: 0,
  };

  const networkColor = HeatmapRenderer.getNodeColorForMode(sampleNode, 'network');
  assert(networkColor === '#EF4444', `In network mode, anger node must be #EF4444, got ${networkColor}`);

  const emotionColor = HeatmapRenderer.getNodeColorForMode(sampleNode, 'emotion');
  assert(emotionColor === '#EF4444', `In emotion mode, anger node must be #EF4444, got ${emotionColor}`);

  const riskColor = HeatmapRenderer.getNodeColorForMode(sampleNode, 'risk');
  assert(riskColor === '#F97316', `In risk mode, high risk node must be #F97316, got ${riskColor}`);

  const communityColor = HeatmapRenderer.getNodeColorForMode(sampleNode, 'community');
  assert(communityColor === '#38BDF8', `In community mode, node must be communityColor, got ${communityColor}`);

  // ---------------------------------------------------------------------------
  // 5. Live Signal Pipeline & Graph Node Ingestion
  // ---------------------------------------------------------------------------
  console.log('\n5. Testing Live Signal Pipeline -> Node Ingestion...');

  const pipeline = new LiveProcessingPipeline();

  const livePosts: LivePost[] = [
    {
      id: 'post-hate',
      platform: 'x',
      authorId: 'author-user-1',
      authorName: 'Alex Mercer',
      content: 'I hate this.',
      timestamp: Date.now(),
    },
    {
      id: 'post-fear',
      platform: 'reddit',
      authorId: 'author-user-2',
      authorName: 'Sarah Connor',
      content: 'This is terrifying.',
      timestamp: Date.now(),
    },
    {
      id: 'post-joy',
      platform: 'bluesky',
      authorId: 'author-user-3',
      authorName: 'Dr. Ellie',
      content: 'Amazing breakthrough!',
      timestamp: Date.now(),
    },
    {
      id: 'post-curiosity',
      platform: 'rss',
      authorId: 'author-user-4',
      authorName: 'Tech Wire',
      content: 'Interesting research.',
      timestamp: Date.now(),
    },
  ];

  const processed = livePosts.map(p => pipeline.process(p)!);
  assert(processed.length === 4, 'All 4 posts must be processed without rejection');

  assert(processed[0].emotion.dominant === 'anger', `post-hate must be anger, got ${processed[0].emotion.dominant}`);
  assert(EMOTION_COLOR_MAP[processed[0].emotion.dominant] === '#EF4444', 'post-hate color must be #EF4444');

  assert(processed[1].emotion.dominant === 'fear', `post-fear must be fear, got ${processed[1].emotion.dominant}`);
  assert(EMOTION_COLOR_MAP[processed[1].emotion.dominant] === '#F97316', 'post-fear color must be #F97316');

  assert(processed[2].emotion.dominant === 'joy', `post-joy must be joy, got ${processed[2].emotion.dominant}`);
  assert(EMOTION_COLOR_MAP[processed[2].emotion.dominant] === '#10B981', 'post-joy color must be #10B981');

  assert(processed[3].emotion.dominant === 'curiosity', `post-curiosity must be curiosity, got ${processed[3].emotion.dominant}`);
  assert(EMOTION_COLOR_MAP[processed[3].emotion.dominant] === '#06B6D4', 'post-curiosity color must be #06B6D4');

  // ---------------------------------------------------------------------------
  // 6. DynamicGraph Node Emotion Storage
  // ---------------------------------------------------------------------------
  console.log('\n6. Testing DynamicGraph DynamicNode Emotion Storage...');

  const dynamicGraph = new DynamicGraph(1337);
  dynamicGraph.addNode({
    id: 'live-node-test',
    communityId: 'community-tech',
    emotionProfile: processed[2].emotion.profile,
    dominantEmotion: processed[2].emotion.dominant,
  });

  const retrieved = dynamicGraph.getNode('live-node-test');
  assert(retrieved !== undefined, 'Dynamic node must exist');
  assert(retrieved?.dominantEmotion === 'joy', `Expected joy, got ${retrieved?.dominantEmotion}`);
  assert(retrieved?.emotionProfile?.primaryEmotion === 'joy', 'EmotionProfile must be preserved');

  console.log('\n================================================================');
  console.log('  MILESTONE M21.2: EMOTION GRAPH PIPELINE REPAIR PASSED (100%)');
  console.log('================================================================\n');
}
