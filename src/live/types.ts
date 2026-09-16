export type ConnectorStatus = 'idle' | 'connecting' | 'connected' | 'live' | 'reconnecting' | 'offline' | 'rate_limited' | 'error' | 'paused';

export type LivePlatform = 'reddit' | 'bluesky' | 'rss' | 'x' | 'youtube' | 'instagram' | 'local';

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
}

export interface ConnectorConfig {
  pollIntervalMs?: number; // default 30000
  maxItemsPerPoll?: number; // default 100
  dedupWindowMs?: number; // default 300000 (5 min)
  offline?: boolean; // if true, only use cached/synthetic data
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
}

export interface LiveEvent {
  type: 'post' | 'status_change' | 'error';
  connector: string;
  payload: LivePost | ConnectorState | Error;
  timestamp: number;
}

export type LiveEventHandler = (event: LiveEvent) => void;

/**
 * Stage 1 & Architecture Standard: Unified Live Streaming Connector Interface
 */
export interface LiveConnector {
  readonly id: string;
  readonly platform: LivePlatform;
  connect(): Promise<void> | void;
  disconnect(): Promise<void> | void;
  onEvent(cb: (event: LiveEvent) => void): void;
  getStatus(): ConnectorState;
  onMessage?(handler: (post: LivePost) => void): void;
  start?(): Promise<void> | void;
  stop?(): void;
}
