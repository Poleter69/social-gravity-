/**
 * Social Gravity - Agent Trait, State & Topology Identity
 * Represents an autonomous node in the computational social graph.
 */

import { PsychologicalState } from '../../psychology/types';

export type BeliefStatus = 'uninformed' | 'skeptical' | 'believer' | 'debunker';

export type EmotionalValence = 'neutral' | 'anxious' | 'indignant' | 'optimistic';

export interface AgentTraits {
  /** Baseline epistemic trust in peers and incoming signals [0, 1] */
  trust: number;
  /** Persuasive weight / social gravitational pull [0, 1] */
  influence: number;
  /** Susceptibility to normative peer pressure / Asch conformity [0, 1] */
  conformity: number;
  /** Willingness to share unverified or polarized claims [0, 1] */
  riskTolerance: number;
}

export interface AgentState {
  beliefStatus: BeliefStatus;
  emotionalState: EmotionalValence;
  /** Simulation tick when agent first received information */
  exposureTick: number | null;
  /** Number of times the agent has propagated an active meme/rumor */
  shareCount: number;
}

export interface AgentMetrics {
  degree: number;
  inDegree: number;
  outDegree: number;
  localClustering: number;
}

export interface Agent {
  id: string;
  name: string;
  communityId: string;
  role: string;
  traits: AgentTraits;
  state: AgentState;
  metrics: AgentMetrics;
  /** Direct neighbor adjacency list for O(1) traversal in diffusion simulation */
  connections: string[];
  /** Structural designation: high-reach gravitational hub */
  isInfluencer: boolean;
  /** Structural designation: cross-community informational vector */
  isBridge: boolean;
  /** Structural designation: peripheral node with <= 1 tie */
  isIsolated: boolean;
  /** Dyadic personalized trust ratings for connected neighbors [0, 1] */
  peerTrustMap: Record<string, number>;
  /** Dynamic psychological engine state (emotions, skepticism, resilience, decision audit trail) */
  psychology: PsychologicalState;
  /** Ingestion & real-world platform metadata */
  metadata?: Record<string, unknown>;
}

export interface AgentFilter {
  communityId?: string;
  role?: string;
  isInfluencer?: boolean;
  isBridge?: boolean;
  minTrust?: number;
  maxTrust?: number;
  minInfluence?: number;
  maxInfluence?: number;
}
