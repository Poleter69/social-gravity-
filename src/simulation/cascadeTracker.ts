/**
 * Social Gravity - Cascade Telemetry & Epidemic Tracker
 * Real-time calculation of basic reproduction number R0(t), propagation velocity,
 * cascade tree depth, and community echo chamber polarization.
 */

import { Society } from '../society/types/society';
import { AgentEpidemicState, RoundTelemetry } from './types';

export class CascadeTracker {
  /**
   * Compute comprehensive telemetry snapshot for the current round.
   */
  public static computeSnapshot(
    round: number,
    society: Society,
    agentStates: Map<string, AgentEpidemicState>,
    infectionParents: Map<string, string>,
    previousSnapshot: RoundTelemetry | null
  ): RoundTelemetry {
    let susceptibleCount = 0;
    let exposedCount = 0;
    let believerCount = 0;
    let skepticCount = 0;
    let debunkerCount = 0;

    // Track community counts
    const communityTotal = new Map<string, number>();
    const communityBelievers = new Map<string, number>();

    society.communities.forEach(c => {
      communityTotal.set(c.id, 0);
      communityBelievers.set(c.id, 0);
    });

    society.agents.forEach(agent => {
      const state = agentStates.get(agent.id) || 'SUSCEPTIBLE';
      const commId = agent.communityId;

      communityTotal.set(commId, (communityTotal.get(commId) || 0) + 1);

      switch (state) {
        case 'SUSCEPTIBLE':
          susceptibleCount++;
          break;
        case 'EXPOSED':
          exposedCount++;
          break;
        case 'BELIEVER':
          believerCount++;
          communityBelievers.set(commId, (communityBelievers.get(commId) || 0) + 1);
          break;
        case 'SKEPTIC':
          skepticCount++;
          break;
        case 'DEBUNKER':
          debunkerCount++;
          break;
      }
    });

    // Compute new infections & new debunkers relative to previous snapshot
    const prevBelievers = previousSnapshot ? previousSnapshot.believerCount : 0;
    const prevDebunkers = previousSnapshot ? previousSnapshot.debunkerCount : 0;
    const newInfections = Math.max(0, believerCount - prevBelievers);
    const newDebunked = Math.max(0, debunkerCount - prevDebunkers);

    // Compute effective reproduction number R0
    // R0 = new infections / active infectors in previous round
    let r0 = 0;
    if (round === 0) {
      r0 = believerCount; // Initial seeds
    } else if (previousSnapshot && previousSnapshot.newInfections > 0) {
      r0 = Number((newInfections / previousSnapshot.newInfections).toFixed(2));
    } else if (prevBelievers > 0) {
      r0 = Number((newInfections / Math.max(1, Math.min(prevBelievers, 5))).toFixed(2));
    }

    // Cascade tree max depth
    let maxCascadeDepth = 0;
    infectionParents.forEach((_, childId) => {
      let depth = 0;
      let curr: string | undefined = childId;
      const visited = new Set<string>();

      while (curr && infectionParents.has(curr) && !visited.has(curr)) {
        visited.add(curr);
        curr = infectionParents.get(curr);
        depth++;
      }
      if (depth > maxCascadeDepth) {
        maxCascadeDepth = depth;
      }
    });

    // Community penetration ratios
    const communityPenetration: Record<string, number> = {};
    society.communities.forEach(c => {
      const total = communityTotal.get(c.id) || 1;
      const believers = communityBelievers.get(c.id) || 0;
      communityPenetration[c.id] = Number((believers / total).toFixed(3));
    });

    return {
      round,
      timestamp: Date.now(),
      susceptibleCount,
      exposedCount,
      believerCount,
      skepticCount,
      debunkerCount,
      newInfections,
      newDebunked,
      r0,
      cascadeVelocity: newInfections,
      maxCascadeDepth,
      communityPenetration,
    };
  }

  /**
   * Calculate Echo Chamber Polarization Index (0.0 to 1.0)
   * Quantifies the degree of belief variance between segregated community clusters.
   */
  public static calculateEchoChamberIndex(penetrations: Record<string, number>): number {
    const values = Object.values(penetrations);
    if (values.length <= 1) return 0;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    // Standard deviation of fractions bounded by max possible std dev (0.5 for binary partition)
    return Math.min(1.0, Number((standardDeviation * 2).toFixed(3)));
  }
}
