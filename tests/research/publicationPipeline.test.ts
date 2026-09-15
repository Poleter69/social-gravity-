/**
 * Social Gravity - Research Publication Pipeline Tests (Milestone M8)
 */

import { PublicationPipeline } from '../../src/research/publicationPipeline';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testPublicationPipeline() {
  console.log('--- Testing Milestone M8: Research Publication Pipeline ---');

  // 1. Test Reproducibility Manifest
  console.log('  Generating automated reproducibility manifest...');
  const manifest = PublicationPipeline.generateManifest('2.0.0-beta');
  assert(manifest.manifestId.startsWith('manifest-'), 'Manifest ID must be valid');
  assert(manifest.engineVersion === '2.0.0-beta', 'Engine version must match');
  assert(manifest.prngSpecification.algorithm === 'SplitMix32', 'PRNG must be SplitMix32');
  assert(manifest.prngSpecification.deterministicSeeds.length > 0, 'Must record deterministic seeds');
  assert(manifest.datasetChecksums['snap_facebook_ego_0'].length > 0, 'Must record dataset checksums');
  assert(manifest.experimentVerificationExitCode === 0, 'Verification code must be 0');
  console.log(`  ✓ Reproducibility Manifest Generated: ${manifest.manifestId} [PRNG: ${manifest.prngSpecification.algorithm}]`);

  // 2. Test Prediction LaTeX Table
  console.log('  Generating publication LaTeX tables (ICWSM / AAAI style)...');
  const predTable = PublicationPipeline.generatePredictionLatexTable();
  assert(predTable.latexCode.includes('\\begin{table}'), 'Must include LaTeX table environment');
  assert(predTable.latexCode.includes('Brier Calibration Score'), 'Must include calibration metric');
  assert(predTable.latexCode.includes('\\end{table}'), 'Must close LaTeX table environment');
  console.log(`  ✓ Prediction LaTeX Table Generated: [${predTable.label}]`);

  // 3. Test Scalability LaTeX Table
  const perfTable = PublicationPipeline.generatePerformanceLatexTable();
  assert(perfTable.latexCode.includes('10,000'), 'Must include 10,000 nodes row');
  assert(perfTable.latexCode.includes('191.69'), 'Must include verified latency');
  console.log(`  ✓ Performance Scaling LaTeX Table Generated: [${perfTable.label}]`);

  // 4. Test BibTeX Citation
  const bibtex = PublicationPipeline.generateBibtex();
  assert(bibtex.startsWith('@article{socialgravity2026,'), 'BibTeX key must be valid');
  assert(bibtex.includes('ICWSM'), 'Target venue must be referenced');
  console.log('  ✓ BibTeX Academic Citation Block Verified.');

  console.log('✓ Research Publication Pipeline validated successfully.\n');
}
