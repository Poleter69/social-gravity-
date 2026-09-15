/**
 * Social Gravity — Predictive Forecast Validation Benchmark
 * Executes Monte Carlo runs across heterogeneous archetypes and verifies prediction calibration.
 */

import { societyGenerator } from '../../src/society/generators/societyGenerator';
import { SocietyArchetype } from '../../src/society/types/community';
import { InformationSignal } from '../../src/psychology/types';
import { EmotionEngine } from '../../src/nlp/emotionEngine';
import { PredictionEvaluator, MetricSummary } from '../../src/benchmarks/predictionEvaluator';

export async function runPredictionBenchmark(): Promise<MetricSummary> {
  const evaluator = new PredictionEvaluator();
  const emotionEngine = EmotionEngine.getInstance();
  const results = [];

  const archetypes: SocietyArchetype[] = ['school', 'workplace', 'online_community', 'city'];
  const testTopics = [
    { title: 'Emergency evacuation alert', emotion: 'Urgent panic: hazardous fire leak spreading' },
    { title: 'Celebrity breakup gossip', emotion: 'Amusing scandalous gossip about famous actor' },
    { title: 'Cybersecurity zero-day exploit', emotion: 'Critical security alert: patch banking app immediately' },
    { title: 'Scientific breakthrough in fusion', emotion: 'Fascinating scientific breakthrough solves clean power' },
    { title: 'Local municipal transit delay', emotion: 'Mild annoyance: subway line closed for maintenance' },
  ];

  let runIndex = 0;
  for (const arch of archetypes) {
    for (const t of testTopics) {
      runIndex++;
      const soc = societyGenerator.generate({
        name: `Benchmark-${arch}-${runIndex}`,
        archetype: arch,
        populationSize: 50,
        seed: 1000 + runIndex,
      });

      const prof = emotionEngine.predictSync(t.emotion);
      const signal: InformationSignal = {
        id: `bench-sig-${runIndex}`,
        topic: t.title,
        content: t.emotion,
        veracity: 'false',
        emotionalSalience: prof.intensity,
        complexity: 0.45,
        senderId: soc.agents[0].id,
        round: 0,
        emotionProfile: prof,
      };

      const res = evaluator.evaluateRun(soc, signal, soc.agents[0].id, 2, 6);
      results.push(res);
    }
  }

  const metrics = evaluator.computeMetrics(results);
  return metrics;
}
