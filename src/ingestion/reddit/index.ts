/**
 * Social Gravity V2 - Reddit Intelligence Adapter Public API
 *
 * Exposes resilient ingestion, parsing, transformation, graph construction,
 * temporal replay, analytics, and reporting capabilities for Reddit data.
 */

// API Client & Collector
export { RedditClient } from './api/redditClient';
export type { RedditClientConfig, PushshiftQuery } from './api/redditClient';
export { RedditDatasetCollector } from './api/collector';
export type { CollectorConfig, CollectionResult, CheckpointMetadata } from './api/collector';

// Parsers & Types
export type * from './parsers/redditTypes';
export { RedditRawParser } from './parsers/rawParser';

// Privacy & Anonymization
export { RedditAnonymizer } from './anonymization/redditAnonymizer';
export type { RedditAnonymizerConfig, AnonymizedIdentity } from './anonymization/redditAnonymizer';

// Transformers
export { InteractionTransformer } from './transformers/interactionTransformer';
export type { InteractionTransformOptions } from './transformers/interactionTransformer';
export { ThreadReconstructor } from './transformers/threadReconstructor';
export { RedditGraphBuilder } from './transformers/graphBuilder';
export type { RedditGraphOptions } from './transformers/graphBuilder';

// Analyzers
export { InfluenceAnalytics } from './analyzers/influenceAnalytics';
export type {
  NodeInfluenceMetrics,
  ConversationAnalytics,
  InfluenceReport,
} from './analyzers/influenceAnalytics';
export { RedditCommunityDetector } from './analyzers/communityDetector';
export type { RedditCommunityProfile } from './analyzers/communityDetector';
export { EmotionalLayer } from './analyzers/emotionalLayer';

// Temporal Replay
export { TemporalReplayEngine } from './replay/temporalReplayEngine';
export type {
  TemporalReplayConfig,
  ReplayTickDelta,
} from './replay/temporalReplayEngine';

// Reports & Local AI Analyst
export { RedditReportGenerator } from './reports/redditReportGenerator';
export type { RedditIntelligenceReportData } from './reports/redditReportGenerator';
export { RedditAiAnalyst } from './reports/aiAnalyst';
export type { AnalystBriefing } from './reports/aiAnalyst';
