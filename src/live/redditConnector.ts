/**
 * Social Gravity - Reddit Live Ingestion Connector
 * Real-time Reddit ingestion with multi-subreddit monitoring,
 * post & comment polling, deduplication, rate limit detection, and health telemetry.
 */

import { LivePost, ConnectorConfig, ConnectorState, LiveEventHandler, LiveConnector, LiveEvent } from './types';
import { DedupStore } from './dedup';

export const DEFAULT_SUBREDDITS = ['technology', 'science', 'worldnews'];

export class RedditConnector implements LiveConnector {
  public readonly id = 'reddit';
  public readonly platform = 'reddit' as const;

  private state: ConnectorState;
  private dedup: DedupStore;
  private timer: ReturnType<typeof setInterval> | null = null;
  private config: Required<Pick<ConnectorConfig, 'pollIntervalMs' | 'maxItemsPerPoll' | 'dedupWindowMs' | 'offline'>> & Partial<ConnectorConfig>;
  private eventHandlers: LiveEventHandler[] = [];
  private messageHandlers: Array<(post: LivePost) => void> = [];

  private currentSubredditIndex = 0;
  private pollTarget: 'posts' | 'comments' = 'posts';
  private totalReceived = 0;
  private totalProcessed = 0;
  private latencies: number[] = [];

  constructor(
    private subreddits: string[] = DEFAULT_SUBREDDITS,
    config?: Partial<ConnectorConfig>
  ) {
    this.config = {
      pollIntervalMs: config?.pollIntervalMs ?? 15_000,
      maxItemsPerPoll: config?.maxItemsPerPoll ?? 25,
      dedupWindowMs: config?.dedupWindowMs ?? 300_000,
      offline: config?.offline ?? false,
      accessToken: config?.accessToken,
      apiKey: config?.apiKey,
      clientId: config?.clientId,
      clientSecret: config?.clientSecret,
    };
    this.dedup = new DedupStore(this.config.dedupWindowMs);
    this.state = {
      id: 'reddit',
      platform: 'reddit',
      status: 'idle',
      lastPollAt: null,
      itemsIngested: 0,
      eventsReceived: 0,
      eventsProcessed: 0,
      queueDepth: 0,
      avgLatencyMs: 0,
      latencyMs: 0,
      pollIntervalMs: this.config.pollIntervalMs,
      endpoint: `r/${this.subreddits.join(', r/')}`,
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
      connector: 'reddit',
      payload,
      timestamp: Date.now(),
    };
    this.eventHandlers.forEach(h => {
      try {
        h(event);
      } catch (err) {
        console.error('[RedditConnector] Error in event handler:', err);
      }
    });

    if (type === 'post') {
      const post = payload as LivePost;
      this.messageHandlers.forEach(h => {
        try {
          h(post);
        } catch (err) {
          console.error('[RedditConnector] Error in message handler:', err);
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
    await this.poll();

    if (!this.timer) {
      this.timer = setInterval(() => void this.poll(), this.config.pollIntervalMs);
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

  public setSubreddits(subs: string[]): void {
    if (subs.length > 0) {
      this.subreddits = subs;
      this.currentSubredditIndex = 0;
      this.state.endpoint = `r/${this.subreddits.join(', r/')}`;
    }
  }

  /**
   * Main poll loop: alternates between posts and comments across monitored subreddits.
   */
  private async poll(): Promise<void> {
    // If rate limited, check if cool down expired
    if (this.state.status === 'rate_limited') {
      if (this.state.rateLimitResetAt && Date.now() < this.state.rateLimitResetAt) {
        return;
      }
      this.updateStatus('connecting', { errorMessage: undefined });
    }

    if (this.subreddits.length === 0) return;

    const subreddit = this.subreddits[this.currentSubredditIndex % this.subreddits.length];
    const isComments = this.pollTarget === 'comments';

    // Alternate target for next poll
    this.pollTarget = isComments ? 'posts' : 'comments';
    if (!isComments) {
      this.currentSubredditIndex = (this.currentSubredditIndex + 1) % this.subreddits.length;
    }

    try {
      const posts = await this.fetchRedditData(subreddit, isComments);
      let newCount = 0;

      for (const p of posts) {
        if (this.dedup.has(p.id)) continue;
        this.dedup.add(p.id);

        this.totalReceived++;
        this.totalProcessed++;
        this.state.itemsIngested++;

        const latency = Math.max(0, Date.now() - p.timestamp);
        this.latencies.push(latency);
        if (this.latencies.length > 50) this.latencies.shift();
        const avgLatency = Math.round(this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length);

        this.state.latencyMs = latency;
        this.state.avgLatencyMs = avgLatency;

        this.emit('post', p);
        newCount++;
      }

      this.updateStatus('connected', {
        lastPollAt: Date.now(),
        errorMessage: undefined,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
        const retryDelay = 30_000;
        this.updateStatus('rate_limited', {
          rateLimitResetAt: Date.now() + retryDelay,
          errorMessage: 'Reddit rate limit reached. Backing off 30s.',
        });
      } else {
        this.updateStatus('error', { errorMessage: msg });
        this.emit('error', err instanceof Error ? err : new Error(msg));
      }
    }
  }

  /**
   * Fetches Reddit data via RSS/Atom or JSON endpoint, with CORS proxy support in browser.
   */
  private async fetchRedditData(subreddit: string, isComments: boolean): Promise<LivePost[]> {
    const isBrowser = typeof window !== 'undefined';
    const path = isComments ? `r/${subreddit}/comments` : `r/${subreddit}/new`;

    // Try RSS/Atom first as it is public, highly reliable, and avoids 403 blocks
    const rssUrl = `https://www.reddit.com/${path}.rss?limit=${this.config.maxItemsPerPoll}`;
    const targetUrl = isBrowser
      ? (window.location.port === '3000' || window.location.port === '5173')
        ? `/api/reddit/${path}.rss?limit=${this.config.maxItemsPerPoll}`
        : `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`
      : rssUrl;

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    };

    if (this.config.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`;
    }

    const res = await fetch(targetUrl, { headers });

    if (res.status === 429) {
      throw new Error('HTTP 429: Reddit rate limit');
    }
    if (!res.ok) {
      // If RSS failed, try json endpoint
      return this.fetchRedditJson(subreddit, isComments);
    }

    const text = await res.text();
    if (text.includes('<entry>')) {
      return this.parseRedditAtom(text, subreddit, isComments);
    } else if (text.trim().startsWith('{')) {
      return this.parseRedditJson(JSON.parse(text), subreddit, isComments);
    }

    return [];
  }

  private async fetchRedditJson(subreddit: string, isComments: boolean): Promise<LivePost[]> {
    const isBrowser = typeof window !== 'undefined';
    const path = isComments ? `r/${subreddit}/comments.json` : `r/${subreddit}/new.json`;
    const jsonUrl = `https://www.reddit.com/${path}?limit=${this.config.maxItemsPerPoll}`;

    const targetUrl = isBrowser
      ? (window.location.port === '3000' || window.location.port === '5173')
        ? `/api/reddit/${path}?limit=${this.config.maxItemsPerPoll}`
        : `https://api.allorigins.win/raw?url=${encodeURIComponent(jsonUrl)}`
      : jsonUrl;

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    };

    if (this.config.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`;
    }

    const res = await fetch(targetUrl, { headers });
    if (!res.ok) {
      throw new Error(`Reddit HTTP ${res.status}`);
    }

    const data = await res.json();
    return this.parseRedditJson(data, subreddit, isComments);
  }

  public parseRedditAtom(xml: string, subreddit: string, isComments: boolean): LivePost[] {
    const posts: LivePost[] = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
      const entryXml = match[1];
      const idMatch = /<id>([\s\S]*?)<\/id>/.exec(entryXml);
      const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(entryXml);
      const authorMatch = /<author>[\s\S]*?<name>([\s\S]*?)<\/name>/.exec(entryXml);
      const updatedMatch = /<updated>([\s\S]*?)<\/updated>/.exec(entryXml);
      const linkMatch = /<link href="([^"]+)"/.exec(entryXml);
      const contentMatch = /<content type="html">([\s\S]*?)<\/content>/.exec(entryXml);

      const rawId = idMatch ? idMatch[1].trim() : `reddit-${Date.now()}-${Math.random()}`;
      const id = rawId.startsWith('t1_') || rawId.startsWith('t3_') ? `reddit-${rawId}` : `reddit-${rawId.slice(0, 30)}`;

      const cleanTitle = titleMatch ? this.decodeHtml(titleMatch[1]) : '';
      const author = authorMatch ? authorMatch[1].replace(/^\/u\//, '') : 'anon';
      const rawHtml = contentMatch ? contentMatch[1] : '';
      const cleanContent = this.cleanHtmlContent(rawHtml, cleanTitle);

      const timestamp = updatedMatch ? new Date(updatedMatch[1]).getTime() : Date.now();
      const isReply = isComments || rawId.startsWith('t1_');

      posts.push({
        id,
        platform: 'reddit',
        authorId: `u_${author}`,
        authorName: `u/${author}`,
        content: cleanContent || cleanTitle,
        timestamp,
        subreddit,
        threadId: isComments ? cleanTitle : id,
        isReply,
        url: linkMatch ? linkMatch[1] : undefined,
        metadata: {
          rawId,
          type: isReply ? 'comment' : 'submission',
          subreddit,
        },
      });
    }

    return posts;
  }

  public parseRedditJson(json: any, subreddit: string, isComments: boolean): LivePost[] {
    const posts: LivePost[] = [];
    const children = json?.data?.children || [];

    for (const child of children) {
      const d = child.data;
      if (!d) continue;

      const id = `reddit-${d.id || Date.now()}`;
      const author = d.author || 'anon';
      const text = isComments
        ? (d.body || '')
        : (d.selftext ? `${d.title}. ${d.selftext}` : (d.title || ''));

      const isReply = isComments || Boolean(d.parent_id);

      posts.push({
        id,
        platform: 'reddit',
        authorId: d.author_fullname || `u_${author}`,
        authorName: `u/${author}`,
        content: text.slice(0, 600),
        timestamp: (Number(d.created_utc || 0)) * 1000 || Date.now(),
        subreddit: d.subreddit || subreddit,
        threadId: d.link_id || d.name || id,
        parentId: d.parent_id,
        isReply,
        url: d.permalink ? `https://reddit.com${d.permalink}` : d.url,
        metadata: {
          score: d.score,
          numComments: d.num_comments,
          isReply,
        },
      });
    }

    return posts;
  }

  private cleanHtmlContent(html: string, fallbackTitle: string): string {
    const stripped = html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#32;/g, ' ')
      .replace(/&#39;/g, "'")
      .replace(/submitted by\s+.*?to\s+r\/[a-zA-Z0-9_]+/gi, '')
      .replace(/\[link\]/gi, '')
      .replace(/\[comments\]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!stripped || stripped.length < 25 || stripped.toLowerCase().includes('submitted by') || stripped.startsWith('&lt;')) {
      return fallbackTitle;
    }
    return fallbackTitle && !stripped.includes(fallbackTitle)
      ? `${fallbackTitle} — ${stripped.slice(0, 400)}`
      : stripped.slice(0, 500);
  }

  private decodeHtml(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }
}
