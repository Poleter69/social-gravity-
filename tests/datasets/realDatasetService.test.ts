/**
 * Social Gravity - Real Dataset Service & V2->V1 Integration Test Suite
 */

import { RealDatasetService } from '../../src/datasets/realDatasetService';
import { RumorEngine } from '../../src/simulation/rumorEngine';
import { WikipediaHoaxAdapter } from '../../src/datasets/adapters/wikipediaHoaxAdapter';
import { WIKIPEDIA_HOAX_FIXTURES } from '../../src/datasets/fixtures/wikipediaHoaxFixture';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function testRealDatasetIntegration() {
  console.log('--- Testing Real Dataset Service (V2 -> V1 Integration) ---');

  // 1. Available datasets census
  const datasets = RealDatasetService.getAvailableDatasets();
  assert(datasets.length >= 3, `Expected at least 3 available real datasets, got ${datasets.length}`);
  assert(datasets.some(d => d.id === 'reddit_tech'), 'reddit_tech dataset must be available');
  assert(datasets.some(d => d.id === 'facebook_ego_0'), 'facebook_ego_0 dataset must be available');
  console.log(`  ✓ Available real dataset catalog verified (${datasets.length} options)`);

  // 2. Load Reddit Discussion Tree into V1 Society
  const redditResult = await RealDatasetService.loadPreconfiguredDataset('reddit_tech');
  assert(redditResult.society.agents.length >= 6, `Expected >=6 agents in Reddit society, got ${redditResult.society.agents.length}`);
  assert(redditResult.society.edges.length >= 6, `Expected >=6 edges in Reddit society, got ${redditResult.society.edges.length}`);
  assert(redditResult.v2Metrics.density > 0, 'Density must be > 0');
  assert(redditResult.canonicalGraph.modularity >= 0, 'Modularity Q must be >= 0');
  console.log(`  ✓ Reddit discussion tree converted to V1 Society (${redditResult.society.agents.length} nodes, ${redditResult.society.edges.length} edges)`);

  // 3. Load SNAP Facebook Ego into V1 Society
  const fbResult = await RealDatasetService.loadPreconfiguredDataset('facebook_ego_0');
  assert(fbResult.society.agents.length === 60, `Expected 60 nodes in SNAP Ego 0 sample, got ${fbResult.society.agents.length}`);
  assert(fbResult.society.edges.length === 154, `Expected 154 edges in SNAP Ego 0 sample, got ${fbResult.society.edges.length}`);
  assert(fbResult.society.summary.bridgeNodeCount > 0, 'Must identify bridge nodes in Facebook ego');
  console.log(`  ✓ SNAP Facebook Ego #0 converted to V1 Society (${fbResult.society.agents.length} nodes, ${fbResult.society.edges.length} edges)`);

  // 4. Custom File Upload Ingestion (.edges text)
  const customEdges = `
    Alice Bob 0.8
    Bob Charlie 0.6
    Charlie Alice 0.9
    Charlie David 0.4
  `;
  const uploadResult = await RealDatasetService.parseUploadedFile('custom_team.edges', customEdges);
  assert(uploadResult.society.agents.length === 4, `Expected 4 nodes, got ${uploadResult.society.agents.length}`);
  assert(uploadResult.society.edges.length === 4, `Expected 4 edges, got ${uploadResult.society.edges.length}`);
  assert(uploadResult.validationReport.validRecordsCount >= 4, 'Uploaded records must be validated');
  console.log(`  ✓ Custom .edges text file parsed & validated dynamically (${uploadResult.society.agents.length} nodes, ${uploadResult.society.edges.length} edges)`);

  // 5. Downstream Simulation Execution on Real Graph
  const engine = new RumorEngine(redditResult.society, { maxRounds: 10 });
  const seedId = redditResult.society.agents[0].id;
  const signal = WikipediaHoaxAdapter.toSignal(WIKIPEDIA_HOAX_FIXTURES[0], seedId, 0);

  engine.start(signal, [seedId]);
  const step1 = engine.step();
  const step2 = engine.step();

  assert(step2.currentRound === 2, `Expected round 2, got ${step2.currentRound}`);
  assert(step2.agentStates.size > 0, 'Agent states must be updated in simulation');
  console.log(`  ✓ RumorEngine successfully simulated 2 rounds on real Reddit graph (Round: ${step2.currentRound})`);
}
