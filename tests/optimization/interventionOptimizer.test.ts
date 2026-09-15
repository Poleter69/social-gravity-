/**
 * Social Gravity - Intervention Optimization Tests (Milestone M6)
 */

import { InterventionOptimizer } from '../../src/optimization/interventionOptimizer';
import { RumorEngine } from '../../src/simulation/rumorEngine';
import { societyGenerator } from '../../src/society/generators/societyGenerator';
import { InformationSignal } from '../../src/psychology/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testInterventionOptimizer() {
  console.log('--- Testing Milestone M6: Automated Intervention Optimization ---');

  const society = societyGenerator.generate({
    name: 'Optimization Test Society',
    archetype: 'online_community',
    populationSize: 80,
    seed: 42,
  });

  const signal: InformationSignal = {
    id: 'opt_signal_1',
    topic: 'Runaway Panic Rumor',
    content: 'Massive infrastructure outage expected within hours.',
    veracity: 'false',
    emotionalSalience: 0.90,
    complexity: 0.20,
    senderId: society.agents[0].id,
    round: 0,
  };

  const engine = new RumorEngine(society, {
    maxRounds: 15,
    seed: 12345,
  });

  engine.start(signal, [society.agents[0].id]);
  engine.step(); // Round 1
  engine.step(); // Round 2

  console.log('  Searching Pareto frontier of intervention strategies at Round 2...');
  const report = InterventionOptimizer.optimize(engine, 6);

  // 1. Verify Report Metrics
  assert(report.baselineInfections >= 1, 'Baseline infections must be positive');
  assert(report.evaluatedStrategiesCount >= 3, 'Must evaluate at least 3 candidate strategies');
  assert(report.paretoFrontier.length >= 1, 'Pareto frontier must contain at least 1 non-dominated plan');
  assert(report.recommendedPlan !== undefined, 'Recommended plan must be selected');

  console.log(`  ✓ Evaluated ${report.evaluatedStrategiesCount} candidate strategies against baseline infections (${report.baselineInfections}).`);
  console.log(`  ✓ Discovered ${report.paretoFrontier.length} Pareto-optimal strategies.`);

  // 2. Verify Formatted Strategy Comparison Table
  assert(report.comparisonTable.length >= 3, 'Comparison table must contain rows');
  console.log('\n  Pareto Frontier & Strategy Comparison Table:');
  console.log('  +--------------------------------------------+------------+---------------+');
  console.log('  | Strategy                                   | Cost       | Containment   |');
  console.log('  +--------------------------------------------+------------+---------------+');
  report.comparisonTable.forEach(row => {
    const s = row.strategy.padEnd(42, ' ');
    const c = row.cost.padEnd(10, ' ');
    const cont = row.containment.padEnd(13, ' ');
    console.log(`  | ${s} | ${c} | ${cont} |`);
  });
  console.log('  +--------------------------------------------+------------+---------------+\n');

  // 3. Verify Recommended Plan
  const rec = report.recommendedPlan;
  assert(rec.targetCount > 0, 'Target count must be positive');
  assert(rec.operationalCost > 0, 'Operational cost must be positive');
  console.log(`  ✓ Recommended Plan: "${rec.name}" [Cost: ${rec.operationalCost} units, Containment: ${rec.containmentEfficiency}%]`);
  console.log(`  ✓ Rationale: ${rec.rationale}`);

  console.log('✓ Automated Intervention Optimization validated successfully.\n');
}
