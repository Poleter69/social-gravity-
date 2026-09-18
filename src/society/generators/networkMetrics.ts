/**
 * Social Gravity - Network Graph Analytics & Metrics Calculation
 * Computes topological metrics, degree distributions, and local/global clustering coefficients.
 */

import { Agent } from '../types/agent';
import { Community } from '../types/community';
import { SocialEdge, NetworkMetrics } from '../types/network';

export function computeGraphMetricsAndEnrichAgents(
  agents: Agent[],
  communities: Community[],
  edges: SocialEdge[]
): NetworkMetrics {
  const n = agents.length;
  if (n === 0) {
    return {
      totalNodes: 0,
      totalEdges: 0,
      averageDegree: 0,
      density: 0,
      globalClusteringCoefficient: 0,
      bridgeEdgeRatio: 0,
    };
  }

  // 1. Build fast Adjacency Map
  const adjMap = new Map<string, Set<string>>();
  for (const a of agents) {
    adjMap.set(a.id, new Set<string>());
  }

  let bridgeCount = 0;
  for (const edge of edges) {
    if (edge.type === 'bridge') {
      bridgeCount++;
    }
    const sSet = adjMap.get(edge.source);
    const tSet = adjMap.get(edge.target);
    if (sSet) sSet.add(edge.target);
    if (tSet) tSet.add(edge.source);
  }

  // 2. Compute local metrics for each agent
  let sumClustering = 0;

  for (const agent of agents) {
    const neighbors = adjMap.get(agent.id) || new Set<string>();
    const degree = neighbors.size;
    agent.metrics.degree = degree;
    agent.metrics.inDegree = degree;
    agent.metrics.outDegree = degree;

    if (degree < 2) {
      agent.metrics.localClustering = 0;
    } else {
      // Count edges between neighbors (sample up to 50 neighbors for high-degree hubs to prevent CPU freeze)
      const neighborList = Array.from(neighbors);
      const sampleNeighbors = degree > 50 ? neighborList.slice(0, 50) : neighborList;
      const sampleDegree = sampleNeighbors.length;
      let neighborEdges = 0;

      for (let i = 0; i < sampleNeighbors.length; i++) {
        const u = sampleNeighbors[i];
        const uNeighbors = adjMap.get(u);
        if (!uNeighbors) continue;

        for (let j = i + 1; j < sampleNeighbors.length; j++) {
          const v = sampleNeighbors[j];
          if (uNeighbors.has(v)) {
            neighborEdges++;
          }
        }
      }

      const possibleTriangles = (sampleDegree * (sampleDegree - 1)) / 2;
      const localC = possibleTriangles > 0 ? neighborEdges / possibleTriangles : 0;
      agent.metrics.localClustering = Number(localC.toFixed(3));
      sumClustering += localC;
    }
  }

  // 3. Compute community-level aggregated metrics
  const agentMap = new Map<string, Agent>(agents.map((a) => [a.id, a]));

  for (const comm of communities) {
    const members = comm.agentIds.map((id) => agentMap.get(id)).filter(Boolean) as Agent[];
    comm.metrics.size = members.length;

    if (members.length > 0) {
      const sumTrust = members.reduce((acc, a) => acc + a.traits.trust, 0);
      const sumInf = members.reduce((acc, a) => acc + a.traits.influence, 0);
      const sumConf = members.reduce((acc, a) => acc + a.traits.conformity, 0);
      const sumRisk = members.reduce((acc, a) => acc + a.traits.riskTolerance, 0);

      comm.metrics.avgTrust = Number((sumTrust / members.length).toFixed(3));
      comm.metrics.avgInfluence = Number((sumInf / members.length).toFixed(3));
      comm.metrics.avgConformity = Number((sumConf / members.length).toFixed(3));
      comm.metrics.avgRiskTolerance = Number((sumRisk / members.length).toFixed(3));

      // Calculate internal density
      const memberSet = new Set(comm.agentIds);
      let internalEdges = 0;
      for (const e of edges) {
        if (memberSet.has(e.source) && memberSet.has(e.target)) {
          internalEdges++;
        }
      }
      const maxPossible = (members.length * (members.length - 1)) / 2;
      comm.metrics.internalDensity = maxPossible > 0 
        ? Number((internalEdges / maxPossible).toFixed(3)) 
        : 0;
    }
  }

  // 4. Compute global network metrics
  const totalEdges = edges.length;
  const maxPossibleEdges = (n * (n - 1)) / 2;
  const density = maxPossibleEdges > 0 ? totalEdges / maxPossibleEdges : 0;
  const avgDegree = (2 * totalEdges) / n;
  const globalClustering = n > 0 ? sumClustering / n : 0;
  const bridgeRatio = totalEdges > 0 ? bridgeCount / totalEdges : 0;

  return {
    totalNodes: n,
    totalEdges,
    averageDegree: Number(avgDegree.toFixed(2)),
    density: Number(density.toFixed(4)),
    globalClusteringCoefficient: Number(globalClustering.toFixed(3)),
    bridgeEdgeRatio: Number(bridgeRatio.toFixed(3)),
  };
}
