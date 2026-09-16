/**
 * Social Gravity - Real-Time Sub-Second Processing Pipeline
 * Milestone M19 (Stages 2 & 3):
 * 1. Language Detection
 * 2. Deduplication
 * 3. GoEmotions Inference
 * 4. Narrative Clustering
 * 5. Trust & Risk Scoring
 * 6. Dynamic Graph Insertion
 * Target Latency: < 1.5s total (Sub-10ms in-memory execution)
 */

import { LivePost, LivePlatform } from './types';
import { DedupStore } from './dedup';
import { EmotionEngine } from '../nlp/emotionEngine';
import { EmotionProfile, GoEmotionLabel } from '../nlp/types';

export interface ProcessedLivePost {
  id: string;
  platform: LivePlatform;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: number;
  language: {
    code: string;
    confidence: number;
  };
  emotion: {
    dominant: GoEmotionLabel;
    confidence: number;
    profile: EmotionProfile;
  };
  clusterId: string;
  clusterTitle: string;
  trustScore: number; // 0 (untrusted) to 1.0 (verified/organic)
  riskScore: number; // 0 (benign) to 1.0 (high disinformation/panic risk)
  isBotSuspect: boolean;
  parentPostId?: string;
  processingLatencyMs: number;
}

export interface LiveClusterState {
  clusterId: string;
  title: string;
  keywords: string[];
  postCount: number;
  platforms: Set<LivePlatform>;
  dominantEmotion: GoEmotionLabel;
  firstSeen: number;
  lastSeen: number;
  velocity: number; // posts per minute
  affectedCommunities: Set<string>;
  bridgeCrossings: number;
}

export class LiveProcessingPipeline {
  private dedupStore: DedupStore;
  private emotionEngine: EmotionEngine;
  private clusters: Map<string, LiveClusterState> = new Map();
  private userPostingHistory: Map<string, number[]> = new Map(); // authorId -> timestamps
  private processedListeners: Array<(post: ProcessedLivePost) => void> = [];

  constructor(dedupWindowMs: number = 300_000) {
    this.dedupStore = new DedupStore(dedupWindowMs);
    this.emotionEngine = EmotionEngine.getInstance();
  }

  public onProcessed(listener: (post: ProcessedLivePost) => void): void {
    this.processedListeners.push(listener);
  }

  /**
   * Sub-second stream ingest processor.
   */
  public process(post: LivePost): ProcessedLivePost | null {
    const startTime = performance.now();

    // 1. Deduplication check
    if (this.dedupStore.has(post.id)) {
      return null;
    }
    this.dedupStore.add(post.id);

    // 2. Language Detection
    const language = this.detectLanguage(post.content);

    // 3. GoEmotions Inference
    const emotionProfile = this.emotionEngine.predictSync(post.content);
    const dominantEmotion = emotionProfile.dominantEmotion || emotionProfile.primaryEmotion || 'neutral';
    const vector = emotionProfile.emotionVector || {};
    const emotionConfidence = vector[dominantEmotion] ?? emotionProfile.confidence ?? 0.5;

    // 4. Narrative Clustering
    const { clusterId, clusterTitle } = this.assignCluster(post, dominantEmotion);

    // 5. Trust & Risk Scoring
    const { trustScore, riskScore, isBotSuspect } = this.scoreTrustAndRisk(post, emotionProfile);

    // 6. Assemble Processed Signal
    const latency = performance.now() - startTime;
    const processed: ProcessedLivePost = {
      id: post.id,
      platform: post.platform,
      authorId: post.authorId,
      authorName: post.authorName,
      content: post.content,
      timestamp: post.timestamp,
      language,
      emotion: {
        dominant: dominantEmotion,
        confidence: emotionConfidence,
        profile: emotionProfile,
      },
      clusterId,
      clusterTitle,
      trustScore,
      riskScore,
      isBotSuspect,
      parentPostId: post.parentId,
      processingLatencyMs: Number(latency.toFixed(2)),
    };

    // Notify subscribers
    this.processedListeners.forEach(listener => listener(processed));

    return processed;
  }

  /**
   * Fast, zero-dependency language detector using script detection and frequent stop-words.
   */
  public detectLanguage(text: string): { code: string; confidence: number } {
    if (!text || text.trim().length === 0) {
      return { code: 'en', confidence: 0.5 };
    }

    // Check script characteristics
    if (/[\u4e00-\u9fa5]/.test(text)) return { code: 'zh', confidence: 0.95 };
    if (/[\u3040-\u30ff]/.test(text)) return { code: 'ja', confidence: 0.95 };
    if (/[\uac00-\ud7af]/.test(text)) return { code: 'ko', confidence: 0.95 };
    if (/[\u0400-\u04ff]/.test(text)) return { code: 'ru', confidence: 0.90 };
    if (/[\u0600-\u06ff]/.test(text)) return { code: 'ar', confidence: 0.90 };

    const lower = text.toLowerCase();
    const words = lower.split(/\s+/);

    const esTokens = ['el', 'la', 'de', 'que', 'en', 'los', 'por', 'con', 'para'];
    const frTokens = ['le', 'la', 'les', 'des', 'est', 'que', 'une', 'dans', 'pour'];
    const deTokens = ['der', 'die', 'das', 'und', 'in', 'den', 'von', 'zu', 'mit'];

    let esScore = 0;
    let frScore = 0;
    let deScore = 0;

    for (const w of words) {
      if (esTokens.includes(w)) esScore++;
      if (frTokens.includes(w)) frScore++;
      if (deTokens.includes(w)) deScore++;
    }

    if (esScore > 2 && esScore > frScore && esScore > deScore) return { code: 'es', confidence: 0.85 };
    if (frScore > 2 && frScore > esScore && frScore > deScore) return { code: 'fr', confidence: 0.85 };
    if (deScore > 2 && deScore > esScore && deScore > frScore) return { code: 'de', confidence: 0.85 };

    // Default to English
    return { code: 'en', confidence: 0.92 };
  }

  /**
   * Online dynamic narrative clustering.
   * Matches semantic keywords/hashtags to existing clusters or initializes a new lineage track.
   */
  private assignCluster(post: LivePost, emotion: GoEmotionLabel): { clusterId: string; clusterTitle: string } {
    const text = post.content.toLowerCase();
    const words = text
      .replace(/[^\w\s#]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !['this', 'that', 'with', 'from', 'have', 'were'].includes(w));

    let bestCluster: LiveClusterState | null = null;
    let maxOverlap = 0;

    for (const cluster of this.clusters.values()) {
      let overlap = 0;
      for (const kw of cluster.keywords) {
        if (words.includes(kw)) overlap++;
      }
      if (overlap > maxOverlap && overlap >= 2) {
        maxOverlap = overlap;
        bestCluster = cluster;
      }
    }

    const now = Date.now();

    if (bestCluster) {
      bestCluster.postCount++;
      bestCluster.platforms.add(post.platform);
      bestCluster.lastSeen = now;
      bestCluster.dominantEmotion = emotion;

      // Extract community ID if available
      const community = (post.metadata?.communityId as string) || (post.subreddit ? `r/${post.subreddit}` : 'general');
      if (!bestCluster.affectedCommunities.has(community)) {
        bestCluster.affectedCommunities.add(community);
        bestCluster.bridgeCrossings++;
      }

      // Update velocity
      const durationMins = Math.max(0.5, (now - bestCluster.firstSeen) / 60_000);
      bestCluster.velocity = Number((bestCluster.postCount / durationMins).toFixed(1));

      return { clusterId: bestCluster.clusterId, clusterTitle: bestCluster.title };
    }

    // Form new cluster
    const topKeywords = words.slice(0, 4);
    const clusterId = `narrative-${now}-${Math.floor(Math.random() * 1000)}`;
    const title = topKeywords.length > 0
      ? topKeywords.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(' ')
      : `Emerging Discourse #${this.clusters.size + 1}`;

    const newCluster: LiveClusterState = {
      clusterId,
      title,
      keywords: topKeywords,
      postCount: 1,
      platforms: new Set([post.platform]),
      dominantEmotion: emotion,
      firstSeen: now,
      lastSeen: now,
      velocity: 1.0,
      affectedCommunities: new Set([post.subreddit ? `r/${post.subreddit}` : 'general']),
      bridgeCrossings: 0,
    };

    this.clusters.set(clusterId, newCluster);
    return { clusterId, clusterTitle: title };
  }

  /**
   * Trust and risk scoring.
   * Evaluates user posting frequency, bot heuristics, and emotion extremity.
   */
  private scoreTrustAndRisk(
    post: LivePost,
    emotion: EmotionProfile
  ): { trustScore: number; riskScore: number; isBotSuspect: boolean } {
    const now = Date.now();
    const history = this.userPostingHistory.get(post.authorId) || [];
    history.push(now);

    // Keep history of last 60 seconds
    const recent = history.filter(t => now - t <= 60_000);
    this.userPostingHistory.set(post.authorId, recent);

    let isBotSuspect = false;
    let trustScore = 0.85; // Baseline organic trust

    // 1. Bot heuristic: High burst frequency (> 6 posts/min)
    if (recent.length > 6) {
      isBotSuspect = true;
      trustScore -= 0.40;
    }

    // 2. Bot heuristic: Synthetic user ID pattern (e.g. name followed by 6+ digits)
    if (/\d{5,}/.test(post.authorId)) {
      trustScore -= 0.15;
    }

    // 3. URL spam density
    const urlMatches = post.content.match(/https?:\/\/[^\s]+/g);
    if (urlMatches && urlMatches.length >= 2) {
      trustScore -= 0.20;
    }

    trustScore = Math.max(0.1, Math.min(1.0, Number(trustScore.toFixed(2))));

    // Risk score: Driven by emotional arousal, fear/anger intensity, and low trust
    const vector = emotion.emotionVector || {};
    const intenseEmotions: GoEmotionLabel[] = ['fear', 'anger', 'nervousness', 'disgust'];
    const intenseScore = intenseEmotions.reduce((sum, e) => sum + (vector[e] || 0), 0);

    let riskScore = 0.20 + intenseScore * 0.50 + (1.0 - trustScore) * 0.30;
    if (isBotSuspect) riskScore += 0.25;

    riskScore = Math.max(0.05, Math.min(1.0, Number(riskScore.toFixed(2))));

    return { trustScore, riskScore, isBotSuspect };
  }

  public getClusters(): LiveClusterState[] {
    return Array.from(this.clusters.values());
  }

  public getCluster(clusterId: string): LiveClusterState | undefined {
    return this.clusters.get(clusterId);
  }
}
