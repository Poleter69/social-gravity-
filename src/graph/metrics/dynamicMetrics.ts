/**
 * Social Gravity V2 - Dynamic Graph Metrics Engine
 *
 * Research-grade live network topology analyzer computing dynamic metrics
 * every simulation tick with formal mathematical rigor and complexity bounds.
 *
 * References:
 * - Watts, D. J., & Strogatz, S. H. (1998). Collective dynamics of 'small-world' networks. Nature, 393(6684), 440-442.
 * - Newman, M. E. (2003). The structure and function of complex networks. SIAM Review, 45(2), 167-256.
 * - Tarjan, R. (1972). Depth-first search and linear graph algorithms. SIAM Journal on Computing, 1(2), 146-160.
 */

import { DynamicEdge, DynamicGraphMetrics, DynamicNode } from '../types';

export class DynamicMetricsEngine {
  /**
   * Computes complete snapshot of dynamic graph metrics.
   *
   * Input:
   *   - nodes: ReadonlyMap<string, DynamicNode>
   *   - activeAdjacency: ReadonlyMap<string, Set<string>> (only non-removed/active ties)
   *   - activeEdges: ReadonlyArray<DynamicEdge>
   *   - tick: current simulation tick
   *
   * Output:
   *   - DynamicGraphMetrics
   *
   * Time Complexity: O(|V| + |E| + sum_{v}(deg(v)^2)) for exact clustering; O(|V| + |E|) for components & density.
   * Space Complexity: O(|V| + |E|) for BFS visited sets and degree histograms.
   */
  public static compute(
    nodes: ReadonlyMap<string, DynamicNode>,
    activeAdjacency: ReadonlyMap<string, Set<string>>,
    activeEdges: ReadonlyArray<DynamicEdge>,
    tick: number
  ): DynamicGraphMetrics {
    const startTime = performance.now();

    const activeNodeList: DynamicNode[] = [];
    for (const node of nodes.values()) {
      if (node.status === 'active') {
        activeNodeList.push(node);
      }
    }

    const V = activeNodeList.length;
    const E = activeEdges.length;

    // 1. Density rho = 2|E| / (V * (V - 1)) for undirected
    let density = 0;
    if (V > 1) {
      density = (2 * E) / (V * (V - 1));
      // Clamp float precision
      density = Math.min(1.0, Math.max(0.0, density));
    }

    // 2. Degree distribution & Average Degree
    let totalDegree = 0;
    const degreeDistribution: Record<number, number> = {};

    for (let i = 0; i < V; i++) {
      const nodeId = activeNodeList[i].id;
      const neighbors = activeAdjacency.get(nodeId);
      const degree = neighbors ? neighbors.size : 0;
      totalDegree += degree;
      degreeDistribution[degree] = (degreeDistribution[degree] || 0) + 1;
    }

    const averageDegree = V > 0 ? totalDegree / V : 0;

    // 3. Watts-Strogatz Global Clustering Coefficient
    // C = (1 / |{v : deg(v) >= 2}|) * sum_{v} (2 * e_v) / (k_v * (k_v - 1))
    let clusteringSum = 0;
    let eligibleNodeCount = 0;

    for (let i = 0; i < V; i++) {
      const nodeId = activeNodeList[i].id;
      const neighbors = activeAdjacency.get(nodeId);
      if (!neighbors || neighbors.size < 2) continue;

      const k = neighbors.size;
      const neighborArray = Array.from(neighbors);
      let localTriangles = 0;

      for (let u = 0; u < neighborArray.length; u++) {
        const uId = neighborArray[u];
        const uNeighbors = activeAdjacency.get(uId);
        if (!uNeighbors) continue;

        for (let w = u + 1; w < neighborArray.length; w++) {
          const wId = neighborArray[w];
          if (uNeighbors.has(wId)) {
            localTriangles++;
          }
        }
      }

      const possibleTriangles = (k * (k - 1)) / 2;
      const localClustering = localTriangles / possibleTriangles;
      clusteringSum += localClustering;
      eligibleNodeCount++;
    }

    const globalClusteringCoefficient =
      eligibleNodeCount > 0 ? clusteringSum / eligibleNodeCount : 0;

    // 4. Bridge Ratio (Cross-community structural ties / total active edges)
    let bridgeCount = 0;
    for (let i = 0; i < E; i++) {
      const edge = activeEdges[i];
      const sourceNode = nodes.get(edge.source);
      const targetNode = nodes.get(edge.target);
      if (
        sourceNode &&
        targetNode &&
        sourceNode.communityId !== targetNode.communityId
      ) {
        bridgeCount++;
      }
    }
    const bridgeRatio = E > 0 ? bridgeCount / E : 0;

    // 5. Connected Components & Largest Component Size (Breadth-First Search)
    const visited = new Set<string>();
    let componentCount = 0;
    let largestComponentSize = 0;

    for (let i = 0; i < V; i++) {
      const rootId = activeNodeList[i].id;
      if (visited.has(rootId)) continue;

      componentCount++;
      let currentComponentSize = 0;
      const queue: string[] = [rootId];
      visited.add(rootId);

      while (queue.length > 0) {
        const current = queue.shift()!;
        currentComponentSize++;

        const neighbors = activeAdjacency.get(current);
        if (neighbors) {
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              // Ensure neighbor is also in active nodes
              const neighborNode = nodes.get(neighbor);
              if (neighborNode && neighborNode.status === 'active') {
                visited.add(neighbor);
                queue.push(neighbor);
              }
            }
          }
        }
      }

      if (currentComponentSize > largestComponentSize) {
        largestComponentSize = currentComponentSize;
      }
    }

    const computationTimeMs = performance.now() - startTime;

    return {
      tick,
      totalNodes: nodes.size,
      activeNodes: V,
      totalEdges: E,
      activeEdges: E,
      density: Number(density.toFixed(6)),
      averageDegree: Number(averageDegree.toFixed(4)),
      degreeDistribution,
      globalClusteringCoefficient: Number(globalClusteringCoefficient.toFixed(6)),
      bridgeRatio: Number(bridgeRatio.toFixed(6)),
      componentCount,
      largestComponentSize,
      computationTimeMs: Number(computationTimeMs.toFixed(3)),
    };
  }
}
