/**
 * Social Gravity V2 - Tick Engine
 *
 * Orchestrates discrete temporal simulation ticks in strictly deterministic order:
 *   1. Scheduled events execution
 *   2. Edge decay across non-interacting ties
 *   3. New interaction processing
 *   4. Checkpoint & Snapshot creation
 */

import { EventScheduler } from '../events/scheduler';
import { SnapshotStore } from '../storage/snapshotStore';
import {
  DynamicGraphMetrics,
  ScheduledTask,
} from '../types';
import { DynamicGraph } from './dynamicGraph';

export interface TickResult {
  tick: number;
  scheduledTasksExecuted: number;
  decayEventsCount: number;
  newEventsGenerated: number;
  checkpointSaved: boolean;
  metrics: DynamicGraphMetrics;
  tickExecutionTimeMs: number;
}

export type TickCallback = (result: TickResult) => void;

export class TickEngine {
  private graph: DynamicGraph;
  private scheduler: EventScheduler;
  private snapshotStore: SnapshotStore;
  private tickListeners: Set<TickCallback> = new Set();

  constructor(
    graph: DynamicGraph,
    scheduler?: EventScheduler,
    snapshotStore?: SnapshotStore
  ) {
    this.graph = graph;
    this.scheduler = scheduler || new EventScheduler();
    this.snapshotStore = snapshotStore || new SnapshotStore();

    // Establish base checkpoint at tick 0
    const baseSnapshot = this.graph.createSnapshot();
    this.snapshotStore.setInitialSnapshot(baseSnapshot);
  }

  public getGraph(): DynamicGraph {
    return this.graph;
  }

  public getScheduler(): EventScheduler {
    return this.scheduler;
  }

  public getSnapshotStore(): SnapshotStore {
    return this.snapshotStore;
  }

  /**
   * Advances the simulation by exactly one discrete tick in deterministic order.
   */
  public tick(): TickResult {
    const startTime = performance.now();
    const nextTick = this.graph.getTick() + 1;
    this.graph.setTick(nextTick);

    let newEventsCount = 0;

    // STEP 1: Process Scheduled Events for this tick
    const scheduledTasks = this.scheduler.poll(nextTick);
    for (const task of scheduledTasks) {
      this.executeScheduledTask(nextTick, task);
      newEventsCount++;
    }

    // STEP 2: Apply Edge Decay across inactive relationships
    const decayEvents = this.graph.decayInactiveEdges(nextTick);
    newEventsCount += decayEvents.length;

    // STEP 3: Recompute/Refresh Dynamic Network Metrics
    const metrics = this.graph.getMetrics();

    // STEP 4: Snapshot / Checkpoint Creation (periodic or configured cadence)
    let checkpointSaved = false;
    if (this.snapshotStore.shouldCheckpoint(nextTick)) {
      const snapshot = this.graph.createSnapshot();
      this.snapshotStore.recordCheckpoint(nextTick, snapshot);
      this.graph.getEventLog().append(nextTick, 'CHECKPOINT_SAVED', {
        tick: nextTick,
        totalNodes: metrics.totalNodes,
        activeEdges: metrics.activeEdges,
      });
      checkpointSaved = true;
      newEventsCount++;
    }

    const tickExecutionTimeMs = Number((performance.now() - startTime).toFixed(3));

    const result: TickResult = {
      tick: nextTick,
      scheduledTasksExecuted: scheduledTasks.length,
      decayEventsCount: decayEvents.length,
      newEventsGenerated: newEventsCount,
      checkpointSaved,
      metrics,
      tickExecutionTimeMs,
    };

    // Notify listeners
    for (const listener of this.tickListeners) {
      try {
        listener(result);
      } catch (err) {
        console.error(`[TickEngine] Error in tick listener at tick ${nextTick}:`, err);
      }
    }

    return result;
  }

  /**
   * Advances simulation by N ticks sequentially.
   */
  public runTicks(count: number): TickResult[] {
    const results: TickResult[] = [];
    for (let i = 0; i < count; i++) {
      results.push(this.tick());
    }
    return results;
  }

  /**
   * Subscribes to tick completion notifications.
   */
  public onTick(callback: TickCallback): () => void {
    this.tickListeners.add(callback);
    return () => {
      this.tickListeners.delete(callback);
    };
  }

  /**
   * Executes a scheduled task according to its designated graph event type.
   */
  private executeScheduledTask(tick: number, task: ScheduledTask): void {
    switch (task.type) {
      case 'MESSAGE_SENT':
      case 'INTERACTION': {
        const { source, target, multiplier, metadata } = task.payload as {
          source: string;
          target: string;
          multiplier?: number;
          metadata?: Record<string, unknown>;
        };
        if (source && target) {
          this.graph.recordInteraction(source, target, multiplier, metadata);
        }
        break;
      }
      case 'NODE_JOINED': {
        const params = task.payload as any;
        this.graph.addNode(params);
        break;
      }
      case 'NODE_UPDATED': {
        const { nodeId, updates } = task.payload as {
          nodeId: string;
          updates: any;
        };
        if (nodeId && updates) {
          this.graph.updateNode(nodeId, updates);
        }
        break;
      }
      case 'NODE_INACTIVATED': {
        const { nodeId } = task.payload as { nodeId: string };
        if (nodeId) {
          this.graph.inactivateNode(nodeId);
        }
        break;
      }
      case 'EDGE_CREATED': {
        const params = task.payload as any;
        this.graph.addEdge(params);
        break;
      }
      case 'EDGE_REMOVED': {
        const { edgeId } = task.payload as { edgeId: string };
        if (edgeId) {
          this.graph.removeEdge(edgeId);
        }
        break;
      }
      default: {
        // Generic custom event logged to audit stream
        this.graph.getEventLog().append(tick, task.type, task.payload);
        break;
      }
    }
  }
}
