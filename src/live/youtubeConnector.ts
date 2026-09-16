/**
 * Social Gravity - YouTube Comments Real-Time Streaming Connector
 * Milestone M19: Official YouTube Data API v3 commentThreads with offline synthetic stream
 */

import { LivePost, ConnectorConfig, ConnectorState, LiveConnector, LiveEventHandler } from './types';
import { DedupStore } from './dedup';

export class YouTubeConnector implements LiveConnector {
  public readonly id = 'youtube';
  public readonly platform = 'youtube' as const;
  private state: ConnectorState;
  private dedup: DedupStore;
  private config: Required<Pick<ConnectorConfig, 'pollIntervalMs' | 'maxItemsPerPoll' | 'dedupWindowMs' | 'offline'>> & Partial<ConnectorConfig>;
  private handlers: Array<(post: LivePost) => void> = [];
  private eventHandlers: LiveEventHandler[] = [];
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private syntheticInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private videoIds: string[] = [],
    config?: Partial<ConnectorConfig>
  ) {
    this.config = {
      pollIntervalMs: config?.pollIntervalMs ?? 30_000,
      maxItemsPerPoll: config?.maxItemsPerPoll ?? 50,
      dedupWindowMs: config?.dedupWindowMs ?? 180_000,
      offline: config?.offline ?? false,
      apiKey: config?.apiKey,
    };
    this.dedup = new DedupStore(this.config.dedupWindowMs);
    this.state = {
      id: 'youtube',
      platform: 'youtube',
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
      h({ type: 'status_change', connector: 'youtube', payload: this.state, timestamp: Date.now() })
    );
  }

  public async connect(): Promise<void> {
    if (this.state.status === 'live') return;

    this.updateStatus('connecting');

    if (!this.config.offline && this.config.apiKey && this.videoIds.length > 0) {
      try {
        await this.pollYouTubeApi();
        this.pollTimer = setInterval(() => this.pollYouTubeApi(), this.config.pollIntervalMs);
        this.updateStatus('live', { lastPollAt: Date.now() });
      } catch (err: any) {
        this.updateStatus('error', { errorMessage: err?.message || 'YouTube API error' });
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

  private async pollYouTubeApi(): Promise<void> {
    for (const videoId of this.videoIds) {
      const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=${this.config.maxItemsPerPoll}&key=${this.config.apiKey}`;
      const res = await fetch(url);
      if (!res.ok) continue;

      const json = await res.json();
      const items = (json.items || []) as any[];

      for (const item of items) {
        const snippet = item.snippet?.topLevelComment?.snippet;
        if (!snippet) continue;

        const id = `yt-${item.id}`;
        if (this.dedup.has(id)) continue;
        this.dedup.add(id);

        const post: LivePost = {
          id,
          platform: 'youtube',
          authorId: snippet.authorChannelId?.value || 'yt_channel',
          authorName: snippet.authorDisplayName || 'YouTube User',
          content: snippet.textOriginal || snippet.textDisplay || '',
          timestamp: snippet.publishedAt ? new Date(snippet.publishedAt).getTime() : Date.now(),
          metadata: { videoId, likeCount: snippet.likeCount },
        };

        this.state.itemsIngested++;
        this.state.lastPollAt = Date.now();
        this.handlers.forEach(h => h(post));
        this.eventHandlers.forEach(h =>
          h({ type: 'post', connector: 'youtube', payload: post, timestamp: Date.now() })
        );
      }
    }
  }

  private startSyntheticStream(): void {
    const ytComments = [
      'This explanation contradicts what was reported earlier in the press conference.',
      'Check the 3:45 timestamp—you can see the exact propagation path across nodes!',
      'People are confusing correlation with causation here. Look at the primary dataset.',
      'Is there any counter-narrative source that actually debunks this claim with evidence?',
      'The velocity of comments on this video doubled in the last 10 minutes.',
    ];

    let counter = 0;
    this.syntheticInterval = setInterval(() => {
      const text = ytComments[counter % ytComments.length];
      const id = `yt-stream-${Date.now()}-${counter}`;
      counter++;

      const post: LivePost = {
        id,
        platform: 'youtube',
        authorId: `yt_viewer_${(counter % 25) + 1}`,
        authorName: `Viewer_${counter % 15}`,
        content: text,
        timestamp: Date.now(),
      };

      this.state.itemsIngested++;
      this.state.lastPollAt = Date.now();
      this.handlers.forEach(h => h(post));
      this.eventHandlers.forEach(h =>
        h({ type: 'post', connector: 'youtube', payload: post, timestamp: Date.now() })
      );
    }, 2400);
  }
}
