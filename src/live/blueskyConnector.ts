/**
 * Social Gravity - Bluesky Jetstream Firehose Connector
 * Real-time AT Protocol firehose ingestion with sub-second latency,
 * automatic reconnect, reply parsing, and full diagnostics telemetry.
 */

import { LivePost, ConnectorConfig, ConnectorState, LiveEventHandler, LiveConnector, LiveEvent } from './types';
import { DedupStore } from './dedup';

const JETSTREAM_ENDPOINTS = [
  'wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post',
  'wss://jetstream1.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post',
  'wss://jetstream2.us-west.bsky.network/subscribe?wantedCollections=app.bsky.feed.post',
];

interface JetstreamFrame {
  did?: string;
  time_us?: number;
  kind?: string;
  commit?: {
    rev?: string;
    operation?: 'create' | 'update' | 'delete';
    collection?: string;
    rkey?: string;
    record?: {
      $type?: string;
      text?: string;
      createdAt?: string;
      reply?: {
        parent?: { cid?: string; uri?: string };
        root?: { cid?: string; uri?: string };
      };
      langs?: string[];
    };
  };
}

export class BlueskyConnector implements LiveConnector {
  public readonly id = 'bluesky';
  public readonly platform = 'bluesky' as const;

  private state: ConnectorState;
  private dedup: DedupStore;
  private ws: WebSocket | null = null;
  private config: Required<Pick<ConnectorConfig, 'pollIntervalMs' | 'maxItemsPerPoll' | 'dedupWindowMs' | 'offline'>>;
  private sampleRate: number;
  private eventHandlers: LiveEventHandler[] = [];
  private messageHandlers: Array<(post: LivePost) => void> = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1500;
  private endpointIndex = 0;
  private latencies: number[] = [];
  private totalReceived = 0;
  private totalProcessed = 0;

  constructor(
    private keywords: string[] = [],
    config?: Partial<ConnectorConfig>
  ) {
    this.sampleRate = config?.sampleRate ?? 0.30; // Default 30% sample rate (reduces firehose by 70%)
    this.config = {
      pollIntervalMs: 0,
      maxItemsPerPoll: config?.maxItemsPerPoll ?? 500,
      dedupWindowMs: config?.dedupWindowMs ?? 120_000,
      offline: config?.offline ?? false,
    };
    this.dedup = new DedupStore(this.config.dedupWindowMs);
    this.state = {
      id: 'bluesky',
      platform: 'bluesky',
      status: 'idle',
      lastPollAt: null,
      itemsIngested: 0,
      eventsReceived: 0,
      eventsProcessed: 0,
      queueDepth: 0,
      avgLatencyMs: 0,
      latencyMs: 0,
      wsState: 'CLOSED',
      endpoint: JETSTREAM_ENDPOINTS[0],
    };
  }

  public onEvent(handler: LiveEventHandler): void {
    this.eventHandlers.push(handler);
  }

  public on(handler: LiveEventHandler): void {
    this.onEvent(handler);
  }

  public onMessage(handler: (post: LivePost) => void): void {
    this.messageHandlers.push(handler);
  }

  private emit(type: 'post' | 'status_change' | 'error', payload: LivePost | ConnectorState | Error): void {
    const event: LiveEvent = {
      type,
      connector: 'bluesky',
      payload,
      timestamp: Date.now(),
    };
    this.eventHandlers.forEach(h => {
      try {
        h(event);
      } catch (err) {
        console.error('[BlueskyConnector] Error in event handler:', err);
      }
    });

    if (type === 'post') {
      const post = payload as LivePost;
      this.messageHandlers.forEach(h => {
        try {
          h(post);
        } catch (err) {
          console.error('[BlueskyConnector] Error in message handler:', err);
        }
      });
    }
  }

  private updateStatus(status: ConnectorState['status'], extra?: Partial<ConnectorState>): void {
    const wsStateStr = this.getWsStateString();
    this.state = {
      ...this.state,
      status,
      wsState: wsStateStr,
      eventsReceived: this.totalReceived,
      eventsProcessed: this.totalProcessed,
      endpoint: JETSTREAM_ENDPOINTS[this.endpointIndex % JETSTREAM_ENDPOINTS.length],
      ...extra,
    };
    this.emit('status_change', this.state);
  }

  private getWsStateString(): ConnectorState['wsState'] {
    if (!this.ws) return 'CLOSED';
    switch (this.ws.readyState) {
      case 0: return 'CONNECTING';
      case 1: return 'OPEN';
      case 2: return 'CLOSING';
      case 3: return 'CLOSED';
      default: return 'N/A';
    }
  }

  public async connect(): Promise<void> {
    if (this.state.status === 'connected' || this.state.status === 'connecting') {
      return;
    }

    if (this.config.offline) {
      this.updateStatus('offline', { errorMessage: 'Offline mode requested' });
      return;
    }

    this.establishSocket();
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    this.updateStatus('idle', { wsState: 'CLOSED' });
  }

  public start(): Promise<void> {
    return this.connect();
  }

  public stop(): void {
    this.disconnect();
  }

  public getStatus(): ConnectorState {
    return {
      ...this.state,
      wsState: this.getWsStateString(),
    };
  }

  public getState(): ConnectorState {
    return this.getStatus();
  }

  private establishSocket(): void {
    if (typeof WebSocket === 'undefined') {
      this.updateStatus('error', { errorMessage: 'WebSocket is not supported in current environment' });
      return;
    }

    const currentEndpoint = JETSTREAM_ENDPOINTS[this.endpointIndex % JETSTREAM_ENDPOINTS.length];
    this.updateStatus(this.reconnectTimer ? 'reconnecting' : 'connecting', {
      endpoint: currentEndpoint,
      wsState: 'CONNECTING',
    });

    try {
      this.ws = new WebSocket(currentEndpoint);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.updateStatus('error', { errorMessage: `Failed to initialize WebSocket: ${msg}` });
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectDelay = 1500;
      this.updateStatus('connected', {
        lastPollAt: Date.now(),
        errorMessage: undefined,
        wsState: 'OPEN',
      });
    };

    this.ws.onmessage = (ev: MessageEvent) => {
      this.totalReceived++;
      this.state.eventsReceived = this.totalReceived;

      try {
        const frame: JetstreamFrame = JSON.parse(String(ev.data));

        // Validate commit and record
        if (frame.kind !== 'commit' || frame.commit?.operation === 'delete') {
          return;
        }

        const record = frame.commit?.record;
        if (!record || !record.text || record.text.trim().length === 0) {
          return;
        }

        const text = record.text;

        // Reduce Bluesky by ~70% (sample rate 30%)
        if (Math.random() > this.sampleRate) {
          return;
        }

        // Filter short noise (< 10 chars)
        if (text.trim().length < 10) {
          return;
        }

        // Keyword filtering if keywords are specified
        if (this.keywords.length > 0) {
          const lower = text.toLowerCase();
          const matches = this.keywords.some(k => lower.includes(k.toLowerCase()));
          if (!matches) return;
        }

        const did = frame.did || 'did:plc:anon';
        const rkey = frame.commit?.rkey || `${Date.now()}-${Math.random()}`;
        const id = `bsky-${did.slice(8, 24)}-${rkey}`;

        if (this.dedup.has(id)) {
          return;
        }
        this.dedup.add(id);

        const createdAt = record.createdAt ? new Date(record.createdAt).getTime() : Date.now();
        const latency = Math.max(0, Date.now() - createdAt);

        // Keep rolling latency
        this.latencies.push(latency);
        if (this.latencies.length > 50) this.latencies.shift();
        const avgLatency = Math.round(this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length);

        // Parse reply context
        const isReply = Boolean(record.reply?.parent || record.reply?.root);
        const parentId = record.reply?.parent?.uri || record.reply?.parent?.cid;

        // Format a readable author handle from DID
        const shortDid = did.startsWith('did:plc:') ? did.replace('did:plc:', '') : did;
        const authorName = `@${shortDid.slice(0, 12)}.bsky`;

        const post: LivePost = {
          id,
          platform: 'bluesky',
          authorId: did,
          authorName,
          content: text,
          timestamp: createdAt,
          parentId,
          isReply,
          url: `https://bsky.app/profile/${did}/post/${rkey}`,
          metadata: {
            rkey,
            langs: record.langs,
            latencyMs: latency,
            isReply,
          },
        };

        this.totalProcessed++;
        this.state.itemsIngested++;
        this.state.eventsProcessed = this.totalProcessed;
        this.state.lastPollAt = Date.now();
        this.state.latencyMs = latency;
        this.state.avgLatencyMs = avgLatency;

        this.emit('post', post);
      } catch (err: unknown) {
        // Frame parse error: ignore invalid JSON frame
      }
    };

    this.ws.onerror = () => {
      this.updateStatus('error', {
        errorMessage: `Bluesky Jetstream connection error on ${currentEndpoint}`,
      });
    };

    this.ws.onclose = () => {
      if (this.state.status !== 'idle' && !this.config.offline) {
        this.endpointIndex++; // Try next fallback endpoint
        this.updateStatus('reconnecting', {
          errorMessage: 'Disconnected - reconnecting...',
          wsState: 'CLOSED',
        });
        this.scheduleReconnect();
      } else {
        this.updateStatus('idle', { wsState: 'CLOSED' });
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.establishSocket();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 20_000);
  }
}
