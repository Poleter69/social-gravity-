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

  // Real GoEmotions extraction from signal profile
  const signalFear = signal.emotionProfile?.emotionVector?.fear || 0;
  const signalAnger = signal.emotionProfile?.emotionVector?.anger || 0;
  const signalConfusion = signal.emotionProfile?.emotionVector?.confusion || 0;
  const signalGratitude = signal.emotionProfile?.emotionVector?.gratitude || 0;

  // Effective threat stimulus incorporates fear and anger activation
  const threatStimulus = Math.max(
    salience,
    signalFear * 1.15 + signalAnger * 0.85 - signalGratitude * 0.5
  );

  // Prospect Theory: Low risk tolerance manifests as heightened loss aversion / threat vigilance
  const threatSensitivity = 1.2 - agent.traits.riskTolerance * 0.7; // [0.5, 1.2]
  const resilienceBuffer = 1.0 - agent.psychology.resilience * 0.6; // [0.4, 1.0]

  // Fear surge formula
  const rawDeltaFear = threatStimulus * threatSensitivity * resilienceBuffer * (1.0 - current.calm * 0.5);
  const deltaFear = Number(Math.max(0, Math.min(0.75, rawDeltaFear)).toFixed(3));

  // Confusion elevates epistemic uncertainty directly
  const deltaUncertainty = Number(
    Math.min(0.65, (signalConfusion * 0.65 + deltaFear * 0.45) * resilienceBuffer).toFixed(3)
  );

  // Anger surge accelerates propagation urgency
  const deltaAnger = Number(Math.min(0.70, signalAnger * 0.8 * threatSensitivity).toFixed(3));

  const resultingFear = Number(Math.min(1.0, current.fear + deltaFear).toFixed(3));
  const resultingCalm = Number(
    Math.max(0.02, current.calm - deltaFear * 0.8 + signalGratitude * 0.3).toFixed(3)
  );
  const resultingUncertainty = Number(Math.min(1.0, current.uncertainty + deltaUncertainty).toFixed(3));
  const resultingConfidence = Number(Math.max(0.05, current.confidence - deltaFear * 0.35).toFixed(3));
  const resultingAnger = Number(Math.min(1.0, (current.anger || 0) + deltaAnger).toFixed(3));

  const emotionalShift: EmotionalVector = {
    calm: resultingCalm,
    uncertainty: resultingUncertainty,
    fear: resultingFear,
    confidence: resultingConfidence,
    anger: resultingAnger,
    admiration: signal.emotionProfile?.emotionVector?.admiration || current.admiration,
    curiosity: signal.emotionProfile?.emotionVector?.curiosity || current.curiosity,
    gratitude: signalGratitude > 0.2 ? signalGratitude : current.gratitude,
    disapproval: signal.emotionProfile?.emotionVector?.disapproval || current.disapproval,
  };

  let reasoningStep: string;
  if (signalAnger >= 0.4) {
    reasoningStep = `Provocative hostile signal (anger ${(signalAnger * 100).toFixed(0)}%) provoked high arousal and urgent outrage (+${(deltaAnger * 100).toFixed(0)}%).`;
  } else if (signalConfusion >= 0.4) {
    reasoningStep = `Ambiguous claims (confusion ${(signalConfusion * 100).toFixed(0)}%) destabilized epistemic certainty (+${(deltaUncertainty * 100).toFixed(0)}% uncertainty).`;
  } else if (threatStimulus < 0.25) {
    reasoningStep = `Message salience is low (${(threatStimulus * 100).toFixed(0)}%); emotional calm is preserved (${(resultingCalm * 100).toFixed(0)}%).`;
  } else if (deltaFear >= 0.25) {
    reasoningStep = `Alarming content (fear salience ${(threatStimulus * 100).toFixed(0)}%) provoked high threat vigilance (fear surged +${(deltaFear * 100).toFixed(0)}% to ${(resultingFear * 100).toFixed(0)}%).`;
  } else {
    reasoningStep = `Moderate emotional charge (salience ${(threatStimulus * 100).toFixed(0)}%) induced modest tension (fear +${(deltaFear * 100).toFixed(0)}%).`;
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
