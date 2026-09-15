/**
 * Social Gravity - School Society Archetype
 * Characterized by high peer-group clustering, elevated conformity (peer pressure),
 * and homeroom/grade cohort boundaries.
 */

import { Community } from '../types/community';
import { Agent, AgentTraits } from '../types/agent';
import { SocialEdge } from '../types/network';
import { PRNG } from '../math/random';
import { DistributionSampler } from '../math/distributions';
import { generateClusteredTopology } from '../topologies/clustered';
import { createInitialPsychologicalState } from '../../psychology/defaults';

export interface ArchetypeResult {
  communities: Community[];
  agents: Agent[];
  edges: SocialEdge[];
}

export function generateSchoolSociety(
  populationSize: number,
  rng: PRNG,
  sampler: DistributionSampler,
  traitOverrides?: Partial<AgentTraits>
): ArchetypeResult {
  const communityTemplates = [
    { id: 'comm-grade-9', name: 'Freshmen (Grade 9)', color: '#38bdf8', category: 'cohort', density: 0.28 },
    { id: 'comm-grade-10', name: 'Sophomores (Grade 10)', color: '#34d399', category: 'cohort', density: 0.26 },
    { id: 'comm-grade-11', name: 'Juniors (Grade 11)', color: '#fbbf24', category: 'cohort', density: 0.25 },
    { id: 'comm-grade-12', name: 'Seniors (Grade 12)', color: '#f87171', category: 'cohort', density: 0.24 },
    { id: 'comm-faculty', name: 'Faculty & Administration', color: '#a78bfa', category: 'staff', density: 0.35 },
  ];

  // Faculty is roughly 8% of school, rest distributed across grades
  const facultyCount = Math.max(3, Math.round(populationSize * 0.08));
  const studentCount = populationSize - facultyCount;
  const gradeSize = Math.floor(studentCount / 4);

  const communities: Community[] = communityTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    archetype: 'school',
    color: t.color,
    metadata: {
      description: `Academic and social cluster for ${t.name}`,
      category: t.category,
      density: t.density,
      isolation: 0.72,
    },
    agentIds: [],
    metrics: {
      size: 0,
      avgTrust: 0,
      avgInfluence: 0,
      avgConformity: 0,
      avgRiskTolerance: 0,
      internalDensity: t.density,
    },
  }));

  const agents: Agent[] = [];
  const communityNodeMap = new Map<string, string[]>();
  communities.forEach((c) => communityNodeMap.set(c.id, []));

  let agentIndex = 1;

  // Helper to generate realistic names
  const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Sam', 'Chris', 'Pat', 'Riley', 'Avery', 'Emma', 'Liam', 'Noah', 'Olivia', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'Lucas', 'Mia'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

  const makeAgent = (commId: string, role: string, isFaculty: boolean): Agent => {
    const id = `agent-${String(agentIndex++).padStart(4, '0')}`;
    const name = `${rng.choice(firstNames)} ${rng.choice(lastNames)}`;

    // Mathematical Trait Distributions for School Archetype
    const trust = traitOverrides?.trust !== undefined 
      ? traitOverrides.trust 
      : isFaculty 
        ? sampler.truncatedNormal(0.70, 0.12, 0.2, 0.98) 
        : sampler.truncatedNormal(0.52, 0.18, 0.1, 0.95);

    const conformity = traitOverrides?.conformity !== undefined
      ? traitOverrides.conformity
      : isFaculty
        ? sampler.truncatedNormal(0.40, 0.15, 0.1, 0.8)
        : sampler.truncatedNormal(0.72, 0.14, 0.25, 0.99); // High peer pressure

    const influence = traitOverrides?.influence !== undefined
      ? traitOverrides.influence
      : isFaculty
        ? sampler.truncatedNormal(0.80, 0.12, 0.4, 1.0) // Teachers have high institutional authority
        : sampler.powerLaw(2.4, 0.05, 0.9);

    const riskTolerance = traitOverrides?.riskTolerance !== undefined
      ? traitOverrides.riskTolerance
      : isFaculty
        ? sampler.truncatedNormal(0.35, 0.12, 0.05, 0.7)
        : sampler.truncatedNormal(0.62, 0.20, 0.1, 0.98); // High youth impulsivity

    return {
      id,
      name,
      communityId: commId,
      role,
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
    };
  };

  // 1. Create Faculty
  const facultyComm = communities.find((c) => c.id === 'comm-faculty')!;
  for (let i = 0; i < facultyCount; i++) {
    const role = i === 0 ? 'Principal' : i === 1 ? 'Vice Principal' : i < 4 ? 'Department Chair' : 'Teacher';
    const agent = makeAgent(facultyComm.id, role, true);
    agents.push(agent);
    facultyComm.agentIds.push(agent.id);
    communityNodeMap.get(facultyComm.id)!.push(agent.id);
  }

  // 2. Create Students by Cohort
  const cohorts = [
    { commId: 'comm-grade-9', role: 'Freshman' },
    { commId: 'comm-grade-10', role: 'Sophomore' },
    { commId: 'comm-grade-11', role: 'Junior' },
    { commId: 'comm-grade-12', role: 'Senior' },
  ];

  for (let c = 0; c < cohorts.length; c++) {
    const { commId, role } = cohorts[c];
    const comm = communities.find((x) => x.id === commId)!;
    const targetSize = c === cohorts.length - 1 ? studentCount - gradeSize * 3 : gradeSize;

    for (let i = 0; i < targetSize; i++) {
      const studentRole = i === 0 ? `${role} Class President` : role;
      const agent = makeAgent(commId, studentRole, false);
      agents.push(agent);
      comm.agentIds.push(agent.id);
      communityNodeMap.get(commId)!.push(agent.id);
    }
  }

  // 3. Generate Social Network
  const edges = generateClusteredTopology({
    communityNodeMap,
    pInternal: 0.18,
    pExternal: 0.015,
    rng,
  });

  return { communities, agents, edges };
}
