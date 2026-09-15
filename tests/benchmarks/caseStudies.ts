/**
 * Social Gravity — Real-World Case Studies Simulation & Benchmarks
 * Simulates 4 documented real-world information contagion events:
 * 1. 2020 5G-COVID Public Health Panic
 * 2. 2023 Silicon Valley Bank Digital Bank Run
 * 3. 2022 AI Deepfake/Media Fraud Controversy
 * 4. 2024 Election Tabulator Logistical Misinformation
 */

import { societyGenerator } from '../../src/society/generators/societyGenerator';
import { RumorEngine } from '../../src/simulation/rumorEngine';
import { CounterfactualEngine, CounterfactualComparisonResult } from '../../src/simulation/counterfactualEngine';
import { InformationSignal } from '../../src/psychology/types';
import { EmotionEngine } from '../../src/nlp/emotionEngine';

export interface CaseStudyOutcome {
  id: string;
  name: string;
  category: string;
  historicalDate: string;
  population: number;
  initialInfectionNode: string;
  baseline: {
    totalRounds: number;
    peakBelievers: number;
    finalBelievers: number;
    peakR0: number;
    cascadeVelocity: number;
  };
  counterfactual: CounterfactualComparisonResult;
  preventedInfectionPct: number;
  r0Reduction: number;
}

export async function runAllCaseStudies(): Promise<CaseStudyOutcome[]> {
  const outcomes: CaseStudyOutcome[] = [];
  const emotionEngine = EmotionEngine.getInstance();

  // =========================================================================
  // CASE STUDY 1: 2020 5G-COVID Public Health Panic
  // =========================================================================
  const society1 = societyGenerator.generate({
    name: '5G-COVID Online Discussion Network',
    archetype: 'online_community',
    populationSize: 100,
    influencerRatio: 0.06,
    baselineTrust: 0.42,
    baselineConformity: 0.72,
    baselineRiskTolerance: 0.35,
    seed: 202004,
  });

  const signal1: InformationSignal = {
    id: 'rumor-5g-covid',
    topic: '5G Radiation Suppresses Immune Response',
    content: 'Breaking: Leaked documents prove 5G electromagnetic towers weaken pulmonary immune defense.',
    veracity: 'false',
    emotionalSalience: 0.85,
    complexity: 0.4,
    senderId: society1.agents[0].id,
    round: 0,
    emotionProfile: emotionEngine.predictSync('Terrifying danger: electromagnetic radiation causes respiratory collapse'),
  };

  const engine1 = new RumorEngine(society1, { maxRounds: 10, seed: 101 });
  engine1.start(signal1, [society1.agents[0].id]);
  for (let r = 0; r < 5; r++) engine1.step();

  const cf1 = CounterfactualEngine.runStandardComparison(engine1, 5);
  const baseTel1 = engine1.getState().telemetryHistory;
  const peakBelievers1 = Math.max(...baseTel1.map(t => t.believerCount));
  const peakR0_1 = Math.max(...baseTel1.map(t => t.r0));

  outcomes.push({
    id: 'case-5g-covid',
    name: '2020 5G-COVID Cellular Health Panic',
    category: 'Public Health Rumor',
    historicalDate: 'April 2020',
    population: society1.agents.length,
    initialInfectionNode: society1.agents[0].name,
    baseline: {
      totalRounds: baseTel1.length,
      peakBelievers: peakBelievers1,
      finalBelievers: baseTel1[baseTel1.length - 1]?.believerCount ?? 0,
      peakR0: peakR0_1,
      cascadeVelocity: baseTel1[baseTel1.length - 1]?.cascadeVelocity ?? 0,
    },
    counterfactual: cf1,
    preventedInfectionPct: cf1.branches.find(b => b.branchId === cf1.recommendedBranchId)?.containmentEfficiency ?? 0,
    r0Reduction: Number(Math.max(0, (cf1.branches.find(b => b.branchId === 'baseline')?.peakR0 ?? 0) - (cf1.branches.find(b => b.branchId === cf1.recommendedBranchId)?.peakR0 ?? 0)).toFixed(2)),
  });

  // =========================================================================
  // CASE STUDY 2: 2023 Silicon Valley Bank Digital Bank Run
  // =========================================================================
  const society2 = societyGenerator.generate({
    name: 'Venture Capital & Tech Founder Network',
    archetype: 'workplace',
    populationSize: 120,
    influencerRatio: 0.08,
    baselineTrust: 0.65,
    baselineConformity: 0.78,
    baselineRiskTolerance: 0.25, // Extreme financial loss aversion
    seed: 202303,
  });

  const signal2: InformationSignal = {
    id: 'rumor-svb-insolvency',
    topic: 'SVB Liquidity Deficit and Capital Call Failure',
    content: 'Urgent: Major tech bank facing catastrophic liquidity crunch. Founders advised to withdraw immediate balances.',
    veracity: 'unverified',
    emotionalSalience: 0.92,
    complexity: 0.6,
    senderId: society2.agents[1].id,
    round: 0,
    emotionProfile: emotionEngine.predictSync('Catastrophic financial collapse panic: withdraw all deposits now'),
  };

  const engine2 = new RumorEngine(society2, { maxRounds: 10, seed: 202 });
  engine2.start(signal2, [society2.agents[1].id]);
  for (let r = 0; r < 5; r++) engine2.step();

  const cf2 = CounterfactualEngine.runStandardComparison(engine2, 5);
  const baseTel2 = engine2.getState().telemetryHistory;

  outcomes.push({
    id: 'case-svb-bank-run',
    name: '2023 Silicon Valley Bank Digital Bank Run',
    category: 'Breaking Financial / Tech Contagion',
    historicalDate: 'March 2023',
    population: society2.agents.length,
    initialInfectionNode: society2.agents[1].name,
    baseline: {
      totalRounds: baseTel2.length,
      peakBelievers: Math.max(...baseTel2.map(t => t.believerCount)),
      finalBelievers: baseTel2[baseTel2.length - 1]?.believerCount ?? 0,
      peakR0: Math.max(...baseTel2.map(t => t.r0)),
      cascadeVelocity: baseTel2[baseTel2.length - 1]?.cascadeVelocity ?? 0,
    },
    counterfactual: cf2,
    preventedInfectionPct: cf2.branches.find(b => b.branchId === cf2.recommendedBranchId)?.containmentEfficiency ?? 0,
    r0Reduction: Number(Math.max(0, (cf2.branches.find(b => b.branchId === 'baseline')?.peakR0 ?? 0) - (cf2.branches.find(b => b.branchId === cf2.recommendedBranchId)?.peakR0 ?? 0)).toFixed(2)),
  });

  // =========================================================================
  // CASE STUDY 3: 2022 AI Deepfake Media Fraud Controversy
  // =========================================================================
  const society3 = societyGenerator.generate({
    name: 'Digital Media & AI Social Graph',
    archetype: 'online_community',
    populationSize: 80,
    influencerRatio: 0.05,
    baselineTrust: 0.50,
    baselineConformity: 0.60,
    baselineRiskTolerance: 0.50,
    seed: 202211,
  });

  const signal3: InformationSignal = {
    id: 'rumor-ai-deepfake',
    topic: 'Leaked AI Audio Confession',
    content: 'Synthetic audio tape allegedly exposing high-level corporate fraud surfaces across social forums.',
    veracity: 'false',
    emotionalSalience: 0.75,
    complexity: 0.35,
    senderId: society3.agents[2].id,
    round: 0,
    emotionProfile: emotionEngine.predictSync('Outrageous scandal: leaked audio confirms shocking corporate deception'),
  };

  const engine3 = new RumorEngine(society3, { maxRounds: 10, seed: 303 });
  engine3.start(signal3, [society3.agents[2].id]);
  for (let r = 0; r < 5; r++) engine3.step();

  const cf3 = CounterfactualEngine.runStandardComparison(engine3, 5);
  const baseTel3 = engine3.getState().telemetryHistory;

  outcomes.push({
    id: 'case-ai-deepfake',
    name: '2022 AI Synthetic Audio Disinformation Scandal',
    category: 'Media Fraud & Controversy',
    historicalDate: 'November 2022',
    population: society3.agents.length,
    initialInfectionNode: society3.agents[2].name,
    baseline: {
      totalRounds: baseTel3.length,
      peakBelievers: Math.max(...baseTel3.map(t => t.believerCount)),
      finalBelievers: baseTel3[baseTel3.length - 1]?.believerCount ?? 0,
      peakR0: Math.max(...baseTel3.map(t => t.r0)),
      cascadeVelocity: baseTel3[baseTel3.length - 1]?.cascadeVelocity ?? 0,
    },
    counterfactual: cf3,
    preventedInfectionPct: cf3.branches.find(b => b.branchId === cf3.recommendedBranchId)?.containmentEfficiency ?? 0,
    r0Reduction: Number(Math.max(0, (cf3.branches.find(b => b.branchId === 'baseline')?.peakR0 ?? 0) - (cf3.branches.find(b => b.branchId === cf3.recommendedBranchId)?.peakR0 ?? 0)).toFixed(2)),
  });

  // =========================================================================
  // CASE STUDY 4: 2024 Election Tabulator Glitch Rumor
  // =========================================================================
  const society4 = societyGenerator.generate({
    name: 'Polarized Electorate Sub-Communities',
    archetype: 'city',
    populationSize: 150,
    influencerRatio: 0.04,
    baselineTrust: 0.38,
    baselineConformity: 0.82,
    baselineRiskTolerance: 0.30,
    seed: 202411,
  });

  const signal4: InformationSignal = {
    id: 'rumor-election-tabulator',
    topic: 'Voting Tabulator Glitch Framed as Systemic Fraud',
    content: 'Routine machine paper jam reported as deliberate vote tampering in key bellwether county.',
    veracity: 'false',
    emotionalSalience: 0.88,
    complexity: 0.5,
    senderId: society4.agents[3].id,
    round: 0,
    emotionProfile: emotionEngine.predictSync('Furious indignation: election interference caught on camera'),
  };

  const engine4 = new RumorEngine(society4, { maxRounds: 10, seed: 404 });
  engine4.start(signal4, [society4.agents[3].id]);
  for (let r = 0; r < 5; r++) engine4.step();

  const cf4 = CounterfactualEngine.runStandardComparison(engine4, 5);
  const baseTel4 = engine4.getState().telemetryHistory;

  outcomes.push({
    id: 'case-election-tabulator',
    name: '2024 Voting Tabulator Algorithmic Glitch Rumor',
    category: 'Election-Related Contagion',
    historicalDate: 'November 2024',
    population: society4.agents.length,
    initialInfectionNode: society4.agents[3].name,
    baseline: {
      totalRounds: baseTel4.length,
      peakBelievers: Math.max(...baseTel4.map(t => t.believerCount)),
      finalBelievers: baseTel4[baseTel4.length - 1]?.believerCount ?? 0,
      peakR0: Math.max(...baseTel4.map(t => t.r0)),
      cascadeVelocity: baseTel4[baseTel4.length - 1]?.cascadeVelocity ?? 0,
    },
    counterfactual: cf4,
    preventedInfectionPct: cf4.branches.find(b => b.branchId === cf4.recommendedBranchId)?.containmentEfficiency ?? 0,
    r0Reduction: Number(Math.max(0, (cf4.branches.find(b => b.branchId === 'baseline')?.peakR0 ?? 0) - (cf4.branches.find(b => b.branchId === cf4.recommendedBranchId)?.peakR0 ?? 0)).toFixed(2)),
  });

  return outcomes;
}
