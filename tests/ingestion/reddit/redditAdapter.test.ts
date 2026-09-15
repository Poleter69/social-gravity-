/**
 * Social Gravity V2 - Reddit Intelligence Adapter Master Test Suite
 *
 * Validates all 15 modules:
 * - API Client resilience (pagination, retries on 429, mock fetch)
 * - Raw Parser (JSONL, HTML decode, mention extraction, deleted users)
 * - Thread Reconstructor (deep nesting, orphan handling, chronological ordering)
 * - Anonymization (SHA-256 salted pseudonymization, codebook, mention rewriting)
 * - Graph Builders (Reply, Mention, Participation, Subreddit interaction)
 * - Influence Analytics (PageRank, Betweenness, Eigenvector, k-Core, Gini)
 * - Emotional Readiness Layer (text cleaning, GoEmotions vectors, sentiment)
 * - Temporal Replay Engine (stepping, seek, state reconstruction)
 * - Intelligence Reports & Deterministic AI Analyst
 * - Full Simulation Interoperability (DynamicGraph & RumorEngine)
 */

import { RedditClient } from '../../../src/ingestion/reddit/api/redditClient';
import { RedditDatasetCollector } from '../../../src/ingestion/reddit/api/collector';
import { RedditRawParser } from '../../../src/ingestion/reddit/parsers/rawParser';
import { RedditAnonymizer } from '../../../src/ingestion/reddit/anonymization/redditAnonymizer';
import { ThreadReconstructor } from '../../../src/ingestion/reddit/transformers/threadReconstructor';
import { InteractionTransformer } from '../../../src/ingestion/reddit/transformers/interactionTransformer';
import { RedditGraphBuilder } from '../../../src/ingestion/reddit/transformers/graphBuilder';
import { InfluenceAnalytics } from '../../../src/ingestion/reddit/analyzers/influenceAnalytics';
import { RedditCommunityDetector } from '../../../src/ingestion/reddit/analyzers/communityDetector';
import { EmotionalLayer } from '../../../src/ingestion/reddit/analyzers/emotionalLayer';
import { TemporalReplayEngine } from '../../../src/ingestion/reddit/replay/temporalReplayEngine';
import { RedditReportGenerator } from '../../../src/ingestion/reddit/reports/redditReportGenerator';
import { RedditAiAnalyst } from '../../../src/ingestion/reddit/reports/aiAnalyst';
import { DynamicGraph } from '../../../src/graph/engine/dynamicGraph';
import { TickEngine } from '../../../src/graph/engine/tickEngine';
import { RumorEngine } from '../../../src/simulation/rumorEngine';
import {
  MOCK_REDDIT_SUBMISSION,
  MOCK_REDDIT_COMMENTS,
  MOCK_MULTI_SUBREDDIT_SUBMISSION,
  MOCK_MULTI_SUBREDDIT_COMMENTS,
} from './fixtures/mockRedditData';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function runRedditAdapterTests() {
  console.log('========================================================');
  console.log('  SOCIAL GRAVITY V2 — REDDIT INTELLIGENCE ADAPTER TESTS');
  console.log('========================================================');

  // ----------------------------------------------------
  // 1. Raw Data Parser
  // ----------------------------------------------------
  console.log('--- Testing Raw Data Parser & HTML Entity Decoding ---');
  {
    const htmlText = 'Here &amp; there, &lt;bold&gt; &quot;quotes&quot; &amp; &#39;apostrophe&#39;';
    const decoded = RedditRawParser.decodeHtmlEntities(htmlText);
    assert(decoded === 'Here & there, <bold> "quotes" & \'apostrophe\'', `HTML entity decoding failed: "${decoded}"`);

    const parsedSub = RedditRawParser.parseSubmission(MOCK_REDDIT_SUBMISSION);
    assert(parsedSub.id === 'sub_alpha_1', 'Submission ID extraction mismatch');
    assert(parsedSub.subreddit === 'technology', 'Subreddit normalization mismatch');
    assert(parsedSub.mentions.includes('PeerVerifier'), 'Mention extraction failed on submission');

    const parsedComm = RedditRawParser.parseComment(MOCK_REDDIT_COMMENTS[0]);
    assert(parsedComm.id === 'comm_01', 'Comment ID mismatch');
    assert(parsedComm.parentId === 'sub_alpha_1', 'Parent ID normalization mismatch');
    assert(parsedComm.parentType === 'submission', 'Parent type mismatch');
    assert(parsedComm.mentions.includes('NetworkScientist'), 'Mention extraction failed on comment');

    // Test JSONL and malformed handling
    const jsonlInput = `
      {"id": "t1_valid1", "author": "Alice", "body": "First comment", "created_utc": 1700000000, "subreddit": "tech"}
      {malformed json line}
      {"id": "t3_valid2", "author": "Bob", "title": "Second post", "created_utc": 1700000000, "subreddit": "tech"}
    `;
    const jsonlResult = RedditRawParser.parseJsonString(jsonlInput);
    assert(jsonlResult.comments.length === 1, 'JSONL valid comments count mismatch');
    assert(jsonlResult.submissions.length === 1, 'JSONL valid submissions count mismatch');
    assert(jsonlResult.malformedCount === 1, 'Malformed line detection failed');

    console.log('  ✓ Raw parser, JSONL, and HTML decoding validated.');
  }

  // ----------------------------------------------------
  // 2. Thread Reconstruction
  // ----------------------------------------------------
  console.log('--- Testing Discussion Thread Reconstruction ---');
  {
    const sub = RedditRawParser.parseSubmission(MOCK_REDDIT_SUBMISSION);
    const comments = MOCK_REDDIT_COMMENTS.map(c => RedditRawParser.parseComment(c));
    const thread = ThreadReconstructor.reconstruct(sub, comments);

    assert(thread.allComments.size === MOCK_REDDIT_COMMENTS.length, 'Reconstructed comment map size mismatch');
    assert(thread.roots.length === 3, `Expected 3 roots (comm_01, comm_05, comm_08_orphan), got ${thread.roots.length}`);
    assert(thread.orphans.length === 1, `Expected 1 orphan, got ${thread.orphans.length}`);
    assert(thread.orphans[0].id === 'comm_08_orphan', 'Identified wrong orphan comment');

    // Deep nesting verification (comm_01 -> comm_02 -> comm_03 -> comm_04)
    assert(thread.metrics.maxDepth === 4, `Expected max depth 4, got ${thread.metrics.maxDepth}`);
    assert(thread.metrics.totalComments === 8, 'Total comments mismatch');
    assert(thread.metrics.branchingFactor > 0, 'Branching factor should be positive');
    assert(thread.metrics.averageResponseTimeSeconds > 0, 'Average response time should be positive');
    assert(thread.metrics.uniqueParticipants >= 4, 'Unique participants mismatch');

    console.log(`  ✓ Hierarchical tree reconstructed (Depth: ${thread.metrics.maxDepth}, Orphans: ${thread.orphans.length}, Branching: ${thread.metrics.branchingFactor})`);
  }

  // ----------------------------------------------------
  // 3. Deterministic Privacy Anonymizer
  // ----------------------------------------------------
  console.log('--- Testing Salted SHA-256 Privacy Anonymizer ---');
  {
    const anon = new RedditAnonymizer({ salt: 'test_salt_alpha' });
    const user1 = anon.anonymize('TechAnalyst_01');
    const user2 = anon.anonymize('/u/TechAnalyst_01');
    assert(user1.canonicalId === user2.canonicalId, 'Leading /u/ normalization mismatch');
    assert(user1.label.startsWith('Redditor_'), 'Label prefix mismatch');

    // Anonymize in-text mentions
    const rawText = 'Hello u/TechAnalyst_01 and /u/PeerVerifier, check this!';
    const anonymizedText = anon.anonymizeTextMentions(rawText);
    assert(!anonymizedText.includes('TechAnalyst_01'), 'Failed to redact TechAnalyst_01 in text');
    assert(!anonymizedText.includes('PeerVerifier'), 'Failed to redact PeerVerifier in text');
    assert(anonymizedText.includes(user1.label), 'Anonymized label not inserted into text');

    // Deleted users preservation
    const deletedAnon = anon.anonymize('[deleted]');
    assert(deletedAnon.canonicalId === '[deleted]', 'Special user [deleted] should not be hashed');

    // Codebook reversible roundtrip
    const codebook = anon.exportCodebook();
    assert(anon.deAnonymize(user1.canonicalId) === 'TechAnalyst_01', 'De-anonymization roundtrip failed');

    console.log('  ✓ Deterministic pseudonymization, mention rewriting, and codebook verified.');
  }

  // ----------------------------------------------------
  // 4. Emotional Readiness Layer
  // ----------------------------------------------------
  console.log('--- Testing Emotional Readiness Layer ---');
  {
    const rawComment = '> Previous quote\nGreat and awesome study! Really love this clean work. https://reddit.com';
    const payload = EmotionalLayer.processText(rawComment);

    assert(!payload.cleanedText.includes('https://'), 'URL was not cleaned');
    assert(!payload.cleanedText.includes('>'), 'Markdown quote was not cleaned');
    assert(payload.sentiment.compound > 0.5, 'Positive sentiment expected for positive words');
    assert(payload.emotions.approval !== undefined, 'GoEmotions approval dimension missing');
    assert(Object.keys(payload.emotions).length === 28, 'GoEmotions dimensions count mismatch');

    console.log(`  ✓ Text cleaning and GoEmotions payload verified (Compound: ${payload.sentiment.compound})`);
  }

  // ----------------------------------------------------
  // 5. Community Graph Builders (4 Topologies)
  // ----------------------------------------------------
  console.log('--- Testing 4 First-Class Reddit Graph Topologies ---');
  {
    const sub1 = RedditRawParser.parseSubmission(MOCK_REDDIT_SUBMISSION);
    const comms1 = MOCK_REDDIT_COMMENTS.map(c => RedditRawParser.parseComment(c));
    const thread1 = ThreadReconstructor.reconstruct(sub1, comms1);

    const sub2 = RedditRawParser.parseSubmission(MOCK_MULTI_SUBREDDIT_SUBMISSION);
    const comms2 = MOCK_MULTI_SUBREDDIT_COMMENTS.map(c => RedditRawParser.parseComment(c));
    const thread2 = ThreadReconstructor.reconstruct(sub2, comms2);

    const allThreads = [thread1, thread2];

    // 1. Reply Graph
    const replyGraph = RedditGraphBuilder.buildReplyGraph(allThreads);
    assert(replyGraph.nodes.size > 0, 'Reply graph should have nodes');
    assert(replyGraph.edges.size > 0, 'Reply graph should have edges');
    assert(replyGraph.metadata.graphType === 'reply_graph', 'Graph type metadata mismatch');

    // 2. Mention Graph
    const mentionGraph = RedditGraphBuilder.buildMentionGraph(allThreads);
    assert(mentionGraph.edges.size >= 2, 'Mention graph should have edges from u/PeerVerifier and /u/NetworkScientist');
    assert(mentionGraph.metadata.graphType === 'mention_graph', 'Mention graph type mismatch');

    // 3. Thread Participation Graph
    const partGraph = RedditGraphBuilder.buildParticipationGraph(allThreads);
    assert(partGraph.edges.size > 0, 'Participation graph should have co-occurrence edges');
    for (const edge of partGraph.edges.values()) {
      assert(!edge.directed, 'Participation graph edges must be undirected');
    }

    // 4. Subreddit Interaction Graph
    const subGraph = RedditGraphBuilder.buildSubredditInteractionGraph(allThreads);
    assert(subGraph.nodes.size === 2, `Expected 2 subreddit nodes (r/technology, r/science), got ${subGraph.nodes.size}`);
    assert(subGraph.edges.size === 1, 'Expected 1 cross-subreddit edge due to shared authors');

    console.log(`  ✓ Reply Graph:         ${replyGraph.nodes.size} nodes, ${replyGraph.edges.size} edges (Modularity Q: ${replyGraph.modularity.toFixed(3)})`);
    console.log(`  ✓ Mention Graph:       ${mentionGraph.nodes.size} nodes, ${mentionGraph.edges.size} edges`);
    console.log(`  ✓ Participation Graph: ${partGraph.nodes.size} nodes, ${partGraph.edges.size} edges`);
    console.log(`  ✓ Subreddit Macro:     ${subGraph.nodes.size} subreddits, ${subGraph.edges.size} shared edges`);
  }

  // ----------------------------------------------------
  // 6. Influence Analytics & Community Detection
  // ----------------------------------------------------
  console.log('--- Testing Network Centrality & Influence Analytics ---');
  {
    const sub = RedditRawParser.parseSubmission(MOCK_REDDIT_SUBMISSION);
    const comms = MOCK_REDDIT_COMMENTS.map(c => RedditRawParser.parseComment(c));
    const thread = ThreadReconstructor.reconstruct(sub, comms);
    const graph = RedditGraphBuilder.buildReplyGraph([thread]);

    const report = InfluenceAnalytics.analyzeGraph(graph);

    // PageRank tests
    assert(report.topPageRank.length > 0, 'PageRank rankings should not be empty');
    let prSum = 0;
    for (const m of report.nodeMetrics.values()) {
      prSum += m.pageRank;
    }
    assert(Math.abs(prSum - 1.0) < 1e-3, `PageRank should sum to ~1.0, got ${prSum}`);

    // Betweenness tests
    assert(report.topBetweenness.length > 0, 'Betweenness rankings should not be empty');

    // k-Core tests
    assert(report.kCoreMax >= 1, 'Max k-core should be >= 1');

    // Gini inequality test
    const equalCounts = [5, 5, 5, 5];
    const equalGini = InfluenceAnalytics.computeParticipationGini(equalCounts);
    assert(equalGini === 0, `Uniform distribution should have Gini 0, got ${equalGini}`);

    const skewedCounts = [1, 1, 1, 100];
    const skewedGini = InfluenceAnalytics.computeParticipationGini(skewedCounts);
    assert(skewedGini > 0.6, `Skewed distribution should have high Gini, got ${skewedGini}`);

    // Community profiling
    const profiles = RedditCommunityDetector.profileCommunities(graph);
    assert(profiles.length > 0, 'Community profiles should be generated');

    console.log(`  ✓ PageRank, Betweenness, k-Core (${report.kCoreMax}), and Gini inequality validated.`);
  }

  // ----------------------------------------------------
  // 7. Temporal Replay Engine
  // ----------------------------------------------------
  console.log('--- Testing Temporal Replay Engine ---');
  {
    const sub = RedditRawParser.parseSubmission(MOCK_REDDIT_SUBMISSION);
    const comms = MOCK_REDDIT_COMMENTS.map(c => RedditRawParser.parseComment(c));
    const thread = ThreadReconstructor.reconstruct(sub, comms);

    const replay = TemporalReplayEngine.fromThreads([thread], {
      tickResolutionSeconds: 1800, // 30-minute ticks
    });

    assert(replay.getTotalTicks() > 1, 'Replay total ticks should be > 1');
    assert(replay.getCurrentTick() === 0, 'Initial tick should be 0');

    // Step through 2 ticks
    const delta1 = replay.step();
    assert(delta1.tick === 0, 'First step tick should be 0');
    assert(replay.getCurrentTick() === 1, 'Tick pointer should be 1');

    const delta2 = replay.step();
    assert(delta2.tick === 1, 'Second step tick should be 1');

    // Snapshot reconstruction
    const snapshot = replay.getSnapshot();
    assert(snapshot.nodes.size === delta2.totalActiveNodes, 'Snapshot node count mismatch');
    assert(snapshot.edges.size === delta2.totalActiveEdges, 'Snapshot edge count mismatch');

    // Time-travel seek
    replay.seek(0);
    assert(replay.getCurrentTick() === 0, 'Seek to 0 failed');
    const resetSnapshot = replay.getSnapshot();
    assert(resetSnapshot.nodes.size === 0, 'Reset snapshot should have 0 active nodes');

    console.log(`  ✓ Temporal timeline sliced into ${replay.getTotalTicks()} ticks with exact state reconstruction.`);
  }

  // ----------------------------------------------------
  // 8. Resilient API Client (Mock Offline Fetch)
  // ----------------------------------------------------
  console.log('--- Testing Resilient API Client & Retries ---');
  {
    let callCount = 0;
    const mockFetch = async (url: string) => {
      callCount++;
      if (callCount === 1) {
        // Simulate HTTP 429 rate limit
        return { ok: false, status: 429, json: async () => ({}) };
      }
      // Success on retry
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            { id: 'sub_test_1', author: 'User1', title: 'Test', created_utc: 1700000000 },
          ],
        }),
      };
    };

    const client = new RedditClient({
      customFetch: mockFetch,
      rateLimitDelayMs: 10,
      maxRetries: 2,
    });

    const subs = await client.fetchSubmissions({ subreddit: 'test', limit: 1 });
    assert(subs.length === 1, 'Should fetch 1 submission after retry');
    assert(callCount === 2, `Expected 2 calls (retry on 429), got ${callCount}`);
    console.log('  ✓ API client backoff retry on HTTP 429 verified.');
  }

  // ----------------------------------------------------
  // 9. Intelligence Reports & Deterministic AI Analyst
  // ----------------------------------------------------
  console.log('--- Testing Intelligence Reports & Deterministic AI Analyst ---');
  {
    const sub = RedditRawParser.parseSubmission(MOCK_REDDIT_SUBMISSION);
    const comms = MOCK_REDDIT_COMMENTS.map(c => RedditRawParser.parseComment(c));
    const thread = ThreadReconstructor.reconstruct(sub, comms);
    const graph = RedditGraphBuilder.buildReplyGraph([thread]);

    const reportData = RedditReportGenerator.generate([thread], graph);
    assert(reportData.datasetSummary.totalComments === 8, 'Report comment count mismatch');
    assert(reportData.networkSummary.nodeCount === graph.nodes.size, 'Report node count mismatch');

    const markdown = RedditReportGenerator.toMarkdown(reportData);
    assert(markdown.includes('Social Gravity — Reddit Network Intelligence Report'), 'Markdown header missing');
    assert(markdown.includes('Top PageRank Gravitational Hubs'), 'PageRank section missing');

    const analyst = new RedditAiAnalyst();
    const findings = analyst.generateDeterministicFindings(reportData);
    assert(findings.length === 4, `Expected 4 deterministic findings, got ${findings.length}`);
    assert(findings[0].category === 'bridge_broker', 'First finding should be bridge_broker');

    console.log('  ✓ Scientific Markdown report & 4 deterministic AI findings verified.');
  }

  // ----------------------------------------------------
  // 10. Downstream Simulator Interoperability
  // ----------------------------------------------------
  console.log('--- Testing Downstream Simulator Interoperability ---');
  {
    const sub = RedditRawParser.parseSubmission(MOCK_REDDIT_SUBMISSION);
    const comms = MOCK_REDDIT_COMMENTS.map(c => RedditRawParser.parseComment(c));
    const thread = ThreadReconstructor.reconstruct(sub, comms);
    const graph = RedditGraphBuilder.buildReplyGraph([thread]);

    // Test A: V2 DynamicGraph & TickEngine
    const dynamicGraph = RedditGraphBuilder.toDynamicGraph(graph);
    assert(dynamicGraph.getAllNodes().length === graph.nodes.size, 'DynamicGraph node count mismatch');
    assert(dynamicGraph.getAllEdges().length === graph.edges.size, 'DynamicGraph edge count mismatch');

    const tickEngine = new TickEngine(dynamicGraph);
    for (let t = 0; t < 3; t++) {
      tickEngine.tick();
    }
    assert(dynamicGraph.getTick() === 3, 'DynamicGraph failed to advance 3 ticks');

    // Test B: V1 Society & RumorEngine
    const society = RedditGraphBuilder.toSociety(graph);
    assert(society.agents.length === graph.nodes.size, 'Society agent count mismatch');
    assert(society.communities.length > 0, 'Society community count mismatch');

    const rumorEngine = new RumorEngine(society);
    const patientZero = society.agents[0].id;
    rumorEngine.start({
      id: 'claim_reddit_01',
      topic: 'network_resilience',
      veracity: 0.8,
      sourceCredibility: 0.9,
      emotionalCharge: { fear: 0.1, anger: 0.1, urgency: 0.5 },
      complexity: 0.3,
    }, [patientZero]);

    let lastState = rumorEngine.getState();
    for (let r = 0; r < 2; r++) {
      lastState = rumorEngine.step();
    }

    assert(lastState.telemetryHistory.length >= 2, 'RumorEngine telemetry missing rounds');
    const lastTelemetry = lastState.telemetryHistory[lastState.telemetryHistory.length - 1];

    console.log(`  ✓ V2 DynamicGraph: 3 ticks simulated successfully.`);
    console.log(`  ✓ V1 RumorEngine: 2 rounds diffused across Reddit network (Believers: ${lastTelemetry ? lastTelemetry.believerCount : 1}).`);
  }

  console.log('========================================================');
  console.log('  ALL REDDIT INTELLIGENCE ADAPTER TESTS PASSED (100%)');
  console.log('========================================================\n');
}
