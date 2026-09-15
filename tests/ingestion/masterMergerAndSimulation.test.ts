/**
 * Social Gravity V2 - Master Merger & Simulation Interoperability Integration Tests
 *
 * Verifies end-to-end integration:
 * - Ingestion of real SNAP Facebook files from Databases/facebook/
 * - Conversion of CanonicalGraph into living V2 DynamicGraph
 * - Conversion of CanonicalGraph into V1 Society and rumor diffusion
 * - Master Graph multi-ego merging & inter-ego bridge detection
 * - Graph Intelligence Report generation
 */

import * as path from 'path';
import { TickEngine } from '../../src/graph/engine/tickEngine';
import { FileDatasetLoader } from '../../src/ingestion/loaders/fileLoader';
import { MasterFacebookMerger } from '../../src/ingestion/parsers/facebook/masterFacebookMerger';
import { GraphIntelligenceReport } from '../../src/ingestion/reports/graphIntelligenceReport';
import { CanonicalGraphBuilder } from '../../src/ingestion/transformers/canonicalGraphBuilder';
import { RumorEngine } from '../../src/simulation/rumorEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testMasterMergerAndSimulation() {
  console.log('--- Testing Ingestion Pipeline, Master Merger & Simulator Interop ---');

  const fbDir = path.resolve(process.cwd(), 'Databases', 'facebook');

  // Test 1: Real-World Ingestion of SNAP Facebook Ego 0
  const ego0Result = FileDatasetLoader.loadFacebookEgo(fbDir, '0');
  const graph0 = ego0Result.graph;

  assert(graph0.nodes.size === 348, `Expected 348 nodes in Ego 0, got ${graph0.nodes.size}`);
  assert(graph0.edges.size === 2866, `Expected 2866 edges in Ego 0, got ${graph0.edges.size}`);
  assert(graph0.communities.size === 24, `Expected 24 social circles, got ${graph0.communities.size}`);
  assert(ego0Result.validationReport.passed, 'Validation report must pass');
  assert(
    (ego0Result.taxonomy?.totalFeatures || 0) > 200,
    `Expected > 200 feature definitions, got ${ego0Result.taxonomy?.totalFeatures}`
  );

  // Test 2: Downstream Conversion to V2 DynamicGraph & Living Simulation
  const dynamicGraph = CanonicalGraphBuilder.toDynamicGraph(graph0);
  assert(dynamicGraph.getAllNodes().length === 348, 'DynamicGraph must have 348 nodes');
  assert(dynamicGraph.getAllEdges().length === 2866, 'DynamicGraph must have 2866 edges');

  const tickEngine = new TickEngine(dynamicGraph);
  const tickResult = tickEngine.tick();
  assert(tickResult.tick === 1, 'Tick must advance to 1');
  assert(tickResult.metrics.totalNodes === 348, 'Metrics must report 348 nodes');
  assert(tickResult.decayEventsCount > 0, 'Inactive edges should experience temporal decay');

  // Test 3: Downstream Conversion to V1 Society & Rumor Diffusion
  const society = CanonicalGraphBuilder.toSociety(graph0);
  assert(society.agents.length === 348, 'Society must contain 348 agents');
  assert(society.communities.length === 24, 'Society must contain 24 communities');

  const rumorEngine = new RumorEngine(society);
  // Seed rumor on the first high-influence node
  const seedNode = society.agents.find(a => a.traits.influence > 0.8) || society.agents[0];
  rumorEngine.start(
    {
      id: 'sig_test_1',
      topic: 'infrastructure_security',
      content: 'Critical vulnerability detected in core router topology.',
      veracity: 'unverified',
      emotionalSalience: 0.85,
      complexity: 0.4,
      senderId: seedNode.id,
      round: 0,
    },
    [seedNode.id]
  );

  // Step 3 rounds of diffusion
  const state1 = rumorEngine.step();
  const state2 = rumorEngine.step();
  const state3 = rumorEngine.step();

  assert(state3.currentRound === 3, 'RumorEngine must reach round 3');
  assert(
    state3.telemetryHistory.length >= 3,
    'RumorEngine must record telemetry history across diffusion rounds'
  );

  // Test 4: Master Facebook Merger (Ego 0 + Ego 348 + Ego 414 + Ego 698)
  const ego348 = FileDatasetLoader.loadFacebookEgo(fbDir, '348').graph;
  const ego414 = FileDatasetLoader.loadFacebookEgo(fbDir, '414').graph;
  const ego698 = FileDatasetLoader.loadFacebookEgo(fbDir, '698').graph;

  const mergeResult = MasterFacebookMerger.merge([graph0, ego348, ego414, ego698]);
  assert(mergeResult.egoNetworksMerged === 4, 'Must merge 4 ego networks');
  assert(mergeResult.totalUniqueNodes > 348, 'Merged nodes must exceed single ego count');
  assert(mergeResult.interEgoBridgesCount >= 4, 'Must detect inter-ego bridge nodes');

  // Test 5: Graph Intelligence Report Generation
  const reportData = GraphIntelligenceReport.generate(graph0);
  assert(reportData.structural.totalNodes === 348, 'Report total nodes match');
  assert(reportData.structural.connectedComponentsCount === 1, 'Ego 0 must be 1 connected component');
  assert(reportData.structural.clusteringCoefficient > 0.5, 'Facebook ego network exhibits high clustering');

  const mdReport = GraphIntelligenceReport.toMarkdown(reportData);
  assert(mdReport.includes('Social Gravity — Graph Intelligence Report'), 'Markdown report must have header');
  assert(mdReport.includes('Watts-Strogatz triadic closure'), 'Markdown report must include theoretical explanation');

  const jsonReport = GraphIntelligenceReport.toJSON(reportData);
  assert(jsonReport.startsWith('{'), 'JSON report must be valid JSON');

  console.log('✓ Master merger, simulator interop, and intelligence report validated.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('masterMergerAndSimulation.test.ts')) {
  testMasterMergerAndSimulation();
}
