/**
 * Social Gravity - Continuous Forecast Validation & Benchmark Database Tests (Milestone M5)
 */

import { ContinuousEvaluator } from '../../src/validation/continuousEvaluator';
import { societyGenerator } from '../../src/society/generators/societyGenerator';
import { InformationSignal } from '../../src/psychology/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testContinuousEvaluator() {
  console.log('--- Testing Milestone M5: Continuous Forecast Validation Against Reality ---');

  const society = societyGenerator.generate({
    name: 'Holdout Validation Society',
    archetype: 'online_community',
    populationSize: 70,
    seed: 42,
  });

  const signal: InformationSignal = {
    id: 'holdout_signal_1',
    topic: 'Emergent Protocol Exploit',
    content: 'Smart contract vulnerability allows arbitrary liquidity extraction.',
    veracity: 'false',
    emotionalSalience: 0.90,
    complexity: 0.25,
    senderId: society.agents[0].id,
    round: 0,
  };

  console.log('  Executing temporal holdout: Total Ticks = 6, Split Tick = 2...');
  const result = ContinuousEvaluator.evaluateDatasetHoldout(society, signal, 6, 2, 8888);

  // 1. Verify Metrics
  assert(result.datasetName === society.name, 'Dataset name must match');
  assert(result.splitTick === 2, 'Split tick must be 2');
  assert(result.totalObservedTicks === 6, 'Total ticks must be 6');
  assert(typeof result.actualAdoptionRate === 'number', 'Actual adoption must be numeric');
  assert(typeof result.predictedAdoptionRate === 'number', 'Predicted adoption must be numeric');
  assert(result.mae >= 0, 'MAE must be non-negative');
  assert(result.rmse >= 0, 'RMSE must be non-negative');
  assert(result.brierScore >= 0 && result.brierScore <= 1.0, 'Brier score must be in [0, 1]');
  assert(result.recall >= 0 && result.recall <= 1.0, 'Recall must be in [0, 1]');

  console.log(`  ✓ Holdout Evaluation: Predicted=${(result.predictedAdoptionRate * 100).toFixed(1)}%, Actual=${(result.actualAdoptionRate * 100).toFixed(1)}%`);
  console.log(`  ✓ Error Metrics: MAE=${result.mae.toFixed(4)}, RMSE=${result.rmse.toFixed(4)}, Brier=${result.brierScore.toFixed(4)} [${result.calibrationStatus}]`);
  console.log(`  ✓ Forecast Drift: ${result.forecastDrift.toFixed(3)} | Recall: ${(result.recall * 100).toFixed(1)}%`);

  // 2. Record in Benchmark Database
  console.log('  Archiving run to continuous benchmark database...');
  const record = ContinuousEvaluator.recordBenchmarkSuite([result], '2.0.0-beta');
  assert(record.evaluations.length === 1, 'Evaluations count must be 1');
  assert(record.aggregateMAE === result.mae, 'Aggregate MAE must match');
  assert(ContinuousEvaluator.getHistoricalRecords().length >= 1, 'Historical record must be stored');
  console.log(`  ✓ Benchmark Suite Logged: Run ID ${record.runId} (Aggregate MAE: ${record.aggregateMAE})`);

  console.log('✓ Continuous Forecast Validation validated successfully.\n');
}
