/**
 * Social Gravity - Society Subsystem Test Suite Runner
 */

import { testPRNG } from './society/random.test';
import { testDistributions } from './society/distributions.test';
import { testTopologies } from './society/topologies.test';
import { testArchetypes } from './society/archetypes.test';
import { testSocietyGenerator } from './society/societyGenerator.test';
import './society/stress.test';
import { testDecisionEngine } from './psychology/decisionEngine.test';
import { testPsychologicalEvolution } from './psychology/evolution.test';
import { testDatasetAdapters } from './datasets/adapters.test';
import { testRumorEngine } from './simulation/rumorEngine.test';
import { testDiscoveryEngine } from './discovery/discoveryEngine.test';
import { testEdgeDynamics } from './graph/edgeDynamics.test';
import { testEventLogAndScheduler } from './graph/eventLogAndScheduler.test';
import { testDynamicMetrics } from './graph/metrics.test';
import { testDynamicGraphAndReplay } from './graph/dynamicGraphAndReplay.test';
import { runDynamicGraphBenchmarks } from './graph/benchmark.test';
import { testAnonymizer } from './ingestion/anonymization.test';
import { testDatasetValidator } from './ingestion/validation.test';
import { testIngestionParsers } from './ingestion/parsers.test';
import { testMasterMergerAndSimulation } from './ingestion/masterMergerAndSimulation.test';
import { runRedditAdapterTests } from './ingestion/reddit/redditAdapter.test';
import { testRealDatasetIntegration } from './datasets/realDatasetService.test';
import { testReplayAndCounterfactual } from './simulation/replayAndCounterfactual.test';
import { testEmotionEngine } from './nlp/emotionEngine.test';

console.log('========================================================');
console.log('  SOCIAL GRAVITY - MASTER SYSTEM TEST SUITE');
console.log('========================================================\n');

async function run() {
  try {
    testPRNG();
    testDistributions();
    testTopologies();
    testArchetypes();
    testSocietyGenerator();
    testDecisionEngine();
    testPsychologicalEvolution();
    testDatasetAdapters();
    testRumorEngine();
    await testDiscoveryEngine();

    console.log('\n--- SOCIAL GRAVITY V2: DYNAMIC GRAPH FOUNDATION ---');
    testEdgeDynamics();
    testEventLogAndScheduler();
    testDynamicMetrics();
    testDynamicGraphAndReplay();
    runDynamicGraphBenchmarks();

    console.log('\n--- SOCIAL GRAVITY V2: REAL DATA INGESTION & MASTER MERGER ---');
    testAnonymizer();
    testDatasetValidator();
    testIngestionParsers();
    testMasterMergerAndSimulation();
    await runRedditAdapterTests();

    console.log('\n--- SOCIAL GRAVITY V2 -> V1 INTEGRATION ---');
    await testRealDatasetIntegration();

    console.log('\n--- SOCIAL GRAVITY PHASE C: ANALYST REPLAY & COUNTERFACTUAL ---');
    await testReplayAndCounterfactual();

    console.log('\n--- SOCIAL GRAVITY PHASE D: REAL EMOTION INTELLIGENCE (GoEmotions) ---');
    await testEmotionEngine();

    console.log('\n========================================================');
    console.log('  ALL SOCIETY, PSYCHOLOGY, SIMULATION, AI, V2 GRAPH & EMOTION TESTS PASSED (100%)');
    console.log('========================================================');
  } catch (error) {
    console.error('\n❌ Test Suite Failed with error:', error);
    process.exit(1);
  }
}

run();
