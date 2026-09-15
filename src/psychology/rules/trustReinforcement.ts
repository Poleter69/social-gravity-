/**
 * Social Gravity - Trust Reinforcement & Bayesian Epistemic Updating Rule
 * Models asymmetric trust dynamics: trust is built incrementally but depreciates rapidly upon deception.
 * Grounded in Bayesian Belief Updating and Slovic's Asymmetry Principle of Trust (1993).
 */

import { Agent } from '../../society/types/agent';
import { EmotionProfile } from '../../nlp/types';

export interface TrustEvaluation {
  senderId: string;
  priorSenderTrust: number;
  posteriorSenderTrust: number;
  generalTrustDelta: number;
  skepticismDelta: number;
  reasoningStep: string;
}

export function evaluateSenderCredibility(
  agent: Agent,
  senderId: string,
  signalEmotion?: EmotionProfile
): { senderTrust: number; reasoningStep: string } {
  const isDirectPeer = agent.connections.includes(senderId);
  const dyadicTrust = agent.peerTrustMap[senderId] ?? agent.traits.trust;

  if (senderId === agent.id) {
    return { senderTrust: 1.0, reasoningStep: 'Self-generated signal.' };
  }

  // Real GoEmotions Affective Modulation:
  // Admiration increases trust (+0.15 * score)
  // Approval strengthens persuasion (+0.10 * score)
  // Disapproval weakens persuasion (-0.18 * score)
  let emotionalTrustShift = 0;
  let emotionReasoning = '';
  if (signalEmotion) {
    const adm = signalEmotion.emotionVector?.admiration || 0;
    const app = signalEmotion.emotionVector?.approval || 0;
    const dis = signalEmotion.emotionVector?.disapproval || 0;

    emotionalTrustShift = 0.15 * adm + 0.1 * app - 0.18 * dis;
    if (adm > 0.3) {
      emotionReasoning = ` Admiration boosted epistemic trust (+${(adm * 15).toFixed(0)}%).`;
    } else if (app > 0.3) {
      emotionReasoning = ` Approval reinforced persuasion (+${(app * 10).toFixed(0)}%).`;
    } else if (dis > 0.3) {
      emotionReasoning = ` Disapproval weakened sender credibility (-${(dis * 18).toFixed(0)}%).`;
    }
  }

  const effectiveTrust = Number(
    Math.max(0.02, Math.min(0.99, dyadicTrust + emotionalTrustShift)).toFixed(3)
  );

  let reasoningStep: string;
  if (isDirectPeer) {
    reasoningStep = `Sender ${senderId} is a recognized contact with dyadic trust ${(effectiveTrust * 100).toFixed(0)}%.${emotionReasoning}`;
  } else {
    reasoningStep = `Sender ${senderId} is an outside contact; effective prior ${(effectiveTrust * 100).toFixed(0)}%.${emotionReasoning}`;
  }

  return {
    senderTrust: effectiveTrust,
    reasoningStep,
  };
}

export function updateTrustOnVerification(
  agent: Agent,
  senderId: string,
  actualVeracity: 'true' | 'false'
): TrustEvaluation {
  const prior = agent.peerTrustMap[senderId] ?? agent.traits.trust;

  if (actualVeracity === 'true') {
    // Incremental trust gain: Delta = +0.12 * (1 - prior)
    const gain = Number((0.12 * (1.0 - prior)).toFixed(3));
    const posterior = Number(Math.min(0.99, prior + gain).toFixed(3));
    const generalTrustDelta = 0.02;
    const skepticismDelta = -0.05;

    agent.peerTrustMap[senderId] = posterior;
    agent.traits.trust = Number(Math.min(1.0, agent.traits.trust + generalTrustDelta).toFixed(3));
    agent.psychology.skepticism = Number(Math.max(0.02, agent.psychology.skepticism + skepticismDelta).toFixed(3));
    agent.psychology.verificationsEncountered += 1;

    return {
      senderId,
      priorSenderTrust: prior,
      posteriorSenderTrust: posterior,
      generalTrustDelta,
      skepticismDelta,
      reasoningStep: `Information from ${senderId} confirmed accurate. Dyadic trust increased +${(gain * 100).toFixed(0)}% (to ${(posterior * 100).toFixed(0)}%).`,
    };
  } else {
    // Sharp trust collapse (Asymmetry Principle): Loss = -0.40 * prior
    const loss = Number((0.40 * prior).toFixed(3));
    const posterior = Number(Math.max(0.05, prior - loss).toFixed(3));
    const generalTrustDelta = -0.04;
    const skepticismDelta = 0.15;

    agent.peerTrustMap[senderId] = posterior;
    agent.traits.trust = Number(Math.max(0.05, agent.traits.trust + generalTrustDelta).toFixed(3));
    agent.psychology.skepticism = Number(Math.min(0.98, agent.psychology.skepticism + skepticismDelta).toFixed(3));
    agent.psychology.misinformationEncountered += 1;

    return {
      senderId,
      priorSenderTrust: prior,
      posteriorSenderTrust: posterior,
      generalTrustDelta,
      skepticismDelta,
      reasoningStep: `Information from ${senderId} discovered false/debunked! Dyadic trust collapsed -${(loss * 100).toFixed(0)}% (dropped to ${(posterior * 100).toFixed(0)}%); skepticism hardened to ${(agent.psychology.skepticism * 100).toFixed(0)}%.`,
    };
  }
}
