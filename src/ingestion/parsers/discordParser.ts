/**
 * Social Gravity V2 - Discord Server Communication Ingestion Parser
 *
 * Extracts multi-modal interactions from Discord JSON logs:
 * - Direct User Mentions (<@userId>)
 * - Message Replies (message_reference)
 * - Emoji Reactions (user added reaction to message author)
 * - Channel co-participation
 */

import { Anonymizer } from '../anonymization/anonymizer';
import { CanonicalGraph, CanonicalInteraction, ValidationReport } from '../schemas';
import { CanonicalGraphBuilder } from '../transformers/canonicalGraphBuilder';
import { DISCORD_WEIGHTING_PROFILE, EdgeWeightEngine } from '../transformers/edgeWeightEngine';
import { DatasetValidator } from '../validators/datasetValidator';

export interface DiscordReaction {
  emoji: string;
  userIds: string[];
}

export interface DiscordMessage {
  id: string;
  authorId: string;
  authorUsername?: string;
  timestamp: string | number; // ISO string or epoch ms
  content: string;
  channelId: string;
  channelName?: string;
  replyToAuthorId?: string;
  mentions?: string[]; // Array of mentioned userIds
  reactions?: DiscordReaction[];
}

export interface DiscordServerInput {
  serverId: string;
  serverName: string;
  messages: DiscordMessage[];
}

export class DiscordParser {
  /**
   * Parses Discord server export into a CanonicalGraph.
   */
  public static parseServer(
    input: DiscordServerInput,
    anonymizer?: Anonymizer
  ): { graph: CanonicalGraph; validationReport: ValidationReport } {
    const anon = anonymizer || new Anonymizer({ prefix: 'disc_', labelPrefix: 'DiscordUser_' });
    const validator = new DatasetValidator();
    const weightEngine = new EdgeWeightEngine(DISCORD_WEIGHTING_PROFILE);

    const builder = new CanonicalGraphBuilder({
      id: `discord_${input.serverId}`,
      sourceDataset: `DISCORD_GUILD_${input.serverName.replace(/\s+/g, '_')}`,
      detectCommunitiesIfMissing: true,
      metadata: {
        serverId: input.serverId,
        serverName: input.serverName,
      },
    });

    const dyadInteractions = new Map<string, CanonicalInteraction[]>();
    const activeChannels = new Map<string, Set<string>>(); // channelId -> Set of userIds

    for (let rowIdx = 0; rowIdx < input.messages.length; rowIdx++) {
      const msg = input.messages[rowIdx];
      const author = msg.authorId;
      if (!author) continue;

      const ts = typeof msg.timestamp === 'string' ? new Date(msg.timestamp).getTime() : msg.timestamp;

      // Track channel co-participation
      let channelUsers = activeChannels.get(msg.channelId);
      if (!channelUsers) {
        channelUsers = new Set();
        activeChannels.set(msg.channelId, channelUsers);
      }
      channelUsers.add(author);

      // 1. Process Reply interaction
      if (msg.replyToAuthorId && msg.replyToAuthorId !== author) {
        if (validator.validateInteraction(rowIdx + 1, { source: author, target: msg.replyToAuthorId, timestamp: ts, type: 'reply' })) {
          this.recordInteraction(
            dyadInteractions,
            anon.anonymize(author).canonicalId,
            anon.anonymize(msg.replyToAuthorId).canonicalId,
            ts,
            'reply',
            weightEngine.getInteractionWeight('reply')
          );
        }
      }

      // 2. Process Mentions
      if (Array.isArray(msg.mentions)) {
        for (const mentioned of msg.mentions) {
          if (mentioned !== author) {
            if (validator.validateInteraction(rowIdx + 1, { source: author, target: mentioned, timestamp: ts, type: 'mention' })) {
              this.recordInteraction(
                dyadInteractions,
                anon.anonymize(author).canonicalId,
                anon.anonymize(mentioned).canonicalId,
                ts,
                'mention',
                weightEngine.getInteractionWeight('mention')
              );
            }
          }
        }
      }

      // 3. Process Reactions
      if (Array.isArray(msg.reactions)) {
        for (const rx of msg.reactions) {
          for (const reactor of rx.userIds) {
            if (reactor !== author) {
              if (validator.validateInteraction(rowIdx + 1, { source: reactor, target: author, timestamp: ts, type: 'reaction' })) {
                this.recordInteraction(
                  dyadInteractions,
                  anon.anonymize(reactor).canonicalId,
                  anon.anonymize(author).canonicalId,
                  ts,
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
        communityId: 'guild_general',
        communities: ['guild_general'],
        features: { platform: 'discord', guildId: input.serverId },
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
    const validationReport = validator.buildReport(`Discord_${input.serverName}`);

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
