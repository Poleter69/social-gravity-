/**
 * Social Gravity - Threat Salience & Fear Amplification Rule
 * Grounded in Kahneman & Tversky's Prospect Theory (1979) and Affect Heuristic (Slovic, 2007).
 * Evaluates how sensational, alarming, or negative claims evoke cognitive fear and uncertainty.
 */

import { Agent } from '../../society/types/agent';
import { EmotionalVector, InformationSignal } from '../types';

export interface FearAssessment {
  initialFear: number;
  resultingFear: number;
  deltaFear: number;
  threatMultiplier: number;
  emotionalShift: EmotionalVector;
  reasoningStep: string;
}

export function evaluateFearAmplification(
  agent: Agent,
  signal: InformationSignal
): FearAssessment {
  const current = agent.psychology.emotions;
  const salience = signal.emotionalSalience;

  // Prospect Theory: Low risk tolerance manifests as heightened loss aversion / threat vigilance
  const threatSensitivity = 1.2 - agent.traits.riskTolerance * 0.7; // [0.5, 1.2]
  const resilienceBuffer = 1.0 - agent.psychology.resilience * 0.6; // [0.4, 1.0]

  // Fear surge formula
  const rawDeltaFear = salience * threatSensitivity * resilienceBuffer * (1.0 - current.calm * 0.5);
  const deltaFear = Number(Math.max(0, Math.min(0.65, rawDeltaFear)).toFixed(3));

  const resultingFear = Number(Math.min(1.0, current.fear + deltaFear).toFixed(3));
  const resultingCalm = Number(Math.max(0.02, current.calm - deltaFear * 0.8).toFixed(3));
  const resultingUncertainty = Number(Math.min(1.0, current.uncertainty + deltaFear * 0.45).toFixed(3));
  const resultingConfidence = Number(Math.max(0.05, current.confidence - deltaFear * 0.35).toFixed(3));

  const emotionalShift: EmotionalVector = {
    calm: resultingCalm,
    uncertainty: resultingUncertainty,
    fear: resultingFear,
    confidence: resultingConfidence,
  };

  let reasoningStep: string;
  if (salience < 0.25) {
    reasoningStep = `Message salience is low (${(salience * 100).toFixed(0)}%); emotional calm is preserved (${(resultingCalm * 100).toFixed(0)}%).`;
  } else if (deltaFear >= 0.25) {
    reasoningStep = `Alarming content (salience ${(salience * 100).toFixed(0)}%) provoked high threat vigilance (fear surged +${(deltaFear * 100).toFixed(0)}% to ${(resultingFear * 100).toFixed(0)}%).`;
  } else {
    reasoningStep = `Moderate emotional charge (salience ${(salience * 100).toFixed(0)}%) induced modest tension (fear +${(deltaFear * 100).toFixed(0)}%).`;
  }

  return {
    initialFear: current.fear,
    resultingFear,
    deltaFear,
    threatMultiplier: Number(threatSensitivity.toFixed(3)),
    emotionalShift,
    reasoningStep,
  };
}
