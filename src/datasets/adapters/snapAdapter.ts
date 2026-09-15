/**
 * Social Gravity - SNAP Graph Dataset Ingestion Adapter
 * Parses Stanford Network Analysis Platform (SNAP) ego-networks and edge-lists
 * (e.g., Facebook Social Circles, Twitter Circles) into fully validated Society topologies.
 */

import { Society, SocietySummary } from '../../society/types/society';
import { Agent } from '../../society/types/agent';
import { Community } from '../../society/types/community';
import { SocialEdge } from '../../society/types/network';
import { PRNG } from '../../society/math/random';
import { DistributionSampler } from '../../society/math/distributions';
import { createInitialPsychologicalState } from '../../psychology/defaults';
import { computeGraphMetricsAndEnrichAgents } from '../../society/generators/networkMetrics';
import { SnapEdgeListInput, DatasetLoadResult, DatasetMetadata, IngestionOptions } from '../types';

export class SnapDatasetAdapter {
  /**
   * Parse SNAP edge-list and optional circle definitions into a valid Society.
   */
  public static parse(input: SnapEdgeListInput, options: IngestionOptions = {}): DatasetLoadResult<Society> {
    const startTime = performance.now();
    const warnings: string[] = [];
    const seed = options.seed ?? 1337;
    const rng = new PRNG(seed);
    const sampler = new DistributionSampler(rng);

    // 1. Parse edge lines
    const rawLines = input.edgesText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
    const edgeSet = new Set<string>();
    const nodeNeighbors = new Map<string, Set<string>>();

    for (const line of rawLines) {
      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;
      const u = `snap-${parts[0]}`;
      const v = `snap-${parts[1]}`;
      if (u === v) continue; // skip self-loops

      const edgeKey = u < v ? `${u}--${v}` : `${v}--${u}`;
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        
        if (!nodeNeighbors.has(u)) nodeNeighbors.set(u, new Set());
        if (!nodeNeighbors.has(v)) nodeNeighbors.set(v, new Set());
        nodeNeighbors.get(u)!.add(v);
        nodeNeighbors.get(v)!.add(u);
      }
    }

    let allNodeIds = Array.from(nodeNeighbors.keys());
    if (allNodeIds.length === 0) {
      throw new Error('SNAP Ingestion Error: No valid edges found in input text.');
    }

    // Limit nodes if requested
    if (options.maxNodes && allNodeIds.length > options.maxNodes) {
      warnings.push(`Dataset truncated from ${allNodeIds.length} to ${options.maxNodes} nodes.`);
      allNodeIds.sort((a, b) => (nodeNeighbors.get(b)?.size || 0) - (nodeNeighbors.get(a)?.size || 0));
      const keepSet = new Set(allNodeIds.slice(0, options.maxNodes));
      allNodeIds = Array.from(keepSet);

      for (const [node, neighbors] of nodeNeighbors.entries()) {
        if (!keepSet.has(node)) {
          nodeNeighbors.delete(node);
        } else {
          for (const n of Array.from(neighbors)) {
            if (!keepSet.has(n)) neighbors.delete(n);
          }
        }
      }
    }

    // 2. Parse circles or infer communities via Greedy Label Propagation
    const nodeCommunityMap = new Map<string, string>();
    const communityNames = new Map<string, string>();

    if (input.circlesText && input.circlesText.trim().length > 0) {
      const circleLines = input.circlesText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      circleLines.forEach((cLine, idx) => {
        const parts = cLine.split(/\s+/);
        const circleId = `circle-${parts[0] || idx}`;
        communityNames.set(circleId, `Circle: ${parts[0] || idx}`);
        for (let i = 1; i < parts.length; i++) {
          const memberId = `snap-${parts[i]}`;
          if (nodeNeighbors.has(memberId) && !nodeCommunityMap.has(memberId)) {
            nodeCommunityMap.set(memberId, circleId);
          }
        }
      });
    }

    // Fallback community detection (greedy modularity clustering)
    let nextCommId = 1;
    for (const nodeId of allNodeIds) {
      if (!nodeCommunityMap.has(nodeId)) {
        const neighborCommunities = new Map<string, number>();
        const neighbors = nodeNeighbors.get(nodeId) || new Set();
        for (const n of neighbors) {
          const comm = nodeCommunityMap.get(n);
          if (comm) {
            neighborCommunities.set(comm, (neighborCommunities.get(comm) || 0) + 1);
          }
        }

        let bestComm: string | null = null;
        let maxCount = 0;
        for (const [c, count] of neighborCommunities.entries()) {
          if (count > maxCount) {
            maxCount = count;
            bestComm = c;
          }
        }

        const chosenComm = bestComm || `cluster-${nextCommId++}`;
        nodeCommunityMap.set(nodeId, chosenComm);
        if (!communityNames.has(chosenComm)) {
          communityNames.set(chosenComm, `Cluster ${chosenComm}`);
        }
      }
    }

    // 3. Form Community objects
    const palette = ['#00f0ff', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#a855f7'];
    const communities: Community[] = Array.from(communityNames.keys()).map((cId, idx) => ({
      id: cId,
      name: communityNames.get(cId) || cId,
      archetype: 'online_community',
      color: palette[idx % palette.length],
      metadata: {
        description: `Empirical SNAP cluster: ${cId}`,
        category: 'empirical_ego_network',
        density: 0.35,
        isolation: 0.50,
      },
      agentIds: [],
      metrics: {
        size: 0,
        avgTrust: 0,
        avgInfluence: 0,
        avgConformity: 0,
        avgRiskTolerance: 0,
        internalDensity: 0.35,
      }
    }));
    const commMap = new Map(communities.map(c => [c.id, c]));

    // 4. Calculate Degree, Influencers & Bridges
    const degreeMap = new Map<string, number>();
    let maxDegree = 0;
    allNodeIds.forEach(id => {
      const deg = nodeNeighbors.get(id)?.size || 0;
      degreeMap.set(id, deg);
      if (deg > maxDegree) maxDegree = deg;
    });

    const sortedByDegree = [...allNodeIds].sort((a, b) => (degreeMap.get(b) || 0) - (degreeMap.get(a) || 0));
    const influencerCount = Math.max(1, Math.floor(allNodeIds.length * 0.08));
    const influencerSet = new Set(sortedByDegree.slice(0, influencerCount));

    const bridgeSet = new Set<string>();
    allNodeIds.forEach(id => {
      const myComm = nodeCommunityMap.get(id);
      const neighbors = nodeNeighbors.get(id) || new Set();
      for (const n of neighbors) {
        if (nodeCommunityMap.get(n) !== myComm) {
          bridgeSet.add(id);
          break;
        }
      }
    });

    // 5. Build Agents with standardized nested schema
    const defaultTrust = input.defaultTrust ?? 0.55;
    const defaultConformity = input.defaultConformity ?? 0.60;
    const defaultRiskTolerance = input.defaultRiskTolerance ?? 0.45;

    const agents: Agent[] = allNodeIds.map(nodeId => {
      const commId = nodeCommunityMap.get(nodeId) || communities[0].id;
      const comm = commMap.get(commId);
      if (comm) comm.agentIds.push(nodeId);

      const isInfluencer = influencerSet.has(nodeId);
      const isBridge = bridgeSet.has(nodeId);
      const degree = degreeMap.get(nodeId) || 0;
      const normalizedInfluence = maxDegree > 0 ? Math.min(1.0, Math.max(0.1, (degree / maxDegree) * 0.95)) : 0.5;

      const trust = sampler.truncatedNormal(defaultTrust, 0.15, 0.05, 0.98);
      const conformity = sampler.truncatedNormal(defaultConformity, 0.18, 0.05, 0.98);
      const riskTolerance = sampler.truncatedNormal(defaultRiskTolerance, 0.18, 0.05, 0.98);
      const influence = isInfluencer ? Math.max(0.80, normalizedInfluence) : normalizedInfluence;

      return {
        id: nodeId,
        name: `User ${nodeId.replace('snap-', '#')}`,
        communityId: commId,
        role: isInfluencer ? 'Ego Hub / Influencer' : isBridge ? 'Boundary Spanner' : 'Active Member',
        traits: {
          trust: Number(trust.toFixed(3)),
          influence: Number(influence.toFixed(3)),
          conformity: Number(conformity.toFixed(3)),
          riskTolerance: Number(riskTolerance.toFixed(3)),
        },
        state: {
          beliefStatus: 'uninformed',
          emotionalState: 'neutral',
          exposureTick: null,
          shareCount: 0,
        },
        metrics: {
          degree: 0,
          inDegree: 0,
          outDegree: 0,
          localClustering: 0,
        },
        connections: [],
        isInfluencer,
        isBridge,
        isIsolated: degree <= 1,
        peerTrustMap: {},
        psychology: createInitialPsychologicalState({
          trust: Number(trust.toFixed(3)),
          influence: Number(influence.toFixed(3)),
          conformity: Number(conformity.toFixed(3)),
          riskTolerance: Number(riskTolerance.toFixed(3)),
        }),
      };
    });

    const agentMap = new Map(agents.map(a => [a.id, a]));

    // 6. Build Social Edges
    const edges: SocialEdge[] = [];
    const processedEdges = new Set<string>();

    for (const [u, neighbors] of nodeNeighbors.entries()) {
      for (const v of neighbors) {
        const edgeKey = u < v ? `${u}--${v}` : `${v}--${u}`;
        if (!processedEdges.has(edgeKey)) {
          processedEdges.add(edgeKey);
          const uComm = nodeCommunityMap.get(u);
          const vComm = nodeCommunityMap.get(v);
          const isBridgeEdge = uComm !== vComm;

          edges.push({
            id: `edge-${u}-${v}`,
            source: u,
            target: v,
            weight: Number((0.5 + rng.nextFloat() * 0.5).toFixed(2)),
            type: isBridgeEdge ? 'bridge' : 'peer',
          });

          // Populate connections & dyadic trust
          const agentU = agentMap.get(u);
          const agentV = agentMap.get(v);
          if (agentU && agentV) {
            agentU.connections.push(v);
            agentV.connections.push(u);

            const weight = 0.5 + rng.nextFloat() * 0.5;
            agentU.peerTrustMap[v] = Number(Math.min(1.0, agentU.traits.trust * 0.7 + weight * 0.3).toFixed(3));
            agentV.peerTrustMap[u] = Number(Math.min(1.0, agentV.traits.trust * 0.7 + weight * 0.3).toFixed(3));
          }
        }
      }
    }

    // Filter populated communities
    const populatedCommunities = communities.filter(c => c.agentIds.length > 0);

    // Compute graph metrics & enrich agents
    const metrics = computeGraphMetricsAndEnrichAgents(agents, populatedCommunities, edges);

    // Build Society Summary
    const summary: SocietySummary = {
      totalPopulation: agents.length,
      communityCount: populatedCommunities.length,
      influencerCount: influencerSet.size,
      bridgeNodeCount: bridgeSet.size,
      isolatedNodeCount: agents.filter(a => a.isIsolated).length,
      avgTrust: Number((agents.reduce((s, a) => s + a.traits.trust, 0) / agents.length).toFixed(3)),
      avgConformity: Number((agents.reduce((s, a) => s + a.traits.conformity, 0) / agents.length).toFixed(3)),
      avgInfluence: Number((agents.reduce((s, a) => s + a.traits.influence, 0) / agents.length).toFixed(3)),
      avgRiskTolerance: Number((agents.reduce((s, a) => s + a.traits.riskTolerance, 0) / agents.length).toFixed(3)),
      density: metrics.density,
      averageDegree: metrics.averageDegree,
      globalClustering: metrics.globalClusteringCoefficient,
    };

    const society: Society = {
      id: `snap-${Date.now()}`,
      name: input.datasetName || 'Stanford SNAP Facebook Ego-Network',
      archetype: 'online_community',
      createdAt: new Date().toISOString(),
      config: {
        name: input.datasetName || 'Stanford SNAP Facebook Ego-Network',
        archetype: 'online_community',
        populationSize: agents.length,
        communityCount: populatedCommunities.length,
        seed,
      },
      agents,
      communities: populatedCommunities,
      edges,
      metrics,
      summary,
    };

    const parseTimeMs = Math.round(performance.now() - startTime);

    const metadata: DatasetMetadata = {
      id: society.id,
      name: society.name,
      source: 'snap_facebook',
      description: 'Empirical social network topology from Stanford SNAP Social Circles benchmark.',
      nodeCount: agents.length,
      edgeCount: edges.length,
      citation: 'Leskovec, J. & Mcauley, J. (2012). Learning to Discover Social Circles in Ego Networks. NIPS.',
      license: 'Public Research Domain',
      tags: ['SNAP', 'Empirical Graph', 'Social Circles', 'Benchmark']
    };

    return {
      success: true,
      data: society,
      metadata,
      parseTimeMs,
      warnings,
    };
  }
}
