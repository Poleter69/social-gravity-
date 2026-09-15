/**
 * Social Gravity V2 - Reddit Discussion Thread Ingestion Parser
 *
 * Ingests Reddit comment trees, threads, and submissions.
 * Reconstructs directed conversation graphs between comment authors:
 *   Parent Comment Author <──(reply)── Child Comment Author
 *
 * Emits canonical interactions and weighted directed edges.
 */

import { Anonymizer } from '../anonymization/anonymizer';
import { CanonicalGraph, CanonicalInteraction, ValidationReport } from '../schemas';
import { CanonicalGraphBuilder } from '../transformers/canonicalGraphBuilder';
import { EdgeWeightEngine, REDDIT_WEIGHTING_PROFILE } from '../transformers/edgeWeightEngine';
import { DatasetValidator } from '../validators/datasetValidator';

export interface RedditComment {
  id: string;
  author: string;
  parentId?: string; // ID of post or parent comment
  parentAuthor?: string;
  body?: string;
  createdUtc: number; // Unix timestamp seconds
  score?: number;
}

export interface RedditThreadInput {
  threadId: string;
  subreddit: string;
  title?: string;
  comments: RedditComment[];
}

export class RedditParser {
  /**
   * Parses Reddit thread data into a CanonicalGraph.
   */
  public static parseThread(
    input: RedditThreadInput,
    anonymizer?: Anonymizer
  ): { graph: CanonicalGraph; validationReport: ValidationReport } {
    const anon = anonymizer || new Anonymizer({ prefix: 'red_', labelPrefix: 'Redditor_' });
    const validator = new DatasetValidator();
    const weightEngine = new EdgeWeightEngine(REDDIT_WEIGHTING_PROFILE);

    const builder = new CanonicalGraphBuilder({
      id: `reddit_${input.subreddit}_${input.threadId}`,
      sourceDataset: `REDDIT_R_${input.subreddit.toUpperCase()}`,
      detectCommunitiesIfMissing: true,
      metadata: {
        subreddit: input.subreddit,
        threadId: input.threadId,
        title: input.title,
      },
    });

    const commentMap = new Map<string, RedditComment>();
    for (const c of input.comments) {
      commentMap.set(c.id, c);
    }

    // Dyadic interaction aggregation
    const dyadInteractions = new Map<string, CanonicalInteraction[]>();

    for (let rowIdx = 0; rowIdx < input.comments.length; rowIdx++) {
      const comment = input.comments[rowIdx];
      if (!comment.author || comment.author === '[deleted]' || comment.author === '[removed]') {
        continue;
      }

      let parentAuthor = comment.parentAuthor;
      if (!parentAuthor && comment.parentId) {
        const parentComment = commentMap.get(comment.parentId);
        if (parentComment && parentComment.author) {
          parentAuthor = parentComment.author;
        }
      }

      if (!parentAuthor || parentAuthor === '[deleted]' || parentAuthor === '[removed]') {
        continue;
      }

      // Validate interaction
      const ts = comment.createdUtc * 1000;
      const isValid = validator.validateInteraction(
        rowIdx + 1,
        {
          source: comment.author,
          target: parentAuthor,
          timestamp: ts,
          type: 'reply',
          weight: 0.6,
        },
        JSON.stringify(comment)
      );

      if (isValid) {
        const authorAnon = anon.anonymize(comment.author).canonicalId;
        const parentAnon = anon.anonymize(parentAuthor).canonicalId;

        const interaction: CanonicalInteraction = {
          id: `int_${comment.id}`,
          source: authorAnon,
          target: parentAnon,
          timestamp: ts,
          type: 'reply',
          weight: weightEngine.getInteractionWeight('reply'),
          metadata: { commentId: comment.id, score: comment.score },
        };

        const dyadKey = `${authorAnon}->${parentAnon}`;
        let list = dyadInteractions.get(dyadKey);
        if (!list) {
          list = [];
          dyadInteractions.set(dyadKey, list);
        }
        list.push(interaction);
      }
    }

    // Add unique nodes to builder
    const involvedUsers = new Set<string>();
    for (const [dyadKey] of dyadInteractions.entries()) {
      const [u, v] = dyadKey.split('->');
      involvedUsers.add(u);
      involvedUsers.add(v);
    }

    for (const u of involvedUsers) {
      builder.addNode({
        id: u,
        label: anon.getLabel(u),
        originalId: anon.deAnonymize(u),
        communityId: input.subreddit,
        communities: [input.subreddit],
        features: { platform: 'reddit', subreddit: input.subreddit },
        degree: 0,
        inDegree: 0,
        outDegree: 0,
        influence: 0.5,
        isBridge: false,
        createdTimestamp: Date.now(),
      });
    }

    // Add aggregated edges
    for (const [dyadKey, interactions] of dyadInteractions.entries()) {
      const [u, v] = dyadKey.split('->');
      const aggregatedWeight = weightEngine.aggregateWeight(interactions);
      const timestamps = interactions.map(i => i.timestamp);

      builder.addEdge({
        id: dyadKey,
        source: u,
        target: v,
        weight: aggregatedWeight,
        relationshipType: 'reply',
        firstInteraction: Math.min(...timestamps),
        lastInteraction: Math.max(...timestamps),
        interactionCount: interactions.length,
        directed: true,
      });
    }

    const graph = builder.build();
    const validationReport = validator.buildReport(`Reddit_${input.subreddit}`);

    return { graph, validationReport };
  }
}
