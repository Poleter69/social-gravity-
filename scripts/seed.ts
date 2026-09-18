/**
 * Social Gravity — Zero-Cost Database Seed Runner
 * Usage: npx tsx scripts/seed.ts
 */

import { getZeroCostDB } from '../src/db/zeroCostDatabase';
import { SimulationRunRecord, InvestigationRecord, IntelligenceDossierRecord } from '../src/db/types';

async function runSeed() {
  console.log('========================================================');
  console.log('  SOCIAL GRAVITY — ZERO-COST DATABASE SEED RUNNER');
  console.log('========================================================\n');

  const db = getZeroCostDB();
  const status = await db.getConnectionStatus();

  console.log(`Target Provider:  ${status.provider}`);
  console.log(`Database Name:    ${status.databaseName}`);
  console.log(`Is Zero-Cost:     ${status.isZeroCost}`);
  console.log(`Latency:          ${status.latencyMs}ms\n`);

  // 1. Seed Simulation
  const benchmarkSim: SimulationRunRecord = {
    id: 'sim-benchmark-panic-01',
    name: 'Viral Algorithmic Panic Benchmark (r/all Contagion)',
    archetype: 'online_community',
    seed: 42,
    agent_count: 150,
    edge_count: 428,
    final_round: 40,
    peak_believers: 89,
    final_r0: 2.65,
    echo_chamber_index: 0.742,
    resilience_score: 58.5,
    parameters: { beta: 0.45, lambda: 0.08, initialBelievers: 3, counterInterventionRound: 15 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log('-> Seeding benchmark simulation run: sim-benchmark-panic-01...');
  await db.saveSimulationRun(benchmarkSim);
  console.log('   ✓ Simulation run saved.');

  // 2. Seed Investigation
  const benchmarkInvestigation: InvestigationRecord = {
    id: 'inv-benchmark-cascade-2026',
    title: 'Investigation: Multi-Cluster Panic Vector in Subreddit Networks',
    description: 'Empirical forensic investigation on echo-chamber polarization and hub node vulnerability.',
    author: 'Lead Social Intelligence Analyst',
    status: 'open',
    simulation_seed: 42,
    society_archetype: 'online_community',
    active_rumor_topic: 'Critical Supply Chain Breakdown Rumor',
    bookmarks: [
      {
        id: 'bm-1',
        round: 15,
        label: 'Peak Polarization',
        notes: 'Echo chamber index crossed 0.70 threshold',
        author: 'Lead Analyst',
        createdAt: Date.now(),
      },
    ],
    annotations: [
      {
        id: 'ann-1',
        agentId: 'node-12',
        round: 15,
        tag: 'Super-Spreader',
        notes: 'Node betweenness centrality top 1%',
        author: 'Lead Analyst',
        createdAt: Date.now(),
      },
    ],
    pinned_evidence: [
      {
        id: 'ev-1',
        type: 'telemetry',
        title: 'R0 Spike',
        summary: 'Reproduction rate peaked at 2.65 prior to community debunking',
        dataSnapshot: {},
        pinnedBy: 'Lead Analyst',
        pinnedAt: Date.now(),
      },
    ],
    comments: [
      {
        id: 'cm-1',
        author: 'Senior Researcher',
        content: 'Recommend testing targeted counter-messaging at bridging nodes rather than broadcast announcements.',
        timestamp: Date.now(),
        status: 'open',
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log('-> Seeding benchmark investigation: inv-benchmark-cascade-2026...');
  await db.saveInvestigation(benchmarkInvestigation);
  console.log('   ✓ Investigation record saved.');

  // 3. Seed Dossier
  const benchmarkDossier: IntelligenceDossierRecord = {
    id: 'DOSSIER-SG-BENCHMARK-01',
    simulation_id: 'sim-benchmark-panic-01',
    title: 'Comprehensive Threat & Contagion Assessment: Algorithmic Amplification',
    verdict: 'ACCELERATED_DIFFUSION_DETECTED',
    threat_level: 'HIGH',
    resilience_score: 58.5,
    executive_summary:
      'Empirical simulation demonstrates that decentralized peer networks without institutional trust mediators undergo hyper-exponential rumor adoption when seeded across high-degree bridge nodes.',
    top_hypotheses: [
      { title: 'Bridging Node Amplification', confidence: 0.89, explanation: '3 bridge nodes accounted for 64% of transmissions' },
    ],
    recommended_interventions: [
      { priority: 'HIGH', strategy: 'Peer Ambassador Inoculation', expectedImpact: '48% reduction in peak cascade volume' },
    ],
    replay_hash: '0x78f98c62e84b91f2c67a39d4810b54ad78c278f9',
    tamper_seal: 'SEAL-SG-SHA256-VERIFIED-2026',
    created_at: new Date().toISOString(),
  };

  console.log('-> Seeding intelligence dossier: DOSSIER-SG-BENCHMARK-01...');
  await db.saveDossier(benchmarkDossier);
  console.log('   ✓ Intelligence dossier saved.');

  console.log('\n========================================================');
  console.log('  DATABASE SEED COMPLETED SUCCESSFULLY (100% Zero-Cost)');
  console.log('========================================================\n');
}

runSeed().catch((err) => {
  console.error('Seed execution error:', err);
  process.exit(1);
});
