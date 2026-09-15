/**
 * Social Gravity - Social Proof & Asch Conformity Rule
 * Formalizes normative peer pressure and local neighborhood consensus dynamics.
 * Grounded in Asch (1951) and Latané's Social Impact Theory (1981).
 */

import { Agent } from '../../society/types/agent';

export interface SocialProofAssessment {
  totalNeighbors: number;
  agreeingNeighbors: number;
  uninformedNeighbors: number;
  opposingNeighbors: number;
  /** Weighted consensus ratio [0, 1] */
  consensusRatio: number;
  /** Normalized social pressure experienced by agent [0, 1] */
  conformityPressure: number;
  /** True if local pressure overcomes agent's internal independence threshold */
  isConsensusCompelling: boolean;
  reasoningStep: string;
}

export function evaluateSocialProof(
  agent: Agent,
  neighbors: Agent[],
  targetBelief: 'believer' | 'skeptical' | 'debunker' = 'believer'
): SocialProofAssessment {
  if (neighbors.length === 0) {
    return {
      totalNeighbors: 0,
      agreeingNeighbors: 0,
      uninformedNeighbors: 0,
      opposingNeighbors: 0,
      consensusRatio: 0,
      conformityPressure: 0,
      isConsensusCompelling: false,
      reasoningStep: 'Agent is socially isolated; no local peer pressure detected.',
    };
  }

  let totalWeight = 0;
  let agreeingWeight = 0;
  let opposingWeight = 0;

  let agreeingCount = 0;
  let opposingCount = 0;
  let uninformedCount = 0;

  for (const neighbor of neighbors) {
    // Dyadic weight combines edge proximity with neighbor's personal influence and trust
    const dyadicTrust = agent.peerTrustMap[neighbor.id] ?? agent.traits.trust;
    const effectiveWeight = 0.4 + 0.3 * dyadicTrust + 0.3 * neighbor.traits.influence;
    totalWeight += effectiveWeight;

    if (neighbor.state.beliefStatus === targetBelief) {
      agreeingWeight += effectiveWeight;
      agreeingCount++;
    } else if (neighbor.state.beliefStatus === 'uninformed') {
      uninformedCount++;
    } else {
      opposingWeight += effectiveWeight;
      opposingCount++;
    }
  }

  const consensusRatio = totalWeight > 0 ? agreeingWeight / totalWeight : 0;

  // Non-linear Asch sigmoid: conformity amplifies when consensus exceeds 50%
  // C_threshold decreases as agent's intrinsic conformity trait increases
  const independenceThreshold = Math.max(0.2, 1.0 - agent.traits.conformity * 0.75);
  const rawPressure = consensusRatio * (0.5 + 0.5 * agent.traits.conformity);
  const conformityPressure = Number(Math.min(1.0, rawPressure).toFixed(3));

  const isConsensusCompelling = consensusRatio >= independenceThreshold && agreeingCount >= 2;

  let reasoningStep: string;
  if (agreeingCount === 0) {
    reasoningStep = `Zero of ${neighbors.length} neighbors adopt this claim; normative social pressure is zero.`;
  } else if (isConsensusCompelling) {
    reasoningStep = `${agreeingCount}/${neighbors.length} neighbors (${(consensusRatio * 100).toFixed(0)}% weighted) actively endorse this claim, exceeding conformity threshold of ${(independenceThreshold * 100).toFixed(0)}%.`;
  } else {
    reasoningStep = `${agreeingCount}/${neighbors.length} neighbors adopt, but consensus ratio (${(consensusRatio * 100).toFixed(0)}%) remains below independence barrier (${(independenceThreshold * 100).toFixed(0)}%).`;
  }

  return {
    totalNeighbors: neighbors.length,
    agreeingNeighbors: agreeingCount,
    uninformedNeighbors: uninformedCount,
    opposingNeighbors: opposingCount,
    consensusRatio: Number(consensusRatio.toFixed(3)),
    conformityPressure,
    isConsensusCompelling,
    reasoningStep,
  };
}
