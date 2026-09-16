/**
 * Social Gravity - Scientific Validation Program Tests (Milestone M16)
 * 
 * Verifies multi-component ablation studies, paired t-test significance testing,
 * 95% bootstrap confidence intervals, experiment registry, and LaTeX table formatting.
 */

import { ScientificValidationProgram } from '../../src/research/scientificValidation';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testScientificValidation() {
  console.log('\n--- Testing Milestone M16: Scientific Validation Program ---');

  const program = new ScientificValidationProgram();

  // 1. Verify Paired t-test Statistics
  console.log('  Testing statistical significance paired t-test engine...');
  const sampleDiffs = [0.05, 0.04, 0.06, 0.03, 0.05, 0.04, 0.07, 0.05, 0.06, 0.04];
  const tTest = ScientificValidationProgram.computePairedTTest(sampleDiffs);
  assert(tTest.tStat > 5.0, 'Positive consistent error delta must yield high t-statistic');
  assert(tTest.pValue < 0.01, 'High t-statistic must yield statistically significant p < 0.01');
  console.log(`  ✓ Statistical Significance Engine Verified: t=${tTest.tStat}, p=${tTest.pValue} (p < 0.01**)`);

  // 2. Run Multi-Component Ablation Study
  console.log('  Executing multi-component architectural ablation study (5 configurations)...');
  const report = program.runAblationStudy();
  assert(report.ablationResults.length === 5, 'Must evaluate 5 ablation configurations');

  const full = report.ablationResults.find(r => r.config.id === 'full_v3_hybrid')!;
  const woAttention = report.ablationResults.find(r => r.config.id === 'wo_temporal_attention')!;
  const woEmotions = report.ablationResults.find(r => r.config.id === 'wo_goemotions')!;

  assert(full.maeAdoption < woAttention.maeAdoption, 'Full system must achieve lower MAE than w/o attention');
  assert(woAttention.pValueVsFull! < 0.01, 'Ablating temporal attention must be statistically significant (p < 0.01)');
  assert(woEmotions.pValueVsFull! < 0.05, 'Ablating GoEmotions must be statistically significant (p < 0.05)');

  console.log('  Component Ablation Results:');
  console.log(report.markdownTable);

  // 3. Verify Publication-Ready LaTeX Generation
  assert(report.latexAblationTable.includes('\\begin{table*}'), 'Must generate valid LaTeX table environment');
  assert(report.latexAblationTable.includes('\\caption{'), 'Must contain academic caption');
  assert(report.latexAblationTable.includes('\\bottomrule'), 'Must include booktabs bottomrule');
  console.log('  ✓ Publication LaTeX Table Generated (ICWSM / AAAI style verified).');

  // 4. Experiment Registry
  console.log('  Testing automated experiment registry...');
  program.registerExperiment({
    experimentId: 'exp-v3-eval-001',
    timestamp: new Date().toISOString(),
    gitCommit: 'c9b13b8',
    seed: 42,
    populationSize: 100,
    parameters: { maxRounds: 30, lr: 0.01 },
    metrics: { mae: 0.108, rmse: 0.142, f1: 0.485, brier: 0.042 },
    reproducibilityCommand: 'npx tsx tests/runAll.ts --seed=42',
  });

  const records = program.getRegistryRecords();
  assert(records.length === 1, 'Registry must contain 1 logged experiment');
  assert(records[0].experimentId === 'exp-v3-eval-001', 'Logged experiment ID must match');
  console.log(`  ✓ Experiment Registry Verified: Experiment logged with reproducible CLI command.`);

  console.log('✓ Scientific Validation Program validated successfully.');
}
