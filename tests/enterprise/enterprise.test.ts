/**
 * Social Gravity - Enterprise Operations Layer Tests (Milestone M17)
 */

import { EnterpriseOperationsManager } from '../../src/enterprise';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function testEnterpriseOperations() {
  console.log('--- Testing Milestone M17: Enterprise Operations Layer ---');

  const mgr = new EnterpriseOperationsManager();

  // 1. RBAC enforcement
  const analyst = mgr.createUser({
    id: 'usr-analyst-1',
    name: 'Agent Mulder',
    email: 'mulder@sg.internal',
    role: 'senior_analyst',
    workspaceIds: [],
  });

  const investigator = mgr.createUser({
    id: 'usr-investigator-1',
    name: 'Agent Scully',
    email: 'scully@sg.internal',
    role: 'field_investigator',
    workspaceIds: [],
  });

  assert(mgr.hasPermission(analyst.id, 'modify_interventions') === true, 'Senior analyst should have modify_interventions');
  assert(mgr.hasPermission(analyst.id, 'manage_users') === false, 'Senior analyst should not have manage_users');
  assert(mgr.hasPermission(investigator.id, 'modify_interventions') === false, 'Field investigator should not have modify_interventions');
  assert(mgr.hasPermission(investigator.id, 'run_simulation') === true, 'Field investigator should have run_simulation');
  console.log('  ✓ RBAC role permissions verified');

  // 2. Tamper-evident SHA-256 audit chain
  mgr.logAuditEvent('usr-admin-default', 'simulation.start', { seed: 42, rounds: 50 });
  mgr.logAuditEvent('usr-admin-default', 'intervention.apply', { type: 'debunk', target: 'node-12' });
  mgr.logAuditEvent('usr-admin-default', 'report.export', { format: 'pdf' });

  const initialCheck = mgr.verifyAuditIntegrity();
  assert(initialCheck.isValid === true, 'Initial audit log must be valid');
  assert(initialCheck.totalEvents >= 4, 'Must have recorded genesis and user events');

  // Tampering detection
  const chain = (mgr as any).auditChain;
  const tamperedEvent = { ...chain[2] };
  tamperedEvent.details = { ...tamperedEvent.details, tamperedField: true };
  chain[2] = tamperedEvent;

  const corruptedCheck = mgr.verifyAuditIntegrity();
  assert(corruptedCheck.isValid === false, 'Tampering must be detected');
  assert(corruptedCheck.brokenIndex === 2, 'Broken index must identify corrupted event');
  console.log('  ✓ SHA-256 tamper-evident audit chain and corruption detection verified');

  // Restore chain for subsequent tests
  (mgr as any).auditChain.pop();

  // 3. Encrypted workspace vault (AES-GCM-256)
  const ws = mgr.createWorkspace('usr-admin-default', 'Classified Operation', 'Sensitive op notes');
  const secretPayload = JSON.stringify({
    targetPersonas: ['influencer-alpha', 'botnet-coordinator'],
    confidentialBrief: 'Operation Silver Cascade counter-measure deployment.',
  });
  const passphrase = 'SuperSecretAnalystPassphrase123!';

  const updatedWs = await mgr.encryptWorkspaceVault('usr-admin-default', ws.workspaceId, secretPayload, passphrase);
  assert(updatedWs.isEncrypted === true, 'Workspace should be marked encrypted');
  assert(updatedWs.encryptedVault?.algorithm === 'AES-GCM-256', 'Algorithm must be AES-GCM-256');

  const decrypted = await mgr.decryptWorkspaceVault('usr-admin-default', ws.workspaceId, passphrase);
  assert(decrypted === secretPayload, 'Decrypted vault payload must match original');
  console.log('  ✓ Client-side AES-GCM-256 workspace vault encryption and decryption verified');

  console.log('✓ Enterprise Operations Layer validated successfully.\n');
}
