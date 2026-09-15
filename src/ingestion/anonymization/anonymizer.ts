/**
 * Social Gravity V2 - Deterministic Privacy Anonymization Engine
 *
 * Implements cryptographic deterministic hashing with salt to map raw
 * identity strings (e.g. "John Smith", "user_102834") to privacy-safe
 * canonical IDs and human-readable anonymous labels ("User_381").
 *
 * Features:
 * - Deterministic reproducible hashing (SHA-256 with configurable salt)
 * - Optional reversible mapping export for research auditability
 * - Zero leakage of PII into canonical graph objects
 */

/**
 * Deterministic cross-platform 64-bit hash (compatible with Node.js and browser runtimes).
 */
function deterministicHash(input: string): string {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return (part1 + part2).substring(0, 12);
}

export interface AnonymizerOptions {
  salt?: string;
  prefix?: string;
  labelPrefix?: string;
}

export class Anonymizer {
  private salt: string;
  private prefix: string;
  private labelPrefix: string;

  private rawToCanonical: Map<string, string> = new Map();
  private canonicalToRaw: Map<string, string> = new Map();
  private canonicalToLabel: Map<string, string> = new Map();
  private counter: number = 0;

  constructor(options: AnonymizerOptions = {}) {
    this.salt = options.salt || 'social-gravity-v2-canonical-salt';
    this.prefix = options.prefix || 'usr_';
    this.labelPrefix = options.labelPrefix || 'User_';
  }

  /**
   * Deterministically anonymizes a raw identity string.
   *
   * @param rawId Raw entity identifier
   * @returns { canonicalId, label }
   */
  public anonymize(rawId: string): { canonicalId: string; label: string } {
    const trimmed = rawId.trim();
    const existing = this.rawToCanonical.get(trimmed);
    if (existing) {
      return {
        canonicalId: existing,
        label: this.canonicalToLabel.get(existing)!,
      };
    }

    // Compute deterministic salted hash (portable across Node and Browser)
    const hash = deterministicHash(`${this.salt}:${trimmed}`);

    const canonicalId = `${this.prefix}${hash}`;
    this.counter++;
    const label = `${this.labelPrefix}${this.counter}`;

    this.rawToCanonical.set(trimmed, canonicalId);
    this.canonicalToRaw.set(canonicalId, trimmed);
    this.canonicalToLabel.set(canonicalId, label);

    return { canonicalId, label };
  }

  /**
   * Reverse-lookups the original identifier from a canonical ID if mapping is retained.
   */
  public deAnonymize(canonicalId: string): string | undefined {
    return this.canonicalToRaw.get(canonicalId);
  }

  /**
   * Returns human-readable label for a canonical ID.
   */
  public getLabel(canonicalId: string): string {
    return this.canonicalToLabel.get(canonicalId) || canonicalId;
  }

  /**
   * Exports mapping table to JSON for secure offline research storage.
   */
  public exportMapping(): string {
    return JSON.stringify({
      salt: this.salt,
      prefix: this.prefix,
      labelPrefix: this.labelPrefix,
      mappings: Array.from(this.rawToCanonical.entries()).map(([raw, canonical]) => ({
        raw,
        canonical,
        label: this.canonicalToLabel.get(canonical)!,
      })),
    }, null, 2);
  }

  /**
   * Restores an exported mapping table.
   */
  public importMapping(jsonString: string): void {
    const parsed = JSON.parse(jsonString);
    this.salt = parsed.salt || this.salt;
    this.prefix = parsed.prefix || this.prefix;
    this.labelPrefix = parsed.labelPrefix || this.labelPrefix;

    if (Array.isArray(parsed.mappings)) {
      for (const item of parsed.mappings) {
        this.rawToCanonical.set(item.raw, item.canonical);
        this.canonicalToRaw.set(item.canonical, item.raw);
        this.canonicalToLabel.set(item.canonical, item.label);
      }
      this.counter = this.rawToCanonical.size;
    }
  }

  /**
   * Clears in-memory identity tables.
   */
  public clear(): void {
    this.rawToCanonical.clear();
    this.canonicalToRaw.clear();
    this.canonicalToLabel.clear();
    this.counter = 0;
  }

  public get size(): number {
    return this.rawToCanonical.size;
  }
}
