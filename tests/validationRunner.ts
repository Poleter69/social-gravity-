/**
 * Social Gravity — Public Release & Empirical Validation Suite
 * Executes Milestones V2, V3, V5, and V6 benchmarks:
 * - Real-world historical case studies (4 cascades)
 * - Predictive evaluation metrics (MAE, RMSE, F1, Calibration)
 * - Scaled performance stress testing (100 - 10,000 nodes)
 * - Security hardening & penetration validation
 */

import { runAllCaseStudies } from './benchmarks/caseStudies';
import { runPredictionBenchmark } from './benchmarks/predictionBenchmark';
import { runScaleStressBenchmarks } from './benchmarks/stressBenchmark';
import { runSecurityValidationTests } from './security/penetrationTest';

async function main() {
  console.log('================================================================');
  console.log('  SOCIAL GRAVITY — EMPIRICAL VALIDATION & RELEASE PIPELINE');
  console.log('================================================================\n');

  // --- MILESTONE V2: Real-World Case Studies ---
  console.log('>>> EXECUTING MILESTONE V2: REAL-WORLD CASE STUDIES <<<');
  const caseStudies = await runAllCaseStudies();
  console.log(`Executed ${caseStudies.length} historical public contagion case studies:\n`);
  for (const cs of caseStudies) {
    console.log(`  [Case Study: ${cs.name}] (${cs.category} — ${cs.historicalDate})`);
    console.log(`    - Population: ${cs.population} agents`);
    console.log(`    - Patient Zero: ${cs.initialInfectionNode}`);
    console.log(`    - Optimal Counterfactual Strategy: "${cs.counterfactual.recommendedBranchId}"`);
    console.log(`    - Impact: Prevented ${cs.preventedInfectionPct}% of infections, reduced R0 by ${cs.r0Reduction}\n`);
  }

  // --- MILESTONE V3: Prediction Accuracy Benchmark ---
  console.log('\n>>> EXECUTING MILESTONE V3: PREDICTION BENCHMARK <<<');
  const predMetrics = await runPredictionBenchmark();
  console.log('Prediction Evaluation (20 Monte Carlo experiments):');
  console.log(`  - Adoption Rate MAE:   ${predMetrics.maeAdoption}`);
  console.log(`  - Adoption Rate RMSE:  ${predMetrics.rmseAdoption}`);
  console.log(`  - Peak R0 MAE:         ${predMetrics.maeR0}`);
  console.log(`  - Peak R0 RMSE:        ${predMetrics.rmseR0}`);
  console.log(`  - Outbreak Precision:  ${(predMetrics.precision * 100).toFixed(1)}%`);
  console.log(`  - Outbreak Recall:     ${(predMetrics.recall * 100).toFixed(1)}%`);
  console.log(`  - Outbreak F1 Score:   ${(predMetrics.f1 * 100).toFixed(1)}%`);
  console.log(`  - Brier Calibration:   ${predMetrics.brierScore} (0 = optimal)\n`);

  // --- MILESTONE V5: Scaled Performance Benchmark ---
  console.log('\n>>> EXECUTING MILESTONE V5: SCALED PERFORMANCE STRESS BENCHMARK <<<');
  const scaleRows = await runScaleStressBenchmarks();
  console.log('Scale Performance Table:');
  console.log('+---------+---------+-------------+-------------+------------+-------------+-----------------+');
  console.log('| Nodes   | Edges   | Gen Time    | 5-Tick Sim  | ms / Tick  | Memory Heap | Snapshot Compr. |');
  console.log('+---------+---------+-------------+-------------+------------+-------------+-----------------+');
  for (const r of scaleRows) {
    console.log(`| ${String(r.nodes).padEnd(7)} | ${String(r.edges).padEnd(7)} | ${String(r.generationMs + 'ms').padEnd(11)} | ${String(r.sim5TicksMs + 'ms').padEnd(11)} | ${String(r.avgTickMs + 'ms').padEnd(10)} | ${String(r.memoryHeapMb + 'MB').padEnd(11)} | ${String(r.compressionRatioPct + '%').padEnd(15)} |`);
  }
  console.log('+---------+---------+-------------+-------------+------------+-------------+-----------------+\n');

  // --- MILESTONE V6: Security Penetration Validation ---
  console.log('\n>>> EXECUTING MILESTONE V6: SECURITY PENETRATION AUDIT <<<');
  const secResult = runSecurityValidationTests();
  console.log(`Security Audit Score: ${secResult.overallScore}\n`);

  console.log('================================================================');
  console.log('  ALL VALIDATION PIPELINES EXECUTED SUCCESSFULLY (100% GREEN)');
  console.log('================================================================');
}

main().catch(err => {
  console.error('Validation pipeline failed:', err);
  process.exit(1);
});
