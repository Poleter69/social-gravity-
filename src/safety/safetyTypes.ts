/**
 * Social Gravity — M21: Content Safety Layer
 * Type definitions for Content Risk Classification across 5 critical safety pillars:
 * Hate, Explicit, Terrorism/Extremism, Violence, Harassment.
 */

export type SafetyCategory = 'hate' | 'explicit' | 'terrorism' | 'violence' | 'harassment' | 'none';

export interface SafetyProfile {
  labels: SafetyCategory[];
  category: SafetyCategory;
  confidence: number;
  categoryScores: Record<SafetyCategory, number>;
  reasons: string[];
  flaggedKeywords?: string[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

// Backwards-compatible alias for existing code
export type SafetyClassification = SafetyProfile;

export interface SafetyFilterState {
  hate: boolean;
  explicit: boolean;
  terrorism: boolean;
  violence: boolean;
  harassment: boolean;
}

export interface SafetyTimelineEvent {
  id: string;
  timestamp: number;
  category: SafetyCategory;
  labels: SafetyCategory[];
  confidence: number;
  reasons: string[];
  source?: string;
  authorName?: string;
  contentSnippet?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SafetyReportSummary {
  hateCount: number;
  explicitCount: number;
  terrorismCount: number;
  violenceCount: number;
  harassmentCount: number;
  totalEvaluated: number;
  timeline: SafetyTimelineEvent[];
  firstDetectedAt: number | null;
  peakActivityAt: number | null;
  confidenceDistribution: Record<
    Exclude<SafetyCategory, 'none'>,
    { high: number; medium: number; low: number }
  >;
}
