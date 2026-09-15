/**
 * Social Gravity V2 - Dynamic Graph Subsystem
 *
 * Unified entry point for the temporal dynamic graph foundation.
 */

// Types
export * from './types';

// Events
export { EventLog } from './events/eventLog';
export type { EventSubscriber } from './events/eventLog';
export { EventScheduler } from './events/scheduler';

// Storage
export { SnapshotStore } from './storage/snapshotStore';

// Metrics
export { DynamicMetricsEngine } from './metrics/dynamicMetrics';

// Engine
export { DynamicGraph, canonicalEdgeId } from './engine/dynamicGraph';
export { EdgeDynamicsModel, DEFAULT_DYNAMICS_CONFIG } from './engine/edgeDynamics';
export { TickEngine } from './engine/tickEngine';
export type { TickResult, TickCallback } from './engine/tickEngine';
export { DeterministicGraphGenerator } from './engine/deterministicGenerator';
export type {
  WattsStrogatzOptions,
  ScaleFreeOptions,
  StochasticBlockModelOptions,
} from './engine/deterministicGenerator';

// Replay
export { ReplayEngine } from './replay/replayEngine';
