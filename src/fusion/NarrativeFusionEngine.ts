/**
 * Social Gravity - Cross-Platform Narrative Fusion Engine
 * Milestone M19 (Stage 10): Correlates and fuses identical narratives across X, Bluesky, Reddit, RSS, YouTube, Instagram
 */

import { LivePost, LivePlatform } from '../live/types';
import { GoEmotionLabel } from '../nlp/types';
import { EntityResolver } from './entityResolver';
import { CrossPlatformMatcher } from './crossPlatformMatcher';
import { ViralityPredictor, ViralityForecast } from './viralityPredictor';

export interface ThreatScoreBreakdown {
  score: number; // 0 to 100
  tier: 'low' | 'moderate' | 'high' | 'critical';
  growthContribution: number;
  emotionContribution: number;
  crossCommunityContribution: number;
  velocityContribution: number;
  persistenceContribution: number;
  summary: string;
}

export interface UnifiedNarrative {
  id: string;
  title: string;
  sources: string[]; // e.g. post IDs
  firstSeen: number;
  latestSeen: number;
  confidence: number;
  platforms: LivePlatform[];
  postCount: number;
  keywords: string[];
  entities: string[];
  urls: string[];
  dominantEmotion: GoEmotionLabel;
  growthRate: number; // percentage (e.g. 240 for +240%)
  affectedCommunities: string[];
  bridgeCrossings: number;
  viralityForecast: ViralityForecast;
  threatScore: ThreatScoreBreakdown;
  recentPosts: LivePost[];
}

export class NarrativeFusionEngine {
  private narratives: Map<string, UnifiedNarrative> = new Map();
  private updateListeners: Array<(narrative: UnifiedNarrative) => void> = [];

  public onNarrativeUpdated(listener: (narrative: UnifiedNarrative) => void): void {
    this.updateListeners.push(listener);
  }

  /**
   * Ingests a new live post and fuses it into existing or newly formed unified narratives.
   */
  public ingestPost(post: LivePost, dominantEmotion: GoEmotionLabel = 'neutral'): UnifiedNarrative {
    const resolved = EntityResolver.resolve(post.content);
    const postWords = post.content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !['this', 'that', 'with', 'from', 'have', 'were'].includes(w));

    // Try matching to existing unified narratives
    let bestMatch: UnifiedNarrative | null = null;
    let highestConfidence = 0;

    for (const narrative of this.narratives.values()) {
      const matchResult = CrossPlatformMatcher.matchPostToNarrative(
        post,
        narrative.keywords,
        [...narrative.entities, ...narrative.keywords],
        narrative.urls,
        narrative.latestSeen
      );

      if (matchResult.isMatch && matchResult.confidence > highestConfidence) {
        highestConfidence = matchResult.confidence;
        bestMatch = narrative;
      }
    }

    const now = Date.now();

    if (bestMatch) {
      // Merge into existing narrative
      bestMatch.sources.push(post.id);
      bestMatch.postCount++;
      if (!bestMatch.platforms.includes(post.platform)) {
        bestMatch.platforms.push(post.platform);
      }
      bestMatch.latestSeen = now;
      bestMatch.dominantEmotion = dominantEmotion;

      // Merge entities and URLs
      resolved.hashtags.forEach(h => { if (!bestMatch!.entities.includes(h)) bestMatch!.entities.push(h); });
      resolved.namedEntities.forEach(e => { if (!bestMatch!.entities.includes(e)) bestMatch!.entities.push(e); });
      resolved.urls.forEach(u => { if (!bestMatch!.urls.includes(u)) bestMatch!.urls.push(u); });

      // Track community & bridges
      const community = post.subreddit ? `r/${post.subreddit}` : `${post.platform}-network`;
      if (!bestMatch.affectedCommunities.includes(community)) {
        bestMatch.affectedCommunities.push(community);
        bestMatch.bridgeCrossings++;
      }

      // Keep last 10 sample posts for evidence
      bestMatch.recentPosts.unshift(post);
      if (bestMatch.recentPosts.length > 10) bestMatch.recentPosts.pop();

      // Recalculate growth rate & velocity
      const elapsedMinutes = Math.max(0.5, (now - bestMatch.firstSeen) / 60_000);
      const velocity = Number((bestMatch.postCount / elapsedMinutes).toFixed(1));
      bestMatch.growthRate = Math.round((bestMatch.postCount / elapsedMinutes) * 60);

      // Re-run virality prediction
      bestMatch.viralityForecast = ViralityPredictor.forecast({
        commentVelocity: velocity,
        temporalAcceleration: 1.0 + Math.min(2.5, bestMatch.bridgeCrossings * 0.3),
        emotionalIntensity: ['fear', 'anger', 'nervousness', 'disgust'].includes(dominantEmotion) ? 0.85 : 0.40,
        bridgeNodeActivation: bestMatch.bridgeCrossings,
        communityExpansion: bestMatch.affectedCommunities.length,
        repostRatio: Math.min(1.0, bestMatch.platforms.length * 0.25),
      });

      // Recalculate Threat Score
      bestMatch.threatScore = this.calculateThreatScore(bestMatch);

      this.updateListeners.forEach(listener => listener(bestMatch!));
      return bestMatch;
    }

    // Initialize new unified narrative
    const id = `narrative-fused-${now}-${Math.floor(Math.random() * 1000)}`;
    const title = resolved.namedEntities[0] || resolved.hashtags[0] || (postWords.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Emerging Discourse');
    const community = post.subreddit ? `r/${post.subreddit}` : `${post.platform}-network`;

    const initialForecast = ViralityPredictor.forecast({
      commentVelocity: 1.0,
      temporalAcceleration: 1.0,
      emotionalIntensity: ['fear', 'anger'].includes(dominantEmotion) ? 0.80 : 0.35,
      bridgeNodeActivation: 1,
      communityExpansion: 1,
      repostRatio: 0.1,
    });

    const newNarrative: UnifiedNarrative = {
      id,
      title,
      sources: [post.id],
      firstSeen: now,
      latestSeen: now,
      confidence: 0.85,
      platforms: [post.platform],
      postCount: 1,
      keywords: postWords.slice(0, 5),
      entities: [...resolved.hashtags, ...resolved.namedEntities],
      urls: resolved.urls,
      dominantEmotion,
      growthRate: 10,
      affectedCommunities: [community],
      bridgeCrossings: 0,
      viralityForecast: initialForecast,
      threatScore: {
        score: 15,
        tier: 'low',
        growthContribution: 3,
        emotionContribution: 4,
        crossCommunityContribution: 2,
        velocityContribution: 3,
        persistenceContribution: 3,
        summary: 'Early narrative detection across single stream.',
      },
      recentPosts: [post],
    };

    newNarrative.threatScore = this.calculateThreatScore(newNarrative);
    this.narratives.set(id, newNarrative);

    this.updateListeners.forEach(listener => listener(newNarrative));
    return newNarrative;
  }

  /**
   * Stage 12: Emerging Threat Score (0–100)
   * Growth (25%), Emotion (20%), Cross-Community Spread (25%), Velocity (15%), Persistence (15%)
   */
  public calculateThreatScore(narrative: UnifiedNarrative): ThreatScoreBreakdown {
    // 1. Growth factor (0-25)
    const growthContribution = Math.min(25, Math.round((narrative.growthRate / 300.0) * 25));

    // 2. Emotional intensity (0-20)
    const intenseEmotion = ['fear', 'anger', 'nervousness', 'disgust'].includes(narrative.dominantEmotion);
    const emotionContribution = intenseEmotion ? 18 : 6;

    // 3. Cross-community spread (0-25)
    const crossCommunityContribution = Math.min(
      25,
      Math.round(narrative.affectedCommunities.length * 5 + narrative.bridgeCrossings * 4)
    );

    // 4. Velocity (0-15)
    const velocity = narrative.viralityForecast?.factors?.velocityScore ?? 0.2;
    const velocityContribution = Math.min(15, Math.round(velocity * 15));

    // 5. Persistence across platforms (0-15)
    const persistenceContribution = Math.min(15, narrative.platforms.length * 4 + (narrative.postCount > 5 ? 3 : 1));

    const totalScore = Math.min(100, Math.max(5,
      growthContribution + emotionContribution + crossCommunityContribution + velocityContribution + persistenceContribution
    ));

    let tier: ThreatScoreBreakdown['tier'] = 'low';
    if (totalScore >= 76) tier = 'critical';
    else if (totalScore >= 51) tier = 'high';
    else if (totalScore >= 26) tier = 'moderate';

    const summary = `${tier.toUpperCase()} risk: Driven by ${narrative.growthRate}% growth, ${narrative.platforms.length} connected platforms, and dominant emotion ${narrative.dominantEmotion}.`;

    return {
      score: totalScore,
      tier,
      growthContribution,
      emotionContribution,
      crossCommunityContribution,
      velocityContribution,
      persistenceContribution,
      summary,
    };
  }

  public getNarratives(): UnifiedNarrative[] {
    return Array.from(this.narratives.values()).sort((a, b) => b.threatScore.score - a.threatScore.score);
  }

  public getNarrative(id: string): UnifiedNarrative | undefined {
    return this.narratives.get(id);
  }
}
