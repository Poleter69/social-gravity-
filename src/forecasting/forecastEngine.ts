/**
 * Social Gravity - V2.0 Real-Time Rolling Forecast Engine
 *
 * Implements Milestone M1:
 * - Rolling forecast horizon forward simulation
 * - Probabilistic confidence intervals (5th, 50th, 95th percentiles)
 * - Cross-community contagion probability & early warning statements
 * - Trend extrapolation & uncertainty decomposition (epistemic vs aleatoric)
 * - 100% deterministic and compatible with SplitMix32 replay engine
 */

import { RumorEngine } from '../simulation/rumorEngine';
import {
  ForecastReport,
  TickForecast,
  EarlyWarningStatement,
  TrendExtrapolation,
  UncertaintyDecomposition,
  ConfidenceInterval,
  OutbreakRiskLevel,
} from './types';

function computeCI(values: number[], confidenceLevel = 0.90): ConfidenceInterval {
  if (values.length === 0) {
    return { lower: 0, median: 0, upper: 0, confidenceLevel };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const lowerIdx = Math.max(0, Math.floor(n * 0.05));
  const medianIdx = Math.floor(n * 0.50);
  const upperIdx = Math.min(n - 1, Math.ceil(n * 0.95));

  return {
    lower: sorted[lowerIdx],
    median: sorted[medianIdx],
    upper: sorted[upperIdx],
    confidenceLevel,
  };
}

export class ForecastEngine {
  /**
   * Generates a multi-step probabilistic rolling forecast from the current simulation state.
   */
  public static generateForecast(
    baseEngine: RumorEngine,
    horizonRounds: number = 8,
    ensembleSize: number = 20,
    seedBase: number = 70000
  ): ForecastReport {
    const currentState = baseEngine.getState();
    const currentRound = currentState.currentRound;
    const society = (baseEngine as any).society;
    const totalAgents = society.agents.length || 1;

    // Identify current communities containing believers
    const initialBelieverCommunities = new Set<string>();
    society.agents.forEach((a: any) => {
      if (currentState.agentStates.get(a.id) === 'BELIEVER') {
        initialBelieverCommunities.add(a.communityId);
      }
    });

    // Storage for per-tick ensemble trajectories
    const tickBelievers: number[][] = Array.from({ length: horizonRounds }, () => []);
    const tickR0: number[][] = Array.from({ length: horizonRounds }, () => []);
    const tickAdoption: number[][] = Array.from({ length: horizonRounds }, () => []);
    const tickCrossCommunityEvents: boolean[][] = Array.from({ length: horizonRounds }, () => []);

    // Run parallel deterministic ensemble
    for (let r = 0; r < ensembleSize; r++) {
      const branchSeed = seedBase + r * 137 + currentRound;
      const cloned = baseEngine.clone(branchSeed);

      for (let h = 0; h < horizonRounds; h++) {
        if (cloned.getState().status === 'completed') {
          // Fill remaining ticks with last recorded state
          const lastSnap = cloned.getState().telemetryHistory.slice(-1)[0];
          const bCount = lastSnap ? lastSnap.believerCount : 0;
          const r0Val = lastSnap ? lastSnap.r0 : 0;
          tickBelievers[h].push(bCount);
          tickR0[h].push(r0Val);
          tickAdoption[h].push(bCount / totalAgents);
          tickCrossCommunityEvents[h].push(false);
          continue;
        }

        cloned.step();
        const state = cloned.getState();
        const latestTelemetry = state.telemetryHistory.slice(-1)[0];
        const believers = latestTelemetry ? latestTelemetry.believerCount : 0;
        const r0 = latestTelemetry ? latestTelemetry.r0 : 0;

        tickBelievers[h].push(believers);
        tickR0[h].push(r0);
        tickAdoption[h].push(believers / totalAgents);

        // Check if any believer now belongs to a new community outside initial seed communities
        let spreadOccurred = false;
        for (const a of society.agents) {
          if (state.agentStates.get(a.id) === 'BELIEVER' && !initialBelieverCommunities.has(a.communityId)) {
            spreadOccurred = true;
            break;
          }
        }
        tickCrossCommunityEvents[h].push(spreadOccurred);
      }
    }

    // Synthesize tick trajectories
    const trajectories: TickForecast[] = [];
    let firstSignificantSpreadTick: number | null = null;
    let maxSpreadProbability = 0;

    for (let h = 0; h < horizonRounds; h++) {
      const predB = computeCI(tickBelievers[h]);
      const predR0 = computeCI(tickR0[h]);
      const predAdopt = computeCI(tickAdoption[h]);

      const spreadCount = tickCrossCommunityEvents[h].filter(Boolean).length;
      const spreadProb = ensembleSize > 0 ? spreadCount / ensembleSize : 0;

      if (spreadProb > maxSpreadProbability) {
        maxSpreadProbability = spreadProb;
      }
      if (spreadProb >= 0.5 && firstSignificantSpreadTick === null) {
        firstSignificantSpreadTick = h + 1; // 1-indexed relative offset
      }

      let risk: OutbreakRiskLevel = 'LOW';
      if (spreadProb >= 0.6 || predR0.median >= 2.0 || predAdopt.median >= 0.35) {
        risk = 'CRITICAL';
      } else if (spreadProb >= 0.3 || predR0.median >= 1.2 || predAdopt.median >= 0.20) {
        risk = 'HIGH';
      } else if (predR0.median >= 0.8 || predAdopt.median >= 0.08) {
        risk = 'MODERATE';
      }

      trajectories.push({
        tick: currentRound + h + 1,
        relativeTick: h + 1,
        predictedBelievers: predB,
        predictedR0: predR0,
        predictedAdoptionRate: predAdopt,
        crossCommunitySpreadProbability: spreadProb,
        outbreakRisk: risk,
      });
    }

    // Identify target communities susceptible to bridging
    const triggeringCommunities: string[] = [];
    if (society.communities) {
      society.communities.forEach((c: any) => {
        if (!initialBelieverCommunities.has(c.id)) {
          triggeringCommunities.push(c.id);
        }
      });
    }

    // Format Early Warning Statement
    const targetTickOffset = firstSignificantSpreadTick || (trajectories.length > 0 ? Math.min(6, trajectories.length) : 5);
    const finalSpreadProb = trajectories[targetTickOffset - 1]?.crossCommunitySpreadProbability ?? maxSpreadProbability;
    const spreadPct = Math.round(finalSpreadProb * 100);

    // Confidence score based on ensemble agreement
    const finalAdoptionCI = trajectories.slice(-1)[0]?.predictedAdoptionRate;
    const iqr = finalAdoptionCI ? (finalAdoptionCI.upper - finalAdoptionCI.lower) : 0.2;
    const confidenceScore = Math.max(0.40, Math.min(0.99, Number((1 - iqr * 1.5).toFixed(3))));

    const narrativeAlert = spreadPct > 15
      ? `${spreadPct}% probability of cross-community spread within ${targetTickOffset} ticks.`
      : `Localized containment projected: <15% cross-community spread probability over ${horizonRounds} ticks.`;

    const earlyWarning: EarlyWarningStatement = {
      crossCommunitySpreadProb: finalSpreadProb,
      ticksUntilSpread: firstSignificantSpreadTick,
      confidenceScore,
      narrativeAlert,
      triggeringCommunities: triggeringCommunities.slice(0, 3),
      recommendedInterventionTick: Math.max(currentRound, currentRound + Math.max(1, Math.floor(targetTickOffset / 2))),
    };

    // Calculate Trend Extrapolation (Derivatives)
    const b0 = currentState.telemetryHistory.slice(-1)[0]?.believerCount ?? 1;
    const b1 = trajectories[0]?.predictedBelievers.median ?? b0;
    const b2 = trajectories[1]?.predictedBelievers.median ?? b1;
    const momentum = b1 - b0;
    const acceleration = (b2 - b1) - momentum;

    let peakTick = currentRound;
    let peakBelievers = b0;
    for (const t of trajectories) {
      if (t.predictedBelievers.median > peakBelievers) {
        peakBelievers = t.predictedBelievers.median;
        peakTick = t.tick;
      }
    }

    const trendExtrapolation: TrendExtrapolation = {
      momentum: Number(momentum.toFixed(2)),
      acceleration: Number(acceleration.toFixed(2)),
      projectedPeakRound: peakTick,
      projectedPeakBelievers: Math.round(peakBelievers),
      isPercolating: earlyWarning.crossCommunitySpreadProb >= 0.5,
    };

    // Calculate Uncertainty Decomposition
    // Aleatoric: normalized variance of ensemble predictions at horizon end
    const lastTickValues = tickBelievers[horizonRounds - 1] || [1];
    const meanB = lastTickValues.reduce((a, b) => a + b, 0) / (lastTickValues.length || 1);
    const varianceB = lastTickValues.reduce((a, b) => a + Math.pow(b - meanB, 2), 0) / (lastTickValues.length || 1);
    const aleatoric = Math.min(1.0, Math.sqrt(varianceB) / totalAgents);

    // Epistemic: based on diversity of conformity & trust in society
    const conformityVariance = society.agents.reduce((acc: number, a: any) => acc + Math.pow(a.traits.conformity - 0.5, 2), 0) / totalAgents;
    const epistemic = Number((conformityVariance * 2).toFixed(4));
    const totalUncertainty = Number(Math.min(1.0, Math.sqrt(aleatoric * aleatoric + epistemic * epistemic)).toFixed(4));

    const uncertainty: UncertaintyDecomposition = {
      aleatoricUncertainty: Number(aleatoric.toFixed(4)),
      epistemicUncertainty: epistemic,
      totalUncertainty,
    };

    return {
      generatedAtRound: currentRound,
      horizonRounds,
      ensembleRuns: ensembleSize,
      trajectories,
      earlyWarning,
      trendExtrapolation,
      uncertainty,
      deterministicSeed: seedBase,
      timestamp: Date.now(),
    };
  }
}
