/**
 * Social Gravity - City Society Archetype
 * Represents a metropolitan population with geographic districts, civic institutions,
 * small-world transit ties, and local community hubs.
 */

import { Community } from '../types/community';
import { Agent, AgentTraits } from '../types/agent';
import { SocialEdge } from '../types/network';
import { PRNG } from '../math/random';
import { DistributionSampler } from '../math/distributions';
import { generateClusteredTopology } from '../topologies/clustered';
import { ArchetypeResult } from './school';
import { createInitialPsychologicalState } from '../../psychology/defaults';

export function generateCitySociety(
  populationSize: number,
  rng: PRNG,
  sampler: DistributionSampler,
  traitOverrides?: Partial<AgentTraits>
): ArchetypeResult {
  const districts = [
    { id: 'dist-downtown', name: 'Downtown Commercial Hub', color: '#38bdf8', category: 'urban_core', density: 0.22 },
    { id: 'dist-university', name: 'University & Research Quarter', color: '#a78bfa', category: 'academic', density: 0.25 },
    { id: 'dist-industrial', name: 'Industrial & Port District', color: '#fb923c', category: 'logistics', density: 0.20 },
    { id: 'dist-suburb-north', name: 'North Residential Suburbs', color: '#4ade80', category: 'residential', density: 0.18 },
    { id: 'dist-historic', name: 'Historic Cultural District', color: '#f472b6', category: 'cultural', density: 0.21 },
  ];

  const communities: Community[] = districts.map((d) => ({
    id: d.id,
    name: d.name,
    archetype: 'city',
    color: d.color,
    metadata: {
      description: `Metropolitan district: ${d.name}`,
      category: d.category,
      density: d.density,
      isolation: 0.55,
    },
    agentIds: [],
    metrics: {
      size: 0,
      avgTrust: 0,
      avgInfluence: 0,
      avgConformity: 0,
      avgRiskTolerance: 0,
      internalDensity: d.density,
    },
  }));

  const agents: Agent[] = [];
  const communityNodeMap = new Map<string, string[]>();
  districts.forEach((d) => communityNodeMap.set(d.id, []));

  const firstNames = ['Carlos', 'Amina', 'Dmitri', 'Fatima', 'Liam', 'Mei', 'Jamal', 'Elena', 'Tariq', 'Sora', 'Oliver', 'Maya', 'Gabriel', 'Ananya', 'Victor', 'Helena'];
  const lastNames = ['Santos', 'Al-Mansoor', 'Ivanov', 'Khan', 'Rossi', 'Zhang', 'Diallo', 'Petrov', 'Haddad', 'Takahashi', 'MacDonald', 'Sharma', 'Silva', 'Lindqvist'];

  const perDistrict = Math.floor(populationSize / districts.length);
  let agentIndex = 1;

  districts.forEach((district, dIdx) => {
    const isLast = dIdx === districts.length - 1;
    const count = isLast ? populationSize - agentIndex + 1 : perDistrict;
    const comm = communities.find((c) => c.id === district.id)!;

    for (let i = 0; i < count; i++) {
      const id = `agent-${String(agentIndex++).padStart(4, '0')}`;
      const name = `${rng.choice(firstNames)} ${rng.choice(lastNames)}`;
      comm.agentIds.push(id);
      communityNodeMap.get(district.id)!.push(id);

      // Civic roles
      const isLeader = i === 0;
      const isJournalist = i === 1;
      const role = isLeader
        ? `District Representative (${district.name})`
        : isJournalist
          ? 'Local Journalist / Broadcaster'
          : i % 7 === 0
            ? 'Community Organizer'
            : 'District Resident';

      // Traits for city dwellers
      const trust = traitOverrides?.trust !== undefined
        ? traitOverrides.trust
        : sampler.truncatedNormal(0.48, 0.16, 0.1, 0.92);

      const conformity = traitOverrides?.conformity !== undefined
        ? traitOverrides.conformity
        : sampler.truncatedNormal(0.46, 0.15, 0.1, 0.88);

      const influence = traitOverrides?.influence !== undefined
        ? traitOverrides.influence
        : isLeader
          ? sampler.truncatedNormal(0.88, 0.08, 0.7, 0.99)
          : isJournalist
            ? sampler.truncatedNormal(0.82, 0.10, 0.6, 0.95)
            : sampler.powerLaw(2.3, 0.04, 0.75);

      const riskTolerance = traitOverrides?.riskTolerance !== undefined
        ? traitOverrides.riskTolerance
        : sampler.truncatedNormal(0.50, 0.17, 0.08, 0.92);

      agents.push({
        id,
        name,
        communityId: district.id,
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
      });
    }
  });

  // Generate clustered neighborhood topology with transit / commerce weak ties
  const baseEdges = generateClusteredTopology({
    communityNodeMap,
    pInternal: 0.14,
    pExternal: 0.025, // Weak ties between city districts (Granovetter)
    rng,
  });

  // Inject civic broadcasting links from journalists & leaders to general population
  const edges: SocialEdge[] = [...baseEdges];
  const leadersAndPress = agents.filter((a) => a.role.includes('Representative') || a.role.includes('Journalist'));
  const edgeSet = new Set<string>(edges.map((e) => `${e.source}--${e.target}`));

  for (const broadcaster of leadersAndPress) {
    const broadcastCount = Math.min(15, Math.floor(agents.length * 0.06));
    const audience = rng.sample(agents, broadcastCount);

    for (const listener of audience) {
      if (listener.id === broadcaster.id) continue;
      const key1 = `${broadcaster.id}--${listener.id}`;
      const key2 = `${listener.id}--${broadcaster.id}`;
      if (!edgeSet.has(key1) && !edgeSet.has(key2)) {
        edgeSet.add(key1);
        edges.push({
          id: `edge-${edges.length + 1}`,
          source: broadcaster.id,
          target: listener.id,
          weight: 0.75,
          type: 'bridge',
        });
      }
    }
  }

  return { communities, agents, edges };
}
