/**
 * Social Gravity - Barabási-Albert Scale-Free Topology Generator
 * Implements preferential attachment to generate heavy-tailed power-law networks with influencer hubs.
 */

import { PRNG } from '../math/random';
import { SocialEdge } from '../types/network';

export interface BarabasiAlbertParams {
  nodeIds: string[];
  m0: number; // Initial seed core size
  m: number;  // Number of edges to attach from each new node (m <= m0)
  rng: PRNG;
}

export function generateBarabasiAlbert(params: BarabasiAlbertParams): SocialEdge[] {
  const { nodeIds, rng } = params;
  const n = nodeIds.length;
  if (n < 2) return [];

  const m0 = Math.min(Math.max(2, params.m0), n);
  const m = Math.min(Math.max(1, params.m), m0);

  const edges: SocialEdge[] = [];
  const edgeSet = new Set<string>();

  // Repeated nodes list for degree-proportional sampling in O(1) time
  const attachmentPool: string[] = [];

  const makeEdgeKey = (u: string, v: string): string => {
    return u < v ? `${u}--${v}` : `${v}--${u}`;
  };

  const addEdge = (source: string, target: string, type: 'peer' | 'bridge' = 'peer') => {
    if (source === target) return;
    const key = makeEdgeKey(source, target);
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push({
        id: `edge-${edges.length + 1}`,
        source,
        target,
        weight: Number((0.3 + rng.nextFloat() * 0.7).toFixed(3)),
        type,
      });
      attachmentPool.push(source);
      attachmentPool.push(target);
    }
  };

  // 1. Initialize seed clique or ring of size m0
  for (let i = 0; i < m0; i++) {
    for (let j = i + 1; j < m0; j++) {
      addEdge(nodeIds[i], nodeIds[j], 'peer');
    }
  }

  // 2. Add remaining nodes sequentially via preferential attachment
  for (let i = m0; i < n; i++) {
    const newNode = nodeIds[i];
    const targetsToConnect = new Set<string>();

    let attempts = 0;
    while (targetsToConnect.size < m && attempts < m * 15 && attachmentPool.length > 0) {
      const selected = rng.choice(attachmentPool);
      if (selected !== newNode && !targetsToConnect.has(selected)) {
        targetsToConnect.add(selected);
      }
      attempts++;
    }

    // If pool sampling did not fill m distinct targets, pick uniformly from existing nodes
    let fallbackIdx = 0;
    while (targetsToConnect.size < m && fallbackIdx < i) {
      const candidate = nodeIds[fallbackIdx];
      if (candidate !== newNode) {
        targetsToConnect.add(candidate);
      }
      fallbackIdx++;
    }

    for (const target of targetsToConnect) {
      addEdge(newNode, target, 'peer');
    }
  }

  return edges;
}
