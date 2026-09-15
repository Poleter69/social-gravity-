/**
 * Social Gravity - Local AI Discovery Engine Test Suite
 */

import { DiscoveryEngine } from '../../src/discovery/discoveryEngine';
import { TelemetryCollector } from '../../src/discovery/telemetryCollector';
import { ResilienceScorer } from '../../src/discovery/resilienceScorer';
import { PatternDetector } from '../../src/discovery/patternDetector';
import { InterventionAdvisor } from '../../src/discovery/interventionAdvisor';
import { OllamaClient } from '../../src/discovery/ollamaClient';
import { societyGenerator } from '../../src/society/generators/societyGenerator';
import { RumorEngine } from '../../src/simulation/rumorEngine';
import { InformationSignal } from '../../src/psychology/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function testDiscoveryEngine() {
  console.log('--- Testing Local AI Discovery Engine ---');

  // 1. Setup Test Society & Run Simulation to generate realistic telemetry
  const society = societyGenerator.generate({
    name: 'Discovery Validation Society',
    archetype: 'online_community',
    populationSize: 80,
    seed: 777,
    baselineTrust: 0.35,
    baselineConformity: 0.70,
  });

  const seedAgent = society.agents.find(a => a.isInfluencer) || society.agents[0];

  const viralRumor: InformationSignal = {
    id: 'rumor-cyber-attack',
    topic: 'Critical Infrastructure Grid Breach',
    content: 'Sensational claim: Power grid will shut down nationwide within 4 hours.',
    veracity: 'false',
    emotionalSalience: 0.88, // High fear
    complexity: 0.30,
    senderId: seedAgent.id,
    round: 0,
  };

  const engine = new RumorEngine(society, { maxRounds: 10, seed: 999 });
  engine.start(viralRumor, [seedAgent.id]);

  // Step 4 rounds
  for (let i = 0; i < 4; i++) {
    engine.step();
  }

  // Inject fact check at round 4
  const debunkSignal: InformationSignal = {
    id: 'debunk-grid-secure',
    topic: 'Fact Check: Grid Breach False',
    content: 'Federal regulatory audit confirms grid telemetry is 100% operational.',
    veracity: 'true',
    emotionalSalience: 0.1,
    complexity: 0.25,
    senderId: 'official_fact_checker',
    round: engine.getState().currentRound,
  };
  engine.injectDebunking(debunkSignal);

  // Step 2 more rounds
  engine.step();
  const simState = engine.step();

  // 2. Test Telemetry Collection
  const telemetry = TelemetryCollector.collect(society, simState);
  assert(telemetry.populationSize === 80, 'Population size must be 80');
  assert(telemetry.totalRounds >= 4, `Expected at least 4 rounds, got ${telemetry.totalRounds}`);
  assert(telemetry.peakBelievers >= 1, 'Peak believers should be >= 1');
  assert(telemetry.hasIntervention === true, 'Intervention must be recorded');
  assert(telemetry.communityOutcomes.length === society.communities.length, 'All communities must have outcomes');
  assert(telemetry.bridgeInfectionRatio >= 0 && telemetry.bridgeInfectionRatio <= 1, 'Bridge ratio must be [0,1]');
  console.log(`  ✓ Telemetry collector validated (Peak Believers=${telemetry.peakBelievers}, Final R0=${telemetry.finalR0}, Bridge Ratio=${(telemetry.bridgeInfectionRatio * 100).toFixed(0)}%)`);

  // 3. Test Resilience Scorer
  const resilience = ResilienceScorer.calculate(telemetry);
  assert(resilience.overall >= 0 && resilience.overall <= 100, `Resilience score must be 0-100, got ${resilience.overall}`);
  assert(resilience.subScores.epistemicTrustDefense >= 0 && resilience.subScores.epistemicTrustDefense <= 100, 'Subscore in bounds');
  assert(resilience.subScores.topologicalContainment >= 0 && resilience.subScores.topologicalContainment <= 100, 'Subscore in bounds');
  assert(resilience.subScores.emotionalComposure >= 0 && resilience.subScores.emotionalComposure <= 100, 'Subscore in bounds');
  assert(resilience.subScores.interventionReceptivity >= 0 && resilience.subScores.interventionReceptivity <= 100, 'Subscore in bounds');
  assert(typeof resilience.explanation === 'string' && resilience.explanation.length > 20, 'Explanation present');
  console.log(`  ✓ Society Resilience Scorer validated: Score=${resilience.overall}/100 (${resilience.rating})`);

  // 4. Test Pattern Detector & Hypothesis Cards
  const { hypothesisCards, topDiscovery, measuredFacts, inferredObservations, futureHypotheses } =
    PatternDetector.detectPatterns(telemetry);

  assert(hypothesisCards.length >= 2, `Expected at least 2 hypothesis cards, got ${hypothesisCards.length}`);
  assert(measuredFacts.length >= 4, `Expected at least 4 measured facts, got ${measuredFacts.length}`);
  assert(inferredObservations.length >= 2, `Expected at least 2 inferred observations, got ${inferredObservations.length}`);
  assert(futureHypotheses.length >= 1, `Expected at least 1 future hypothesis, got ${futureHypotheses.length}`);

  const firstCard = hypothesisCards[0];
  assert(firstCard.id.startsWith('hyp-'), 'Hypothesis card must have valid ID');
  assert(firstCard.confidence >= 0.8, 'Confidence should be high');
  assert(firstCard.evidence.length > 10, 'Evidence must be present');
  assert(firstCard.mechanism.length > 10, 'Mechanism explanation must be present');
  assert(firstCard.suggestedExperiment.length > 10, 'Follow-up experiment must be suggested');
  console.log(`  ✓ Pattern Detector validated: Top Discovery="${topDiscovery}" with ${hypothesisCards.length} hypothesis cards`);

  // 5. Test Intervention Advisor
  const intervention = InterventionAdvisor.recommend(telemetry);
  assert(typeof intervention.title === 'string' && intervention.title.length > 5, 'Intervention title present');
  assert(typeof intervention.rationale === 'string' && intervention.rationale.length > 20, 'Rationale present');
  assert(typeof intervention.simulationRecipe === 'string' && intervention.simulationRecipe.length > 10, 'Recipe present');
  console.log(`  ✓ Intervention Advisor validated: Optimal Strategy="${intervention.title}" (Priority: ${intervention.priority})`);

  // 6. Test Ollama Offline Fallback & Deterministic Engine
  const isOllamaOnline = await OllamaClient.isAvailable(500);
  assert(typeof isOllamaOnline === 'boolean', 'isAvailable must return boolean');

  // Request summary forcing deterministic or handling offline gracefully
  const summaryResult = await OllamaClient.generateExecutiveSummary(
    telemetry,
    resilience,
    topDiscovery,
    intervention,
    false // deterministic only
  );
  assert(summaryResult.source === 'deterministic_engine', 'Source should be deterministic_engine');
  assert(summaryResult.summary.includes(telemetry.rumorTopic), 'Summary must mention rumor topic');
  assert(summaryResult.summary.includes(String(resilience.overall)), 'Summary must cite resilience score');
  console.log(`  ✓ Ollama Client & Deterministic Fallback validated (${summaryResult.summary.length} chars generated)`);

  // 7. Test Central DiscoveryEngine.analyze()
  const report = await DiscoveryEngine.analyze(society, simState, { preferOllama: false });
  assert(report.id.startsWith('report-'), 'Report must have valid ID');
  assert(report.experimentId.startsWith('exp-'), 'Experiment ID must be valid exp- format');
  assert(report.hypothesisCards.length === hypothesisCards.length, 'Cards must match');
  assert(report.resilienceScore.overall === resilience.overall, 'Score must match');
  assert(report.executiveSummary.length > 50, 'Executive summary present');
  console.log(`  ✓ End-to-end DiscoveryEngine validated (Report ID: ${report.id})`);

  console.log('✓ All Local AI Discovery Engine tests passed successfully.');
}
