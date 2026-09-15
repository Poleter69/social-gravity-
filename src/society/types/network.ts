/**
 * Social Gravity - Social Network Graph & Topology Definitions
 */

export type EdgeType = 'peer' | 'hierarchical' | 'bridge' | 'weak_tie';

export interface SocialEdge {
  id: string;
  source: string; // Agent ID
  target: string; // Agent ID
  weight: number; // Interaction frequency & channel bandwidth [0, 1]
  type: EdgeType;
  /** Interaction timestamp or creation time */
  timestamp?: number;
  /** Ingestion & platform interaction metadata */
  metadata?: Record<string, unknown>;
}

export interface NetworkMetrics {
  totalNodes: number;
  totalEdges: number;
  averageDegree: number;
  density: number;
  globalClusteringCoefficient: number;
  bridgeEdgeRatio: number;
}

export interface NetworkGraph {
  adjacencyList: Map<string, Set<string>>;
  edgeMap: Map<string, SocialEdge>;
  edges: SocialEdge[];
}
