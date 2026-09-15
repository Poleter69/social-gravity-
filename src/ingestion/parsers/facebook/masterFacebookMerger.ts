/**
 * Social Gravity V2 - Master Facebook Graph Merger
 *
 * Integrates all 10 SNAP Facebook ego networks into a single global unified graph.
 * Handles:
 * - Shared alter node deduplication across multiple ego spheres
 * - Multi-network feature union & community aggregation
 * - Inter-ego bridge detection (nodes connecting distinct ego clusters)
 * - Global modularity and influence ranking
 */

import { CanonicalGraph, CanonicalNode, CanonicalEdge } from '../../schemas';
import { CanonicalGraphBuilder } from '../../transformers/canonicalGraphBuilder';

export interface MasterMergeResult {
  masterGraph: CanonicalGraph;
  egoNetworksMerged: number;
  totalUniqueNodes: number;
  totalUniqueEdges: number;
  interEgoBridgesCount: number;
  durationMs: number;
}

export class MasterFacebookMerger {
  /**
   * Merges multiple individual ego CanonicalGraphs into one cohesive global Master Graph.
   */
  public static merge(
    egoGraphs: CanonicalGraph[],
    masterId: string = 'SNAP_FACEBOOK_MASTER_GRAPH'
  ): MasterMergeResult {
    const startTime = performance.now();

    const mergedNodes = new Map<string, CanonicalNode>();
    const mergedEdges = new Map<string, CanonicalEdge>();
    const egoOccurrences = new Map<string, Set<string>>(); // nodeId -> Set of egoGraphIDs

    // 1. Merge and deduplicate nodes
    for (const graph of egoGraphs) {
      const egoId = (graph.metadata.egoId as string) || graph.id;

      for (const node of graph.nodes.values()) {
        let occ = egoOccurrences.get(node.id);
        if (!occ) {
          occ = new Set();
          egoOccurrences.set(node.id, occ);
        }
        occ.add(egoId);

        const existing = mergedNodes.get(node.id);
        if (!existing) {
          mergedNodes.set(node.id, {
            ...node,
            communities: [...node.communities],
            features: { ...node.features },
          });
        } else {
          // Merge features and communities
          existing.features = { ...existing.features, ...node.features };
          for (const comm of node.communities) {
            if (!existing.communities.includes(comm)) {
              existing.communities.push(comm);
            }
          }
          if ((node.metadata as any)?.isEgo) {
            existing.metadata = { ...existing.metadata, isEgo: true };
          }
        }
      }
    }

    // 2. Merge and deduplicate edges
    for (const graph of egoGraphs) {
      for (const edge of graph.edges.values()) {
        const canonicalKey = edge.source < edge.target ? `${edge.source}--${edge.target}` : `${edge.target}--${edge.source}`;
        const existing = mergedEdges.get(canonicalKey);

        if (!existing) {
          mergedEdges.set(canonicalKey, {
            ...edge,
            id: canonicalKey,
          });
        } else {
          // Reinforce weight when observed across multiple ego networks
          existing.interactionCount += edge.interactionCount;
          existing.weight = Math.min(1.0, existing.weight + 0.1);
        }
      }
    }

    // 3. Assemble via CanonicalGraphBuilder
    const builder = new CanonicalGraphBuilder({
      id: masterId,
      sourceDataset: 'SNAP_FACEBOOK_GLOBAL_MERGED',
      detectCommunitiesIfMissing: true,
      metadata: {
        mergedEgoCount: egoGraphs.length,
      },
    });

    for (const node of mergedNodes.values()) {
      builder.addNode(node);
    }
    for (const edge of mergedEdges.values()) {
      builder.addEdge(edge);
    }

    const masterGraph = builder.build();

    // 4. Identify inter-ego bridge nodes (nodes appearing in >= 2 distinct ego networks)
    let interEgoBridges = 0;
    for (const [nodeId, egos] of egoOccurrences.entries()) {
      if (egos.size > 1) {
        interEgoBridges++;
        const node = masterGraph.nodes.get(nodeId);
        if (node) {
          node.isBridge = true;
          node.metadata = {
            ...node.metadata,
            sharedEgos: Array.from(egos),
            isInterEgoBridge: true,
          };
        }
      }
    }

    const durationMs = Number((performance.now() - startTime).toFixed(2));

    return {
      masterGraph,
      egoNetworksMerged: egoGraphs.length,
      totalUniqueNodes: masterGraph.nodes.size,
      totalUniqueEdges: masterGraph.edges.size,
      interEgoBridgesCount: interEgoBridges,
      durationMs,
    };
  }
}
