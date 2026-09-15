/**
 * Social Gravity V2 - Canonical Graph Builder & Ecosystem Converter
 *
 * Assembles validated nodes, edges, interactions, and communities into
 * an immutable CanonicalGraph object and provides zero-friction converters
 * to both V2 DynamicGraph and V1 Society simulation models.
 */

import { DynamicGraph } from '../../graph/engine/dynamicGraph';
import { Agent } from '../../society/types/agent';
import { Community } from '../../society/types/community';
import { SocialEdge } from '../../society/types/network';
import { Society, SocietySummary } from '../../society/types/society';
import { createInitialPsychologicalState } from '../../psychology/defaults';
import {
  CanonicalEdge,
  CanonicalGraph,
  CanonicalNode,
  CanonicalTemporalSlice,
} from '../schemas';
import { CommunityDetector } from './communityDetector';

export interface GraphBuilderOptions {
  id: string;
  sourceDataset: string;
  detectCommunitiesIfMissing?: boolean;
  metadata?: Record<string, unknown>;
}

export class CanonicalGraphBuilder {
  private options: GraphBuilderOptions;
  private nodes: Map<string, CanonicalNode> = new Map();
  private edges: Map<string, CanonicalEdge> = new Map();
  private adjacency: Map<string, Set<string>> = new Map();
  private communities: Map<string, string[]> = new Map();
  private temporalSlices: CanonicalTemporalSlice[] = [];

  constructor(options: GraphBuilderOptions) {
    this.options = options;
  }

  public addNode(node: CanonicalNode): this {
    this.nodes.set(node.id, { ...node });
    if (!this.adjacency.has(node.id)) {
      this.adjacency.set(node.id, new Set());
    }
    return this;
  }

  public addEdge(edge: CanonicalEdge): this {
    this.edges.set(edge.id, { ...edge });

    let uSet = this.adjacency.get(edge.source);
    if (!uSet) {
      uSet = new Set();
      this.adjacency.set(edge.source, uSet);
    }
    uSet.add(edge.target);

    if (!edge.directed) {
      let vSet = this.adjacency.get(edge.target);
      if (!vSet) {
        vSet = new Set();
        this.adjacency.set(edge.target, vSet);
      }
      vSet.add(edge.source);
    }

    return this;
  }

  public setCommunities(communities: Map<string, string[]>): this {
    this.communities = new Map(communities);
    return this;
  }

  public setTemporalSlices(slices: CanonicalTemporalSlice[]): this {
    this.temporalSlices = [...slices];
    return this;
  }

  /**
   * Finalizes the CanonicalGraph object, performing automatic community detection,
   * node degree computations, bridge identification, and influence scoring.
   */
  public build(): CanonicalGraph {
    const nodeIds = Array.from(this.nodes.keys());

    // 1. Degree calculation
    let maxDegree = 1;
    for (const [nodeId, neighbors] of this.adjacency.entries()) {
      const node = this.nodes.get(nodeId);
      if (node) {
        node.degree = neighbors.size;
        node.inDegree = neighbors.size;
        node.outDegree = neighbors.size;
        if (node.degree > maxDegree) maxDegree = node.degree;
      }
    }

    // 2. Community Detection if not pre-populated
    let modularity = 0;
    if (this.communities.size === 0 && (this.options.detectCommunitiesIfMissing ?? true)) {
      const edgeWeightMap = new Map<string, number>();
      for (const edge of this.edges.values()) {
        const key = edge.source < edge.target ? `${edge.source}--${edge.target}` : `${edge.target}--${edge.source}`;
        edgeWeightMap.set(key, edge.weight);
      }

      const lpaResult = CommunityDetector.detectLabelPropagation(
        nodeIds,
        this.adjacency,
        edgeWeightMap
      );
      this.communities = lpaResult.communities;
      modularity = lpaResult.modularity;

      // Assign primary community to each node
      for (const [nodeId, commId] of lpaResult.assignments.entries()) {
        const node = this.nodes.get(nodeId);
        if (node) {
          node.communityId = commId;
          node.communities = [commId];
        }
      }
    } else {
      // Calculate modularity with provided communities
      const assignments = new Map<string, string>();
      for (const [commId, members] of this.communities.entries()) {
        for (const m of members) {
          if (!assignments.has(m)) {
            assignments.set(m, commId);
          }
        }
      }
      const edgeWeightMap = new Map<string, number>();
      for (const edge of this.edges.values()) {
        const key = edge.source < edge.target ? `${edge.source}--${edge.target}` : `${edge.target}--${edge.source}`;
        edgeWeightMap.set(key, edge.weight);
      }
      modularity = CommunityDetector.calculateModularity(
        nodeIds,
        this.adjacency,
        edgeWeightMap,
        assignments
      );
    }

    // 3. Bridge Node Identification & Influence Scoring
    for (const node of this.nodes.values()) {
      const neighbors = this.adjacency.get(node.id);
      let isBridge = false;
      if (neighbors) {
        for (const neighborId of neighbors) {
          const neighbor = this.nodes.get(neighborId);
          if (neighbor && neighbor.communityId !== node.communityId) {
            isBridge = true;
            break;
          }
        }
      }
      node.isBridge = isBridge;

      // Influence = normalized degree boosted if bridge node
      const baseInf = Math.min(1.0, node.degree / maxDegree);
      node.influence = Number(Math.min(1.0, isBridge ? baseInf * 1.15 : baseInf).toFixed(4));
    }

    return {
      id: this.options.id,
      sourceDataset: this.options.sourceDataset,
      nodes: this.nodes,
      edges: this.edges,
      adjacency: this.adjacency,
      communities: this.communities,
      modularity,
      temporalSlices: this.temporalSlices,
      metadata: {
        totalNodes: this.nodes.size,
        totalEdges: this.edges.size,
        communityCount: this.communities.size,
        modularity,
        builtAt: Date.now(),
        ...(this.options.metadata || {}),
      },
    };
  }

  // --- CONVERTERS FOR DOWNSTREAM SIMULATOR INTEGRATION ---

  /**
   * Instantiates a Social Gravity V2 DynamicGraph from a CanonicalGraph.
   */
  public static toDynamicGraph(canonical: CanonicalGraph): DynamicGraph {
    const dynamicGraph = new DynamicGraph(42);

    // Add nodes
    for (const node of canonical.nodes.values()) {
      dynamicGraph.addNode({
        id: node.id,
        communityId: node.communityId,
        currentInfluence: node.influence,
        status: 'active',
        metadata: {
          label: node.label,
          features: node.features,
          rawFeatureVector: node.rawFeatureVector,
          communities: node.communities,
        },
      });
    }

    // Add edges
    for (const edge of canonical.edges.values()) {
      dynamicGraph.addEdge({
        source: edge.source,
        target: edge.target,
        weight: Math.max(0.55, edge.weight),
        relationshipType: edge.relationshipType,
        directed: edge.directed,
        metadata: edge.metadata,
      });
    }

    return dynamicGraph;
  }

  /**
   * Instantiates a Social Gravity V1 Society object from a CanonicalGraph.
   * Enables immediate simulation using the existing rumor & discovery engines.
   */
  public static toSociety(canonical: CanonicalGraph): Society {
    const palette = ['#00f0ff', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#a855f7'];

    // 1. Build Community entities
    const communities: Community[] = [];
    let colorIdx = 0;

    for (const [commId, memberIds] of canonical.communities.entries()) {
      communities.push({
        id: commId,
        name: `Cluster ${commId}`,
        archetype: 'online_community',
        color: palette[colorIdx++ % palette.length],
        agentIds: [...memberIds],
        metadata: {
          description: `Algorithmic community cluster ${commId}`,
          category: 'Social Circle',
          density: 0.4,
          isolation: 0.3,
        },
        metrics: {
          size: memberIds.length,
          avgTrust: 0.55,
          avgInfluence: 0.5,
          avgConformity: 0.6,
          avgRiskTolerance: 0.45,
          internalDensity: 0.4,
        },
      });
    }

    // 2. Build Agent entities
    const agents: Agent[] = [];
    const agentMap = new Map<string, Agent>();

    for (const node of canonical.nodes.values()) {
      const agent: Agent = {
        id: node.id,
        name: node.label,
        communityId: node.communityId,
        role: node.isBridge ? 'Bridge Connector' : node.influence > 0.75 ? 'Opinion Leader' : 'Active Member',
        traits: {
          trust: 0.55,
          influence: node.influence,
          conformity: 0.6,
          riskTolerance: 0.45,
        },
        state: {
          beliefStatus: 'uninformed',
          emotionalState: 'neutral',
          exposureTick: null,
          shareCount: 0,
        },
        metrics: {
          degree: node.degree,
          inDegree: node.inDegree,
          outDegree: node.outDegree,
          localClustering: 0,
        },
        connections: Array.from(canonical.adjacency.get(node.id) || []),
        isInfluencer: node.influence > 0.75,
        isBridge: node.isBridge,
        isIsolated: node.degree <= 1,
        peerTrustMap: {},
        psychology: createInitialPsychologicalState({
          trust: 0.55,
          influence: node.influence,
          conformity: 0.6,
          riskTolerance: 0.45,
        }),
        metadata: {
          originalId: node.originalId,
          features: node.features,
          communities: node.communities,
          rawFeatureVector: node.rawFeatureVector,
        },
      };

      agents.push(agent);
      agentMap.set(agent.id, agent);
    }

    // 3. Build SocialEdges
    const edges: SocialEdge[] = [];
    for (const edge of canonical.edges.values()) {
      const agentU = agentMap.get(edge.source);
      const agentV = agentMap.get(edge.target);

      const isCrossCommunity = !!(agentU && agentV && agentU.communityId !== agentV.communityId);
      const edgeType = (edge.relationshipType === 'bridge' || isCrossCommunity)
        ? 'bridge'
        : edge.relationshipType === 'hierarchical'
          ? 'hierarchical'
          : edge.weight < 0.35
            ? 'weak_tie'
            : 'peer';

      edges.push({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
        type: edgeType,
        timestamp: edge.lastInteraction || edge.firstInteraction,
        metadata: edge.metadata,
      });

      // Peer trust map
      if (agentU && agentV) {
        agentU.peerTrustMap[edge.target] = edge.weight;
        agentV.peerTrustMap[edge.source] = edge.weight;
      }
    }

    const V = agents.length;
    const E = edges.length;
    const density = V > 1 ? (2 * E) / (V * (V - 1)) : 0;
    const avgDeg = V > 0 ? (2 * E) / V : 0;

    const summary: SocietySummary = {
      totalPopulation: V,
      communityCount: communities.length,
      influencerCount: agents.filter(a => a.isInfluencer).length,
      bridgeNodeCount: agents.filter(a => a.isBridge).length,
      isolatedNodeCount: agents.filter(a => a.isIsolated).length,
      avgTrust: 0.55,
      avgConformity: 0.6,
      avgInfluence: Number((agents.reduce((s, a) => s + a.traits.influence, 0) / (V || 1)).toFixed(3)),
      avgRiskTolerance: 0.45,
      density: Number(density.toFixed(4)),
      averageDegree: Number(avgDeg.toFixed(2)),
      globalClustering: 0.35,
    };

    return {
      id: canonical.id,
      name: `Imported: ${canonical.sourceDataset}`,
      archetype: 'online_community',
      createdAt: new Date().toISOString(),
      config: {
        name: `Imported: ${canonical.sourceDataset}`,
        archetype: 'online_community',
        populationSize: V,
        communityCount: communities.length,
        seed: 42,
      },
      agents,
      communities,
      edges,
      metrics: {
        totalNodes: V,
        totalEdges: E,
        averageDegree: avgDeg,
        density,
        globalClusteringCoefficient: 0.35,
        bridgeEdgeRatio: 0.15,
      },
      summary,
    };
  }
}
