/**
 * Social Gravity V2 - Offline Test Fixtures for Reddit Intelligence Adapter
 *
 * Contains realistic, multi-level discussion trees, deleted accounts,
 * user mentions, orphan replies, and controversial discussions.
 */

import { RawRedditSubmission, RawRedditComment } from '../../../../src/ingestion/reddit/parsers/redditTypes';

export const MOCK_REDDIT_SUBMISSION: RawRedditSubmission = {
  id: 'sub_alpha_1',
  name: 't3_sub_alpha_1',
  author: 'TechAnalyst_01',
  title: 'Empirical Study on Decentralized Network Resilience & Cascade Contagion',
  selftext: 'We conducted an investigation into peer-to-peer rumor spread. Thoughts u/PeerVerifier?',
  subreddit: 'technology',
  score: 342,
  num_comments: 8,
  created_utc: 1700000000,
  url: 'https://reddit.com/r/technology/comments/sub_alpha_1',
  upvote_ratio: 0.94,
  over_18: false,
  stickied: false,
};

export const MOCK_REDDIT_COMMENTS: RawRedditComment[] = [
  // Top-level reply to submission (Level 1)
  {
    id: 'comm_01',
    name: 't1_comm_01',
    author: 'PeerVerifier',
    body: 'Great methodology! However, did you account for Granovetter weak-ties? /u/NetworkScientist',
    parent_id: 't3_sub_alpha_1',
    link_id: 't3_sub_alpha_1',
    subreddit: 'technology',
    score: 85,
    created_utc: 1700000600, // +10 min
    controversiality: 0,
  },
  // Reply to comm_01 (Level 2)
  {
    id: 'comm_02',
    name: 't1_comm_02',
    author: 'NetworkScientist',
    body: 'Weak ties serve as the primary conduits across distinct modular communities.',
    parent_id: 't1_comm_01',
    link_id: 't3_sub_alpha_1',
    subreddit: 'technology',
    score: 42,
    created_utc: 1700001800, // +30 min
    controversiality: 0,
  },
  // Reply to comm_02 (Level 3)
  {
    id: 'comm_03',
    name: 't1_comm_03',
    author: 'TechAnalyst_01',
    body: 'Exactly what our simulation observed. The bridge ratio hovered at ~2.5%.',
    parent_id: 't1_comm_02',
    link_id: 't3_sub_alpha_1',
    subreddit: 'technology',
    score: 29,
    created_utc: 1700003600, // +60 min
    controversiality: 0,
  },
  // Reply to comm_03 (Level 4)
  {
    id: 'comm_04',
    name: 't1_comm_04',
    author: 'CuriousStudent',
    body: 'Can someone explain what triadic closure means in this context?',
    parent_id: 't1_comm_03',
    link_id: 't3_sub_alpha_1',
    subreddit: 'technology',
    score: 11,
    created_utc: 1700007200, // +2 hours
    controversiality: 0,
  },
  // Another top-level comment (Level 1)
  {
    id: 'comm_05',
    name: 't1_comm_05',
    author: 'SkepticalObserver',
    body: 'This seems too simplistic. Real human trust is not purely Bayesian.',
    parent_id: 't3_sub_alpha_1',
    link_id: 't3_sub_alpha_1',
    subreddit: 'technology',
    score: -3,
    created_utc: 1700001200,
    controversiality: 1,
  },
  // Reply to comm_05 from deleted user
  {
    id: 'comm_06',
    name: 't1_comm_06',
    author: '[deleted]',
    body: '[removed by moderator]',
    parent_id: 't1_comm_05',
    link_id: 't3_sub_alpha_1',
    subreddit: 'technology',
    score: 0,
    created_utc: 1700002000,
    controversiality: 0,
  },
  // Reply to comm_05 from active user
  {
    id: 'comm_07',
    name: 't1_comm_07',
    author: 'PeerVerifier',
    body: 'Actually Kahneman prospect theory accounts for asymmetric risk valuation.',
    parent_id: 't1_comm_05',
    link_id: 't3_sub_alpha_1',
    subreddit: 'technology',
    score: 18,
    created_utc: 1700004000,
    controversiality: 0,
  },
  // Orphan comment: parent does not exist in comment list
  {
    id: 'comm_08_orphan',
    name: 't1_comm_08_orphan',
    author: 'WanderingScholar',
    body: 'Replying to an unrecorded comment that was purged from cache.',
    parent_id: 't1_non_existent_parent',
    link_id: 't3_sub_alpha_1',
    subreddit: 'technology',
    score: 4,
    created_utc: 1700005500,
    controversiality: 0,
  },
];

export const MOCK_MULTI_SUBREDDIT_SUBMISSION: RawRedditSubmission = {
  id: 'sub_beta_2',
  name: 't3_sub_beta_2',
  author: 'NetworkScientist',
  title: 'Cross-Disciplinary Discussion on Social Physics',
  selftext: 'Connecting computational science and behavioral sociology.',
  subreddit: 'science',
  score: 512,
  num_comments: 3,
  created_utc: 1700010000,
  upvote_ratio: 0.98,
};

export const MOCK_MULTI_SUBREDDIT_COMMENTS: RawRedditComment[] = [
  {
    id: 'comm_b1',
    name: 't1_comm_b1',
    author: 'TechAnalyst_01',
    body: 'Crossposted from r/technology!',
    parent_id: 't3_sub_beta_2',
    link_id: 't3_sub_beta_2',
    subreddit: 'science',
    score: 64,
    created_utc: 1700010500,
  },
  {
    id: 'comm_b2',
    name: 't1_comm_b2',
    author: 'ScienceMod',
    body: 'Welcome! Please adhere to empirical citations.',
    parent_id: 't3_sub_beta_2',
    link_id: 't3_sub_beta_2',
    subreddit: 'science',
    score: 22,
    created_utc: 1700011000,
  },
  {
    id: 'comm_b3',
    name: 't1_comm_b3',
    author: 'CuriousStudent',
    body: 'Excited to follow this series.',
    parent_id: 't1_comm_b1',
    link_id: 't3_sub_beta_2',
    subreddit: 'science',
    score: 9,
    created_utc: 1700012000,
  },
];
