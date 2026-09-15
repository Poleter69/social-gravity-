/**
 * Social Gravity - Evidence-Backed Intelligence Dossier Tests (Milestone M4)
 */

import { EvidenceDossierEngine } from '../../src/explainability/evidenceDossier';
import { RumorEngine } from '../../src/simulation/rumorEngine';
import { societyGenerator } from '../../src/society/generators/societyGenerator';
import { InformationSignal } from '../../src/psychology/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testEvidenceDossier() {
  console.log('--- Testing Milestone M4: Explainable Intelligence Dossier Engine ---');

  const society = societyGenerator.generate({
    name: 'Dossier Test Society',
    archetype: 'online_community',
    populationSize: 75,
    seed: 42,
  });

  const rumor: InformationSignal = {
    id: 'dossier_rumor_1',
    topic: 'Sudden Critical Bank Freeze Panic',
    content: 'All transfers above $1,000 halted by regulatory decree.',
    veracity: 'false',
    emotionalSalience: 0.95,
    complexity: 0.20,
    senderId: society.agents[0].id,
    round: 0,
  };

  const engine = new RumorEngine(society, {
    maxRounds: 15,
    seed: 42000,
  });

  engine.start(rumor, [society.agents[0].id]);
  engine.step(); // Round 1
  engine.step(); // Round 2
  engine.step(); // Round 3

  const simState = engine.getState();
  console.log('  Compiling evidence-backed intelligence dossier at Round 3...');
  const dossier = EvidenceDossierEngine.compileDossier(society, simState, 'High-Priority Bank Run Epistemic Alert');

  // 1. Verify Structure & Headline
  assert(dossier.dossierId.startsWith('dossier-'), 'Dossier ID must be present');
  assert(dossier.generatedAtRound === 3, 'Round must match simulation tick');
  assert(dossier.confidenceScore >= 0.65 && dossier.confidenceScore <= 1.0, 'Confidence score must be in [0.65, 1.0]');
  console.log(`  ✓ Alert Dossier: "${dossier.alertHeadline}" [Severity: ${dossier.threatSeverity}] (Confidence: ${(dossier.confidenceScore * 100).toFixed(1)}%)`);

  // 2. Verify Triggering Nodes
  assert(dossier.triggeringNodes.length >= 1, 'At least 1 triggering node must be identified');
  const patientZero = dossier.triggeringNodes[0];
  assert(patientZero.agentId.length > 0, 'Agent ID must be non-empty');
  assert(typeof patientZero.degree === 'number', 'Degree metric must be present');
  console.log(`  ✓ Top Triggering Node: ${patientZero.agentName} (${patientZero.agentId}) [Role: ${patientZero.role}, Deg: ${patientZero.degree}]`);

  // 3. Verify Causal Propagation Chains
  assert(dossier.propagationChains.length >= 1, 'At least 1 causal propagation chain must be reconstructed');
  const chain = dossier.propagationChains[0];
  assert(chain.path.length >= 1, 'Path must have at least 1 node');
  assert(chain.originatingPatientZero === society.agents[0].id, 'Originating patient zero must match root seed');
  console.log(`  ✓ Causal Chain: ${chain.path.map(p => p.agentName).join(' -> ')} (Length: ${chain.pathLength})`);

  // 4. Verify Emotional Contributors
  assert(dossier.emotionalContributors.length >= 1, 'Emotional contributors must be present');
  const emotion = dossier.emotionalContributors[0];
  assert(emotion.arousal >= 0.8, 'Threat rumor must produce high arousal');
  assert(emotion.propagationMultiplier > 1.0, 'High arousal must accelerate propagation');
  console.log(`  ✓ Emotional Contributor: ${emotion.emotionLabel} (Arousal: ${emotion.arousal}, Multiplier: ${emotion.propagationMultiplier}x)`);

  // 5. Verify Supporting Snapshot Digest
  assert(dossier.supportingSnapshot.round === 3, 'Supporting snapshot must match round 3');
  assert(dossier.supportingSnapshot.snapshotDigest.length > 0, 'Snapshot digest must be non-empty');
  console.log(`  ✓ Supporting Replay Snapshot: ${dossier.supportingSnapshot.snapshotDigest} (Believers: ${dossier.supportingSnapshot.believers})`);

  // 6. Verify Recommended Intervention
  assert(dossier.recommendedIntervention.targetAgentIds.length >= 1, 'At least 1 intervention target must be recommended');
  assert(dossier.recommendedIntervention.projectedContainment > 50, 'Containment efficiency must exceed 50%');
  console.log(`  ✓ Recommended Intervention: [${dossier.recommendedIntervention.strategy}] -> Targets: ${dossier.recommendedIntervention.targetAgentIds.join(', ')} (Containment: ${dossier.recommendedIntervention.projectedContainment}%)`);

  console.log('✓ Explainable Intelligence Dossier Engine validated successfully.\n');
}
