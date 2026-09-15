/**
 * Social Gravity V2 - Dataset Validator Unit Tests
 *
 * Validates detection of self-loops, malformed rows, duplicate edges,
 * timestamp boundaries, and comprehensive report generation.
 */

import { DatasetValidator } from '../../src/ingestion/validators/datasetValidator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testDatasetValidator() {
  console.log('--- Testing Dataset Validator & Reporting ---');

  const validator = new DatasetValidator();

  // Test 1: Valid Edge
  const v1 = validator.validateEdgeRow(1, 'node_a', 'node_b');
  assert(v1 === true, 'Valid edge row should pass validation');

  // Test 2: Self-Loop Detection
  const v2 = validator.validateEdgeRow(2, 'node_c', 'node_c');
  assert(v2 === false, 'Self-loop must be rejected');

  // Test 3: Missing Target Token
  const v3 = validator.validateEdgeRow(3, 'node_d', '');
  assert(v3 === false, 'Empty target must be rejected as malformed');

  // Test 4: Duplicate Edge Detection
  const v4 = validator.validateEdgeRow(4, 'node_b', 'node_a');
  assert(v4 === true, 'Duplicate edge should be accounted for without throwing');

  // Test 5: Interaction Validation (Invalid Timestamp)
  const i1 = validator.validateInteraction(5, {
    source: 'user_1',
    target: 'user_2',
    timestamp: -500,
    weight: 0.5,
  });
  assert(i1 === false, 'Negative timestamp must be rejected');

  // Test 6: Report Generation
  const report = validator.buildReport('Synthetic_Test_Dataset');
  assert(report.totalRecordsProcessed === 5, `Expected 5 processed records, got ${report.totalRecordsProcessed}`);
  assert(report.selfLoopCount === 1, `Expected 1 self-loop, got ${report.selfLoopCount}`);
  assert(report.duplicateCount === 1, `Expected 1 duplicate, got ${report.duplicateCount}`);
  assert(report.issues.length >= 3, 'Report should contain detailed logged issues');

  console.log('✓ Dataset Validator and Report generation validated.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('validation.test.ts')) {
  testDatasetValidator();
}
