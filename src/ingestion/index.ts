/**
 * Social Gravity V2 - Universal Ingestion Subsystem
 *
 * Unified public entry point for real-world dataset ingestion, privacy anonymization,
 * validation, canonical graph transformation, and intelligence reporting.
 */

// Schemas & Types
export * from './schemas';

// Anonymization Engine
export { Anonymizer } from './anonymization/anonymizer';
export type { AnonymizerOptions } from './anonymization/anonymizer';

// Validators
export { DatasetValidator } from './validators/datasetValidator';

// Transformers & Canonical Builder
export { EdgeWeightEngine, DEFAULT_WEIGHTING_PROFILE, REDDIT_WEIGHTING_PROFILE, DISCORD_WEIGHTING_PROFILE, SLACK_WEIGHTING_PROFILE } from './transformers/edgeWeightEngine';
export { CommunityDetector } from './transformers/communityDetector';
export type { CommunityDetectionResult } from './transformers/communityDetector';
export { CanonicalGraphBuilder } from './transformers/canonicalGraphBuilder';
export type { GraphBuilderOptions } from './transformers/canonicalGraphBuilder';

// Dataset Parsers
export { FacebookEdgeParser } from './parsers/facebook/edgeParser';
export { FacebookCircleParser } from './parsers/facebook/circleParser';
export { FacebookFeatureParser } from './parsers/facebook/featureParser';
export type { FeatureTaxonomy, ParsedFeatureDefinition } from './parsers/facebook/featureParser';
export { FacebookEgoParser } from './parsers/facebook/facebookEgoParser';
export type { FacebookEgoFilesInput, FacebookEgoParseResult } from './parsers/facebook/facebookEgoParser';
export { MasterFacebookMerger } from './parsers/facebook/masterFacebookMerger';
export type { MasterMergeResult } from './parsers/facebook/masterFacebookMerger';

export { RedditParser } from './parsers/redditParser';
export type { RedditComment, RedditThreadInput } from './parsers/redditParser';

export { DiscordParser } from './parsers/discordParser';
export type { DiscordMessage, DiscordReaction, DiscordServerInput } from './parsers/discordParser';

export { SlackParser } from './parsers/slackParser';
export type { SlackMessage, SlackChannelInput } from './parsers/slackParser';

export { WikiTalkParser } from './parsers/wikiTalkParser';
export type { WikiTalkParseOptions } from './parsers/wikiTalkParser';

// File Loaders
export { FileDatasetLoader } from './loaders/fileLoader';

// Intelligence Reports
export { GraphIntelligenceReport } from './reports/graphIntelligenceReport';
export type { GraphIntelligenceData } from './reports/graphIntelligenceReport';
