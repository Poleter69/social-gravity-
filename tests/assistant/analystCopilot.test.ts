/**
 * Social Gravity - Autonomous Analyst Assistant Tests (Milestone M13)
 * 
 * Verifies evidence-backed incident briefs, investigation timeline generation,
 * root cause attribution, and repository-aware conversational Q&A.
 */

import { AnalystAssistant } from '../../src/assistant/analystCopilot';
import { RumorEngine } from '../../src/simulation/rumorEngine';
import { societyGenerator } from '../../src/society/generators/societyGenerator';
import { InformationSignal } from '../../src/psychology/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testAnalystAssistant() {
  console.log('\n--- Testing Milestone M13: Autonomous Analyst Assistant Copilot ---');

  const society = societyGenerator.generate({
    name: 'Copilot Investigation Lab',
    archetype: 'online_community',
    populationSize: 80,
    seed: 777,
  });

  const rumor: InformationSignal = {
    id: 'copilot_test_rumor',
    topic: 'Critical API Key Exposure',
    content: 'Master administrative keys leaked on public pastebin repository.',
    veracity: 'false',
    emotionalSalience: 0.95,
    complexity: 0.2,
    senderId: society.agents[0].id,
    round: 0,
  };

  const sim = new RumorEngine(society, { maxRounds: 15, seed: 123 });
  sim.start(rumor, [society.agents[0].id]);
  sim.step(); // t=1
  sim.step(); // t=2
  sim.step(); // t=3

  // 1. Executive Incident Summary
  console.log('  Testing incident summarization...');
  const summary = AnalystAssistant.summarizeIncident(society, sim.getState(), sim.getState().telemetryHistory);
  assert(summary.rootCauseNodeId === society.agents[0].id, 'Root cause should be correctly attributed');
  assert(summary.timeline.length >= 1, 'Timeline must contain ignition event');
  assert(summary.executiveBrief.includes('Critical API Key Exposure'), 'Executive brief must cite active topic');
  console.log(`  ✓ Incident Brief Generated: "${summary.title}" (Peak R0: ${summary.peakR0}, Infected: ${summary.totalInfectedPercentage}%)`);

  // 2. Investigation Timeline Milestones
  console.log('  Testing timeline milestones...');
  const ignitionEvent = summary.timeline.find(e => e.category === 'IGNITION');
  assert(ignitionEvent !== undefined, 'Must contain ignition milestone');
  assert(ignitionEvent!.tick === 0, 'Ignition must occur at tick 0');
  console.log(`  ✓ Milestone Captured: [${ignitionEvent!.timestampFormatted}] ${ignitionEvent!.headline}`);

  // 3. Repository-Aware Q&A
  console.log('  Testing evidence-backed conversational queries...');

  // Query A: Spread Rate
  const ansA = AnalystAssistant.answerQuery('Why is the spread rate growing?', society, sim.getState(), null);
  assert(ansA.answerText.includes('Spread Rate R₀'), 'Answer must explain R0');
  assert(ansA.evidenceReferences.length > 0, 'Answer must cite telemetry evidence');
  console.log(`  ✓ Query A ("Spread Rate"): Answer length = ${ansA.answerText.length}, Evidence: [${ansA.evidenceReferences[0].label}]`);

  // Query B: Top Influencers
  const ansB = AnalystAssistant.answerQuery('Who are the key nodes driving the contagion?', society, sim.getState(), null);
  assert(ansB.evidenceReferences.some(e => e.type === 'node'), 'Answer must reference concrete node IDs');
  console.log(`  ✓ Query B ("Key Nodes"): Top targets identified with evidence nodes.`);

  // Query C: Interventions
  const ansC = AnalystAssistant.answerQuery('How do we contain this rumor?', society, sim.getState(), null);
  assert(ansC.answerText.includes('Bridge Inoculation'), 'Answer must recommend Pareto-optimal strategy');
  console.log(`  ✓ Query C ("Intervention"): Pareto-optimal plan cited with quantitative containment estimate.`);

  console.log('✓ Autonomous Analyst Assistant Copilot validated successfully.');
}
