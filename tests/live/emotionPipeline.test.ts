/**
 * Social Gravity — Milestone M21.4: Live Stream Verification Protocol
 * Phase 4 & Phase 5: Emotion Accuracy & Live Multi-Color Graph Test Suite
 *
 * Validates:
 * 1. Known sentence benchmark accuracy (Anger, Fear, Joy, Curiosity, Sadness)
 * 2. Zero improper "Neutral" fallback classifications
 * 3. Color mapping consistency across Feed Label, Node Color, and Graph Rendering
 * 4. Capturing >= 5 Anger, >= 5 Fear, >= 5 Joy, and >= 5 Curiosity nodes simultaneously
 */

import { EmotionEngine } from '../../src/nlp/emotionEngine';
import { EMOTION_COLOR_MAP } from '../../src/nlp/types';
import { CanvasNode } from '../../src/society/canvas/types';
import { LiveProcessingPipeline } from '../../src/live/pipeline';
import { LivePost } from '../../src/live/types';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[Phase 4/5 Emotion Pipeline Failed] ${message}`);
  }
}

export async function testEmotionPipeline(): Promise<void> {
  console.log('================================================================');
  console.log('  M21.4 — PHASE 4 & 5: EMOTION ACCURACY & LIVE TEST SUITE');
  console.log('================================================================\n');

  const engine = EmotionEngine.getInstance();
  const pipeline = LiveProcessingPipeline.getInstance();

  // ---------------------------------------------------------------------------
  // Phase 4: Known Sentence Benchmark Accuracy
  // ---------------------------------------------------------------------------
  console.log('1. Testing Known Benchmark Sentences against Emotion Pipeline...');

  interface EmotionTestCase {
    input: string;
    expectedEmotion: string;
    expectedHexColor: string;
  }

  const testCases: EmotionTestCase[] = [
    { input: 'I hate this.', expectedEmotion: 'anger', expectedHexColor: EMOTION_COLOR_MAP.anger },
    { input: "I'm terrified.", expectedEmotion: 'fear', expectedHexColor: EMOTION_COLOR_MAP.fear },
    { input: 'Amazing breakthrough!', expectedEmotion: 'joy', expectedHexColor: EMOTION_COLOR_MAP.joy },
    { input: 'Interesting research.', expectedEmotion: 'curiosity', expectedHexColor: EMOTION_COLOR_MAP.curiosity },
    { input: 'This is heartbreaking.', expectedEmotion: 'sadness', expectedHexColor: EMOTION_COLOR_MAP.sadness },
  ];

  for (const tc of testCases) {
    const profile = await engine.predict(tc.input);
    const dominant = profile.dominant || profile.dominantEmotion || profile.primaryEmotion;
    const assignedColor = EMOTION_COLOR_MAP[dominant] || '#38BDF8';

    console.log(
      `  Input: "${tc.input.padEnd(24)}" -> Dominant: ${dominant.padEnd(10)} (${(profile.confidence * 100).toFixed(1)}%) | Color: ${assignedColor}`
    );

    assert(
      dominant === tc.expectedEmotion,
      `Expected "${tc.expectedEmotion}" for "${tc.input}", got "${dominant}"`
    );
    assert(
      dominant !== 'neutral',
      `FAIL: Benchmark sentence "${tc.input}" must never fall back to Neutral!`
    );
    assert(
      assignedColor === tc.expectedHexColor,
      `Expected color ${tc.expectedHexColor} for ${tc.expectedEmotion}, got ${assignedColor}`
    );

    // Verify through LiveProcessingPipeline
    const dummyPost: LivePost = {
      id: `benchmark-${tc.expectedEmotion}-${Date.now()}`,
      platform: 'x',
      authorId: 'test_author',
      authorName: 'Test Author',
      content: tc.input,
      timestamp: Date.now(),
    };
    const processed = pipeline.process(dummyPost);
    assert(
      processed !== null && processed.emotion.dominant === tc.expectedEmotion,
      `LiveProcessingPipeline must preserve dominant emotion ${tc.expectedEmotion}`
    );
  }

  console.log('  ✓ Phase 4 Verified: 100% accuracy on benchmark sentences with zero neutral fallbacks.');

  // ---------------------------------------------------------------------------
  // Phase 5: Live Emotion Multi-Color Graph Composition
  // ---------------------------------------------------------------------------
  console.log('\n2. Testing Multi-Color Graph Node Generation (>= 5 nodes per key emotion)...');

  const incomingSignals = [
    // Anger signals (5 distinct posts)
    { text: 'I hate this corrupt and deceitful system.', target: 'anger' },
    { text: 'I am so furious and enraged right now.', target: 'anger' },
    { text: 'Pure rage and anger at this decision.', target: 'anger' },
    { text: 'I despise and loathe these actions.', target: 'anger' },
    { text: 'This makes me so mad and angry.', target: 'anger' },

    // Fear signals (5 distinct posts)
    { text: 'I am terrified and full of fear.', target: 'fear' },
    { text: 'This is terrifying and horrifying.', target: 'fear' },
    { text: 'Extreme panic and danger in this sector.', target: 'fear' },
    { text: 'Emergency alarm: severe catastrophe and doom.', target: 'fear' },
    { text: 'So scared of the imminent collapse.', target: 'fear' },

    // Joy signals (5 distinct posts)
    { text: 'Amazing breakthrough announced today!', target: 'joy' },
    { text: 'Pure happiness and joy everywhere.', target: 'joy' },
    { text: 'Celebrating this victory with great delight.', target: 'joy' },
    { text: 'Complete bliss and happy moments.', target: 'joy' },
    { text: 'Such a cheerful and happy occasion.', target: 'joy' },

    // Curiosity signals (5 distinct posts)
    { text: 'I am so curious to know what happened.', target: 'curiosity' },
    { text: 'Fascinating research published this morning.', target: 'curiosity' },
    { text: 'An interesting mystery that needs study.', target: 'curiosity' },
    { text: 'I wonder what the investigation will find.', target: 'curiosity' },
    { text: 'Exploring this puzzle and researching the clues.', target: 'curiosity' },
  ];

  const graphNodes: CanvasNode[] = [];
  const emotionCounters: Record<string, number> = {
    anger: 0,
    fear: 0,
    joy: 0,
    curiosity: 0,
  };

  incomingSignals.forEach((sig, idx) => {
    const profile = engine.predictSync(sig.text);
    const dominant = profile.dominant || profile.dominantEmotion || profile.primaryEmotion;
    const color = EMOTION_COLOR_MAP[dominant] || '#38BDF8';

    if (emotionCounters[dominant] !== undefined) {
      emotionCounters[dominant]++;
    }

    const node: CanvasNode = {
      id: `live-node-${idx}`,
      label: `Agent-${idx}`,
      communityId: dominant,
      communityName: dominant.toUpperCase(),
      communityColor: color,
      x: 100 + (idx % 5) * 40,
      y: 100 + Math.floor(idx / 5) * 40,
      targetX: 100 + (idx % 5) * 40,
      targetY: 100 + Math.floor(idx / 5) * 40,
      vx: 0,
      vy: 0,
      radius: 6.0,
      baseRadius: 6.0,
      color: color,
      isInfluencer: false,
      isBridge: false,
      isPatientZero: false,
      emotion: dominant,
      emotionConfidence: profile.confidence,
      metrics: { degree: 1 },
      traits: { trust: 0.8, influence: 0.5, conformity: 0.5, riskTolerance: 0.5 },
      bornAt: Date.now(),
      scaleFactor: 1.0,
      opacity: 1.0,
    };
    graphNodes.push(node);
  });

  console.log('  Live Multi-Color Node Count:');
  console.log(`    Anger Nodes:     ${emotionCounters.anger} (Target: >= 5)`);
  console.log(`    Fear Nodes:      ${emotionCounters.fear} (Target: >= 5)`);
  console.log(`    Joy Nodes:       ${emotionCounters.joy} (Target: >= 5)`);
  console.log(`    Curiosity Nodes: ${emotionCounters.curiosity} (Target: >= 5)`);

  assert(emotionCounters.anger >= 5, `Must have at least 5 anger nodes, got ${emotionCounters.anger}`);
  assert(emotionCounters.fear >= 5, `Must have at least 5 fear nodes, got ${emotionCounters.fear}`);
  assert(emotionCounters.joy >= 5, `Must have at least 5 joy nodes, got ${emotionCounters.joy}`);
  assert(emotionCounters.curiosity >= 5, `Must have at least 5 curiosity nodes, got ${emotionCounters.curiosity}`);

  // Confirm multi-color diversity in canvas node pool
  const uniqueColors = new Set(graphNodes.map((n) => n.color));
  assert(uniqueColors.size >= 4, `Canvas must contain multiple distinct colors simultaneously (found ${uniqueColors.size})`);

  console.log(`  ✓ Multi-color graph verified: ${uniqueColors.size} distinct emotion colors rendered simultaneously.\n`);
}
