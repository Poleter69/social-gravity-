/**
 * Social Gravity — Project Orbit Canvas Subsystem Types
 * Palantir-level graph visualization, camera, LOD, and interaction models.
 */

import { Agent } from '../types/agent';
import { AgentEpidemicState } from '../../simulation/types';
import { GoEmotionLabel } from '../../nlp/types';

export type ViewMode = 'network' | 'heatmap' | 'community' | 'emotion' | 'risk' | 'bridges';

export type NodeSource = 'reddit' | 'bluesky' | 'x' | 'rss' | 'local' | 'synthetic';

export type ThreatLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface CanvasNode {
  id: string;
  label: string;
  sublabel?: string;
  communityId: string;
  communityName: string;
  communityColor: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  isInfluencer: boolean;
  isBridge: boolean;
  isPatientZero: boolean;
  state?: AgentEpidemicState;
  emotion: GoEmotionLabel | string;
  emotionConfidence: number;
  riskLevel: ThreatLevel;
  riskScore: number;
  source: NodeSource;
  content?: string;
  timestamp?: number;
  authorName?: string;
  metrics: {
    degree: number;
    inDegree?: number;
    outDegree?: number;
    betweenness?: number;
    clustering?: number;
  };
  traits: {
    trust: number;
    influence: number;
    conformity: number;
    riskTolerance: number;
  };
  rawAgent?: Agent;
  bornAt: number; // Date.now() timestamp when added
  scaleFactor: number; // 0 to 1 for live entrance animation
  opacity: number;
  pulseTimer: number;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  type: 'peer' | 'hierarchical' | 'bridge' | 'weak_tie';
  active?: boolean;
  critical?: boolean;
  isDebunk?: boolean;
  pulseProgress?: number; // 0..1 for photon flow
  timestamp?: number;
}

export interface CameraState {
  x: number;
  y: number;
  scale: number;
  targetX: number;
  targetY: number;
  targetScale: number;
}

export interface FilterOptions {
  sources: Set<string>;
  emotions: Set<string>;
  riskLevels: Set<ThreatLevel>;
  communityIds: Set<string>;
  states: Set<AgentEpidemicState | 'ALL'>;
  timeRange: 'all' | '1m' | '1h' | '1d' | 'custom';
  onlyInfluencers: boolean;
  onlyBridges: boolean;
  onlyContagion: boolean;
  searchQuery: string;
}

export interface CommunityHull {
  communityId: string;
  name: string;
  color: string;
  centroid: { x: number; y: number };
  polygon: Array<{ x: number; y: number }>;
  smoothPoints: Array<{ x: number; y: number }>;
  nodeCount: number;
  radius: number;
}

export interface ViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface TransmissionParticle {
  id: string;
  sourceId: string;
  targetId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number; // 0 to 1
  speed: number;
  color: string;
  size: number;
  type: 'rumor' | 'debunk' | 'neutral';
}
