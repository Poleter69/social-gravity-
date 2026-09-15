/**
 * Social Gravity - V2.0 Real-Time Forecast Engine Types
 * Rolling forecast horizons, probabilistic confidence intervals, early warning triage, and uncertainty decomposition.
 */

export interface ConfidenceInterval {
  lower: number;       // 5th percentile (90% CI)
  median: number;      // 50th percentile (point estimate)
  upper: number;       // 95th percentile (90% CI)
  confidenceLevel: number; // e.g. 0.90
}

export type OutbreakRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface TickForecast {
  tick: number; // Absolute simulation round
  relativeTick: number; // Offset from forecast start (+1, +2, ...)
  predictedBelievers: ConfidenceInterval;
  predictedR0: ConfidenceInterval;
  predictedAdoptionRate: ConfidenceInterval; // [0, 1]
  crossCommunitySpreadProbability: number; // [0, 1]
  outbreakRisk: OutbreakRiskLevel;
}

export interface EarlyWarningStatement {
  crossCommunitySpreadProb: number; // 0 to 1
  ticksUntilSpread: number | null;
  confidenceScore: number; // 0 to 1
  narrativeAlert: string; // e.g. "78% probability of cross-community spread within 6 ticks."
  triggeringCommunities: string[];
  recommendedInterventionTick: number;
}

export interface TrendExtrapolation {
  momentum: number; // First derivative (new infections velocity)
  acceleration: number; // Second derivative (acceleration of cascade)
  projectedPeakRound: number;
  projectedPeakBelievers: number;
  isPercolating: boolean;
}

export interface UncertaintyDecomposition {
  aleatoricUncertainty: number;  // Inherent stochastic variance across PRNG seeds
  epistemicUncertainty: number;  // Variance in psychological priors & threshold sensitivity
  totalUncertainty: number;
}

export interface ForecastReport {
  generatedAtRound: number;
  horizonRounds: number;
  ensembleRuns: number;
  trajectories: TickForecast[];
  earlyWarning: EarlyWarningStatement;
  trendExtrapolation: TrendExtrapolation;
  uncertainty: UncertaintyDecomposition;
  deterministicSeed: number;
  timestamp: number;
}
