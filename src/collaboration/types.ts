/**
 * Social Gravity - V2.0 Analyst Collaboration Layer Types
 * Shared investigations, annotations, pinned evidence, replay bookmarks, and review comments.
 */

export interface ReplayBookmark {
  id: string;
  round: number;
  label: string;
  notes: string;
  author: string;
  timestamp: number;
  snapshotDigest?: string;
}

export type AnnotationTag = 'patient_zero' | 'super_spreader' | 'bridge_broker' | 'inoculated' | 'anomaly';

export interface AgentAnnotation {
  id: string;
  agentId: string;
  round: number;
  tag: AnnotationTag;
  note: string;
  author: string;
  timestamp: number;
}

export type EvidenceType = 'transmission_event' | 'r0_spike' | 'community_breach' | 'emotion_outrage';

export interface PinnedEvidence {
  id: string;
  title: string;
  type: EvidenceType;
  round: number;
  metrics: Record<string, number | string>;
  rationale: string;
  author: string;
  timestamp: number;
}

export interface ReviewComment {
  id: string;
  author: string;
  text: string;
  timestamp: number;
  replyToId?: string;
  status: 'open' | 'addressed';
}

export interface ScenarioComparisonEntry {
  id: string;
  scenarioA: string;
  scenarioB: string;
  containmentDelta: number; // % improvement of B over A
  keyTakeaway: string;
  timestamp: number;
}

export interface Investigation {
  id: string;
  title: string;
  description: string;
  author: string;
  createdAt: number;
  updatedAt: number;
  status: 'open' | 'in_review' | 'resolved' | 'archived';
  simulationSeed: number;
  societyArchetype: string;
  activeRumorTopic: string;
  bookmarks: ReplayBookmark[];
  annotations: AgentAnnotation[];
  pinnedEvidence: PinnedEvidence[];
  comments: ReviewComment[];
  comparisonHistory: ScenarioComparisonEntry[];
}
