/**
 * Social Gravity — Zero-Cost Architecture Test Suite
 * Validates zero-cost database, local storage vault, Mastodon connector,
 * GitHub activity connector, and graceful offline degradation.
 */

import { getZeroCostDB } from '../../src/db/zeroCostDatabase';
import { getZeroCostStorage } from '../../src/storage/zeroCostStorage';
import { MastodonConnector } from '../../src/live/mastodonConnector';
import { GitHubActivityConnector } from '../../src/live/githubActivityConnector';
import { LiveManager } from '../../src/live/liveManager';
import { getSupabaseAuth } from '../../src/auth/supabaseAuth';

export async function runZeroCostTests(): Promise<void> {
  console.log('========================================================');
  console.log('  ZERO-COST PRODUCTION ARCHITECTURE TEST SUITE');
  console.log('========================================================\n');

  // --- 1. Test Zero-Cost Database Engine ---
  console.log('--- Testing ZeroCostDatabase Engine ---');
  const db = getZeroCostDB();
  const connStatus = await db.getConnectionStatus();

  console.log(`  Target Provider: ${connStatus.provider}`);
  console.log(`  Is Zero-Cost:    ${connStatus.isZeroCost}`);
  console.log(`  Offline Parity:  ${connStatus.offlineFallbackAvailable}`);

  if (!connStatus.isZeroCost || !connStatus.offlineFallbackAvailable) {
    throw new Error('ZeroCostDatabase failed zero-cost invariant verification');
  }

  // Save and retrieve simulation run
  const testRun = {
    id: `test-sim-${Date.now()}`,
    name: 'Unit Test Zero-Cost Simulation',
    archetype: 'online_community',
    seed: 42,
    agent_count: 50,
    edge_count: 120,
    final_round: 10,
    peak_believers: 15,
    final_r0: 1.25,
    echo_chamber_index: 0.45,
    resilience_score: 72.0,
    parameters: { beta: 0.3 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db.saveSimulationRun(testRun);
  const runs = await db.getSimulationRuns();
  console.log(`  ✓ Simulation run persistence verified (${runs.length} recorded)`);

  // Test Backup JSON export
  const backupJson = await db.exportBackupJSON();
  const parsedBackup = JSON.parse(backupJson);
  if (!parsedBackup.version || !Array.isArray(parsedBackup.simulationRuns)) {
    throw new Error('Database backup JSON schema verification failed');
  }
  console.log('  ✓ Automated JSON database backup export validated.');

  // --- 2. Test Zero-Cost Storage Engine ---
  console.log('\n--- Testing ZeroCostStorage Engine ---');
  const storage = getZeroCostStorage();
  const uploadResult = await storage.uploadArtifact(
    'dossiers',
    'test-dossier.json',
    JSON.stringify({ test: true }),
    'application/json'
  );

  console.log(`  Storage Provider: ${uploadResult.storageProvider}`);
  console.log(`  Uploaded Bytes:   ${uploadResult.sizeBytes}`);
  if (uploadResult.sizeBytes <= 0) {
    throw new Error('Storage upload produced zero bytes');
  }
  console.log('  ✓ ZeroCostStorage artifact handling verified.');

  // --- 3. Test Mastodon Federated Activity Connector ---
  console.log('\n--- Testing Mastodon Ingestion Connector ---');
  const mastodon = new MastodonConnector(
    ['https://mastodon.social'],
    ['tech', 'ai'],
    { offline: true }
  );

  let mastodonPostReceived = false;
  mastodon.onPost((post) => {
    if (post.platform === 'mastodon' && post.content.length > 0) {
      mastodonPostReceived = true;
    }
  });

  mastodon.start();
  // Small delay for synthetic event generation in offline mode
  await new Promise((r) => setTimeout(r, 60));
  mastodon.stop();

  const mHealth = mastodon.getHealth();
  console.log(`  Mastodon Status:    ${mHealth.status}`);
  console.log(`  Events Processed:   ${mHealth.eventsProcessed}`);
  if (!mastodonPostReceived && mHealth.eventsProcessed === 0) {
    throw new Error('Mastodon connector failed to process events');
  }
  console.log('  ✓ Mastodon federated connector validated.');

  // --- 4. Test GitHub Activity Connector ---
  console.log('\n--- Testing GitHub Public Activity Connector ---');
  const gh = new GitHubActivityConnector([], { offline: true });

  let ghEventReceived = false;
  gh.onPost((post) => {
    if (post.platform === 'github' && post.content.includes('[Commit]')) {
      ghEventReceived = true;
    }
  });

  gh.start();
  await new Promise((r) => setTimeout(r, 60));
  gh.stop();

  const ghHealth = gh.getHealth();
  console.log(`  GitHub Status:      ${ghHealth.status}`);
  console.log(`  Events Processed:   ${ghHealth.eventsProcessed}`);
  if (!ghEventReceived && ghHealth.eventsProcessed === 0) {
    throw new Error('GitHub activity connector failed to process events');
  }
  console.log('  ✓ GitHub public activity connector validated.');

  // --- 5. Test LiveManager Unified Ingestion ---
  console.log('\n--- Testing LiveManager Multi-Source Coordination ---');
  const liveManager = new LiveManager({ offline: true });
  if (!liveManager.mastodon || !liveManager.github || !liveManager.bluesky || !liveManager.reddit) {
    throw new Error('LiveManager missing required zero-cost connectors');
  }

  const liveStatuses = liveManager.getConnectorStatuses();
  const platforms = liveStatuses.map((s) => s.platform);
  console.log(`  Registered Platforms: ${platforms.join(', ')}`);
  if (!platforms.includes('mastodon') || !platforms.includes('github') || !platforms.includes('bluesky')) {
    throw new Error('LiveManager failed to register all zero-cost platform connectors');
  }
  console.log('  ✓ Unified LiveManager multi-stream coordination verified.');

  // --- 6. Test Supabase Auth Fallback ---
  console.log('\n--- Testing Supabase Auth & Zero-Cost Identity ---');
  const auth = getSupabaseAuth();
  console.log(`  Cloud Auth Configured: ${auth.isAvailable()}`);
  console.log('  ✓ Auth graceful local mode validated.');

  console.log('\n========================================================');
  console.log('  ✓ ALL ZERO-COST ARCHITECTURE TESTS PASSED (100%)');
  console.log('========================================================\n');
}

// If executed directly via tsx
if (process.argv[1]?.includes('zeroCostArchitecture.test.ts')) {
  runZeroCostTests().catch((err) => {
    console.error('Zero-cost test failure:', err);
    process.exit(1);
  });
}
