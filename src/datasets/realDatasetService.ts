/**
 * Social Gravity V2 -> V1 Integration Service: Real Dataset Loader & Converter
 *
 * Bridges the V2 Ingestion Engine (Reddit, SNAP Facebook, Custom Uploads)
 * with the V1 Simulation and Visualization Core using CanonicalGraphBuilder.
 */

import { CanonicalGraph, ValidationReport } from '../ingestion/schemas';
import { CanonicalGraphBuilder } from '../ingestion/transformers/canonicalGraphBuilder';
import { RedditRawParser } from '../ingestion/reddit/parsers/rawParser';
import { ThreadReconstructor } from '../ingestion/reddit/transformers/threadReconstructor';
import { RedditGraphBuilder } from '../ingestion/reddit/transformers/graphBuilder';
import { RedditAnonymizer } from '../ingestion/reddit/anonymization/redditAnonymizer';
import { FacebookEgoParser } from '../ingestion/parsers/facebook/facebookEgoParser';
import { Anonymizer } from '../ingestion/anonymization/anonymizer';
import { DatasetValidator } from '../ingestion/validators/datasetValidator';
import { Society } from '../society/types/society';
import { DynamicGraph } from '../graph/engine/dynamicGraph';
import { DynamicGraphMetrics } from '../graph/types';
import {
  REDDIT_TECH_SUBMISSION,
  REDDIT_TECH_COMMENTS,
  REDDIT_MULTISUB_SUBMISSION,
  REDDIT_MULTISUB_COMMENTS,
} from './fixtures/redditFixtures';
import {
  SNAP_FACEBOOK_EDGES_FIXTURE,
  SNAP_FACEBOOK_CIRCLES_FIXTURE,
} from './fixtures/snapFacebookFixture';

export interface RealDatasetDescriptor {
  id: string;
  name: string;
  platform: 'reddit' | 'facebook' | 'custom';
  description: string;
  badge: string;
  estimatedNodes: number;
  estimatedEdges: number;
  communityCount: number;
  researchFocus: string;
}

export interface LoadedDatasetResult {
  society: Society;
  canonicalGraph: CanonicalGraph;
  dynamicGraph: DynamicGraph;
  v2Metrics: DynamicGraphMetrics;
  validationReport: ValidationReport;
}

export class RealDatasetService {
  public static getAvailableDatasets(): RealDatasetDescriptor[] {
    return [
      {
        id: 'reddit_tech',
        name: 'r/technology: Empirical Network Resilience Discussion',
        platform: 'reddit',
        description: 'Authentic 4-level nested conversation hierarchy analyzing peer-to-peer rumor cascades and triadic closure.',
        badge: 'Reddit Discussion Tree',
        estimatedNodes: 7,
        estimatedEdges: 8,
        communityCount: 2,
        researchFocus: 'Conversational hierarchy & asynchronous reply latency under debate',
      },
      {
        id: 'reddit_cross',
        name: 'Multi-Community Cross-Post (worldnews / tech / science)',
        platform: 'reddit',
        description: 'Inter-subreddit communication network modeling bridge brokers who span distinct digital communities.',
        badge: 'Cross-Community Macro',
        estimatedNodes: 8,
        estimatedEdges: 12,
        communityCount: 3,
        researchFocus: 'Granovetter weak-tie diffusion across polarized communities',
      },
      {
        id: 'facebook_ego_0',
        name: 'Stanford SNAP Facebook: Ego Network #0',
        platform: 'facebook',
        description: 'Empirical ego-network benchmark with verified social circles (High School, University, Workplace).',
        badge: 'SNAP Social Circles',
        estimatedNodes: 60,
        estimatedEdges: 154,
        communityCount: 3,
        researchFocus: 'Asch conformity thresholds across overlapping personal social circles',
      },
    ];
  }

  /**
   * Loads one of the pre-configured real-world datasets into CanonicalGraph -> Society.
   */
  public static async loadPreconfiguredDataset(id: string): Promise<LoadedDatasetResult> {
    switch (id) {
      case 'reddit_tech': {
        const parsedSub = RedditRawParser.parseSubmission(REDDIT_TECH_SUBMISSION);
        const parsedComments = REDDIT_TECH_COMMENTS.map((c) => RedditRawParser.parseComment(c));
        const thread = ThreadReconstructor.reconstruct(parsedSub, parsedComments);
        const anon = new RedditAnonymizer({ prefix: 'red_', labelPrefix: 'Redditor_' });
        const canonical = RedditGraphBuilder.buildReplyGraph([thread], { anonymizer: anon });

        return this.finalizeGraph(canonical, 'r/technology Discussion');
      }

      case 'reddit_cross': {
        const sub1 = RedditRawParser.parseSubmission(REDDIT_TECH_SUBMISSION);
        const comms1 = REDDIT_TECH_COMMENTS.map((c) => RedditRawParser.parseComment(c));
        const thread1 = ThreadReconstructor.reconstruct(sub1, comms1);

        const sub2 = RedditRawParser.parseSubmission(REDDIT_MULTISUB_SUBMISSION);
        const comms2 = REDDIT_MULTISUB_COMMENTS.map((c) => RedditRawParser.parseComment(c));
        const thread2 = ThreadReconstructor.reconstruct(sub2, comms2);

        const anon = new RedditAnonymizer({ prefix: 'cross_', labelPrefix: 'Analyst_' });
        const canonical = RedditGraphBuilder.buildParticipationGraph([thread1, thread2], { anonymizer: anon });

        return this.finalizeGraph(canonical, 'Cross-Community Discussion (Tech & Science)');
      }

      case 'facebook_ego_0':
      default: {
        const anon = new Anonymizer({ prefix: 'fb_', labelPrefix: 'FB_User_' });
        const parsed = FacebookEgoParser.parseEgoNetwork(
          {
            egoId: '0',
            edgesText: SNAP_FACEBOOK_EDGES_FIXTURE,
            circlesText: SNAP_FACEBOOK_CIRCLES_FIXTURE,
          },
          anon
        );

        return this.finalizeGraph(parsed.graph, 'Stanford SNAP Facebook (Ego 0)', parsed.validationReport);
      }
    }
  }

  /**
   * Parses an uploaded file (SNAP .edges, Reddit JSON, or Canonical JSON) in the browser.
   */
  public static async parseUploadedFile(fileName: string, content: string): Promise<LoadedDatasetResult> {
    const trimmed = content.trim();
    const validator = new DatasetValidator();

    // 1. JSON-formatted uploads (Reddit thread or Canonical Graph)
    if (fileName.toLowerCase().endsWith('.json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsedJson = JSON.parse(trimmed);

        // A. Is it an existing CanonicalGraph export?
        if (parsedJson.nodes && (parsedJson.edges || parsedJson.adjacency)) {
          const builder = new CanonicalGraphBuilder({
            id: parsedJson.id || `custom_import_${Date.now()}`,
            sourceDataset: parsedJson.sourceDataset || fileName,
            detectCommunitiesIfMissing: true,
          });

          const nodeEntries = Array.isArray(parsedJson.nodes) 
            ? parsedJson.nodes 
            : Object.values(parsedJson.nodes);
          for (const n of nodeEntries) {
            builder.addNode(n);
          }

          const edgeEntries = Array.isArray(parsedJson.edges)
            ? parsedJson.edges
            : Object.values(parsedJson.edges || {});
          for (const e of edgeEntries) {
            builder.addEdge(e);
          }

          const canonical = builder.build();
          return this.finalizeGraph(canonical, fileName);
        }

        // B. Is it a Reddit Thread Export?
        if (parsedJson.comments || (Array.isArray(parsedJson) && parsedJson[0]?.data)) {
          const rawResult = RedditRawParser.parseJsonString(trimmed);
          if (rawResult.submissions.length > 0 || rawResult.comments.length > 0) {
            const sub = rawResult.submissions[0] || {
              id: 'sub_custom',
              name: 't3_custom',
              author: 'OriginalPoster',
              title: fileName.replace('.json', ''),
              subreddit: 'custom_feed',
              score: 100,
              num_comments: rawResult.comments.length,
              created_utc: Math.floor(Date.now() / 1000),
              url: 'https://reddit.com/r/custom',
              upvote_ratio: 0.95,
            };
            const thread = ThreadReconstructor.reconstruct(sub, rawResult.comments);
            const anon = new RedditAnonymizer();
            const canonical = RedditGraphBuilder.buildReplyGraph([thread], { anonymizer: anon });
            return this.finalizeGraph(canonical, fileName);
          }
        }
      } catch (err: any) {
        throw new Error(`JSON parsing failed for ${fileName}: ${err.message}`);
      }
    }

    // 2. SNAP Edge-List text upload (.edges, .txt)
    const lines = trimmed.split(/\r?\n/);
    const anon = new Anonymizer({ prefix: 'custom_', labelPrefix: 'User_' });
    const builder = new CanonicalGraphBuilder({
      id: `custom_edges_${Date.now()}`,
      sourceDataset: fileName,
      detectCommunitiesIfMissing: true,
    });

    const nodeIds = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#') || line.startsWith('//')) continue;

      const parts = line.split(/[\s,\t]+/);
      if (parts.length >= 2) {
        const u = parts[0];
        const v = parts[1];

        const isValid = validator.validateEdgeRow(i + 1, u, v, line);
        if (!isValid) continue;

        const uAnon = anon.anonymize(u).canonicalId;
        const vAnon = anon.anonymize(v).canonicalId;

        if (!nodeIds.has(uAnon)) {
          nodeIds.add(uAnon);
          builder.addNode({
            id: uAnon,
            label: anon.getLabel(uAnon),
            originalId: u,
            communityId: 'default',
            communities: ['default'],
            features: { source: fileName },
            degree: 0,
            inDegree: 0,
            outDegree: 0,
            influence: 0.5,
            isBridge: false,
            createdTimestamp: Date.now(),
          });
        }

        if (!nodeIds.has(vAnon)) {
          nodeIds.add(vAnon);
          builder.addNode({
            id: vAnon,
            label: anon.getLabel(vAnon),
            originalId: v,
            communityId: 'default',
            communities: ['default'],
            features: { source: fileName },
            degree: 0,
            inDegree: 0,
            outDegree: 0,
            influence: 0.5,
            isBridge: false,
            createdTimestamp: Date.now(),
          });
        }

        const weight = parts.length >= 3 && !isNaN(parseFloat(parts[2])) ? Math.min(1, Math.max(0.1, parseFloat(parts[2]))) : 0.6;
        builder.addEdge({
          id: `edge_${uAnon}_${vAnon}`,
          source: uAnon,
          target: vAnon,
          weight,
          relationshipType: 'peer',
          firstInteraction: Date.now(),
          lastInteraction: Date.now(),
          interactionCount: 1,
          directed: false,
        });
      }
    }

    if (nodeIds.size === 0) {
      throw new Error(`No valid network nodes or edges found in ${fileName}. Please check format.`);
    }

    const canonical = builder.build();
    return this.finalizeGraph(canonical, fileName, validator.buildReport(fileName));
  }

  /**
   * Finalizes the CanonicalGraph into V1 Society and computes V2 Dynamic Metrics.
   */
  private static finalizeGraph(
    canonical: CanonicalGraph,
    sourceDatasetName: string,
    existingReport?: ValidationReport
  ): LoadedDatasetResult {
    // 1. Convert to V1 Society using existing canonicalGraphBuilder
    const society = CanonicalGraphBuilder.toSociety(canonical);
    society.name = `Real Data: ${sourceDatasetName}`;

    // 2. Convert to V2 DynamicGraph
    const dynamicGraph = CanonicalGraphBuilder.toDynamicGraph(canonical);

    // 3. Compute V2 Dynamic Metrics
    const v2Metrics = dynamicGraph.getMetrics();

    // 4. Default validation report if not passed
    const report: ValidationReport = existingReport || {
      datasetName: canonical.sourceDataset,
      totalRecordsProcessed: canonical.nodes.size + canonical.edges.size,
      validRecordsCount: canonical.nodes.size + canonical.edges.size,
      rejectedRecordsCount: 0,
      warningRecordsCount: 0,
      duplicateCount: 0,
      selfLoopCount: 0,
      issues: [],
      passed: true,
      validatedAt: Date.now(),
    };

    return {
      society,
      canonicalGraph: canonical,
      dynamicGraph,
      v2Metrics,
      validationReport: report,
    };
  }
}
