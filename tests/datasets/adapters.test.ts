/**
 * Social Gravity - Dataset Ingestion Subsystem Unit Tests
 */

import { SnapDatasetAdapter } from '../../src/datasets/adapters/snapAdapter';
import { WikipediaHoaxAdapter } from '../../src/datasets/adapters/wikipediaHoaxAdapter';
import { SNAP_FACEBOOK_EDGES_FIXTURE, SNAP_FACEBOOK_CIRCLES_FIXTURE } from '../../src/datasets/fixtures/snapFacebookFixture';
import { WIKIPEDIA_HOAX_FIXTURES } from '../../src/datasets/fixtures/wikipediaHoaxFixture';
import { SocietyValidator } from '../../src/society/validation/societyValidator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testDatasetAdapters() {
  console.log('--- Testing Dataset Ingestion Adapters ---');

  // 1. Test SNAP Facebook Dataset Parsing
  const snapResult = SnapDatasetAdapter.parse({
    edgesText: SNAP_FACEBOOK_EDGES_FIXTURE,
    circlesText: SNAP_FACEBOOK_CIRCLES_FIXTURE,
    datasetName: 'Stanford SNAP Facebook Ego-Net Sample',
    defaultTrust: 0.6,
    defaultConformity: 0.55
  });

  assert(snapResult.success, 'SNAP parsing should succeed');
  assert(snapResult.data.agents.length === 60, `Expected 60 agents, found ${snapResult.data.agents.length}`);
  assert(snapResult.data.edges.length > 50, `Expected >50 edges, found ${snapResult.data.edges.length}`);
  assert(snapResult.data.communities.length >= 3, `Expected >=3 communities, found ${snapResult.data.communities.length}`);
  assert(snapResult.data.summary.influencerCount > 0, 'Should detect at least 1 influencer hub');
  assert(snapResult.data.summary.bridgeNodeCount > 0, 'Should detect bridge nodes');

  // Verify that SNAP parsed Society passes 100% of SocietyValidator structural invariants!
  const validationReport = SocietyValidator.validate(snapResult.data);
  assert(validationReport.isValid, `SNAP parsed society must pass validation: ${JSON.stringify(validationReport.errors)}`);
  console.log(`  ✓ SNAP Facebook dataset parsed & validated (${snapResult.data.agents.length} nodes, ${snapResult.data.edges.length} edges, ${snapResult.data.communities.length} circles) in ${snapResult.parseTimeMs}ms`);

  // 2. Test Node Truncation Option
  const truncatedResult = SnapDatasetAdapter.parse({
    edgesText: SNAP_FACEBOOK_EDGES_FIXTURE,
    maxNodes: 25
  }, { maxNodes: 25 });
  assert(truncatedResult.data.agents.length === 25, `Truncated dataset should have 25 agents, found ${truncatedResult.data.agents.length}`);
  assert(truncatedResult.warnings.length > 0, 'Should have truncation warning');
  console.log('  ✓ SNAP truncation filter verified');

  // 3. Test Wikipedia Hoax Adapter
  const hoaxBatch = WikipediaHoaxAdapter.parseRecords(WIKIPEDIA_HOAX_FIXTURES);
  assert(hoaxBatch.success, 'Wikipedia hoax batch parse should succeed');
  assert(hoaxBatch.data.length === WIKIPEDIA_HOAX_FIXTURES.length, 'All hoax fixtures should parse');

  const sampleHoax = hoaxBatch.data[0];
  const signal = WikipediaHoaxAdapter.toSignal(sampleHoax, 'node_0', 0);
  assert(signal.veracity === 'false', 'Bicholim hoax veracity should be "false"');
  assert(signal.emotionalSalience === 0.40, 'Fear salience should match fixture');
  assert(signal.senderId === 'node_0', 'Source agent ID should match');

  const debunkSignal = WikipediaHoaxAdapter.createDebunkingSignal(sampleHoax, 'debunker_1', 4);
  assert(debunkSignal.veracity === 'true', 'Debunking veracity should be "true"');
  assert(debunkSignal.round === 4, 'Debunking round should match 4');
  console.log(`  ✓ Wikipedia Hoax adapter verified (${hoaxBatch.data.length} records parsed, debunking signal generated)`);

  console.log('✓ Dataset ingestion tests passed successfully.');
}
