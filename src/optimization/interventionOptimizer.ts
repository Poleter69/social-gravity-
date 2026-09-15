/**
 * Social Gravity - Intervention Optimization Engine
 *
 * Implements Milestone M6:
 * Algorithmic search for the smallest intervention set yielding the highest
 * containment efficiency at lowest operational cost (Pareto Frontier Search).
 */

import { RumorEngine } from '../simulation/rumorEngine';
import { InformationSignal } from '../psychology/types';
import {
  OptimizedInterventionPlan,
  OptimizationReport,
  InterventionStrategyType,
} from './types';

export class InterventionOptimizer {
  /**
   * Search and optimize intervention plans to discover the Pareto frontier of Cost vs Containment.
   */
  public static optimize(
    baseEngine: RumorEngine,
    horizonRounds: number = 8,
    customDebunk?: InformationSignal
  ): OptimizationReport {
    const branchTick = baseEngine.getState().currentRound;
    const activeRumor = baseEngine.getState().activeRumor;
    const society = (baseEngine as any).society;

    const debunkSignal: InformationSignal = customDebunk || {
      id: `debunk_opt_${Date.now()}`,
      topic: activeRumor?.topic || 'verified_factcheck',
      veracity: 'true',
      emotionalSalience: 0.35,
      complexity: 0.25,
      content: `Empirically verified factual clarification on ${activeRumor?.topic || 'issue'}.`,
      senderId: 'official_factcheck_authority',
      round: branchTick,
    };

    // 1. Establish Unmitigated Baseline
    const baselineEngine = baseEngine.clone(9001);
    for (let i = 0; i < horizonRounds; i++) {
      if (baselineEngine.getState().status === 'completed') break;
      baselineEngine.step();
    }
    const baselineInfections = baselineEngine.getState().telemetryHistory.slice(-1)[0]?.believerCount || 1;

    // Identify eligible non-believer candidates
    const currentBelievers = new Set<string>();
    baseEngine.getState().agentStates.forEach((st, id) => {
      if (st === 'BELIEVER') currentBelievers.add(id);
    });

    const bridgeCandidates = society.agents
      .filter((a: any) => a.isBridge && !currentBelievers.has(a.id))
      .map((a: any) => a.id);

    const influencerCandidates = society.agents
      .filter((a: any) => a.isInfluencer && !currentBelievers.has(a.id))
      .sort((a: any, b: any) => (b.traits.influence || 0) - (a.traits.influence || 0))
      .map((a: any) => a.id);

    const candidatePlans: Array<{
      strategy: InterventionStrategyType;
      name: string;
      targets: string[];
      cost: number;
      rationale: string;
    }> = [];

    // Plan A1: Minimal Bridge (1 node)
    if (bridgeCandidates.length >= 1) {
      candidatePlans.push({
        strategy: 'bridge_targeting',
        name: 'Surgical Bridge Pinpoint (1 Node)',
        targets: bridgeCandidates.slice(0, 1),
        cost: 1.0,
        rationale: 'Inoculate single primary inter-community weak-tie bridge broker.',
      });
    }

    // Plan A2: Full Bridge Boundary (3 nodes)
    if (bridgeCandidates.length >= 2) {
      candidatePlans.push({
        strategy: 'bridge_targeting',
        name: 'Multi-Bridge Perimeter (3 Nodes)',
        targets: bridgeCandidates.slice(0, Math.min(3, bridgeCandidates.length)),
        cost: Math.min(3, bridgeCandidates.length) * 1.0,
        rationale: 'Inoculate top 3 topological bridge brokers to seal cross-cluster perimeter.',
      });
    }

    // Plan B1: Top Influencer (1 node)
    if (influencerCandidates.length >= 1) {
      candidatePlans.push({
        strategy: 'influencer_targeting',
        name: 'Anchor Hub Counter-Voice (1 Influencer)',
        targets: influencerCandidates.slice(0, 1),
        cost: 2.0, // Higher cost for major influencer briefing
        rationale: 'Partner with highest-reach influencer to broadcast counter-narrative.',
      });
    }

    // Plan B2: Top Influencers (3 nodes)
    if (influencerCandidates.length >= 2) {
      candidatePlans.push({
        strategy: 'influencer_targeting',
        name: 'Full Hub Broadcast (3 Influencers)',
        targets: influencerCandidates.slice(0, Math.min(3, influencerCandidates.length)),
        cost: Math.min(3, influencerCandidates.length) * 2.0,
        rationale: 'Brief top 3 key opinion leaders across the network.',
      });
    }

    // Plan C1: Hybrid Pareto (1 Bridge + 1 Influencer)
    const hybridTargets: string[] = [];
    if (bridgeCandidates.length > 0) hybridTargets.push(bridgeCandidates[0]);
    if (influencerCandidates.length > 0 && !hybridTargets.includes(influencerCandidates[0])) {
      hybridTargets.push(influencerCandidates[0]);
    }
    if (hybridTargets.length >= 2) {
      candidatePlans.push({
        strategy: 'hybrid_pareto',
        name: 'Hybrid Boundary-Hub Coalition (2 Nodes)',
        targets: hybridTargets,
        cost: 2.5,
        rationale: 'Simultaneously plug cross-cluster leakage while deploying trusted hub messenger.',
      });
    }

    // Evaluate all candidate plans via counterfactual branching
    const evaluatedPlans: OptimizedInterventionPlan[] = [];

    candidatePlans.forEach((plan, idx) => {
      const engine = baseEngine.clone(9100 + idx);
      if (plan.targets.length > 0) {
        engine.injectDebunking(debunkSignal, plan.targets);
      }
      for (let i = 0; i < horizonRounds; i++) {
        if (engine.getState().status === 'completed') break;
        engine.step();
      }

      const finalBelievers = engine.getState().telemetryHistory.slice(-1)[0]?.believerCount || 0;
      const prevented = Math.max(0, baselineInfections - finalBelievers);
      const containmentEfficiency = Number(((prevented / Math.max(1, baselineInfections)) * 100).toFixed(1));
      const costPerPct = containmentEfficiency > 0 ? Number((plan.cost / containmentEfficiency).toFixed(3)) : 999;

      evaluatedPlans.push({
        strategy: plan.strategy,
        name: plan.name,
        targetAgentIds: plan.targets,
        targetCount: plan.targets.length,
        operationalCost: plan.cost,
        containmentEfficiency,
        costPerPercentContainment: costPerPct,
        isParetoOptimal: false, // Calculated in next step
        rationale: plan.rationale,
      });
    });

    // 2. Identify Pareto Frontier (Non-dominated solutions: no plan with lower cost has higher containment)
    for (const p of evaluatedPlans) {
      let isDominated = false;
      for (const q of evaluatedPlans) {
        if (q !== p && q.operationalCost <= p.operationalCost && q.containmentEfficiency > p.containmentEfficiency) {
          isDominated = true;
          break;
        }
      }
      p.isParetoOptimal = !isDominated;
    }

    const paretoFrontier = evaluatedPlans
      .filter(p => p.isParetoOptimal)
      .sort((a, b) => a.operationalCost - b.operationalCost);

    // Recommended plan: Highest containment per cost unit on Pareto frontier
    let bestPlan = paretoFrontier[0] || evaluatedPlans[0];
    let bestRatio = -1;
    for (const p of paretoFrontier) {
      const ratio = p.containmentEfficiency / (p.operationalCost || 1);
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestPlan = p;
      }
    }

    // Format comparison table
    const comparisonTable = evaluatedPlans.map(p => ({
      strategy: p.name + (p.isParetoOptimal ? ' ★ (Pareto)' : ''),
      cost: `${p.operationalCost.toFixed(1)} Units`,
      containment: `${p.containmentEfficiency}%`,
    }));

    return {
      baselineInfections,
      evaluatedStrategiesCount: evaluatedPlans.length,
      paretoFrontier,
      recommendedPlan: bestPlan,
      comparisonTable,
    };
  }
}
