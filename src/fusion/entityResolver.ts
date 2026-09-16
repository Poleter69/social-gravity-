/**
 * Social Gravity - Named Entity and Token Resolver
 * Milestone M19 (Stage 10): Extracts named entities, hashtags, cashtags, URLs, and mentions
 */

export interface ResolvedEntities {
  hashtags: string[];
  cashtags: string[];
  mentions: string[];
  urls: string[];
  namedEntities: string[];
}

export class EntityResolver {
  public static resolve(text: string): ResolvedEntities {
    if (!text) {
      return { hashtags: [], cashtags: [], mentions: [], urls: [], namedEntities: [] };
    }

    // Extract hashtags (#Topic)
    const hashtagMatches = text.match(/#[a-zA-Z0-9_]+/g) || [];
    const hashtags = Array.from(new Set(hashtagMatches.map(h => h.toLowerCase())));

    // Extract cashtags ($BTC, $TSLA)
    const cashtagMatches = text.match(/\$[a-zA-Z]{2,6}\b/g) || [];
    const cashtags = Array.from(new Set(cashtagMatches.map(c => c.toUpperCase())));

    // Extract mentions (@user)
    const mentionMatches = text.match(/@[a-zA-Z0-9_]+/g) || [];
    const mentions = Array.from(new Set(mentionMatches.map(m => m.toLowerCase())));

    // Extract URLs
    const urlMatches = text.match(/https?:\/\/[^\s]+/g) || [];
    const urls = Array.from(new Set(urlMatches));

    // Extract capitalized named entities (e.g. OpenAI, DeepMind, Federal Reserve, API)
    const namedEntityMatches = text.match(/\b[A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*\b/g) || [];
    // Filter out sentence starters or common words
    const commonWords = new Set(['The', 'This', 'That', 'There', 'When', 'What', 'Where', 'Why', 'How', 'It', 'In', 'On', 'At', 'For', 'See']);
    const namedEntities = Array.from(
      new Set(namedEntityMatches.filter(e => !commonWords.has(e) && e.length > 2))
    );

    return {
      hashtags,
      cashtags,
      mentions,
      urls,
      namedEntities,
    };
  }
}
