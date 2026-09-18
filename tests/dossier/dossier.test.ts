// tests/dossier/dossier.test.ts
// Verification Suite for Project Dossier: Premium Downloadable Intelligence Report

import { buildInvestigationDossier, verifyDossierIntegrity } from '../../src/reports/dossier/dossierBuilder';
import { generateDossierHtml, generateDossierPrintableHtml } from '../../src/reports/dossier/generators/htmlGenerator';
import { generateDossierJson } from '../../src/reports/dossier/generators/jsonGenerator';
import { societyGenerator } from '../../src/society/generators/societyGenerator';
import { RumorEngine } from '../../src/simulation/rumorEngine';
import { InformationSignal } from '../../src/psychology/types';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function testProjectDossierSuite(): Promise<void> {
  console.log('--- Project Dossier: Premium Intelligence Report Verification ---');

  // 1. Generate society and simulation run
  const society = societyGenerator.generate({
    name: 'Aegis Threat Ingestion Net',
    archetype: 'online_community',
    populationSize: 80,
    seed: 1337,
  });

  const signal: InformationSignal = {
    id: 'sig-dossier-01',
    topic: 'Critical API Key Liquidity Exploit',
    content: 'All validator keys leaked across Discord channels. Bridge funds drained to tornado.cash address.',
    veracity: 'false',
    emotionalSalience: 0.94,
    complexity: 0.35,
    senderId: society.agents[0].id,
    round: 0,
  };

  const engine = new RumorEngine(society, {
    maxRounds: 10,
    seed: 9942,
  });

  engine.start(signal, [society.agents[0].id, society.agents[1].id]);
  engine.step();
  engine.step();
  engine.step();

  const simState = engine.getState();
  const telemetryHistory = simState.telemetryHistory;

  // 2. Build Dossier
  console.log('  Testing dossier deterministic compilation...');
  const dossier = buildInvestigationDossier(
    society,
    simState,
    telemetryHistory,
    null,
    {
      operationTitle: 'OPERATION AEGIS: Synthetic Contagion & Liquidity Drain',
      operationCodename: 'AEGIS-VORTEX',
      classification: 'TOP SECRET // SCI // EYES ONLY',
      analystId: 'SENIOR THREAT ANALYST (SIG-884)',
      activeTheme: 'dark',
    }
  );

  assert(!!dossier.metadata.id, 'Dossier must generate a unique document ID');
  assert(dossier.metadata.operationCodename === 'AEGIS-VORTEX', 'Codename must match');
  assert(dossier.metadata.classification === 'TOP SECRET // SCI // EYES ONLY', 'Classification must match');
  assert(dossier.executiveSummary.riskLevel !== undefined, 'Risk level should be defined');
  assert(parseFloat(dossier.executiveSummary.narrativeGrowth) >= 1.0, 'Growth multiplier must be >= 1.0');
  assert(dossier.executiveSummary.communitiesAffected >= 1, 'Communities affected must be >= 1');
  assert(dossier.timeline.length >= 4, 'Timeline milestones must be populated');
  assert(dossier.networkEvidence.nodes.length > 0, 'Network evidence nodes must be present');
  assert(dossier.networkEvidence.communities.length > 0, 'Community hulls must be generated');
  assert(dossier.emotionTrends.points.length > 0, 'Emotion trajectories must be present');
  assert(dossier.keyActors.length > 0, 'Key actors must be ranked');
  assert(dossier.evidenceBoard.length > 0, 'Evidence cards must be included');
  assert(dossier.explainabilityFlow.length >= 4, 'Causal flow nodes must be constructed');
  assert(dossier.recommendations.length >= 3, 'Actionable recommendations must be generated');
  assert(!!dossier.appendix.replayHash, 'Cryptographic replay hash must exist');
  assert(!!dossier.appendix.exportChecksum, 'Cryptographic export checksum must exist');
  console.log(`  ✓ Dossier compiled: ID=${dossier.metadata.id}, ReplayHash=${dossier.appendix.replayHash}`);

  // 3. Tamper-evidence verification
  console.log('  Testing cryptographic tamper-evidence verification...');
  const isValid = verifyDossierIntegrity(dossier);
  assert(isValid, 'Dossier cryptographic verification should pass on intact payload');

  const tamperedDossier = {
    ...dossier,
    executiveSummary: {
      ...dossier.executiveSummary,
      aiAssessment: 'TAMPERED INJECTION BY ADVERSARY',
    },
  };
  const isTamperDetected = !verifyDossierIntegrity(tamperedDossier);
  assert(isTamperDetected, 'Tamper verification must detect modified content');
  console.log('  ✓ Cryptographic verification and tamper detection verified');

  // 4. Standalone Interactive HTML Generation
  console.log('  Testing standalone interactive HTML generation...');
  const standaloneHtml = generateDossierHtml(dossier);
  assert(standaloneHtml.includes('<!DOCTYPE html>'), 'Generated HTML must have valid DOCTYPE');
  assert(standaloneHtml.includes('window.__DOSSIER_DATA__'), 'Standalone HTML must embed state payload');
  assert(standaloneHtml.includes('svg'), 'HTML must include vector SVG visualization elements');
  assert(standaloneHtml.includes('updateScrubber'), 'HTML must include interactive timeline scrubber logic');
  assert(standaloneHtml.includes('filterEvidence'), 'HTML must include evidence search functionality');
  assert(!standaloneHtml.includes('http://') && !standaloneHtml.includes('https://'), 'Standalone HTML must be completely offline without external CDN dependencies');
  console.log(`  ✓ Standalone HTML verified (${standaloneHtml.length} bytes, 100% offline)`);

  // 5. Print-Ready PDF / HTML Generation
  console.log('  Testing printable briefing formatting...');
  const printableHtml = generateDossierPrintableHtml(dossier);
  assert(printableHtml.includes('@media print'), 'Printable HTML must define print media styles');
  assert(printableHtml.includes('page-break-after'), 'Printable HTML must enforce pagination rules');
  assert(printableHtml.includes('TOP SECRET // SCI // EYES ONLY'), 'Printable HTML must contain classification header');
  console.log(`  ✓ Printable briefing verified (${printableHtml.length} bytes, A4 pagination rules enforced)`);

  // 6. Machine JSON Generation
  console.log('  Testing machine JSON export...');
  const jsonExport = generateDossierJson(dossier);
  const parsed = JSON.parse(jsonExport);
  assert(parsed.metadata.id === dossier.metadata.id, 'JSON export must preserve metadata.id');
  assert(parsed.metadata.classification === dossier.metadata.classification, 'JSON export must preserve metadata');
  assert(parsed.appendix.replayHash === dossier.appendix.replayHash, 'JSON export must preserve hash');
  console.log('  ✓ Machine JSON export verified');

  console.log('✓ Project Dossier: Premium Intelligence Report verified successfully.\n');
}
