/**
 * Social Gravity V2 - Reddit Community Detection & Modularity Engine
 *
 * Implements community detection (Label Propagation Algorithm & Modularity Q)
 * specifically tailored for Reddit conversational graphs. Identifies topic-cluster
 * affiliations, boundary spanners, and community cohesion metrics.
 */

import { CanonicalGraph } from '../../schemas';
import { CommunityDetector as BaseCommunityDetector, CommunityDetectionResult } from '../../transformers/communityDetector';

export interface RedditCommunityProfile {
  id: string;
  label: string;
  size: number;
  members: string[];
  internalDensity: number;
  boundaryBridgeNodes: string[];
  dominantSubreddits: string[];
}

export class RedditCommunityDetector {
  /**
   * Helper to build edge weights map from canonical edges.
   */
  private static extractEdgeWeights(graph: CanonicalGraph): Map<string, number> {
    const weights = new Map<string, number>();
    for (const edge of graph.edges.values()) {
      const key = edge.source < edge.target ? `${edge.source}--${edge.target}` : `${edge.target}--${edge.source}`;
      weights.set(key, edge.weight);
    }
    return weights;
  }

  /**
   * Detects communities using deterministic weighted Label Propagation.
   */
  public static detect(graph: CanonicalGraph): CommunityDetectionResult {
    const nodes = Array.from(graph.nodes.keys());
    const edgeWeights = this.extractEdgeWeights(graph);
    const result = BaseCommunityDetector.detectLabelPropagation(
      nodes,
      graph.adjacency,
      edgeWeights,
      20
    );

    graph.communities = result.communities;
    graph.modularity = result.modularity;
    for (const [nodeId, commId] of result.assignments.entries()) {
      const node = graph.nodes.get(nodeId);
      if (node) {
        node.communityId = commId;
        node.communities = [commId];
      }
    }

    return result;
  }

  /**
   * Calculates the Newman-Girvan modularity Q for the graph.
   */
  public static calculateModularity(graph: CanonicalGraph): number {
    const nodes = Array.from(graph.nodes.keys());
    const assignments = new Map<string, string>();
    for (const [commId, memberIds] of graph.communities.entries()) {
      for (const m of memberIds) {
        assignments.set(m, commId);
      }
    }
    const edgeWeights = this.extractEdgeWeights(graph);
    return BaseCommunityDetector.calculateModularity(
      nodes,
      graph.adjacency,
      edgeWeights,
      assignments
    );
  }

  /**
   * Profiles each detected community cluster with structural and thematic metrics.
   */
  public static profileCommunities(graph: CanonicalGraph): RedditCommunityProfile[] {
    const profiles: RedditCommunityProfile[] = [];

    for (const [commId, memberIds] of graph.communities.entries()) {
      const memberSet = new Set(memberIds);
      let internalEdges = 0;
      const bridgeNodes = new Set<string>();
      const subreddits = new Map<string, number>();

      for (const memberId of memberIds) {
        const node = graph.nodes.get(memberId);
        if (node && node.features && node.features.subreddit) {
          const sub = String(node.features.subreddit);
          subreddits.set(sub, (subreddits.get(sub) || 0) + 1);
        }

        const neighbors = graph.adjacency.get(memberId) || new Set<string>();
        for (const nbr of neighbors) {
          if (memberSet.has(nbr)) {
            internalEdges++;
          } else {
            bridgeNodes.add(memberId);
          }
        }
      }

      // Internal density: 2 * E_in / (V * (V - 1))
      const V = memberIds.length;
      const maxPossible = V > 1 ? (V * (V - 1)) : 1;
      const internalDensity = Number(((internalEdges / 2) / maxPossible).toFixed(4));

      // Sort dominant subreddits
      const sortedSubs = Array.from(subreddits.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([s]) => s);

      profiles.push({
        id: commId,
        label: `Cluster_${commId}`,
        size: V,
        members: [...memberIds],
        internalDensity,
        boundaryBridgeNodes: Array.from(bridgeNodes),
        dominantSubreddits: sortedSubs,
      });
    }

    return profiles.sort((a, b) => b.size - a.size);
  }
}
