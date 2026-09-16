/**
 * Social Gravity - Enterprise Operations Layer Manager
 * Milestone M17: RBAC, Tamper-Evident SHA-256 Audit Logging, Encrypted Workspaces, Activity Attribution
 */

import {
  EnterpriseRole,
  EnterprisePermission,
  EnterpriseUser,
  AuditEvent,
  AuditVerificationResult,
  EnterpriseWorkspace,
  ActivityFilter,
} from './types';
import { sha256Sync, encryptAESGCM, decryptAESGCM } from './crypto';

const ROLE_PERMISSIONS: Record<EnterpriseRole, EnterprisePermission[]> = {
  admin: [
    'run_simulation',
    'view_raw_intelligence',
    'modify_interventions',
    'export_dossiers',
    'view_audit_logs',
    'manage_workspaces',
    'manage_users',
    'decrypt_vaults',
    'trigger_ablations',
  ],
  senior_analyst: [
    'run_simulation',
    'view_raw_intelligence',
    'modify_interventions',
    'export_dossiers',
    'decrypt_vaults',
    'trigger_ablations',
  ],
  field_investigator: [
    'run_simulation',
    'view_raw_intelligence',
    'export_dossiers',
  ],
  auditor: [
    'view_audit_logs',
    'view_raw_intelligence',
    'export_dossiers',
  ],
};

export class EnterpriseOperationsManager {
  private users: Map<string, EnterpriseUser> = new Map();
  private workspaces: Map<string, EnterpriseWorkspace> = new Map();
  private auditChain: AuditEvent[] = [];
  private static readonly GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

  constructor() {
    // Seed default administrator
    this.createUser({
      id: 'usr-admin-default',
      name: 'Chief Security Officer',
      email: 'cso@socialgravity.internal',
      role: 'admin',
      workspaceIds: ['ws-global'],
    });

    // Seed default global workspace
    this.createWorkspace('usr-admin-default', 'Global Intelligence Operations', 'Primary operational workspace');
  }

  // --- RBAC User Management ---

  public createUser(params: Omit<EnterpriseUser, 'createdAt' | 'active'>): EnterpriseUser {
    const user: EnterpriseUser = {
      ...params,
      createdAt: new Date().toISOString(),
      active: true,
    };
    this.users.set(user.id, user);

    this.logAuditEvent(user.id, 'user.created', {
      createdUserId: user.id,
      role: user.role,
    });

    return user;
  }

  public getUser(userId: string): EnterpriseUser | undefined {
    return this.users.get(userId);
  }

  public hasPermission(userId: string, permission: EnterprisePermission): boolean {
    const user = this.users.get(userId);
    if (!user || !user.active) return false;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
  }

  // --- Workspaces & Sandboxing ---

  public createWorkspace(
    ownerId: string,
    name: string,
    description: string,
    metadata: Record<string, unknown> = {}
  ): EnterpriseWorkspace {
    if (!this.hasPermission(ownerId, 'manage_workspaces') && !this.hasPermission(ownerId, 'modify_interventions')) {
      throw new Error(`User ${ownerId} does not have permission to manage workspaces.`);
    }

    const workspaceId = `ws-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const workspace: EnterpriseWorkspace = {
      workspaceId,
      name,
      description,
      ownerId,
      memberIds: [ownerId],
      isEncrypted: false,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.workspaces.set(workspaceId, workspace);

    // Add workspace to user's permitted list
    const owner = this.users.get(ownerId);
    if (owner && !owner.workspaceIds.includes(workspaceId)) {
      owner.workspaceIds.push(workspaceId);
    }

    this.logAuditEvent(ownerId, 'workspace.created', { workspaceId, name }, workspaceId);
    return workspace;
  }

  public async encryptWorkspaceVault(
    userId: string,
    workspaceId: string,
    secretData: string,
    passphrase: string
  ): Promise<EnterpriseWorkspace> {
    if (!this.hasPermission(userId, 'decrypt_vaults')) {
      throw new Error(`User ${userId} lacks 'decrypt_vaults' permission.`);
    }

    const ws = this.workspaces.get(workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found.`);

    const encryptedVault = await encryptAESGCM(secretData, passphrase);
    ws.isEncrypted = true;
    ws.encryptedVault = encryptedVault;
    ws.updatedAt = new Date().toISOString();

    this.logAuditEvent(userId, 'workspace.vault_encrypted', { workspaceId }, workspaceId);
    return ws;
  }

  public async decryptWorkspaceVault(
    userId: string,
    workspaceId: string,
    passphrase: string
  ): Promise<string> {
    if (!this.hasPermission(userId, 'decrypt_vaults')) {
      throw new Error(`User ${userId} lacks 'decrypt_vaults' permission.`);
    }

    const ws = this.workspaces.get(workspaceId);
    if (!ws || !ws.encryptedVault) {
      throw new Error(`Workspace ${workspaceId} has no encrypted vault.`);
    }

    const decrypted = await decryptAESGCM(ws.encryptedVault, passphrase);

    this.logAuditEvent(userId, 'workspace.vault_decrypted', { workspaceId }, workspaceId);
    return decrypted;
  }

  public getWorkspace(workspaceId: string): EnterpriseWorkspace | undefined {
    return this.workspaces.get(workspaceId);
  }

  // --- Tamper-Evident SHA-256 Audit Log ---

  public logAuditEvent(
    userId: string,
    action: string,
    details: Record<string, unknown>,
    workspaceId?: string
  ): AuditEvent {
    const sequence = this.auditChain.length;
    const prevHash = sequence === 0 ? EnterpriseOperationsManager.GENESIS_HASH : this.auditChain[sequence - 1].hash;
    const timestamp = new Date().toISOString();
    const eventId = `audit-${sequence}-${Date.now()}`;

    const payloadHash = sha256Sync(JSON.stringify(details));
    const headerString = `${prevHash}:${sequence}:${timestamp}:${userId}:${action}:${payloadHash}:${workspaceId || ''}`;
    const hash = sha256Sync(headerString);

    const event: AuditEvent = {
      eventId,
      sequence,
      timestamp,
      userId,
      action,
      workspaceId,
      details,
      payloadHash,
      prevHash,
      hash,
    };

    this.auditChain.push(event);
    return event;
  }

  public verifyAuditIntegrity(): AuditVerificationResult {
    const totalEvents = this.auditChain.length;
    const verifiedAt = new Date().toISOString();

    for (let i = 0; i < totalEvents; i++) {
      const event = this.auditChain[i];

      // Verify sequence numbering
      if (event.sequence !== i) {
        return {
          isValid: false,
          totalEvents,
          brokenIndex: i,
          errorReason: `Sequence mismatch at index ${i}: expected ${i}, got ${event.sequence}`,
          verifiedAt,
        };
      }

      // Verify prevHash linkage
      const expectedPrevHash = i === 0 ? EnterpriseOperationsManager.GENESIS_HASH : this.auditChain[i - 1].hash;
      if (event.prevHash !== expectedPrevHash) {
        return {
          isValid: false,
          totalEvents,
          brokenIndex: i,
          errorReason: `Broken hash chain at index ${i}: prevHash does not match prior block hash`,
          verifiedAt,
        };
      }

      // Verify payload hash
      const recalculatedPayloadHash = sha256Sync(JSON.stringify(event.details));
      if (event.payloadHash !== recalculatedPayloadHash) {
        return {
          isValid: false,
          totalEvents,
          brokenIndex: i,
          errorReason: `Payload tampering detected at index ${i}`,
          verifiedAt,
        };
      }

      // Verify block hash
      const headerString = `${event.prevHash}:${event.sequence}:${event.timestamp}:${event.userId}:${event.action}:${event.payloadHash}:${event.workspaceId || ''}`;
      const recalculatedHash = sha256Sync(headerString);
      if (event.hash !== recalculatedHash) {
        return {
          isValid: false,
          totalEvents,
          brokenIndex: i,
          errorReason: `Header hash mismatch at index ${i}`,
          verifiedAt,
        };
      }
    }

    return {
      isValid: true,
      totalEvents,
      verifiedAt,
    };
  }

  public queryAuditLogs(filter: ActivityFilter = {}): AuditEvent[] {
    let results = [...this.auditChain];

    if (filter.userId) {
      results = results.filter(ev => ev.userId === filter.userId);
    }
    if (filter.workspaceId) {
      results = results.filter(ev => ev.workspaceId === filter.workspaceId);
    }
    if (filter.action) {
      results = results.filter(ev => ev.action.includes(filter.action!));
    }
    if (filter.since) {
      const sinceTime = new Date(filter.since).getTime();
      results = results.filter(ev => new Date(ev.timestamp).getTime() >= sinceTime);
    }
    if (filter.limit && filter.limit > 0) {
      results = results.slice(-filter.limit);
    }

    return results;
  }
}
