/**
 * Social Gravity - Continuous Forecast Validation Engine
 *
 * Implements Milestone M5:
 * Evaluates forecasting accuracy against real datasets using temporal holdout:
 * 1. Simulates or replays real dataset cascade ground truth
 * 2. Hides observations beyond splitTick (temporal holdout)
 * 3. Compares blind forward forecast against actual ground truth
 * 4. Logs historical performance to continuous benchmark database
 */

import { Society } from '../society/types/society';
import { InformationSignal } from '../psychology/types';
import { RumorEngine } from '../simulation/rumorEngine';
import { ForecastEngine } from '../forecasting/forecastEngine';
import { HoldoutEvaluationResult, BenchmarkDatabaseRecord } from './types';

export class ContinuousEvaluator {
  private static benchmarkHistory: BenchmarkDatabaseRecord[] = [];

  /**
   * Evaluates a dataset with temporal holdout (predicting future while hiding observations after splitTick).
   */
  public static evaluateDatasetHoldout(
    society: Society,
    rumor: InformationSignal,
    totalTicks: number = 8,
    splitTick: number = 2,
    seed: number = 42000
  ): HoldoutEvaluationResult {
    const totalAgents = society.agents.length || 1;

    // 1. Establish Ground Truth by running full simulation
    const truthEngine = new RumorEngine(society, { maxRounds: totalTicks + 2, seed });
    truthEngine.start(rumor, [society.agents[0].id]);
    for (let t = 0; t < totalTicks; t++) {
      if (truthEngine.getState().status === 'completed') break;
      truthEngine.step();
    }

    const truthTelemetry = truthEngine.getState().telemetryHistory;
    const finalTruthRound = truthTelemetry[truthTelemetry.length - 1];
    const actualBelievers = finalTruthRound ? finalTruthRound.believerCount : 1;
    const actualAdoptionRate = Number((actualBelievers / totalAgents).toFixed(4));
    const actualPeakR0 = Math.max(0, ...truthTelemetry.map(t => t.r0));

    // 2. Temporal Holdout: Run blind engine strictly up to splitTick
    const holdoutEngine = new RumorEngine(society, { maxRounds: totalTicks + 2, seed });
    holdoutEngine.start(rumor, [society.agents[0].id]);
    for (let t = 0; t < splitTick; t++) {
      holdoutEngine.step();
    }

    // 3. Generate Blind Forecast from splitTick forward to totalTicks
    const horizon = totalTicks - splitTick;
    const forecastReport = ForecastEngine.generateForecast(holdoutEngine, horizon, 15, seed + 1000);
    const finalForecastTick = forecastReport.trajectories[forecastReport.trajectories.length - 1];

    const predictedAdoptionRate = Number((finalForecastTick?.predictedAdoptionRate.median ?? 0).toFixed(4));
    const predictedPeakR0 = Number((Math.max(0, ...forecastReport.trajectories.map(t => t.predictedR0.median))).toFixed(2));

    // 4. Compute Holdout Error Metrics
    const mae = Number(Math.abs(predictedAdoptionRate - actualAdoptionRate).toFixed(4));
    const rmse = Number(Math.sqrt(Math.pow(predictedAdoptionRate - actualAdoptionRate, 2)).toFixed(4));

    // Ground truth outbreak classification (>= 15% adoption)
    const actualOutbreak = actualAdoptionRate >= 0.15 ? 1 : 0;
    const predictedOutbreakProb = finalForecastTick?.predictedAdoptionRate.median ?? 0;
    const brierScore = Number(Math.pow(predictedOutbreakProb - actualOutbreak, 2).toFixed(4));

    // Precision and recall on outbreak
    const predOutbreakBinary = predictedAdoptionRate >= 0.15 ? 1 : 0;
    const precision = predOutbreakBinary === 1 && actualOutbreak === 1 ? 1.0 : (predOutbreakBinary === 1 && actualOutbreak === 0 ? 0.0 : 1.0);
    const recall = actualOutbreak === 1 ? (predOutbreakBinary === 1 ? 1.0 : 0.0) : 1.0;

    // Forecast drift: slope difference between early and late ticks
    const earlySlope = splitTick > 0 ? (holdoutEngine.getState().telemetryHistory.slice(-1)[0]?.believerCount ?? 1) / splitTick : 1;
    const lateActualSlope = (actualBelievers - (holdoutEngine.getState().telemetryHistory.slice(-1)[0]?.believerCount ?? 1)) / Math.max(1, horizon);
    const forecastDrift = Number(Math.abs(earlySlope - lateActualSlope).toFixed(3));

    let calibrationStatus: HoldoutEvaluationResult['calibrationStatus'] = 'WELL_CALIBRATED';
    if (brierScore > 0.20) calibrationStatus = 'MISCALIBRATED';
    else if (brierScore > 0.09) calibrationStatus = 'MODERATELY_CALIBRATED';

    return {
      datasetId: society.name.toLowerCase().replace(/\s+/g, '_'),
      datasetName: society.name,
      totalObservedTicks: totalTicks,
      splitTick,
      predictedAdoptionRate,
      actualAdoptionRate,
      predictedPeakR0,
      actualPeakR0,
      mae,
      rmse,
      precision,
      recall,
      brierScore,
      forecastDrift,
      calibrationStatus,
    };
  }

  /**
   * Records an evaluation suite into the benchmark database.
   */
  public static recordBenchmarkSuite(
    evaluations: HoldoutEvaluationResult[],
    engineVersion = '2.0.0-beta'
  ): BenchmarkDatabaseRecord {
    const n = evaluations.length || 1;
    const aggregateMAE = Number((evaluations.reduce((a, e) => a + e.mae, 0) / n).toFixed(4));
    const aggregateRMSE = Number((evaluations.reduce((a, e) => a + e.rmse, 0) / n).toFixed(4));
    const aggregateRecall = Number((evaluations.reduce((a, e) => a + e.recall, 0) / n).toFixed(4));
    const aggregateBrier = Number((evaluations.reduce((a, e) => a + e.brierScore, 0) / n).toFixed(4));

    const record: BenchmarkDatabaseRecord = {
      runId: `bench-${Date.now()}`,
      timestamp: Date.now(),
      engineVersion,
      evaluations,
      aggregateMAE,
      aggregateRMSE,
      aggregateRecall,
      aggregateBrier,
    };

    this.benchmarkHistory.push(record);
    return record;
  }

  public static getHistoricalRecords(): BenchmarkDatabaseRecord[] {
    return [...this.benchmarkHistory];
  }
}
