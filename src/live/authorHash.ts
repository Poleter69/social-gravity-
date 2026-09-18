/**
 * Social Gravity — Milestone M21: Privacy-Preserving Author Hashing
 * Hashes incoming author identifiers into deterministic, non-reversible SHA-256 pseudonyms.
 * Ensures raw platform IDs are never exposed internally or leaked into memory logs.
 */

import { sha256Sync } from '../enterprise/crypto';

const SALT = 'sg-privacy-v3-m21';

export function hashAuthorId(rawId: string): string {
  if (!rawId) return 'usr_anon_0000';
  const digest = sha256Sync(`${SALT}:${rawId.trim()}`);
  return `usr_${digest.substring(0, 14)}`;
}

export function sanitizePublicAuthorName(rawName: string, isPublicDisplayAllowed: boolean = true): string {
  if (!isPublicDisplayAllowed || !rawName) {
    return 'Anonymous Analyst';
  }
  return rawName;
}
