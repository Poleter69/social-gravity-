export class DedupStore {
  private seen = new Map<string, number>(); // id -> timestamp
  private duplicatesSkipped = 0;
  private maxCapacity = 50_000;

  constructor(private windowMs: number = 3_600_000) {} // Default 1 hour instead of 5 minutes

  has(id: string): boolean {
    const t = this.seen.get(id);
    if (t === undefined) return false;
    if (Date.now() - t > this.windowMs) {
      this.seen.delete(id);
      return false;
    }
    return true;
  }

  add(id: string): void {
    this.seen.set(id, Date.now());
    // Prune only when reaching large capacity
    if (this.seen.size > this.maxCapacity) {
      this.prune();
    }
  }

  /**
   * Checks if an ID has been seen. If so, increments duplicatesSkipped and returns true.
   * Otherwise records the ID and returns false.
   */
  hasAndAdd(id: string): boolean {
    if (this.has(id)) {
      this.duplicatesSkipped++;
      return true;
    }
    this.add(id);
    return false;
  }

  recordDuplicate(): void {
    this.duplicatesSkipped++;
  }

  getDuplicatesSkipped(): number {
    return this.duplicatesSkipped;
  }

  prune(): void {
    const cutoff = Date.now() - this.windowMs;
    for (const [id, t] of this.seen) {
      if (t < cutoff) this.seen.delete(id);
    }
    // If still over capacity after time prune, remove oldest entries
    if (this.seen.size > this.maxCapacity) {
      const excess = this.seen.size - this.maxCapacity;
      const keys = this.seen.keys();
      for (let i = 0; i < excess; i++) {
        const next = keys.next();
        if (next.done) break;
        this.seen.delete(next.value);
      }
    }
  }

  clear(): void {
    this.seen.clear();
    this.duplicatesSkipped = 0;
  }

  get size(): number {
    return this.seen.size;
  }
}
