/**
 * Social Gravity V2 - Reddit Dataset Collector
 *
 * Implements multi-strategy data harvesting:
 * - Subreddit collection (submissions + associated comments)
 * - Thread collection (full discussion trees)
 * - Time range collection (between timestamps)
 * - Incremental collection (resume from checkpoint)
 *
 * Saves raw, un-transformed JSON payloads to disk with checkpoint caching.
 */

import * as fs from 'fs';
import * as path from 'path';
import { RedditClient } from './redditClient';
import { RawRedditComment } from '../parsers/redditTypes';

export interface CollectorConfig {
  baseDir?: string;
  client?: RedditClient;
}

export interface CheckpointMetadata {
  subreddit: string;
  lastCreatedUtc: number;
  totalSubmissions: number;
  totalComments: number;
  lastUpdatedIso: string;
}

export interface CollectionResult {
  strategy: 'subreddit' | 'thread' | 'time_range' | 'incremental';
  target: string;
  submissionsCount: number;
  commentsCount: number;
  rawFilePath: string;
  durationMs: number;
  checkpoint?: CheckpointMetadata;
}

export class RedditDatasetCollector {
  private baseDir: string;
  private rawDir: string;
  private processedDir: string;
  private reportsDir: string;
  private cacheDir: string;
  private client: RedditClient;

  constructor(config: CollectorConfig = {}) {
    // Default to 'database/reddit' and ensure both 'database/reddit' and 'Databases/reddit' work
    const root = process.cwd();
    const defaultDir = fs.existsSync(path.join(root, 'Databases'))
      ? path.join(root, 'Databases', 'reddit')
      : path.join(root, 'database', 'reddit');

    this.baseDir = config.baseDir || process.env.REDDIT_DATA_DIR || defaultDir;
    this.rawDir = path.join(this.baseDir, 'raw');
    this.processedDir = path.join(this.baseDir, 'processed');
    this.reportsDir = path.join(this.baseDir, 'reports');
    this.cacheDir = path.join(this.baseDir, 'cache');
    this.client = config.client || new RedditClient();

    this.ensureDirectories();
  }

  /**
   * Initializes target storage directories.
   */
  public ensureDirectories(): void {
    for (const dir of [this.baseDir, this.rawDir, this.processedDir, this.reportsDir, this.cacheDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  public getRawDir(): string { return this.rawDir; }
  public getProcessedDir(): string { return this.processedDir; }
  public getReportsDir(): string { return this.reportsDir; }
  public getCacheDir(): string { return this.cacheDir; }

  /**
   * Reads the checkpoint metadata for a subreddit.
   */
  public getCheckpoint(subreddit: string): CheckpointMetadata | null {
    const checkpointFile = path.join(this.cacheDir, `checkpoint_${subreddit.toLowerCase()}.json`);
    if (!fs.existsSync(checkpointFile)) return null;
    try {
      return JSON.parse(fs.readFileSync(checkpointFile, 'utf8'));
    } catch {
      return null;
    }
  }

  /**
   * Updates checkpoint metadata for a subreddit.
   */
  public saveCheckpoint(meta: CheckpointMetadata): void {
    const checkpointFile = path.join(this.cacheDir, `checkpoint_${meta.subreddit.toLowerCase()}.json`);
    fs.writeFileSync(checkpointFile, JSON.stringify(meta, null, 2), 'utf8');
  }

  /**
   * 1. Subreddit Collection: Collects recent submissions and comments for a subreddit.
   */
  public async collectSubreddit(
    subreddit: string,
    options: { limit?: number; fetchCommentsForThreads?: boolean } = {}
  ): Promise<CollectionResult> {
    const startTime = Date.now();
    const limit = options.limit || 50;

    const submissions = await this.client.fetchSubmissions({
      subreddit,
      limit,
      sort: 'desc',
    });

    const allComments: RawRedditComment[] = [];

    // Optionally fetch full comments for each collected submission
    if (options.fetchCommentsForThreads) {
      for (const sub of submissions) {
        try {
          const tree = await this.client.fetchThreadTree(sub.id, subreddit);
          allComments.push(...tree.comments);
        } catch {
          // Fall back to Pushshift comment search for thread
          const comments = await this.client.fetchComments({
            subreddit,
            q: sub.id,
            limit: 100,
          });
          allComments.push(...comments);
        }
      }
    } else {
      // Fetch recent comments in the subreddit directly
      const comments = await this.client.fetchComments({
        subreddit,
        limit: limit * 2,
        sort: 'desc',
      });
      allComments.push(...comments);
    }

    const filename = `raw_${subreddit}_${Date.now()}.json`;
    const rawFilePath = path.join(this.rawDir, filename);

    const payload = {
      subreddit,
      collectedAt: new Date().toISOString(),
      submissions,
      comments: allComments,
    };

    fs.writeFileSync(rawFilePath, JSON.stringify(payload, null, 2), 'utf8');

    // Determine newest timestamp
    let newestUtc = 0;
    for (const s of submissions) {
      if (s.created_utc > newestUtc) newestUtc = s.created_utc;
    }

    const checkpoint: CheckpointMetadata = {
      subreddit,
      lastCreatedUtc: newestUtc || Math.floor(Date.now() / 1000),
      totalSubmissions: submissions.length,
      totalComments: allComments.length,
      lastUpdatedIso: new Date().toISOString(),
    };
    this.saveCheckpoint(checkpoint);

    return {
      strategy: 'subreddit',
      target: subreddit,
      submissionsCount: submissions.length,
      commentsCount: allComments.length,
      rawFilePath,
      durationMs: Date.now() - startTime,
      checkpoint,
    };
  }

  /**
   * 2. Thread Collection: Ingests an entire discussion tree for a submission.
   */
  public async collectThread(
    submissionId: string,
    subreddit?: string
  ): Promise<CollectionResult> {
    const startTime = Date.now();
    const cleanId = submissionId.replace(/^t3_/, '');

    const { submission, comments } = await this.client.fetchThreadTree(cleanId, subreddit);

    const subName = subreddit || submission.subreddit || 'thread';
    const filename = `raw_thread_${subName}_${cleanId}_${Date.now()}.json`;
    const rawFilePath = path.join(this.rawDir, filename);

    const payload = {
      subreddit: subName,
      threadId: cleanId,
      collectedAt: new Date().toISOString(),
      submissions: [submission],
      comments,
    };

    fs.writeFileSync(rawFilePath, JSON.stringify(payload, null, 2), 'utf8');

    return {
      strategy: 'thread',
      target: cleanId,
      submissionsCount: 1,
      commentsCount: comments.length,
      rawFilePath,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * 3. Time Range Collection: Ingests submissions and comments between two timestamps.
   */
  public async collectTimeRange(
    subreddit: string,
    afterUtc: number,
    beforeUtc: number,
    options: { limit?: number } = {}
  ): Promise<CollectionResult> {
    const startTime = Date.now();
    const limit = options.limit || 100;

    const submissions = await this.client.fetchSubmissions({
      subreddit,
      after: afterUtc,
      before: beforeUtc,
      limit,
    });

    const comments = await this.client.fetchComments({
      subreddit,
      after: afterUtc,
      before: beforeUtc,
      limit: limit * 2,
    });

    const filename = `raw_timerange_${subreddit}_${afterUtc}_${beforeUtc}.json`;
    const rawFilePath = path.join(this.rawDir, filename);

    const payload = {
      subreddit,
      timeWindow: { afterUtc, beforeUtc },
      collectedAt: new Date().toISOString(),
      submissions,
      comments,
    };

    fs.writeFileSync(rawFilePath, JSON.stringify(payload, null, 2), 'utf8');

    return {
      strategy: 'time_range',
      target: `${subreddit} [${afterUtc} -> ${beforeUtc}]`,
      submissionsCount: submissions.length,
      commentsCount: comments.length,
      rawFilePath,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * 4. Incremental Collection: Ingests only new items created since the last checkpoint.
   */
  public async collectIncremental(
    subreddit: string,
    options: { limit?: number } = {}
  ): Promise<CollectionResult> {
    const checkpoint = this.getCheckpoint(subreddit);
    const afterUtc = checkpoint ? checkpoint.lastCreatedUtc : Math.floor(Date.now() / 1000) - 86400 * 7; // default 7 days ago

    const startTime = Date.now();
    const limit = options.limit || 100;

    const submissions = await this.client.fetchSubmissions({
      subreddit,
      after: afterUtc,
      limit,
      sort: 'asc',
    });

    const comments = await this.client.fetchComments({
      subreddit,
      after: afterUtc,
      limit: limit * 2,
      sort: 'asc',
    });

    const filename = `raw_incremental_${subreddit}_${Date.now()}.json`;
    const rawFilePath = path.join(this.rawDir, filename);

    const payload = {
      subreddit,
      resumedFromUtc: afterUtc,
      collectedAt: new Date().toISOString(),
      submissions,
      comments,
    };

    fs.writeFileSync(rawFilePath, JSON.stringify(payload, null, 2), 'utf8');

    // Advance checkpoint
    let maxUtc = afterUtc;
    for (const s of submissions) {
      if (s.created_utc > maxUtc) maxUtc = s.created_utc;
    }
    for (const c of comments) {
      if (c.created_utc > maxUtc) maxUtc = c.created_utc;
    }

    const updatedCheckpoint: CheckpointMetadata = {
      subreddit,
      lastCreatedUtc: maxUtc,
      totalSubmissions: (checkpoint?.totalSubmissions || 0) + submissions.length,
      totalComments: (checkpoint?.totalComments || 0) + comments.length,
      lastUpdatedIso: new Date().toISOString(),
    };
    this.saveCheckpoint(updatedCheckpoint);

    return {
      strategy: 'incremental',
      target: subreddit,
      submissionsCount: submissions.length,
      commentsCount: comments.length,
      rawFilePath,
      durationMs: Date.now() - startTime,
      checkpoint: updatedCheckpoint,
    };
  }
}
