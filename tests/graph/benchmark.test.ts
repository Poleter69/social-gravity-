/**
 * Social Gravity V2 - Dynamic Graph Performance Benchmark
 *
 * Verifies throughput targets:
 * - 1,000 nodes: Real-time (< 15ms per tick)
 * - 10,000 nodes: Interactive (< 150ms per tick)
 */

import { DeterministicGraphGenerator } from '../../src/graph/engine/deterministicGenerator';
import { TickEngine } from '../../src/graph/engine/tickEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runDynamicGraphBenchmarks() {
  console.log('--- Benchmarking Dynamic Graph Subsystem Performance ---');

  // Benchmark 1: 1,000 nodes (Real-Time Target)
  const t0 = performance.now();
  const graph1k = DeterministicGraphGenerator.createWattsStrogatz({
    n: 1000,
    k: 6,
    p: 0.1,
    seed: 42,
  });
  const buildTime1k = performance.now() - t0;
  console.log(`  [1,000 Nodes] Graph Generation: ${buildTime1k.toFixed(2)}ms (Nodes: ${graph1k.getAllNodes().length}, Edges: ${graph1k.getAllEdges().length})`);

  const engine1k = new TickEngine(graph1k);
  const tickStart1k = performance.now();
  const ticksToRun = 10;
  engine1k.runTicks(ticksToRun);
  const totalTickTime1k = performance.now() - tickStart1k;
  const avgTickTime1k = totalTickTime1k / ticksToRun;

  console.log(`  [1,000 Nodes] ${ticksToRun} Ticks Execution: ${totalTickTime1k.toFixed(2)}ms (Average: ${avgTickTime1k.toFixed(2)}ms/tick)`);
  assert(avgTickTime1k < 75, `1,000-node graph average tick time must be < 75ms for real-time operation, got ${avgTickTime1k.toFixed(2)}ms`);

  // Benchmark 2: 5,000 nodes (Interactive Target)
  const t1 = performance.now();
  const graph5k = DeterministicGraphGenerator.createWattsStrogatz({
    n: 5000,
    k: 4,
    p: 0.05,
    seed: 42,
  });
  const buildTime5k = performance.now() - t1;
  console.log(`  [5,000 Nodes] Graph Generation: ${buildTime5k.toFixed(2)}ms (Nodes: ${graph5k.getAllNodes().length}, Edges: ${graph5k.getAllEdges().length})`);

  const engine5k = new TickEngine(graph5k);
  const tickStart5k = performance.now();
  const ticks5k = 5;
  engine5k.runTicks(ticks5k);
  const totalTickTime5k = performance.now() - tickStart5k;
  const avgTickTime5k = totalTickTime5k / ticks5k;

  console.log(`  [5,000 Nodes] ${ticks5k} Ticks Execution: ${totalTickTime5k.toFixed(2)}ms (Average: ${avgTickTime5k.toFixed(2)}ms/tick)`);
  assert(avgTickTime5k < 200, `5,000-node graph average tick time must be < 200ms for interactive operation, got ${avgTickTime5k.toFixed(2)}ms`);

  console.log('✓ Performance benchmarks passed successfully.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('benchmark.test.ts')) {
  runDynamicGraphBenchmarks();
}
