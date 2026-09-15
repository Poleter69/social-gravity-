/**
 * Social Gravity V2 - Dynamic Graph Engine
 *
 * Core living temporal network graph maintaining time-aware communication topologies,
 * strictly event-sourced mutations, deterministic reproducibility, and high-performance traversal.
 */

import { PRNG } from '../../society/math/random';
import { EventLog } from '../events/eventLog';
import { DynamicMetricsEngine } from '../metrics/dynamicMetrics';
import {
  DynamicEdge,
  DynamicGraphMetrics,
  DynamicNode,
  EdgeStatus,
  GraphEvent,
  GraphSnapshot,
  NodeStatus,
  RelationshipDynamicsConfig,
  RelationshipType,
} from '../types';
import { EdgeDynamicsModel } from './edgeDynamics';

export function canonicalEdgeId(u: string, v: string, directed: boolean = false): string {
  if (directed) {
    return `${u}->${v}`;
  }
  return u < v ? `${u}--${v}` : `${v}--${u}`;
}

export class DynamicGraph {
  private nodes: Map<string, DynamicNode> = new Map();
  private edges: Map<string, DynamicEdge> = new Map();

  /** Adjacency mapping node -> Set of neighbor nodes (includes only non-removed edges) */
  private adjacency: Map<string, Set<string>> = new Map();

  /** Fast edge lookup (u, v) -> edgeId */
  private edgeLookup: Map<string, Map<string, string>> = new Map();

  /** Tracking consecutive dormant ticks for automated edge removal */
  private consecutiveDormantTicks: Map<string, number> = new Map();

  private currentTick: number = 0;
  private eventLog: EventLog;
  private dynamics: EdgeDynamicsModel;
  private prng: PRNG;
  private metricsCache: DynamicGraphMetrics | null = null;
  private cacheDirty: boolean = true;

  constructor(
    seed: number = 42,
    config: Partial<RelationshipDynamicsConfig> = {},
    eventLog?: EventLog
  ) {
    this.prng = new PRNG(seed);
    this.dynamics = new EdgeDynamicsModel(config);
    this.eventLog = eventLog || new EventLog();
  }

  // --- ACCESSORS ---

  public getTick(): number {
    return this.currentTick;
  }

  public setTick(tick: number): void {
    this.currentTick = tick;
  }

  public getPRNG(): PRNG {
    return this.prng;
  }

  public getEventLog(): EventLog {
    return this.eventLog;
  }

  public getDynamics(): EdgeDynamicsModel {
    return this.dynamics;
  }

  public getNode(id: string): DynamicNode | undefined {
    return this.nodes.get(id);
  }

  public hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  public getEdge(id: string): DynamicEdge | undefined {
    return this.edges.get(id);
  }

  public getEdgeBetween(u: string, v: string, directed: boolean = false): DynamicEdge | undefined {
    const id = canonicalEdgeId(u, v, directed);
    return this.edges.get(id);
  }

  public getAllNodes(): readonly DynamicNode[] {
    return Array.from(this.nodes.values());
  }

  public getAllEdges(): readonly DynamicEdge[] {
    return Array.from(this.edges.values());
  }

  public getActiveEdges(): DynamicEdge[] {
    const active: DynamicEdge[] = [];
    for (const edge of this.edges.values()) {
      if (edge.status !== 'removed' && edge.active) {
        active.push(edge);
      }
    }
    return active;
  }

  public getNeighbors(nodeId: string): ReadonlySet<string> {
    return this.adjacency.get(nodeId) || new Set();
  }

  public getDegree(nodeId: string): number {
    const neighbors = this.adjacency.get(nodeId);
    return neighbors ? neighbors.size : 0;
  }

  // --- EVENT-SOURCED MUTATIONS ---

  /**
   * Adds a new individual node to the living network.
   */
  public addNode(params: {
    id: string;
    communityId: string;
    currentInfluence?: number;
    trustPlaceholder?: Record<string, unknown> | null;
    emotionalPlaceholder?: Record<string, unknown> | null;
    createdTick?: number;
    lastActiveTick?: number;
    status?: NodeStatus;
    metadata?: Record<string, unknown>;
  }): GraphEvent {
    const node: DynamicNode = {
      id: params.id,
      communityId: params.communityId,
      currentInfluence: params.currentInfluence ?? 0.5,
      trustPlaceholder: params.trustPlaceholder ?? null,
      emotionalPlaceholder: params.emotionalPlaceholder ?? null,
      createdTick: params.createdTick ?? this.currentTick,
      lastActiveTick: params.lastActiveTick ?? this.currentTick,
      status: params.status ?? 'active',
      metadata: params.metadata,
    };

    const event = this.eventLog.append(this.currentTick, 'NODE_JOINED', { node });
    this.applyNodeJoined(node);
    return event;
  }

  /**
   * Updates an existing node's structural or state parameters.
   */
  public updateNode(nodeId: string, updates: Partial<DynamicNode>): GraphEvent {
    const existing = this.nodes.get(nodeId);
    if (!existing) {
      throw new Error(`[DynamicGraph] Cannot update non-existent node "${nodeId}"`);
    }

    const event = this.eventLog.append(this.currentTick, 'NODE_UPDATED', {
      nodeId,
      previous: { ...existing },
      updates,
    });

    this.applyNodeUpdated(nodeId, updates);
    return event;
  }

  /**
   * Marks a node as inactive (e.g. departing network, account suspended, offline).
   */
  public inactivateNode(nodeId: string): GraphEvent {
    const existing = this.nodes.get(nodeId);
    if (!existing) {
      throw new Error(`[DynamicGraph] Cannot inactivate non-existent node "${nodeId}"`);
    }

    const event = this.eventLog.append(this.currentTick, 'NODE_INACTIVATED', { nodeId });
    this.applyNodeInactivated(nodeId);
    return event;
  }

  /**
   * Creates a new dyadic relationship edge between two nodes.
   */
  public addEdge(params: {
    source: string;
    target: string;
    weight?: number;
    relationshipType?: RelationshipType;
    directed?: boolean;
    createdTick?: number;
    lastInteractionTick?: number;
    metadata?: Record<string, unknown>;
  }): GraphEvent {
    if (!this.nodes.has(params.source)) {
      throw new Error(`[DynamicGraph] Source node "${params.source}" does not exist`);
    }
    if (!this.nodes.has(params.target)) {
      throw new Error(`[DynamicGraph] Target node "${params.target}" does not exist`);
    }

    const directed = params.directed ?? false;
    const edgeId = canonicalEdgeId(params.source, params.target, directed);
    const initialWeight = Math.min(1.0, Math.max(0.0, params.weight ?? 0.35));
    const status = this.dynamics.deriveStatus(initialWeight, 0);

    const edge: DynamicEdge = {
      id: edgeId,
      source: params.source,
      target: params.target,
      weight: initialWeight,
      relationshipType: params.relationshipType ?? 'peer',
      createdTick: params.createdTick ?? this.currentTick,
      lastInteractionTick: params.lastInteractionTick ?? this.currentTick,
      active: status === 'active',
      status,
      directed,
      metadata: params.metadata,
    };

    const event = this.eventLog.append(this.currentTick, 'EDGE_CREATED', { edge });
    this.applyEdgeCreated(edge);
    return event;
  }

  /**
   * Records a direct interaction between two nodes.
   * Dynamically strengthens relationship weight according to asymptotic model.
   * If edge does not already exist, it is created.
   */
  public recordInteraction(
    source: string,
    target: string,
    multiplier: number = 1.0,
    metadata?: Record<string, unknown>
  ): { event: GraphEvent; edge: DynamicEdge } {
    if (!this.nodes.has(source) || !this.nodes.has(target)) {
      throw new Error(`[DynamicGraph] Cannot interact with non-existent nodes: ${source} -> ${target}`);
    }

    // Update node activity ticks
    const sourceNode = this.nodes.get(source)!;
    const targetNode = this.nodes.get(target)!;
    sourceNode.lastActiveTick = this.currentTick;
    targetNode.lastActiveTick = this.currentTick;

    const edgeId = canonicalEdgeId(source, target, false);
    let edge = this.edges.get(edgeId);

    if (!edge) {
      // First interaction forms a new tie with baseline weight
      const initialWeight = this.dynamics.calculateStrengthenedWeight(0.3, multiplier);
      const status = this.dynamics.deriveStatus(initialWeight, 0);

      edge = {
        id: edgeId,
        source,
        target,
        weight: initialWeight,
        relationshipType: 'peer',
        createdTick: this.currentTick,
        lastInteractionTick: this.currentTick,
        active: status === 'active',
        status,
        directed: false,
        metadata,
      };

      const event = this.eventLog.append(this.currentTick, 'EDGE_CREATED', {
        edge,
        interactionTriggered: true,
      });
      this.applyEdgeCreated(edge);
      return { event, edge };
    }

    // Strengthen existing edge
    const previousWeight = edge.weight;
    const newWeight = this.dynamics.calculateStrengthenedWeight(previousWeight, multiplier);
    const previousStatus = edge.status;
    const newStatus = this.dynamics.deriveStatus(newWeight, 0);

    edge.weight = newWeight;
    edge.lastInteractionTick = this.currentTick;
    edge.status = newStatus;
    edge.active = newStatus === 'active';
    this.consecutiveDormantTicks.delete(edgeId);

    // Re-link in adjacency if previously removed/dormant
    if (newStatus !== 'removed') {
      this.linkAdjacency(edge.source, edge.target, edge.directed);
    }

    this.cacheDirty = true;

    const event = this.eventLog.append(this.currentTick, 'EDGE_STRENGTHENED', {
      edgeId,
      source,
      target,
      previousWeight,
      newWeight,
      previousStatus,
      newStatus,
      metadata,
    });

    return { event, edge };
  }

  /**
   * Applies temporal decay across all non-interacting edges for the specified tick.
   * Edges that did not transmit at this tick decay exponentially:
   *   active -> weak -> dormant -> removed
   * Deterministic execution order ensured by sorting edge keys.
   */
  public decayInactiveEdges(tick: number): GraphEvent[] {
    const events: GraphEvent[] = [];
    const edgeIds = Array.from(this.edges.keys()).sort();

    for (const edgeId of edgeIds) {
      const edge = this.edges.get(edgeId)!;
      if (edge.status === 'removed') continue;

      // If interacted during this tick, do not decay
      if (edge.lastInteractionTick === tick) continue;

      const previousWeight = edge.weight;
      const previousStatus = edge.status;
      const newWeight = this.dynamics.calculateDecayedWeight(previousWeight);

      let dormantCount = this.consecutiveDormantTicks.get(edgeId) || 0;
      if (newWeight < this.dynamics.getConfig().weakThreshold) {
        dormantCount++;
        this.consecutiveDormantTicks.set(edgeId, dormantCount);
      } else {
        dormantCount = 0;
        this.consecutiveDormantTicks.delete(edgeId);
      }

      const newStatus = this.dynamics.deriveStatus(newWeight, dormantCount);

      edge.weight = newWeight;
      edge.status = newStatus;
      edge.active = newStatus === 'active';

      if (newStatus === 'removed') {
        edge.weight = 0;
        this.unlinkAdjacency(edge.source, edge.target, edge.directed);
        this.consecutiveDormantTicks.delete(edgeId);

        const ev = this.eventLog.append(tick, 'EDGE_REMOVED', {
          edgeId,
          source: edge.source,
          target: edge.target,
          reason: 'decay_threshold_breached',
          finalWeight: newWeight,
        });
        events.push(ev);
      } else if (newStatus !== previousStatus) {
        const ev = this.eventLog.append(tick, 'EDGE_STATUS_CHANGED', {
          edgeId,
          source: edge.source,
          target: edge.target,
          previousStatus,
          newStatus,
          weight: newWeight,
        });
        events.push(ev);
      } else if (Math.abs(newWeight - previousWeight) >= 0.001) {
        const ev = this.eventLog.append(tick, 'EDGE_WEAKENED', {
          edgeId,
          source: edge.source,
          target: edge.target,
          previousWeight,
          newWeight,
        });
        events.push(ev);
      }

      this.cacheDirty = true;
    }

    return events;
  }

  /**
   * Explicitly removes a relationship edge from the network.
   */
  public removeEdge(edgeId: string): GraphEvent {
    const edge = this.edges.get(edgeId);
    if (!edge) {
      throw new Error(`[DynamicGraph] Cannot remove non-existent edge "${edgeId}"`);
    }

    edge.status = 'removed';
    edge.active = false;
    edge.weight = 0;
    this.unlinkAdjacency(edge.source, edge.target, edge.directed);
    this.consecutiveDormantTicks.delete(edgeId);
    this.cacheDirty = true;

    return this.eventLog.append(this.currentTick, 'EDGE_REMOVED', {
      edgeId,
      source: edge.source,
      target: edge.target,
      reason: 'explicit_removal',
    });
  }

  // --- EVENT PLAYBACK / STATE SOURCING ---

  /**
   * Applies any GraphEvent directly to the graph state.
   * This is the core mechanism enabling perfect deterministic replay.
   */
  public applyEvent(event: GraphEvent): void {
    this.currentTick = event.tick;

    switch (event.type) {
      case 'NODE_JOINED': {
        const node = (event.payload as { node: DynamicNode }).node;
        this.applyNodeJoined(node);
        break;
      }
      case 'NODE_UPDATED': {
        const { nodeId, updates } = event.payload as {
          nodeId: string;
          updates: Partial<DynamicNode>;
        };
        this.applyNodeUpdated(nodeId, updates);
        break;
      }
      case 'NODE_INACTIVATED': {
        const { nodeId } = event.payload as { nodeId: string };
        this.applyNodeInactivated(nodeId);
        break;
      }
      case 'EDGE_CREATED': {
        const edge = (event.payload as { edge: DynamicEdge }).edge;
        this.applyEdgeCreated(edge);
        break;
      }
      case 'EDGE_STRENGTHENED': {
        const p = event.payload as {
          edgeId: string;
          newWeight: number;
          newStatus: EdgeStatus;
        };
        const edge = this.edges.get(p.edgeId);
        if (edge) {
          edge.weight = p.newWeight;
          edge.status = p.newStatus;
          edge.active = p.newStatus === 'active';
          edge.lastInteractionTick = event.tick;
          if (p.newStatus !== 'removed') {
            this.linkAdjacency(edge.source, edge.target, edge.directed);
          }
          this.cacheDirty = true;
        }
        break;
      }
      case 'EDGE_WEAKENED': {
        const p = event.payload as { edgeId: string; newWeight: number };
        const edge = this.edges.get(p.edgeId);
        if (edge) {
          edge.weight = p.newWeight;
          this.cacheDirty = true;
        }
        break;
      }
      case 'EDGE_STATUS_CHANGED': {
        const p = event.payload as {
          edgeId: string;
          newStatus: EdgeStatus;
          weight: number;
        };
        const edge = this.edges.get(p.edgeId);
        if (edge) {
          edge.status = p.newStatus;
          edge.weight = p.weight;
          edge.active = p.newStatus === 'active';
          if (p.newStatus === 'removed') {
            this.unlinkAdjacency(edge.source, edge.target, edge.directed);
          } else {
            this.linkAdjacency(edge.source, edge.target, edge.directed);
          }
          this.cacheDirty = true;
        }
        break;
      }
      case 'EDGE_REMOVED': {
        const p = event.payload as { edgeId: string };
        const edge = this.edges.get(p.edgeId);
        if (edge) {
          edge.status = 'removed';
          edge.active = false;
          edge.weight = 0;
          this.unlinkAdjacency(edge.source, edge.target, edge.directed);
          this.cacheDirty = true;
        }
        break;
      }
      default:
        // Other events (e.g. MESSAGE_SENT, CHECKPOINT_SAVED) do not mutate graph topology
        break;
    }
  }

  // --- INTERNAL STATE MUTATORS ---

  private applyNodeJoined(node: DynamicNode): void {
    this.nodes.set(node.id, { ...node });
    if (!this.adjacency.has(node.id)) {
      this.adjacency.set(node.id, new Set());
    }
    this.cacheDirty = true;
  }

  private applyNodeUpdated(nodeId: string, updates: Partial<DynamicNode>): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      Object.assign(node, updates);
      this.cacheDirty = true;
    }
  }

  private applyNodeInactivated(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.status = 'inactive';
      this.cacheDirty = true;
    }
  }

  private applyEdgeCreated(edge: DynamicEdge): void {
    this.edges.set(edge.id, { ...edge });

    let uMap = this.edgeLookup.get(edge.source);
    if (!uMap) {
      uMap = new Map();
      this.edgeLookup.set(edge.source, uMap);
    }
    uMap.set(edge.target, edge.id);

    if (!edge.directed) {
      let vMap = this.edgeLookup.get(edge.target);
      if (!vMap) {
        vMap = new Map();
        this.edgeLookup.set(edge.target, vMap);
      }
      vMap.set(edge.source, edge.id);
    }

    if (edge.status !== 'removed') {
      this.linkAdjacency(edge.source, edge.target, edge.directed);
    }

    this.cacheDirty = true;
  }

  private linkAdjacency(u: string, v: string, directed: boolean): void {
    let uNeighbors = this.adjacency.get(u);
    if (!uNeighbors) {
      uNeighbors = new Set();
      this.adjacency.set(u, uNeighbors);
    }
    uNeighbors.add(v);

    if (!directed) {
      let vNeighbors = this.adjacency.get(v);
      if (!vNeighbors) {
        vNeighbors = new Set();
        this.adjacency.set(v, vNeighbors);
      }
      vNeighbors.add(u);
    }
  }

  private unlinkAdjacency(u: string, v: string, directed: boolean): void {
    const uNeighbors = this.adjacency.get(u);
    if (uNeighbors) {
      uNeighbors.delete(v);
    }

    if (!directed) {
      const vNeighbors = this.adjacency.get(v);
      if (vNeighbors) {
        vNeighbors.delete(u);
      }
    }
  }

  // --- DYNAMIC METRICS ---

  /**
   * Returns live dynamic network topology metrics. Caches result until state mutates.
   */
  public getMetrics(): DynamicGraphMetrics {
    if (!this.cacheDirty && this.metricsCache && this.metricsCache.tick === this.currentTick) {
      return this.metricsCache;
    }

    const activeEdges = this.getActiveEdges();
    this.metricsCache = DynamicMetricsEngine.compute(
      this.nodes,
      this.adjacency,
      activeEdges,
      this.currentTick
    );
    this.cacheDirty = false;
    return this.metricsCache;
  }

  // --- SNAPSHOT & SERIALIZATION ---

  /**
   * Captures an exact snapshot of current graph state.
   */
  public createSnapshot(): GraphSnapshot {
    const metrics = this.getMetrics();
    return {
      tick: this.currentTick,
      lastEventSeq: this.eventLog.getLatestSequence(),
      nodes: Array.from(this.nodes.values()).map(n => ({ ...n })),
      edges: Array.from(this.edges.values()).map(e => ({ ...e })),
      metrics: { ...metrics },
      timestamp: Date.now(),
    };
  }

  /**
   * Restores graph state completely from an existing snapshot.
   */
  public restoreSnapshot(snapshot: GraphSnapshot): void {
    this.currentTick = snapshot.tick;
    this.nodes.clear();
    this.edges.clear();
    this.adjacency.clear();
    this.edgeLookup.clear();
    this.consecutiveDormantTicks.clear();

    for (const node of snapshot.nodes) {
      this.nodes.set(node.id, { ...node });
      this.adjacency.set(node.id, new Set());
    }

    for (const edge of snapshot.edges) {
      this.edges.set(edge.id, { ...edge });

      let uMap = this.edgeLookup.get(edge.source);
      if (!uMap) {
        uMap = new Map();
        this.edgeLookup.set(edge.source, uMap);
      }
      uMap.set(edge.target, edge.id);

      if (!edge.directed) {
        let vMap = this.edgeLookup.get(edge.target);
        if (!vMap) {
          vMap = new Map();
          this.edgeLookup.set(edge.target, vMap);
        }
        vMap.set(edge.source, edge.id);
      }

      if (edge.status !== 'removed') {
        this.linkAdjacency(edge.source, edge.target, edge.directed);
      }
    }

    this.metricsCache = snapshot.metrics ? { ...snapshot.metrics } : null;
    this.cacheDirty = false;
  }
}
