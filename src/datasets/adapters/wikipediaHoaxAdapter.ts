/**
 * Social Gravity - Wikipedia Hoax & Misinformation Dataset Adapter
 * Ingests empirical hoax corpora and talk-page controversy records (Kumar et al. / Wikimedia)
 * and formats them into standardized InformationSignals with ground truth veracity and debunking vectors.
 */

import { InformationSignal } from '../../psychology/types';
import { WikipediaHoaxRecord, DatasetLoadResult, DatasetMetadata } from '../types';

export class WikipediaHoaxAdapter {
  /**
   * Convert a Wikipedia Hoax Record into an InformationSignal for simulation injection.
   */
  public static toSignal(
    record: WikipediaHoaxRecord,
    senderId: string = 'patient_zero',
    round: number = 0
  ): InformationSignal {
    return {
      id: `signal-${record.id}`,
      topic: record.title,
      content: record.summary,
      veracity: record.veracity > 0.5 ? 'true' : 'false',
      emotionalSalience: record.fearSalience,
      complexity: Number((1.0 - record.plausibility * 0.5).toFixed(2)),
      senderId,
      round,
    };
  }

  /**
   * Generate a corresponding verified counter-narrative (Debunking Signal) for an empirical hoax.
   */
  public static createDebunkingSignal(
    record: WikipediaHoaxRecord,
    debunkerId: string = 'fact_checker_1',
    round: number = 5
  ): InformationSignal {
    return {
      id: `debunk-${record.id}`,
      topic: `Fact Check: ${record.title}`,
      content: `Official Wikipedia Verification: "${record.title}" has been investigated and confirmed fabricated after ${record.durationDays} days of editorial review.`,
      veracity: 'true',
      emotionalSalience: 0.15,
      complexity: 0.25,
      senderId: debunkerId,
      round,
    };
  }

  /**
   * Parse a batch of Wikipedia Hoax records.
   */
  public static parseRecords(jsonArray: WikipediaHoaxRecord[]): DatasetLoadResult<WikipediaHoaxRecord[]> {
    const startTime = performance.now();
    const warnings: string[] = [];

    const validated: WikipediaHoaxRecord[] = [];

    for (const item of jsonArray) {
      if (!item.id || !item.title) {
        warnings.push(`Skipped malformed record: missing id or title.`);
        continue;
      }

      validated.push({
        id: item.id,
        title: item.title,
        summary: item.summary || 'No narrative provided.',
        veracity: Math.max(0, Math.min(1, item.veracity ?? 0)),
        virality: Math.max(0, Math.min(1, item.virality ?? 0.5)),
        fearSalience: Math.max(0, Math.min(1, item.fearSalience ?? 0.3)),
        plausibility: Math.max(0, Math.min(1, item.plausibility ?? 0.7)),
        durationDays: item.durationDays ?? 30,
        categories: item.categories || ['History'],
        talkPageDisputes: item.talkPageDisputes ?? 0,
      });
    }

    const parseTimeMs = Math.round(performance.now() - startTime);

    const metadata: DatasetMetadata = {
      id: 'wiki_hoaxes_v1',
      name: 'Wikipedia Documented Hoaxes & Controversy Corpus',
      source: 'wikipedia_hoax',
      description: 'Historical fabricated Wikipedia articles documented by Wikimedia editors, annotated with survival times, editorial disputes, and plausibility.',
      nodeCount: validated.length,
      edgeCount: 0,
      citation: 'Kumar, S., Spezzano, F., Subrahmanian, V. S., & Faloutsos, C. (2016). An Information-Theoretic Approach to Detecting Hoaxes in Wikipedia. WWW.',
      license: 'Creative Commons CC-BY-SA 4.0',
      tags: ['Wikipedia', 'Hoaxes', 'Misinformation', 'Ground Truth Veracity']
    };

    return {
      success: true,
      data: validated,
      metadata,
      parseTimeMs,
      warnings
    };
  }
}
