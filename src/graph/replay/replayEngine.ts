/**
 * Social Gravity V2 - Replay Engine
 *
 * High-performance deterministic time-travel and state reconstruction engine.
 * Rebuilds the exact historical topology, node traits, edge weights, and metrics
 * for any arbitrary simulation tick T via checkpoint + event-sourcing roll-forward.
 */

import { DynamicGraph } from '../engine/dynamicGraph';
import { EventLog } from '../events/eventLog';
import { SnapshotStore } from '../storage/snapshotStore';
import { GraphSnapshot } from '../types';

export class ReplayEngine {
  private graph: DynamicGraph;
  private eventLog: EventLog;
  private snapshotStore: SnapshotStore;

  constructor(
    graph: DynamicGraph,
    eventLog?: EventLog,
    snapshotStore?: SnapshotStore
  ) {
    this.graph = graph;
    this.eventLog = eventLog || graph.getEventLog();
    this.snapshotStore = snapshotStore || new SnapshotStore();
  }

  /**
   * Reconstructs the primary graph to the exact state at targetTick.
   *
   * Algorithm:
   * 1. Query SnapshotStore for closest preceding checkpoint C where C.tick <= targetTick.
   * 2. Restore graph state to checkpoint C.
   * 3. Fetch events in range (C.tick, targetTick] from EventLog.
   * 4. Fast-forward graph by applying events in monotonic sequence.
   * 5. Refresh dynamic metrics.
   *
   * Time Complexity: O(|V| + |E| + |Events_{C->target}|)
   * Space Complexity: O(|V| + |E|)
   */
  public goToTick(targetTick: number): DynamicGraph {
    if (targetTick < 0) {
      throw new Error(`[ReplayEngine] Target tick cannot be negative: ${targetTick}`);
    }

    const checkpointInfo = this.snapshotStore.getClosestPrecedingCheckpoint(targetTick);
    if (!checkpointInfo) {
      throw new Error(
        `[ReplayEngine] No base snapshot or checkpoint available preceding tick ${targetTick}`
      );
    }

    // 1. Restore closest checkpoint
    this.graph.restoreSnapshot(checkpointInfo.snapshot);

    // 2. Replay all events between checkpoint.tick + 1 and targetTick
    if (checkpointInfo.tick < targetTick) {
      const events = this.eventLog.getEventsBetween(checkpointInfo.tick + 1, targetTick);
      for (const ev of events) {
        this.graph.applyEvent(ev);
      }
    }

    this.graph.setTick(targetTick);
    return this.graph;
  }

  /**
   * Reconstructs an isolated, independent DynamicGraph instance at targetTick
   * without mutating the active simulation graph. Crucial for Phase 7 counterfactual branching.
   */
  public reconstructIsolatedAtTick(targetTick: number): DynamicGraph {
    const replicaGraph = new DynamicGraph(
      42,
      this.graph.getDynamics().getConfig(),
      new EventLog()
    );

    const checkpointInfo = this.snapshotStore.getClosestPrecedingCheckpoint(targetTick);
    if (!checkpointInfo) {
      throw new Error(
        `[ReplayEngine] No checkpoint available for target tick ${targetTick}`
      );
    }

    replicaGraph.restoreSnapshot(checkpointInfo.snapshot);

    if (checkpointInfo.tick < targetTick) {
      const events = this.eventLog.getEventsBetween(checkpointInfo.tick + 1, targetTick);
      for (const ev of events) {
        replicaGraph.applyEvent(ev);
      }
    }

    replicaGraph.setTick(targetTick);
    return replicaGraph;
  }

  /**
   * Steps the graph forward by exactly one tick.
   */
  public stepForward(): DynamicGraph {
    const nextTick = this.graph.getTick() + 1;
    return this.goToTick(nextTick);
  }

  /**
   * Steps the graph backward by exactly one tick.
   */
  public stepBackward(): DynamicGraph {
    const prevTick = Math.max(0, this.graph.getTick() - 1);
    return this.goToTick(prevTick);
  }

  /**
   * Validates deterministic parity between an expected snapshot and reconstructed state.
   */
  public static verifyParity(
    stateA: GraphSnapshot,
    stateB: GraphSnapshot
  ): { matches: boolean; discrepancies: string[] } {
    const discrepancies: string[] = [];

    if (stateA.tick !== stateB.tick) {
      discrepancies.push(`Tick mismatch: ${stateA.tick} vs ${stateB.tick}`);
    }

    if (stateA.nodes.length !== stateB.nodes.length) {
      discrepancies.push(`Node count mismatch: ${stateA.nodes.length} vs ${stateB.nodes.length}`);
    }

    if (stateA.edges.length !== stateB.edges.length) {
      discrepancies.push(`Edge count mismatch: ${stateA.edges.length} vs ${stateB.edges.length}`);
    }

    // Node attribute parity
    const nodeMapB = new Map(stateB.nodes.map(n => [n.id, n]));
    for (const nodeA of stateA.nodes) {
      const nodeB = nodeMapB.get(nodeA.id);
      if (!nodeB) {
        discrepancies.push(`Missing node in state B: ${nodeA.id}`);
        continue;
      }
      if (nodeA.status !== nodeB.status) {
        discrepancies.push(`Node ${nodeA.id} status mismatch: ${nodeA.status} vs ${nodeB.status}`);
      }
      if (Math.abs(nodeA.currentInfluence - nodeB.currentInfluence) > 0.0001) {
        discrepancies.push(`Node ${nodeA.id} influence mismatch`);
      }
    }

    // Edge attribute parity (weights and statuses)
    const edgeMapB = new Map(stateB.edges.map(e => [e.id, e]));
    for (const edgeA of stateA.edges) {
      const edgeB = edgeMapB.get(edgeA.id);
      if (!edgeB) {
        discrepancies.push(`Missing edge in state B: ${edgeA.id}`);
        continue;
      }
      if (Math.abs(edgeA.weight - edgeB.weight) > 0.0001) {
        discrepancies.push(
          `Edge ${edgeA.id} weight mismatch: ${edgeA.weight.toFixed(4)} vs ${edgeB.weight.toFixed(4)}`
        );
      }
      if (edgeA.status !== edgeB.status) {
        discrepancies.push(
          `Edge ${edgeA.id} status mismatch: ${edgeA.status} vs ${edgeB.status}`
        );
      }
    }

    return {
      matches: discrepancies.length === 0,
      discrepancies,
    };
  }
}
