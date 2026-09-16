/**
 * Social Gravity - X (Twitter) Real-Time Streaming Connector
 * Milestone M19: Official API v2 Filtered Stream / Search with offline synthetic stream
 */

import { LivePost, ConnectorConfig, ConnectorState, LiveConnector, LiveEventHandler } from './types';
import { DedupStore } from './dedup';

export class XConnector implements LiveConnector {
  public readonly id = 'x';
  public readonly platform = 'x' as const;
  private state: ConnectorState;
  private dedup: DedupStore;
  private config: Required<Pick<ConnectorConfig, 'pollIntervalMs' | 'maxItemsPerPoll' | 'dedupWindowMs' | 'offline'>> & Partial<ConnectorConfig>;
  private handlers: Array<(post: LivePost) => void> = [];
  private eventHandlers: LiveEventHandler[] = [];
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private syntheticInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private query: string = 'AI OR tech OR market OR breaking',
    config?: Partial<ConnectorConfig>
  ) {
    this.config = {
      pollIntervalMs: config?.pollIntervalMs ?? 15_000,
      maxItemsPerPoll: config?.maxItemsPerPoll ?? 50,
      dedupWindowMs: config?.dedupWindowMs ?? 120_000,
      offline: config?.offline ?? false,
      accessToken: config?.accessToken,
      apiKey: config?.apiKey,
    };
    this.dedup = new DedupStore(this.config.dedupWindowMs);
    this.state = {
      id: 'x',
      platform: 'x',
      status: 'idle',
      lastPollAt: null,
      itemsIngested: 0,
    };
  }

  public onMessage(handler: (post: LivePost) => void): void {
    this.handlers.push(handler);
  }

  public on(handler: LiveEventHandler): void {
    this.eventHandlers.push(handler);
  }

  public getStatus(): ConnectorState {
    return { ...this.state };
  }

  public getState(): ConnectorState {
    return this.getStatus();
  }

  private updateStatus(status: ConnectorState['status'], extra?: Partial<ConnectorState>): void {
    this.state = { ...this.state, status, ...extra };
    this.eventHandlers.forEach(h =>
      h({ type: 'status_change', connector: 'x', payload: this.state, timestamp: Date.now() })
    );
  }

  public async connect(): Promise<void> {
    if (this.state.status === 'live') return;

    this.updateStatus('connecting');

    // If online with valid Bearer token, attempt official API v2 search endpoint
    if (!this.config.offline && this.config.accessToken) {
      try {
        await this.pollXApi();
        this.pollTimer = setInterval(() => this.pollXApi(), this.config.pollIntervalMs);
        this.updateStatus('live', { lastPollAt: Date.now() });
      } catch (err: any) {
        this.updateStatus('error', { errorMessage: err?.message || 'X API connection error' });
      }
    } else {
      // Offline / Developer Demo mode: high-fidelity streaming stream
      this.updateStatus('live', { lastPollAt: Date.now() });
      this.startSyntheticStream();
    }
  }

  public disconnect(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.syntheticInterval) {
      clearInterval(this.syntheticInterval);
      this.syntheticInterval = null;
    }
    this.updateStatus('idle');
  }

  public start(): Promise<void> {
    return this.connect();
  }

  public stop(): void {
    this.disconnect();
  }

  private async pollXApi(): Promise<void> {
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(
      this.query
    )}&max_results=${Math.min(this.config.maxItemsPerPoll, 100)}&tweet.fields=created_at,author_id,public_metrics`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.config.accessToken}` },
    });

    if (response.status === 429) {
      this.updateStatus('rate_limited', { errorMessage: 'X API rate limit exceeded' });
      return;
    }
    if (!response.ok) {
      throw new Error(`X API returned HTTP ${response.status}`);
    }

    const json = await response.json();
    const data = (json.data || []) as any[];

    for (const tweet of data) {
      if (this.dedup.has(tweet.id)) continue;
      this.dedup.add(tweet.id);

      const post: LivePost = {
        id: `x-${tweet.id}`,
        platform: 'x',
        authorId: tweet.author_id || 'x_user',
        authorName: `@${tweet.author_id || 'analyst'}`,
        content: tweet.text || '',
        timestamp: tweet.created_at ? new Date(tweet.created_at).getTime() : Date.now(),
        metadata: { metrics: tweet.public_metrics },
      };

      this.state.itemsIngested++;
      this.state.lastPollAt = Date.now();
      this.handlers.forEach(h => h(post));
      this.eventHandlers.forEach(h =>
        h({ type: 'post', connector: 'x', payload: post, timestamp: Date.now() })
      );
    }
  }

  private startSyntheticStream(): void {
    const syntheticXPosts = [
      'Breaking: Massive disruption detected across major nodes. Public consensus is rapidly dividing. #Emergency',
      'The new policy rollout is triggering heavy pushback in regional communities. Watch the bridge channels.',
      'Data indicates coordinated amplification patterns emerging around the new regulatory framework. #AIGov',
      'Community sentiment shifted to 78% fear within 15 minutes of the announcement. Check the risk score!',
      'Rumor spreading regarding network outage. Multiple accounts cross-verifying without primary evidence.',
    ];

    let counter = 0;
    this.syntheticInterval = setInterval(() => {
      const text = syntheticXPosts[counter % syntheticXPosts.length];
      const id = `x-stream-${Date.now()}-${counter}`;
      counter++;

      const post: LivePost = {
        id,
        platform: 'x',
        authorId: `usr_x_${(counter % 20) + 1}`,
        authorName: `@intel_desk_${(counter % 10) + 1}`,
        content: text,
        timestamp: Date.now(),
      };

      this.state.itemsIngested++;
      this.state.lastPollAt = Date.now();
      this.handlers.forEach(h => h(post));
      this.eventHandlers.forEach(h =>
        h({ type: 'post', connector: 'x', payload: post, timestamp: Date.now() })
      );
    }, 1800);
  }
}
