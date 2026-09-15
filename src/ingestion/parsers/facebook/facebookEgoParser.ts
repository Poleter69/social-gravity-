/**
 * Social Gravity V2 - Facebook Ego Network Assembler
 *
 * Integrates all 5 complementary files of a SNAP Facebook Ego Network:
 *   - <ego>.edges
 *   - <ego>.circles
 *   - <ego>.featnames
 *   - <ego>.feat
 *   - <ego>.egofeat
 *
 * Reconstructs a fully attributed, privacy-anonymized CanonicalGraph.
 */

import { Anonymizer } from '../../anonymization/anonymizer';
import { CanonicalGraph, ValidationReport } from '../../schemas';
import { CanonicalGraphBuilder } from '../../transformers/canonicalGraphBuilder';
import { DatasetValidator } from '../../validators/datasetValidator';
import { FacebookCircleParser } from './circleParser';
import { FacebookEdgeParser } from './edgeParser';
import { FacebookFeatureParser, FeatureTaxonomy } from './featureParser';

export interface FacebookEgoFilesInput {
  egoId: string;
  edgesText: string;
  circlesText?: string;
  featnamesText?: string;
  featText?: string;
  egofeatText?: string;
}

export interface FacebookEgoParseResult {
  graph: CanonicalGraph;
  taxonomy: FeatureTaxonomy | null;
  validationReport: ValidationReport;
  anonymizer: Anonymizer;
}

export class FacebookEgoParser {
  /**
   * Reconstructs an attributed canonical graph from raw ego network file contents.
   */
  public static parseEgoNetwork(
    input: FacebookEgoFilesInput,
    anonymizer?: Anonymizer
  ): FacebookEgoParseResult {
    const anon = anonymizer || new Anonymizer({ prefix: 'fb_', labelPrefix: 'FB_User_' });
    const validator = new DatasetValidator();

    // 1. Feature Taxonomy Parsing
    let taxonomy: FeatureTaxonomy | null = null;
    let alterFeatures = new Map<string, { rawVector: number[]; semanticFeatures: Record<string, string> }>();
    let egoFeatures: { rawVector: number[]; semanticFeatures: Record<string, string> } | null = null;

    if (input.featnamesText) {
      taxonomy = FacebookFeatureParser.parseFeatnames(input.featnamesText);

      if (input.featText) {
        alterFeatures = FacebookFeatureParser.parseNodeFeatures(input.featText, taxonomy);
      }

      if (input.egofeatText) {
        egoFeatures = FacebookFeatureParser.parseEgoFeatures(input.egofeatText, taxonomy);
      }
    }

    // 2. Social Circles Parsing
    let parsedCircles = {
      circleCount: 0,
      circles: new Map<string, string[]>(),
      nodeMemberships: new Map<string, string[]>(),
    };

    if (input.circlesText) {
      parsedCircles = FacebookCircleParser.parseCircles(input.circlesText);
    }

    // 3. Edges Parsing
    const edgeResult = FacebookEdgeParser.parseEdges(input.edgesText, validator);

    // 4. Canonical Graph Construction
    const builder = new CanonicalGraphBuilder({
      id: `snap_facebook_ego_${input.egoId}`,
      sourceDataset: `SNAP_FACEBOOK_EGO_${input.egoId}`,
      detectCommunitiesIfMissing: parsedCircles.circles.size === 0,
      metadata: {
        egoId: input.egoId,
        totalCircles: parsedCircles.circleCount,
        totalFeatureDefinitions: taxonomy ? taxonomy.totalFeatures : 0,
        featureCategories: taxonomy ? taxonomy.categories : {},
      },
    });

    // 4a. Add Ego Node
    const egoAnon = anon.anonymize(input.egoId);
    const egoCommunities = Array.from(parsedCircles.circles.keys());

    builder.addNode({
      id: egoAnon.canonicalId,
      label: `Ego_${input.egoId}`,
      originalId: input.egoId,
      communityId: egoCommunities[0] || 'comm_ego',
      communities: egoCommunities.length > 0 ? egoCommunities : ['comm_ego'],
      features: egoFeatures ? egoFeatures.semanticFeatures : {},
      rawFeatureVector: egoFeatures ? egoFeatures.rawVector : undefined,
      degree: 0,
      inDegree: 0,
      outDegree: 0,
      influence: 0.95, // Ego is the gravitational center
      isBridge: true,
      createdTimestamp: 0,
      metadata: { isEgo: true, rawEgoId: input.egoId },
    });

    // 4b. Add Alter Nodes
    const alterIds = new Set<string>();
    for (const edge of edgeResult.edges) {
      alterIds.add(edge.source);
      alterIds.add(edge.target);
    }
    for (const alterId of alterFeatures.keys()) {
      alterIds.add(alterId);
    }

    for (const rawAlterId of alterIds) {
      if (rawAlterId === input.egoId) continue;

      const alterAnon = anon.anonymize(rawAlterId);
      const feat = alterFeatures.get(rawAlterId);
      const circles = parsedCircles.nodeMemberships.get(rawAlterId) || ['general'];

      builder.addNode({
        id: alterAnon.canonicalId,
        label: alterAnon.label,
        originalId: rawAlterId,
        communityId: circles[0] || 'general',
        communities: circles,
        features: feat ? feat.semanticFeatures : {},
        rawFeatureVector: feat ? feat.rawVector : undefined,
        degree: 0,
        inDegree: 0,
        outDegree: 0,
        influence: 0.5,
        isBridge: false,
        createdTimestamp: 0,
        metadata: { isEgo: false, rawId: rawAlterId },
      });
    }

    // 4c. Add Alter-Alter Edges
    const seenEdges = new Set<string>();

    for (const edge of edgeResult.edges) {
      const uAnon = anon.anonymize(edge.source).canonicalId;
      const vAnon = anon.anonymize(edge.target).canonicalId;
      const edgeKey = uAnon < vAnon ? `${uAnon}--${vAnon}` : `${vAnon}--${uAnon}`;

      if (!seenEdges.has(edgeKey)) {
        seenEdges.add(edgeKey);
        builder.addEdge({
          id: edgeKey,
          source: uAnon,
          target: vAnon,
          weight: 0.8,
          relationshipType: 'friendship',
          firstInteraction: 0,
          lastInteraction: 0,
          interactionCount: 1,
          directed: false,
        });
      }
    }

    // 4d. Add Ego-Alter Edges (The ego node is friends with every alter in its ego network)
    for (const rawAlterId of alterIds) {
      if (rawAlterId === input.egoId) continue;
      const alterAnon = anon.anonymize(rawAlterId).canonicalId;
      const egoAnonId = egoAnon.canonicalId;
      const edgeKey = egoAnonId < alterAnon ? `${egoAnonId}--${alterAnon}` : `${alterAnon}--${egoAnonId}`;

      if (!seenEdges.has(edgeKey)) {
        seenEdges.add(edgeKey);
        builder.addEdge({
          id: edgeKey,
          source: egoAnonId,
          target: alterAnon,
          weight: 0.95,
          relationshipType: 'ego_tie',
          firstInteraction: 0,
          lastInteraction: 0,
          interactionCount: 5,
          directed: false,
        });
      }
    }

    // 4e. Map communities from circles
    if (parsedCircles.circles.size > 0) {
      const canonicalCircles = new Map<string, string[]>();
      for (const [circleName, memberIds] of parsedCircles.circles.entries()) {
        const canonicalMembers = memberIds.map(m => anon.anonymize(m).canonicalId);
        canonicalCircles.set(circleName, canonicalMembers);
      }
      builder.setCommunities(canonicalCircles);
    }

    const graph = builder.build();
    const validationReport = validator.buildReport(`Facebook_Ego_${input.egoId}`);

    return {
      graph,
      taxonomy,
      validationReport,
      anonymizer: anon,
    };
  }
}
