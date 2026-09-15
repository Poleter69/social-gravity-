/**
 * Social Gravity V2 - Universal Canonical Ingestion Schemas
 *
 * Provides universal, dataset-agnostic schemas for nodes, edges, interactions,
 * graphs, and validation reports. Downstream simulation engines (V1 ISociety and
 * V2 DynamicGraph) consume this unified format regardless of data source origin.
 */

export type InteractionType =
  | 'message'
  | 'reply'
  | 'mention'
  | 'reaction'
  | 'share'
  | 'follow'
  | 'friendship'
  | 'hierarchy'
  | 'talk_edit'
  | 'co_membership'
  | string;

/**
 * Universal canonical interaction record.
 */
export interface CanonicalInteraction {
  /** Unique deterministic interaction identifier */
  id: string;

  /** Anonymized source user/entity ID */
  source: string;

  /** Anonymized target user/entity ID */
  target: string;

  /** Unix epoch millisecond timestamp or normalized simulation tick */
  timestamp: number;

  /** Sociological interaction modality */
  type: InteractionType;

  /** Dyadic channel transmission weight in range [0, 1] */
  weight: number;

  /** Extensible key-value metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Universal canonical node representation.
 */
export interface CanonicalNode {
  /** Unique deterministic canonical identifier (e.g. 'usr_9f83a21b') */
  id: string;

  /** Privacy-safe anonymized label (e.g. 'User_381') */
  label: string;

  /** Optional reference to raw original identifier (retained only if reversible mapping enabled) */
  originalId?: string;

  /** Primary community cluster ID */
  communityId: string;

  /** Multi-membership social circles / overlapping communities */
  communities: string[];

  /** High-level semantic interpreted attributes (e.g. { education: 'degree', location: 'id_12' }) */
  features: Record<string, string | number | boolean>;

  /** Raw binary feature vector aligned with feature taxonomy index */
  rawFeatureVector?: number[];

  /** Structural network degree metrics */
  degree: number;
  inDegree: number;
  outDegree: number;

  /** Estimated influence score in range [0, 1] */
  influence: number;

  /** Flag indicating cross-community boundary position */
  isBridge: boolean;

  /** Simulation tick or epoch timestamp when node first appeared */
  createdTimestamp: number;

  /** Extensible domain metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Universal canonical relationship edge.
 */
export interface CanonicalEdge {
  /** Deterministic canonical edge identifier */
  id: string;

  /** Source node ID */
  source: string;

  /** Target node ID */
  target: string;

  /** Aggregated dyadic transmission weight in [0, 1] */
  weight: number;

  /** Sociological relationship classification */
  relationshipType: string;

  /** Timestamp of earliest recorded interaction */
  firstInteraction: number;

  /** Timestamp of most recent recorded interaction */
  lastInteraction: number;

  /** Total volume of interactions between this pair */
  interactionCount: number;

  /** Whether the tie is directed */
  directed: boolean;

  /** Extensible domain metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Chronological temporal slice for time-aware replay and forecasting.
 */
export interface CanonicalTemporalSlice {
  sliceIndex: number;
  fromTimestamp: number;
  toTimestamp: number;
  activeNodes: string[];
  activeEdges: string[];
  interactionCount: number;
}

/**
 * Universal Canonical Graph Object.
 */
export interface CanonicalGraph {
  /** Unique dataset/graph instance ID */
  id: string;

  /** Source provenance (e.g. 'SNAP_FACEBOOK_EGO_0', 'REDDIT_R_SCIENCE') */
  sourceDataset: string;

  /** Map of canonical node ID to CanonicalNode */
  nodes: Map<string, CanonicalNode>;

  /** Map of canonical edge ID to CanonicalEdge */
  edges: Map<string, CanonicalEdge>;

  /** Adjacency mapping node ID -> Set of neighbor node IDs */
  adjacency: Map<string, Set<string>>;

  /** Community partition assignments (communityId -> list of node IDs) */
  communities: Map<string, string[]>;

  /** Newman-Girvan modularity Q score in range [-0.5, 1.0] */
  modularity: number;

  /** Chronological history slices */
  temporalSlices: CanonicalTemporalSlice[];

  /** Graph-level structural and domain metadata */
  metadata: Record<string, unknown>;
}

/**
 * Configurable weighting profile for converting raw interactions into edge weights.
 */
export interface WeightingProfile {
  name: string;
  defaultWeight: number;
  weights: Record<string, number>;
  saturationCap: number;
  recencyHalfLifeDays?: number;
}

/**
 * Atomic validation issue record.
 */
export interface ValidationIssue {
  row: number;
  severity: 'error' | 'warning';
  code:
    | 'MALFORMED_ROW'
    | 'MISSING_TIMESTAMP'
    | 'INVALID_IDENTIFIER'
    | 'SELF_LOOP'
    | 'DUPLICATE_EDGE'
    | 'OUT_OF_BOUNDS_WEIGHT'
    | 'UNKNOWN_FORMAT';
  message: string;
  rawContent?: string;
}

/**
 * Comprehensive dataset validation report.
 */
export interface ValidationReport {
  datasetName: string;
  totalRecordsProcessed: number;
  validRecordsCount: number;
  rejectedRecordsCount: number;
  warningRecordsCount: number;
  duplicateCount: number;
  selfLoopCount: number;
  issues: ValidationIssue[];
  passed: boolean;
  validatedAt: number;
}
