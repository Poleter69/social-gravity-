/**
 * Social Gravity V2 - Reddit Temporal Replay Engine
 *
 * Slices conversational Reddit interactions into discrete simulation ticks.
 * Supports step-by-step playback, pausing, fast-forwarding, time-travel seek,
 * and exact historical graph state reconstruction.
 */

import { CanonicalGraph, CanonicalInteraction, CanonicalEdge } from '../../schemas';
import { DynamicGraph } from '../../../graph/engine/dynamicGraph';
import { ReconstructedThread } from '../parsers/redditTypes';
import { InteractionTransformer } from '../transformers/interactionTransformer';
import { CanonicalGraphBuilder } from '../../transformers/canonicalGraphBuilder';

export interface TemporalReplayConfig {
  /**
   * Time window in seconds per simulation tick. Default: 3600 (1 hour).
   * Set to 0 for event-driven stepping (1 interaction per tick).
   */
  tickResolutionSeconds?: number;
  decayRatePerTick?: number; // Optional edge weight decay per inactive tick
}

export interface ReplayTickDelta {
  tick: number;
  timestampMs: number;
  newInteractions: CanonicalInteraction[];
  newNodes: string[];
  newEdges: string[];
  totalActiveNodes: number;
  totalActiveEdges: number;
  isComplete: boolean;
}

export class TemporalReplayEngine {
  private interactions: CanonicalInteraction[];
  private tickResolutionMs: number;
  private minTimestampMs: number;
  private maxTimestampMs: number;
  private totalTicks: number;
  private currentTick: number = 0;
  private isPaused: boolean = false;

  // Cached state at current tick
  private activeNodes = new Set<string>();
  private activeEdges = new Map<string, CanonicalEdge>();
  private nodeMetadata = new Map<string, { label?: string; firstSeen: number }>();

  constructor(interactions: CanonicalInteraction[], config: TemporalReplayConfig = {}) {
    this.interactions = [...interactions].sort((a, b) => a.timestamp - b.timestamp);
    this.tickResolutionMs = (config.tickResolutionSeconds ?? 3600) * 1000;

    if (this.interactions.length > 0) {
      this.minTimestampMs = this.interactions[0].timestamp;
      this.maxTimestampMs = this.interactions[this.interactions.length - 1].timestamp;
      const span = Math.max(1, this.maxTimestampMs - this.minTimestampMs);
      this.totalTicks = this.tickResolutionMs > 0 ? Math.ceil(span / this.tickResolutionMs) + 1 : this.interactions.length;
    } else {
      this.minTimestampMs = Date.now();
      this.maxTimestampMs = Date.now();
      this.totalTicks = 0;
    }
  }

  /**
   * Factory method: constructs replay engine from reconstructed threads.
   */
  public static fromThreads(
    threads: ReconstructedThread[],
    config: TemporalReplayConfig = {}
  ): TemporalReplayEngine {
    const transformer = new InteractionTransformer();
    const interactions = transformer.transformThreads(threads);
    return new TemporalReplayEngine(interactions, config);
  }

  public getTotalTicks(): number {
    return this.totalTicks;
  }

  public getCurrentTick(): number {
    return this.currentTick;
  }

  public getTimestampForTick(tick: number): number {
    if (this.tickResolutionMs > 0) {
      return this.minTimestampMs + tick * this.tickResolutionMs;
    }
    const idx = Math.min(this.interactions.length - 1, Math.max(0, tick));
    return this.interactions[idx]?.timestamp || this.minTimestampMs;
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public isPlaybackPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Resets replay to tick 0.
   */
  public reset(): void {
    this.currentTick = 0;
    this.isPaused = false;
    this.activeNodes.clear();
    this.activeEdges.clear();
    this.nodeMetadata.clear();
  }

  /**
   * Advances the timeline by 1 tick and emits incremental changes.
   */
  public step(): ReplayTickDelta {
    if (this.currentTick >= this.totalTicks) {
      return {
        tick: this.currentTick,
        timestampMs: this.maxTimestampMs,
        newInteractions: [],
        newNodes: [],
        newEdges: [],
        totalActiveNodes: this.activeNodes.size,
        totalActiveEdges: this.activeEdges.size,
        isComplete: true,
      };
    }

    const startTs = this.getTimestampForTick(this.currentTick);
    const endTs = this.tickResolutionMs > 0 ? startTs + this.tickResolutionMs : startTs + 1;

    // Filter interactions occurring during this tick window
    const tickInteractions: CanonicalInteraction[] = [];
    for (const inter of this.interactions) {
      if (this.tickResolutionMs > 0) {
        if (inter.timestamp >= startTs && inter.timestamp < endTs) {
          tickInteractions.push(inter);
        }
      } else {
        // Event-driven: 1 interaction per tick
        if (inter === this.interactions[this.currentTick]) {
          tickInteractions.push(inter);
        }
      }
    }

    const newNodes: string[] = [];
    const newEdges: string[] = [];

    for (const inter of tickInteractions) {
      if (!this.activeNodes.has(inter.source)) {
        this.activeNodes.add(inter.source);
        newNodes.push(inter.source);
        this.nodeMetadata.set(inter.source, { firstSeen: inter.timestamp });
      }
      if (!this.activeNodes.has(inter.target)) {
        this.activeNodes.add(inter.target);
        newNodes.push(inter.target);
        this.nodeMetadata.set(inter.target, { firstSeen: inter.timestamp });
      }

      const edgeId = `${inter.source}->${inter.target}`;
      let edge = this.activeEdges.get(edgeId);

      if (!edge) {
        edge = {
          id: edgeId,
          source: inter.source,
          target: inter.target,
          weight: inter.weight,
          relationshipType: inter.type,
          firstInteraction: inter.timestamp,
          lastInteraction: inter.timestamp,
          interactionCount: 1,
          directed: true,
        };
        this.activeEdges.set(edgeId, edge);
        newEdges.push(edgeId);
      } else {
        edge.interactionCount++;
        edge.lastInteraction = inter.timestamp;
        // Asymptotic saturation on repeated interactions
        edge.weight = Math.min(1.0, edge.weight + 0.2 * (1.0 - edge.weight));
      }
    }

    const delta: ReplayTickDelta = {
      tick: this.currentTick,
      timestampMs: startTs,
      newInteractions: tickInteractions,
      newNodes,
      newEdges,
      totalActiveNodes: this.activeNodes.size,
      totalActiveEdges: this.activeEdges.size,
      isComplete: this.currentTick >= this.totalTicks - 1,
    };

    this.currentTick++;
    return delta;
  }

  /**
   * Fast forwards by N ticks.
   */
  public fastForward(ticks: number): ReplayTickDelta {
    let lastDelta: ReplayTickDelta = {
      tick: this.currentTick,
      timestampMs: this.getTimestampForTick(this.currentTick),
      newInteractions: [],
      newNodes: [],
      newEdges: [],
      totalActiveNodes: this.activeNodes.size,
      totalActiveEdges: this.activeEdges.size,
      isComplete: this.currentTick >= this.totalTicks,
    };

    for (let i = 0; i < ticks; i++) {
      if (this.currentTick >= this.totalTicks) break;
      lastDelta = this.step();
    }

    return lastDelta;
  }

  /**
   * Seeks to an exact tick number, reconstructing historical state.
   */
  public seek(targetTick: number): void {
    const boundedTick = Math.max(0, Math.min(this.totalTicks, targetTick));
    this.reset();
    for (let i = 0; i < boundedTick; i++) {
      this.step();
    }
  }

  /**
   * Reconstructs and returns an immutable CanonicalGraph snapshot of the current replay state.
   */
  public getSnapshot(): CanonicalGraph {
    const builder = new CanonicalGraphBuilder({
      id: `reddit_snapshot_tick_${this.currentTick}`,
      sourceDataset: 'REDDIT_TEMPORAL_REPLAY',
      detectCommunitiesIfMissing: false,
      metadata: {
        tick: this.currentTick,
        timestampMs: this.getTimestampForTick(this.currentTick),
      },
    });

    for (const nodeId of this.activeNodes) {
      builder.addNode({
        id: nodeId,
        label: nodeId,
        communityId: 'default',
        communities: ['default'],
        features: { platform: 'reddit' },
        degree: 0,
        inDegree: 0,
        outDegree: 0,
        influence: 0.5,
        isBridge: false,
        createdTimestamp: this.nodeMetadata.get(nodeId)?.firstSeen || Date.now(),
      });
    }

    for (const edge of this.activeEdges.values()) {
      builder.addEdge({ ...edge });
    }

    return builder.build();
  }

  /**
   * Converts the replay timeline into a living V2 DynamicGraph.
   */
  public toDynamicGraph(): DynamicGraph {
    const snapshot = this.getSnapshot();
    return CanonicalGraphBuilder.toDynamicGraph(snapshot);
  }
}
