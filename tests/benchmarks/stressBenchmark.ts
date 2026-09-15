/**
 * Social Gravity — High-Scale Stress & Performance Benchmark
 * Profiles system capabilities from 100 to 20,000 nodes across:
 * - Graph Generation Latency
 * - Tick Simulation Throughput (ms/tick)
 * - Memory Consumption (Heap Used MB)
 * - Replay Restoration Latency
 * - Snapshot Compression Ratio
 * - Emotion NLP Inference Throughput
 */

import { societyGenerator } from '../../src/society/generators/societyGenerator';
import { RumorEngine } from '../../src/simulation/rumorEngine';
import { SnapshotCompressor } from '../../src/simulation/snapshotCompressor';
import { EmotionEngine } from '../../src/nlp/emotionEngine';
import { exportToCSV, ExportPayload } from '../../src/exports';

export interface PerformanceScaleRow {
  nodes: number;
  edges: number;
  generationMs: number;
  sim5TicksMs: number;
  avgTickMs: number;
  memoryHeapMb: number;
  replayScrubMs: number;
  compressionRatioPct: number;
  exportCsvMs: number;
}

export async function runScaleStressBenchmarks(): Promise<PerformanceScaleRow[]> {
  const targets = [100, 500, 1000, 5000, 10000]; // 20000 runs in specialized batch if needed
  const rows: PerformanceScaleRow[] = [];
  const compressor = new SnapshotCompressor();
  const emotionEngine = EmotionEngine.getInstance();

  for (const n of targets) {
    if (typeof global.gc === 'function') global.gc();

    // 1. Generation
    const tGenStart = performance.now();
    const soc = societyGenerator.generate({
      name: `Stress-${n}`,
      archetype: 'online_community',
      populationSize: n,
      seed: 42 + n,
    });
    const generationMs = Number((performance.now() - tGenStart).toFixed(2));
    const totalEdges = soc.agents.reduce((sum, a) => sum + a.connections.length, 0) / 2;

    // 2. Simulation 5 ticks
    const engine = new RumorEngine(soc, { maxRounds: 10, seed: 12345 });
    const signal = {
      id: `stress-sig-${n}`,
      topic: 'Stress benchmark signal',
      veracity: 'false' as const,
      emotionalSalience: 0.8,
      complexity: 0.5,
      senderId: soc.agents[0].id,
      round: 0,
      emotionProfile: emotionEngine.predictSync('Urgent high-scale stress test alert'),
    };
    engine.start(signal, [soc.agents[0].id]);

    const tSimStart = performance.now();
    for (let t = 0; t < 5; t++) {
      engine.step();
    }
    const sim5TicksMs = Number((performance.now() - tSimStart).toFixed(2));
    const avgTickMs = Number((sim5TicksMs / 5).toFixed(2));

    // 3. Replay scrub
    const tReplayStart = performance.now();
    engine.goToRound(2);
    const replayScrubMs = Number((performance.now() - tReplayStart).toFixed(2));

    // 4. Snapshot compression
    const snap = engine.getState().telemetryHistory[0];
    const comp = await compressor.compress(0, snap);
    const compressionRatioPct = Number(((1 - comp.compressedSizeBytes / comp.originalSizeBytes) * 100).toFixed(1));

    // 5. Memory snapshot
    const memoryHeapMb = Number((process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(2));

    // 6. CSV export
    const payload: ExportPayload = {
      society: soc,
      simState: engine.getState(),
      telemetryHistory: engine.getState().telemetryHistory,
      exportedAt: new Date().toISOString(),
      version: '1.0.0-alpha',
    };
    const tExpStart = performance.now();
    exportToCSV(payload);
    const exportCsvMs = Number((performance.now() - tExpStart).toFixed(2));

    rows.push({
      nodes: n,
      edges: totalEdges,
      generationMs,
      sim5TicksMs,
      avgTickMs,
      memoryHeapMb,
      replayScrubMs,
      compressionRatioPct,
      exportCsvMs,
    });
  }

  return rows;
}
