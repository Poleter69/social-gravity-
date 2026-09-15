/**
 * Social Gravity V2 - Reddit Network Influence Analytics
 *
 * Implements rigorous network science and graph centrality algorithms:
 * - PageRank (Power iteration with dangling node redistribution)
 * - Betweenness Centrality (Brandes algorithm)
 * - Eigenvector Centrality (Dominant eigenvector iteration)
 * - k-Core Decomposition (Iterative degree peeling)
 * - Conversation Dynamics & Gini participation inequality
 */

import { CanonicalGraph } from '../../schemas';

export interface NodeInfluenceMetrics {
  nodeId: string;
  label: string;
  degree: number;
  inDegree: number;
  outDegree: number;
  pageRank: number;
  betweenness: number;
  eigenvector: number;
  kCore: number;
}

export interface ConversationAnalytics {
  totalComments: number;
  uniqueParticipants: number;
  participationGini: number; // [0, 1] 0 = uniform, 1 = dominated by one user
  maxDepth: number;
  averageDepth: number;
  branchingFactor: number;
  averageResponseTimeSeconds: number;
  fastestResponseTimeSeconds: number;
}

export interface InfluenceReport {
  nodeMetrics: Map<string, NodeInfluenceMetrics>;
  topPageRank: NodeInfluenceMetrics[];
  topBetweenness: NodeInfluenceMetrics[];
  topDegree: NodeInfluenceMetrics[];
  kCoreMax: number;
  kCoreBuckets: Map<number, string[]>;
  conversationAnalytics?: ConversationAnalytics;
}

export class InfluenceAnalytics {
  /**
   * Computes PageRank centrality using power iteration.
   * Damping factor d = 0.85, maxIterations = 100, tolerance = 1e-6.
   */
  public static computePageRank(
    graph: CanonicalGraph,
    damping: number = 0.85,
    maxIterations: number = 100,
    tolerance: number = 1e-6
  ): Map<string, number> {
    const nodes = Array.from(graph.nodes.keys());
    const N = nodes.length;
    const pageRank = new Map<string, number>();

    if (N === 0) return pageRank;
    if (N === 1) {
      pageRank.set(nodes[0], 1.0);
      return pageRank;
    }

    const initialScore = 1.0 / N;
    for (const u of nodes) {
      pageRank.set(u, initialScore);
    }

    // Build incoming and outgoing adjacency
    const outNeighbors = new Map<string, string[]>();
    const inNeighbors = new Map<string, string[]>();

    for (const u of nodes) {
      outNeighbors.set(u, []);
      inNeighbors.set(u, []);
    }

    for (const edge of graph.edges.values()) {
      outNeighbors.get(edge.source)?.push(edge.target);
      inNeighbors.get(edge.target)?.push(edge.source);
      if (!edge.directed) {
        outNeighbors.get(edge.target)?.push(edge.source);
        inNeighbors.get(edge.source)?.push(edge.target);
      }
    }

    for (let iter = 0; iter < maxIterations; iter++) {
      let danglingSum = 0;
      for (const u of nodes) {
        const outDeg = outNeighbors.get(u)?.length || 0;
        if (outDeg === 0) {
          danglingSum += pageRank.get(u) || 0;
        }
      }

      let diff = 0;
      const nextScores = new Map<string, number>();

      for (const u of nodes) {
        let incomingSum = 0;
        const inList = inNeighbors.get(u) || [];
        for (const v of inList) {
          const vOut = outNeighbors.get(v)?.length || 1;
          incomingSum += (pageRank.get(v) || 0) / vOut;
        }

        const newScore = (1 - damping) / N + damping * (incomingSum + danglingSum / N);
        nextScores.set(u, newScore);
        diff += Math.abs(newScore - (pageRank.get(u) || 0));
      }

      for (const [u, score] of nextScores.entries()) {
        pageRank.set(u, score);
      }

      if (diff < tolerance) {
        break;
      }
    }

    return pageRank;
  }

  /**
   * Computes Betweenness Centrality using Brandes' Algorithm O(|V| * |E|).
   */
  public static computeBetweenness(graph: CanonicalGraph): Map<string, number> {
    const nodes = Array.from(graph.nodes.keys());
    const betweenness = new Map<string, number>();
    for (const u of nodes) {
      betweenness.set(u, 0);
    }

    if (nodes.length <= 2) return betweenness;

    // Fast adjacency list
    const adj = new Map<string, string[]>();
    for (const u of nodes) {
      adj.set(u, []);
    }
    for (const edge of graph.edges.values()) {
      adj.get(edge.source)?.push(edge.target);
      if (!edge.directed) {
        adj.get(edge.target)?.push(edge.source);
      }
    }

    for (const s of nodes) {
      const stack: string[] = [];
      const pred = new Map<string, string[]>();
      const sigma = new Map<string, number>();
      const dist = new Map<string, number>();
      const delta = new Map<string, number>();

      for (const w of nodes) {
        pred.set(w, []);
        sigma.set(w, 0);
        dist.set(w, -1);
        delta.set(w, 0);
      }

      sigma.set(s, 1);
      dist.set(s, 0);

      const queue: string[] = [s];

      while (queue.length > 0) {
        const v = queue.shift()!;
        stack.push(v);

        const neighbors = adj.get(v) || [];
        for (const w of neighbors) {
          // Path discovery
          if (dist.get(w)! < 0) {
            dist.set(w, dist.get(v)! + 1);
            queue.push(w);
          }
          // Path counting
          if (dist.get(w) === dist.get(v)! + 1) {
            sigma.set(w, sigma.get(w)! + sigma.get(v)!);
            pred.get(w)!.push(v);
          }
        }
      }

      // Accumulation
      while (stack.length > 0) {
        const w = stack.pop()!;
        const sigmaW = sigma.get(w)!;
        for (const v of pred.get(w)!) {
          const c = (sigma.get(v)! / sigmaW) * (1 + delta.get(w)!);
          delta.set(v, delta.get(v)! + c);
        }
        if (w !== s) {
          betweenness.set(w, betweenness.get(w)! + delta.get(w)!);
        }
      }
    }

    // Normalization for undirected/directed graphs: divide by (N-1)(N-2)
    const N = nodes.length;
    const normFactor = (N - 1) * (N - 2);
    if (normFactor > 0) {
      for (const u of nodes) {
        betweenness.set(u, Number(((betweenness.get(u) || 0) / normFactor).toFixed(6)));
      }
    }

    return betweenness;
  }

  /**
   * Computes Eigenvector Centrality using power iteration.
   */
  public static computeEigenvector(
    graph: CanonicalGraph,
    maxIterations: number = 100,
    tolerance: number = 1e-6
  ): Map<string, number> {
    const nodes = Array.from(graph.nodes.keys());
    const N = nodes.length;
    const eigenvector = new Map<string, number>();

    if (N === 0) return eigenvector;
    for (const u of nodes) {
      eigenvector.set(u, 1.0 / Math.sqrt(N));
    }

    const adj = new Map<string, string[]>();
    for (const u of nodes) adj.set(u, []);
    for (const edge of graph.edges.values()) {
      adj.get(edge.source)?.push(edge.target);
      if (!edge.directed) adj.get(edge.target)?.push(edge.source);
    }

    for (let iter = 0; iter < maxIterations; iter++) {
      const nextScores = new Map<string, number>();
      let norm = 0;

      for (const u of nodes) {
        let sum = 0;
        for (const v of adj.get(u) || []) {
          sum += eigenvector.get(v) || 0;
        }
        nextScores.set(u, sum);
        norm += sum * sum;
      }

      norm = Math.sqrt(norm);
      if (norm === 0) break;

      let diff = 0;
      for (const u of nodes) {
        const normalizedScore = nextScores.get(u)! / norm;
        diff += Math.abs(normalizedScore - (eigenvector.get(u) || 0));
        eigenvector.set(u, normalizedScore);
      }

      if (diff < tolerance) break;
    }

    return eigenvector;
  }

  /**
   * Computes k-Core decomposition using iterative degree pruning.
   */
  public static computeKCore(graph: CanonicalGraph): {
    nodeKCore: Map<string, number>;
    maxK: number;
    kBuckets: Map<number, string[]>;
  } {
    const nodeKCore = new Map<string, number>();
    const degrees = new Map<string, number>();
    const neighbors = new Map<string, Set<string>>();

    for (const u of graph.nodes.keys()) {
      degrees.set(u, 0);
      neighbors.set(u, new Set<string>());
    }

    for (const edge of graph.edges.values()) {
      neighbors.get(edge.source)?.add(edge.target);
      neighbors.get(edge.target)?.add(edge.source);
    }

    for (const [u, nbrs] of neighbors.entries()) {
      degrees.set(u, nbrs.size);
    }

    let currentK = 1;
    let remaining = new Set(graph.nodes.keys());
    const kBuckets = new Map<number, string[]>();

    while (remaining.size > 0) {
      let changed = false;
      const toRemove: string[] = [];

      for (const u of remaining) {
        if (degrees.get(u)! < currentK) {
          toRemove.push(u);
        }
      }

      if (toRemove.length > 0) {
        changed = true;
        for (const u of toRemove) {
          nodeKCore.set(u, currentK - 1);
          remaining.delete(u);
          for (const v of neighbors.get(u)!) {
            if (remaining.has(v)) {
              degrees.set(v, degrees.get(v)! - 1);
            }
          }
        }
      }

      if (!changed) {
        currentK++;
      }
    }

    let maxK = 0;
    for (const [u, k] of nodeKCore.entries()) {
      if (k > maxK) maxK = k;
      let bucket = kBuckets.get(k);
      if (!bucket) {
        bucket = [];
        kBuckets.set(k, bucket);
      }
      bucket.push(u);
    }

    return { nodeKCore, maxK, kBuckets };
  }

  /**
   * Computes the Gini inequality index for participant comment distributions [0, 1].
   */
  public static computeParticipationGini(authorCounts: number[]): number {
    if (authorCounts.length <= 1) return 0;
    const sorted = [...authorCounts].sort((a, b) => a - b);
    const n = sorted.length;
    let sum = 0;
    let weightedSum = 0;

    for (let i = 0; i < n; i++) {
      sum += sorted[i];
      weightedSum += (i + 1) * sorted[i];
    }

    if (sum === 0) return 0;
    const gini = (2 * weightedSum) / (n * sum) - (n + 1) / n;
    return Math.max(0, Math.min(1.0, Number(gini.toFixed(4))));
  }

  /**
   * Generates a complete comprehensive influence analysis report for the graph.
   */
  public static analyzeGraph(graph: CanonicalGraph): InfluenceReport {
    const pageRank = this.computePageRank(graph);
    const betweenness = this.computeBetweenness(graph);
    const eigenvector = this.computeEigenvector(graph);
    const { nodeKCore, maxK, kBuckets } = this.computeKCore(graph);

    const nodeMetrics = new Map<string, NodeInfluenceMetrics>();

    for (const [id, node] of graph.nodes.entries()) {
      nodeMetrics.set(id, {
        nodeId: id,
        label: node.label,
        degree: node.degree,
        inDegree: node.inDegree,
        outDegree: node.outDegree,
        pageRank: pageRank.get(id) || 0,
        betweenness: betweenness.get(id) || 0,
        eigenvector: eigenvector.get(id) || 0,
        kCore: nodeKCore.get(id) || 0,
      });
    }

    const allMetrics = Array.from(nodeMetrics.values());
    const topPageRank = [...allMetrics].sort((a, b) => b.pageRank - a.pageRank).slice(0, 10);
    const topBetweenness = [...allMetrics].sort((a, b) => b.betweenness - a.betweenness).slice(0, 10);
    const topDegree = [...allMetrics].sort((a, b) => b.degree - a.degree).slice(0, 10);

    return {
      nodeMetrics,
      topPageRank,
      topBetweenness,
      topDegree,
      kCoreMax: maxK,
      kCoreBuckets: kBuckets,
    };
  }
}
