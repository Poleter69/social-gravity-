/**
 * Social Gravity - Narrative Evolution Engine (M11)
 * 
 * Tracks narrative lineage DAGs, semantic drift across community crossings,
 * claim mutation heuristics, contradiction tracking, and convergence events.
 */

import { Society } from '../society/types/society';
import { Agent } from '../society/types/agent';
import { 
  ClaimVariant, 
  NarrativeLineageTree, 
  NarrativeEvolutionSummary,
  MutationMechanism 
} from './types';

export class NarrativeEvolutionEngine {
  private tree: NarrativeLineageTree;
  private variantCounter: number;

  constructor() {
    this.tree = {
      rootVariantId: '',
      variants: new Map(),
      mutationEdges: [],
      contradictions: [],
      convergenceEvents: [],
      maxSemanticDrift: 0.0,
    };
    this.variantCounter = 0;
  }

  /**
   * Initializes the root claim variant (Variant 0 / Root)
   */
  public initializeRootClaim(
    topic: string,
    claimText: string,
    originNodeId: string,
    originCommunityId: string,
    fearSalience: number = 0.5,
    veracity: 'true' | 'false' | 'unverified' = 'false'
  ): ClaimVariant {
    const rootId = 'variant_A';
    const root: ClaimVariant = {
      id: rootId,
      parentId: null,
      topic,
      claimText,
      veracity,
      fearSalience,
      emotionalTone: fearSalience > 0.6 ? 'alarm' : 'neutral',
      emergedAtTick: 0,
      originCommunityId,
      originNodeId,
      mutationMechanism: null,
      semanticDriftFromRoot: 0.0,
      activeAdoptionCount: 1,
    };

    this.tree.rootVariantId = rootId;
    this.tree.variants.set(rootId, root);
    this.variantCounter = 1;
    return root;
  }

  /**
   * Calculates semantic drift distance between two claim variants
   * Based on text divergence, fear salience delta, and ideological amplification.
   */
  public calculateSemanticDrift(v1: ClaimVariant, v2: ClaimVariant): number {
    const fearDelta = Math.abs(v1.fearSalience - v2.fearSalience);
    const lengthDelta = Math.abs(v1.claimText.length - v2.claimText.length) / Math.max(v1.claimText.length, 1);
    const toneDelta = v1.emotionalTone === v2.emotionalTone ? 0.0 : 0.3;
    const combined = (fearDelta * 0.4) + (lengthDelta * 0.3) + (toneDelta * 0.3);
    return Math.min(1.0, Math.max(0.0, Number(combined.toFixed(3))));
  }

  /**
   * Evaluates if a transmission across an edge mutates the narrative.
   * Key trigger: crossing community boundaries, high peer conformity pressure, or low trust.
   */
  public evaluateTransmissionMutation(
    currentVariantId: string,
    sourceAgent: Agent,
    targetAgent: Agent,
    tick: number,
    society: Society
  ): ClaimVariant {
    const currentVariant = this.tree.variants.get(currentVariantId);
    if (!currentVariant) {
      throw new Error(`Variant ${currentVariantId} not found in lineage tree.`);
    }

    const isCrossCommunity = sourceAgent.communityId !== targetAgent.communityId;
    const targetSuspicion = 1.0 - targetAgent.traits.trust;
    const conformityPressure = targetAgent.traits.conformity;

    // Determine if a mutation event occurs
    let shouldMutate = false;
    let mechanism: MutationMechanism = 'NUANCE_TRUNCATION';
    let newClaimText = currentVariant.claimText;
    let newFearSalience = currentVariant.fearSalience;
    let newTone = currentVariant.emotionalTone;

    if (isCrossCommunity && targetSuspicion > 0.45) {
      // Cross-community polarization mutation
      shouldMutate = true;
      mechanism = 'COMMUNITY_CROSSING_POLARIZATION';
      const targetComm = society.communities.find(c => c.id === targetAgent.communityId)?.name || targetAgent.communityId;
      newClaimText = `[Escalated in ${targetComm}]: ${currentVariant.claimText} — confirmed malicious intent by rival actors.`;
      newFearSalience = Math.min(1.0, currentVariant.fearSalience + 0.22);
      newTone = 'alarm';
    } else if (targetAgent.isInfluencer && conformityPressure > 0.6) {
      // Scapegoat attribution mutation
      shouldMutate = true;
      mechanism = 'SCAPEGOAT_ATTRIBUTION';
      newClaimText = `${currentVariant.claimText} (Directly orchestrated by central leadership institutions).`;
      newFearSalience = Math.min(1.0, currentVariant.fearSalience + 0.15);
      newTone = 'anger';
    } else if (isCrossCommunity && currentVariant.fearSalience > 0.7) {
      // Nuance truncation mutation
      shouldMutate = true;
      mechanism = 'NUANCE_TRUNCATION';
      newClaimText = `URGENT ALERT: ${currentVariant.topic.toUpperCase()} COLLAPSE IMMINENT.`;
      newFearSalience = Math.min(1.0, currentVariant.fearSalience + 0.18);
      newTone = 'alarm';
    }

    if (!shouldMutate) {
      // No mutation; increment adoption count of existing variant
      currentVariant.activeAdoptionCount += 1;
      return currentVariant;
    }

    // Spawn new mutated variant
    const variantLetter = String.fromCharCode(65 + this.variantCounter); // Variant B, C, D, ...
    const newVariantId = `variant_${variantLetter}`;
    this.variantCounter += 1;

    const rootVariant = this.tree.variants.get(this.tree.rootVariantId) || currentVariant;
    const tempVariant: ClaimVariant = {
      id: newVariantId,
      parentId: currentVariant.id,
      topic: currentVariant.topic,
      claimText: newClaimText,
      veracity: currentVariant.veracity,
      fearSalience: Number(newFearSalience.toFixed(2)),
      emotionalTone: newTone,
      emergedAtTick: tick,
      originCommunityId: targetAgent.communityId,
      originNodeId: targetAgent.id,
      mutationMechanism: mechanism,
      semanticDriftFromRoot: 0,
      activeAdoptionCount: 1,
    };

    const driftFromRoot = this.calculateSemanticDrift(rootVariant, tempVariant);
    tempVariant.semanticDriftFromRoot = driftFromRoot;
    this.tree.maxSemanticDrift = Math.max(this.tree.maxSemanticDrift, driftFromRoot);

    this.tree.variants.set(newVariantId, tempVariant);

    // Record Mutation Edge in DAG
    const sourceComm = society.communities.find(c => c.id === sourceAgent.communityId)?.name || sourceAgent.communityId;
    const targetComm = society.communities.find(c => c.id === targetAgent.communityId)?.name || targetAgent.communityId;
    
    const explanation = `Claim ${newVariantId.replace('_', ' ').toUpperCase()} emerged from ${currentVariant.id.replace('_', ' ').toUpperCase()} after crossing ${isCrossCommunity ? `from ${sourceComm} to ${targetComm}` : `within ${targetComm}`} at Round ${tick}.`;

    this.tree.mutationEdges.push({
      sourceVariantId: currentVariant.id,
      targetVariantId: newVariantId,
      tick,
      triggerCommunityId: targetAgent.communityId,
      triggerNodeId: targetAgent.id,
      mechanism,
      explanation,
    });

    // Check for contradiction emergence with other active variants
    this.evaluateContradictions(tempVariant);

    return tempVariant;
  }

  /**
   * Tracks contradictory variants arising in separate communities
   */
  private evaluateContradictions(newVariant: ClaimVariant): void {
    for (const [id, existing] of this.tree.variants.entries()) {
      if (id === newVariant.id || existing.parentId === newVariant.id) continue;
      if (existing.originCommunityId !== newVariant.originCommunityId && Math.abs(existing.fearSalience - newVariant.fearSalience) > 0.25) {
        this.tree.contradictions.push({
          variantAId: existing.id,
          variantBId: newVariant.id,
          contradictionScore: Number((Math.abs(existing.fearSalience - newVariant.fearSalience)).toFixed(2)),
          antagonisticCommunities: [existing.originCommunityId, newVariant.originCommunityId],
          conflictNature: `Divergent framing: "${existing.claimText.slice(0, 30)}..." vs "${newVariant.claimText.slice(0, 30)}..."`,
        });
      }
    }
  }

  /**
   * Evaluates narrative convergence when two branches merge into a hybrid meta-narrative.
   */
  public registerConvergence(
    variantAId: string,
    variantBId: string,
    tick: number,
    synthesizedClaim: string,
    communityId: string,
    nodeId: string
  ): ClaimVariant {
    const vA = this.tree.variants.get(variantAId);
    const vB = this.tree.variants.get(variantBId);
    if (!vA || !vB) {
      throw new Error('Both contributing variants must exist for convergence.');
    }

    const newId = `variant_SYN_${this.variantCounter++}`;
    const syntheticVariant: ClaimVariant = {
      id: newId,
      parentId: variantAId, // Primary parent
      topic: `${vA.topic} & ${vB.topic} Unified`,
      claimText: synthesizedClaim,
      veracity: 'false',
      fearSalience: Math.min(1.0, (vA.fearSalience + vB.fearSalience) / 2 + 0.1),
      emotionalTone: 'alarm',
      emergedAtTick: tick,
      originCommunityId: communityId,
      originNodeId: nodeId,
      mutationMechanism: 'SYNTHESIS_CONVERGENCE',
      semanticDriftFromRoot: Math.min(1.0, (vA.semanticDriftFromRoot + vB.semanticDriftFromRoot) / 2 + 0.2),
      activeAdoptionCount: 2,
    };

    this.tree.variants.set(newId, syntheticVariant);
    this.tree.convergenceEvents.push({
      contributingVariantIds: [variantAId, variantBId],
      synthesizedVariantId: newId,
      convergenceTick: tick,
      synthesisRationale: `Meta-narrative convergence linking ${variantAId} and ${variantBId} within community ${communityId}.`,
    });

    return syntheticVariant;
  }

  /**
   * Generates a high-level summary of narrative evolution and lineage statements
   */
  public getSummary(): NarrativeEvolutionSummary {
    const lineageStatements = this.tree.mutationEdges.map(e => e.explanation);
    return {
      totalVariants: this.tree.variants.size,
      branchingDepth: this.tree.mutationEdges.length,
      peakDriftScore: this.tree.maxSemanticDrift,
      activeContradictionsCount: this.tree.contradictions.length,
      narrativeLineageStatements: lineageStatements,
    };
  }

  public getTree(): NarrativeLineageTree {
    return this.tree;
  }
}
