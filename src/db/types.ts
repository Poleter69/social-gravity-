/**
 * Social Gravity — Zero-Cost Database Contracts
 * Universal data models compatible with PostgreSQL (Supabase / Neon),
 * libSQL (Turso), and local IndexedDB client caches.
 */

export interface SimulationRunRecord {
  id: string;
  name: string;
  archetype: string;
  seed: number;
  agent_count: number;
  edge_count: number;
  final_round: number;
  peak_believers: number;
  final_r0: number;
  echo_chamber_index: number;
  resilience_score: number;
  parameters: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface InvestigationRecord {
  id: string;
  title: string;
  description: string;
  author: string;
  status: 'open' | 'in_review' | 'resolved' | 'archived';
  simulation_seed: number;
  society_archetype: string;
  active_rumor_topic: string;
  bookmarks: Array<{
    id: string;
    round: number;
    label: string;
    notes: string;
    author: string;
    createdAt: number;
  }>;
  annotations: Array<{
    id: string;
    agentId: string;
    round: number;
    tag: string;
    notes: string;
    author: string;
    createdAt: number;
  }>;
  pinned_evidence: Array<{
    id: string;
    type: string;
    title: string;
    summary: string;
    dataSnapshot: unknown;
    pinnedBy: string;
    pinnedAt: number;
  }>;
  comments: Array<{
    id: string;
    author: string;
    content: string;
    timestamp: number;
    status: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface TelemetryFrameRecord {
  id: string;
  simulation_id: string;
  round: number;
  believers_count: number;
  skeptics_count: number;
  uninformed_count: number;
  debunkers_count: number;
  average_confidence: number;
  network_entropy: number;
  recorded_at: string;
}

export interface IntelligenceDossierRecord {
  id: string;
  simulation_id: string;
  title: string;
  verdict: string;
  threat_level: 'LOW' | 'ELEVATED' | 'HIGH' | 'SEVERE';
  resilience_score: number;
  executive_summary: string;
  top_hypotheses: unknown[];
  recommended_interventions: unknown[];
  replay_hash: string;
  tamper_seal: string;
  created_at: string;
}

export interface LiveSignalRecord {
  id: string;
  platform: string;
  author_id: string;
  author_name: string;
  content: string;
  timestamp: number;
  sentiment_label?: string;
  sentiment_score?: number;
  is_reply?: boolean;
  raw_metadata?: Record<string, unknown>;
  created_at: string;
}

export type DatabaseProviderType = 'supabase' | 'neon' | 'turso' | 'indexeddb_local';

export interface DatabaseConnectionStatus {
  provider: DatabaseProviderType;
  connected: boolean;
  latencyMs: number;
  databaseName: string;
  isZeroCost: true;
  offlineFallbackAvailable: boolean;
}
