/**
 * Social Gravity V2 - Reddit Raw Data Parser
 *
 * Ingests and normalizes raw Reddit and Pushshift JSON payloads into typed,
 * sanitized data structures. Extracts user mentions, cleans markdown and HTML entities,
 * and maintains full metadata fidelity for downstream graph reconstruction.
 */

import {
  RawRedditComment,
  RawRedditSubmission,
  ParsedRedditComment,
  ParsedRedditSubmission,
} from './redditTypes';

export class RedditRawParser {
  private static readonly MENTION_REGEX = /(?:^|[\s(])\/?u\/([A-Za-z0-9_-]+)/g;

  /**
   * Decodes common HTML entities found in Reddit text dumps.
   */
  public static decodeHtmlEntities(text: string): string {
    if (!text) return '';
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }

  /**
   * Extracts user mentions (e.g. u/exampleUser or /u/exampleUser) from text.
   */
  public static extractMentions(text: string): string[] {
    if (!text) return [];
    const mentions = new Set<string>();
    let match: RegExpExecArray | null;
    const regex = new RegExp(this.MENTION_REGEX);
    while ((match = regex.exec(text)) !== null) {
      if (match[1] && match[1].toLowerCase() !== 'deleted' && match[1].toLowerCase() !== 'automoderator') {
        mentions.add(match[1]);
      }
    }
    return Array.from(mentions);
  }

  /**
   * Cleans parent ID strings, extracting prefix and raw ID.
   */
  public static normalizeParentId(parentId: string | undefined): { id: string; type: 'submission' | 'comment' } {
    if (!parentId) {
      return { id: '', type: 'submission' };
    }
    const clean = parentId.trim();
    if (clean.startsWith('t1_')) {
      return { id: clean.substring(3), type: 'comment' };
    }
    if (clean.startsWith('t3_')) {
      return { id: clean.substring(3), type: 'submission' };
    }
    // Default assumption if unprefixed
    return { id: clean, type: 'comment' };
  }

  /**
   * Parses a single comment object.
   */
  public static parseComment(raw: RawRedditComment): ParsedRedditComment {
    const rawId = raw.id.replace(/^t1_/, '');
    const parent = this.normalizeParentId(raw.parent_id);
    const linkId = raw.link_id ? raw.link_id.replace(/^t3_/, '') : '';
    const body = this.decodeHtmlEntities(raw.body || '');
    const createdUtc = Number(raw.created_utc) || Math.floor(Date.now() / 1000);

    return {
      id: rawId,
      name: raw.name || `t1_${rawId}`,
      author: (raw.author || '[deleted]').trim(),
      body,
      parentId: parent.id,
      parentType: parent.type,
      linkId,
      subreddit: (raw.subreddit || '').trim().toLowerCase(),
      score: typeof raw.score === 'number' ? raw.score : 0,
      createdUtc,
      timestampMs: createdUtc * 1000,
      controversiality: typeof raw.controversiality === 'number' ? raw.controversiality : 0,
      distinguished: raw.distinguished || null,
      edited: Boolean(raw.edited),
      isSubmitter: Boolean(raw.is_submitter),
      mentions: this.extractMentions(body),
    };
  }

  /**
   * Parses a single submission object.
   */
  public static parseSubmission(raw: RawRedditSubmission): ParsedRedditSubmission {
    const rawId = raw.id.replace(/^t3_/, '');
    const title = this.decodeHtmlEntities(raw.title || '');
    const selftext = this.decodeHtmlEntities(raw.selftext || '');
    const createdUtc = Number(raw.created_utc) || Math.floor(Date.now() / 1000);
    const fullText = `${title}\n${selftext}`;

    return {
      id: rawId,
      name: raw.name || `t3_${rawId}`,
      author: (raw.author || '[deleted]').trim(),
      title,
      selftext,
      subreddit: (raw.subreddit || '').trim().toLowerCase(),
      score: typeof raw.score === 'number' ? raw.score : 0,
      numComments: typeof raw.num_comments === 'number' ? raw.num_comments : 0,
      createdUtc,
      timestampMs: createdUtc * 1000,
      url: raw.url,
      upvoteRatio: typeof raw.upvote_ratio === 'number' ? raw.upvote_ratio : 1.0,
      isNsfw: Boolean(raw.over_18),
      isStickied: Boolean(raw.stickied),
      mentions: this.extractMentions(fullText),
    };
  }

  /**
   * Parses an array or stream of raw items, automatically separating submissions and comments.
   */
  public static parseBatch(items: Array<RawRedditComment | RawRedditSubmission | any>): {
    submissions: ParsedRedditSubmission[];
    comments: ParsedRedditComment[];
    malformedCount: number;
  } {
    const submissions: ParsedRedditSubmission[] = [];
    const comments: ParsedRedditComment[] = [];
    let malformedCount = 0;

    for (const item of items) {
      if (!item || typeof item !== 'object') {
        malformedCount++;
        continue;
      }

      try {
        // Distinguish submission vs comment
        if ('title' in item || (item.name && item.name.startsWith('t3_'))) {
          submissions.push(this.parseSubmission(item as RawRedditSubmission));
        } else if ('body' in item || (item.name && item.name.startsWith('t1_')) || 'parent_id' in item) {
          comments.push(this.parseComment(item as RawRedditComment));
        } else {
          malformedCount++;
        }
      } catch {
        malformedCount++;
      }
    }

    return { submissions, comments, malformedCount };
  }

  /**
   * Parses JSON string (either array or line-delimited JSONL).
   */
  public static parseJsonString(content: string): {
    submissions: ParsedRedditSubmission[];
    comments: ParsedRedditComment[];
    malformedCount: number;
  } {
    const trimmed = content.trim();
    if (!trimmed) {
      return { submissions: [], comments: [], malformedCount: 0 };
    }

    // Try standard JSON parse first
    if (trimmed.startsWith('[') || (trimmed.startsWith('{') && !trimmed.includes('\n{'))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return this.parseBatch(parsed);
        } else if (parsed && typeof parsed === 'object') {
          // Pushshift wrapper check: { data: [...] }
          if (Array.isArray(parsed.data)) {
            return this.parseBatch(parsed.data);
          }
          // Reddit API wrapper check: [{ data: { children: [...] } }]
          return this.parseBatch([parsed]);
        }
      } catch {
        // Fall back to line-by-line parsing
      }
    }

    // Parse as newline-delimited JSON (JSONL)
    const lines = trimmed.split(/\r?\n/);
    const validObjects: any[] = [];
    let malformedCount = 0;

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;
      try {
        const obj = JSON.parse(cleanLine);
        validObjects.push(obj);
      } catch {
        malformedCount++;
      }
    }

    const res = this.parseBatch(validObjects);
    return {
      submissions: res.submissions,
      comments: res.comments,
      malformedCount: res.malformedCount + malformedCount,
    };
  }
}
