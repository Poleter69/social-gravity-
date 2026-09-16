/**
 * Social Gravity - Society Subsystem & Intelligence Evolution Test Suite Runner
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
import { testPhaseEProductionHardening } from './e2e/phaseE.test';
import { testForecastEngine } from './forecasting/forecastEngine.test';
import { testGraphLearning } from './graphLearning/graphLearning.test';
import { testCollaborationLayer } from './collaboration/collaboration.test';
import { testEvidenceDossier } from './explainability/evidenceDossier.test';
import { testContinuousEvaluator } from './validation/continuousEvaluator.test';
import { testInterventionOptimizer } from './optimization/interventionOptimizer.test';
import { testDomainRegistry } from './domains/domainRegistry.test';
import { testPublicationPipeline } from './research/publicationPipeline.test';

// V3 Evolution Protocol Test Suites (Milestones M10–M19)
import { testTemporalGraphForecasting } from './forecasting/temporalGraphForecast.test';
import { testNarrativeEvolution } from './narrative/narrativeEngine.test';
import { testMultiModalIntelligence } from './multimodal/multimodal.test';
import { testAnalystAssistant } from './assistant/analystCopilot.test';
import { testAdaptiveOptimizer } from './optimization/adaptiveOptimizer.test';
import { testCrossDomainFusion } from './fusion/crossDomainFusion.test';
import { testScientificValidation } from './research/scientificValidation.test';
import { testEnterpriseOperations } from './enterprise/enterprise.test';
import { testLiveNarrativeIntelligence } from './live/liveIntelligence.test';
import { runLivePerformanceBenchmarks } from './live/livePerformance.benchmark.ts';

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

    console.log('\n--- SOCIAL GRAVITY PHASE E: PRODUCTION HARDENING & LIVE INTELLIGENCE ---');
    await testPhaseEProductionHardening();

    console.log('\n--- SOCIAL GRAVITY V2.0: REAL-TIME FORECAST ENGINE ---');
    testForecastEngine();

    console.log('\n--- SOCIAL GRAVITY V2.0: GRAPH LEARNING & NODE2VEC ---');
    testGraphLearning();

    console.log('\n--- SOCIAL GRAVITY V2.0: ANALYST COLLABORATION LAYER ---');
    testCollaborationLayer();

    console.log('\n--- SOCIAL GRAVITY V2.0: EXPLAINABLE INTELLIGENCE DOSSIER ---');
    testEvidenceDossier();

    console.log('\n--- SOCIAL GRAVITY V2.0: CONTINUOUS FORECAST VALIDATION ---');
    testContinuousEvaluator();

    console.log('\n--- SOCIAL GRAVITY V2.0: INTERVENTION OPTIMIZER ---');
    testInterventionOptimizer();

    console.log('\n--- SOCIAL GRAVITY V2.0: MULTI-DOMAIN EXPANSION ---');
    testDomainRegistry();

    console.log('\n--- SOCIAL GRAVITY V2.0: RESEARCH PUBLICATION PIPELINE ---');
    testPublicationPipeline();

    console.log('\n========================================================');
    console.log('  SOCIAL GRAVITY V3.0: RESEARCH & INTELLIGENCE EVOLUTION');
    console.log('========================================================\n');

    console.log('--- Milestone M10: Temporal Graph Neural Forecasting ---');
    testTemporalGraphForecasting();

    console.log('--- Milestone M11: Narrative Evolution Engine ---');
    testNarrativeEvolution();

    console.log('--- Milestone M12: Multi-Modal Intelligence ---');
    testMultiModalIntelligence();

    console.log('--- Milestone M13: Autonomous Analyst Assistant ---');
    testAnalystAssistant();

    console.log('--- Milestone M14: Adaptive Intervention Optimizer ---');
    testAdaptiveOptimizer();

    console.log('--- Milestone M15: Cross-Domain Fusion ---');
    testCrossDomainFusion();

    console.log('--- Milestone M16: Scientific Validation Program ---');
    testScientificValidation();

    console.log('--- Milestone M17: Enterprise Operations Layer ---');
    await testEnterpriseOperations();

    console.log('--- Milestone M19: Live Narrative Intelligence ---');
    await testLiveNarrativeIntelligence();

    console.log('--- Milestone M19: Operational Performance & Scale Benchmarks ---');
    await runLivePerformanceBenchmarks();

    console.log('\n========================================================');
    console.log('  ALL V1, V2, AND V3 EVOLUTION TEST SUITES PASSED (100%)');
    console.log('========================================================');
  } catch (error) {
    console.error('\n❌ Test Suite Failed with error:', error);
    process.exit(1);
  }
}

run();
