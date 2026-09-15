/**
 * Social Gravity - On-Device Node2Vec Graph Embedding Engine
 *
 * Implements Grover & Leskovec (2016) Node2Vec in pure TypeScript:
 * - 2nd-order biased random walks with p (return) and q (in-out) hyperparameters
 * - Skip-gram with negative sampling (SGNS) trained via stochastic gradient descent
 * - L2-normalized dense embeddings for cosine similarity & community clustering
 * - Zero external dependencies; 100% offline and deterministic
 */

import { Society, Agent } from '../society/types/society';
import { GraphLearningConfig, GraphEmbeddingResult, EmbeddingVector } from './types';

function sigmoid(x: number): number {
  const clamped = Math.max(-10, Math.min(10, x));
  return 1 / (1 + Math.exp(-clamped));
}

function l2Normalize(vec: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) sumSq += vec[i] * vec[i];
  const norm = Math.sqrt(sumSq) || 1e-8;
  return vec.map(v => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

export class Node2VecEngine {
  private config: Required<GraphLearningConfig>;
  private nodeIds: string[] = [];
  private nodeIndexMap = new Map<string, number>();
  private adjacency = new Map<string, string[]>();

  constructor(config?: Partial<GraphLearningConfig>) {
    this.config = {
      dimensions: config?.dimensions ?? 16,
      walkLength: config?.walkLength ?? 8,
      numWalks: config?.numWalks ?? 5,
      p: config?.p ?? 1.0,
      q: config?.q ?? 1.0,
      learningRate: config?.learningRate ?? 0.05,
      epochs: config?.epochs ?? 4,
      negativeSamples: config?.negativeSamples ?? 3,
    };
  }

  /**
   * Train Node2Vec embeddings on the given society graph.
   */
  public train(society: Society, seed = 42): GraphEmbeddingResult {
    const startTime = Date.now();
    this.nodeIds = society.agents.map(a => a.id);
    this.nodeIndexMap.clear();
    this.adjacency.clear();

    this.nodeIds.forEach((id, idx) => {
      this.nodeIndexMap.set(id, idx);
      this.adjacency.set(id, []);
    });

    society.agents.forEach(a => {
      this.adjacency.set(a.id, [...a.connections]);
    });

    // PRNG for deterministic training
    let currentSeed = seed;
    const random = () => {
      currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
      return currentSeed / 4294967296;
    };

    // 1. Generate Biased Random Walks
    const walks: string[][] = [];
    for (let iter = 0; iter < this.config.numWalks; iter++) {
      for (const startNode of this.nodeIds) {
        walks.push(this.generateWalk(startNode, random));
      }
    }

    // 2. Initialize Embeddings (Target & Context matrices)
    const numNodes = this.nodeIds.length;
    const dim = this.config.dimensions;
    const targetWeights: number[][] = Array.from({ length: numNodes }, () =>
      Array.from({ length: dim }, () => (random() - 0.5) / dim)
    );
    const contextWeights: number[][] = Array.from({ length: numNodes }, () =>
      Array.from({ length: dim }, () => (random() - 0.5) / dim)
    );

    // 3. Train via Skip-Gram with Negative Sampling (SGD)
    const windowSize = 2;
    const lossHistory: number[] = [];

    for (let epoch = 0; epoch < this.config.epochs; epoch++) {
      let epochLoss = 0;
      let pairsCount = 0;

      for (const walk of walks) {
        for (let i = 0; i < walk.length; i++) {
          const uId = walk[i];
          const uIdx = this.nodeIndexMap.get(uId);
          if (uIdx === undefined) continue;

          // Context window
          const start = Math.max(0, i - windowSize);
          const end = Math.min(walk.length - 1, i + windowSize);

          for (let j = start; j <= end; j++) {
            if (i === j) continue;
            const vId = walk[j];
            const vIdx = this.nodeIndexMap.get(vId);
            if (vIdx === undefined) continue;

            // Positive pair (u, v)
            const dot = this.dot(targetWeights[uIdx], contextWeights[vIdx]);
            const sig = sigmoid(dot);
            const grad = this.config.learningRate * (1 - sig);
            epochLoss += -Math.log(Math.max(1e-7, sig));
            pairsCount++;

            // Update positive gradients
            this.updateGradients(targetWeights[uIdx], contextWeights[vIdx], grad);

            // Negative samples
            for (let k = 0; k < this.config.negativeSamples; k++) {
              const negIdx = Math.floor(random() * numNodes);
              if (negIdx === vIdx) continue;

              const negDot = this.dot(targetWeights[uIdx], contextWeights[negIdx]);
              const negSig = sigmoid(negDot);
              const negGrad = -this.config.learningRate * negSig;
              epochLoss += -Math.log(Math.max(1e-7, 1 - negSig));
              pairsCount++;

              this.updateGradients(targetWeights[uIdx], contextWeights[negIdx], negGrad);
            }
          }
        }
      }
      lossHistory.push(pairsCount > 0 ? epochLoss / pairsCount : 0);
    }

    // 4. L2 Normalize Final Embeddings
    const embeddings = new Map<string, EmbeddingVector>();
    for (let idx = 0; idx < numNodes; idx++) {
      const id = this.nodeIds[idx];
      embeddings.set(id, l2Normalize(targetWeights[idx]));
    }

    return {
      modelType: 'node2vec',
      dimensions: dim,
      embeddings,
      trainingTimeMs: Date.now() - startTime,
      lossHistory,
    };
  }

  private generateWalk(startNode: string, random: () => number): string[] {
    const walk: string[] = [startNode];
    while (walk.length < this.config.walkLength) {
      const curr = walk[walk.length - 1];
      const neighbors = this.adjacency.get(curr) || [];
      if (neighbors.length === 0) break;

      if (walk.length === 1) {
        // Uniform 1st step
        walk.push(neighbors[Math.floor(random() * neighbors.length)]);
        continue;
      }

      const prev = walk[walk.length - 2];
      const nextNode = this.sampleBiasedNeighbor(prev, curr, neighbors, random);
      walk.push(nextNode);
    }
    return walk;
  }

  private sampleBiasedNeighbor(
    prev: string,
    curr: string,
    neighbors: string[],
    random: () => number
  ): string {
    const prevNeighbors = new Set(this.adjacency.get(prev) || []);
    const weights: number[] = [];

    for (const next of neighbors) {
      if (next === prev) {
        // Return to previous node (bias = 1/p)
        weights.push(1 / this.config.p);
      } else if (prevNeighbors.has(next)) {
        // Distance 1 (mutual neighbor, bias = 1)
        weights.push(1.0);
      } else {
        // Distance 2 (explore outwards, bias = 1/q)
        weights.push(1 / this.config.q);
      }
    }

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let sample = random() * totalWeight;

    for (let i = 0; i < neighbors.length; i++) {
      sample -= weights[i];
      if (sample <= 0) return neighbors[i];
    }
    return neighbors[neighbors.length - 1];
  }

  private dot(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
    return sum;
  }

  private updateGradients(u: number[], v: number[], grad: number): void {
    for (let i = 0; i < u.length; i++) {
      const uOld = u[i];
      u[i] += grad * v[i];
      v[i] += grad * uOld;
    }
  }
}
