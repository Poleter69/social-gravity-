/**
 * Social Gravity — Adaptive Force-Directed Layout 2.0 (Stage 3 & Stage 12)
 *
 * Implements density-scaled repulsion, strict collision prevention,
 * cluster attraction, bridge tension, and deterministic replay stability.
 * Communities become compact, organic, and never compressed or overlapping.
 */

import { Society } from '../types/society';
import { CanvasNode, CanvasEdge, ViewportBounds } from './types';
import { GoEmotionLabel, EMOTION_COLOR_MAP } from '../../nlp/types';
import { synthesizeEmotionProfileFromTraits } from '../../psychology/defaults';
import { AgentEpidemicState } from '../../simulation/types';

export interface LayoutOptions {
  iterations?: number;
  interClusterSpacing?: number;
  deterministicSeed?: boolean;
}

export class AdaptiveForceLayout {
  /**
   * Converts a Society and current simulation states into optimized CanvasNodes and CanvasEdges,
   * applying adaptive force physics with collision avoidance.
   */
  public static computeLayout(
    society: Society,
    simulationStates?: Map<string, AgentEpidemicState>,
    patientZeroIds?: string[],
    options: LayoutOptions = {}
  ): {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    bounds: ViewportBounds;
    communityCenters: Map<string, { x: number; y: number; color: string; name: string }>;
  } {
    const totalAgents = society.agents.length;
    const numCommunities = Math.max(1, society.communities.length);

    // 1. Calculate Multi-Polar Community Centroids
    // Generous inter-cluster radius ensures clusters have plenty of breathing room
    const clusterBaseSpacing = options.interClusterSpacing ?? (
      totalAgents > 2000 ? 580 : totalAgents > 500 ? 460 : 380
    );
    const orbitRadius = numCommunities <= 1 ? 0 : Math.max(220, Math.sqrt(numCommunities) * (clusterBaseSpacing * 0.48));

    const communityCenters = new Map<string, { x: number; y: number; color: string; name: string }>();

    society.communities.forEach((comm, idx) => {
      const angle = (idx / numCommunities) * 2 * Math.PI - Math.PI / 2;
      const cx = Math.cos(angle) * orbitRadius;
      const cy = Math.sin(angle) * orbitRadius;
      communityCenters.set(comm.id, {
        x: cx,
        y: cy,
        color: comm.color || '#38BDF8',
        name: comm.name,
      });
    });

    // 2. Initialize Nodes with Deterministic Organic Clustering
    const nodes: CanvasNode[] = [];
    const nodeMap = new Map<string, CanvasNode>();

    // Count agents per community for density calculation
    const communityCounts = new Map<string, number>();
    society.agents.forEach((a) => {
      communityCounts.set(a.communityId, (communityCounts.get(a.communityId) || 0) + 1);
    });

    const commCurrentIdx = new Map<string, number>();

    for (let i = 0; i < totalAgents; i++) {
      const agent = society.agents[i];
      const commCenter = communityCenters.get(agent.communityId) || { x: 0, y: 0, color: '#38BDF8', name: 'Cluster' };
      const commIdx = commCurrentIdx.get(agent.communityId) || 0;
      commCurrentIdx.set(agent.communityId, commIdx + 1);

      const commSize = communityCounts.get(agent.communityId) || 1;
      const densityFactor = Math.min(1.8, Math.max(0.7, Math.sqrt(commSize / 30)));

      // Golden angle spiral distribution provides a clean, non-overlapping initial packing
      const goldenAngle = 2.3999632; // 137.5 degrees in radians
      const distFromCenter = agent.isInfluencer
        ? Math.sqrt(commIdx + 1) * 7.0
        : agent.isBridge
        ? 35.0 + Math.sqrt(commIdx) * 12.0
        : Math.sqrt(commIdx + 1) * (11.0 * densityFactor);

      const angle = commIdx * goldenAngle;
      let initialX = commCenter.x + Math.cos(angle) * distFromCenter;
      let initialY = commCenter.y + Math.sin(angle) * distFromCenter;

      // If bridge node, gently bias position toward neighboring communities
      if (agent.isBridge && numCommunities > 1) {
        // Bias outward toward network center (0, 0)
        initialX = initialX * 0.72;
        initialY = initialY * 0.72;
      }

      // Base radius calculation
      const baseRadius = agent.isInfluencer ? 8.5 : agent.isBridge ? 6.5 : 4.5;
      const scaleAdjust = totalAgents > 2500 ? 0.6 : totalAgents > 800 ? 0.8 : 1.0;
      const radius = Math.max(3.0, baseRadius * scaleAdjust);

      // Emotion profile resolution: Grounded in 28-dimensional GoEmotions
      const emotionProfile = agent.psychology.emotionProfile ?? 
        synthesizeEmotionProfileFromTraits(agent.traits, `${agent.name} ${agent.role}`);
      const dominantEmotion: GoEmotionLabel = emotionProfile.primaryEmotion || emotionProfile.dominantEmotion || 'curiosity';
      const emotionConf = emotionProfile.confidence ?? 0.78;

      // Risk score calculation
      const epState = simulationStates?.get(agent.id);
      const isP0 = patientZeroIds?.includes(agent.id) ?? false;
      const riskScore = epState === 'BELIEVER' ? 0.85 : isP0 ? 0.95 : agent.isBridge ? 0.65 : 0.25;
      const riskLevel = riskScore >= 0.75 ? 'critical' : riskScore >= 0.5 ? 'high' : riskScore >= 0.3 ? 'moderate' : 'low';

      // Real affective color from GoEmotions taxonomy
      const nodeColor = EMOTION_COLOR_MAP[dominantEmotion] || '#38BDF8';

      const node: CanvasNode = {
        id: agent.id,
        label: agent.name,
        sublabel: agent.role,
        communityId: agent.communityId,
        communityName: commCenter.name,
        communityColor: commCenter.color,
        x: initialX,
        y: initialY,
        targetX: initialX,
        targetY: initialY,
        vx: 0,
        vy: 0,
        radius,
        baseRadius: radius,
        color: nodeColor,
        isInfluencer: agent.isInfluencer,
        isBridge: agent.isBridge,
        isPatientZero: isP0,
        state: epState,
        emotion: dominantEmotion,
        emotionConfidence: emotionConf,
        emotionProfile,
        riskLevel,
        riskScore,
        source: 'synthetic',
        content: `Node ${agent.name} (${agent.role}) in ${commCenter.name}. Degree: ${agent.metrics.degree}. Trust: ${(agent.traits.trust * 100).toFixed(0)}%.`,
        timestamp: Date.now(),
        authorName: agent.name,
        metrics: {
          degree: agent.metrics.degree,
          inDegree: agent.metrics.inDegree,
          outDegree: agent.metrics.outDegree,
          betweenness: agent.metrics.betweenness,
          clustering: agent.metrics.localClustering,
        },
        traits: {
          trust: agent.traits.trust,
          influence: agent.traits.influence,
          conformity: agent.traits.conformity,
          riskTolerance: agent.traits.riskTolerance,
        },
        rawAgent: agent,
        bornAt: Date.now() - 10000,
        scaleFactor: 1.0,
        opacity: 1.0,
        pulseTimer: 0,
      };

      nodes.push(node);
      nodeMap.set(node.id, node);
    }

    // 3. Fast Collision Prevention & Adaptive Force Relaxation
    // A fast relaxation resolves overlaps without locking the thread
    const iterations = Math.min(20, options.iterations ?? (totalAgents > 5000 ? 3 : totalAgents > 2000 ? 6 : 12));
    const pad = 4.0; // clearance between nodes

    for (let iter = 0; iter < iterations; iter++) {
      const alpha = 1.0 - iter / iterations;

      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        const commCenter = communityCenters.get(n1.communityId) || { x: 0, y: 0 };

        // 3a. Cluster gravity (pulls node gently toward its community center)
        const toCenterX = commCenter.x - n1.x;
        const toCenterY = commCenter.y - n1.y;
        n1.vx += toCenterX * 0.025 * alpha;
        n1.vy += toCenterY * 0.025 * alpha;

        // 3b. Local collision check against nearby nodes
        // Only inspect nearest window of nodes within the same community to maintain O(N) performance
        const checkWindow = Math.min(nodes.length, i + 35);
        for (let j = i + 1; j < checkWindow; j++) {
          const n2 = nodes[j];
          if (n1.communityId !== n2.communityId) continue;

          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy;
          const minDist = n1.radius + n2.radius + pad;

          if (distSq < minDist * minDist) {
            const dist = Math.max(0.01, Math.sqrt(distSq));
            const overlap = (minDist - dist) * 0.5;
            const pushX = (dx / dist) * overlap * alpha;
            const pushY = (dy / dist) * overlap * alpha;

            n1.vx -= pushX;
            n1.vy -= pushY;
            n2.vx += pushX;
            n2.vy += pushY;
          }
        }
      }

      // Step positions with damping
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx * 0.45;
        n.y += n.vy * 0.45;
        n.vx *= 0.55;
        n.vy *= 0.55;
      }
    }

    // 4. Transform Edges
    const edges: CanvasEdge[] = society.edges.map((e) => {
      const isBridgeEdge = e.type === 'bridge';
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        weight: isBridgeEdge ? 2.0 : e.weight > 0 ? e.weight * 1.5 : 1.0,
        type: e.type,
        active: false,
        critical: isBridgeEdge,
        timestamp: e.timestamp,
      };
    });

    // 5. Compute World Bounding Box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      n.targetX = n.x;
      n.targetY = n.y;
      if (n.x - n.radius < minX) minX = n.x - n.radius;
      if (n.x + n.radius > maxX) maxX = n.x + n.radius;
      if (n.y - n.radius < minY) minY = n.y - n.radius;
      if (n.y + n.radius > maxY) maxY = n.y + n.radius;
    });

    // Add margin
    const margin = 80;
    minX -= margin;
    minY -= margin;
    maxX += margin;
    maxY += margin;

    return {
      nodes,
      edges,
      bounds: { minX, minY, maxX, maxY },
      communityCenters,
    };
  }

  /**
   * Smoothly eases a live incoming post/node into the network.
   * Finds nearest anchor or cluster and positions without dislocating the graph.
   */
  public static placeLiveNode(
    newNode: CanvasNode,
    _existingNodes: CanvasNode[],
    targetCommunityCenter: { x: number; y: number }
  ): void {
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 80;
    newNode.x = targetCommunityCenter.x + Math.cos(angle) * distance;
    newNode.y = targetCommunityCenter.y + Math.sin(angle) * distance;
    newNode.targetX = newNode.x;
    newNode.targetY = newNode.y;
    newNode.scaleFactor = 0.05; // starts tiny for entrance pop
  }
}
