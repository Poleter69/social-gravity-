/**
 * Social Gravity - Psychological State Factory & Defaults
 * Generates calibrated initial psychological profiles based on an agent's intrinsic traits.
 */

import { AgentTraits } from '../society/types/agent';
import { PsychologicalState, EmotionalVector } from './types';

export function createInitialPsychologicalState(traits: AgentTraits): PsychologicalState {
  const calm = Number(Math.max(0.1, Math.min(0.95, 0.85 - traits.riskTolerance * 0.3)).toFixed(3));
  const uncertainty = Number(Math.max(0.05, Math.min(0.6, (1 - traits.trust) * 0.4)).toFixed(3));
  const fear = Number(Math.max(0.02, Math.min(0.4, (1 - traits.trust) * 0.2 + (1 - calm) * 0.2)).toFixed(3));
  const confidence = Number(Math.max(0.1, Math.min(0.98, traits.influence * 0.5 + traits.trust * 0.3 + 0.15)).toFixed(3));

  const emotions: EmotionalVector = {
    calm,
    uncertainty,
    fear,
    confidence,
  };

  const skepticism = Number(Math.max(0.05, Math.min(0.95, (1 - traits.trust) * 0.7 + traits.conformity * 0.1)).toFixed(3));
  const resilience = Number(Math.max(0.1, Math.min(0.95, traits.influence * 0.4 + (1 - traits.conformity) * 0.4 + 0.15)).toFixed(3));

  return {
    emotions,
    skepticism,
    resilience,
    decisionLogs: [],
    verificationsEncountered: 0,
    misinformationEncountered: 0,
  };
}
