/**
 * Social Gravity - Counterfactual Branching Engine
 *
 * Implements Phase 7 / Task 3 Counterfactual Analysis:
 * Takes an active rumor diffusion simulation at arbitrary tick T_branch,
 * branches execution into isolated, parallel counterfactual scenarios,
 * and runs comparative simulations forward to evaluate intervention effectiveness.
 */

import { RumorEngine } from './rumorEngine';
import { InformationSignal } from '../psychology/types';
import { RoundTelemetry } from './types';

export interface CounterfactualBranchResult {
  branchId: 'baseline' | 'bridge_inoculation' | 'influencer_containment' | string;
  name: string;
  description: string;
  interventionType: 'none' | 'bridge_debunk' | 'influencer_debunk' | 'custom';
  inoculatedAgentIds: string[];
  finalBelieverCount: number;
  finalDebunkerCount: number;
  finalSkepticCount: number;
  finalAdoptionRate: number; // percentage
  peakR0: number;
  containmentEfficiency: number; // % reduction in infections vs baseline
  telemetryHistory: RoundTelemetry[];
  extinctionRound: number | null; // round where new infections dropped to 0
}

export interface CounterfactualComparisonResult {
  branchTick: number;
  evaluationHorizonRounds: number;
  signalTitle: string;
  branches: CounterfactualBranchResult[];
  recommendedBranchId: string;
  recommendationRationale: string;
}

export class CounterfactualEngine {
  /**
   * Evaluates standard 3-branch counterfactual suite at the current state of baseEngine:
   * 1. Baseline: Continues with no intervention.
   * 2. Bridge Inoculation: Debunks cross-community brokers at branchTick.
   * 3. Influencer Containment: Debunks top-degree hubs at branchTick.
   */
  public static runStandardComparison(
    baseEngine: RumorEngine,
    horizonRounds: number = 8,
    customDebunkSignal?: InformationSignal
  ): CounterfactualComparisonResult {
    const branchTick = baseEngine.getState().currentRound;
    const activeRumor = baseEngine.getState().activeRumor;

    const debunkSignal: InformationSignal = customDebunkSignal || {
      id: `debunk_branch_${Date.now()}`,
      topic: activeRumor?.topic || 'factual_clarification',
      veracity: 'true',
      emotionalSalience: 0.3,
      complexity: 0.25,
      content: `Empirically verified counter-evidence clarifying "${activeRumor?.topic || 'claim'}".`,
      senderId: 'institutional_factchecker',
      round: branchTick,
    };

    // --- BRANCH A: Baseline (No Intervention) ---
    const engineA = baseEngine.clone(1001);
    for (let i = 0; i < horizonRounds; i++) {
      if (engineA.getState().status === 'completed') break;
      engineA.step();
    }
    const baselineResult = this.extractBranchResult(
      'baseline',
      'Branch A: Natural Diffusion (No Intervention)',
      'Baseline organic propagation without any counter-narrative intervention.',
      'none',
      [],
      engineA,
      null
    );

    // --- BRANCH B: Bridge Broker Inoculation ---
    const engineB = baseEngine.clone(1002);
    // Find bridge nodes that are not yet believers
    const bridgeCandidates = (engineB as any).society.agents
      .filter((a: any) => a.isBridge && engineB.getState().agentStates.get(a.id) !== 'BELIEVER')
      .map((a: any) => a.id);
    const bridgeTargets = bridgeCandidates.slice(0, 3);

    if (bridgeTargets.length > 0) {
      engineB.injectDebunking(debunkSignal, bridgeTargets);
    }
    for (let i = 0; i < horizonRounds; i++) {
      if (engineB.getState().status === 'completed') break;
      engineB.step();
    }
    const bridgeResult = this.extractBranchResult(
      'bridge_inoculation',
      'Branch B: Bridge Broker Inoculation',
      'Targeted debunking deployment at topological cross-community structural brokers.',
      'bridge_debunk',
      bridgeTargets,
      engineB,
      baselineResult.finalBelieverCount
    );

    // --- BRANCH C: Top Influencer Containment ---
    const engineC = baseEngine.clone(1003);
    const influencerCandidates = (engineC as any).society.agents
      .filter((a: any) => a.isInfluencer && engineC.getState().agentStates.get(a.id) !== 'BELIEVER')
      .sort((a: any, b: any) => b.traits.influence - a.traits.influence)
      .map((a: any) => a.id);
    const influencerTargets = influencerCandidates.slice(0, 3);

    if (influencerTargets.length > 0) {
      engineC.injectDebunking(debunkSignal, influencerTargets);
    }
    for (let i = 0; i < horizonRounds; i++) {
      if (engineC.getState().status === 'completed') break;
      engineC.step();
    }
    const influencerResult = this.extractBranchResult(
      'influencer_containment',
      'Branch C: Influencer Hub Containment',
      'Mass broadcast debunking deployment at the highest-degree gravitational hubs.',
      'influencer_debunk',
      influencerTargets,
      engineC,
      baselineResult.finalBelieverCount
    );

    const branches = [baselineResult, bridgeResult, influencerResult];

    // Determine optimal recommendation
    let bestBranch = bridgeResult;
    if (influencerResult.containmentEfficiency > bridgeResult.containmentEfficiency) {
      bestBranch = influencerResult;
    }

    const recommendationRationale = 
      bestBranch.containmentEfficiency > 0
        ? `${bestBranch.name} yielded optimal containment, preventing ${(bestBranch.containmentEfficiency).toFixed(1)}% of potential infections compared to baseline while reducing peak reproduction R0 from ${baselineResult.peakR0} to ${bestBranch.peakR0}.`
        : `At round t=${branchTick}, the rumor has already saturated primary vectors. System recommends simultaneous hybrid deployment.`;

    return {
      branchTick,
      evaluationHorizonRounds: horizonRounds,
      signalTitle: activeRumor?.topic || 'Active Misinformation',
      branches,
      recommendedBranchId: bestBranch.branchId,
      recommendationRationale,
    };
  }

  private static extractBranchResult(
    branchId: string,
    name: string,
    description: string,
    interventionType: 'none' | 'bridge_debunk' | 'influencer_debunk',
    inoculatedAgentIds: string[],
    engine: RumorEngine,
    baselineBelievers: number | null
  ): CounterfactualBranchResult {
    const history = engine.getState().telemetryHistory;
    const latest = history.length > 0 ? history[history.length - 1] : null;
    const totalPop = (engine as any).society.summary.totalPopulation || 100;

    const finalBelieverCount = latest?.believerCount ?? 0;
    const finalDebunkerCount = latest?.debunkerCount ?? 0;
    const finalSkepticCount = latest?.skepticCount ?? 0;
    const finalAdoptionRate = Number(((finalBelieverCount / totalPop) * 100).toFixed(1));

    const peakR0 = history.reduce((max, t) => Math.max(max, t.r0), 0);

    // Calculate containment efficiency vs baseline
    let containmentEfficiency = 0;
    if (baselineBelievers !== null && baselineBelievers > 0) {
      containmentEfficiency = Math.max(0, Number((((baselineBelievers - finalBelieverCount) / baselineBelievers) * 100).toFixed(1)));
    }

    // Extinction round
    let extinctionRound: number | null = null;
    for (const t of history) {
      if (t.round > 0 && t.newInfections === 0 && t.r0 === 0) {
        extinctionRound = t.round;
        break;
      }
    }

    return {
      branchId,
      name,
      description,
      interventionType,
      inoculatedAgentIds,
      finalBelieverCount,
      finalDebunkerCount,
      finalSkepticCount,
      finalAdoptionRate,
      peakR0,
      containmentEfficiency,
      telemetryHistory: history,
      extinctionRound,
    };
  }
}
