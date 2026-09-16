/**
 * Social Gravity - Cross-Platform Narrative Matcher
 * Milestone M19 (Stage 10): Multi-signal matching across X, Reddit, Bluesky, RSS, YouTube
 */

import { EntityResolver } from './entityResolver';
import { LivePost } from '../live/types';

export interface MatchScoreResult {
  isMatch: boolean;
  confidence: number;
  signals: {
    entityOverlap: number;
    hashtagOverlap: number;
    urlMatch: boolean;
    temporalProximity: number;
    keywordSimilarity: number;
  };
}

export class CrossPlatformMatcher {
  /**
   * Evaluates match confidence between a live post and an active narrative track.
   */
  public static matchPostToNarrative(
    post: LivePost,
    narrativeKeywords: string[],
    narrativeEntities: string[],
    narrativeUrls: string[],
    narrativeLatestSeen: number
  ): MatchScoreResult {
    const postEntities = EntityResolver.resolve(post.content);

    // 1. URL match (Exact match on external citation is high signal)
    const urlMatch = postEntities.urls.some(u => narrativeUrls.includes(u));

    // 2. Hashtag overlap (Hashtags are strong cross-platform campaign anchors)
    const sharedHashtags = postEntities.hashtags.filter(h =>
      narrativeEntities.some(ne => ne.toLowerCase() === h.toLowerCase())
    );
    const hashtagOverlap = sharedHashtags.length > 0 ? 1.0 : 0;

    // 3. Named entity overlap
    const sharedEntities = postEntities.namedEntities.filter(e =>
      narrativeEntities.some(ne => ne.toLowerCase() === e.toLowerCase())
    );
    const entityOverlap = sharedEntities.length > 0 ? 1.0 : 0;

    // 4. Keyword cosine/jaccard overlap
    const postWords = post.content
      .toLowerCase()
      .replace(/[^\w\s#]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);

    let matchingWords = 0;
    for (const kw of narrativeKeywords) {
      if (postWords.includes(kw.toLowerCase())) matchingWords++;
    }
    const keywordSimilarity = narrativeKeywords.length > 0
      ? Math.min(1.0, matchingWords / Math.min(narrativeKeywords.length, 4))
      : 0;

    // 5. Temporal proximity (posts within 60 minutes have full score, decays after)
    const timeDeltaMs = Math.abs(post.timestamp - narrativeLatestSeen);
    const temporalProximity = Math.max(0, 1.0 - timeDeltaMs / (60 * 60 * 1000));

    // Composite multi-signal confidence
    let confidence = 0.0;
    if (urlMatch) confidence += 0.50;
    if (sharedHashtags.length > 0) confidence += 0.45;
    if (sharedEntities.length > 0) confidence += 0.35;
    confidence += keywordSimilarity * 0.30;
    confidence += temporalProximity * 0.10;

    confidence = Math.min(1.0, Number(confidence.toFixed(3)));

    const isMatch =
      urlMatch ||
      sharedHashtags.length > 0 ||
      (sharedEntities.length >= 1 && (keywordSimilarity >= 0.25 || temporalProximity >= 0.8)) ||
      confidence >= 0.35;

    return {
      isMatch,
      confidence,
      signals: {
        entityOverlap,
        hashtagOverlap,
        urlMatch,
        temporalProximity,
        keywordSimilarity,
      },
    };
  }
}
