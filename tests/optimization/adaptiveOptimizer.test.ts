/**
 * Social Gravity - Adaptive Intervention Optimizer Tests (Milestone M14)
 * 
 * Verifies Monte Carlo Tree Search (MCTS) policy search, dynamic portfolio
 * evaluation, Pareto frontier discovery, and comparison vs V2 static baseline.
 */

import { AdaptiveInterventionOptimizer } from '../../src/optimization/adaptiveOptimizer';
import { RumorEngine } from '../../src/simulation/rumorEngine';
import { societyGenerator } from '../../src/society/generators/societyGenerator';
import { InformationSignal } from '../../src/psychology/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testAdaptiveOptimizer() {
  console.log('\n--- Testing Milestone M14: Adaptive Intervention Optimizer (MCTS) ---');

  const society = societyGenerator.generate({
    name: 'Optimization Arena Network',
    archetype: 'online_community',
    populationSize: 80,
    influencerRatio: 0.08,
    seed: 4321,
  });

  const rumor: InformationSignal = {
    id: 'adaptive_test_rumor',
    topic: 'Automated Supply Chain Freeze',
    content: 'Global port terminal systems halted due to firmware ransomware.',
    veracity: 'false',
    emotionalSalience: 0.9,
    complexity: 0.25,
    senderId: society.agents[0].id,
    round: 0,
  };

  const sim = new RumorEngine(society, { maxRounds: 25, seed: 101 });
  sim.start(rumor, [society.agents[0].id]);
  sim.step(); // Round 1
  sim.step(); // Round 2

  console.log('  Executing MCTS dynamic portfolio search (25 rollouts)...');
  const optimizer = new AdaptiveInterventionOptimizer({ maxRollouts: 25, budgetLimit: 6.0 });
  const result = optimizer.optimize(sim, society, 6.0);

  // 1. Verify Contracts
  assert(result.method === 'MCTS_EXPONENTIAL_ROLLOUT', 'Method must be MCTS');
  assert(result.simulatedRolloutsCount >= 20, 'Must execute rollouts');
  assert(result.optimalPlan.targetAgentIds.length > 0, 'Optimal plan must have target nodes');
  assert(result.optimalPlan.operationalCost <= 6.0, 'Optimal plan must respect budget limit');
  assert(result.paretoPlans.length > 0, 'Must discover Pareto frontier plans');

  // 2. Direct Comparison vs V2 Baseline
  console.log('  MCTS vs V2 Static Heuristics Comparison Table (Milestone M14):');
  console.log('  +---------------------------------------+-------------------+---------------------+');
  console.log('  | Metric                                | V2 Static Baseline| V3 Adaptive (MCTS)  |');
  console.log('  +---------------------------------------+-------------------+---------------------+');
  console.log(`  | Containment Efficiency                | ${String(result.v2BaselineComparison.v2ContainmentPct + '%').padEnd(17)} | ${String(result.v2BaselineComparison.v3AdaptiveContainmentPct + '%').padEnd(19)} |`);
  console.log(`  | Measurable Improvement Delta          | Baseline Reference| +${String(result.v2BaselineComparison.improvementDeltaPct + '%').padEnd(18)} |`);
  console.log(`  | Speed to Contagion Extinction         | ~12 Rounds        | ${String(result.v2BaselineComparison.speedToExtinctionRounds + ' Rounds').padEnd(19)} |`);
  console.log(`  | Search Latency                        | <2 ms (Static)    | ${String(result.searchDurationMs + ' ms').padEnd(19)} |`);
  console.log('  +---------------------------------------+-------------------+---------------------+');

  assert(result.v2BaselineComparison.improvementDeltaPct >= 0, 'V3 must achieve >= V2 containment performance');
  console.log(`  ✓ Recommended Plan: "${result.optimalPlan.name}" (Cost: ${result.optimalPlan.operationalCost} units, Targets: [${result.optimalPlan.targetAgentIds.join(', ')}])`);

  console.log('✓ Adaptive Intervention Optimizer validated successfully.');
}
