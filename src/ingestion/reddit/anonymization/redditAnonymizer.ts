/**
 * Social Gravity V2 - Reddit Privacy & Deterministic Anonymizer
 *
 * Implements salted HMAC-SHA-256 pseudonymization for Reddit usernames.
 * Replaces in-text mentions (e.g. u/alice -> u/Redditor_7A4F) and provides
 * reversible research codebooks while preventing raw PII leaks into exported graphs.
 */

import { Anonymizer } from '../../anonymization/anonymizer';

export interface AnonymizedIdentity {
  originalId: string;
  canonicalId: string;
  label: string;
}

export interface RedditAnonymizerConfig {
  salt?: string;
  prefix?: string;
  labelPrefix?: string;
  preserveBots?: boolean;
}

export class RedditAnonymizer {
  private baseAnonymizer: Anonymizer;
  private static readonly SPECIAL_USERS = new Set(['[deleted]', '[removed]', 'automoderator']);

  constructor(config: RedditAnonymizerConfig = {}) {
    const salt = config.salt || (typeof process !== 'undefined' && process.env ? process.env.SG_ANONYMIZATION_SALT : undefined) || 'social_gravity_reddit_salt_v2';
    this.baseAnonymizer = new Anonymizer({
      salt,
      prefix: config.prefix || 'red_',
      labelPrefix: config.labelPrefix || 'Redditor_',
    });
  }

  /**
   * Normalizes a Reddit username by stripping leading /u/ or u/.
   */
  public normalizeUsername(username: string): string {
    if (!username) return '[deleted]';
    return username.trim().replace(/^\/?u\//i, '');
  }

  /**
   * Checks if an identity is a special non-human or deleted entity.
   */
  public isSpecialUser(username: string): boolean {
    const norm = this.normalizeUsername(username).toLowerCase();
    return RedditAnonymizer.SPECIAL_USERS.has(norm);
  }

  /**
   * Anonymizes a Reddit username.
   */
  public anonymize(username: string): AnonymizedIdentity {
    const norm = this.normalizeUsername(username);
    if (this.isSpecialUser(norm)) {
      return {
        originalId: norm,
        canonicalId: norm,
        label: norm,
      };
    }
    const res = this.baseAnonymizer.anonymize(norm);
    return {
      originalId: norm,
      canonicalId: res.canonicalId,
      label: res.label,
    };
  }

  /**
   * De-anonymizes a canonical ID back to original username if codebook is available.
   */
  public deAnonymize(canonicalId: string): string | undefined {
    if (this.isSpecialUser(canonicalId)) return canonicalId;
    return this.baseAnonymizer.deAnonymize(canonicalId);
  }

  /**
   * Gets user-facing pseudonymous label (e.g., "Redditor_A1B2").
   */
  public getLabel(canonicalId: string): string {
    if (this.isSpecialUser(canonicalId)) return canonicalId;
    return this.baseAnonymizer.getLabel(canonicalId);
  }

  /**
   * Anonymizes all Reddit user mentions inside a comment body.
   * e.g. "Thanks u/alice and /u/bob!" -> "Thanks u/Redditor_89F1 and /u/Redditor_2A10!"
   */
  public anonymizeTextMentions(text: string): string {
    if (!text) return '';
    const mentionRegex = /(^|[\s(])(\/?u\/)([A-Za-z0-9_-]+)/g;

    return text.replace(mentionRegex, (match, prefix, uPrefix, username) => {
      if (this.isSpecialUser(username)) {
        return match;
      }
      const anon = this.anonymize(username);
      return `${prefix}${uPrefix}${anon.label}`;
    });
  }

  /**
   * Exports the underlying identity mapping codebook.
   */
  public exportCodebook(): Record<string, string> {
    const rawJson = this.baseAnonymizer.exportMapping();
    const parsed = JSON.parse(rawJson);
    const book: Record<string, string> = {};
    if (Array.isArray(parsed.mappings)) {
      for (const m of parsed.mappings) {
        book[m.raw] = m.canonical;
      }
    }
    return book;
  }

  /**
   * Imports a pre-existing codebook.
   */
  public importCodebook(codebook: Record<string, string>): void {
    const mappings = Object.entries(codebook).map(([raw, canonical]) => ({
      raw,
      canonical,
      label: `Redditor_${canonical.slice(-4)}`,
    }));
    this.baseAnonymizer.importMapping(JSON.stringify({ mappings }));
  }
}
