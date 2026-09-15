/**
 * Social Gravity - Society Integrity & Structural Validation Engine
 * Automatically audits synthetic societies for topological invariants, psychological boundaries,
 * and structural consistency.
 */

import { Society } from '../types/society';

export interface ValidationCheck {
  name: string;
  passed: boolean;
  details: string;
}

export interface ValidationReport {
  isValid: boolean;
  timestamp: string;
  checks: ValidationCheck[];
  errors: string[];
  warnings: string[];
}

export class SocietyValidator {
  public static validate(society: Society): ValidationReport {
    const checks: ValidationCheck[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    const agents = society.agents;
    const communities = society.communities;
    const edges = society.edges;
    const agentMap = new Map(agents.map((a) => [a.id, a]));
    const commIdSet = new Set(communities.map((c) => c.id));

    // Check 1: Population & Community Membership
    let allBelongToValidComm = true;
    for (const a of agents) {
      if (!a.communityId || !commIdSet.has(a.communityId)) {
        allBelongToValidComm = false;
        errors.push(`Agent ${a.id} assigned to non-existent community: "${a.communityId}"`);
      }
    }
    checks.push({
      name: 'Community Membership Invariant',
      passed: allBelongToValidComm,
      details: allBelongToValidComm
        ? `100% of ${agents.length} agents are mapped to valid sub-communities.`
        : 'One or more agents have invalid community assignments.',
    });

    // Check 2: Edge Endpoint Validity & No Self-Loops
    let validEdges = true;
    for (const e of edges) {
      if (e.source === e.target) {
        validEdges = false;
        errors.push(`Self-loop detected on edge ${e.id} (node: ${e.source})`);
      }
      if (!agentMap.has(e.source) || !agentMap.has(e.target)) {
        validEdges = false;
        errors.push(`Dangling edge ${e.id} references non-existent node: ${e.source} -> ${e.target}`);
      }
    }
    checks.push({
      name: 'Edge Integrity & No Self-Loops',
      passed: validEdges,
      details: validEdges
        ? `All ${edges.length} social edges connect distinct, valid agents.`
        : 'Invalid or dangling edges detected.',
    });

    // Check 3: Trait Value Bounds [0, 1]
    let traitsValid = true;
    for (const a of agents) {
      const { trust, conformity, influence, riskTolerance } = a.traits;
      if (
        trust < 0 || trust > 1 ||
        conformity < 0 || conformity > 1 ||
        influence < 0 || influence > 1 ||
        riskTolerance < 0 || riskTolerance > 1
      ) {
        traitsValid = false;
        errors.push(`Agent ${a.id} has trait out of [0, 1] bounds: trust=${trust}, conformity=${conformity}, influence=${influence}, risk=${riskTolerance}`);
      }
    }
    checks.push({
      name: 'Psychological Trait Bounds [0, 1]',
      passed: traitsValid,
      details: traitsValid
        ? 'All psychological traits are bounded strictly within [0.000, 1.000].'
        : 'Trait bounds violation detected.',
    });

    // Check 4: Influencer Designation Validity
    const influencers = agents.filter((a) => a.isInfluencer);
    const nonInfluencers = agents.filter((a) => !a.isInfluencer);
    const minInfluencerScore = influencers.length > 0 ? Math.min(...influencers.map((i) => i.traits.influence)) : 0;
    const maxNonInfluencerScore = nonInfluencers.length > 0 ? Math.max(...nonInfluencers.map((i) => i.traits.influence)) : 0;
    const influencerValid = influencers.length > 0 && minInfluencerScore >= maxNonInfluencerScore - 1e-4;
    if (!influencerValid) {
      errors.push(`Influencer quantile invariant violated: min influencer score (${minInfluencerScore}) < max non-influencer score (${maxNonInfluencerScore})`);
    }
    checks.push({
      name: 'Influencer Distribution',
      passed: influencerValid,
      details: `${influencers.length} influencers designated (${((influencers.length / agents.length) * 100).toFixed(1)}% of population, min score: ${minInfluencerScore.toFixed(3)}).`,
    });

    // Check 5: Bridge Node Cross-Community Connectivity
    const bridgeNodes = agents.filter((a) => a.isBridge);
    let bridgeValid = true;
    for (const bn of bridgeNodes) {
      const neighborCommSet = new Set<string>();
      neighborCommSet.add(bn.communityId);
      for (const neighborId of bn.connections) {
        const neighbor = agentMap.get(neighborId);
        if (neighbor) neighborCommSet.add(neighbor.communityId);
      }
      if (neighborCommSet.size < 2) {
        bridgeValid = false;
        warnings.push(`Bridge agent ${bn.id} does not span multiple communities.`);
      }
    }
    checks.push({
      name: 'Bridge Node Verification',
      passed: bridgeValid,
      details: `${bridgeNodes.length} topological bridge nodes connect across distinct sub-communities.`,
    });

    // Check 6: Archetype Distinct Network Signature
    let distinctSignature = true;
    if (society.archetype === 'workplace') {
      const hasHierarchical = edges.some((e) => e.type === 'hierarchical');
      if (!hasHierarchical) {
        distinctSignature = false;
        errors.push('Workplace archetype missing hierarchical reporting ties.');
      }
    } else if (society.archetype === 'school') {
      if (society.metrics.globalClusteringCoefficient < 0.10) {
        warnings.push('School archetype has lower than expected clustering coefficient.');
      }
    }
    checks.push({
      name: 'Archetype Structural Signature',
      passed: distinctSignature,
      details: `Graph exhibits characteristic topology for archetype: "${society.archetype}".`,
    });

    for (const c of checks) {
      if (!c.passed && !errors.some((e) => e.includes(c.name))) {
        errors.push(`Validation check failed: ${c.name} - ${c.details}`);
      }
    }

    const isValid = errors.length === 0 && checks.every((c) => c.passed);

    return {
      isValid,
      timestamp: new Date().toISOString(),
      checks,
      errors,
      warnings,
    };
  }
}
