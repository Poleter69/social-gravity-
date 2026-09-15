/**
 * Social Gravity V2 - Local File Loader & Ego Network Discoverer
 *
 * Scans local filesystem directories, identifies multi-file ego network bundles
 * (.edges, .circles, .feat, .egofeat, .featnames), and coordinates ingestion.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Anonymizer } from '../anonymization/anonymizer';
import { FacebookEgoParser, FacebookEgoParseResult } from '../parsers/facebook/facebookEgoParser';
import { MasterFacebookMerger } from '../parsers/facebook/masterFacebookMerger';
import { CanonicalGraph } from '../schemas';

export class FileDatasetLoader {
  /**
   * Discovers all ego network IDs present within a directory.
   * Finds all `<egoId>.edges` files and returns sorted unique ego IDs.
   */
  public static discoverFacebookEgos(dirPath: string): string[] {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`[FileDatasetLoader] Directory does not exist: ${dirPath}`);
    }

    const files = fs.readdirSync(dirPath);
    const egoIds = new Set<string>();

    for (const f of files) {
      if (f.endsWith('.edges')) {
        const egoId = f.replace('.edges', '');
        egoIds.add(egoId);
      }
    }

    return Array.from(egoIds).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }

  /**
   * Loads a single ego network from the specified directory by ego ID.
   */
  public static loadFacebookEgo(
    dirPath: string,
    egoId: string,
    anonymizer?: Anonymizer
  ): FacebookEgoParseResult {
    const edgesPath = path.join(dirPath, `${egoId}.edges`);
    const circlesPath = path.join(dirPath, `${egoId}.circles`);
    const featnamesPath = path.join(dirPath, `${egoId}.featnames`);
    const featPath = path.join(dirPath, `${egoId}.feat`);
    const egofeatPath = path.join(dirPath, `${egoId}.egofeat`);

    if (!fs.existsSync(edgesPath)) {
      throw new Error(`[FileDatasetLoader] Required .edges file missing for ego ${egoId}: ${edgesPath}`);
    }

    const edgesText = fs.readFileSync(edgesPath, 'utf8');
    const circlesText = fs.existsSync(circlesPath) ? fs.readFileSync(circlesPath, 'utf8') : undefined;
    const featnamesText = fs.existsSync(featnamesPath) ? fs.readFileSync(featnamesPath, 'utf8') : undefined;
    const featText = fs.existsSync(featPath) ? fs.readFileSync(featPath, 'utf8') : undefined;
    const egofeatText = fs.existsSync(egofeatPath) ? fs.readFileSync(egofeatPath, 'utf8') : undefined;

    return FacebookEgoParser.parseEgoNetwork(
      {
        egoId,
        edgesText,
        circlesText,
        featnamesText,
        featText,
        egofeatText,
      },
      anonymizer
    );
  }

  /**
   * Discovers and loads all ego networks in a directory, returning both individual
   * CanonicalGraphs and the merged Master CanonicalGraph.
   */
  public static loadAllFacebookEgos(
    dirPath: string,
    anonymizer?: Anonymizer
  ): {
    egoResults: Map<string, FacebookEgoParseResult>;
    masterGraph: CanonicalGraph;
    durationMs: number;
  } {
    const startTime = performance.now();
    const sharedAnon = anonymizer || new Anonymizer({ prefix: 'fb_', labelPrefix: 'FB_User_' });
    const egoIds = this.discoverFacebookEgos(dirPath);

    const egoResults = new Map<string, FacebookEgoParseResult>();
    const egoGraphs: CanonicalGraph[] = [];

    for (const egoId of egoIds) {
      const res = this.loadFacebookEgo(dirPath, egoId, sharedAnon);
      egoResults.set(egoId, res);
      egoGraphs.push(res.graph);
    }

    const mergeResult = MasterFacebookMerger.merge(egoGraphs);
    const durationMs = Number((performance.now() - startTime).toFixed(2));

    return {
      egoResults,
      masterGraph: mergeResult.masterGraph,
      durationMs,
    };
  }
}
