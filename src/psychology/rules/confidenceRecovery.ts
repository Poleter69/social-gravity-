/**
 * Social Gravity - Emotional Homeostasis & Confidence Recovery Rule
 * Simulates post-exposure emotional decay toward baseline equilibrium over simulation rounds.
 */

import { Agent } from '../../society/types/agent';
import { EmotionalVector } from '../types';

export interface HomeostasisShift {
  before: EmotionalVector;
  after: EmotionalVector;
  skepticismDelta: number;
  reasoningStep: string;
}

export function applyEmotionalHomeostasis(agent: Agent): HomeostasisShift {
  const current = agent.psychology.emotions;
  const before = { ...current };

  // Homeostatic pull towards calm baseline
  // Fear decays by 25% each quiet round
  const newFear = Number(Math.max(0.02, current.fear * 0.75).toFixed(3));
  // Uncertainty decays by 15% toward baseline
  const newUncertainty = Number(Math.max(0.08, current.uncertainty * 0.85).toFixed(3));
  // Calm recovers as fear subsides
  const fearDrop = current.fear - newFear;
  const newCalm = Number(Math.min(0.95, current.calm + fearDrop * 0.7 + 0.03).toFixed(3));
  // Confidence stabilizes based on agent's intrinsic influence
  const targetConfidence = agent.traits.influence * 0.5 + 0.35;
  const newConfidence = Number((current.confidence * 0.8 + targetConfidence * 0.2).toFixed(3));

  const after: EmotionalVector = {
    calm: newCalm,
    uncertainty: newUncertainty,
    fear: newFear,
    confidence: newConfidence,
  };

  // Slight passive skepticism decay towards intrinsic trait
  const targetSkepticism = (1 - agent.traits.trust) * 0.6;
  const skepticismDelta = Number(((targetSkepticism - agent.psychology.skepticism) * 0.1).toFixed(3));
  agent.psychology.skepticism = Number(Math.max(0.05, agent.psychology.skepticism + skepticismDelta).toFixed(3));
  agent.psychology.emotions = after;

  return {
    before,
    after,
    skepticismDelta,
    reasoningStep: `Homeostasis restored emotional baseline (fear subsided from ${(before.fear * 100).toFixed(0)}% to ${(after.fear * 100).toFixed(0)}%; calm rose to ${(after.calm * 100).toFixed(0)}%).`,
  };
}
