/**
 * Social Gravity - NLP & Emotion Intelligence Type Contracts
 * Grounded in the 28-dimensional Google GoEmotions Taxonomy (Demszky et al., ACL 2020).
 */

export const GO_EMOTIONS_LABELS = [
  'admiration',
  'amusement',
  'anger',
  'annoyance',
  'approval',
  'caring',
  'confusion',
  'curiosity',
  'desire',
  'disappointment',
  'disapproval',
  'disgust',
  'embarrassment',
  'excitement',
  'fear',
  'gratitude',
  'grief',
  'joy',
  'love',
  'nervousness',
  'optimism',
  'pride',
  'realization',
  'relief',
  'remorse',
  'sadness',
  'surprise',
  'neutral',
] as const;

export type GoEmotionLabel = (typeof GO_EMOTIONS_LABELS)[number];

export type EmotionCategory = 'positive' | 'negative' | 'social' | 'neutral';

export const EMOTION_TAXONOMY: Record<EmotionCategory, readonly GoEmotionLabel[]> = {
  positive: [
    'joy',
    'excitement',
    'pride',
    'relief',
    'gratitude',
    'love',
    'optimism',
    'amusement',
    'caring',
    'desire',
  ],
  negative: [
    'anger',
    'fear',
    'sadness',
    'disgust',
    'confusion',
    'annoyance',
    'disappointment',
    'embarrassment',
    'grief',
    'nervousness',
    'remorse',
  ],
  social: [
    'admiration',
    'approval',
    'disapproval',
    'curiosity',
    'realization',
    'surprise',
  ],
  neutral: ['neutral'],
};

/**
 * Visual color palette mapping dominant emotions to UI color tokens
 */
export const EMOTION_COLOR_MAP: Record<GoEmotionLabel, string> = {
  // Positive emotions (greens, emeralds, bright golds)
  joy: '#10B981',
  excitement: '#F59E0B',
  pride: '#8B5CF6',
  relief: '#06B6D4',
  gratitude: '#14B8A6',
  love: '#EC4899',
  optimism: '#34D399',
  amusement: '#FBBF24',
  caring: '#F472B6',
  desire: '#FB7185',

  // Negative emotions (reds, crimsons, oranges, dark purples)
  anger: '#EF4444',
  fear: '#F97316',
  sadness: '#6366F1',
  disgust: '#78716C',
  confusion: '#FB923C',
  annoyance: '#F87171',
  disappointment: '#94A3B8',
  embarrassment: '#FDBA74',
  grief: '#475569',
  nervousness: '#A855F7',
  remorse: '#64748B',

  // Social & Epistemic emotions (cyans, blues, indigos, violets)
  admiration: '#38BDF8',
  approval: '#0EA5E9',
  disapproval: '#EA580C',
  curiosity: '#06B6D4',
  realization: '#818CF8',
  surprise: '#8B5CF6',

  // Neutral
  neutral: '#64748B',
};

export interface EmotionProfile {
  primaryEmotion: GoEmotionLabel;
  dominantEmotion?: GoEmotionLabel;
  dominant?: GoEmotionLabel;
  confidence: number; // [0, 1]
  intensity: number; // Overall emotional arousal/magnitude [0, 1]
  emotionVector: Record<GoEmotionLabel, number>; // Full 28-dimensional normalized scores
  vector?: Record<GoEmotionLabel, number>;
  topEmotions: Array<{ emotion: GoEmotionLabel; score: number; name?: GoEmotionLabel }>;
  multiLabels?: Array<{ emotion: GoEmotionLabel; score: number; name?: GoEmotionLabel }>;
  category: EmotionCategory;
  valence: number; // [-1.0 (highly negative) to +1.0 (highly positive)]
  polarity?: number; // [-1.0 to +1.0] alias for valence
  arousal: number; // [0.0 (quiescent/calm) to 1.0 (frenetic/explosive)]
  confidenceTier?: 'low' | 'medium' | 'high';
  language?: string;
}

export interface CommentEmotion {
  commentId: string;
  rawText: string;
  profile: EmotionProfile;
  confidence: number;
  timestamp: number;
}

export interface EmotionInferenceOptions {
  useCache?: boolean;
  threshold?: number;
  topK?: number;
}

export interface EmotionEngineStats {
  modelLoaded: boolean;
  backend: 'transformers_onnx' | 'calibrated_lexicon' | 'hybrid';
  cacheSize: number;
  cacheCapacity: number;
  cacheHits: number;
  cacheHitRate: number;
  totalPredictions: number;
  averageLatencyMs: number;
}
