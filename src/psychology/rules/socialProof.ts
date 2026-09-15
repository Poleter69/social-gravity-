/**
 * Social Gravity - Social Proof & Asch Conformity Rule
 * Formalizes normative peer pressure and local neighborhood consensus dynamics.
 * Grounded in Asch (1951) and Latané's Social Impact Theory (1981).
 */

import { Agent } from '../../society/types/agent';
import { EmotionProfile } from '../../nlp/types';

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
  targetBelief: 'believer' | 'skeptical' | 'debunker' = 'believer',
  signalEmotion?: EmotionProfile
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
    // Neighbor approval strengthens peer influence
    const neighborApproval = neighbor.psychology.emotionProfile?.emotionVector?.approval || 0;
    const effectiveWeight = 0.4 + 0.3 * dyadicTrust + 0.3 * neighbor.traits.influence + 0.15 * neighborApproval;
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
  // Emotional intensity shifts Asch conformity thresholds:
  // High emotional intensity lowers resistance to social pressure (lowers independence threshold)
  const emotionalIntensity = signalEmotion?.intensity ?? 0.2;
  const emotionalThresholdShift = emotionalIntensity * 0.25; // up to -0.25 threshold reduction
  const independenceThreshold = Math.max(0.12, 1.0 - agent.traits.conformity * 0.75 - emotionalThresholdShift);
  const rawPressure = consensusRatio * (0.5 + 0.5 * agent.traits.conformity + 0.2 * emotionalIntensity);
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
