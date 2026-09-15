/**
 * Social Gravity - Real-Time Rolling Forecast Engine Tests (Milestone M1)
 */

import { ForecastEngine } from '../../src/forecasting/forecastEngine';
import { RumorEngine } from '../../src/simulation/rumorEngine';
import { societyGenerator } from '../../src/society/generators/societyGenerator';
import { InformationSignal } from '../../src/psychology/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testForecastEngine() {
  console.log('--- Testing Milestone M1: Real-Time Forecast Engine ---');

  const society = societyGenerator.generate({
    name: 'Forecast Test Society',
    archetype: 'online_community',
    populationSize: 80,
    seed: 42,
  });

  const viralRumor: InformationSignal = {
    id: 'forecast_rumor_1',
    topic: 'Systemic Vulnerability Panic',
    content: 'All financial reserves are frozen effective immediately.',
    veracity: 'false',
    emotionalSalience: 0.9,
    complexity: 0.25,
    senderId: society.agents[0].id,
    round: 0,
  };

  const engine = new RumorEngine(society, {
    maxRounds: 25,
    seed: 8888,
  });

  // Start simulation and advance 2 rounds
  engine.start(viralRumor, [society.agents[0].id]);
  engine.step(); // Round 1
  engine.step(); // Round 2

  console.log('  Generating rolling probabilistic forecast for horizon = 6 ticks...');
  const forecast = ForecastEngine.generateForecast(engine, 6, 15, 9999);

  // 1. Verify Structure and Confidence Intervals
  assert(forecast.generatedAtRound === 2, 'Generated round must match current round (2)');
  assert(forecast.horizonRounds === 6, 'Horizon rounds must be 6');
  assert(forecast.trajectories.length === 6, 'Must contain 6 tick forecast objects');

  const tick1 = forecast.trajectories[0];
  assert(tick1.tick === 3, 'First forecast tick must be 3');
  assert(tick1.predictedBelievers.median >= 0, 'Median believers must be non-negative');
  assert(tick1.predictedBelievers.lower <= tick1.predictedBelievers.median, 'Lower CI <= Median');
  assert(tick1.predictedBelievers.median <= tick1.predictedBelievers.upper, 'Median <= Upper CI');

  // 2. Verify Early Warning Statement
  assert(forecast.earlyWarning !== undefined, 'Early warning statement must be present');
  assert(typeof forecast.earlyWarning.crossCommunitySpreadProb === 'number', 'Cross community probability must be number');
  assert(forecast.earlyWarning.confidenceScore >= 0.4 && forecast.earlyWarning.confidenceScore <= 1.0, 'Confidence score must be in [0.4, 1.0]');
  assert(forecast.earlyWarning.narrativeAlert.length > 0, 'Narrative alert must be non-empty');
  console.log(`  ✓ Early Warning Alert: "${forecast.earlyWarning.narrativeAlert}" (Confidence: ${(forecast.earlyWarning.confidenceScore * 100).toFixed(1)}%)`);

  // 3. Verify Trend Extrapolation & Uncertainty Decomposition
  assert(typeof forecast.trendExtrapolation.momentum === 'number', 'Momentum must be numeric');
  assert(forecast.trendExtrapolation.projectedPeakRound >= 2, 'Projected peak round must be >= current round');
  assert(forecast.uncertainty.aleatoricUncertainty >= 0, 'Aleatoric uncertainty must be non-negative');
  assert(forecast.uncertainty.epistemicUncertainty >= 0, 'Epistemic uncertainty must be non-negative');
  assert(forecast.uncertainty.totalUncertainty >= 0, 'Total uncertainty must be non-negative');
  console.log(`  ✓ Uncertainty: Total=${forecast.uncertainty.totalUncertainty} (Aleatoric=${forecast.uncertainty.aleatoricUncertainty}, Epistemic=${forecast.uncertainty.epistemicUncertainty})`);

  // 4. Deterministic Replay Compatibility
  const forecast2 = ForecastEngine.generateForecast(engine, 6, 15, 9999);
  assert(forecast.trajectories[0].predictedBelievers.median === forecast2.trajectories[0].predictedBelievers.median, 'Deterministic seeds must produce identical median');
  assert(forecast.earlyWarning.narrativeAlert === forecast2.earlyWarning.narrativeAlert, 'Deterministic seeds must produce identical early warning alert');
  console.log('  ✓ Deterministic replay equivalence verified between parallel forecast calls.');

  console.log('✓ Real-Time Forecast Engine validated successfully.\n');
}
