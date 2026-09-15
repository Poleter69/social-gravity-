/**
 * Social Gravity V2 - Slack Workspace Organizational Graph Ingestion Parser
 *
 * Reconstructs organizational communication networks from Slack JSON exports:
 * - Threaded replies (parent_user_id)
 * - In-text @mentions (<@U12345>)
 * - Channel memberships & co-working clusters
 * - Emoji reactions
 */

import { Anonymizer } from '../anonymization/anonymizer';
import { CanonicalGraph, CanonicalInteraction, ValidationReport } from '../schemas';
import { CanonicalGraphBuilder } from '../transformers/canonicalGraphBuilder';
import { EdgeWeightEngine, SLACK_WEIGHTING_PROFILE } from '../transformers/edgeWeightEngine';
import { DatasetValidator } from '../validators/datasetValidator';

export interface SlackMessage {
  ts: string; // Slack epoch timestamp with decimal: "1512085950.000216"
  user: string; // User ID
  text: string;
  thread_ts?: string;
  parent_user_id?: string;
  reactions?: Array<{ name: string; users: string[]; count: number }>;
}

export interface SlackChannelInput {
  workspaceName: string;
  channelId: string;
  channelName: string;
  messages: SlackMessage[];
}

export class SlackParser {
  /**
   * Parses Slack channel or workspace export into a CanonicalGraph.
   */
  public static parseChannel(
    input: SlackChannelInput,
    anonymizer?: Anonymizer
  ): { graph: CanonicalGraph; validationReport: ValidationReport } {
    const anon = anonymizer || new Anonymizer({ prefix: 'slk_', labelPrefix: 'Colleague_' });
    const validator = new DatasetValidator();
    const weightEngine = new EdgeWeightEngine(SLACK_WEIGHTING_PROFILE);

    const builder = new CanonicalGraphBuilder({
      id: `slack_${input.channelId}`,
      sourceDataset: `SLACK_${input.workspaceName.toUpperCase()}_${input.channelName.toUpperCase()}`,
      detectCommunitiesIfMissing: true,
      metadata: {
        workspaceName: input.workspaceName,
        channelId: input.channelId,
        channelName: input.channelName,
      },
    });

    const dyadInteractions = new Map<string, CanonicalInteraction[]>();

    for (let rowIdx = 0; rowIdx < input.messages.length; rowIdx++) {
      const msg = input.messages[rowIdx];
      const author = msg.user;
      if (!author) continue;

      const epochMs = Math.floor(parseFloat(msg.ts) * 1000);

      // 1. Thread replies
      if (msg.parent_user_id && msg.parent_user_id !== author) {
        if (validator.validateInteraction(rowIdx + 1, { source: author, target: msg.parent_user_id, timestamp: epochMs, type: 'thread_reply' })) {
          this.recordInteraction(
            dyadInteractions,
            anon.anonymize(author).canonicalId,
            anon.anonymize(msg.parent_user_id).canonicalId,
            epochMs,
            'thread_reply',
            weightEngine.getInteractionWeight('thread_reply')
          );
        }
      }

      // 2. In-text mentions regex: <@([A-Za-z0-9_-]+)>
      const mentionMatches = msg.text.matchAll(/<@([A-Za-z0-9_-]+)>/g);
      for (const match of mentionMatches) {
        const mentionedUser = match[1];
        if (mentionedUser && mentionedUser !== author) {
          if (validator.validateInteraction(rowIdx + 1, { source: author, target: mentionedUser, timestamp: epochMs, type: 'mention' })) {
            this.recordInteraction(
              dyadInteractions,
              anon.anonymize(author).canonicalId,
              anon.anonymize(mentionedUser).canonicalId,
              epochMs,
              'mention',
              weightEngine.getInteractionWeight('mention')
            );
          }
        }
      }

      // 3. Reactions
      if (Array.isArray(msg.reactions)) {
        for (const rx of msg.reactions) {
          for (const reactor of rx.users) {
            if (reactor !== author) {
              if (validator.validateInteraction(rowIdx + 1, { source: reactor, target: author, timestamp: epochMs, type: 'reaction' })) {
                this.recordInteraction(
                  dyadInteractions,
                  anon.anonymize(reactor).canonicalId,
                  anon.anonymize(author).canonicalId,
                  epochMs,
                  'reaction',
                  weightEngine.getInteractionWeight('reaction')
                );
              }
            }
          }
        }
      }
    }

    // Add unique nodes
    const allUsers = new Set<string>();
    for (const [key] of dyadInteractions.entries()) {
      const [u, v] = key.split('->');
      allUsers.add(u);
      allUsers.add(v);
    }

    for (const u of allUsers) {
      builder.addNode({
        id: u,
        label: anon.getLabel(u),
        originalId: anon.deAnonymize(u),
        communityId: input.channelName,
        communities: [input.channelName],
        features: { platform: 'slack', channel: input.channelName },
        degree: 0,
        inDegree: 0,
        outDegree: 0,
        influence: 0.5,
        isBridge: false,
        createdTimestamp: Date.now(),
      });
    }

    // Add aggregated weighted edges
    for (const [key, interactions] of dyadInteractions.entries()) {
      const [u, v] = key.split('->');
      const weight = weightEngine.aggregateWeight(interactions);
      const timestamps = interactions.map(i => i.timestamp);

      builder.addEdge({
        id: key,
        source: u,
        target: v,
        weight,
        relationshipType: interactions[0]?.type || 'message',
        firstInteraction: Math.min(...timestamps),
        lastInteraction: Math.max(...timestamps),
        interactionCount: interactions.length,
        directed: true,
      });
    }

    const graph = builder.build();
    const validationReport = validator.buildReport(`Slack_${input.channelName}`);

    return { graph, validationReport };
  }

  private static recordInteraction(
    map: Map<string, CanonicalInteraction[]>,
    source: string,
    target: string,
    timestamp: number,
    type: string,
    weight: number
  ): void {
    const key = `${source}->${target}`;
    let list = map.get(key);
    if (!list) {
      list = [];
      map.set(key, list);
    }
    list.push({
      id: `int_${source}_${target}_${timestamp}`,
      source,
      target,
      timestamp,
      type,
      weight,
    });
  }
}
