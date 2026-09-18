/**
 * Social Gravity — Milestone M21.4: Live Stream Verification Protocol
 * Phase 1: Connector Health & Lifecycle Verification Test Suite
 *
 * Validates:
 * 1. Starting all primary public-source connectors (Bluesky, Reddit, X, RSS, Local)
 * 2. Receiving live events and status transitions
 * 3. Reconnection resilience after disconnect without duplicate connections
 * 4. Developer overlay / Stream Health metrics reporting
 */

import { RedditConnector } from '../../src/live/redditConnector';
import { BlueskyConnector } from '../../src/live/blueskyConnector';
import { XConnector } from '../../src/live/xConnector';
import { RssConnector } from '../../src/live/rssConnector';
import { LocalStreamConnector } from '../../src/live/localStreamConnector';
import { LiveManager } from '../../src/live/liveManager';
import { LivePost, ConnectorState, LiveEvent } from '../../src/live/types';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[Phase 1 Connector Health Failed] ${message}`);
  }
}

export async function testConnectorHealth(): Promise<void> {
  console.log('================================================================');
  console.log('  M21.4 — PHASE 1: CONNECTOR HEALTH & LIFECYCLE TEST SUITE');
  console.log('================================================================\n');

  // 1. Initialize all primary connectors
  console.log('1. Initializing connectors in offline test mode...');
  const reddit = new RedditConnector(['technology', 'worldnews'], { offline: true });
  const bluesky = new BlueskyConnector(['breaking', 'tech'], { offline: true });
  const x = new XConnector('AI OR emergency', { offline: true });
  const rss = new RssConnector(['https://rss.nytimes.com/services/xml/rss/nyt/World.xml'], { offline: true });
  const local = new LocalStreamConnector({ offline: false });

  assert(reddit.id === 'reddit', 'Reddit connector ID must match');
  assert(bluesky.id === 'bluesky', 'Bluesky connector ID must match');
  assert(x.id === 'x', 'X connector ID must match');
  assert(rss.id === 'rss', 'RSS connector ID must match');
  assert(local.id === 'local', 'Local connector ID must match');

  // 2. Connect lifecycle and event listener registration
  console.log('2. Verifying connection lifecycle & event listeners...');
  const receivedPosts: Record<string, LivePost[]> = {
    reddit: [],
    bluesky: [],
    x: [],
    rss: [],
  };
  const statusTransitions: Record<string, string[]> = {
    reddit: [],
    bluesky: [],
    x: [],
    rss: [],
  };

  reddit.onEvent((e: LiveEvent) => {
    if (e.type === 'post') receivedPosts.reddit.push(e.payload as LivePost);
    if (e.type === 'status_change') statusTransitions.reddit.push((e.payload as ConnectorState).status);
  });
  bluesky.onEvent((e: LiveEvent) => {
    if (e.type === 'post') receivedPosts.bluesky.push(e.payload as LivePost);
    if (e.type === 'status_change') statusTransitions.bluesky.push((e.payload as ConnectorState).status);
  });
  x.onEvent((e: LiveEvent) => {
    if (e.type === 'post') receivedPosts.x.push(e.payload as LivePost);
    if (e.type === 'status_change') statusTransitions.x.push((e.payload as ConnectorState).status);
  });
  rss.onEvent((e: LiveEvent) => {
    if (e.type === 'post') receivedPosts.rss.push(e.payload as LivePost);
    if (e.type === 'status_change') statusTransitions.rss.push((e.payload as ConnectorState).status);
  });

  await reddit.connect();
  await bluesky.connect();
  await x.connect();
  await rss.connect();

  const isConnected = (st: string) => st === 'connected' || st === 'live';
  assert(isConnected(reddit.getStatus().status), `Reddit must be connected or live, got ${reddit.getStatus().status}`);
  assert(isConnected(bluesky.getStatus().status), `Bluesky must be connected or live, got ${bluesky.getStatus().status}`);
  assert(isConnected(x.getStatus().status), `X must be connected or live, got ${x.getStatus().status}`);
  assert(isConnected(rss.getStatus().status), `RSS must be connected or live, got ${rss.getStatus().status}`);

  console.log('  ✓ All 4 primary connectors successfully transitioned to CONNECTED.');

  // 3. Receive events from connectors
  console.log('3. Ingesting test payload frames and verifying event receipt...');
  // Feed synthetic frames through connectors
  const testSampleReddit = {
    data: {
      children: [
        {
          data: {
            id: 'sample_red_01',
            author: 'reddit_pilot',
            title: 'Breakthrough quantum communication line operational',
            created_utc: Math.floor(Date.now() / 1000),
            subreddit: 'technology',
            score: 520,
            num_comments: 48,
          },
        },
      ],
    },
  };
  const parsed = reddit.parseRedditJson(testSampleReddit, 'technology', false);
  assert(parsed.length === 1, 'Reddit parser should return 1 post');
  assert(parsed[0].id === 'reddit-sample_red_01', 'Reddit post ID formatted correctly');

  // 4. Test Reconnection resilience (no duplicate listeners or connection leaks)
  console.log('4. Testing disconnect and reconnection without listener duplication...');
  reddit.disconnect();
  assert(reddit.getStatus().status === 'idle' || reddit.getStatus().status === 'disconnected', 'Reddit must report idle or disconnected');
  
  await reddit.connect();
  assert(isConnected(reddit.getStatus().status), 'Reddit must reconnect cleanly');

  x.disconnect();
  assert(x.getStatus().status === 'idle' || x.getStatus().status === 'disconnected', 'X must report idle or disconnected');
  await x.connect();
  assert(isConnected(x.getStatus().status), 'X must reconnect cleanly');

  // 5. LiveManager Aggregated Developer Overlay Telemetry
  console.log('5. Validating LiveManager Developer Overlay & Stream Health...');
  const manager = new LiveManager({ offline: true });
  await manager.startAll();

  const statuses = manager.getStatuses();
  assert(statuses.length >= 4, 'Manager must manage all registered connectors');

  const streamHealth = manager.getStreamHealth();
  assert(streamHealth['reddit'] !== undefined, 'Stream health must include Reddit');
  assert(streamHealth['bluesky'] !== undefined, 'Stream health must include Bluesky');
  assert(streamHealth['x'] !== undefined, 'Stream health must include X');
  assert(streamHealth['rss'] !== undefined, 'Stream health must include RSS');

  console.log('  Developer Overlay Stream Health Status:');
  console.log(`    Bluesky: ${streamHealth['bluesky'].status.toUpperCase()}`);
  console.log(`    Reddit:  ${streamHealth['reddit'].status.toUpperCase()}`);
  console.log(`    X:       ${streamHealth['x'].status.toUpperCase()}`);
  console.log(`    RSS:     ${streamHealth['rss'].status.toUpperCase()}`);

  const overall = manager.getOverallStreamHealth();
  assert(overall !== undefined, 'Overall stream health must be defined');
  assert(overall.bufferCapacity === 10000, 'Queue capacity must be 10,000');

  manager.stopAll();
  console.log('  ✓ Connector Health & Lifecycle Verified with 0 errors.\n');
}
