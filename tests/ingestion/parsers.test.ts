/**
 * Social Gravity V2 - Multi-Platform Parser Unit Tests
 *
 * Validates individual ingestion parsers for:
 * - Facebook Features, Circles, and Edges
 * - Reddit Conversation Trees
 * - Discord Server Multi-Modal Logs
 * - Slack Channel Threads & Mentions
 * - Wikipedia Talk Edit Networks
 */

import { FacebookCircleParser } from '../../src/ingestion/parsers/facebook/circleParser';
import { FacebookEdgeParser } from '../../src/ingestion/parsers/facebook/edgeParser';
import { FacebookFeatureParser } from '../../src/ingestion/parsers/facebook/featureParser';
import { RedditParser } from '../../src/ingestion/parsers/redditParser';
import { DiscordParser } from '../../src/ingestion/parsers/discordParser';
import { SlackParser } from '../../src/ingestion/parsers/slackParser';
import { WikiTalkParser } from '../../src/ingestion/parsers/wikiTalkParser';
import { EdgeWeightEngine } from '../../src/ingestion/transformers/edgeWeightEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testIngestionParsers() {
  console.log('--- Testing Multi-Platform Ingestion Parsers ---');

  // Test 1: Facebook Feature Parser
  const featnamesMock = `
0 birthday;anonymized feature 0
1 education;classes;id;anonymized feature 1
2 education;degree;id;anonymized feature 2
3 work;employer;id;anonymized feature 3
`.trim();

  const taxonomy = FacebookFeatureParser.parseFeatnames(featnamesMock);
  assert(taxonomy.totalFeatures === 4, `Expected 4 features, got ${taxonomy.totalFeatures}`);
  assert(taxonomy.categories['education'] === 2, 'Expected 2 education features');
  assert(taxonomy.categories['work'] === 1, 'Expected 1 work feature');

  const featMock = `
101 1 0 1 0
102 0 1 0 1
`.trim();
  const nodeFeats = FacebookFeatureParser.parseNodeFeatures(featMock, taxonomy);
  assert(nodeFeats.size === 2, 'Expected features for 2 nodes');
  assert(
    nodeFeats.get('101')?.semanticFeatures['education_degree']?.includes('anonymized feature 2'),
    'Node 101 must possess education_degree'
  );

  // Test 2: Facebook Circle Parser
  const circleMock = `
circle0\t101\t102\t103
circle1\t102\t104
`.trim();
  const circles = FacebookCircleParser.parseCircles(circleMock);
  assert(circles.circleCount === 2, 'Expected 2 circles');
  assert(circles.circles.get('circle0')?.length === 3, 'circle0 must have 3 members');
  assert(circles.nodeMemberships.get('102')?.length === 2, 'Node 102 must belong to 2 circles');

  // Test 3: Reddit Parser
  const redditInput = {
    threadId: 't3_abc123',
    subreddit: 'science',
    title: 'Breakthrough Discovery',
    comments: [
      { id: 'c1', author: 'Researcher_A', createdUtc: 1600000000, body: 'Original finding.' },
      { id: 'c2', author: 'Critic_B', parentId: 'c1', parentAuthor: 'Researcher_A', createdUtc: 1600000100, body: 'Peer review reply.' },
      { id: 'c3', author: 'Researcher_A', parentId: 'c2', parentAuthor: 'Critic_B', createdUtc: 1600000200, body: 'Response rebuttal.' },
    ],
  };
  const redditResult = RedditParser.parseThread(redditInput);
  assert(redditResult.graph.nodes.size === 2, `Expected 2 Reddit authors, got ${redditResult.graph.nodes.size}`);
  assert(redditResult.graph.edges.size === 2, `Expected 2 directed edges, got ${redditResult.graph.edges.size}`);
  assert(redditResult.validationReport.passed, 'Reddit validation must pass');

  // Test 4: Discord Parser
  const discordInput = {
    serverId: 'guild_999',
    serverName: 'AI Research Discord',
    messages: [
      { id: 'm1', authorId: 'u1', timestamp: 1600000000, content: 'Hello team', channelId: 'ch1' },
      { id: 'm2', authorId: 'u2', replyToAuthorId: 'u1', timestamp: 1600000050, content: 'Hey!', channelId: 'ch1' },
      { id: 'm3', authorId: 'u3', mentions: ['u1', 'u2'], timestamp: 1600000100, content: 'Check this', channelId: 'ch1' },
      { id: 'm4', authorId: 'u1', timestamp: 1600000150, content: 'Great', channelId: 'ch1', reactions: [{ emoji: '🔥', userIds: ['u2', 'u3'] }] },
    ],
  };
  const discordResult = DiscordParser.parseServer(discordInput);
  assert(discordResult.graph.nodes.size === 3, `Expected 3 Discord users, got ${discordResult.graph.nodes.size}`);
  assert(discordResult.graph.edges.size >= 3, 'Expected multi-modal interaction edges');

  // Test 5: Slack Parser
  const slackInput = {
    workspaceName: 'AcmeCorp',
    channelId: 'C123',
    channelName: 'engineering',
    messages: [
      { ts: '1500000000.0001', user: 'U_LEAD', text: 'Sprint planning starting now.' },
      { ts: '1500000060.0002', user: 'U_DEV1', parent_user_id: 'U_LEAD', text: 'Joined the thread.' },
      { ts: '1500000120.0003', user: 'U_DEV2', text: 'Hey <@U_LEAD> can you review my PR?' },
    ],
  };
  const slackResult = SlackParser.parseChannel(slackInput);
  assert(slackResult.graph.nodes.size === 3, 'Expected 3 Slack colleagues');
  assert(slackResult.graph.edges.size === 2, 'Expected 2 communication edges');

  // Test 6: WikiTalk Parser
  const wikiTalkMock = `
# Directed graph: WikiTalk
# Nodes: 3 Edges: 2
1001\t1002
1002\t1003
1001\t1003
`.trim();
  const wikiResult = WikiTalkParser.parse(wikiTalkMock);
  assert(wikiResult.graph.nodes.size === 3, 'Expected 3 Wikipedia editors');
  assert(wikiResult.graph.edges.size === 3, 'Expected 3 talk page edit ties');

  console.log('✓ Multi-platform ingestion parsers validated.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('parsers.test.ts')) {
  testIngestionParsers();
}
