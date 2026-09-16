import { RedditConnector } from './redditConnector';
import { BlueskyConnector } from './blueskyConnector';
import { RssConnector } from './rssConnector';
import { LocalStreamConnector } from './localStreamConnector';
import { XConnector } from './xConnector';
import { YouTubeConnector } from './youtubeConnector';
import { InstagramConnector } from './instagramConnector';
import { LivePost, ConnectorState, ConnectorConfig, LiveConnector } from './types';

export interface LiveGraphUpdate {
  newAgentId: string;
  newAgentName: string;
  content: string;
  timestamp: number;
  platform: LivePost['platform'];
  parentAgentId?: string;
}

export interface LiveManagerConfig {
  reddit?: { subreddits: string[] } & Partial<ConnectorConfig>;
  bluesky?: { keywords: string[] } & Partial<ConnectorConfig>;
  rss?: { feeds: string[] } & Partial<ConnectorConfig>;
  x?: { query: string } & Partial<ConnectorConfig>;
  youtube?: { videoIds: string[] } & Partial<ConnectorConfig>;
  instagram?: { igMediaIds: string[] } & Partial<ConnectorConfig>;
  offline?: boolean;
  onUpdate?: (update: LiveGraphUpdate) => void;
  onPost?: (post: LivePost) => void;
  onStatusChange?: (state: ConnectorState) => void;
}

export class LiveManager {
  reddit: RedditConnector | null = null;
  bluesky: BlueskyConnector | null = null;
  rss: RssConnector | null = null;
  x: XConnector | null = null;
  youtube: YouTubeConnector | null = null;
  instagram: InstagramConnector | null = null;
  local: LocalStreamConnector;

  private connectors: Map<string, LiveConnector> = new Map();
  private graphHandlers: Array<(update: LiveGraphUpdate) => void> = [];
  private postHandlers: Array<(post: LivePost) => void> = [];

  // Rolling comments/second calculation window
  private recentTimestamps: number[] = [];

  constructor(cfg: LiveManagerConfig = {}) {
    const offline = cfg.offline ?? false;

    // Reddit
    if (cfg.reddit) {
      this.reddit = new RedditConnector(cfg.reddit.subreddits, { ...cfg.reddit, offline });
      this.registerConnector(this.reddit, cfg);
    }

    // Bluesky
    if (cfg.bluesky) {
      this.bluesky = new BlueskyConnector(cfg.bluesky.keywords, { ...cfg.bluesky, offline });
      this.registerConnector(this.bluesky, cfg);
    }

    // RSS
    if (cfg.rss) {
      this.rss = new RssConnector(cfg.rss.feeds, { ...cfg.rss, offline });
      this.registerConnector(this.rss, cfg);
    }

    // X (Twitter)
    if (cfg.x) {
      this.x = new XConnector(cfg.x.query, { ...cfg.x, offline });
      this.registerConnector(this.x, cfg);
    }

    // YouTube
    if (cfg.youtube) {
      this.youtube = new YouTubeConnector(cfg.youtube.videoIds, { ...cfg.youtube, offline });
      this.registerConnector(this.youtube, cfg);
    }

    // Instagram
    if (cfg.instagram) {
      this.instagram = new InstagramConnector(cfg.instagram.igMediaIds, { ...cfg.instagram, offline });
      this.registerConnector(this.instagram, cfg);
    }

    // Local
    this.local = new LocalStreamConnector({ offline: false });
    this.registerConnector(this.local, cfg);

    if (cfg.onUpdate) {
      this.graphHandlers.push(cfg.onUpdate);
    }
    if (cfg.onPost) {
      this.postHandlers.push(cfg.onPost);
    }
  }

  private registerConnector(connector: LiveConnector, _cfg: LiveManagerConfig): void {
    this.connectors.set(connector.id, connector);
    connector.onMessage(post => {
      this.recordIngestionTimestamp();
      this.handlePost(post);
      this.postHandlers.forEach(h => h(post));
    });
  }

  public onUpdate(handler: (update: LiveGraphUpdate) => void): void {
    this.graphHandlers.push(handler);
  }

  public onPost(handler: (post: LivePost) => void): void {
    this.postHandlers.push(handler);
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
    };
    this.graphHandlers.forEach(h => h(update));
  }

  async startAll(): Promise<void> {
    for (const c of this.connectors.values()) {
      await c.connect();
    }
  }

  stopAll(): void {
    for (const c of this.connectors.values()) {
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
