/**
 * Social Gravity - Narrative Evolution Engine Types (M11)
 * Models claim mutation DAGs, semantic drift, contradiction tracking,
 * and convergence/divergence dynamics across multi-community networks.
 */

export type MutationMechanism = 
  | 'COMMUNITY_CROSSING_POLARIZATION'
  | 'FEAR_SALIENCE_AMPLIFICATION'
  | 'SCAPEGOAT_ATTRIBUTION'
  | 'NUANCE_TRUNCATION'
  | 'CONTRADICTORY_ECHO'
  | 'SYNTHESIS_CONVERGENCE';

export interface ClaimVariant {
  id: string;                      // e.g. 'variant_A', 'variant_B'
  parentId: string | null;         // Root has null
  topic: string;
  claimText: string;
  veracity: 'true' | 'false' | 'unverified';
  fearSalience: number;            // [0, 1]
  emotionalTone: string;           // 'alarm', 'anger', 'ridicule', 'neutral'
  emergedAtTick: number;
  originCommunityId: string;
  originNodeId: string;
  mutationMechanism: MutationMechanism | null;
  semanticDriftFromRoot: number;   // Distance [0, 1] from root variant
  activeAdoptionCount: number;
}

export interface MutationEdge {
  sourceVariantId: string;
  targetVariantId: string;
  tick: number;
  triggerCommunityId: string;
  triggerNodeId: string;
  mechanism: MutationMechanism;
  explanation: string;
}

export interface ContradictionPair {
  variantAId: string;
  variantBId: string;
  contradictionScore: number;     // [0, 1]
  antagonisticCommunities: [string, string];
  conflictNature: string;
}

export interface NarrativeConvergenceEvent {
  contributingVariantIds: string[];
  synthesizedVariantId: string;
  convergenceTick: number;
  synthesisRationale: string;
}

export interface NarrativeLineageTree {
  rootVariantId: string;
  variants: Map<string, ClaimVariant>;
  mutationEdges: MutationEdge[];
  contradictions: ContradictionPair[];
  convergenceEvents: NarrativeConvergenceEvent[];
  maxSemanticDrift: number;
}

export interface NarrativeEvolutionSummary {
  totalVariants: number;
  branchingDepth: number;
  peakDriftScore: number;
  activeContradictionsCount: number;
  narrativeLineageStatements: string[];
}
