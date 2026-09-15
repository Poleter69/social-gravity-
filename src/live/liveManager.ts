import { RedditConnector } from './redditConnector';
import { BlueskyConnector } from './blueskyConnector';
import { RssConnector } from './rssConnector';
import { LocalStreamConnector } from './localStreamConnector';
import { LivePost, ConnectorState, ConnectorConfig } from './types';

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
  offline?: boolean;
  onUpdate?: (update: LiveGraphUpdate) => void;
  onStatusChange?: (state: ConnectorState) => void;
}

export class LiveManager {
  reddit: RedditConnector | null = null;
  bluesky: BlueskyConnector | null = null;
  rss: RssConnector | null = null;
  local: LocalStreamConnector;
  private handlers: Array<(update: LiveGraphUpdate) => void> = [];

  constructor(cfg: LiveManagerConfig = {}) {
    const offline = cfg.offline ?? false;

    if (cfg.reddit) {
      this.reddit = new RedditConnector(cfg.reddit.subreddits, { ...cfg.reddit, offline });
      this.reddit.on(ev => {
        if (ev.type === 'post') this.handlePost(ev.payload as LivePost);
        if (ev.type === 'status_change' && cfg.onStatusChange) cfg.onStatusChange(ev.payload as ConnectorState);
      });
    }

    if (cfg.bluesky) {
      this.bluesky = new BlueskyConnector(cfg.bluesky.keywords, { ...cfg.bluesky, offline });
      this.bluesky.on(ev => {
        if (ev.type === 'post') this.handlePost(ev.payload as LivePost);
        if (ev.type === 'status_change' && cfg.onStatusChange) cfg.onStatusChange(ev.payload as ConnectorState);
      });
    }

    if (cfg.rss) {
      this.rss = new RssConnector(cfg.rss.feeds, { ...cfg.rss, offline });
      this.rss.on(ev => {
        if (ev.type === 'post') this.handlePost(ev.payload as LivePost);
        if (ev.type === 'status_change' && cfg.onStatusChange) cfg.onStatusChange(ev.payload as ConnectorState);
      });
    }

    this.local = new LocalStreamConnector({ offline: false });
    this.local.on(ev => {
      if (ev.type === 'post') this.handlePost(ev.payload as LivePost);
    });

    if (cfg.onUpdate) {
      this.handlers.push(cfg.onUpdate);
    }
  }

  onUpdate(handler: (update: LiveGraphUpdate) => void): void {
    this.handlers.push(handler);
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
    this.handlers.forEach(h => h(update));
  }

  async startAll(): Promise<void> {
    if (this.reddit) await this.reddit.start();
    if (this.bluesky) this.bluesky.start();
    if (this.rss) await this.rss.start();
  }

  stopAll(): void {
    this.reddit?.stop();
    this.bluesky?.stop();
    this.rss?.stop();
  }

  getStatuses(): ConnectorState[] {
    const list: ConnectorState[] = [];
    if (this.reddit) list.push(this.reddit.getState());
    if (this.bluesky) list.push(this.bluesky.getState());
    if (this.rss) list.push(this.rss.getState());
    list.push(this.local.getState());
    return list;
  }
}
