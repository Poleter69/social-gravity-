/**
 * Social Gravity - Community & Archetype Definitions
 */

export type SocietyArchetype = 'school' | 'workplace' | 'city' | 'online_community';

export interface CommunityMetadata {
  description: string;
  category: string;
  density: number; // target internal edge density [0, 1]
  isolation: number; // reluctance to connect across community borders [0, 1]
}

export interface Community {
  id: string;
  name: string;
  archetype: SocietyArchetype;
  color: string;
  metadata: CommunityMetadata;
  agentIds: string[];
  metrics: {
    size: number;
    avgTrust: number;
    avgInfluence: number;
    avgConformity: number;
    avgRiskTolerance: number;
    internalDensity: number;
  };
}
