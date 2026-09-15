/**
 * Social Gravity - Graph Learning & Node2Vec Tests (Milestone M2)
 */

import { Node2VecEngine, cosineSimilarity } from '../../src/graphLearning/node2vec';
import { HybridDiffusionPredictor } from '../../src/graphLearning/hybridPredictor';
import { societyGenerator } from '../../src/society/generators/societyGenerator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testGraphLearning() {
  console.log('--- Testing Milestone M2: Graph Learning & Node2Vec Embeddings ---');

  const society = societyGenerator.generate({
    name: 'Graph Learning Test Society',
    archetype: 'online_community',
    populationSize: 60,
    seed: 42,
  });

  // 1. Train Node2Vec
  console.log('  Training on-device Node2Vec (d=16, 4 epochs)...');
  const engine = new Node2VecEngine({
    dimensions: 16,
    walkLength: 6,
    numWalks: 4,
    epochs: 3,
  });

  const res = engine.train(society, 12345);

  assert(res.modelType === 'node2vec', 'Model type must be node2vec');
  assert(res.dimensions === 16, 'Dimensions must be 16');
  assert(res.embeddings.size === society.agents.length, 'All agents must receive embedding');
  assert(res.trainingTimeMs < 1000, 'Training must complete within 1 second on 60 nodes');

  // Verify L2 normalization
  const sampleEmb = res.embeddings.get(society.agents[0].id);
  assert(sampleEmb !== undefined, 'Sample agent embedding must exist');
  const normSq = sampleEmb!.reduce((acc, v) => acc + v * v, 0);
  assert(Math.abs(normSq - 1.0) < 1e-3, `Embedding must be L2 normalized (got ${normSq})`);
  console.log(`  ✓ Node2Vec training verified (${res.embeddings.size} nodes in ${res.trainingTimeMs}ms)`);

  // 2. Test Cosine Similarity
  const emb1 = res.embeddings.get(society.agents[0].id)!;
  const emb2 = res.embeddings.get(society.agents[1].id)!;
  const simSelf = cosineSimilarity(emb1, emb1);
  assert(Math.abs(simSelf - 1.0) < 1e-3, 'Self-similarity must be 1.0');
  const simPair = cosineSimilarity(emb1, emb2);
  assert(simPair >= -1.0 && simPair <= 1.0, 'Pairwise similarity must be bounded in [-1, 1]');
  console.log(`  ✓ Cosine metric verified (Self=1.00, Pair=${simPair.toFixed(3)})`);

  // 3. Test Hybrid Benchmark Execution
  console.log('  Running comparative benchmark against rule-based engine...');
  const bench = HybridDiffusionPredictor.runBenchmark(society);
  assert(bench.ruleBasedAccuracy > 0, 'Rule based accuracy must be positive');
  assert(bench.hybridAccuracy > 0, 'Hybrid accuracy must be positive');
  assert(bench.clusteringPurity >= 0.5, 'Clustering purity must reflect network modularity');
  assert(bench.recommendation.length > 0, 'Recommendation string must be present');
  console.log(`  ✓ Benchmark Results: Rule Accuracy=${bench.ruleBasedAccuracy}, Hybrid Accuracy=${bench.hybridAccuracy} (${bench.improvementPercentage > 0 ? '+' : ''}${bench.improvementPercentage}%)`);
  console.log(`  ✓ Recommendation: "${bench.recommendation}"`);

  console.log('✓ Graph Learning Upgrade validated successfully.\n');
}
