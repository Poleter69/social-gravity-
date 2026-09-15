/**
 * Unit & Integration Tests - Psychological State Evolution & Homeostasis
 */

import { societyGenerator } from '../../src/society/generators/societyGenerator';
import { updateTrustOnVerification } from '../../src/psychology/rules/trustReinforcement';
import { applyEmotionalHomeostasis } from '../../src/psychology/rules/confidenceRecovery';
import { analyzeNeighborhoodContext } from '../../src/psychology/neighborhood';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testPsychologicalEvolution() {
  console.log('--- Testing Psychological Evolution & Homeostasis ---');

  const society = societyGenerator.generate({
    name: 'Evolution Testbed',
    archetype: 'city',
    populationSize: 50,
    seed: 123,
  });

  const agent = society.agents[0];
  const senderId = agent.connections[0] || 'agent-0002';

  // 1. Initial baseline
  const initialTrust = agent.peerTrustMap[senderId] ?? agent.traits.trust;
  const initialSkepticism = agent.psychology.skepticism;

  // 2. Test Verification (Accurate Info Feedback)
  const trueFeedback = updateTrustOnVerification(agent, senderId, 'true');
  assert(trueFeedback.posteriorSenderTrust > initialTrust, 'Verified truth must increase dyadic trust');
  assert(agent.psychology.skepticism <= initialSkepticism, 'Verified truth must decrease skepticism');
  assert(agent.psychology.verificationsEncountered === 1, 'Verification count must increment');

  // 3. Test Deception / Misinformation (False Info Feedback)
  const currentTrust = agent.peerTrustMap[senderId];
  const falseFeedback = updateTrustOnVerification(agent, senderId, 'false');
  assert(falseFeedback.posteriorSenderTrust < currentTrust * 0.75, 'Deception must trigger sharp asymmetric trust collapse');
  assert(agent.psychology.skepticism > initialSkepticism, 'Deception must harden skepticism');
  assert(agent.psychology.misinformationEncountered === 1, 'Misinformation counter must increment');

  // 4. Test Homeostasis (Fear decay & calm recovery)
  agent.psychology.emotions.fear = 0.80;
  agent.psychology.emotions.calm = 0.10;

  const homeostasis = applyEmotionalHomeostasis(agent);
  assert(homeostasis.after.fear < homeostasis.before.fear, 'Homeostasis must reduce acute fear');
  assert(homeostasis.after.calm > homeostasis.before.calm, 'Homeostasis must recover emotional calm');

  // 5. Test Bridge Node Conflicting Signals
  const bridgeAgent = society.agents.find((a) => a.isBridge);
  if (bridgeAgent) {
    // Force one community to believe and another to remain skeptic
    const agentMap = new Map(society.agents.map((a) => [a.id, a]));
    const neighbors = bridgeAgent.connections.map((id) => agentMap.get(id)).filter(Boolean);

    if (neighbors.length >= 2) {
      const comm1 = neighbors[0]!.communityId;
      neighbors.forEach((n) => {
        if (n!.communityId === comm1) {
          n!.state.beliefStatus = 'believer';
        } else {
          n!.state.beliefStatus = 'skeptical';
        }
      });

      const analysis = analyzeNeighborhoodContext(bridgeAgent, society);
      assert(analysis.hasConflictingSignals, 'Bridge node with divergent community stances must detect conflicting signals');
    }
  }

  console.log('✓ Psychological State Evolution tests passed successfully.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('evolution.test.ts')) {
  testPsychologicalEvolution();
}
