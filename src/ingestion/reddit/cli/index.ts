/**
 * Social Gravity V2 - Reddit Intelligence CLI Toolkit
 *
 * Command-line interface for harvesting, reconstructing, analyzing,
 * replaying, and auditing empirical Reddit conversation networks.
 *
 * Usage:
 *   npx tsx src/ingestion/reddit/cli/index.ts collect --subreddit <name> [--limit <n>]
 *   npx tsx src/ingestion/reddit/cli/index.ts thread <threadId>
 *   npx tsx src/ingestion/reddit/cli/index.ts report <subreddit>
 *   npx tsx src/ingestion/reddit/cli/index.ts replay <subreddit> [--ticks <n>]
 *   npx tsx src/ingestion/reddit/cli/index.ts inspect
 */

import * as fs from 'fs';
import * as path from 'path';
import { RedditClient } from '../api/redditClient';
import { RedditDatasetCollector } from '../api/collector';
import { RedditRawParser } from '../parsers/rawParser';
import { ThreadReconstructor } from '../transformers/threadReconstructor';
import { RedditGraphBuilder } from '../transformers/graphBuilder';
import { InfluenceAnalytics } from '../analyzers/influenceAnalytics';
import { RedditCommunityDetector } from '../analyzers/communityDetector';
import { TemporalReplayEngine } from '../replay/temporalReplayEngine';
import { RedditReportGenerator } from '../reports/redditReportGenerator';
import { RedditAiAnalyst } from '../reports/aiAnalyst';
import { ReconstructedThread, ParsedRedditComment } from '../parsers/redditTypes';

function parseCliArgs(args: string[]): { command: string; positional: string[]; flags: Record<string, string> } {
  const command = args[0] || 'help';
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = 'true';
      }
    } else {
      positional.push(arg);
    }
  }

  return { command, positional, flags };
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const { command, positional, flags } = parseCliArgs(rawArgs);
  const collector = new RedditDatasetCollector();

  switch (command) {
    case 'inspect': {
      console.log('========================================================');
      console.log('  SOCIAL GRAVITY — REDDIT REPOSITORY INSPECTION');
      console.log('========================================================\n');

      console.log(`Base Directory:      ${collector.getRawDir().replace(/[\\/]raw$/, '')}`);
      console.log(`Raw Storage:         ${collector.getRawDir()}`);
      console.log(`Processed Storage:   ${collector.getProcessedDir()}`);
      console.log(`Reports Storage:     ${collector.getReportsDir()}`);
      console.log(`Cache Storage:       ${collector.getCacheDir()}\n`);

      const rawFiles = fs.existsSync(collector.getRawDir()) ? fs.readdirSync(collector.getRawDir()) : [];
      const cacheFiles = fs.existsSync(collector.getCacheDir()) ? fs.readdirSync(collector.getCacheDir()) : [];
      const reportFiles = fs.existsSync(collector.getReportsDir()) ? fs.readdirSync(collector.getReportsDir()) : [];

      console.log(`Stored Raw Datasets:      ${rawFiles.length} files`);
      for (const f of rawFiles.slice(0, 5)) {
        const stat = fs.statSync(path.join(collector.getRawDir(), f));
        console.log(`  - ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
      }
      if (rawFiles.length > 5) console.log(`  ... and ${rawFiles.length - 5} more`);

      console.log(`\nActive Subreddit Checkpoints: ${cacheFiles.length}`);
      for (const c of cacheFiles) {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(collector.getCacheDir(), c), 'utf8'));
          console.log(`  - r/${data.subreddit}: Last timestamp ${new Date(data.lastCreatedUtc * 1000).toISOString()} (${data.totalSubmissions} posts, ${data.totalComments} comments)`);
        } catch {
          // ignore corrupted cache files
        }
      }

      console.log(`\nGenerated Reports:        ${reportFiles.length} files`);
      break;
    }

    case 'collect': {
      const subreddit = flags.subreddit || positional[0] || 'technology';
      const limit = parseInt(flags.limit || '100', 10);
      const isThread = flags.thread || flags.id;

      console.log('========================================================');
      console.log(`  SOCIAL GRAVITY — REDDIT DATASET HARVESTER`);
      console.log('========================================================\n');

      if (isThread) {
        console.log(`Target: Thread [${isThread}] in r/${subreddit}...`);
        const res = await collector.collectThread(isThread, subreddit);
        console.log(`✓ Thread Harvest Complete in ${res.durationMs}ms:`);
        console.log(`  - Raw File:      ${res.rawFilePath}`);
        console.log(`  - Comments:      ${res.commentsCount}`);
      } else {
        console.log(`Target: Subreddit r/${subreddit} (Limit: ${limit})...`);
        const res = await collector.collectSubreddit(subreddit, { limit });
        console.log(`✓ Subreddit Harvest Complete in ${res.durationMs}ms:`);
        console.log(`  - Raw File:      ${res.rawFilePath}`);
        console.log(`  - Submissions:   ${res.submissionsCount}`);
        console.log(`  - Comments:      ${res.commentsCount}`);
      }
      break;
    }

    case 'thread': {
      const threadId = flags.id || positional[0];
      if (!threadId) {
        console.error('Error: Thread ID required. Example: npx tsx src/ingestion/reddit/cli/index.ts thread 12abcde');
        process.exit(1);
      }
      const subreddit = flags.subreddit || 'all';

      console.log(`\nIngesting & Reconstructing Reddit Thread #${threadId}...`);
      const client = new RedditClient();
      const { submission, comments } = await client.fetchThreadTree(threadId, subreddit);

      const parsedSub = RedditRawParser.parseSubmission(submission);
      const parsedComments = comments.map(c => RedditRawParser.parseComment(c));
      const thread = ThreadReconstructor.reconstruct(parsedSub, parsedComments);

      console.log(`✓ Thread Reconstructed:`);
      console.log(`  - Title:            "${thread.submission.title}"`);
      console.log(`  - Author:           ${thread.submission.author}`);
      console.log(`  - Total Comments:   ${thread.metrics.totalComments}`);
      console.log(`  - Max Depth:        ${thread.metrics.maxDepth}`);
      console.log(`  - Branching Factor: ${thread.metrics.branchingFactor}`);
      console.log(`  - Mean Response:    ${thread.metrics.averageResponseTimeSeconds}s`);
      console.log(`  - Participants:     ${thread.metrics.uniqueParticipants}`);

      // Verify simulator interop
      const graph = RedditGraphBuilder.buildReplyGraph([thread]);
      const dynamic = RedditGraphBuilder.toDynamicGraph(graph);
      console.log(`✓ Simulator Interop:`);
      console.log(`  - DynamicGraph Nodes: ${dynamic.getAllNodes().length}, Edges: ${dynamic.getAllEdges().length}`);
      break;
    }

    case 'report': {
      const subreddit = flags.subreddit || positional[0] || 'technology';
      console.log('========================================================');
      console.log(`  SOCIAL GRAVITY — REDDIT NETWORK INTELLIGENCE REPORT`);
      console.log('========================================================\n');

      // Check if raw files exist locally for this subreddit
      let rawData: { submissions: any[]; comments: any[] } | null = null;
      if (fs.existsSync(collector.getRawDir())) {
        const files = fs.readdirSync(collector.getRawDir()).filter(f => f.includes(subreddit));
        if (files.length > 0) {
          const latestFile = path.join(collector.getRawDir(), files[files.length - 1]);
          try {
            rawData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
            console.log(`Found local cached dataset: ${latestFile}`);
          } catch {
            // fall back
          }
        }
      }

      let threads: ReconstructedThread[] = [];

      if (rawData && rawData.submissions) {
        const { submissions, comments } = RedditRawParser.parseBatch([...rawData.submissions, ...(rawData.comments || [])]);
        const commMap = new Map<string, ParsedRedditComment[]>();
        for (const c of comments) {
          const list = commMap.get(c.linkId) || [];
          list.push(c);
          commMap.set(c.linkId, list);
        }

        for (const sub of submissions) {
          threads.push(ThreadReconstructor.reconstruct(sub, commMap.get(sub.id) || []));
        }
      } else {
        console.log(`No local cached file found for r/${subreddit}. Generating synthetic offline benchmark thread...`);
        // Synthesize benchmark thread for r/{subreddit}
        const now = Math.floor(Date.now() / 1000);
        const sub = RedditRawParser.parseSubmission({
          id: `benchmark_${subreddit}`,
          title: `State of r/${subreddit} Consensus & Information Cascades`,
          author: 'AlphaResearcher',
          subreddit,
          created_utc: now - 3600 * 12,
          score: 142,
          num_comments: 8,
        });
        const comments: ParsedRedditComment[] = [
          RedditRawParser.parseComment({ id: 'c1', parent_id: `t3_${sub.id}`, author: 'UserBeta', body: 'Fascinating findings u/AlphaResearcher!', score: 24, created_utc: now - 3600 * 10, subreddit }),
          RedditRawParser.parseComment({ id: 'c2', parent_id: 't1_c1', author: 'UserGamma', body: 'Do you have verification evidence?', score: 12, created_utc: now - 3600 * 8, subreddit }),
          RedditRawParser.parseComment({ id: 'c3', parent_id: 't1_c2', author: 'AlphaResearcher', body: 'Yes, full replication code is attached.', score: 35, created_utc: now - 3600 * 6, subreddit }),
          RedditRawParser.parseComment({ id: 'c4', parent_id: `t3_${sub.id}`, author: 'UserDelta', body: 'Alternative hypothesis worth examining.', score: 8, created_utc: now - 3600 * 9, subreddit }),
          RedditRawParser.parseComment({ id: 'c5', parent_id: 't1_c4', author: 'UserEpsilon', body: 'Agreed with u/UserDelta.', score: 5, created_utc: now - 3600 * 7, subreddit }),
          RedditRawParser.parseComment({ id: 'c6', parent_id: 't1_c5', author: 'UserBeta', body: 'Let us compare the empirical data.', score: 19, created_utc: now - 3600 * 5, subreddit }),
        ];
        threads.push(ThreadReconstructor.reconstruct(sub, comments));
      }

      const graph = RedditGraphBuilder.buildReplyGraph(threads);
      const influence = InfluenceAnalytics.analyzeGraph(graph);
      const communityProfiles = RedditCommunityDetector.profileCommunities(graph);
      const report = RedditReportGenerator.generate(threads, graph, influence, communityProfiles);

      const md = RedditReportGenerator.toMarkdown(report);
      console.log(md);

      // Save report to disk
      const reportFile = path.join(collector.getReportsDir(), `report_${subreddit}_${Date.now()}.md`);
      fs.writeFileSync(reportFile, md, 'utf8');
      console.log(`\n✓ Report saved to: ${reportFile}`);

      // Run AI Analyst
      const analyst = new RedditAiAnalyst();
      const briefing = await analyst.analyze(report);
      console.log(`\n========================================================`);
      console.log(`  LOCAL AI RESEARCH ANALYST BRIEFING (${briefing.aiModelUsed})`);
      console.log(`========================================================`);
      console.log(`\nExecutive Summary:\n${briefing.executiveSummary}\n`);
      for (const f of briefing.findings) {
        console.log(`[${f.category.toUpperCase()}] ${f.title} (Confidence: ${(f.confidence * 100).toFixed(0)}%)`);
        console.log(`  Evidence:     ${JSON.stringify(f.evidence)}`);
        console.log(`  Analysis:     ${f.analysis}`);
        console.log(`  Intervention: ${f.actionableIntervention}\n`);
      }
      break;
    }

    case 'replay': {
      const subreddit = flags.subreddit || positional[0] || 'technology';
      const tickLimit = parseInt(flags.ticks || '10', 10);
      const resolutionSeconds = parseInt(flags.resolution || '3600', 10);

      console.log('========================================================');
      console.log(`  SOCIAL GRAVITY — REDDIT TEMPORAL TIMELINE REPLAY`);
      console.log('========================================================\n');
      console.log(`Subreddit: r/${subreddit} | Ticks: ${tickLimit} | Resolution: ${resolutionSeconds}s/tick\n`);

      // Mock / benchmark interactions for instant replay visualization
      const now = Date.now();
      const demoComments: ParsedRedditComment[] = [];
      const sub = RedditRawParser.parseSubmission({
        id: 'rep_sub_1',
        title: 'Breaking Network Cascade Event',
        author: 'RootPoster',
        subreddit,
        created_utc: Math.floor((now - 3600 * 10 * 1000) / 1000),
      });

      for (let i = 1; i <= 15; i++) {
        demoComments.push(RedditRawParser.parseComment({
          id: `rep_c_${i}`,
          parent_id: i === 1 ? `t3_${sub.id}` : `t1_rep_c_${Math.max(1, i - 1)}`,
          author: `Agent_${i % 5}`,
          body: `Tick reply sequence ${i}`,
          created_utc: Math.floor((now - (15 - i) * 1800 * 1000) / 1000),
          subreddit,
        }));
      }

      const thread = ThreadReconstructor.reconstruct(sub, demoComments);
      const engine = TemporalReplayEngine.fromThreads([thread], {
        tickResolutionSeconds: resolutionSeconds,
      });

      console.log(`Total Timeline Ticks: ${engine.getTotalTicks()}`);
      console.log('Tick | New Nodes | New Edges | Active Nodes | Active Edges | Timeline Progress');
      console.log('-----|-----------|-----------|--------------|--------------|-------------------');

      for (let i = 0; i < tickLimit; i++) {
        const delta = engine.step();
        const progress = `${Math.round(((i + 1) / Math.max(1, engine.getTotalTicks())) * 100)}%`;
        console.log(
          `${String(delta.tick).padEnd(4)} | ` +
          `${String(delta.newNodes.length).padEnd(9)} | ` +
          `${String(delta.newEdges.length).padEnd(9)} | ` +
          `${String(delta.totalActiveNodes).padEnd(12)} | ` +
          `${String(delta.totalActiveEdges).padEnd(12)} | ` +
          `${progress}`
        );
        if (delta.isComplete) break;
      }

      const snapshot = engine.getSnapshot();
      console.log(`\n✓ Replay Paused at Tick ${engine.getCurrentTick()}.`);
      console.log(`  Historical Snapshot Reconstructed: ${snapshot.nodes.size} nodes, ${snapshot.edges.size} edges.`);
      break;
    }

    default:
      console.log(`
Social Gravity V2 - Reddit Intelligence CLI Toolkit

Usage:
  npx tsx src/ingestion/reddit/cli/index.ts inspect
  npx tsx src/ingestion/reddit/cli/index.ts collect --subreddit <name> [--limit <n>]
  npx tsx src/ingestion/reddit/cli/index.ts thread <threadId> [--subreddit <name>]
  npx tsx src/ingestion/reddit/cli/index.ts report <subreddit>
  npx tsx src/ingestion/reddit/cli/index.ts replay <subreddit> [--ticks <n>] [--resolution <sec>]
      `);
      break;
  }
}

main().catch(err => {
  console.error('CLI Fatal Error:', err);
  process.exit(1);
});
