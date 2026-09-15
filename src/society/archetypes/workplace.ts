/**
 * Social Gravity - Workplace Society Archetype
 * Represents formal enterprise organizations with hierarchical reporting lines,
 * departmental clusters, and cross-functional task forces.
 */

import { Community } from '../types/community';
import { Agent, AgentTraits } from '../types/agent';
import { PRNG } from '../math/random';
import { DistributionSampler } from '../math/distributions';
import { generateHierarchicalNetwork } from '../topologies/hierarchical';
import { ArchetypeResult } from './school';
import { createInitialPsychologicalState } from '../../psychology/defaults';

export function generateWorkplaceSociety(
  populationSize: number,
  rng: PRNG,
  sampler: DistributionSampler,
  traitOverrides?: Partial<AgentTraits>
): ArchetypeResult {
  const departments = [
    { id: 'dept-exec', name: 'Executive Suite', color: '#f59e0b', category: 'executive', share: 0.05 },
    { id: 'dept-eng', name: 'Engineering & Systems', color: '#00f0ff', category: 'engineering', share: 0.35 },
    { id: 'dept-prod', name: 'Product & Design', color: '#8b5cf6', category: 'product', share: 0.20 },
    { id: 'dept-sales', name: 'Sales & Growth', color: '#10b981', category: 'revenue', share: 0.25 },
    { id: 'dept-ops', name: 'People & Operations', color: '#f43f5e', category: 'operations', share: 0.15 },
  ];

  const communities: Community[] = departments.map((d) => ({
    id: d.id,
    name: d.name,
    archetype: 'workplace',
    color: d.color,
    metadata: {
      description: `Corporate business unit: ${d.name}`,
      category: d.category,
      density: 0.32,
      isolation: 0.65,
    },
    agentIds: [],
    metrics: {
      size: 0,
      avgTrust: 0,
      avgInfluence: 0,
      avgConformity: 0,
      avgRiskTolerance: 0,
      internalDensity: 0.32,
    },
  }));

  const agents: Agent[] = [];
  const nodeCommunityMap = new Map<string, string>();
  const firstNames = ['David', 'Sarah', 'Marcus', 'Elena', 'Robert', 'Jennifer', 'Arthur', 'Valerie', 'Daniel', 'Chloe', 'Nathan', 'Grace', 'Benjamin', 'Zoe', 'Julian', 'Claire'];
  const lastNames = ['Chen', 'Vance', 'Hastings', 'Kowalski', 'Sterling', 'Blackwood', 'Patel', 'O’Connor', 'Novak', 'Mercer', 'Garrison', 'Sinclair'];

  let assignedCount = 0;
  let agentIndex = 1;

  // 1. Instantiate Agents and assign to departments
  departments.forEach((dept, idx) => {
    const isLast = idx === departments.length - 1;
    const count = isLast ? populationSize - assignedCount : Math.max(2, Math.round(populationSize * dept.share));
    assignedCount += count;

    const comm = communities.find((c) => c.id === dept.id)!;

    for (let i = 0; i < count; i++) {
      const id = `agent-${String(agentIndex++).padStart(4, '0')}`;
      const name = `${rng.choice(firstNames)} ${rng.choice(lastNames)}`;
      nodeCommunityMap.set(id, dept.id);
      comm.agentIds.push(id);

      // Trait generation for corporate workplace
      const isExec = dept.id === 'dept-exec';
      const trust = traitOverrides?.trust !== undefined
        ? traitOverrides.trust
        : sampler.truncatedNormal(0.64, 0.14, 0.2, 0.95);

      const conformity = traitOverrides?.conformity !== undefined
        ? traitOverrides.conformity
        : sampler.truncatedNormal(0.55, 0.15, 0.15, 0.90);

      const influence = traitOverrides?.influence !== undefined
        ? traitOverrides.influence
        : isExec
          ? sampler.truncatedNormal(0.90, 0.08, 0.75, 1.0)
          : sampler.powerLaw(2.6, 0.08, 0.85);

      const riskTolerance = traitOverrides?.riskTolerance !== undefined
        ? traitOverrides.riskTolerance
        : sampler.truncatedNormal(0.36, 0.14, 0.05, 0.75); // Low risk tolerance (reputational stakes)

      agents.push({
        id,
        name,
        communityId: dept.id,
        role: isExec ? 'Executive' : 'Employee',
        traits: {
          trust: Number(trust.toFixed(3)),
          influence: Number(influence.toFixed(3)),
          conformity: Number(conformity.toFixed(3)),
          riskTolerance: Number(riskTolerance.toFixed(3)),
        },
        state: {
          beliefStatus: 'uninformed',
          emotionalState: 'neutral',
          exposureTick: null,
          shareCount: 0,
        },
        metrics: {
          degree: 0,
          inDegree: 0,
          outDegree: 0,
          localClustering: 0,
        },
        connections: [],
        isInfluencer: false,
        isBridge: false,
        isIsolated: false,
        peerTrustMap: {},
        psychology: createInitialPsychologicalState({
          trust: Number(trust.toFixed(3)),
          influence: Number(influence.toFixed(3)),
          conformity: Number(conformity.toFixed(3)),
          riskTolerance: Number(riskTolerance.toFixed(3)),
        }),
      });
    }
  });

  // 2. Generate Organizational Graph Topology (Managerial chains + peer channels)
  const nodeIds = agents.map((a) => a.id);
  const departmentIds = departments.map((d) => d.id);
  const { edges, roles } = generateHierarchicalNetwork({
    nodeIds,
    departmentIds,
    nodeCommunityMap,
    rng,
  });

  // Update roles from organizational hierarchy
  for (const agent of agents) {
    if (roles.has(agent.id)) {
      agent.role = roles.get(agent.id)!;
    }
  }

  return { communities, agents, edges };
}
