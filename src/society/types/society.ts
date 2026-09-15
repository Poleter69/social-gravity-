/**
 * Social Gravity - High-Level Society Entity & Generation Config
 */

import { Agent } from './agent';
import { Community, SocietyArchetype } from './community';
import { SocialEdge, NetworkMetrics } from './network';

export interface SocietyConfig {
  name: string;
  archetype: SocietyArchetype;
  populationSize: number;
  communityCount?: number;
  seed?: number;
  /** Influencer percentage target [0.01 - 0.20], default ~ 0.05 */
  influencerRatio?: number;
  /** Optional trait bias overrides [0, 1] */
  baselineTrust?: number;
  baselineConformity?: number;
  baselineInfluencePolarization?: number;
  baselineRiskTolerance?: number;
  /** Inter-community bridge probability [0, 1] */
  bridgeProbability?: number;
}

export interface SocietySummary {
  totalPopulation: number;
  communityCount: number;
  influencerCount: number;
  bridgeNodeCount: number;
  isolatedNodeCount: number;
  avgTrust: number;
  avgConformity: number;
  avgInfluence: number;
  avgRiskTolerance: number;
  density: number;
  averageDegree: number;
  globalClustering: number;
}

export interface Society {
  id: string;
  name: string;
  archetype: SocietyArchetype;
  createdAt: string;
  config: SocietyConfig;
  agents: Agent[];
  communities: Community[];
  edges: SocialEdge[];
  metrics: NetworkMetrics;
  summary: SocietySummary;
}
