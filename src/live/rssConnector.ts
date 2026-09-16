import { LivePost, ConnectorConfig, ConnectorState, LiveEventHandler, LiveConnector } from './types';
import { DedupStore } from './dedup';

export const DEFAULT_RSS_FEEDS = [
  'https://feeds.bbci.co.uk/news/world/rss.xml',
  'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
  'https://www.theguardian.com/world/rss',
];

export class RssConnector implements LiveConnector {
  public readonly id = 'rss';
  public readonly platform = 'rss' as const;
  private state: ConnectorState;
  private dedup: DedupStore;
  private timer: ReturnType<typeof setInterval> | null = null;
  private config: Required<Pick<ConnectorConfig, 'pollIntervalMs' | 'maxItemsPerPoll' | 'dedupWindowMs' | 'offline'>>;
  private handlers: LiveEventHandler[] = [];
  private messageHandlers: Array<(post: LivePost) => void> = [];

  constructor(
    private feedUrls: string[] = DEFAULT_RSS_FEEDS,
    config?: Partial<ConnectorConfig>
  ) {
    this.config = {
      pollIntervalMs: config?.pollIntervalMs ?? 120_000,
      maxItemsPerPoll: config?.maxItemsPerPoll ?? 30,
      dedupWindowMs: config?.dedupWindowMs ?? 3_600_000,
      offline: config?.offline ?? false,
    };
    this.dedup = new DedupStore(this.config.dedupWindowMs);
    this.state = { id: 'rss', platform: 'rss', status: 'idle', lastPollAt: null, itemsIngested: 0 };
  }

  on(handler: LiveEventHandler): void {
    this.handlers.push(handler);
  }

  onMessage(handler: (post: LivePost) => void): void {
    this.messageHandlers.push(handler);
  }

  private emit(type: 'post' | 'status_change' | 'error', payload: LivePost | ConnectorState | Error): void {
    this.handlers.forEach(h => h({ type, connector: 'rss', payload, timestamp: Date.now() }));
    if (type === 'post') {
      this.messageHandlers.forEach(h => h(payload as LivePost));
    }
  }

  private updateStatus(status: ConnectorState['status'], extra?: Partial<ConnectorState>): void {
    this.state = { ...this.state, status, ...extra };
    this.emit('status_change', this.state);
  }

  connect(): Promise<void> {
    return this.start();
  }

  disconnect(): void {
    this.stop();
  }

  async start(): Promise<void> {
    if (this.config.offline) {
      this.updateStatus('paused', { errorMessage: 'Offline mode' });
      return;
    }
    this.updateStatus('connecting');
    await this.pollAll();
    this.timer = setInterval(() => void this.pollAll(), this.config.pollIntervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.updateStatus('idle');
  }

  getStatus(): ConnectorState {
    return { ...this.state };
  }

  getState(): ConnectorState {
    return this.getStatus();
  }

  private async pollAll(): Promise<void> {
    let any = false;
    for (const feedUrl of this.feedUrls) {
      try {
        const posts = await this.fetchFeed(feedUrl);
        posts.forEach(p => {
          this.emit('post', p);
          this.state.itemsIngested++;
        });
        if (posts.length > 0) any = true;
      } catch (err) {
        this.emit('error', err instanceof Error ? err : new Error(String(err)));
      }
    }
    if (any) this.updateStatus('live', { lastPollAt: Date.now() });
  }

  private async fetchFeed(feedUrl: string): Promise<LivePost[]> {
    const isBrowser = typeof window !== 'undefined';
    // In browser use AllOrigins CORS proxy; in Node direct fetch works
    const targetUrl = isBrowser
      ? `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`
      : feedUrl;

    const res = await fetch(targetUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${feedUrl}`);

    let xml = '';
    if (isBrowser) {
      const json = await res.json() as { contents?: string };
      xml = json.contents ?? '';
    } else {
      xml = await res.text();
    }

    return this.parseRSS(xml, feedUrl);
  }

  public parseRSS(xml: string, feedUrl: string): LivePost[] {
    const posts: LivePost[] = [];

    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      const items = Array.from(doc.querySelectorAll('item'));

      for (const item of items.slice(0, this.config.maxItemsPerPoll)) {
        const guid = item.querySelector('guid')?.textContent ?? '';
        const title = item.querySelector('title')?.textContent ?? '';
        const desc = item.querySelector('description')?.textContent ?? '';
        const pubDate = item.querySelector('pubDate')?.textContent ?? '';
        const link = item.querySelector('link')?.textContent ?? '';
        const idRaw = guid || link || title;
        const id = `rss-${idRaw.slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        if (this.dedup.has(id)) continue;
        this.dedup.add(id);

        posts.push({
          id,
          platform: 'rss',
          authorId: feedUrl,
          authorName: feedUrl.includes('://') ? new URL(feedUrl).hostname : 'rss-feed',
          content: `${title}. ${desc}`.replace(/<[^>]+>/g, '').trim().slice(0, 500),
          timestamp: pubDate ? new Date(pubDate).getTime() : Date.now(),
          url: link,
        });
      }
    } else {
      // Regex-based fallback for non-DOM environments
      const itemRegex = /<item[\s\S]*?<\/item>/gi;
      const matches = xml.match(itemRegex) || [];

      for (const itemXml of matches.slice(0, this.config.maxItemsPerPoll)) {
        const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(itemXml);
        const descMatch = /<description[^>]*>([\s\S]*?)<\/description>/i.exec(itemXml);
        const linkMatch = /<link[^>]*>([\s\S]*?)<\/link>/i.exec(itemXml);
        const guidMatch = /<guid[^>]*>([\s\S]*?)<\/guid>/i.exec(itemXml);
        const pubDateMatch = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i.exec(itemXml);

        const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').trim() : '';
        const desc = descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').trim() : '';
        const link = linkMatch ? linkMatch[1].trim() : '';
        const guid = guidMatch ? guidMatch[1].trim() : '';
        const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';

        const idRaw = guid || link || title;
        const id = `rss-${idRaw.slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        if (this.dedup.has(id)) continue;
        this.dedup.add(id);

        posts.push({
          id,
          platform: 'rss',
          authorId: feedUrl,
          authorName: feedUrl.includes('://') ? new URL(feedUrl).hostname : 'rss-feed',
          content: `${title}. ${desc}`.replace(/<[^>]+>/g, '').trim().slice(0, 500),
          timestamp: pubDate ? new Date(pubDate).getTime() : Date.now(),
          url: link,
        });
      }
    }

    return posts;
  }
}
