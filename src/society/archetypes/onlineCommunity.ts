/**
 * Social Gravity - Online Community Society Archetype
 * Characterized by scale-free power-law degree distributions, algorithmic echo chambers,
 * low baseline trust, high risk tolerance, and hyper-influential nodes.
 */

import { Community } from '../types/community';
import { Agent, AgentTraits } from '../types/agent';
import { SocialEdge } from '../types/network';
import { PRNG } from '../math/random';
import { DistributionSampler } from '../math/distributions';
import { generateBarabasiAlbert } from '../topologies/scaleFree';
import { ArchetypeResult } from './school';
import { createInitialPsychologicalState } from '../../psychology/defaults';

export function generateOnlineCommunitySociety(
  populationSize: number,
  rng: PRNG,
  sampler: DistributionSampler,
  traitOverrides?: Partial<AgentTraits>
): ArchetypeResult {
  const channels = [
    { id: 'chan-tech', name: '#TechFrontier', color: '#06b6d4', category: 'technology', share: 0.25 },
    { id: 'chan-speculation', name: '#MarketSpeculation', color: '#10b981', category: 'finance', share: 0.20 },
    { id: 'chan-culture', name: '#CultureDebate', color: '#f43f5e', category: 'discourse', share: 0.25 },
    { id: 'chan-memes', name: '#ViralMemeLab', color: '#eab308', category: 'entertainment', share: 0.20 },
    { id: 'chan-alt', name: '#UnfilteredTheory', color: '#a855f7', category: 'fringe', share: 0.10 },
  ];

  const communities: Community[] = channels.map((c) => ({
    id: c.id,
    name: c.name,
    archetype: 'online_community',
    color: c.color,
    metadata: {
      description: `Algorithmic feed & interest channel: ${c.name}`,
      category: c.category,
      density: 0.20,
      isolation: 0.80, // High echo-chamber insularity
    },
    agentIds: [],
    metrics: {
      size: 0,
      avgTrust: 0,
      avgInfluence: 0,
      avgConformity: 0,
      avgRiskTolerance: 0,
      internalDensity: 0.20,
    },
  }));

  const agents: Agent[] = [];
  const handles = ['cyber_samurai', 'neural_nomad', 'pixel_prophet', 'quant_rebel', 'echo_hunter', 'data_drifter', 'zero_day', 'hyper_thinker', 'glitch_vibe', 'signal_beacon', 'shadow_broker', 'vector_mind'];
  let agentIndex = 1;

  channels.forEach((chan, idx) => {
    const isLast = idx === channels.length - 1;
    const count = isLast
      ? populationSize - agents.length
      : Math.max(2, Math.round(populationSize * chan.share));

    const comm = communities.find((c) => c.id === chan.id)!;

    for (let i = 0; i < count; i++) {
      const id = `agent-${String(agentIndex++).padStart(4, '0')}`;
      const prefix = rng.choice(handles);
      const name = `@${prefix}_${rng.nextInt(10, 999)}`;
      comm.agentIds.push(id);

      // Top 2% are mega-influencers / Key Opinion Leaders (KOLs)
      const isMegaInfluencer = i === 0;
      const isModerator = i === 1;
      const role = isMegaInfluencer
        ? 'Key Opinion Leader (KOL)'
        : isModerator
          ? 'Channel Moderator'
          : i % 4 === 0
            ? 'Power Poster'
            : i % 3 === 0
              ? 'Active Contributor'
              : 'Casual Lurker';

      // Trait distributions for online platforms
      const trust = traitOverrides?.trust !== undefined
        ? traitOverrides.trust
        : sampler.truncatedNormal(0.36, 0.18, 0.05, 0.85); // Lower institutional trust

      const conformity = traitOverrides?.conformity !== undefined
        ? traitOverrides.conformity
        : sampler.truncatedNormal(0.66, 0.18, 0.15, 0.98); // High group polarization / herd behavior

      const influence = traitOverrides?.influence !== undefined
        ? traitOverrides.influence
        : isMegaInfluencer
          ? sampler.truncatedNormal(0.96, 0.03, 0.9, 1.0) // Mega reach
          : isModerator
            ? sampler.truncatedNormal(0.85, 0.06, 0.75, 0.95)
            : sampler.powerLaw(2.8, 0.02, 0.70); // Steep Pareto tail

      const riskTolerance = traitOverrides?.riskTolerance !== undefined
        ? traitOverrides.riskTolerance
        : sampler.truncatedNormal(0.72, 0.16, 0.20, 0.99); // High thrill/meme sharing propensity

      agents.push({
        id,
        name,
        communityId: chan.id,
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

  // Generate Scale-Free network with Barabási-Albert preferential attachment
  const nodeIds = agents.map((a) => a.id);
  const baseEdges = generateBarabasiAlbert({
    nodeIds,
    m0: 5,
    m: 2,
    rng,
  });

  // Intensify intra-channel echo chamber connections
  const edges: SocialEdge[] = [...baseEdges];
  const edgeSet = new Set<string>(edges.map((e) => `${e.source}--${e.target}`));

  for (const chan of communities) {
    const memberIds = chan.agentIds;
    const extraInternalEdges = Math.floor(memberIds.length * 0.8);

    for (let e = 0; e < extraInternalEdges; e++) {
      const u = rng.choice(memberIds);
      const v = rng.choice(memberIds);
      if (u !== v) {
        const k1 = `${u}--${v}`;
        const k2 = `${v}--${u}`;
        if (!edgeSet.has(k1) && !edgeSet.has(k2)) {
          edgeSet.add(k1);
          edges.push({
            id: `edge-${edges.length + 1}`,
            source: u,
            target: v,
            weight: 0.65,
            type: 'peer',
          });
        }
      }
    }
  }

  return { communities, agents, edges };
}
