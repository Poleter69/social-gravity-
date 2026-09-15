/**
 * Social Gravity V2 - Wikipedia Talk Ingestion Parser
 *
 * Ingests SNAP WikiTalk communication networks:
 * Directed edge A -> B signifies user A edited talk page of user B.
 * Supports streaming slice or full file parsing with deterministic anonymization.
 */

import { Anonymizer } from '../anonymization/anonymizer';
import { CanonicalGraph, ValidationReport } from '../schemas';
import { CanonicalGraphBuilder } from '../transformers/canonicalGraphBuilder';
import { DatasetValidator } from '../validators/datasetValidator';

export interface WikiTalkParseOptions {
  maxEdges?: number;
  maxNodes?: number;
  anonymizer?: Anonymizer;
}

export class WikiTalkParser {
  /**
   * Parses raw WikiTalk edge list content.
   */
  public static parse(
    content: string,
    options: WikiTalkParseOptions = {}
  ): { graph: CanonicalGraph; validationReport: ValidationReport } {
    const anon = options.anonymizer || new Anonymizer({ prefix: 'wiki_', labelPrefix: 'Editor_' });
    const validator = new DatasetValidator();

    const builder = new CanonicalGraphBuilder({
      id: 'snap_wiki_talk_network',
      sourceDataset: 'SNAP_WIKI_TALK',
      detectCommunitiesIfMissing: true,
      metadata: {
        dataset: 'Wikipedia Talk Communication Network',
      },
    });

    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const edgeCounts = new Map<string, number>();
    const uniqueNodes = new Set<string>();
    const maxEdges = options.maxEdges || 100000;

    for (let rowIdx = 0; rowIdx < lines.length; rowIdx++) {
      const line = lines[rowIdx];
      if (line.startsWith('#')) continue;

      const tokens = line.split(/\s+/);
      if (tokens.length < 2) continue;

      const fromNode = tokens[0];
      const toNode = tokens[1];

      const isValid = validator.validateEdgeRow(rowIdx + 1, fromNode, toNode, line);
      if (!isValid) continue;

      const uAnon = anon.anonymize(fromNode).canonicalId;
      const vAnon = anon.anonymize(toNode).canonicalId;

      const key = `${uAnon}->${vAnon}`;
      edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);

      uniqueNodes.add(uAnon);
      uniqueNodes.add(vAnon);

      if (edgeCounts.size >= maxEdges) {
        break;
      }
    }

    // Add nodes
    for (const u of uniqueNodes) {
      builder.addNode({
        id: u,
        label: anon.getLabel(u),
        originalId: anon.deAnonymize(u),
        communityId: 'wikipedia_editors',
        communities: ['wikipedia_editors'],
        features: { platform: 'wikipedia', type: 'talk_contributor' },
        degree: 0,
        inDegree: 0,
        outDegree: 0,
        influence: 0.5,
        isBridge: false,
        createdTimestamp: 0,
      });
    }

    // Add edges
    for (const [key, count] of edgeCounts.entries()) {
      const [u, v] = key.split('->');
      // Saturated weight: 1 - exp(-count / 4)
      const weight = Number((1.0 - Math.exp(-count / 4.0)).toFixed(3));

      builder.addEdge({
        id: key,
        source: u,
        target: v,
        weight: Math.min(1.0, Math.max(0.2, weight)),
        relationshipType: 'talk_edit',
        firstInteraction: 0,
        lastInteraction: 0,
        interactionCount: count,
        directed: true,
      });
    }

    const graph = builder.build();
    const validationReport = validator.buildReport('SNAP_WikiTalk');

    return { graph, validationReport };
  }
}
