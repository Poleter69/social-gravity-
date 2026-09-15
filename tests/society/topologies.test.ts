/**
 * Unit Tests - Network Topology Generators
 */

import { PRNG } from '../../src/society/math/random';
import { generateWattsStrogatz } from '../../src/society/topologies/smallWorld';
import { generateBarabasiAlbert } from '../../src/society/topologies/scaleFree';
import { generateClusteredTopology } from '../../src/society/topologies/clustered';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testTopologies() {
  console.log('--- Testing Network Topology Generators ---');
  const rng = new PRNG(101);

  // Test 1: Watts-Strogatz small-world
  const wsNodes = Array.from({ length: 50 }, (_, i) => `node-${i}`);
  const wsEdges = generateWattsStrogatz({
    nodeIds: wsNodes,
    k: 4,
    beta: 0.1,
    rng,
  });
  assert(wsEdges.length > 0, 'Watts-Strogatz must produce edges');
  // Check no self-loops
  for (const e of wsEdges) {
    assert(e.source !== e.target, `Self-loop detected: ${e.source}`);
  }

  // Test 2: Barabási-Albert scale-free preferential attachment
  const baNodes = Array.from({ length: 100 }, (_, i) => `node-${i}`);
  const baEdges = generateBarabasiAlbert({
    nodeIds: baNodes,
    m0: 4,
    m: 2,
    rng,
  });
  assert(baEdges.length > 0, 'Barabasi-Albert must produce edges');

  // Compute degree map to verify preferential attachment produces hubs
  const degMap = new Map<string, number>();
  for (const e of baEdges) {
    degMap.set(e.source, (degMap.get(e.source) || 0) + 1);
    degMap.set(e.target, (degMap.get(e.target) || 0) + 1);
  }
  const degrees = Array.from(degMap.values());
  const maxDegree = Math.max(...degrees);
  const minDegree = Math.min(...degrees);
  assert(maxDegree >= 8, `Scale-free network must exhibit hub nodes (max degree: ${maxDegree})`);
  assert(minDegree >= 1, `All nodes should be connected (min degree: ${minDegree})`);

  // Test 3: Clustered Community Topology
  const commMap = new Map<string, string[]>();
  commMap.set('c1', ['n1', 'n2', 'n3', 'n4']);
  commMap.set('c2', ['n5', 'n6', 'n7', 'n8']);

  const clusteredEdges = generateClusteredTopology({
    communityNodeMap: commMap,
    pInternal: 0.5,
    pExternal: 0.1,
    rng,
  });

  assert(clusteredEdges.length >= 6, 'Clustered topology must produce internal and bridge edges');
  const hasBridge = clusteredEdges.some((e) => e.type === 'bridge');
  assert(hasBridge, 'Clustered topology must produce at least one bridge edge between communities');

  console.log('✓ Topology generator tests passed successfully.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('topologies.test.ts')) {
  testTopologies();
}
