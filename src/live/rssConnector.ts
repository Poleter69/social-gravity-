/**
 * Social Gravity - Real-Time RSS/Atom Ingestion Connector
 * Streams live breaking news headlines with ETag, Last-Modified 304 caching,
 * Deduplication, and full connector health telemetry.
 */

import { LivePost, ConnectorConfig, ConnectorState, LiveEventHandler, LiveConnector, LiveEvent } from './types';
import { DedupStore } from './dedup';

export const DEFAULT_RSS_FEEDS = [
  'https://feeds.bbci.co.uk/news/world/rss.xml',
  'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  'https://news.ycombinator.com/rss',
  'https://www.theguardian.com/world/rss',
];

export class RssConnector implements LiveConnector {
  public readonly id = 'rss';
  public readonly platform = 'rss' as const;

  private state: ConnectorState;
  private dedup: DedupStore;
  private timer: ReturnType<typeof setInterval> | null = null;
  private config: Required<Pick<ConnectorConfig, 'pollIntervalMs' | 'maxItemsPerPoll' | 'dedupWindowMs' | 'offline'>>;
  private eventHandlers: LiveEventHandler[] = [];
  private messageHandlers: Array<(post: LivePost) => void> = [];

  // HTTP Caching headers per feed
  private etags: Map<string, string> = new Map();
  private lastModifiedDates: Map<string, string> = new Map();

  private totalReceived = 0;
  private totalProcessed = 0;
  private latencies: number[] = [];

  constructor(
    private feedUrls: string[] = DEFAULT_RSS_FEEDS,
    config?: Partial<ConnectorConfig>
  ) {
    this.config = {
      pollIntervalMs: config?.pollIntervalMs ?? 30_000,
      maxItemsPerPoll: config?.maxItemsPerPoll ?? 25,
      dedupWindowMs: config?.dedupWindowMs ?? 3_600_000,
      offline: config?.offline ?? false,
    };
    this.dedup = new DedupStore(this.config.dedupWindowMs);
    this.state = {
      id: 'rss',
      platform: 'rss',
      status: 'idle',
      lastPollAt: null,
      itemsIngested: 0,
      eventsReceived: 0,
      eventsProcessed: 0,
      queueDepth: 0,
      avgLatencyMs: 0,
      latencyMs: 0,
      pollIntervalMs: this.config.pollIntervalMs,
      endpoint: `${this.feedUrls.length} feeds configured`,
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
      connector: 'rss',
      payload,
      timestamp: Date.now(),
    };
    this.eventHandlers.forEach(h => {
      try {
        h(event);
      } catch (err) {
        console.error('[RssConnector] Error in event handler:', err);
      }
    });

    if (type === 'post') {
      const post = payload as LivePost;
      this.messageHandlers.forEach(h => {
        try {
          h(post);
        } catch (err) {
          console.error('[RssConnector] Error in message handler:', err);
        }
      });
    }
  }

  private updateStatus(status: ConnectorState['status'], extra?: Partial<ConnectorState>): void {
    this.state = {
      ...this.state,
      status,
      eventsReceived: this.totalReceived,
      eventsProcessed: this.totalProcessed,
      ...extra,
    };
    this.emit('status_change', this.state);
  }

  public async connect(): Promise<void> {
    if (this.state.status === 'connected' || this.state.status === 'connecting') {
      return;
    }

    if (this.config.offline) {
      this.updateStatus('offline', { errorMessage: 'Offline mode requested' });
      return;
    }

    this.updateStatus('connecting');
    await this.pollAll();

    if (!this.timer) {
      this.timer = setInterval(() => void this.pollAll(), this.config.pollIntervalMs);
    }
  }

  public disconnect(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.updateStatus('idle');
  }

  public start(): Promise<void> {
    return this.connect();
  }

  public stop(): void {
    this.disconnect();
  }

  public getStatus(): ConnectorState {
    return { ...this.state };
  }

  public getState(): ConnectorState {
    return this.getStatus();
  }

  public setFeeds(feeds: string[]): void {
    this.feedUrls = feeds;
    this.state.endpoint = `${this.feedUrls.length} feeds configured`;
  }

  private async pollAll(): Promise<void> {
    let anySuccess = false;

    for (const feedUrl of this.feedUrls) {
      try {
        const posts = await this.fetchFeed(feedUrl);
        for (const p of posts) {
          this.totalReceived++;
          if (this.dedup.has(p.id)) continue;
          this.dedup.add(p.id);

          this.totalProcessed++;
          this.state.itemsIngested++;

          const latency = Math.max(0, Date.now() - p.timestamp);
          this.latencies.push(latency);
          if (this.latencies.length > 50) this.latencies.shift();
          const avgLatency = Math.round(this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length);

          this.state.latencyMs = latency;
          this.state.avgLatencyMs = avgLatency;

          this.emit('post', p);
        }
        anySuccess = true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.emit('error', err instanceof Error ? err : new Error(msg));
      }
    }

    if (anySuccess) {
      this.updateStatus('connected', {
        lastPollAt: Date.now(),
        errorMessage: undefined,
      });
    } else {
      this.updateStatus('error', { errorMessage: 'All RSS feeds failed to respond' });
    }
  }

  private async fetchFeed(feedUrl: string): Promise<LivePost[]> {
    const isBrowser = typeof window !== 'undefined';
    const targetUrl = isBrowser
      ? `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`
      : feedUrl;

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SocialGravity/3.0',
    };

    // Stage 4: ETag and Last-Modified support
    const cachedEtag = this.etags.get(feedUrl);
    if (cachedEtag) {
      headers['If-None-Match'] = cachedEtag;
    }

    const cachedLastMod = this.lastModifiedDates.get(feedUrl);
    if (cachedLastMod) {
      headers['If-Modified-Since'] = cachedLastMod;
    }

    const res = await fetch(targetUrl, { headers });

    // 304 Not Modified: Cached content is still fresh
    if (res.status === 304) {
      return [];
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching feed: ${feedUrl}`);
    }

    // Save fresh caching headers
    const newEtag = res.headers.get('etag') || res.headers.get('ETag');
    if (newEtag) this.etags.set(feedUrl, newEtag);

    const newLastMod = res.headers.get('last-modified') || res.headers.get('Last-Modified');
    if (newLastMod) this.lastModifiedDates.set(feedUrl, newLastMod);

    const xml = await res.text();
    return this.parseRSS(xml, feedUrl);
  }

  public parseRSS(xml: string, feedUrl: string): LivePost[] {
    const posts: LivePost[] = [];
    const sourceHostname = this.extractHostname(feedUrl);

    // Parse RSS <item> tags
    const itemRegex = /<item[\s\S]*?<\/item>/gi;
    const matches = xml.match(itemRegex) || [];

    for (const itemXml of matches.slice(0, this.config.maxItemsPerPoll)) {
      const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(itemXml);
      const descMatch = /<description[^>]*>([\s\S]*?)<\/description>/i.exec(itemXml);
      const linkMatch = /<link[^>]*>([\s\S]*?)<\/link>/i.exec(itemXml);
      const guidMatch = /<guid[^>]*>([\s\S]*?)<\/guid>/i.exec(itemXml);
      const pubDateMatch = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i.exec(itemXml);

      const title = titleMatch ? this.cleanCdata(titleMatch[1]) : '';
      const desc = descMatch ? this.cleanCdata(descMatch[1]) : '';
      const link = linkMatch ? this.cleanCdata(linkMatch[1]).trim() : '';
      const guid = guidMatch ? this.cleanCdata(guidMatch[1]).trim() : '';
      const pubDate = pubDateMatch ? this.cleanCdata(pubDateMatch[1]).trim() : '';

      const idRaw = guid || link || title;
      const id = `rss-${idRaw.slice(0, 45).replace(/[^a-zA-Z0-9_-]/g, '_')}`;

      const cleanText = `${title}${desc ? ' — ' + desc : ''}`
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 500);

      posts.push({
        id,
        platform: 'rss',
        authorId: sourceHostname,
        authorName: sourceHostname,
        content: cleanText || title,
        timestamp: pubDate ? new Date(pubDate).getTime() : Date.now(),
        url: link,
        metadata: {
          feedUrl,
          title,
        },
      });
    }

    return posts;
  }

  private cleanCdata(raw: string): string {
    return raw
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  private extractHostname(urlStr: string): string {
    try {
      if (urlStr.includes('://')) {
        const u = new URL(urlStr);
        return u.hostname.replace(/^www\./, '');
      }
      return 'news-wire';
    } catch {
      return 'rss-source';
    }
  }
}
