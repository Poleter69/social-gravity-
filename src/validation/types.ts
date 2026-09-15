/**
 * Social Gravity - V2.0 Continuous Forecast Validation Types
 * Temporal holdout splits, ground-truth comparison, forecast drift, and benchmark archive.
 */

export interface HoldoutEvaluationResult {
  datasetId: string;
  datasetName: string;
  totalObservedTicks: number;
  splitTick: number; // Cutoff tick where future was hidden
  predictedAdoptionRate: number; // [0, 1]
  actualAdoptionRate: number;    // [0, 1]
  predictedPeakR0: number;
  actualPeakR0: number;
  mae: number;
  rmse: number;
  precision: number;
  recall: number;
  brierScore: number;
  forecastDrift: number; // Deviation between early slope and actual slope
  calibrationStatus: 'WELL_CALIBRATED' | 'MODERATELY_CALIBRATED' | 'MISCALIBRATED';
}

export interface BenchmarkDatabaseRecord {
  runId: string;
  timestamp: number;
  engineVersion: string;
  evaluations: HoldoutEvaluationResult[];
  aggregateMAE: number;
  aggregateRMSE: number;
  aggregateRecall: number;
  aggregateBrier: number;
}
