/**
 * Social Gravity V2 - Ingestion CLI Tool
 *
 * Provides command-line workflows for inspecting, importing, reporting,
 * and merging real-world datasets into CanonicalGraphs.
 *
 * Usage:
 *   npx tsx src/ingestion/cli.ts inspect:facebook
 *   npx tsx src/ingestion/cli.ts import:facebook [egoId]
 *   npx tsx src/ingestion/cli.ts report:facebook [egoId]
 *   npx tsx src/ingestion/cli.ts merge:facebook
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileDatasetLoader } from './loaders/fileLoader';
import { GraphIntelligenceReport } from './reports/graphIntelligenceReport';
import { CanonicalGraphBuilder } from './transformers/canonicalGraphBuilder';

const DATABASES_DIR = path.resolve(process.cwd(), 'Databases');
const FB_DIR = path.join(DATABASES_DIR, 'facebook');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'inspect:facebook': {
      console.log('========================================================');
      console.log('  SOCIAL GRAVITY — SNAP FACEBOOK DATASET INSPECTION');
      console.log('========================================================\n');

      if (!fs.existsSync(FB_DIR)) {
        console.error(`Error: Directory not found: ${FB_DIR}`);
        process.exit(1);
      }

      const egoIds = FileDatasetLoader.discoverFacebookEgos(FB_DIR);
      console.log(`Found ${egoIds.length} Ego Networks in ${FB_DIR}:\n`);
      console.log('Ego ID | .edges Lines | .circles | .featnames | .feat (alter count)');
      console.log('-------|--------------|----------|------------|--------------------');

      for (const ego of egoIds) {
        const edgesFile = path.join(FB_DIR, `${ego}.edges`);
        const circlesFile = path.join(FB_DIR, `${ego}.circles`);
        const featnamesFile = path.join(FB_DIR, `${ego}.featnames`);
        const featFile = path.join(FB_DIR, `${ego}.feat`);

        const edgeLines = fs.existsSync(edgesFile) ? fs.readFileSync(edgesFile, 'utf8').split(/\r?\n/).filter(Boolean).length : 0;
        const circleLines = fs.existsSync(circlesFile) ? fs.readFileSync(circlesFile, 'utf8').split(/\r?\n/).filter(Boolean).length : 0;
        const featnameLines = fs.existsSync(featnamesFile) ? fs.readFileSync(featnamesFile, 'utf8').split(/\r?\n/).filter(Boolean).length : 0;
        const featLines = fs.existsSync(featFile) ? fs.readFileSync(featFile, 'utf8').split(/\r?\n/).filter(Boolean).length : 0;

        console.log(`${ego.padEnd(6)} | ${String(edgeLines).padEnd(12)} | ${String(circleLines).padEnd(8)} | ${String(featnameLines).padEnd(10)} | ${String(featLines).padEnd(18)}`);
      }
      break;
    }

    case 'import:facebook': {
      const egoId = args[1] || '0';
      console.log(`\nImporting SNAP Facebook Ego Network #${egoId}...`);
      const res = FileDatasetLoader.loadFacebookEgo(FB_DIR, egoId);
      console.log(`✓ Successfully imported Ego #${egoId}:`);
      console.log(`  - Total Canonical Nodes: ${res.graph.nodes.size}`);
      console.log(`  - Total Canonical Edges: ${res.graph.edges.size}`);
      console.log(`  - Newman Modularity Q:   ${res.graph.modularity}`);
      console.log(`  - Validated Records:     ${res.validationReport.validRecordsCount}`);
      console.log(`  - Feature Definitions:   ${res.taxonomy?.totalFeatures || 0}`);

      // Verify simulator conversion
      const dyn = CanonicalGraphBuilder.toDynamicGraph(res.graph);
      const soc = CanonicalGraphBuilder.toSociety(res.graph);
      console.log(`✓ Downstream Simulators Initialized:`);
      console.log(`  - V2 DynamicGraph: ${dyn.getAllNodes().length} nodes, ${dyn.getAllEdges().length} edges`);
      console.log(`  - V1 Society:      ${soc.agents.length} agents, ${soc.communities.length} communities`);
      break;
    }

    case 'report:facebook': {
      const egoId = args[1] || '0';
      console.log(`\nGenerating Intelligence Report for SNAP Facebook Ego #${egoId}...`);
      const res = FileDatasetLoader.loadFacebookEgo(FB_DIR, egoId);
      const reportData = GraphIntelligenceReport.generate(res.graph);
      const md = GraphIntelligenceReport.toMarkdown(reportData);
      console.log(md);
      break;
    }

    case 'merge:facebook': {
      console.log('========================================================');
      console.log('  SOCIAL GRAVITY — MERGING ALL 10 FACEBOOK EGO NETWORKS');
      console.log('========================================================\n');

      const result = FileDatasetLoader.loadAllFacebookEgos(FB_DIR);
      console.log(`✓ Merged ${result.egoResults.size} Ego Networks in ${result.durationMs}ms:`);
      console.log(`  - Global Unique Nodes:        ${result.masterGraph.nodes.size.toLocaleString()}`);
      console.log(`  - Global Unique Edges:        ${result.masterGraph.edges.size.toLocaleString()}`);
      console.log(`  - Global Modularity Q:        ${result.masterGraph.modularity}`);
      console.log(`  - Inter-Ego Bridge Nodes:     ${result.masterGraph.metadata.mergedEgoCount}`);

      const report = GraphIntelligenceReport.generate(result.masterGraph);
      console.log(`  - Global Clustering Coeff:    ${report.structural.clusteringCoefficient}`);
      console.log(`  - Largest Connected Component:${report.structural.largestComponentSize} nodes`);
      break;
    }

    default:
      console.log(`
Social Gravity Ingestion CLI
Usage:
  npx tsx src/ingestion/cli.ts inspect:facebook
  npx tsx src/ingestion/cli.ts import:facebook [egoId]
  npx tsx src/ingestion/cli.ts report:facebook [egoId]
  npx tsx src/ingestion/cli.ts merge:facebook
      `);
      break;
  }
}

main().catch(err => {
  console.error('CLI Error:', err);
  process.exit(1);
});
