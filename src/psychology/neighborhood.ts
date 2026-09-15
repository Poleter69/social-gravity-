/**
 * Social Gravity - Neighborhood Influence & Topological Context Analyzer
 * Evaluates local peer dynamics, cross-community bridge signal conflicts, and isolated node behavior.
 */

import { Agent } from '../society/types/agent';
import { Society } from '../society/types/society';

export interface CommunityStanceBreakdown {
  communityId: string;
  totalMembers: number;
  believers: number;
  skeptics: number;
  uninformed: number;
  adoptionRatio: number;
}

export interface NeighborhoodAnalysis {
  neighborAgents: Agent[];
  totalNeighbors: number;
  averageNeighborTrust: number;
  dominantBelief: 'uninformed' | 'skeptical' | 'believer' | 'debunker' | 'mixed';
  hasConflictingSignals: boolean;
  communityBreakdown: CommunityStanceBreakdown[];
  isolationFactor: number; // 1.0 for completely isolated, 0 for well-connected
  reasoningStep: string;
}

export function analyzeNeighborhoodContext(
  agent: Agent,
  society: Society
): NeighborhoodAnalysis {
  const agentMap = new Map(society.agents.map((a) => [a.id, a]));
  const neighbors: Agent[] = [];

  for (const connId of agent.connections) {
    const neighbor = agentMap.get(connId);
    if (neighbor) neighbors.push(neighbor);
  }

  // 1. Isolated Node Case
  if (neighbors.length === 0 || agent.isIsolated) {
    return {
      neighborAgents: neighbors,
      totalNeighbors: neighbors.length,
      averageNeighborTrust: agent.traits.trust,
      dominantBelief: 'uninformed',
      hasConflictingSignals: false,
      communityBreakdown: [],
      isolationFactor: 1.0,
      reasoningStep: 'Agent is in social isolation; neighborhood reinforcement is unavailable.',
    };
  }

  // 2. Aggregate dyadic trust and community stances
  let trustSum = 0;
  const communityMap = new Map<string, { total: number; believers: number; skeptics: number; uninformed: number }>();
  let believerCount = 0;
  let skepticCount = 0;
  let uninformedCount = 0;

  for (const n of neighbors) {
    trustSum += agent.peerTrustMap[n.id] ?? agent.traits.trust;

    const commId = n.communityId;
    if (!communityMap.has(commId)) {
      communityMap.set(commId, { total: 0, believers: 0, skeptics: 0, uninformed: 0 });
    }
    const commStats = communityMap.get(commId)!;
    commStats.total += 1;

    if (n.state.beliefStatus === 'believer') {
      believerCount++;
      commStats.believers += 1;
    } else if (n.state.beliefStatus === 'skeptical' || n.state.beliefStatus === 'debunker') {
      skepticCount++;
      commStats.skeptics += 1;
    } else {
      uninformedCount++;
      commStats.uninformed += 1;
    }
  }

  const avgTrust = Number((trustSum / neighbors.length).toFixed(3));

  // Determine dominant belief in neighborhood
  let dominantBelief: 'uninformed' | 'skeptical' | 'believer' | 'debunker' | 'mixed';
  if (believerCount > skepticCount && believerCount >= neighbors.length * 0.4) {
    dominantBelief = 'believer';
  } else if (skepticCount > believerCount && skepticCount >= neighbors.length * 0.4) {
    dominantBelief = 'skeptical';
  } else if (uninformedCount >= neighbors.length * 0.7) {
    dominantBelief = 'uninformed';
  } else {
    dominantBelief = 'mixed';
  }

  // 3. Detect Cross-Community Conflict for Bridge Nodes
  let hasConflictingSignals = false;
  const communityBreakdown: CommunityStanceBreakdown[] = [];

  communityMap.forEach((stats, commId) => {
    communityBreakdown.push({
      communityId: commId,
      totalMembers: stats.total,
      believers: stats.believers,
      skeptics: stats.skeptics,
      uninformed: stats.uninformed,
      adoptionRatio: stats.total > 0 ? Number((stats.believers / stats.total).toFixed(2)) : 0,
    });
  });

  if (agent.isBridge && communityBreakdown.length >= 2) {
    // Check if one community has high adoption while another has low or oppositional adoption
    const ratios = communityBreakdown.map((c) => c.adoptionRatio);
    const maxRatio = Math.max(...ratios);
    const minRatio = Math.min(...ratios);
    if (maxRatio >= 0.5 && minRatio <= 0.2) {
      hasConflictingSignals = true;
    }
  }

  let reasoningStep: string;
  if (hasConflictingSignals) {
    reasoningStep = `Bridge agent experiences cross-community dissonance: conflicting adoption rates between neighboring sub-communities.`;
  } else if (dominantBelief === 'believer') {
    reasoningStep = `Local cluster overwhelmingly leans toward belief (${believerCount}/${neighbors.length} neighbors adopting).`;
  } else if (dominantBelief === 'skeptical') {
    reasoningStep = `Local cluster exhibits collective resistance/skepticism (${skepticCount}/${neighbors.length} skeptics).`;
  } else {
    reasoningStep = `Local neighborhood holds heterogeneous stances (${believerCount} believers, ${skepticCount} skeptics, ${uninformedCount} uninformed).`;
  }

  return {
    neighborAgents: neighbors,
    totalNeighbors: neighbors.length,
    averageNeighborTrust: avgTrust,
    dominantBelief,
    hasConflictingSignals,
    communityBreakdown,
    isolationFactor: Number(Math.max(0, 1.0 - neighbors.length / 6).toFixed(2)),
    reasoningStep,
  };
}
