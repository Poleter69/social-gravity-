/**
 * Social Gravity - Clustered Community / Stochastic Block Model Topology Generator
 * Connects intra-community nodes with high density and inter-community nodes with sparse bridges.
 */

import { PRNG } from '../math/random';
import { SocialEdge } from '../types/network';

export interface ClusteredTopologyParams {
  communityNodeMap: Map<string, string[]>;
  pInternal: number; // Probability of edge within same community [0, 1]
  pExternal: number; // Probability of edge between different communities [0, 1]
  rng: PRNG;
}

export function generateClusteredTopology(params: ClusteredTopologyParams): SocialEdge[] {
  const { communityNodeMap, pInternal, pExternal, rng } = params;
  const edges: SocialEdge[] = [];
  const edgeSet = new Set<string>();

  const makeEdgeKey = (u: string, v: string): string => {
    return u < v ? `${u}--${v}` : `${v}--${u}`;
  };

  const addEdge = (source: string, target: string, type: 'peer' | 'bridge' | 'weak_tie', weight?: number) => {
    if (source === target) return;
    const key = makeEdgeKey(source, target);
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push({
        id: `edge-${edges.length + 1}`,
        source,
        target,
        weight: weight ?? Number((0.35 + rng.nextFloat() * 0.65).toFixed(3)),
        type,
      });
    }
  };

  const communityIds = Array.from(communityNodeMap.keys());

  // 1. Intra-community connections (Dense local social fabric)
  for (const communityId of communityIds) {
    const nodes = communityNodeMap.get(communityId) || [];
    const n = nodes.length;
    if (n < 2) continue;

    // Minimum spanning tree backbone to prevent isolated subgraphs within community
    for (let i = 1; i < n; i++) {
      const parentIdx = rng.nextInt(0, i - 1);
      addEdge(nodes[i], nodes[parentIdx], 'peer', 0.8);
    }

    // Additional peer links based on pInternal
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (rng.nextFloat() < pInternal) {
          addEdge(nodes[i], nodes[j], 'peer');
        }
      }
    }
  }

  // 2. Inter-community connections (Weak ties & bridge vectors)
  for (let c1 = 0; c1 < communityIds.length; c1++) {
    const comm1Nodes = communityNodeMap.get(communityIds[c1]) || [];
    if (comm1Nodes.length === 0) continue;

    for (let c2 = c1 + 1; c2 < communityIds.length; c2++) {
      const comm2Nodes = communityNodeMap.get(communityIds[c2]) || [];
      if (comm2Nodes.length === 0) continue;

      // Always guarantee at least 1-2 inter-community bridge ambassadors
      const bridgesCount = Math.max(1, Math.round(comm1Nodes.length * comm2Nodes.length * pExternal));
      for (let b = 0; b < bridgesCount; b++) {
        const u = rng.choice(comm1Nodes);
        const v = rng.choice(comm2Nodes);
        addEdge(u, v, 'bridge', 0.4);
      }
    }
  }

  return edges;
}
