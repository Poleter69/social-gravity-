/**
 * Social Gravity V2 - Deterministic Graph Generator
 *
 * Mathematically rigorous synthetic graph synthesizers implementing:
 * - Watts-Strogatz Small-World model
 * - Barabási-Albert Scale-Free (preferential attachment) model
 * - Stochastic Block Model (SBM) for multi-community clustered networks
 *
 * All topology generation is strictly deterministic and seed-reproducible.
 */

import { PRNG } from '../../society/math/random';
import { RelationshipDynamicsConfig } from '../types';
import { DynamicGraph } from './dynamicGraph';

export interface GeneratorOptions {
  seed?: number;
  config?: Partial<RelationshipDynamicsConfig>;
  communityCount?: number;
}

export interface WattsStrogatzOptions extends GeneratorOptions {
  n: number; // Number of nodes
  k: number; // Mean degree (must be even)
  p: number; // Rewiring probability [0, 1]
}

export interface ScaleFreeOptions extends GeneratorOptions {
  n: number; // Total number of nodes
  m0: number; // Initial connected seed clique size
  m: number; // Edges added per new vertex (m <= m0)
}

export interface StochasticBlockModelOptions extends GeneratorOptions {
  n: number; // Total nodes
  communities: number; // Number of community partitions
  pIn: number; // Intra-community connection probability
  pOut: number; // Inter-community connection probability
}

export class DeterministicGraphGenerator {
  /**
   * Generates a Watts-Strogatz Small-World network.
   * Interpolates between regular 1D ring lattice (p=0) and random graph (p=1).
   * Exhibits high clustering and short average path length.
   *
   * Reference: Watts, D. J., & Strogatz, S. H. (1998). Nature 393, 440-442.
   */
  public static createWattsStrogatz(options: WattsStrogatzOptions): DynamicGraph {
    const { n, k, p, seed = 42, communityCount = 4, config = {} } = options;
    if (k % 2 !== 0 || k >= n) {
      throw new Error(`[DeterministicGenerator] k (${k}) must be even and < n (${n})`);
    }

    const prng = new PRNG(seed);
    const graph = new DynamicGraph(seed, config);

    // 1. Create nodes with assigned communities and influence distributions
    for (let i = 0; i < n; i++) {
      const communityId = `comm_${i % communityCount}`;
      const influence = Number((0.2 + prng.nextFloat() * 0.7).toFixed(4));
      graph.addNode({
        id: `node_${i}`,
        communityId,
        currentInfluence: influence,
        status: 'active',
      });
    }

    // 2. Build regular 1D ring lattice of degree k
    const halfK = k / 2;
    const existingEdges = new Set<string>();

    for (let i = 0; i < n; i++) {
      for (let j = 1; j <= halfK; j++) {
        const neighbor = (i + j) % n;
        const u = `node_${i}`;
        const v = `node_${neighbor}`;
        const key = i < neighbor ? `${i}--${neighbor}` : `${neighbor}--${i}`;

        if (!existingEdges.has(key)) {
          existingEdges.add(key);
          const initialWeight = Number((0.55 + prng.nextFloat() * 0.4).toFixed(4));
          const nodeU = graph.getNode(u)!;
          const nodeV = graph.getNode(v)!;
          const relType = nodeU.communityId === nodeV.communityId ? 'peer' : 'bridge';

          graph.addEdge({
            source: u,
            target: v,
            weight: initialWeight,
            relationshipType: relType,
          });
        }
      }
    }

    // 3. Rewire edges with probability p
    if (p > 0) {
      for (let i = 0; i < n; i++) {
        for (let j = 1; j <= halfK; j++) {
          if (prng.nextFloat() < p) {
            const currentTarget = (i + j) % n;
            const u = `node_${i}`;
            const oldV = `node_${currentTarget}`;
            const oldEdge = graph.getEdgeBetween(u, oldV);

            if (oldEdge) {
              // Choose new target != u and not currently connected
              const candidates: number[] = [];
              for (let candidate = 0; candidate < n; candidate++) {
                if (candidate !== i && !graph.getNeighbors(u).has(`node_${candidate}`)) {
                  candidates.push(candidate);
                }
              }

              if (candidates.length > 0) {
                const newTargetIdx = prng.choice(candidates);
                const newV = `node_${newTargetIdx}`;

                // Remove old edge & create new edge
                graph.removeEdge(oldEdge.id);

                const nodeU = graph.getNode(u)!;
                const nodeNewV = graph.getNode(newV)!;
                const relType = nodeU.communityId === nodeNewV.communityId ? 'peer' : 'bridge';
                const initialWeight = Number((0.45 + prng.nextFloat() * 0.4).toFixed(4));

                graph.addEdge({
                  source: u,
                  target: newV,
                  weight: initialWeight,
                  relationshipType: relType,
                });
              }
            }
          }
        }
      }
    }

    return graph;
  }

  /**
   * Generates a Barabási-Albert Scale-Free network via preferential attachment.
   * Degree distribution follows a power law P(k) ~ k^(-3).
   *
   * Reference: Barabási, A. L., & Albert, R. (1999). Science 286, 509-512.
   */
  public static createScaleFree(options: ScaleFreeOptions): DynamicGraph {
    const { n, m0, m, seed = 42, communityCount = 3, config = {} } = options;
    if (m > m0) {
      throw new Error(`[DeterministicGenerator] m (${m}) must be <= m0 (${m0})`);
    }

    const prng = new PRNG(seed);
    const graph = new DynamicGraph(seed, config);

    // 1. Initial clique of m0 nodes
    const degreeRepeats: string[] = [];

    for (let i = 0; i < m0; i++) {
      const u = `node_${i}`;
      graph.addNode({
        id: u,
        communityId: `comm_${i % communityCount}`,
        currentInfluence: Number((0.3 + prng.nextFloat() * 0.6).toFixed(4)),
        status: 'active',
      });
    }

    for (let i = 0; i < m0; i++) {
      for (let j = i + 1; j < m0; j++) {
        const u = `node_${i}`;
        const v = `node_${j}`;
        const initialWeight = Number((0.6 + prng.nextFloat() * 0.35).toFixed(4));
        graph.addEdge({
          source: u,
          target: v,
          weight: initialWeight,
          relationshipType: 'peer',
        });
        degreeRepeats.push(u, v);
      }
    }

    // 2. Incrementally add remaining nodes with preferential attachment
    for (let i = m0; i < n; i++) {
      const newId = `node_${i}`;
      const communityId = `comm_${i % communityCount}`;
      graph.addNode({
        id: newId,
        communityId,
        currentInfluence: Number((0.2 + prng.nextFloat() * 0.6).toFixed(4)),
        status: 'active',
      });

      // Select m unique distinct targets proportional to their degree
      const selectedTargets = new Set<string>();
      let attempts = 0;
      while (selectedTargets.size < m && attempts < m * 50) {
        attempts++;
        const target = prng.choice(degreeRepeats);
        if (target !== newId && !selectedTargets.has(target)) {
          selectedTargets.add(target);
        }
      }

      // If attempts exhausted, pick any random existing node
      if (selectedTargets.size < m) {
        for (let j = 0; j < i; j++) {
          const fallback = `node_${j}`;
          if (!selectedTargets.has(fallback)) {
            selectedTargets.add(fallback);
            if (selectedTargets.size === m) break;
          }
        }
      }

      for (const target of selectedTargets) {
        const targetNode = graph.getNode(target)!;
        const relType = targetNode.communityId === communityId ? 'peer' : 'bridge';
        const weight = Number((0.5 + prng.nextFloat() * 0.4).toFixed(4));

        graph.addEdge({
          source: newId,
          target,
          weight,
          relationshipType: relType,
        });

        degreeRepeats.push(newId, target);
      }
    }

    return graph;
  }

  /**
   * Generates a Stochastic Block Model (SBM) network with distinct clustered communities.
   * High density within communities (pIn), sparse bridges between communities (pOut).
   *
   * Reference: Holland, P. W., Laskey, K. B., & Leinhardt, S. (1983). Social Networks, 5(2), 109-137.
   */
  public static createStochasticBlockModel(options: StochasticBlockModelOptions): DynamicGraph {
    const { n, communities, pIn, pOut, seed = 42, config = {} } = options;
    const prng = new PRNG(seed);
    const graph = new DynamicGraph(seed, config);

    // 1. Create nodes with balanced community partition assignments
    for (let i = 0; i < n; i++) {
      const commIdx = i % communities;
      graph.addNode({
        id: `node_${i}`,
        communityId: `comm_${commIdx}`,
        currentInfluence: Number((0.3 + prng.nextFloat() * 0.5).toFixed(4)),
        status: 'active',
      });
    }

    // 2. Sample edges according to community block probabilities
    for (let i = 0; i < n; i++) {
      const u = `node_${i}`;
      const commU = i % communities;

      for (let j = i + 1; j < n; j++) {
        const v = `node_${j}`;
        const commV = j % communities;

        const isSameComm = commU === commV;
        const probability = isSameComm ? pIn : pOut;

        if (prng.nextFloat() < probability) {
          const weight = isSameComm
            ? Number((0.55 + prng.nextFloat() * 0.35).toFixed(4))
            : Number((0.35 + prng.nextFloat() * 0.3).toFixed(4));

          graph.addEdge({
            source: u,
            target: v,
            weight,
            relationshipType: isSameComm ? 'peer' : 'bridge',
          });
        }
      }
    }

    return graph;
  }
}
