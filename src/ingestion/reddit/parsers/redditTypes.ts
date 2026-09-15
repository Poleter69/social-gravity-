/**
 * Social Gravity V2 - Reddit Intelligence Adapter: Data Types
 *
 * Formal contracts for raw Reddit entities, Pushshift payloads,
 * parsed comment trees, emotional metadata, and graph schemas.
 */

export interface RawRedditComment {
  id: string;
  name?: string; // e.g. "t1_abc123"
  author: string;
  body: string;
  parent_id?: string; // e.g. "t1_xyz" or "t3_root"
  link_id?: string; // e.g. "t3_root"
  subreddit: string;
  score?: number;
  created_utc: number; // Unix timestamp in seconds
  controversiality?: number;
  distinguished?: string | null;
  edited?: boolean | number;
  gilded?: number;
  depth?: number;
  permalink?: string;
  is_submitter?: boolean;
  replies?: RawRedditComment[] | { data?: { children?: Array<{ data: RawRedditComment }> } };
}

export interface RawRedditSubmission {
  id: string;
  name?: string; // e.g. "t3_abc123"
  author: string;
  title: string;
  selftext?: string;
  subreddit: string;
  score?: number;
  num_comments?: number;
  created_utc: number; // Unix timestamp in seconds
  url?: string;
  upvote_ratio?: number;
  over_18?: boolean;
  stickied?: boolean;
  permalink?: string;
  distinguished?: string | null;
  comments?: RawRedditComment[];
}

export interface EmotionalPayload {
  cleanedText: string;
  sentiment: {
    polarity: number; // [-1.0, 1.0] negative to positive
    subjectivity: number; // [0.0, 1.0] objective to subjective
    compound: number; // [-1.0, 1.0] normalized compound score
  };
  /**
   * 27 GoEmotions categorical dimensions placeholder [0, 1]
   */
  emotions: {
    admiration?: number;
    amusement?: number;
    anger?: number;
    annoyance?: number;
    approval?: number;
    caring?: number;
    confusion?: number;
    curiosity?: number;
    desire?: number;
    disappointment?: number;
    disapproval?: number;
    disgust?: number;
    embarrassment?: number;
    excitement?: number;
    fear?: number;
    gratitude?: number;
    grief?: number;
    joy?: number;
    love?: number;
    nervousness?: number;
    optimism?: number;
    pride?: number;
    realization?: number;
    relief?: number;
    remorse?: number;
    sadness?: number;
    surprise?: number;
    neutral?: number;
  };
  embeddings?: number[]; // Vector embeddings placeholder
}

export interface ParsedRedditComment {
  id: string;
  name: string; // prefixed with "t1_"
  author: string;
  body: string;
  parentId: string; // raw ID or prefixed
  parentType: 'submission' | 'comment';
  linkId: string; // submission id
  subreddit: string;
  score: number;
  createdUtc: number; // seconds
  timestampMs: number;
  controversiality: number;
  distinguished: string | null;
  edited: boolean;
  isSubmitter: boolean;
  mentions: string[]; // usernames mentioned in body
  emotionalData?: EmotionalPayload;
}

export interface ParsedRedditSubmission {
  id: string;
  name: string; // prefixed with "t3_"
  author: string;
  title: string;
  selftext: string;
  subreddit: string;
  score: number;
  numComments: number;
  createdUtc: number; // seconds
  timestampMs: number;
  url?: string;
  upvoteRatio: number;
  isNsfw: boolean;
  isStickied: boolean;
  mentions: string[];
  emotionalData?: EmotionalPayload;
}

export interface RedditThreadNode {
  comment: ParsedRedditComment;
  children: RedditThreadNode[];
  depth: number;
  parent?: RedditThreadNode;
}

export interface ReconstructedThread {
  submission: ParsedRedditSubmission;
  roots: RedditThreadNode[]; // top-level comments
  allComments: Map<string, ParsedRedditComment>;
  orphans: ParsedRedditComment[]; // comments whose parents were not found
  metrics: {
    totalComments: number;
    maxDepth: number;
    averageDepth: number;
    branchingFactor: number;
    averageResponseTimeSeconds: number;
    fastestResponseTimeSeconds: number;
    slowestResponseTimeSeconds: number;
    uniqueParticipants: number;
    durationSeconds: number;
  };
}

export interface PushshiftResponse<T> {
  data: T[];
  metadata?: {
    total_results?: number;
    after?: number;
    before?: number;
    size?: number;
  };
}
