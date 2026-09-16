/**
 * Social Gravity - Autonomous Analyst Assistant Types (M13)
 * Evidence-backed, local-first intelligence copilot contracts for incident summarization,
 * causal alert explanation, intervention recommendations, and repository-aware Q&A.
 */

export interface CopilotEvidenceRef {
  type: 'node' | 'telemetry_tick' | 'community' | 'snapshot';
  id: string;
  label: string;
  metricSnapshot?: Record<string, number | string>;
}

export interface InvestigationTimelineEvent {
  tick: number;
  timestampFormatted: string;
  category: 'IGNITION' | 'CROSS_COMMUNITY_BRIDGE' | 'VIRAL_ACCELERATION' | 'CONTAINMENT_INTERVENTION' | 'EQUILIBRIUM';
  headline: string;
  details: string;
  keyActors: string[];
  severity: 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'LOW';
}

export interface IncidentSummary {
  title: string;
  executiveBrief: string;
  rootCauseNodeId: string;
  peakR0: number;
  totalInfectedPercentage: number;
  unreachedSusceptibleCount: number;
  communitiesPenetrated: string[];
  timeline: InvestigationTimelineEvent[];
  recommendedImmediateAction: string;
}

export interface CopilotAnswer {
  query: string;
  answerText: string;
  confidenceScore: number;       // [0, 1]
  evidenceReferences: CopilotEvidenceRef[];
  suggestedFollowUpQueries: string[];
  suggestedAction?: {
    actionType: 'APPLY_INTERVENTION' | 'SCRUB_TIMELINE' | 'INSPECT_NODE' | 'EXPORT_REPORT';
    payload: any;
  };
}
