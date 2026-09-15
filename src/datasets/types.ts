/**
 * Social Gravity - Dataset Foundation Types & Schemas
 * Standardized contracts for real-world empirical graph datasets (SNAP) 
 * and information veracity corpora (Wikipedia Hoaxes & Talk pages).
 */

export type DatasetSource = 'snap_facebook' | 'snap_twitter' | 'wikipedia_hoax' | 'synthetic';

export interface DatasetMetadata {
  id: string;
  name: string;
  source: DatasetSource;
  description: string;
  nodeCount: number;
  edgeCount: number;
  citation: string;
  license: string;
  tags: string[];
}

export interface SnapEdgeListInput {
  edgesText: string;
  circlesText?: string;
  datasetName?: string;
  defaultTrust?: number;
  defaultConformity?: number;
  defaultRiskTolerance?: number;
}

export interface WikipediaHoaxRecord {
  id: string;
  title: string;
  summary: string;
  veracity: number; // 0.0 = total hoax/fabrication, 1.0 = verified fact
  virality: number; // 0.0 to 1.0
  fearSalience: number; // 0.0 to 1.0
  plausibility: number; // 0.0 to 1.0
  durationDays: number;
  categories: string[];
  talkPageDisputes: number;
}

export interface DatasetLoadResult<T> {
  success: boolean;
  data: T;
  metadata: DatasetMetadata;
  parseTimeMs: number;
  warnings: string[];
}

export interface IngestionOptions {
  pruneIsolatedNodes?: boolean;
  maxNodes?: number;
  seed?: number;
}
