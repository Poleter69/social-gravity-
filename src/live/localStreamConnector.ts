import { LivePost, ConnectorConfig, ConnectorState, LiveEventHandler, LiveConnector } from './types';
import { DedupStore } from './dedup';

export class LocalStreamConnector implements LiveConnector {
  public readonly id = 'local';
  public readonly platform = 'local' as const;
  private state: ConnectorState;
  private dedup: DedupStore;
  private handlers: LiveEventHandler[] = [];
  private messageHandlers: Array<(post: LivePost) => void> = [];

  constructor(private config?: Partial<ConnectorConfig>) {
    this.dedup = new DedupStore(this.config?.dedupWindowMs ?? 3_600_000);
    this.state = { id: 'local', platform: 'local', status: 'idle', lastPollAt: null, itemsIngested: 0 };
  }

  on(handler: LiveEventHandler): void {
    this.handlers.push(handler);
  }

  onMessage(handler: (post: LivePost) => void): void {
    this.messageHandlers.push(handler);
  }

  private emit(type: 'post' | 'status_change' | 'error', payload: LivePost | ConnectorState | Error): void {
    this.handlers.forEach(h => h({ type, connector: 'local', payload, timestamp: Date.now() }));
    if (type === 'post') {
      this.messageHandlers.forEach(h => h(payload as LivePost));
    }
  }

  private updateStatus(status: ConnectorState['status'], extra?: Partial<ConnectorState>): void {
    this.state = { ...this.state, status, ...extra };
    this.emit('status_change', this.state);
  }

  connect(): void {
    this.updateStatus('live', { lastPollAt: Date.now() });
  }

  disconnect(): void {
    this.updateStatus('idle');
  }

  getStatus(): ConnectorState {
    return { ...this.state };
  }

  getState(): ConnectorState {
    return this.getStatus();
  }

  /**
   * Process posts from raw text (file or string) loaded by the analyst.
   * Accepts JSON array or JSON Lines format.
   */
  async loadText(text: string): Promise<{ accepted: number; rejected: number }> {
    this.updateStatus('connecting');
    try {
      let records: unknown[] = [];
      const trimmed = text.trim();
      if (trimmed.startsWith('[')) {
        records = JSON.parse(trimmed) as unknown[];
      } else {
        // Parse JSON Lines
        records = trimmed.split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => JSON.parse(line));
      }

      let accepted = 0;
      let rejected = 0;

      for (const r of records) {
        if (!r || typeof r !== 'object') {
          rejected++;
          continue;
        }
        const rec = r as Record<string, unknown>;
        const rawId = String(rec.id ?? rec.post_id ?? `item-${accepted}`);
        const id = `local-${rawId}`;
        if (this.dedup.has(id)) {
          rejected++;
          continue;
        }
        this.dedup.add(id);

        const post: LivePost = {
          id,
          platform: 'local',
          authorId: String(rec.authorId ?? rec.author ?? rec.user ?? 'local-analyst'),
          authorName: String(rec.authorName ?? rec.author ?? rec.user ?? 'local-analyst'),
          content: String(rec.content ?? rec.text ?? rec.body ?? rec.title ?? ''),
          timestamp: typeof rec.timestamp === 'number' ? rec.timestamp : Date.now(),
          metadata: rec.metadata as Record<string, unknown> | undefined,
        };
        this.emit('post', post);
        accepted++;
        this.state.itemsIngested++;
      }

      this.updateStatus('live', { lastPollAt: Date.now() });
      return { accepted, rejected };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.updateStatus('error', { errorMessage: msg });
      throw err;
    }
  }

  /**
   * Browser File object helper
   */
  async loadFile(file: File): Promise<{ accepted: number; rejected: number }> {
    const text = await file.text();
    return this.loadText(text);
  }
}
