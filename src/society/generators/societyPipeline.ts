/**
 * Social Gravity - 8-Stage Modular Society Generation Pipeline
 * Follows strict modular decomposition from agent instantiation to validation.
 */

import { Society, SocietyConfig, SocietySummary } from '../types/society';
import { Agent } from '../types/agent';
import { Community } from '../types/community';
import { SocialEdge } from '../types/network';
import { PRNG } from '../math/random';
import { DistributionSampler } from '../math/distributions';
import { generateSchoolSociety } from '../archetypes/school';
import { generateWorkplaceSociety } from '../archetypes/workplace';
import { generateCitySociety } from '../archetypes/city';
import { generateOnlineCommunitySociety } from '../archetypes/onlineCommunity';
import { computeGraphMetricsAndEnrichAgents } from './networkMetrics';
import { SocietyValidator } from '../validation/societyValidator';

export class SocietyPipeline {
  /**
   * Executes the full 8-stage creation flow.
   */
  public static execute(config: SocietyConfig): Society {
    const seed = config.seed ?? Math.floor(Math.random() * 1000000);
    const rng = new PRNG(seed);
    const sampler = new DistributionSampler(rng);

    const traitOverrides = {
      ...(config.baselineTrust !== undefined && { trust: config.baselineTrust }),
      ...(config.baselineConformity !== undefined && { conformity: config.baselineConformity }),
      ...(config.baselineRiskTolerance !== undefined && { riskTolerance: config.baselineRiskTolerance }),
      ...(config.baselineInfluencePolarization !== undefined && { influence: config.baselineInfluencePolarization }),
    };

    // Stage 1 & 2 & 3 & 4: Archetype-driven population, communities, traits, relationships
    let baseResult;
    switch (config.archetype) {
      case 'school':
        baseResult = generateSchoolSociety(config.populationSize, rng, sampler, traitOverrides);
        break;
      case 'workplace':
        baseResult = generateWorkplaceSociety(config.populationSize, rng, sampler, traitOverrides);
        break;
      case 'city':
        baseResult = generateCitySociety(config.populationSize, rng, sampler, traitOverrides);
        break;
      case 'online_community':
        baseResult = generateOnlineCommunitySociety(config.populationSize, rng, sampler, traitOverrides);
        break;
      default:
        throw new Error(`Unsupported society archetype: ${config.archetype}`);
    }

    const { agents, communities, edges } = baseResult;

    // Stage 5: Select & Designate Influencers
    this.designateInfluencers(agents, config.influencerRatio ?? 0.05);

    // Stage 6: Populate Agent Connections & Identify Bridge Nodes
    this.populateConnectionsAndBridges(agents, edges);

    // Compute topological metrics
    const metrics = computeGraphMetricsAndEnrichAgents(agents, communities, edges);

    // Stage 7: Validate Network Integrity
    const summary = this.buildSummary(agents, communities, metrics);
    const societyId = `soc-${config.archetype}-${Date.now()}-${seed % 1000}`;

    const society: Society = {
      id: societyId,
      name: config.name || `${config.archetype.toUpperCase()} Simulation`,
      archetype: config.archetype,
      createdAt: new Date().toISOString(),
      config: { ...config, seed },
      agents,
      communities,
      edges,
      metrics,
      summary,
    };

    const validation = SocietyValidator.validate(society);
    if (!validation.isValid) {
      throw new Error(`Society validation failed: ${validation.errors.join('; ')}`);
    }

    // Stage 8: Produce Final Society
    return society;
  }

  /**
   * Stage 5: Designates top gravitational hubs as influencers.
   */
  private static designateInfluencers(agents: Agent[], targetRatio: number): void {
    const influencerCount = Math.max(1, Math.round(agents.length * targetRatio));
    // Sort descending by influence score
    const sorted = [...agents].sort((a, b) => b.traits.influence - a.traits.influence);

    for (let i = 0; i < sorted.length; i++) {
      sorted[i].isInfluencer = i < influencerCount;
    }
  }

  /**
   * Stage 6: Populates each agent's direct connection list and flags bridge/isolated nodes.
   */
  private static populateConnectionsAndBridges(
    agents: Agent[],
    edges: SocialEdge[]
  ): void {
    const agentMap = new Map<string, Agent>(agents.map((a) => [a.id, a]));
    const commMap = new Map<string, string>(); // agentId -> commId
    for (const a of agents) {
      commMap.set(a.id, a.communityId);
      a.connections = [];
      a.isBridge = false;
      a.isIsolated = false;
    }

    const bridgeAgents = new Set<string>();

    for (const edge of edges) {
      const srcAgent = agentMap.get(edge.source);
      const tgtAgent = agentMap.get(edge.target);
      if (srcAgent && tgtAgent) {
        srcAgent.connections.push(tgtAgent.id);
        tgtAgent.connections.push(srcAgent.id);

        // Dyadic peer trust initialization based on agent baseline and edge weight
        srcAgent.peerTrustMap[tgtAgent.id] = Number(
          Math.min(1.0, srcAgent.traits.trust * 0.7 + edge.weight * 0.3).toFixed(3)
        );
        tgtAgent.peerTrustMap[srcAgent.id] = Number(
          Math.min(1.0, tgtAgent.traits.trust * 0.7 + edge.weight * 0.3).toFixed(3)
        );

        const srcComm = commMap.get(srcAgent.id);
        const tgtComm = commMap.get(tgtAgent.id);
        if (srcComm && tgtComm && srcComm !== tgtComm) {
          bridgeAgents.add(srcAgent.id);
          bridgeAgents.add(tgtAgent.id);
        }
      }
    }

    for (const agent of agents) {
      if (bridgeAgents.has(agent.id)) {
        agent.isBridge = true;
      }
      if (agent.connections.length <= 1) {
        agent.isIsolated = true;
      }
    }
  }

  /**
   * Builds executive summary metrics for research dashboards.
   */
  private static buildSummary(
    agents: Agent[],
    communities: Community[],
    metrics: any
  ): SocietySummary {
    const totalPop = agents.length;
    const sumTrust = agents.reduce((acc, a) => acc + a.traits.trust, 0);
    const sumConf = agents.reduce((acc, a) => acc + a.traits.conformity, 0);
    const sumInf = agents.reduce((acc, a) => acc + a.traits.influence, 0);
    const sumRisk = agents.reduce((acc, a) => acc + a.traits.riskTolerance, 0);

    return {
      totalPopulation: totalPop,
      communityCount: communities.length,
      influencerCount: agents.filter((a) => a.isInfluencer).length,
      bridgeNodeCount: agents.filter((a) => a.isBridge).length,
      isolatedNodeCount: agents.filter((a) => a.isIsolated).length,
      avgTrust: Number((sumTrust / totalPop).toFixed(3)),
      avgConformity: Number((sumConf / totalPop).toFixed(3)),
      avgInfluence: Number((sumInf / totalPop).toFixed(3)),
      avgRiskTolerance: Number((sumRisk / totalPop).toFixed(3)),
      density: metrics.density,
      averageDegree: metrics.averageDegree,
      globalClustering: metrics.globalClusteringCoefficient,
    };
  }
}
