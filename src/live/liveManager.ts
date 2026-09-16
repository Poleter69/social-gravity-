import { RedditConnector, DEFAULT_SUBREDDITS } from './redditConnector';
import { BlueskyConnector } from './blueskyConnector';
import { RssConnector, DEFAULT_RSS_FEEDS } from './rssConnector';
import { LocalStreamConnector } from './localStreamConnector';
import { XConnector } from './xConnector';
import { YouTubeConnector } from './youtubeConnector';
import { InstagramConnector } from './instagramConnector';
import { LivePost, ConnectorState, ConnectorConfig, LiveConnector, LiveEvent } from './types';

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
  x: XConnector;
  youtube: YouTubeConnector;
  instagram: InstagramConnector;
  local: LocalStreamConnector;

  private connectors: Map<string, LiveConnector> = new Map();
  private graphHandlers: Array<(update: LiveGraphUpdate) => void> = [];
  private postHandlers: Array<(post: LivePost) => void> = [];
  private statusHandlers: Array<(state: ConnectorState) => void> = [];

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

  private registerConnector(connector: LiveConnector): void {
    this.connectors.set(connector.id, connector);

    connector.onEvent((event: LiveEvent) => {
      if (event.type === 'post') {
        const post = event.payload as LivePost;
        this.recordIngestionTimestamp();
        this.handlePost(post);
        this.postHandlers.forEach(h => {
          try { h(post); } catch (e) { console.error('Error in post handler:', e); }
        });
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
      total += c.getStatus().itemsIngested;
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

  getConnector(id: string): LiveConnector | undefined {
    return this.connectors.get(id);
  }

  getAllConnectors(): LiveConnector[] {
    return Array.from(this.connectors.values());
  }
}
