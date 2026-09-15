export type ConnectorStatus = 'idle' | 'connecting' | 'live' | 'paused' | 'error' | 'rate_limited';

export interface LivePost {
  id: string;
  platform: 'reddit' | 'bluesky' | 'rss' | 'local';
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
  pollIntervalMs: number; // default 30000
  maxItemsPerPoll: number; // default 100
  dedupWindowMs: number; // default 300000 (5 min)
  offline: boolean; // if true, only use cached/local data
}

export interface ConnectorState {
  id: string;
  platform: LivePost['platform'];
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
