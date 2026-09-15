/**
 * Social Gravity - V2.0 Graph Learning & Node Embeddings Types
 * Offline Node2Vec, GraphSAGE aggregation, and hybrid diffusion predictors.
 */

export type EmbeddingModelType = 'node2vec' | 'graphsage_mean' | 'community_embedding';

export interface GraphLearningConfig {
  dimensions: number;      // Embedding dimension d (default: 16)
  walkLength: number;      // Steps per random walk (default: 10)
  numWalks: number;        // Walks per node (default: 5)
  p: number;               // Return parameter (default: 1.0)
  q: number;               // In-out parameter (default: 1.0)
  learningRate: number;    // SGD learning rate (default: 0.05)
  epochs: number;          // Training passes (default: 5)
  negativeSamples: number; // Negative samples per positive pair (default: 3)
}

export type EmbeddingVector = number[];

export interface GraphEmbeddingResult {
  modelType: EmbeddingModelType;
  dimensions: number;
  embeddings: Map<string, EmbeddingVector>;
  trainingTimeMs: number;
  lossHistory: number[];
}

export interface HybridPredictorConfig {
  hybridWeight: number; // gamma in [0, 1]: 0 = pure rule, 1 = pure embedding
}

export interface LearnedBenchmarkResult {
  modelType: EmbeddingModelType;
  dimensions: number;
  trainingTimeMs: number;
  clusteringPurity: number; // % agreement with ground truth community partitions
  ruleBasedAccuracy: number;
  hybridAccuracy: number;
  improvementPercentage: number;
  recommendation: string;
}
