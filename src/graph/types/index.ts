/**
 * Social Gravity V2 - Dynamic Temporal Graph Types
 *
 * Mathematical and computational models for a living, event-driven,
 * deterministic temporal communication network.
 */

import { EmotionProfile, GoEmotionLabel } from '../../nlp/types';

export type RelationshipType =
  | 'peer'
  | 'hierarchical'
  | 'bridge'
  | 'weak_tie'
  | 'broadcast'
  | 'family'
  | 'institutional'
  | string;

export type EdgeStatus = 'active' | 'weak' | 'dormant' | 'removed';

export type NodeStatus = 'active' | 'inactive' | 'dormant';

/**
 * Represents an autonomous individual within the dynamic communication network.
 */
export interface DynamicNode {
  /** Deterministic unique identifier (e.g. 'agent_0', 'dept_a_node_4') */
  id: string;

  /** Primary structural cluster or community partition ID */
  communityId: string;

  /** Gravitational reach / social persuasion capacity in range [0, 1] */
  currentInfluence: number;

  /**
   * Reserved placeholder for Phase 3 (Trust Evolution Engine).
   * Will hold dyadic, institutional, and bayesian epistemic trust matrices.
   */
  trustPlaceholder: Record<string, unknown> | null;

  /**
   * Reserved placeholder for Phase 4 (Emotional Contagion Engine).
   * Will hold multi-dimensional emotional state vector (Fear, Anger, Trust, etc.).
   */
  emotionalPlaceholder: Record<string, unknown> | null;
  emotionProfile?: EmotionProfile;
  dominantEmotion?: GoEmotionLabel;

  /** Simulation tick at which the node entered the network */
  createdTick: number;

  /** Simulation tick of the most recent interaction or signal emission */
  lastActiveTick: number;

  /** Operational lifecycle state */
  status: NodeStatus;

  /** Extensible key-value metadata for downstream adapters */
  metadata?: Record<string, unknown>;
}

/**
 * Dynamic relationship between two individuals.
 * Edges evolve their transmission capacity (weight) based on temporal interaction frequency.
 */
export interface DynamicEdge {
  /** Deterministic composite identifier (e.g. 'u->v' or canonical 'u--v') */
  id: string;

  /** Source node ID */
  source: string;

  /** Target node ID */
  target: string;

  /**
   * Dyadic transmission weight / bandwidth in range [0, 1].
   * Evolves dynamically: strengthened by interaction, eroded by temporal decay.
   */
  weight: number;

  /** Sociological relationship classification */
  relationshipType: RelationshipType;

  /** Simulation tick when the tie was formed */
  createdTick: number;

  /** Simulation tick of the most recent transmission across this tie */
  lastInteractionTick: number;

  /** Active flag indicates whether the edge participates in current message diffusion */
  active: boolean;

  /** Edge lifecycle status derived from weight thresholds */
  status: EdgeStatus;

  /** Whether the edge is directed or undirected */
  directed: boolean;

  /** Extensible key-value metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Configuration parameters for edge weight evolution and temporal decay.
 */
export interface RelationshipDynamicsConfig {
  /**
   * Asymptotic strengthening factor alpha in [0, 1].
   * w_{t+1} = w_t + alpha * (1 - w_t)
   * Default: 0.18
   */
  strengtheningRate: number;

  /**
   * Exponential decay rate lambda in [0, 1] applied per tick of inactivity.
   * w_{t+1} = w_t * (1 - lambda)
   * Default: 0.05
   */
  decayRate: number;

  /** Weight threshold to remain 'active'. Default: 0.50 */
  activeThreshold: number;

  /** Weight threshold below which edge becomes 'weak'. Default: 0.25 */
  weakThreshold: number;

  /** Weight threshold below which edge becomes 'dormant'. Default: 0.08 */
  dormantThreshold: number;

  /** Weight threshold at/below which edge is classified 'removed'. Default: 0.02 */
  removalThreshold: number;

  /** Consecutive dormant ticks before an edge is permanently pruned. Default: 10 */
  dormantTicksBeforePruning: number;
}

/**
 * Complete set of event types driving the temporal graph mutation lifecycle.
 * No state changes occur without a corresponding event.
 */
export type GraphEventType =
  | 'NODE_JOINED'
  | 'NODE_UPDATED'
  | 'NODE_INACTIVATED'
  | 'EDGE_CREATED'
  | 'EDGE_STRENGTHENED'
  | 'EDGE_WEAKENED'
  | 'EDGE_STATUS_CHANGED'
  | 'EDGE_REMOVED'
  | 'INTERACTION'
  | 'MESSAGE_SENT'
  | 'CHECKPOINT_SAVED'
  | 'CUSTOM_EVENT';

/**
 * Immutable atomic event record enabling deterministic audit and time-travel replay.
 */
export interface GraphEvent<T = Record<string, unknown>> {
  /** Unique deterministic event ID (e.g. 'evt_t12_s004') */
  id: string;

  /** Discrete simulation tick when event occurred */
  tick: number;

  /** Deterministic sequence counter within the tick */
  seq: number;

  /** Classified event type */
  type: GraphEventType;

  /** Strongly-typed event payload */
  payload: T;

  /** Wall-clock millisecond timestamp (for telemetry only, not simulation logic) */
  wallTimestamp?: number;
}

/**
 * Network topology metrics calculated live per tick.
 */
export interface DynamicGraphMetrics {
  /** Current discrete tick */
  tick: number;

  /** Total nodes registered in the graph */
  totalNodes: number;

  /** Number of currently active nodes */
  activeNodes: number;

  /** Total non-removed edges */
  totalEdges: number;

  /** Edges currently with status === 'active' */
  activeEdges: number;

  /** Graph density rho = 2|E| / (|V|(|V|-1)) for undirected */
  density: number;

  /** Average node degree across all active nodes */
  averageDegree: number;

  /** Node degree frequency histogram (degree -> count) */
  degreeDistribution: Record<number, number>;

  /**
   * Watts-Strogatz global clustering coefficient C.
   * Average of local clustering coefficients C_i across all vertices with degree >= 2.
   */
  globalClusteringCoefficient: number;

  /** Ratio of boundary bridge edges (connecting different communities) to total active edges */
  bridgeRatio: number;

  /** Number of connected components */
  componentCount: number;

  /** Size of the largest connected component (LCC) */
  largestComponentSize: number;

  /** Execution latency in milliseconds to compute these metrics */
  computationTimeMs: number;
}

/**
 * Serialized representation of a full graph state at a specific tick.
 */
export interface GraphSnapshot {
  tick: number;
  lastEventSeq: number;
  nodes: DynamicNode[];
  edges: DynamicEdge[];
  metrics: DynamicGraphMetrics | null;
  timestamp: number;
}

/**
 * Full state checkpoint stored periodically to accelerate time-travel replay.
 */
export interface GraphCheckpoint {
  tick: number;
  snapshot: GraphSnapshot;
  eventsSinceLastCheckpoint: GraphEvent[];
}

/**
 * Priority queue scheduled event entry for the internal temporal scheduler.
 */
export interface ScheduledTask {
  id: string;
  targetTick: number;
  priority: number; // Lower number = higher priority
  type: GraphEventType;
  payload: Record<string, unknown>;
}
