/**
 * Social Gravity — M21: Real-Time Content Risk Classification Engine
 * Sub-millisecond classifier for the 5 Content Safety Pillars:
 * 1. Hate: Hostile targeting
 * 2. Explicit: Sexual content
 * 3. Terrorism: Extremist messaging
 * 4. Violence: Violent language
 * 5. Harassment: Abusive behavior
 *
 * Integrates into LiveProcessingPipeline, LiveManager, NetworkCanvas, and Replay.
 */

import {
  HATE_RULES,
  EXPLICIT_RULES,
  TERRORISM_RULES,
  VIOLENCE_RULES,
  HARASSMENT_RULES,
  PatternRule,
} from './contentCategories';
import {
  SafetyCategory,
  SafetyProfile,
  SafetyReportSummary,
  SafetyTimelineEvent,
} from './safetyTypes';

export class SafetyClassifier {
  private static instance: SafetyClassifier;

  public static getInstance(): SafetyClassifier {
    if (!SafetyClassifier.instance) {
      SafetyClassifier.instance = new SafetyClassifier();
    }
    return SafetyClassifier.instance;
  }

  /**
   * Classifies a text payload in sub-millisecond time (< 0.2ms).
   * Evaluates all 5 safety rule sets with calibrated multi-label profiling.
   */
  public classify(text: string, metadata?: Record<string, unknown>): SafetyProfile {
    if (!text || typeof text !== 'string') {
      return {
        labels: [],
        category: 'none',
        confidence: 0,
        categoryScores: {
          hate: 0,
          explicit: 0,
          terrorism: 0,
          violence: 0,
          harassment: 0,
          none: 1.0,
        },
        reasons: [],
      };
    }

    const clean = text.toLowerCase();
    const reasons: string[] = [];
    const flaggedKeywords: string[] = [];

    const evaluateRules = (rules: PatternRule[]) => {
      let score = 0;
      const catReasons: string[] = [];
      const catKeywords: string[] = [];

      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        const match = rule.pattern.exec(clean);
        if (match) {
          score += rule.weight;
          catReasons.push(rule.reason);
          catKeywords.push(match[0]);
        }
      }
      return { score, catReasons, catKeywords };
    };

    const hateResult = evaluateRules(HATE_RULES);
    const explicitResult = evaluateRules(EXPLICIT_RULES);
    const terrorResult = evaluateRules(TERRORISM_RULES);
    const violenceResult = evaluateRules(VIOLENCE_RULES);
    const harassmentResult = evaluateRules(HARASSMENT_RULES);

    // Metadata signals (e.g., subreddit tags, channel tags)
    if (metadata) {
      const sub = typeof metadata.subreddit === 'string' ? metadata.subreddit.toLowerCase() : '';
      if (sub.includes('nsfw') || sub.includes('porn') || sub.includes('gonewild')) {
        explicitResult.score += 0.5;
        explicitResult.catReasons.push('nsfw-designated community / channel');
      }
    }

    // Sigmoid/Linear calibrated confidence mapping [0, 1]
    const calculateConfidence = (score: number): number => {
      if (score <= 0) return 0;
      const conf = Math.min(0.99, Math.max(0.55, 0.45 + score * 0.5));
      return Number(conf.toFixed(2));
    };

    const categoryScores: Record<SafetyCategory, number> = {
      hate: calculateConfidence(hateResult.score),
      explicit: calculateConfidence(explicitResult.score),
      terrorism: calculateConfidence(terrorResult.score),
      violence: calculateConfidence(violenceResult.score),
      harassment: calculateConfidence(harassmentResult.score),
      none: 0,
    };

    const activeLabels: SafetyCategory[] = [];
    const threshold = 0.50;

    if (categoryScores.hate >= threshold) {
      activeLabels.push('hate');
      reasons.push(...hateResult.catReasons);
      flaggedKeywords.push(...hateResult.catKeywords);
    }
    if (categoryScores.explicit >= threshold) {
      activeLabels.push('explicit');
      reasons.push(...explicitResult.catReasons);
      flaggedKeywords.push(...explicitResult.catKeywords);
    }
    if (categoryScores.terrorism >= threshold) {
      activeLabels.push('terrorism');
      reasons.push(...terrorResult.catReasons);
      flaggedKeywords.push(...terrorResult.catKeywords);
    }
    if (categoryScores.violence >= threshold) {
      activeLabels.push('violence');
      reasons.push(...violenceResult.catReasons);
      flaggedKeywords.push(...violenceResult.catKeywords);
    }
    if (categoryScores.harassment >= threshold) {
      activeLabels.push('harassment');
      reasons.push(...harassmentResult.catReasons);
      flaggedKeywords.push(...harassmentResult.catKeywords);
    }

    // Determine dominant category
    const ranked = (['terrorism', 'violence', 'hate', 'explicit', 'harassment'] as const)
      .map((cat) => ({ cat, score: categoryScores[cat] }))
      .sort((a, b) => b.score - a.score);

    const dominant = ranked[0].score >= threshold ? ranked[0].cat : 'none';
    const dominantConfidence = dominant !== 'none' ? categoryScores[dominant] : 0;
    categoryScores.none = dominant === 'none' ? 1.0 : Number((1.0 - dominantConfidence).toFixed(2));

    let severity: 'low' | 'medium' | 'high' | 'critical' | undefined;
    if (dominant !== 'none') {
      if (dominant === 'terrorism' || dominantConfidence >= 0.85) {
        severity = 'critical';
      } else if (dominantConfidence >= 0.75) {
        severity = 'high';
      } else if (dominantConfidence >= 0.60) {
        severity = 'medium';
      } else {
        severity = 'low';
      }
    }

    return {
      labels: activeLabels,
      category: dominant,
      confidence: dominantConfidence,
      categoryScores,
      reasons: Array.from(new Set(reasons)),
      flaggedKeywords: Array.from(new Set(flaggedKeywords)),
      severity,
    };
  }

  /**
   * Batch processes array of texts for high throughput ingest.
   */
  public classifyBatch(texts: string[]): SafetyProfile[] {
    return texts.map((t) => this.classify(t));
  }

  /**
   * Aggregates safety classification results into structured summary reports.
   */
  public generateReportSummary(
    items: Array<{
      id?: string;
      safety?: SafetyProfile;
      timestamp?: number;
      authorName?: string;
      contentSnippet?: string;
      source?: string;
    }>
  ): SafetyReportSummary {
    let hateCount = 0;
    let explicitCount = 0;
    let terrorismCount = 0;
    let violenceCount = 0;
    let harassmentCount = 0;
    const timeline: SafetyTimelineEvent[] = [];

    const dist: SafetyReportSummary['confidenceDistribution'] = {
      hate: { high: 0, medium: 0, low: 0 },
      explicit: { high: 0, medium: 0, low: 0 },
      terrorism: { high: 0, medium: 0, low: 0 },
      violence: { high: 0, medium: 0, low: 0 },
      harassment: { high: 0, medium: 0, low: 0 },
    };

    items.forEach((item, idx) => {
      const s = item.safety;
      if (!s || s.category === 'none') return;

      const ts = item.timestamp || Date.now() - (items.length - idx) * 60_000;
      timeline.push({
        id: item.id || `evt-${idx}`,
        timestamp: ts,
        category: s.category,
        labels: s.labels || [s.category],
        confidence: s.confidence,
        reasons: s.reasons,
        source: item.source,
        authorName: item.authorName,
        contentSnippet: item.contentSnippet,
        severity: s.severity,
      });

      const updateCat = (cat: Exclude<SafetyCategory, 'none'>, countIncrement: () => void) => {
        const conf = s.categoryScores?.[cat] ?? (s.category === cat ? s.confidence : 0);
        if (conf >= 0.50) {
          countIncrement();
          if (conf >= 0.85) dist[cat].high++;
          else if (conf >= 0.70) dist[cat].medium++;
          else dist[cat].low++;
        }
      };

      updateCat('hate', () => hateCount++);
      updateCat('explicit', () => explicitCount++);
      updateCat('terrorism', () => terrorismCount++);
      updateCat('violence', () => violenceCount++);
      updateCat('harassment', () => harassmentCount++);
    });

    timeline.sort((a, b) => a.timestamp - b.timestamp);
    const firstDetectedAt = timeline.length > 0 ? timeline[0].timestamp : null;
    const peakActivityAt =
      timeline.length > 0 ? timeline[Math.floor(timeline.length / 2)].timestamp : null;

    return {
      hateCount,
      explicitCount,
      terrorismCount,
      violenceCount,
      harassmentCount,
      totalEvaluated: items.length,
      timeline,
      firstDetectedAt,
      peakActivityAt,
      confidenceDistribution: dist,
    };
  }
}

export const safetyClassifier = SafetyClassifier.getInstance();
