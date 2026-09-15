/**
 * Social Gravity V2 - Dynamic Graph Metrics Unit Tests
 *
 * Validates dynamic metrics against known analytical graph topologies:
 * - Triangle (K3)
 * - Star network (S4)
 * - Disconnected components
 * - Cross-community bridge ratio
 */

import { DynamicGraph } from '../../src/graph/engine/dynamicGraph';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testDynamicMetrics() {
  console.log('--- Testing Dynamic Network Metrics Engine ---');

  // Test 1: Complete Triangle Graph K3
  const triangle = new DynamicGraph(1);
  triangle.addNode({ id: 'a', communityId: 'comm_0' });
  triangle.addNode({ id: 'b', communityId: 'comm_0' });
  triangle.addNode({ id: 'c', communityId: 'comm_0' });

  triangle.addEdge({ source: 'a', target: 'b', weight: 0.8 });
  triangle.addEdge({ source: 'b', target: 'c', weight: 0.8 });
  triangle.addEdge({ source: 'a', target: 'c', weight: 0.8 });

  const mTriangle = triangle.getMetrics();
  assert(mTriangle.totalNodes === 3, 'K3 nodes must be 3');
  assert(mTriangle.totalEdges === 3, 'K3 edges must be 3');
  assert(mTriangle.density === 1.0, `K3 density must be 1.0, got ${mTriangle.density}`);
  assert(
    mTriangle.globalClusteringCoefficient === 1.0,
    `K3 clustering coefficient must be 1.0, got ${mTriangle.globalClusteringCoefficient}`
  );
  assert(mTriangle.componentCount === 1, 'K3 component count must be 1');
  assert(mTriangle.largestComponentSize === 3, 'K3 largest component must be 3');
  assert(mTriangle.bridgeRatio === 0.0, 'K3 bridge ratio must be 0.0 for intra-community');

  // Test 2: Star Network S4 (1 center, 3 leaves)
  const star = new DynamicGraph(2);
  star.addNode({ id: 'center', communityId: 'comm_0' });
  star.addNode({ id: 'leaf_1', communityId: 'comm_0' });
  star.addNode({ id: 'leaf_2', communityId: 'comm_0' });
  star.addNode({ id: 'leaf_3', communityId: 'comm_0' });

  star.addEdge({ source: 'center', target: 'leaf_1', weight: 0.7 });
  star.addEdge({ source: 'center', target: 'leaf_2', weight: 0.7 });
  star.addEdge({ source: 'center', target: 'leaf_3', weight: 0.7 });

  const mStar = star.getMetrics();
  assert(mStar.totalNodes === 4, 'S4 nodes must be 4');
  assert(mStar.totalEdges === 3, 'S4 edges must be 3');
  assert(
    mStar.globalClusteringCoefficient === 0.0,
    `Star graph clustering must be 0.0, got ${mStar.globalClusteringCoefficient}`
  );
  assert(mStar.averageDegree === 1.5, `S4 average degree must be 1.5, got ${mStar.averageDegree}`);

  // Test 3: Disconnected Components & Cross-Community Bridge
  const bridgeGraph = new DynamicGraph(3);
  bridgeGraph.addNode({ id: 'c1_n1', communityId: 'comm_A' });
  bridgeGraph.addNode({ id: 'c1_n2', communityId: 'comm_A' });
  bridgeGraph.addNode({ id: 'c2_n1', communityId: 'comm_B' });
  bridgeGraph.addNode({ id: 'c2_n2', communityId: 'comm_B' });
  bridgeGraph.addNode({ id: 'isolated', communityId: 'comm_C' });

  bridgeGraph.addEdge({ source: 'c1_n1', target: 'c1_n2', weight: 0.7 }); // Peer
  bridgeGraph.addEdge({ source: 'c2_n1', target: 'c2_n2', weight: 0.7 }); // Peer
  bridgeGraph.addEdge({ source: 'c1_n2', target: 'c2_n1', weight: 0.6 }); // Bridge!

  const mBridge = bridgeGraph.getMetrics();
  // We have 2 connected nodes in comm A, 2 in comm B, connected via bridge => 1 component of size 4 + 1 isolated => 2 components
  assert(mBridge.componentCount === 2, `Expected 2 components, got ${mBridge.componentCount}`);
  assert(mBridge.largestComponentSize === 4, `Expected largest component size 4, got ${mBridge.largestComponentSize}`);
  assert(
    Math.abs(mBridge.bridgeRatio - 1 / 3) < 0.001,
    `Expected bridge ratio ~ 0.333, got ${mBridge.bridgeRatio}`
  );

  console.log('✓ Dynamic network metrics engine validated against analytical topologies.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('metrics.test.ts')) {
  testDynamicMetrics();
}
