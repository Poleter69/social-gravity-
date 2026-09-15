// Tracks seen post IDs within a time window to suppress duplicates
export class DedupStore {
  private seen = new Map<string, number>(); // id -> timestamp
  constructor(private windowMs: number = 300_000) {}

  has(id: string): boolean {
    const t = this.seen.get(id);
    if (t === undefined) return false;
    if (Date.now() - t > this.windowMs) { this.seen.delete(id); return false; }
    return true;
  }

  add(id: string): void {
    this.seen.set(id, Date.now());
    // Prune entries older than window
    if (this.seen.size > 10_000) this.prune();
  }

  prune(): void {
    const cutoff = Date.now() - this.windowMs;
    for (const [id, t] of this.seen) {
      if (t < cutoff) this.seen.delete(id);
    }
  }

  clear(): void { this.seen.clear(); }
  get size(): number { return this.seen.size; }
}
