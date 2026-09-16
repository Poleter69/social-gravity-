export type ConnectorStatus = 'idle' | 'connecting' | 'live' | 'paused' | 'error' | 'rate_limited';

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
}

export interface ConnectorState {
  id: string;
  platform: LivePlatform;
  status: ConnectorStatus;
  lastPollAt: number | null;
  itemsIngested: number;
  errorMessage?: string;
  rateLimitResetAt?: number;
}

export interface LiveEvent {
  type: 'post' | 'status_change' | 'error';
  connector: string;
  payload: LivePost | ConnectorState | Error;
  timestamp: number;
}

export type LiveEventHandler = (event: LiveEvent) => void;

/**
 * Stage 1: Unified Live Streaming Connector Interface
 */
export interface LiveConnector {
  id: string;
  platform: LivePlatform;
  connect(): Promise<void> | void;
  disconnect(): void;
  onMessage(handler: (post: LivePost) => void): void;
  getStatus(): ConnectorState;
  start?(): Promise<void> | void;
  stop?(): void;
}
