/**
 * Social Gravity V2 - Resilient Reddit & Pushshift API Client
 *
 * Implements resilient HTTP ingestion with:
 * - Configurable endpoints (Pushshift API, Reddit JSON, custom mocks)
 * - Automatic pagination loops
 * - Rate limiting (configurable inter-request delay)
 * - Exponential backoff with jitter on network/rate errors
 * - Mock fetch injection for 100% offline unit testing
 */

import { RawRedditComment, RawRedditSubmission } from '../parsers/redditTypes';

export interface RedditClientConfig {
  pushshiftBaseUrl?: string;
  redditBaseUrl?: string;
  rateLimitDelayMs?: number;
  maxRetries?: number;
  timeoutMs?: number;
  userAgent?: string;
  customFetch?: (url: string, init?: any) => Promise<{ ok: boolean; status: number; json: () => Promise<any>; text?: () => Promise<string> }>;
}

export interface PushshiftQuery {
  subreddit?: string;
  q?: string;
  after?: number; // Unix timestamp seconds
  before?: number; // Unix timestamp seconds
  size?: number; // per-request page size (max 100 on Pushshift)
  sort?: 'asc' | 'desc';
  sort_type?: 'created_utc' | 'score' | 'num_comments';
  limit?: number; // Total requested across all pages
  author?: string;
}

export class RedditClient {
  private pushshiftBaseUrl: string;
  private redditBaseUrl: string;
  private rateLimitDelayMs: number;
  private maxRetries: number;
  private timeoutMs: number;
  private userAgent: string;
  private fetchFn: (url: string, init?: any) => Promise<any>;
  private lastRequestTime: number = 0;

  constructor(config: RedditClientConfig = {}) {
    this.pushshiftBaseUrl = (config.pushshiftBaseUrl || 'https://api.pushshift.io/reddit').replace(/\/$/, '');
    this.redditBaseUrl = (config.redditBaseUrl || 'https://www.reddit.com').replace(/\/$/, '');
    this.rateLimitDelayMs = config.rateLimitDelayMs ?? 300;
    this.maxRetries = config.maxRetries ?? 3;
    this.timeoutMs = config.timeoutMs ?? 10000;
    this.userAgent = config.userAgent || 'SocialGravity:v2.0 (Computational Social Science Simulator)';
    this.fetchFn = config.customFetch || ((url, init) => fetch(url, init));
  }

  /**
   * Rate-limited HTTP request with exponential backoff and jitter.
   */
  private async requestJson<T>(url: string): Promise<T> {
    let attempt = 0;
    let delay = 500;

    while (attempt <= this.maxRetries) {
      // Enforce inter-request rate limit delay
      const now = Date.now();
      const elapsed = now - this.lastRequestTime;
      if (elapsed < this.rateLimitDelayMs) {
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelayMs - elapsed));
      }
      this.lastRequestTime = Date.now();

      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), this.timeoutMs) : null;

        const response = await this.fetchFn(url, {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'application/json',
          },
          signal: controller?.signal,
        });

        if (timer) clearTimeout(timer);

        if (response.ok) {
          return await response.json();
        }

        // Retry on 429 (Too Many Requests) or 5xx Server Errors
        if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
          attempt++;
          if (attempt > this.maxRetries) {
            throw new Error(`HTTP ${response.status} from ${url} after ${this.maxRetries} retries`);
          }
          const jitter = Math.random() * 200;
          await new Promise(resolve => setTimeout(resolve, delay + jitter));
          delay *= 2;
          continue;
        }

        throw new Error(`HTTP Error ${response.status}: Failed to fetch from ${url}`);
      } catch (err: any) {
        attempt++;
        if (attempt > this.maxRetries) {
          throw err;
        }
        const jitter = Math.random() * 200;
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
        delay *= 2;
      }
    }

    throw new Error(`Exhausted retries for ${url}`);
  }

  /**
   * Fetches Reddit submissions with automated pagination loop.
   */
  public async fetchSubmissions(query: PushshiftQuery): Promise<RawRedditSubmission[]> {
    const totalLimit = query.limit || 100;
    const pageSize = Math.min(100, query.size || 100);
    const results: RawRedditSubmission[] = [];

    let currentBefore = query.before;
    let hasMore = true;

    while (results.length < totalLimit && hasMore) {
      const needed = totalLimit - results.length;
      const size = Math.min(pageSize, needed);

      const params = new URLSearchParams();
      if (query.subreddit) params.set('subreddit', query.subreddit);
      if (query.q) params.set('q', query.q);
      if (query.after) params.set('after', String(query.after));
      if (currentBefore) params.set('before', String(currentBefore));
      if (query.author) params.set('author', query.author);
      params.set('size', String(size));
      params.set('sort', query.sort || 'desc');
      params.set('sort_type', query.sort_type || 'created_utc');

      const url = `${this.pushshiftBaseUrl}/submission/search/?${params.toString()}`;
      const payload: any = await this.requestJson(url);

      const items: RawRedditSubmission[] = payload?.data || [];
      if (items.length === 0) {
        hasMore = false;
        break;
      }

      results.push(...items);

      // Advance pagination cursor backwards in time
      const oldest = items[items.length - 1];
      if (oldest && oldest.created_utc) {
        if (currentBefore === oldest.created_utc) {
          // Prevent infinite loop on identical timestamps
          currentBefore = oldest.created_utc - 1;
        } else {
          currentBefore = oldest.created_utc;
        }
      } else {
        hasMore = false;
      }

      if (items.length < size) {
        hasMore = false;
      }
    }

    return results.slice(0, totalLimit);
  }

  /**
   * Fetches Reddit comments with automated pagination loop.
   */
  public async fetchComments(query: PushshiftQuery): Promise<RawRedditComment[]> {
    const totalLimit = query.limit || 200;
    const pageSize = Math.min(100, query.size || 100);
    const results: RawRedditComment[] = [];

    let currentBefore = query.before;
    let hasMore = true;

    while (results.length < totalLimit && hasMore) {
      const needed = totalLimit - results.length;
      const size = Math.min(pageSize, needed);

      const params = new URLSearchParams();
      if (query.subreddit) params.set('subreddit', query.subreddit);
      if (query.q) params.set('q', query.q);
      if (query.after) params.set('after', String(query.after));
      if (currentBefore) params.set('before', String(currentBefore));
      if (query.author) params.set('author', query.author);
      params.set('size', String(size));
      params.set('sort', query.sort || 'desc');
      params.set('sort_type', query.sort_type || 'created_utc');

      const url = `${this.pushshiftBaseUrl}/comment/search/?${params.toString()}`;
      const payload: any = await this.requestJson(url);

      const items: RawRedditComment[] = payload?.data || [];
      if (items.length === 0) {
        hasMore = false;
        break;
      }

      results.push(...items);

      const oldest = items[items.length - 1];
      if (oldest && oldest.created_utc) {
        if (currentBefore === oldest.created_utc) {
          currentBefore = oldest.created_utc - 1;
        } else {
          currentBefore = oldest.created_utc;
        }
      } else {
        hasMore = false;
      }

      if (items.length < size) {
        hasMore = false;
      }
    }

    return results.slice(0, totalLimit);
  }

  /**
   * Fetches an entire discussion tree for a specific submission from Reddit JSON API.
   * Format: https://www.reddit.com/r/{subreddit}/comments/{threadId}.json
   */
  public async fetchThreadTree(
    submissionId: string,
    subreddit?: string
  ): Promise<{ submission: RawRedditSubmission; comments: RawRedditComment[] }> {
    const cleanId = submissionId.replace(/^t3_/, '');
    const subPart = subreddit ? `r/${subreddit}/` : '';
    const url = `${this.redditBaseUrl}/${subPart}comments/${cleanId}.json`;

    const payload: any = await this.requestJson(url);

    if (!Array.isArray(payload) || payload.length === 0) {
      throw new Error(`Invalid Reddit thread payload format for thread ${cleanId}`);
    }

    // First element in array is submission listing
    const rawSub = payload[0]?.data?.children?.[0]?.data;
    if (!rawSub) {
      throw new Error(`Submission metadata missing in thread response ${cleanId}`);
    }

    const submission: RawRedditSubmission = {
      id: rawSub.id,
      name: rawSub.name || `t3_${rawSub.id}`,
      author: rawSub.author || '[deleted]',
      title: rawSub.title || '',
      selftext: rawSub.selftext || '',
      subreddit: rawSub.subreddit || subreddit || 'reddit',
      score: rawSub.score || 0,
      num_comments: rawSub.num_comments || 0,
      created_utc: rawSub.created_utc || Math.floor(Date.now() / 1000),
      url: rawSub.url,
      upvote_ratio: rawSub.upvote_ratio,
    };

    // Second element is comment tree listing
    const comments: RawRedditComment[] = [];

    const walkChildren = (children: any[]) => {
      if (!Array.isArray(children)) return;
      for (const item of children) {
        if (item?.kind === 't1' && item?.data) {
          const d = item.data;
          comments.push({
            id: d.id,
            name: d.name || `t1_${d.id}`,
            author: d.author || '[deleted]',
            body: d.body || '',
            parent_id: d.parent_id,
            link_id: d.link_id,
            subreddit: d.subreddit || submission.subreddit,
            score: d.score || 0,
            created_utc: d.created_utc || submission.created_utc,
            controversiality: d.controversiality || 0,
            distinguished: d.distinguished,
            edited: d.edited,
          });

          // Recursively extract nested replies
          if (d.replies?.data?.children) {
            walkChildren(d.replies.data.children);
          }
        }
      }
    };

    if (payload[1]?.data?.children) {
      walkChildren(payload[1].data.children);
    }

    return { submission, comments };
  }
}
