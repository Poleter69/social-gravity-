/**
 * Social Gravity V2 - Reddit Community & Network Graph Builder
 *
 * Constructs four first-class canonical graph topologies from Reddit data:
 * 1. Reply Graph: Direct conversational response edges (A -> B).
 * 2. Mention Graph: Directed user citation/callout edges (A -> B).
 * 3. Thread Participation Graph: Co-occurrence network of users in shared discussions (A <-> B).
 * 4. Subreddit Interaction Graph: Macro network connecting subreddits via shared participants.
 *
 * All emitted graphs are pure CanonicalGraphs directly convertible into
 * V2 DynamicGraph or V1 Society without downstream changes.
 */

import { CanonicalGraph, CanonicalInteraction } from '../../schemas';
import { CanonicalGraphBuilder } from '../../transformers/canonicalGraphBuilder';
import { EdgeWeightEngine, REDDIT_WEIGHTING_PROFILE } from '../../transformers/edgeWeightEngine';
import { DynamicGraph } from '../../../graph/engine/dynamicGraph';
import { Society } from '../../../society/types/society';
import { RedditAnonymizer } from '../anonymization/redditAnonymizer';
import { ReconstructedThread } from '../parsers/redditTypes';
import { InteractionTransformer } from './interactionTransformer';
import { RedditCommunityDetector } from '../analyzers/communityDetector';

export interface RedditGraphOptions {
  graphId?: string;
  sourceDataset?: string;
  anonymizer?: RedditAnonymizer;
  minInteractionsForEdge?: number;
  directed?: boolean;
}

export class RedditGraphBuilder {
  /**
   * 1. Reply Graph: Users connected through direct replies.
   */
  public static buildReplyGraph(
    threads: ReconstructedThread[],
    options: RedditGraphOptions = {}
  ): CanonicalGraph {
    const anon = options.anonymizer || new RedditAnonymizer();
    const transformer = new InteractionTransformer({ anonymizer: anon });
    const weightEngine = new EdgeWeightEngine(REDDIT_WEIGHTING_PROFILE);

    const subreddits = Array.from(new Set(threads.map(t => t.submission.subreddit)));
    const primarySubreddit = subreddits[0] || 'reddit';

    const builder = new CanonicalGraphBuilder({
      id: options.graphId || `reddit_reply_${primarySubreddit}_${Date.now()}`,
      sourceDataset: options.sourceDataset || `REDDIT_R_${primarySubreddit.toUpperCase()}`,
      detectCommunitiesIfMissing: true,
      metadata: {
        graphType: 'reply_graph',
        subreddits,
        threadCount: threads.length,
      },
    });

    const interactions = transformer.transformThreads(threads).filter(i => i.type === 'reply');

    // Group interactions by directed dyad: source -> target
    const dyadMap = new Map<string, CanonicalInteraction[]>();
    const nodeIds = new Set<string>();

    for (const inter of interactions) {
      const key = `${inter.source}->${inter.target}`;
      let list = dyadMap.get(key);
      if (!list) {
        list = [];
        dyadMap.set(key, list);
      }
      list.push(inter);
      nodeIds.add(inter.source);
      nodeIds.add(inter.target);
    }

    // Add nodes
    for (const u of nodeIds) {
      builder.addNode({
        id: u,
        label: anon.getLabel(u),
        originalId: anon.deAnonymize(u),
        communityId: primarySubreddit,
        communities: [primarySubreddit],
        features: { platform: 'reddit', primarySubreddit },
        degree: 0,
        inDegree: 0,
        outDegree: 0,
        influence: 0.5,
        isBridge: false,
        createdTimestamp: Date.now(),
      });
    }

    // Add aggregated weighted edges
    for (const [key, list] of dyadMap.entries()) {
      if (list.length < (options.minInteractionsForEdge || 1)) continue;
      const [source, target] = key.split('->');
      const timestamps = list.map(i => i.timestamp);
      const weight = weightEngine.aggregateWeight(list);

      builder.addEdge({
        id: `edge_${source}_${target}`,
        source,
        target,
        weight,
        relationshipType: 'reply',
        firstInteraction: Math.min(...timestamps),
        lastInteraction: Math.max(...timestamps),
        interactionCount: list.length,
        directed: options.directed ?? true,
      });
    }

    const graph = builder.build();
    // Run Reddit community detection
    RedditCommunityDetector.detect(graph);
    return graph;
  }

  /**
   * 2. Mention Graph: Users mentioning other users.
   */
  public static buildMentionGraph(
    threads: ReconstructedThread[],
    options: RedditGraphOptions = {}
  ): CanonicalGraph {
    const anon = options.anonymizer || new RedditAnonymizer();
    const transformer = new InteractionTransformer({ anonymizer: anon, includeMentions: true });
    const weightEngine = new EdgeWeightEngine(REDDIT_WEIGHTING_PROFILE);

    const subreddits = Array.from(new Set(threads.map(t => t.submission.subreddit)));
    const primarySubreddit = subreddits[0] || 'reddit';

    const builder = new CanonicalGraphBuilder({
      id: options.graphId || `reddit_mention_${primarySubreddit}_${Date.now()}`,
      sourceDataset: options.sourceDataset || `REDDIT_MENTION_${primarySubreddit.toUpperCase()}`,
      detectCommunitiesIfMissing: true,
      metadata: {
        graphType: 'mention_graph',
        subreddits,
        threadCount: threads.length,
      },
    });

    const interactions = transformer.transformThreads(threads).filter(i => i.type === 'mention');

    const dyadMap = new Map<string, CanonicalInteraction[]>();
    const nodeIds = new Set<string>();

    for (const inter of interactions) {
      const key = `${inter.source}->${inter.target}`;
      let list = dyadMap.get(key);
      if (!list) {
        list = [];
        dyadMap.set(key, list);
      }
      list.push(inter);
      nodeIds.add(inter.source);
      nodeIds.add(inter.target);
    }

    for (const u of nodeIds) {
      builder.addNode({
        id: u,
        label: anon.getLabel(u),
        originalId: anon.deAnonymize(u),
        communityId: primarySubreddit,
        communities: [primarySubreddit],
        features: { platform: 'reddit', primarySubreddit },
        degree: 0,
        inDegree: 0,
        outDegree: 0,
        influence: 0.5,
        isBridge: false,
        createdTimestamp: Date.now(),
      });
    }

    for (const [key, list] of dyadMap.entries()) {
      const [source, target] = key.split('->');
      const timestamps = list.map(i => i.timestamp);
      const weight = weightEngine.aggregateWeight(list);

      builder.addEdge({
        id: `mention_${source}_${target}`,
        source,
        target,
        weight,
        relationshipType: 'mention',
        firstInteraction: Math.min(...timestamps),
        lastInteraction: Math.max(...timestamps),
        interactionCount: list.length,
        directed: true,
      });
    }

    const graph = builder.build();
    RedditCommunityDetector.detect(graph);
    return graph;
  }

  /**
   * 3. Thread Participation Graph: Users participating in the same discussions.
   */
  public static buildParticipationGraph(
    threads: ReconstructedThread[],
    options: RedditGraphOptions = {}
  ): CanonicalGraph {
    const anon = options.anonymizer || new RedditAnonymizer();
    const subreddits = Array.from(new Set(threads.map(t => t.submission.subreddit)));
    const primarySubreddit = subreddits[0] || 'reddit';

    const builder = new CanonicalGraphBuilder({
      id: options.graphId || `reddit_participation_${primarySubreddit}_${Date.now()}`,
      sourceDataset: options.sourceDataset || `REDDIT_PARTICIPATION_${primarySubreddit.toUpperCase()}`,
      detectCommunitiesIfMissing: true,
      metadata: {
        graphType: 'participation_graph',
        subreddits,
        threadCount: threads.length,
      },
    });

    const userThreads = new Map<string, Set<string>>();
    const allUsers = new Set<string>();

    for (const thread of threads) {
      const threadId = thread.submission.id;
      const participants = new Set<string>();

      if (thread.submission.author && !anon.isSpecialUser(thread.submission.author)) {
        participants.add(anon.anonymize(thread.submission.author).canonicalId);
      }

      for (const comment of thread.allComments.values()) {
        if (comment.author && !anon.isSpecialUser(comment.author)) {
          participants.add(anon.anonymize(comment.author).canonicalId);
        }
      }

      for (const u of participants) {
        allUsers.add(u);
        let set = userThreads.get(u);
        if (!set) {
          set = new Set();
          userThreads.set(u, set);
        }
        set.add(threadId);
      }
    }

    // Add nodes
    for (const u of allUsers) {
      builder.addNode({
        id: u,
        label: anon.getLabel(u),
        originalId: anon.deAnonymize(u),
        communityId: primarySubreddit,
        communities: [primarySubreddit],
        features: { platform: 'reddit', threadCount: userThreads.get(u)?.size || 0 },
        degree: 0,
        inDegree: 0,
        outDegree: 0,
        influence: 0.5,
        isBridge: false,
        createdTimestamp: Date.now(),
      });
    }

    // Pairwise co-participation edges
    const userList = Array.from(allUsers);
    for (let i = 0; i < userList.length; i++) {
      const u = userList[i];
      const uSet = userThreads.get(u)!;

      for (let j = i + 1; j < userList.length; j++) {
        const v = userList[j];
        const vSet = userThreads.get(v)!;

        // Count shared threads
        let sharedCount = 0;
        for (const tId of uSet) {
          if (vSet.has(tId)) sharedCount++;
        }

        if (sharedCount >= (options.minInteractionsForEdge || 1)) {
          // Weight scales asymptotically: 1 - e^(-0.5 * sharedCount)
          const weight = Number((1.0 - Math.exp(-0.4 * sharedCount)).toFixed(4));
          const [src, tgt] = u < v ? [u, v] : [v, u];

          builder.addEdge({
            id: `part_${src}_${tgt}`,
            source: src,
            target: tgt,
            weight,
            relationshipType: 'co_participation',
            firstInteraction: Date.now(),
            lastInteraction: Date.now(),
            interactionCount: sharedCount,
            directed: false,
          });
        }
      }
    }

    const graph = builder.build();
    RedditCommunityDetector.detect(graph);
    return graph;
  }

  /**
   * 4. Subreddit Interaction Graph: Communities connected through shared participants.
   */
  public static buildSubredditInteractionGraph(
    threads: ReconstructedThread[],
    options: RedditGraphOptions = {}
  ): CanonicalGraph {
    const anon = options.anonymizer || new RedditAnonymizer();

    const builder = new CanonicalGraphBuilder({
      id: options.graphId || `reddit_subreddit_macro_${Date.now()}`,
      sourceDataset: options.sourceDataset || 'REDDIT_SUBREDDIT_MACRO',
      detectCommunitiesIfMissing: true,
      metadata: {
        graphType: 'subreddit_interaction_graph',
        threadCount: threads.length,
      },
    });

    // Map: subreddit -> Set of user IDs
    const subredditUsers = new Map<string, Set<string>>();

    for (const thread of threads) {
      const sub = thread.submission.subreddit || 'general';
      let set = subredditUsers.get(sub);
      if (!set) {
        set = new Set();
        subredditUsers.set(sub, set);
      }

      if (thread.submission.author && !anon.isSpecialUser(thread.submission.author)) {
        set.add(anon.anonymize(thread.submission.author).canonicalId);
      }
      for (const comment of thread.allComments.values()) {
        if (comment.author && !anon.isSpecialUser(comment.author)) {
          set.add(anon.anonymize(comment.author).canonicalId);
        }
      }
    }

    // Add subreddit nodes
    for (const [sub, users] of subredditUsers.entries()) {
      builder.addNode({
        id: `sub_${sub}`,
        label: `r/${sub}`,
        originalId: sub,
        communityId: sub,
        communities: [sub],
        features: { platform: 'reddit', uniqueUsers: users.size },
        degree: 0,
        inDegree: 0,
        outDegree: 0,
        influence: Math.min(1.0, users.size / 100),
        isBridge: false,
        createdTimestamp: Date.now(),
      });
    }

    // Pairwise overlap between subreddits
    const subList = Array.from(subredditUsers.keys());
    for (let i = 0; i < subList.length; i++) {
      const subA = subList[i];
      const usersA = subredditUsers.get(subA)!;

      for (let j = i + 1; j < subList.length; j++) {
        const subB = subList[j];
        const usersB = subredditUsers.get(subB)!;

        // Shared users
        let shared = 0;
        for (const u of usersA) {
          if (usersB.has(u)) shared++;
        }

        if (shared > 0) {
          // Jaccard similarity: |A ∩ B| / |A ∪ B|
          const unionSize = usersA.size + usersB.size - shared;
          const jaccard = unionSize > 0 ? shared / unionSize : 0;
          const weight = Number(Math.max(0.1, jaccard).toFixed(4));

          builder.addEdge({
            id: `sub_link_${subA}_${subB}`,
            source: `sub_${subA}`,
            target: `sub_${subB}`,
            weight,
            relationshipType: 'shared_membership',
            firstInteraction: Date.now(),
            lastInteraction: Date.now(),
            interactionCount: shared,
            directed: false,
          });
        }
      }
    }

    const graph = builder.build();
    RedditCommunityDetector.detect(graph);
    return graph;
  }

  /**
   * Directly converts any CanonicalGraph into Social Gravity V2 DynamicGraph.
   */
  public static toDynamicGraph(graph: CanonicalGraph): DynamicGraph {
    return CanonicalGraphBuilder.toDynamicGraph(graph);
  }

  /**
   * Directly converts any CanonicalGraph into Social Gravity V1 Society.
   */
  public static toSociety(graph: CanonicalGraph): Society {
    return CanonicalGraphBuilder.toSociety(graph);
  }
}
