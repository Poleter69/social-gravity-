/**
 * Social Gravity V2 - Reddit Emotional Readiness Layer
 *
 * Provides text sanitization, lexical sentiment scoring, and formal
 * scaffolding for GoEmotions 27-dimensional emotion vectors and neural embeddings.
 * Operates offline with zero external dependencies.
 */

import { EmotionalPayload } from '../parsers/redditTypes';

export class EmotionalLayer {
  public static readonly GO_EMOTIONS = [
    'admiration', 'amusement', 'anger', 'annoyance', 'approval', 'caring',
    'confusion', 'curiosity', 'desire', 'disappointment', 'disapproval',
    'disgust', 'embarrassment', 'excitement', 'fear', 'gratitude', 'grief',
    'joy', 'love', 'nervousness', 'optimism', 'pride', 'realization',
    'relief', 'remorse', 'sadness', 'surprise', 'neutral',
  ] as const;

  // Lightweight lexical sentiment dictionary for baseline offline analysis
  private static readonly POSITIVE_WORDS = new Set([
    'good', 'great', 'awesome', 'excellent', 'love', 'like', 'happy', 'best',
    'helpful', 'agree', 'congrats', 'thanks', 'thank', 'cool', 'nice', 'solid',
    'brilliant', 'wonderful', 'positive', 'perfect', 'glad', 'enjoy', 'superb',
    'impressive', 'correct', 'smart', 'clean', 'respect', 'appreciate',
  ]);

  private static readonly NEGATIVE_WORDS = new Set([
    'bad', 'terrible', 'awful', 'hate', 'horrible', 'worst', 'angry', 'mad',
    'annoying', 'disagree', 'fake', 'scam', 'wrong', 'stupid', 'idiot', 'fail',
    'poor', 'garbage', 'broken', 'waste', 'sad', 'fear', 'scary', 'danger',
    'toxic', 'harmful', 'offensive', 'disgusting', 'corrupt', 'lie', 'liar',
  ]);

  /**
   * Cleans raw Reddit markdown into normalized text for NLP analysis.
   */
  public static cleanText(rawText: string): string {
    if (!rawText) return '';
    return rawText
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '')
      // Remove Reddit markdown quotes (> quote)
      .replace(/^>.*$/gm, '')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`.*?`/g, '')
      // Remove markdown bold / italic / strikethrough
      .replace(/[*_~]{1,3}/g, '')
      // Remove Reddit table markdown
      .replace(/\|.*\|/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generates a baseline lexical sentiment payload.
   */
  public static analyzeSentiment(cleanedText: string): EmotionalPayload['sentiment'] {
    if (!cleanedText) {
      return { polarity: 0, subjectivity: 0, compound: 0 };
    }

    const tokens = cleanedText.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    if (tokens.length === 0) {
      return { polarity: 0, subjectivity: 0, compound: 0 };
    }

    let posCount = 0;
    let negCount = 0;

    for (const token of tokens) {
      if (this.POSITIVE_WORDS.has(token)) posCount++;
      if (this.NEGATIVE_WORDS.has(token)) negCount++;
    }

    const totalOpinionWords = posCount + negCount;
    const subjectivity = Math.min(1.0, totalOpinionWords / (tokens.length * 0.5));
    const rawDiff = posCount - negCount;
    const polarity = totalOpinionWords > 0 ? rawDiff / totalOpinionWords : 0;
    // Compound score normalized with standard alpha = 15 soft saturation
    const compound = rawDiff / Math.sqrt(rawDiff * rawDiff + 15);

    return {
      polarity: Number(polarity.toFixed(4)),
      subjectivity: Number(subjectivity.toFixed(4)),
      compound: Number(compound.toFixed(4)),
    };
  }

  /**
   * Creates an EmotionalPayload with text, baseline sentiment, and empty
   * GoEmotions placeholders ready for downstream neural or dataset ingestion.
   */
  public static processText(rawText: string): EmotionalPayload {
    const cleanedText = this.cleanText(rawText);
    const sentiment = this.analyzeSentiment(cleanedText);

    // Initialize GoEmotions placeholder vector
    const emotions: EmotionalPayload['emotions'] = {};
    for (const emo of this.GO_EMOTIONS) {
      emotions[emo] = 0;
    }

    // Heuristic baseline assignment based on sentiment
    if (sentiment.compound > 0.3) {
      emotions.approval = 0.5;
      emotions.optimism = 0.4;
    } else if (sentiment.compound < -0.3) {
      emotions.disapproval = 0.5;
      emotions.annoyance = 0.4;
    } else {
      emotions.neutral = 0.8;
    }

    return {
      cleanedText,
      sentiment,
      emotions,
      embeddings: [], // Ready for future transformer embedding vectors
    };
  }
}
