/**
 * Social Gravity — Milestone M21: Live Signal Intelligence Contracts
 * Unified Connector Architecture, Canonical LiveEvent, and Health Telemetry
 */

import { EmotionProfile } from '../nlp/types';
import { SafetyProfile } from '../safety/safetyTypes';

export type ConnectorStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'live'
  | 'reconnecting'
  | 'offline'
  | 'rate_limited'
  | 'degraded'
  | 'error'
  | 'paused';

export type LivePlatform = 'reddit' | 'bluesky' | 'rss' | 'x' | 'youtube' | 'instagram' | 'local' | 'mastodon' | 'github';

export interface LivePost {
  id: string;
  platform: LivePlatform;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: number;
  subreddit?: string; // reddit
  threadId?: string;
  parentId?: string;
  isReply?: boolean;
  url?: string;
  metadata?: Record<string, unknown>;
  safety?: SafetyProfile;
  cursor?: string | number;
}

export interface ConnectorConfig {
  pollIntervalMs?: number; // default 30000
  maxItemsPerPoll?: number; // default 100
  dedupWindowMs?: number; // default 300000 (5 min)
  offline?: boolean; // if true, only use cached/synthetic data
  sampleRate?: number; // sampling probability 0.0 - 1.0 (e.g. 0.30 for 70% reduction)
  apiKey?: string; // for X, YouTube, Reddit, Meta
  apiSecret?: string;
  accessToken?: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
}

export interface ConnectorState {
  id: string;
  platform: LivePlatform;
  status: ConnectorStatus;
  lastPollAt: number | null;
  itemsIngested: number;
  errorMessage?: string;
  rateLimitResetAt?: number;
  latencyMs?: number;
  wsState?: 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' | 'N/A';
  pollIntervalMs?: number;
  eventsReceived?: number;
  eventsProcessed?: number;
  queueDepth?: number;
  avgLatencyMs?: number;
  endpoint?: string;
  duplicatesSkipped?: number;
  newestEventTime?: number | null;
  oldestEventTime?: number | null;
  cursor?: string | number;
}

/**
 * Stage 8: Stream Health Metrics Dashboard contract
 */
export interface StreamHealthMetrics {
  id: string;
  platform: LivePlatform;
  status: ConnectorStatus;
  eventsReceived: number;
  eventsProcessed: number;
  duplicatesSkipped: number;
  newestEventTime: number | null;
  oldestEventTime: number | null;
  queueSize: number;
  cursor?: string | number;
  bufferCapacity: number;
  avgLatencyMs?: number;
}

/**
 * Health telemetry for LiveConnectors
 */
export interface ConnectorHealth {
  id: string;
  platform: LivePlatform;
  status: ConnectorStatus;
  healthy: boolean;
  isHealthy?: boolean;
  latencyMs: number;
  lastEventAt: number | null;
  errorCount: number;
  successRate: number; // 0..1
  itemsIngested: number;
  details?: string;
}

/**
 * Stage 2: Canonical Live Event
 * Every incoming public signal is normalized into this structure.
 */
export interface LiveEvent {
  id?: string;
  source?: LivePlatform;
  timestamp: number;
  authorHash?: string;
  text?: string;
  url?: string;
  language?: string;
  emotionProfile?: EmotionProfile;
  safetyProfile?: SafetyProfile;
  narrativeCluster?: string;
  viralityScore?: number;
  metadata?: Record<string, unknown>;

  // Backwards compatibility for event emitter dispatchers
  type?: 'post' | 'status_change' | 'error';
  connector?: string;
  payload?: any;
}

export type LiveEventHandler = (event: LiveEvent) => void;

/**
 * Stage 1: Unified Public Connector Interface
 */
export interface LiveConnector {
  readonly id: string;
  readonly platform: LivePlatform;
  connect(): Promise<void> | void;
  disconnect(): Promise<void> | void;
  onEvent(cb: (event: LiveEvent) => void): void;
  getHealth(): ConnectorHealth;
  getStreamHealth?(): StreamHealthMetrics;
  getStatus(): ConnectorState;
  getState?(): ConnectorState;
  onMessage?(handler: (post: LivePost) => void): void;
  start?(): Promise<void> | void;
  stop?(): void;
}
