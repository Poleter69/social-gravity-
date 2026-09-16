import { LivePost, ConnectorConfig, ConnectorState, LiveEventHandler, LiveConnector } from './types';
import { DedupStore } from './dedup';

export class RedditConnector implements LiveConnector {
  public readonly id = 'reddit';
  public readonly platform = 'reddit' as const;
  private state: ConnectorState;
  private dedup: DedupStore;
  private timer: ReturnType<typeof setInterval> | null = null;
  private config: Required<Pick<ConnectorConfig, 'pollIntervalMs' | 'maxItemsPerPoll' | 'dedupWindowMs' | 'offline'>>;
  private handlers: LiveEventHandler[] = [];
  private messageHandlers: Array<(post: LivePost) => void> = [];

  constructor(
    private subreddits: string[], // e.g. ['worldnews', 'technology']
    config?: Partial<ConnectorConfig>
  ) {
    this.config = {
      pollIntervalMs: config?.pollIntervalMs ?? 45_000,
      maxItemsPerPoll: config?.maxItemsPerPoll ?? 25,
      dedupWindowMs: config?.dedupWindowMs ?? 300_000,
      offline: config?.offline ?? false,
    };
    this.dedup = new DedupStore(this.config.dedupWindowMs);
    this.state = {
      id: 'reddit',
      platform: 'reddit',
      status: 'idle',
      lastPollAt: null,
      itemsIngested: 0,
    };
  }

  on(handler: LiveEventHandler): void { this.handlers.push(handler); }

  onMessage(handler: (post: LivePost) => void): void {
    this.messageHandlers.push(handler);
  }

  private emit(type: 'post' | 'status_change' | 'error', payload: LivePost | ConnectorState | Error): void {
    const event = { type, connector: 'reddit', payload, timestamp: Date.now() };
    this.handlers.forEach(h => h(event));
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
    if (this.config.offline) { this.updateStatus('paused', { errorMessage: 'Offline mode' }); return; }
    this.updateStatus('connecting');
    await this.poll();
    this.timer = setInterval(() => void this.poll(), this.config.pollIntervalMs);
  }

  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.updateStatus('idle');
  }

  getStatus(): ConnectorState { return { ...this.state }; }
  getState(): ConnectorState { return this.getStatus(); }

  private async poll(): Promise<void> {
    try {
      const subreddit = this.subreddits[Math.floor(Math.random() * this.subreddits.length)];
      const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${this.config.maxItemsPerPoll}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'SocialGravityAnalyst/1.0 (local research tool)' }
      });

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('Retry-After') ?? 60) * 1000;
        this.updateStatus('rate_limited', { rateLimitResetAt: Date.now() + retryAfter, errorMessage: 'Rate limited by Reddit' });
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json() as { data?: { children?: Array<{ data: Record<string, unknown> }> } };
      const posts = json.data?.children ?? [];
      let newCount = 0;

      for (const child of posts) {
        const d = child.data;
        const id = 'reddit-' + String(d['id'] ?? Date.now());
        if (this.dedup.has(id)) continue;
        this.dedup.add(id);
        const post: LivePost = {
          id,
          platform: 'reddit',
          authorId: String(d['author_fullname'] ?? d['author'] ?? 'anon'),
          authorName: String(d['author'] ?? 'anon'),
          content: String(d['selftext'] ?? d['title'] ?? ''),
          timestamp: (Number(d['created_utc'] ?? 0)) * 1000 || Date.now(),
          subreddit: String(d['subreddit'] ?? subreddit),
          threadId: String(d['name'] ?? id),
          url: String(d['url'] ?? ''),
        };
        this.emit('post', post);
        newCount++;
      }

      this.state.itemsIngested += newCount;
      this.updateStatus('live', { lastPollAt: Date.now() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.updateStatus('error', { errorMessage: msg });
      this.emit('error', err instanceof Error ? err : new Error(msg));
    }
  }
}
