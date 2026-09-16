import { LivePost, ConnectorConfig, ConnectorState, LiveEventHandler, LiveConnector } from './types';
import { DedupStore } from './dedup';

export class BlueskyConnector implements LiveConnector {
  public readonly id = 'bluesky';
  public readonly platform = 'bluesky' as const;
  private state: ConnectorState;
  private dedup: DedupStore;
  private ws: WebSocket | null = null;
  private config: Required<Pick<ConnectorConfig, 'pollIntervalMs' | 'maxItemsPerPoll' | 'dedupWindowMs' | 'offline'>>;
  private handlers: LiveEventHandler[] = [];
  private messageHandlers: Array<(post: LivePost) => void> = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 2000;

  constructor(
    private keywords: string[] = [],
    config?: Partial<ConnectorConfig>
  ) {
    this.config = {
      pollIntervalMs: 0,
      maxItemsPerPoll: config?.maxItemsPerPoll ?? 500,
      dedupWindowMs: config?.dedupWindowMs ?? 60_000,
      offline: config?.offline ?? false,
    };
    this.dedup = new DedupStore(this.config.dedupWindowMs);
    this.state = { id: 'bluesky', platform: 'bluesky', status: 'idle', lastPollAt: null, itemsIngested: 0 };
  }

  on(handler: LiveEventHandler): void {
    this.handlers.push(handler);
  }

  onMessage(handler: (post: LivePost) => void): void {
    this.messageHandlers.push(handler);
  }

  private emit(type: 'post' | 'status_change' | 'error', payload: LivePost | ConnectorState | Error): void {
    this.handlers.forEach(h => h({ type, connector: 'bluesky', payload, timestamp: Date.now() }));
    if (type === 'post') {
      this.messageHandlers.forEach(h => h(payload as LivePost));
    }
  }

  private updateStatus(status: ConnectorState['status'], extra?: Partial<ConnectorState>): void {
    this.state = { ...this.state, status, ...extra };
    this.emit('status_change', this.state);
  }

  connect(): void {
    this.start();
  }

  disconnect(): void {
    this.stop();
  }

  start(): void {
    if (this.config.offline) {
      this.updateStatus('paused', { errorMessage: 'Offline mode' });
      return;
    }
    this.establishSocket();
  }

  stop(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
    }
    this.updateStatus('idle');
  }

  getStatus(): ConnectorState {
    return { ...this.state };
  }

  getState(): ConnectorState {
    return this.getStatus();
  }

  private establishSocket(): void {
    if (typeof WebSocket === 'undefined') {
      this.updateStatus('error', { errorMessage: 'WebSocket is not supported in current environment' });
      return;
    }

    const url = 'wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post';
    this.updateStatus('connecting');
    try {
      this.ws = new WebSocket(url);
    } catch {
      this.updateStatus('error', { errorMessage: 'Failed to initialize WebSocket' });
      return;
    }

    this.ws.onopen = () => {
      this.reconnectDelay = 2000;
      this.updateStatus('live', { lastPollAt: Date.now() });
    };

    this.ws.onmessage = (ev) => {
      try {
        const frame = JSON.parse(String(ev.data)) as {
          did?: string;
          commit?: { record?: { text?: string; createdAt?: string }; rkey?: string };
          kind?: string;
        };
        if (frame.kind !== 'commit' || !frame.commit?.record?.text) return;
        const text = frame.commit.record.text;
        if (this.keywords.length > 0) {
          const lower = text.toLowerCase();
          if (!this.keywords.some(k => lower.includes(k.toLowerCase()))) return;
        }
        const id = `bsky-${frame.did ?? 'anon'}-${frame.commit.rkey ?? Date.now()}`;
        if (this.dedup.has(id)) return;
        this.dedup.add(id);

        const post: LivePost = {
          id,
          platform: 'bluesky',
          authorId: frame.did ?? 'anon',
          authorName: frame.did ?? 'anon',
          content: text,
          timestamp: frame.commit.record.createdAt ? new Date(frame.commit.record.createdAt).getTime() : Date.now(),
        };
        this.state.itemsIngested++;
        this.state.lastPollAt = Date.now();
        this.emit('post', post);
      } catch {
        // Ignore unparseable frames
      }
    };

    this.ws.onerror = () => {
      this.updateStatus('error', { errorMessage: 'Bluesky Jetstream connection error' });
    };

    this.ws.onclose = () => {
      if (this.state.status !== 'idle') {
        this.updateStatus('error', { errorMessage: 'Disconnected - reconnecting...' });
        this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000);
      }
    };
  }
}
