/**
 * Social Gravity - Unified Experiment Telemetry Collector
 * Ingests completed or in-flight simulation runs and formats them into a structured,
 * canonical research experiment record for computational social science analysis.
 */

import { Society } from '../society/types/society';
import { SimulationState, RoundTelemetry } from '../simulation/types';
import { CascadeTracker } from '../simulation/cascadeTracker';
import { ExperimentTelemetry } from './types';

export class TelemetryCollector {
  private static experiments: ExperimentTelemetry[] = [];

  /**
   * Transforms raw simulation runtime state and society topology into a structured experiment record.
   */
  public static collect(society: Society, simState: SimulationState): ExperimentTelemetry {
    const rounds: RoundTelemetry[] = simState.telemetryHistory;
    const totalPopulation = society.agents.length || 1;
    const latestRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;

    // 1. Extract Peak & Final Counts
    let peakBelievers = 0;
    let peakR0 = 0;
    let peakVelocity = 0;
    let totalVelocity = 0;

    rounds.forEach((r) => {
      if (r.believerCount > peakBelievers) peakBelievers = r.believerCount;
      if (r.r0 > peakR0) peakR0 = r.r0;
      if (r.cascadeVelocity > peakVelocity) peakVelocity = r.cascadeVelocity;
      totalVelocity += r.cascadeVelocity;
    });

    const averageVelocity = rounds.length > 0 ? Number((totalVelocity / rounds.length).toFixed(2)) : 0;
    const finalBelievers = latestRound ? latestRound.believerCount : 0;
    const finalDebunkers = latestRound ? latestRound.debunkerCount : 0;
    const finalSkeptics = latestRound ? latestRound.skepticCount : 0;
    const finalSusceptible = latestRound ? latestRound.susceptibleCount : totalPopulation;
    const finalR0 = latestRound ? latestRound.r0 : 0;
    const maxCascadeDepth = latestRound ? latestRound.maxCascadeDepth : 0;

    // 2. Structural Segment Analysis (Bridge vs Influencer adoption)
    let bridgeBelievers = 0;
    let totalBridges = 0;
    let influencerBelievers = 0;
    let totalInfluencers = 0;

    society.agents.forEach((agent) => {
      const state = simState.agentStates.get(agent.id);
      if (agent.isBridge) {
        totalBridges++;
        if (state === 'BELIEVER') bridgeBelievers++;
      }
      if (agent.isInfluencer) {
        totalInfluencers++;
        if (state === 'BELIEVER') influencerBelievers++;
      }
    });

    const bridgeInfectionRatio = totalBridges > 0 ? Number((bridgeBelievers / totalBridges).toFixed(3)) : 0;
    const influencerInfectionRatio = totalInfluencers > 0 ? Number((influencerBelievers / totalInfluencers).toFixed(3)) : 0;

    // 3. Community-Level Stances & Polarization
    const communityOutcomes = society.communities.map((comm) => {
      let believers = 0;
      let debunkers = 0;
      let skeptics = 0;

      comm.agentIds.forEach((agentId) => {
        const state = simState.agentStates.get(agentId);
        if (state === 'BELIEVER') believers++;
        else if (state === 'DEBUNKER') debunkers++;
        else if (state === 'SKEPTIC') skeptics++;
      });

      const total = comm.agentIds.length || 1;
      const penetrationRate = Number((believers / total).toFixed(3));

      return {
        communityId: comm.id,
        name: comm.name,
        total,
        believers,
        debunkers,
        skeptics,
        penetrationRate,
      };
    });

    // Compute Echo Chamber Polarization across communities
    const penetrationMap: Record<string, number> = {};
    communityOutcomes.forEach((c) => {
      penetrationMap[c.communityId] = c.penetrationRate;
    });
    const echoChamberPolarization = CascadeTracker.calculateEchoChamberIndex(penetrationMap);

    // 4. Counter-Intervention Diagnostics
    const hasIntervention = simState.activeDebunk !== null;
    let interventionRound: number | null = null;
    let postInterventionR0Drop = 0;

    if (hasIntervention && simState.activeDebunk) {
      interventionRound = simState.activeDebunk.round;
      const preRound = rounds.find((r) => r.round === interventionRound);
      const postRound = rounds[rounds.length - 1];
      if (preRound && postRound) {
        postInterventionR0Drop = Number((preRound.r0 - postRound.r0).toFixed(2));
      }
    }

    const telemetry: ExperimentTelemetry = {
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      populationSize: totalPopulation,
      communityCount: society.communities.length,
      influencerCount: society.summary.influencerCount,
      bridgeCount: society.summary.bridgeNodeCount,
      isolatedCount: society.summary.isolatedNodeCount,
      averageTrust: society.summary.avgTrust,
      averageConformity: society.summary.avgConformity,
      averageInfluence: society.summary.avgInfluence,
      averageRiskTolerance: society.summary.avgRiskTolerance,
      networkDensity: society.metrics.density,
      clusteringCoefficient: society.metrics.globalClusteringCoefficient,

      rumorTopic: simState.activeRumor ? simState.activeRumor.topic : 'General Misinformation',
      rumorVeracity: simState.activeRumor ? simState.activeRumor.veracity : 'false',
      rumorFearSalience: simState.activeRumor ? simState.activeRumor.emotionalSalience : 0.5,
      rumorComplexity: simState.activeRumor ? simState.activeRumor.complexity : 0.3,
      patientZeroIds: simState.patientZeroIds,

      totalRounds: simState.currentRound,
      peakBelievers,
      finalBelievers,
      finalDebunkers,
      finalSkeptics,
      finalSusceptible,
      adoptionRate: Number((finalBelievers / totalPopulation).toFixed(3)),
      debunkRate: Number((finalDebunkers / totalPopulation).toFixed(3)),
      resistanceRate: Number((finalSkeptics / totalPopulation).toFixed(3)),

      peakR0,
      finalR0,
      maxCascadeDepth,
      peakVelocity,
      averageVelocity,
      echoChamberPolarization,

      hasIntervention,
      interventionRound,
      postInterventionR0Drop,

      roundTelemetry: rounds,
      communityOutcomes,
      bridgeInfectionRatio,
      influencerInfectionRatio,
    };

    TelemetryCollector.experiments.push(telemetry);
    return telemetry;
  }

  public static getExperiments(): ExperimentTelemetry[] {
    return this.experiments;
  }

  public static clearHistory(): void {
    this.experiments = [];
  }
}
