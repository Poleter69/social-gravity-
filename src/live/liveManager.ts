import { RedditConnector, DEFAULT_SUBREDDITS } from './redditConnector';
import { BlueskyConnector } from './blueskyConnector';
import { RssConnector, DEFAULT_RSS_FEEDS } from './rssConnector';
import { LocalStreamConnector } from './localStreamConnector';
import { XConnector } from './xConnector';
import { YouTubeConnector } from './youtubeConnector';
import { InstagramConnector } from './instagramConnector';
import { MastodonConnector } from './mastodonConnector';
import { GitHubActivityConnector } from './githubActivityConnector';
import { LivePost, ConnectorState, ConnectorConfig, LiveConnector, LiveEvent, StreamHealthMetrics } from './types';

export interface LiveGraphUpdate {
  newAgentId: string;
  newAgentName: string;
  content: string;
  timestamp: number;
  platform: LivePost['platform'];
  parentAgentId?: string;
  isReply?: boolean;
}

export interface LiveManagerConfig {
  reddit?: { subreddits?: string[] } & Partial<ConnectorConfig>;
  bluesky?: { keywords?: string[] } & Partial<ConnectorConfig>;
  rss?: { feeds?: string[] } & Partial<ConnectorConfig>;
  mastodon?: { instances?: string[]; tags?: string[] } & Partial<ConnectorConfig>;
  github?: { targetRepos?: string[]; token?: string } & Partial<ConnectorConfig>;
  x?: { query?: string } & Partial<ConnectorConfig>;
  youtube?: { videoIds?: string[] } & Partial<ConnectorConfig>;
  instagram?: { igMediaIds?: string[] } & Partial<ConnectorConfig>;
  offline?: boolean;
  onUpdate?: (update: LiveGraphUpdate) => void;
  onPost?: (post: LivePost) => void;
  onStatusChange?: (state: ConnectorState) => void;
}

export class LiveManager {
  reddit: RedditConnector;
  bluesky: BlueskyConnector;
  rss: RssConnector;
  mastodon: MastodonConnector;
  github: GitHubActivityConnector;
  x: XConnector;
  youtube: YouTubeConnector;
  instagram: InstagramConnector;
  local: LocalStreamConnector;

  private connectors: Map<string, LiveConnector> = new Map();
  private graphHandlers: Array<(update: LiveGraphUpdate) => void> = [];
  private postHandlers: Array<(post: LivePost) => void> = [];
  private statusHandlers: Array<(state: ConnectorState) => void> = [];

  // M21.3 Infinite Event Queue & Persistent Deduplication
  private eventQueue: LivePost[] = [];
  private maxQueueSize = 10_000;
  private persistentDedup: Set<string> = new Set();
  private eventsReceived = 0;
  private eventsProcessed = 0;
  private duplicatesSkipped = 0;
  private newestEventTime: number | null = null;
  private oldestEventTime: number | null = null;

  // Rolling comments/second calculation window
  private recentTimestamps: number[] = [];

  constructor(cfg: LiveManagerConfig = {}) {
    const offline = cfg.offline ?? false;

    // Bluesky (Highest Priority real Jetstream firehose)
    this.bluesky = new BlueskyConnector(
      cfg.bluesky?.keywords ?? [],
      { ...cfg.bluesky, offline }
    );
    this.registerConnector(this.bluesky);

    // Reddit (Multi-subreddit real ingestion)
    this.reddit = new RedditConnector(
      cfg.reddit?.subreddits ?? DEFAULT_SUBREDDITS,
      { ...cfg.reddit, offline }
    );
    this.registerConnector(this.reddit);

    // RSS (Multi-feed breaking news ingestion)
    this.rss = new RssConnector(
      cfg.rss?.feeds ?? DEFAULT_RSS_FEEDS,
      { ...cfg.rss, offline }
    );
    this.registerConnector(this.rss);

    // Mastodon (Zero-cost federated ActivityPub ingestion)
    this.mastodon = new MastodonConnector(
      cfg.mastodon?.instances,
      cfg.mastodon?.tags,
      { ...cfg.mastodon, offline }
    );
    this.registerConnector(this.mastodon);

    // GitHub (Zero-cost public developer event stream)
    this.github = new GitHubActivityConnector(
      cfg.github?.targetRepos,
      { ...cfg.github, offline }
    );
    this.registerConnector(this.github);

    // X (Twitter)
    this.x = new XConnector(
      cfg.x?.query ?? 'AI OR tech OR market OR breaking',
      { ...cfg.x, offline }
    );
    this.registerConnector(this.x);

    // YouTube
    this.youtube = new YouTubeConnector(
      cfg.youtube?.videoIds ?? [],
      { ...cfg.youtube, offline }
    );
    this.registerConnector(this.youtube);

    // Instagram
    this.instagram = new InstagramConnector(
      cfg.instagram?.igMediaIds ?? [],
      { ...cfg.instagram, offline }
    );
    this.registerConnector(this.instagram);

    // Local
    this.local = new LocalStreamConnector({ offline: false });
    this.registerConnector(this.local);

    if (cfg.onUpdate) {
      this.graphHandlers.push(cfg.onUpdate);
    }
    if (cfg.onPost) {
      this.postHandlers.push(cfg.onPost);
    }
    if (cfg.onStatusChange) {
      this.statusHandlers.push(cfg.onStatusChange);
    }
  }

  /**
   * Registers and ingests an incoming live post with persistent deduplication
   * and 10,000-capacity ring buffering.
   */
  public registerConnectorPost(post: LivePost): void {
    this.eventsReceived++;

    // Persistent deduplication surviving reconnects
    if (this.persistentDedup.has(post.id)) {
      this.duplicatesSkipped++;
      return;
    }
    this.persistentDedup.add(post.id);

    this.eventsProcessed++;
    this.recordIngestionTimestamp();

    if (!this.newestEventTime || post.timestamp > this.newestEventTime) {
      this.newestEventTime = post.timestamp;
    }
    if (!this.oldestEventTime || post.timestamp < this.oldestEventTime) {
      this.oldestEventTime = post.timestamp;
    }

    // Add to infinite event queue (up to 10,000 items)
    this.eventQueue.push(post);
    if (this.eventQueue.length > this.maxQueueSize) {
      this.eventQueue.shift();
    }

    this.handlePost(post);
    this.postHandlers.forEach(h => {
      try { h(post); } catch (e) { console.error('Error in post handler:', e); }
    });
  }

  private registerConnector(connector: LiveConnector): void {
    this.connectors.set(connector.id, connector);

    connector.onEvent((event: LiveEvent) => {
      if (event.type === 'post') {
        this.registerConnectorPost(event.payload as LivePost);
      } else if (event.type === 'status_change') {
        const state = event.payload as ConnectorState;
        this.statusHandlers.forEach(h => {
          try { h(state); } catch (e) { console.error('Error in status handler:', e); }
        });
      }
    });
  }

  public onUpdate(handler: (update: LiveGraphUpdate) => void): void {
    this.graphHandlers.push(handler);
  }

  public onPost(handler: (post: LivePost) => void): void {
    this.postHandlers.push(handler);
  }

  public onStatusChange(handler: (state: ConnectorState) => void): void {
    this.statusHandlers.push(handler);
  }

  private recordIngestionTimestamp(): void {
    const now = Date.now();
    this.recentTimestamps.push(now);
    // Keep 5-second window
    const cutoff = now - 5000;
    while (this.recentTimestamps.length > 0 && this.recentTimestamps[0] < cutoff) {
      this.recentTimestamps.shift();
    }
  }

  public getCommentsPerSecond(): number {
    this.recordIngestionTimestamp(); // Prune stale
    const duration = 5.0;
    return Number((this.recentTimestamps.length / duration).toFixed(1));
  }

  public getTotalIngested(): number {
    let total = 0;
    for (const c of this.connectors.values()) {
      const state = typeof c.getStatus === 'function' ? c.getStatus() : typeof c.getState === 'function' ? c.getState() : null;
      if (state && typeof state.itemsIngested === 'number') {
        total += state.itemsIngested;
      }
    }
    return total;
  }

  private handlePost(post: LivePost): void {
    const update: LiveGraphUpdate = {
      newAgentId: `live-${post.platform}-${post.authorId}`,
      newAgentName: post.authorName,
      content: post.content,
      timestamp: post.timestamp,
      platform: post.platform,
      parentAgentId: post.parentId ? `live-${post.platform}-${post.parentId}` : undefined,
      isReply: post.isReply,
    };
    this.graphHandlers.forEach(h => {
      try { h(update); } catch (e) { console.error('Error in graph handler:', e); }
    });
  }

  async startAll(): Promise<void> {
    for (const c of this.connectors.values()) {
      try {
        await c.connect();
      } catch (err) {
        console.error(`Failed to connect connector ${c.id}:`, err);
      }
    }
  }

  stopAll(): void {
    for (const c of this.connectors.values()) {
      try {
        c.disconnect();
      } catch (err) {
        console.error(`Failed to disconnect connector ${c.id}:`, err);
      }
    }
  }

  async connectConnector(id: string): Promise<void> {
    const c = this.connectors.get(id);
    if (c) {
      await c.connect();
    }
  }

  disconnectConnector(id: string): void {
    const c = this.connectors.get(id);
    if (c) {
      c.disconnect();
    }
  }

  getStatuses(): ConnectorState[] {
    const list: ConnectorState[] = [];
    for (const c of this.connectors.values()) {
      list.push(c.getStatus());
    }
    return list;
  }

  getConnectorStatuses(): ConnectorState[] {
    return this.getStatuses();
  }

  getHealths(): import('./types').ConnectorHealth[] {
    const list: import('./types').ConnectorHealth[] = [];
    for (const c of this.connectors.values()) {
      list.push(c.getHealth());
    }
    return list;
  }

  /**
   * Stage 6: Public-Source URL Ingestion
   */
  async ingestPublicUrl(url: string): Promise<LivePost | null> {
    return this.x.ingestPublicUrl(url);
  }

  getConnector(id: string): LiveConnector | undefined {
    return this.connectors.get(id);
  }

  getAllConnectors(): LiveConnector[] {
    return Array.from(this.connectors.values());
  }

  /**
   * Returns items from the infinite stream event queue.
   */
  public getEventQueue(limit?: number): LivePost[] {
    if (limit && limit > 0) {
      return this.eventQueue.slice(-limit);
    }
    return [...this.eventQueue];
  }

  public getQueueSize(): number {
    return this.eventQueue.length;
  }

  public clearQueue(): void {
    this.eventQueue = [];
    this.persistentDedup.clear();
    this.eventsReceived = 0;
    this.eventsProcessed = 0;
    this.duplicatesSkipped = 0;
  }

  /**
   * Stage 8: Stream Health Telemetry per connector
   */
  public getStreamHealth(): Record<string, StreamHealthMetrics> {
    const healthMap: Record<string, StreamHealthMetrics> = {};
    for (const [id, c] of this.connectors.entries()) {
      if (typeof c.getStreamHealth === 'function') {
        healthMap[id] = c.getStreamHealth();
      } else {
        const status = c.getStatus();
        healthMap[id] = {
          id,
          platform: c.platform,
          status: status.status,
          eventsReceived: status.eventsReceived || status.itemsIngested,
          eventsProcessed: status.eventsProcessed || status.itemsIngested,
          duplicatesSkipped: status.duplicatesSkipped || 0,
          newestEventTime: status.newestEventTime || null,
          oldestEventTime: status.oldestEventTime || null,
          queueSize: status.itemsIngested,
          cursor: status.cursor || 'latest',
          bufferCapacity: this.maxQueueSize,
          avgLatencyMs: status.avgLatencyMs || status.latencyMs || 25,
        };
      }
    }
    return healthMap;
  }

  /**
   * Aggregated system-wide stream health
   */
  public getOverallStreamHealth(): StreamHealthMetrics {
    return {
      id: 'system_stream_engine',
      platform: 'local',
      status: this.getTotalIngested() > 0 ? 'live' : 'idle',
      eventsReceived: this.eventsReceived,
      eventsProcessed: this.eventsProcessed,
      duplicatesSkipped: this.duplicatesSkipped,
      newestEventTime: this.newestEventTime,
      oldestEventTime: this.oldestEventTime,
      queueSize: this.eventQueue.length,
      bufferCapacity: this.maxQueueSize,
      avgLatencyMs: 15,
    };
  }
}
