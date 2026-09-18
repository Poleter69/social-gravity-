/**
 * Social Gravity - Reddit Live Ingestion Connector
 * Real-time Reddit ingestion with multi-subreddit monitoring,
 * post & comment polling, deduplication, rate limit detection, and health telemetry.
 */

import { LivePost, ConnectorConfig, ConnectorState, ConnectorHealth, LiveEventHandler, LiveConnector, LiveEvent } from './types';
import { DedupStore } from './dedup';

export const DEFAULT_SUBREDDITS = ['technology', 'worldnews', 'news', 'science', 'artificial'];

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
  private subredditCursors: Map<string, { after?: string; before?: string; lastId?: string; lastTimestamp?: number }> = new Map();
  private newestEventTime: number | null = null;
  private oldestEventTime: number | null = null;

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
      this.updateStatus('connected', { errorMessage: undefined });
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

  public getHealth(): ConnectorHealth {
    const status = this.state.status;
    const healthy = status === 'live' || status === 'connected';
    return {
      id: 'reddit',
      platform: 'reddit',
      status,
      healthy,
      latencyMs: this.state.latencyMs || 45,
      lastEventAt: this.state.lastPollAt,
      errorCount: status === 'error' ? 1 : 0,
      successRate: status === 'rate_limited' ? 0.5 : status === 'error' ? 0 : 1.0,
      itemsIngested: this.state.itemsIngested,
      details: `Reddit API Ingest (r/${this.subreddits.slice(0, 3).join(', r/')})`,
    };
  }

  public getStreamHealth(): import('./types').StreamHealthMetrics {
    const currentSub = this.subreddits[this.currentSubredditIndex % this.subreddits.length] || 'all';
    const cursorObj = this.subredditCursors.get(currentSub);
    return {
      id: 'reddit',
      platform: 'reddit',
      status: this.state.status,
      eventsReceived: this.totalReceived,
      eventsProcessed: this.totalProcessed,
      duplicatesSkipped: this.dedup.getDuplicatesSkipped(),
      newestEventTime: this.newestEventTime,
      oldestEventTime: this.oldestEventTime,
      queueSize: this.state.itemsIngested,
      cursor: cursorObj?.after || cursorObj?.lastId || 'genesis',
      bufferCapacity: 10_000,
      avgLatencyMs: this.state.avgLatencyMs || 45,
    };
  }

  public getCursor(subreddit?: string): { after?: string; before?: string; lastId?: string; lastTimestamp?: number } | undefined {
    const sub = subreddit || this.subreddits[this.currentSubredditIndex % this.subreddits.length];
    return this.subredditCursors.get(sub);
  }

  public setSubreddits(subs: string[]): void {
    if (subs.length > 0) {
      this.subreddits = subs;
      this.currentSubredditIndex = 0;
      this.state.endpoint = `r/${this.subreddits.join(', r/')}`;
    }
  }

  /**
   * Main poll loop: alternates between posts and comments across monitored subreddits
   * with automatic forward pagination and cursor progression.
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
        this.totalReceived++;
        if (this.dedup.has(p.id)) {
          this.dedup.recordDuplicate();
          continue;
        }
        this.dedup.add(p.id);

        this.totalProcessed++;
        this.state.itemsIngested++;

        if (!this.newestEventTime || p.timestamp > this.newestEventTime) {
          this.newestEventTime = p.timestamp;
        }
        if (!this.oldestEventTime || p.timestamp < this.oldestEventTime) {
          this.oldestEventTime = p.timestamp;
        }

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
        eventsReceived: this.totalReceived,
        eventsProcessed: this.totalProcessed,
        duplicatesSkipped: this.dedup.getDuplicatesSkipped(),
        newestEventTime: this.newestEventTime,
        oldestEventTime: this.oldestEventTime,
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
    const path = isComments ? `r/${subreddit}/comments` : `r/${subreddit}/hot`;
    const cursor = this.subredditCursors.get(subreddit);

    let queryParams = `limit=${this.config.maxItemsPerPoll}`;
    if (cursor?.after) {
      queryParams += `&after=${encodeURIComponent(cursor.after)}`;
    }

    // Try RSS/Atom first as it is public, highly reliable, and avoids 403 blocks
    const rssUrl = `https://www.reddit.com/${path}.rss?${queryParams}`;
    const targetUrl = isBrowser
      ? (window.location.port === '3000' || window.location.port === '5173')
        ? `/api/reddit/${path}.rss?${queryParams}`
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
    const cursor = this.subredditCursors.get(subreddit);

    let queryParams = `limit=${this.config.maxItemsPerPoll}`;
    if (cursor?.after) {
      queryParams += `&after=${encodeURIComponent(cursor.after)}`;
    }

    const jsonUrl = `https://www.reddit.com/${path}?${queryParams}`;

    const targetUrl = isBrowser
      ? (window.location.port === '3000' || window.location.port === '5173')
        ? `/api/reddit/${path}?${queryParams}`
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
        parentId: isComments ? cleanTitle : undefined,
        isReply,
        url: linkMatch ? linkMatch[1] : undefined,
        cursor: rawId,
        metadata: {
          rawId,
          type: isReply ? 'comment' : 'submission',
          subreddit,
        },
      });
    }

    if (posts.length > 0) {
      const firstPost = posts[0];
      const lastPost = posts[posts.length - 1];
      const rawBefore = (firstPost.metadata?.rawId as string) || firstPost.id;
      const rawAfter = (lastPost.metadata?.rawId as string) || lastPost.id;
      const existing = this.subredditCursors.get(subreddit) || {};
      this.subredditCursors.set(subreddit, {
        ...existing,
        before: rawBefore,
        after: rawAfter,
        lastId: firstPost.id,
        lastTimestamp: firstPost.timestamp,
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
        cursor: d.name || d.id || id,
        metadata: {
          score: d.score,
          numComments: d.num_comments,
          isReply,
        },
      });
    }

    const nextAfter = json?.data?.after;
    const prevBefore = json?.data?.before;
    if (nextAfter || prevBefore || posts.length > 0) {
      const existing = this.subredditCursors.get(subreddit) || {};
      this.subredditCursors.set(subreddit, {
        ...existing,
        after: nextAfter || existing.after,
        before: prevBefore || existing.before,
        lastId: posts[0]?.id || existing.lastId,
        lastTimestamp: posts[0]?.timestamp || existing.lastTimestamp,
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
