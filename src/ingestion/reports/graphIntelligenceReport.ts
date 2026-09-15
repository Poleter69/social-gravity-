/**
 * Social Gravity V2 - Graph Intelligence Report Generator
 *
 * Automatically generates rigorous scientific intelligence reports for any ingested dataset:
 * - Structural Topology (Nodes, Edges, Density, Degree Distribution)
 * - Triadic Closure & Watts-Strogatz Clustering
 * - Community Structure & Newman Modularity Q
 * - Boundary Bridge Nodes & Information Bottlenecks
 * - Connected Components & Giant Component Size
 *
 * Formats:
 * - Structured JSON for programmatic consumption
 * - Human-readable Markdown with contextual network science explanations
 */

import { CanonicalGraph } from '../schemas';

export interface GraphIntelligenceData {
  datasetId: string;
  sourceDataset: string;
  generatedAt: string;
  structural: {
    totalNodes: number;
    totalEdges: number;
    density: number;
    averageDegree: number;
    maxDegree: number;
    minDegree: number;
    clusteringCoefficient: number;
    connectedComponentsCount: number;
    largestComponentSize: number;
    isolatedNodesCount: number;
  };
  communities: {
    communityCount: number;
    modularity: number;
    largestCommunitySize: number;
    smallestCommunitySize: number;
    bridgeNodesCount: number;
    bridgeRatio: number;
  };
  features: {
    totalAttributedNodes: number;
    attributeCoverageRatio: number;
    sampleAttributes: Record<string, string>;
  };
}

export class GraphIntelligenceReport {
  /**
   * Generates comprehensive intelligence metrics from a CanonicalGraph.
   */
  public static generate(graph: CanonicalGraph): GraphIntelligenceData {
    const V = graph.nodes.size;
    const E = graph.edges.size;

    // 1. Density & Degree
    const density = V > 1 ? (2 * E) / (V * (V - 1)) : 0;
    let totalDeg = 0;
    let maxDeg = 0;
    let minDeg = V > 0 ? Infinity : 0;
    let isolatedCount = 0;

    for (const node of graph.nodes.values()) {
      const deg = node.degree;
      totalDeg += deg;
      if (deg > maxDeg) maxDeg = deg;
      if (deg < minDeg) minDeg = deg;
      if (deg === 0) isolatedCount++;
    }
    const avgDeg = V > 0 ? totalDeg / V : 0;

    // 2. Watts-Strogatz Global Clustering
    let clusteringSum = 0;
    let eligibleCount = 0;

    for (const neighbors of graph.adjacency.values()) {
      if (neighbors.size < 2) continue;
      const k = neighbors.size;
      const nList = Array.from(neighbors);
      let localTriangles = 0;

      for (let i = 0; i < nList.length; i++) {
        const uId = nList[i];
        const uNeighbors = graph.adjacency.get(uId);
        if (!uNeighbors) continue;

        for (let j = i + 1; j < nList.length; j++) {
          if (uNeighbors.has(nList[j])) {
            localTriangles++;
          }
        }
      }

      const possible = (k * (k - 1)) / 2;
      clusteringSum += localTriangles / possible;
      eligibleCount++;
    }

    const clusteringCoefficient = eligibleCount > 0 ? clusteringSum / eligibleCount : 0;

    // 3. Connected Components
    const visited = new Set<string>();
    let componentCount = 0;
    let largestComp = 0;

    for (const nodeId of graph.nodes.keys()) {
      if (visited.has(nodeId)) continue;
      componentCount++;
      let currentSize = 0;
      const queue: string[] = [nodeId];
      visited.add(nodeId);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        currentSize++;
        const neighbors = graph.adjacency.get(curr);
        if (neighbors) {
          for (const n of neighbors) {
            if (!visited.has(n)) {
              visited.add(n);
              queue.push(n);
            }
          }
        }
      }

      if (currentSize > largestComp) largestComp = currentSize;
    }

    // 4. Bridges and Communities
    let bridgeCount = 0;
    for (const node of graph.nodes.values()) {
      if (node.isBridge) bridgeCount++;
    }
    const bridgeRatio = V > 0 ? bridgeCount / V : 0;

    let largestComm = 0;
    let smallestComm = V > 0 ? Infinity : 0;

    for (const members of graph.communities.values()) {
      if (members.length > largestComm) largestComm = members.length;
      if (members.length < smallestComm) smallestComm = members.length;
    }

    // 5. Features
    let attributedCount = 0;
    const sampleAttributes: Record<string, string> = {};

    for (const node of graph.nodes.values()) {
      if (Object.keys(node.features).length > 0) {
        attributedCount++;
        if (Object.keys(sampleAttributes).length < 5) {
          Object.assign(sampleAttributes, node.features);
        }
      }
    }

    return {
      datasetId: graph.id,
      sourceDataset: graph.sourceDataset,
      generatedAt: new Date().toISOString(),
      structural: {
        totalNodes: V,
        totalEdges: E,
        density: Number(density.toFixed(6)),
        averageDegree: Number(avgDeg.toFixed(2)),
        maxDegree: maxDeg,
        minDegree: minDeg === Infinity ? 0 : minDeg,
        clusteringCoefficient: Number(clusteringCoefficient.toFixed(4)),
        connectedComponentsCount: componentCount,
        largestComponentSize: largestComp,
        isolatedNodesCount: isolatedCount,
      },
      communities: {
        communityCount: graph.communities.size,
        modularity: Number(graph.modularity.toFixed(4)),
        largestCommunitySize: largestComm,
        smallestCommunitySize: smallestComm === Infinity ? 0 : smallestComm,
        bridgeNodesCount: bridgeCount,
        bridgeRatio: Number(bridgeRatio.toFixed(4)),
      },
      features: {
        totalAttributedNodes: attributedCount,
        attributeCoverageRatio: V > 0 ? Number((attributedCount / V).toFixed(3)) : 0,
        sampleAttributes,
      },
    };
  }

  /**
   * Formats the intelligence data into clean JSON.
   */
  public static toJSON(data: GraphIntelligenceData): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Formats the intelligence data into an exhaustive, human-readable research Markdown report.
   */
  public static toMarkdown(data: GraphIntelligenceData): string {
    return `# Social Gravity — Graph Intelligence Report
**Dataset**: \`${data.datasetId}\`  
**Source**: \`${data.sourceDataset}\`  
**Analyzed**: ${data.generatedAt}

---

## 1. Executive Topology Overview

| Metric | Measured Value | Theoretical Interpretation |
| :--- | :--- | :--- |
| **Total Nodes ($|V|$)** | **${data.structural.totalNodes.toLocaleString()}** | Total autonomous actors in the communication network |
| **Total Edges ($|E|$)** | **${data.structural.totalEdges.toLocaleString()}** | Active dyadic interaction channels |
| **Graph Density ($\\rho$)** | **${data.structural.density}** | Fraction of all possible connections that exist ($2|E|/[|V|(|V|-1)]$) |
| **Average Degree ($\\langle k \\rangle$)** | **${data.structural.averageDegree}** | Mean connections per individual |
| **Degree Extrema** | Min: **${data.structural.minDegree}**, Max: **${data.structural.maxDegree}** | Range of reach between peripheral nodes and gravitational hubs |
| **Global Clustering ($C$)** | **${data.structural.clusteringCoefficient}** | Watts-Strogatz triadic closure (probability two neighbors are connected) |
| **Connected Components** | **${data.structural.connectedComponentsCount}** | Number of disjoint subgraphs (Largest Component: **${data.structural.largestComponentSize}** nodes) |

---

## 2. Community & Boundary Structure

* **Identified Communities / Circles**: **${data.communities.communityCount}**
* **Newman Modularity ($Q$)**: **${data.communities.modularity}**  
  *(Values $> 0.3$ reflect distinct, cohesive community clusters susceptible to echo-chamber reinforcement)*
* **Largest Community**: **${data.communities.largestCommunitySize}** individuals
* **Boundary Bridge Nodes**: **${data.communities.bridgeNodesCount}** (${(data.communities.bridgeRatio * 100).toFixed(1)}% of network)  
  *Bridge nodes span distinct communities and serve as the critical informational choke points for inter-community cascade transmission.*

---

## 3. Psychological & Attributed Feature Richness

* **Attributed Nodes**: **${data.features.totalAttributedNodes}** / **${data.structural.totalNodes}** (${(data.features.attributeCoverageRatio * 100).toFixed(1)}% coverage)
* **Sample Discovered Attributes**:
${Object.entries(data.features.sampleAttributes).map(([k, v]) => `  - \`${k}\`: ${v}`).join('\n')}

---

## 4. Operational Recommendations for Intervention Simulation

1. **Information Vector Containment**: Focus early inoculation or debunking counter-measures on the **${data.communities.bridgeNodesCount} bridge nodes** to prevent inter-community contagion.
2. **Influencer Quarantine**: Nodes approaching maximum degree ($k = ${data.structural.maxDegree}$) possess exponential gravitational pull; monitor their belief status closely.
`;
  }
}
