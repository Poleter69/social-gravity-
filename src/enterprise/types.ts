/**
 * Social Gravity - Enterprise Operations Layer Types
 * Milestone M17: RBAC, Tamper-Evident Audit Logging, Workspace Encryption, Activity Attribution
 */

export type EnterpriseRole = 'admin' | 'senior_analyst' | 'field_investigator' | 'auditor';

export type EnterprisePermission =
  | 'run_simulation'
  | 'view_raw_intelligence'
  | 'modify_interventions'
  | 'export_dossiers'
  | 'view_audit_logs'
  | 'manage_workspaces'
  | 'manage_users'
  | 'decrypt_vaults'
  | 'trigger_ablations';

export interface EnterpriseUser {
  id: string;
  name: string;
  email: string;
  role: EnterpriseRole;
  workspaceIds: string[];
  createdAt: string;
  active: boolean;
}

export interface AuditEvent {
  eventId: string;
  sequence: number;
  timestamp: string;
  userId: string;
  action: string;
  workspaceId?: string;
  details: Record<string, unknown>;
  payloadHash: string;
  prevHash: string;
  hash: string;
}

export interface AuditVerificationResult {
  isValid: boolean;
  totalEvents: number;
  brokenIndex?: number;
  errorReason?: string;
  verifiedAt: string;
}

export interface EncryptedPayload {
  cipherText: string;
  iv: string;
  salt: string;
  algorithm: 'AES-GCM-256';
}

export interface EnterpriseWorkspace {
  workspaceId: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  isEncrypted: boolean;
  encryptedVault?: EncryptedPayload;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityFilter {
  userId?: string;
  workspaceId?: string;
  action?: string;
  since?: string;
  limit?: number;
}
