/**
 * Social Gravity V2 - Snapshot & Checkpoint Store
 *
 * Efficient historical state storage utilizing base state + event log + periodic checkpoints.
 * Enables O(delta t) random-access state reconstruction without O(T * |V|) memory explosion.
 */

import { GraphSnapshot } from '../types';

export class SnapshotStore {
  private initialSnapshot: GraphSnapshot | null = null;
  private checkpoints: Map<number, GraphSnapshot> = new Map();
  private checkpointInterval: number;

  constructor(checkpointInterval: number = 25) {
    this.checkpointInterval = Math.max(1, checkpointInterval);
  }

  /**
   * Sets the base initial state (Tick 0 or start of recording).
   */
  public setInitialSnapshot(snapshot: GraphSnapshot): void {
    this.initialSnapshot = this.cloneSnapshot(snapshot);
    this.checkpoints.set(snapshot.tick, this.cloneSnapshot(snapshot));
  }

  /**
   * Returns the base initial state.
   */
  public getInitialSnapshot(): GraphSnapshot | null {
    return this.initialSnapshot ? this.cloneSnapshot(this.initialSnapshot) : null;
  }

  /**
   * Records a periodic state checkpoint at the given tick.
   */
  public recordCheckpoint(tick: number, snapshot: GraphSnapshot): void {
    this.checkpoints.set(tick, this.cloneSnapshot(snapshot));
  }

  /**
   * Checks whether the current tick aligns with the checkpoint cadence.
   */
  public shouldCheckpoint(tick: number): boolean {
    return tick % this.checkpointInterval === 0;
  }

  /**
   * Finds the closest preceding checkpoint at or before targetTick.
   * Enables replay to fast-forward from this checkpoint instead of tick 0.
   */
  public getClosestPrecedingCheckpoint(targetTick: number): {
    tick: number;
    snapshot: GraphSnapshot;
  } | null {
    if (this.checkpoints.size === 0) {
      if (this.initialSnapshot && this.initialSnapshot.tick <= targetTick) {
        return {
          tick: this.initialSnapshot.tick,
          snapshot: this.cloneSnapshot(this.initialSnapshot),
        };
      }
      return null;
    }

    const availableTicks = Array.from(this.checkpoints.keys()).sort((a, b) => a - b);
    let bestTick: number | null = null;

    for (let i = 0; i < availableTicks.length; i++) {
      const t = availableTicks[i];
      if (t <= targetTick) {
        bestTick = t;
      } else {
        break;
      }
    }

    if (bestTick === null) {
      if (this.initialSnapshot && this.initialSnapshot.tick <= targetTick) {
        return {
          tick: this.initialSnapshot.tick,
          snapshot: this.cloneSnapshot(this.initialSnapshot),
        };
      }
      return null;
    }

    const snapshot = this.checkpoints.get(bestTick)!;
    return {
      tick: bestTick,
      snapshot: this.cloneSnapshot(snapshot),
    };
  }

  /**
   * Retrieves an exact checkpoint if one was saved at this tick.
   */
  public getCheckpoint(tick: number): GraphSnapshot | null {
    const snap = this.checkpoints.get(tick);
    return snap ? this.cloneSnapshot(snap) : null;
  }

  /**
   * Returns all ticks for which checkpoints exist.
   */
  public getCheckpointTicks(): number[] {
    return Array.from(this.checkpoints.keys()).sort((a, b) => a - b);
  }

  /**
   * Exports full checkpoint collection to JSON for offline persistence and reproducibility.
   */
  public exportToJSON(): string {
    return JSON.stringify({
      checkpointInterval: this.checkpointInterval,
      initialSnapshot: this.initialSnapshot,
      checkpoints: Array.from(this.checkpoints.entries()),
    });
  }

  /**
   * Restores checkpoint collection from exported JSON.
   */
  public importFromJSON(jsonString: string): void {
    const parsed = JSON.parse(jsonString);
    this.checkpointInterval = parsed.checkpointInterval || 25;
    this.initialSnapshot = parsed.initialSnapshot || null;
    this.checkpoints.clear();

    if (Array.isArray(parsed.checkpoints)) {
      for (const [tick, snapshot] of parsed.checkpoints) {
        this.checkpoints.set(Number(tick), snapshot);
      }
    }
  }

  /**
   * Deep clones a snapshot to prevent external reference mutation.
   */
  private cloneSnapshot(snapshot: GraphSnapshot): GraphSnapshot {
    return {
      tick: snapshot.tick,
      lastEventSeq: snapshot.lastEventSeq,
      nodes: snapshot.nodes.map(n => ({
        ...n,
        trustPlaceholder: n.trustPlaceholder ? { ...n.trustPlaceholder } : null,
        emotionalPlaceholder: n.emotionalPlaceholder ? { ...n.emotionalPlaceholder } : null,
        metadata: n.metadata ? { ...n.metadata } : undefined,
      })),
      edges: snapshot.edges.map(e => ({
        ...e,
        metadata: e.metadata ? { ...e.metadata } : undefined,
      })),
      metrics: snapshot.metrics ? { ...snapshot.metrics } : null,
      timestamp: snapshot.timestamp,
    };
  }

  /**
   * Clears all stored checkpoints.
   */
  public clear(): void {
    this.initialSnapshot = null;
    this.checkpoints.clear();
  }
}
