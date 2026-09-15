/**
 * Social Gravity — Predictive Evaluation Engine
 * Validates early-stage forecast accuracy against observed cascade ground-truth.
 * Computes MAE, RMSE, Precision, Recall, F1, and Calibration metrics.
 */

import { Society } from '../society/types/society';
import { RumorEngine } from '../simulation/rumorEngine';
import { InformationSignal } from '../psychology/types';

export interface PredictionResult {
  predictedAdoptionRatio: number;
  observedAdoptionRatio: number;
  predictedPeakR0: number;
  observedPeakR0: number;
  predictedCrossCommunity: boolean;
  observedCrossCommunity: boolean;
  breakoutPredicted: boolean; // >= 15% adoption
  breakoutObserved: boolean;
}

export interface MetricSummary {
  maeAdoption: number;
  rmseAdoption: number;
  maeR0: number;
  rmseR0: number;
  precision: number;
  recall: number;
  f1: number;
  brierScore: number; // Calibration score (lower is better, 0 = perfect)
  sampleSize: number;
}

export class PredictionEvaluator {
  /**
   * Evaluates early round prediction accuracy (forecast at t=earlyRound vs actual at t=maxRounds)
   */
  public evaluateRun(
    society: Society,
    signal: InformationSignal,
    patientZeroId: string,
    earlyRound = 2,
    totalRounds = 8
  ): PredictionResult {
    // 1. Run engine to early round
    const engine = new RumorEngine(society, { maxRounds: totalRounds, seed: 999 });
    engine.start(signal, [patientZeroId]);
    for (let r = 0; r < earlyRound; r++) engine.step();

    // 2. Early forecast heuristics based on initial R0, emotional arousal, and influencer seeding
    const earlyState = engine.getState();
    const earlyTel = earlyState.telemetryHistory[earlyState.telemetryHistory.length - 1];
    const earlyBelievers = earlyTel?.believerCount ?? 1;
    const earlyR0 = earlyTel?.r0 ?? 1.0;
    const emotionArousal = signal.emotionProfile?.arousal ?? 0.5;

    // Structural multiplier from active bridges and influencers
    const infectedAgents = society.agents.filter(a => earlyState.agentStates.get(a.id) === 'BELIEVER');
    const hasBridgeInfected = infectedAgents.some(a => a.isBridge);
    const hasInfluencerInfected = infectedAgents.some(a => a.isInfluencer);

    let growthMultiplier = 1.0 + (earlyR0 * 0.4) + (emotionArousal * 0.3);
    if (hasBridgeInfected) growthMultiplier *= 1.35;
    if (hasInfluencerInfected) growthMultiplier *= 1.5;

    const forecastedBelievers = Math.min(society.agents.length, Math.round(earlyBelievers * growthMultiplier * 1.6));
    const predictedAdoptionRatio = forecastedBelievers / society.agents.length;
    const predictedPeakR0 = Math.max(earlyR0, Number((earlyR0 * (1.1 + emotionArousal * 0.3)).toFixed(2)));
    const predictedCrossCommunity = hasBridgeInfected || growthMultiplier > 2.0;
    const breakoutPredicted = predictedAdoptionRatio >= 0.15;

    // 3. Complete simulation run to observe actual ground truth
    while (engine.getState().currentRound < totalRounds && engine.getState().status === 'running') {
      engine.step();
    }

    const finalState = engine.getState();
    const finalTel = finalState.telemetryHistory;
    const observedBelievers = [...finalState.agentStates.values()].filter(s => s === 'BELIEVER').length;
    const observedAdoptionRatio = observedBelievers / society.agents.length;
    const observedPeakR0 = Math.max(...finalTel.map(t => t.r0));

    // Check actual cross community penetration
    const infectedCommunities = new Set(
      society.agents
        .filter(a => finalState.agentStates.get(a.id) === 'BELIEVER')
        .map(a => a.communityId)
    );
    const observedCrossCommunity = infectedCommunities.size > 1;
    const breakoutObserved = observedAdoptionRatio >= 0.15;

    return {
      predictedAdoptionRatio,
      observedAdoptionRatio,
      predictedPeakR0,
      observedPeakR0,
      predictedCrossCommunity,
      observedCrossCommunity,
      breakoutPredicted,
      breakoutObserved,
    };
  }

  /**
   * Computes aggregate statistical evaluation metrics
   */
  public computeMetrics(results: PredictionResult[]): MetricSummary {
    const n = results.length;
    if (n === 0) {
      return {
        maeAdoption: 0,
        rmseAdoption: 0,
        maeR0: 0,
        rmseR0: 0,
        precision: 0,
        recall: 0,
        f1: 0,
        brierScore: 0,
        sampleSize: 0,
      };
    }

    let sumAbsErrAdoption = 0;
    let sumSqErrAdoption = 0;
    let sumAbsErrR0 = 0;
    let sumSqErrR0 = 0;

    let tp = 0;
    let fp = 0;
    let fn = 0;
    let tn = 0;
    let brierSum = 0;

    for (const r of results) {
      const errAdoption = Math.abs(r.predictedAdoptionRatio - r.observedAdoptionRatio);
      sumAbsErrAdoption += errAdoption;
      sumSqErrAdoption += Math.pow(errAdoption, 2);

      const errR0 = Math.abs(r.predictedPeakR0 - r.observedPeakR0);
      sumAbsErrR0 += errR0;
      sumSqErrR0 += Math.pow(errR0, 2);

      // Classification matrix for breakout prediction
      if (r.breakoutPredicted && r.breakoutObserved) tp++;
      else if (r.breakoutPredicted && !r.breakoutObserved) fp++;
      else if (!r.breakoutPredicted && r.breakoutObserved) fn++;
      else tn++;

      // Brier score: (predictedProbability - actualOutcome)^2
      const outcomeVal = r.breakoutObserved ? 1.0 : 0.0;
      brierSum += Math.pow(r.predictedAdoptionRatio - outcomeVal, 2);
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 1.0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 1.0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return {
      maeAdoption: Number((sumAbsErrAdoption / n).toFixed(4)),
      rmseAdoption: Number(Math.sqrt(sumSqErrAdoption / n).toFixed(4)),
      maeR0: Number((sumAbsErrR0 / n).toFixed(3)),
      rmseR0: Number(Math.sqrt(sumSqErrR0 / n).toFixed(3)),
      precision: Number(precision.toFixed(3)),
      recall: Number(recall.toFixed(3)),
      f1: Number(f1.toFixed(3)),
      brierScore: Number((brierSum / n).toFixed(4)),
      sampleSize: n,
    };
  }
}
