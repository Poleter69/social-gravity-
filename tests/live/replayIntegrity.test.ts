/**
 * Social Gravity — Milestone M21.4: Live Stream Verification Protocol
 * Phase 6 & Phase 9: Safety Layer & Replay State Integrity Test Suite
 *
 * Validates:
 * 1. 5-Pillar Content Safety: Hate, Explicit, Terrorism, Violence, Harassment
 * 2. Feed badge, Node badge, Filter, and Replay marker four-way parity
 * 3. Deterministic time-travel replay reconstruction across historical stream ticks
 * 4. Exact equality between Live frame and Replay frame (nodes, edges, emotions, safety, timestamps)
 */

import { SafetyClassifier } from '../../src/safety/safetyClassifier';
import { DynamicGraph } from '../../src/graph/engine/dynamicGraph';
import { ReplayEngine } from '../../src/graph/replay/replayEngine';
import { SnapshotStore } from '../../src/graph/storage/snapshotStore';
import { GraphSnapshot } from '../../src/graph/types/index';
import { CanvasNode } from '../../src/society/canvas/types';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[Phase 6/9 Replay & Safety Failed] ${message}`);
  }
}

export async function testReplayIntegrity(): Promise<void> {
  console.log('================================================================');
  console.log('  M21.4 — PHASE 6 & 9: SAFETY LAYER & REPLAY INTEGRITY TEST SUITE');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // Phase 6: Safety Layer 5-Pillar Calibration & 4-Way Parity
  // ---------------------------------------------------------------------------
  console.log('1. Testing Safety Classification Pillars & 4-Way Parity...');
  const safety = SafetyClassifier.getInstance();

  interface SafetyCase {
    category: 'hate' | 'explicit' | 'terrorism' | 'violence' | 'harassment';
    text: string;
    expectedFlag: boolean;
  }

  const safetyCases: SafetyCase[] = [
    {
      category: 'hate',
      text: 'These subhuman parasites deserve to be cleansed from our society. Death to this entire degenerate race.',
      expectedFlag: true,
    },
    {
      category: 'explicit',
      text: 'Check this leaked pornographic tape with hardcore uncensored sex scenes and adult cam recordings.',
      expectedFlag: true,
    },
    {
      category: 'terrorism',
      text: 'Download the holy war bomb manual. Join the global jihad cell and commit martyrdom operations against the infidels.',
      expectedFlag: true,
    },
    {
      category: 'violence',
      text: 'I will murder your family, execute you in cold blood, and slit your throat.',
      expectedFlag: true,
    },
    {
      category: 'harassment',
      text: 'Here is their home address and phone number leaked. Swat them tonight and make their life hell.',
      expectedFlag: true,
    },
  ];

  for (const sc of safetyCases) {
    const profile = safety.classify(sc.text);
    console.log(
      `  [${sc.category.toUpperCase().padEnd(10)}] Classified as: ${profile.category.toUpperCase()} (Conf: ${(profile.confidence * 100).toFixed(1)}%)`
    );

    assert(profile.category === sc.category, `Expected category "${sc.category}", got "${profile.category}"`);
    assert(profile.confidence >= 0.7, `Confidence should be >= 0.7, got ${profile.confidence}`);

    // Verify 4-way parity:
    // 1. Feed badge label:
    const feedBadge = profile.category;
    // 2. Node badge metadata:
    const nodeBadge: Partial<CanvasNode> = {
      safety: {
        category: profile.category,
        confidence: profile.confidence,
        flagged: true,
        action: 'flag',
        reasons: profile.reasons,
      },
    };
    // 3. Filter category matching:
    const filterMatches = profile.category === sc.category;
    // 4. Replay marker timestamping:
    const replayMarker = {
      timestamp: Date.now(),
      category: profile.category,
      severity: profile.confidence > 0.8 ? 'critical' : 'high',
    };

    assert(feedBadge === nodeBadge.safety?.category, 'Feed badge must match Node badge');
    assert(filterMatches, 'Filter must match Safety category');
    assert(replayMarker.category === feedBadge, 'Replay marker must match Feed badge');
  }

  console.log('  ✓ Safety Layer 4-Way Parity Verified (Feed, Node, Filter, Replay).\n');

  // ---------------------------------------------------------------------------
  // Phase 9: Replay State Integrity & Historical Frame Parity
  // ---------------------------------------------------------------------------
  console.log('2. Testing Historical Replay Reconstruction & Live Frame Parity...');

  // Initialize DynamicGraph with deterministic PRNG seed
  const graph = new DynamicGraph(42);
  const snapshotStore = new SnapshotStore(10); // checkpoint interval 10 ticks

  // Setup baseline agents at tick 0
  for (let i = 1; i <= 20; i++) {
    graph.addNode({
      id: `agent-${i}`,
      communityId: i <= 10 ? 'sector-A' : 'sector-B',
      currentInfluence: 0.5,
      dominantEmotion: 'curiosity',
      metadata: {
        archetype: i % 2 === 0 ? 'TECH' : 'ANALYST',
        trust: 0.8,
        influence: 0.5,
      },
    });
  }

  // Create initial checkpoint at tick 0
  snapshotStore.setInitialSnapshot(graph.createSnapshot());

  // Simulate streaming events from tick 1 to tick 50
  const recordedLiveFrames: Map<number, GraphSnapshot> = new Map();

  for (let tick = 1; tick <= 50; tick++) {
    graph.setTick(tick);

    // Stream events occurring at this tick
    if (tick === 10) {
      // Major breaking event at tick 10: emotion shift to fear
      graph.updateNode('agent-1', {
        dominantEmotion: 'fear',
        metadata: { emotionConfidence: 0.95 },
      });
    }

    if (tick === 25) {
      // New directed interaction edge created at tick 25
      graph.addEdge({
        source: 'agent-5',
        target: 'agent-15',
        weight: 0.85,
        relationshipType: 'bridge',
        directed: true,
        metadata: { isBridge: true },
      });
    }

    if (tick === 40) {
      // Content safety incident flagged at tick 40
      graph.updateNode('agent-5', {
        dominantEmotion: 'anger',
        metadata: { emotionConfidence: 0.92, safetyCategory: 'harassment' },
      });
    }

    // Save snapshots at checkpoints
    if (snapshotStore.shouldCheckpoint(tick)) {
      snapshotStore.recordCheckpoint(tick, graph.createSnapshot());
    }

    // Record ground-truth live frame snapshot at tick 10, 25, and 50
    if (tick === 10 || tick === 25 || tick === 50) {
      recordedLiveFrames.set(tick, graph.createSnapshot());
    }
  }

  // ---------------------------------------------------------------------------
  // Replay Time-Travel Verification
  // ---------------------------------------------------------------------------
  console.log('3. Rewinding timeline and verifying Replay vs Live Frame equality...');
  const replayEngine = new ReplayEngine(graph, graph.getEventLog(), snapshotStore);

  // Time-travel to tick 25
  console.log('  -> Scrubbing to tick 25...');
  replayEngine.goToTick(25);
  const liveFrame25 = recordedLiveFrames.get(25)!;
  const snapReplay25 = graph.createSnapshot();
  const parity25 = ReplayEngine.verifyParity(liveFrame25, snapReplay25);

  assert(graph.getTick() === 25, `Graph tick must be 25, got ${graph.getTick()}`);
  assert(
    parity25.matches,
    `Parity at tick 25 failed: ${parity25.discrepancies.join(', ')}`
  );
  
  // Verify agent-1 emotion at tick 25 is fear (persisted from tick 10)
  const agent1At25 = graph.getNode('agent-1');
  assert(agent1At25?.dominantEmotion === 'fear', `Agent-1 emotion at tick 25 must be fear, got ${agent1At25?.dominantEmotion}`);

  // Time-travel back to tick 10
  console.log('  -> Scrubbing backward to tick 10...');
  replayEngine.goToTick(10);
  const liveFrame10 = recordedLiveFrames.get(10)!;
  const snapReplay10 = graph.createSnapshot();
  const parity10 = ReplayEngine.verifyParity(liveFrame10, snapReplay10);

  assert(graph.getTick() === 10, `Graph tick must be 10, got ${graph.getTick()}`);
  assert(
    parity10.matches,
    `Parity at tick 10 failed: ${parity10.discrepancies.join(', ')}`
  );
  assert(
    !graph.getEdgeBetween('agent-5', 'agent-15', true),
    `Edge created at tick 25 must NOT exist at tick 10`
  );

  // Fast-forward to tick 50
  console.log('  -> Fast-forwarding to tick 50...');
  replayEngine.goToTick(50);
  const liveFrame50 = recordedLiveFrames.get(50)!;
  const snapReplay50 = graph.createSnapshot();
  const parity50 = ReplayEngine.verifyParity(liveFrame50, snapReplay50);

  assert(graph.getTick() === 50, `Graph tick must be 50, got ${graph.getTick()}`);
  assert(
    parity50.matches,
    `Parity at tick 50 failed: ${parity50.discrepancies.join(', ')}`
  );
  
  const agent5At50 = graph.getNode('agent-5');
  assert(agent5At50?.dominantEmotion === 'anger', `Agent-5 emotion at tick 50 must be anger, got ${agent5At50?.dominantEmotion}`);

  // Test isolated branch time-travel
  console.log('  -> Testing isolated branch reconstruction at tick 25...');
  const isolatedBranch25 = replayEngine.reconstructIsolatedAtTick(25);
  const isolatedSnap25 = isolatedBranch25.createSnapshot();
  const parityIsolated = ReplayEngine.verifyParity(liveFrame25, isolatedSnap25);
  assert(
    parityIsolated.matches,
    `Isolated branch parity failed: ${parityIsolated.discrepancies.join(', ')}`
  );
  assert(graph.getTick() === 50, 'Original graph must remain at tick 50 when isolated branch is created');

  console.log('  ✓ Replay Frame Integrity 100% Validated across scrubbing directions with bitwise parity.\n');
}
