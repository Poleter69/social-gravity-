/**
 * Social Gravity - Meta Instagram Authorized Streaming Connector
 * Milestone M19: Authorized Meta Graph API for Business/Creator accounts comments
 */

import { LivePost, ConnectorConfig, ConnectorState, LiveConnector, LiveEventHandler } from './types';
import { DedupStore } from './dedup';

export class InstagramConnector implements LiveConnector {
  public readonly id = 'instagram';
  public readonly platform = 'instagram' as const;
  private state: ConnectorState;
  private dedup: DedupStore;
  private config: Required<Pick<ConnectorConfig, 'pollIntervalMs' | 'maxItemsPerPoll' | 'dedupWindowMs' | 'offline'>> & Partial<ConnectorConfig>;
  private handlers: Array<(post: LivePost) => void> = [];
  private eventHandlers: LiveEventHandler[] = [];
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private syntheticInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private igMediaIds: string[] = [],
    config?: Partial<ConnectorConfig>
  ) {
    this.config = {
      pollIntervalMs: config?.pollIntervalMs ?? 30_000,
      maxItemsPerPoll: config?.maxItemsPerPoll ?? 50,
      dedupWindowMs: config?.dedupWindowMs ?? 180_000,
      offline: config?.offline ?? false,
      accessToken: config?.accessToken,
    };
    this.dedup = new DedupStore(this.config.dedupWindowMs);
    this.state = {
      id: 'instagram',
      platform: 'instagram',
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
      h({ type: 'status_change', connector: 'instagram', payload: this.state, timestamp: Date.now() })
    );
  }

  public async connect(): Promise<void> {
    if (this.state.status === 'live') return;

    this.updateStatus('connecting');

    if (!this.config.offline && this.config.accessToken && this.igMediaIds.length > 0) {
      try {
        await this.pollMetaApi();
        this.pollTimer = setInterval(() => this.pollMetaApi(), this.config.pollIntervalMs);
        this.updateStatus('live', { lastPollAt: Date.now() });
      } catch (err: any) {
        this.updateStatus('error', { errorMessage: err?.message || 'Meta API error' });
      }
    } else {
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

  private async pollMetaApi(): Promise<void> {
    for (const mediaId of this.igMediaIds) {
      const url = `https://graph.facebook.com/v19.0/${mediaId}/comments?access_token=${this.config.accessToken}&fields=id,text,timestamp,username,like_count`;
      const res = await fetch(url);
      if (!res.ok) continue;

      const json = await res.json();
      const items = (json.data || []) as any[];

      for (const item of items) {
        const id = `ig-${item.id}`;
        if (this.dedup.has(id)) continue;
        this.dedup.add(id);

        const post: LivePost = {
          id,
          platform: 'instagram',
          authorId: item.username || 'creator_audience',
          authorName: `@${item.username || 'user'}`,
          content: item.text || '',
          timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now(),
          metadata: { mediaId, likeCount: item.like_count },
        };

        this.state.itemsIngested++;
        this.state.lastPollAt = Date.now();
        this.handlers.forEach(h => h(post));
        this.eventHandlers.forEach(h =>
          h({ type: 'post', connector: 'instagram', payload: post, timestamp: Date.now() })
        );
      }
    }
  }

  private startSyntheticStream(): void {
    const igComments = [
      'Seen this visual circulating in 4 different stories today already.',
      'Check the comments on the official announcement before jumping to conclusions.',
      'This infographic is completely misrepresenting the risk score.',
      'Everyone is reposting this without verifying the source link.',
      'The virality on this reel is insane—over 50k shares in an hour.',
    ];

    let counter = 0;
    this.syntheticInterval = setInterval(() => {
      const text = igComments[counter % igComments.length];
      const id = `ig-stream-${Date.now()}-${counter}`;
      counter++;

      const post: LivePost = {
        id,
        platform: 'instagram',
        authorId: `ig_user_${(counter % 30) + 1}`,
        authorName: `@creator_${counter % 12}`,
        content: text,
        timestamp: Date.now(),
      };

      this.state.itemsIngested++;
      this.state.lastPollAt = Date.now();
      this.handlers.forEach(h => h(post));
      this.eventHandlers.forEach(h =>
        h({ type: 'post', connector: 'instagram', payload: post, timestamp: Date.now() })
      );
    }, 2800);
  }
}
