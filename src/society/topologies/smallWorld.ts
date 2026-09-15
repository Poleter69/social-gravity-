/**
 * Social Gravity - Watts-Strogatz Small-World Topology Generator
 * Generates networks exhibiting high clustering coefficient and short average path length.
 */

import { PRNG } from '../math/random';
import { SocialEdge, EdgeType } from '../types/network';

export interface WattsStrogatzParams {
  nodeIds: string[];
  k: number; // Each node connected to k nearest neighbors in ring lattice (must be even)
  beta: number; // Rewiring probability [0, 1]
  rng: PRNG;
}

export function generateWattsStrogatz(params: WattsStrogatzParams): SocialEdge[] {
  const { nodeIds, beta, rng } = params;
  const n = nodeIds.length;
  if (n < 3) return [];

  // Ensure k is even and less than n
  let k = Math.min(params.k, n - 1);
  if (k % 2 !== 0) k -= 1;
  if (k < 2) k = 2;

  const halfK = Math.floor(k / 2);
  const edges: SocialEdge[] = [];
  const edgeSet = new Set<string>();

  const makeEdgeKey = (u: string, v: string): string => {
    return u < v ? `${u}--${v}` : `${v}--${u}`;
  };

  const addEdge = (source: string, target: string, type: EdgeType = 'peer') => {
    if (source === target) return;
    const key = makeEdgeKey(source, target);
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push({
        id: `edge-${edges.length + 1}`,
        source,
        target,
        weight: Number((0.4 + rng.nextFloat() * 0.6).toFixed(3)),
        type,
      });
    }
  };

  // 1. Build initial ring lattice
  for (let i = 0; i < n; i++) {
    const source = nodeIds[i];
    for (let j = 1; j <= halfK; j++) {
      const targetIdx = (i + j) % n;
      const target = nodeIds[targetIdx];
      addEdge(source, target, 'peer');
    }
  }

  // 2. Rewire edges with probability beta
  const currentEdges = [...edges];
  edges.length = 0;
  edgeSet.clear();

  for (const edge of currentEdges) {
    if (rng.nextFloat() < beta) {
      // Rewire target to a random node
      let newTargetIdx = rng.nextInt(0, n - 1);
      let newTarget = nodeIds[newTargetIdx];

      // Avoid self-loop and existing duplicate edges
      let attempts = 0;
      while (
        (newTarget === edge.source || edgeSet.has(makeEdgeKey(edge.source, newTarget))) &&
        attempts < 20
      ) {
        newTargetIdx = rng.nextInt(0, n - 1);
        newTarget = nodeIds[newTargetIdx];
        attempts++;
      }

      if (newTarget !== edge.source && !edgeSet.has(makeEdgeKey(edge.source, newTarget))) {
        addEdge(edge.source, newTarget, 'weak_tie');
      } else {
        // Keep original if rewiring failed
        addEdge(edge.source, edge.target, edge.type);
      }
    } else {
      addEdge(edge.source, edge.target, edge.type);
    }
  }

  return edges;
}
