/**
 * Unit & Integration Tests - Behavioral Decision Engine & Explainable Logging
 */

import { societyGenerator } from '../../src/society/generators/societyGenerator';
import { BehavioralDecisionEngine } from '../../src/psychology/decisionEngine';
import { InformationSignal } from '../../src/psychology/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testDecisionEngine() {
  console.log('--- Testing Behavioral Decision Engine ---');

  // 1. Setup a test society
  const society = societyGenerator.generate({
    name: 'Psychology Testbed',
    archetype: 'school',
    populationSize: 40,
    seed: 42,
  });

  const targetAgent = society.agents[0];
  const senderAgent = society.agents[1];

  // Test Case 1: High Salience Alarming Signal
  const alarmSignal: InformationSignal = {
    id: 'sig-alarm-01',
    topic: 'Campus Security Alert',
    content: 'Unconfirmed breach detected in north campus wing; evacuate immediately.',
    veracity: 'unverified',
    emotionalSalience: 0.90, // High threat
    complexity: 0.20,
    senderId: senderAgent.id,
    round: 1,
  };

  const initialFear = targetAgent.psychology.emotions.fear;
  const decision1 = BehavioralDecisionEngine.evaluate(targetAgent, alarmSignal, society);

  assert(['adopt', 'amplify', 'scrutinize'].includes(decision1.action), 'Alarm signal must trigger active response');
  assert(targetAgent.psychology.emotions.fear >= initialFear, 'Fear should have escalated after high-salience alarm');
  assert(decision1.reasoningSteps.length >= 4, 'Must produce multi-step explainable reasoning');
  assert(decision1.narrativeSummary.length > 10, 'Must produce natural language narrative synthesis');
  assert(targetAgent.psychology.decisionLogs.length === 1, 'Decision log must be prepended to agent history');

  // Test Case 2: Social Proof Cascade
  // Set all neighbors of targetAgent to believers
  const agentMap = new Map(society.agents.map((a) => [a.id, a]));
  for (const neighborId of targetAgent.connections) {
    const n = agentMap.get(neighborId);
    if (n) {
      n.state.beliefStatus = 'believer';
    }
  }

  const consensusSignal: InformationSignal = {
    id: 'sig-consensus-02',
    topic: 'Curriculum Change Rumor',
    content: 'All final exams rescheduled to next week.',
    veracity: 'unverified',
    emotionalSalience: 0.40,
    complexity: 0.30,
    senderId: targetAgent.connections[0] || senderAgent.id,
    round: 2,
  };

  const decision2 = BehavioralDecisionEngine.evaluate(targetAgent, consensusSignal, society);
  assert(
    decision2.factors.neighborAgreementRatio >= 0.8,
    'Social proof consensus ratio must reflect unanimous neighbor belief'
  );
  assert(
    decision2.action === 'adopt' || decision2.action === 'amplify',
    'Unanimous peer adoption must induce belief in target agent'
  );

  // Test Case 3: Skeptical Debunking
  const skepticAgent = society.agents[5];
  skepticAgent.psychology.skepticism = 0.85;
  skepticAgent.psychology.emotions.confidence = 0.80;
  skepticAgent.peerTrustMap['unknown-bot'] = 0.05;

  const absurdSignal: InformationSignal = {
    id: 'sig-absurd-03',
    topic: 'Fringe Theory',
    content: 'School cafeteria replaces all water with liquid glucose.',
    veracity: 'false',
    emotionalSalience: 0.10,
    complexity: 0.10,
    senderId: 'unknown-bot',
    round: 3,
  };

  const decision3 = BehavioralDecisionEngine.evaluate(skepticAgent, absurdSignal, society);
  assert(decision3.action === 'debunk', `Expected debunk action for absurd claim, got: ${decision3.action}`);
  assert(skepticAgent.state.beliefStatus === 'debunker', 'Agent state must flip to debunker');

  console.log('✓ Behavioral Decision Engine tests passed successfully.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('decisionEngine.test.ts')) {
  testDecisionEngine();
}
