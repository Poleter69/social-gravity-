/**
 * Social Gravity - Psychological State Factory & Defaults
 * Generates calibrated initial psychological profiles based on an agent's intrinsic traits.
 */

import { AgentTraits } from '../society/types/agent';
import { PsychologicalState, EmotionalVector } from './types';
import { EmotionEngine } from '../nlp/emotionEngine';
import { 
  EmotionProfile, 
  GoEmotionLabel, 
  GO_EMOTIONS_LABELS, 
  EMOTION_TAXONOMY, 
  EmotionCategory 
} from '../nlp/types';

export function synthesizeEmotionProfileFromTraits(
  traits: AgentTraits, 
  contentOrRole?: string
): EmotionProfile {
  if (contentOrRole && contentOrRole.trim().length > 0) {
    const profile = EmotionEngine.getInstance().predictSync(contentOrRole);
    if (profile.primaryEmotion !== 'neutral') {
      return profile;
    }
  }

  // 1. Initialize full 28D vector
  const vector: Record<GoEmotionLabel, number> = {} as any;
  for (const label of GO_EMOTIONS_LABELS) {
    vector[label] = 0.02;
  }

  // Trait-driven dimensional emotional affinities
  const fearDrive = Math.max(0.05, (1 - traits.trust) * 0.55 + (1 - traits.riskTolerance) * 0.35);
  const angerDrive = Math.max(0.04, (1 - traits.trust) * 0.65 + traits.conformity * 0.25 - traits.influence * 0.2);
  const curiosityDrive = Math.max(0.05, traits.riskTolerance * 0.75 + (1 - traits.conformity) * 0.35);
  const joyDrive = Math.max(0.05, traits.trust * 0.65 + (1 - traits.conformity) * 0.25);
  const admirationDrive = Math.max(0.05, traits.trust * 0.6 + traits.influence * 0.4);
  const prideDrive = Math.max(0.04, traits.influence * 0.75 + (1 - traits.conformity) * 0.3);
  const optimismDrive = Math.max(0.05, traits.trust * 0.5 + traits.influence * 0.4 + traits.riskTolerance * 0.25);

  vector.fear = Number(Math.min(0.95, fearDrive).toFixed(3));
  vector.anger = Number(Math.min(0.95, angerDrive).toFixed(3));
  vector.curiosity = Number(Math.min(0.95, curiosityDrive).toFixed(3));
  vector.joy = Number(Math.min(0.95, joyDrive).toFixed(3));
  vector.admiration = Number(Math.min(0.95, admirationDrive).toFixed(3));
  vector.pride = Number(Math.min(0.95, prideDrive).toFixed(3));
  vector.optimism = Number(Math.min(0.95, optimismDrive).toFixed(3));
  vector.approval = Number(Math.min(0.95, traits.trust * 0.6).toFixed(3));
  vector.disapproval = Number(Math.min(0.95, (1 - traits.trust) * 0.6).toFixed(3));
  vector.nervousness = Number(Math.min(0.95, fearDrive * 0.8).toFixed(3));
  vector.excitement = Number(Math.min(0.95, (traits.riskTolerance * 0.55 + traits.influence * 0.4)).toFixed(3));
  vector.neutral = 0.10;

  // Rank top emotions (excluding neutral from primary competition)
  const sorted = (Object.entries(vector) as [GoEmotionLabel, number][])
    .filter(([k]) => k !== 'neutral')
    .sort((a, b) => b[1] - a[1]);

  const top = sorted[0];
  const primaryEmotion = top ? top[0] : 'curiosity';
  const confidence = top ? Number(Math.min(0.96, Math.max(0.62, top[1])).toFixed(2)) : 0.78;

  let category: EmotionCategory = 'social';
  for (const [cat, labels] of Object.entries(EMOTION_TAXONOMY)) {
    if ((labels as readonly string[]).includes(primaryEmotion)) {
      category = cat as EmotionCategory;
      break;
    }
  }

  const topEmotions = sorted.slice(0, 5).map(([emotion, score]) => ({
    emotion,
    score,
    name: emotion,
  }));

  return {
    primaryEmotion,
    dominantEmotion: primaryEmotion,
    confidence,
    confidenceTier: confidence >= 0.61 ? 'high' : confidence >= 0.31 ? 'medium' : 'low',
    intensity: Number(Math.min(1.0, Math.max(0.2, top[1])).toFixed(2)),
    emotionVector: vector,
    topEmotions,
    category,
    valence: Number((joyDrive + optimismDrive - fearDrive - angerDrive).toFixed(2)),
    arousal: Number((traits.riskTolerance * 0.5 + traits.influence * 0.3 + 0.2).toFixed(2)),
  };
}

export function createInitialPsychologicalState(
  traits: AgentTraits, 
  contentOrRole?: string
): PsychologicalState {
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

  const emotionProfile = synthesizeEmotionProfileFromTraits(traits, contentOrRole);

  return {
    emotions,
    skepticism,
    resilience,
    decisionLogs: [],
    verificationsEncountered: 0,
    misinformationEncountered: 0,
    emotionProfile,
  };
}
