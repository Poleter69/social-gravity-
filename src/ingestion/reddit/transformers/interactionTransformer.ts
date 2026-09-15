/**
 * Social Gravity V2 - Reddit Canonical Interaction Transformer
 *
 * Converts Reddit submissions, comments, replies, and mentions into
 * universal CanonicalInteractions ready for simulation and graph construction.
 * Ensures strict deterministic pseudonymization and asymptotic weight scaling.
 */

import { CanonicalInteraction } from '../../schemas';
import { RedditAnonymizer } from '../anonymization/redditAnonymizer';
import {
  ParsedRedditComment,
  ReconstructedThread,
} from '../parsers/redditTypes';

export interface InteractionTransformOptions {
  includeMentions?: boolean;
  includeSelfReplies?: boolean;
  minScoreThreshold?: number;
  anonymizer?: RedditAnonymizer;
}

export class InteractionTransformer {
  private anonymizer: RedditAnonymizer;
  private includeMentions: boolean;
  private includeSelfReplies: boolean;
  private minScoreThreshold: number;

  constructor(options: InteractionTransformOptions = {}) {
    this.anonymizer = options.anonymizer || new RedditAnonymizer();
    this.includeMentions = options.includeMentions ?? true;
    this.includeSelfReplies = options.includeSelfReplies ?? false;
    this.minScoreThreshold = options.minScoreThreshold ?? -100;
  }

  /**
   * Computes a normalized interaction weight based on Reddit-specific features.
   * Weight range: [0.1, 1.0]
   */
  public computeReplyWeight(comment: ParsedRedditComment, depth: number = 1): number {
    let weight = 0.5;

    // Upvotes increase trust/signal strength asymptotically
    if (comment.score > 0) {
      weight += Math.min(0.3, Math.log10(comment.score + 1) * 0.1);
    } else if (comment.score < 0) {
      weight -= Math.min(0.25, Math.abs(comment.score) * 0.05);
    }

    // Controversiality indicates polarized disagreement (moderates weight)
    if (comment.controversiality > 0) {
      weight *= 0.85;
    }

    // Deep conversational exchanges reflect strong interpersonal engagement
    if (depth > 2) {
      weight += Math.min(0.2, (depth - 1) * 0.05);
    }

    return Math.max(0.05, Math.min(1.0, Number(weight.toFixed(4))));
  }

  /**
   * Transforms a single reconstructed thread into canonical interactions.
   */
  public transformThread(thread: ReconstructedThread): CanonicalInteraction[] {
    const interactions: CanonicalInteraction[] = [];
    const submission = thread.submission;
    const authorAnon = this.anonymizer.anonymize(submission.author).canonicalId;

    // 0. Submission author mentions
    if (this.includeMentions && submission.mentions && submission.mentions.length > 0 && submission.author && !this.anonymizer.isSpecialUser(submission.author)) {
      for (const mentionedUser of submission.mentions) {
        if (this.anonymizer.isSpecialUser(mentionedUser)) continue;
        const mentionedAnon = this.anonymizer.anonymize(mentionedUser).canonicalId;
        if (authorAnon !== mentionedAnon) {
          interactions.push({
            id: `int_mention_${submission.id}_${mentionedAnon}`,
            source: authorAnon,
            target: mentionedAnon,
            timestamp: submission.timestampMs,
            type: 'mention',
            weight: 0.5,
            metadata: {
              subreddit: submission.subreddit,
              threadId: submission.id,
            },
          });
        }
      }
    }

    // Process comments
    for (const comment of thread.allComments.values()) {
      if (comment.score < this.minScoreThreshold) continue;
      if (!comment.author || this.anonymizer.isSpecialUser(comment.author)) continue;

      const commenterAnon = this.anonymizer.anonymize(comment.author).canonicalId;

      // 1. Reply to Submission Author (Top-Level)
      if (comment.parentType === 'submission' || comment.parentId === submission.id) {
        if (submission.author && !this.anonymizer.isSpecialUser(submission.author)) {
          if (this.includeSelfReplies || commenterAnon !== authorAnon) {
            interactions.push({
              id: `int_reply_${comment.id}`,
              source: commenterAnon,
              target: authorAnon,
              timestamp: comment.timestampMs,
              type: 'reply',
              weight: this.computeReplyWeight(comment, 1),
              metadata: {
                subreddit: comment.subreddit,
                threadId: submission.id,
                commentId: comment.id,
                score: comment.score,
                depth: 1,
              },
            });
          }
        }
      } else {
        // 2. Reply to Parent Comment Author
        const parentComment = thread.allComments.get(comment.parentId);
        if (parentComment && parentComment.author && !this.anonymizer.isSpecialUser(parentComment.author)) {
          const parentAnon = this.anonymizer.anonymize(parentComment.author).canonicalId;
          if (this.includeSelfReplies || commenterAnon !== parentAnon) {
            interactions.push({
              id: `int_reply_${comment.id}`,
              source: commenterAnon,
              target: parentAnon,
              timestamp: comment.timestampMs,
              type: 'reply',
              weight: this.computeReplyWeight(comment, 2),
              metadata: {
                subreddit: comment.subreddit,
                threadId: submission.id,
                commentId: comment.id,
                parentCommentId: parentComment.id,
                score: comment.score,
              },
            });
          }
        }
      }

      // 3. User Mentions
      if (this.includeMentions && comment.mentions.length > 0) {
        for (const mentionedUser of comment.mentions) {
          if (this.anonymizer.isSpecialUser(mentionedUser)) continue;
          const mentionedAnon = this.anonymizer.anonymize(mentionedUser).canonicalId;
          if (commenterAnon !== mentionedAnon) {
            interactions.push({
              id: `int_mention_${comment.id}_${mentionedAnon}`,
              source: commenterAnon,
              target: mentionedAnon,
              timestamp: comment.timestampMs,
              type: 'mention',
              weight: 0.45,
              metadata: {
                subreddit: comment.subreddit,
                threadId: submission.id,
                commentId: comment.id,
              },
            });
          }
        }
      }
    }

    // Sort chronologically
    return interactions.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Transforms multiple threads in batch.
   */
  public transformThreads(threads: ReconstructedThread[]): CanonicalInteraction[] {
    const all: CanonicalInteraction[] = [];
    for (const t of threads) {
      all.push(...this.transformThread(t));
    }
    return all.sort((a, b) => a.timestamp - b.timestamp);
  }
}
