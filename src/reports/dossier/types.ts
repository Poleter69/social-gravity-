/**
 * Social Gravity — Project Dossier
 * Type Definitions & Intelligence Schema
 * Executive + Forensic Grade Export Specification
 */

export type ClassificationLevel =
  | 'UNCLASSIFIED // FOR OFFICIAL USE ONLY'
  | 'RESTRICTED // INTERNAL INTELLIGENCE'
  | 'CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE'
  | 'SECRET // NOFORN'
  | 'TOP SECRET // SCI // EYES ONLY';

export interface TimelineMilestone {
  round: number;
  timeOffset: string;
  type: 'origin' | 'emotional_spike' | 'bridge_crossing' | 'peak_diffusion' | 'intervention' | 'equilibrium';
  label: string;
  headline: string;
  description: string;
  evidence: string;
  metrics: Array<{ key: string; value: string }>;
  agents: string[];
}

export interface NetworkEvidenceNode {
  id: string;
  name: string;
  community: number | string;
  communityName: string;
  degree: number;
  isBridge: boolean;
  isInfluencer: boolean;
  state: 'BELIEVER' | 'SUSCEPTIBLE' | 'DEBUNKER' | 'EXPOSED' | 'SKEPTIC';
  x: number;
  y: number;
  riskScore: number;
}

export interface NetworkEvidenceEdge {
  source: string;
  target: string;
  isCrossCommunity: boolean;
}

export interface CommunityHull {
  id: number | string;
  name: string;
  nodeCount: number;
  color: string;
  infectedPct: number;
  hullPoints: Array<[number, number]>;
}

export interface NetworkEvidenceData {
  nodes: NetworkEvidenceNode[];
  edges: NetworkEvidenceEdge[];
  communities: CommunityHull[];
  bridges: string[];
  metrics: {
    totalNodes: number;
    totalEdges: number;
    density: number;
    modularity: number;
    avgPathLength: number;
  };
}

export interface RoundEmotionPoint {
  round: number;
  fear: number;
  anger: number;
  curiosity: number;
  trust: number;
  sadness: number;
  neutral: number;
}

export interface NarrativeStoryPoint {
  round: number;
  phase: string;
  storyline: string;
  tacticalInference: string;
}

export interface KeyActorDossier {
  id: string;
  alias: string;
  role: string;
  reach: 'Low' | 'Medium' | 'High' | 'Critical';
  risk: 'Low' | 'Moderate' | 'High' | 'Critical';
  communityName: string;
  degree: number;
  betweenness: number;
  emotionalTendency: string;
  tacticalContext: string;
}

export interface EvidenceCard {
  id: string;
  source: 'X' | 'Reddit' | 'Bluesky' | 'RSS' | 'Wikipedia' | 'Synthetic';
  headline: string;
  content: string;
  emotion: string;
  confidence: number;
  timestamp: string;
  round: number;
  whyItMattered: string;
  verified: boolean;
}

export interface CausalFlowNode {
  step: number;
  title: string;
  detail: string;
  badge: string;
  type: 'signal' | 'emotion' | 'transmission' | 'topology' | 'risk';
}

export interface ActionableRecommendation {
  id: string;
  priority: 'P0 Immediate' | 'P1 High' | 'P2 Medium';
  category: 'Containment' | 'Surveillance' | 'Forensics' | 'Inoculation';
  title: string;
  action: string;
  findingReference: string;
  expectedImpact: string;
}

export interface ConnectorStatusInfo {
  platform: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'SYNTHESIZED';
  eventCount: number;
  latencyMs: number;
}

export interface EmotionDistributionItem {
  emotion: string;
  prevalencePct: number;
  trend: 'RISING' | 'STABLE' | 'FALLING';
}

export interface InvestigationDossier {
  metadata: {
    id: string;
    title: string;
    operationCodename: string;
    classification: ClassificationLevel;
    generatedAt: string;
    analystId: string;
    dataSources: string[];
    summaryOneLiner: string;
    reproductionHash: string;
    activeTheme: 'light' | 'dark';
  };
  executiveSummary: {
    narrativeGrowth: string;
    dominantEmotion: string;
    dominantEmotionPct: number;
    communitiesAffected: number;
    totalCommunities: number;
    riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
    infectedCount: number;
    totalPopulation: number;
    saturationPct: number;
    peakR0: number;
    aiAssessment: string;
  };
  timeline: TimelineMilestone[];
  networkEvidence: NetworkEvidenceData;
  emotionTrends: {
    points: RoundEmotionPoint[];
    shiftAnnotations: Array<{ round: number; note: string; emotion: string }>;
  };
  narrativeEvolution: NarrativeStoryPoint[];
  keyActors: KeyActorDossier[];
  evidenceBoard: EvidenceCard[];
  explainabilityFlow: CausalFlowNode[];
  recommendations: ActionableRecommendation[];
  appendix: {
    datasetName: string;
    datasetType: string;
    connectorStatus: ConnectorStatusInfo[];
    replayHash: string;
    exportChecksum: string;
    graphTopologySummary: {
      diameter: number;
      clusteringCoeff: number;
      degreeVariance: number;
    };
    emotionDistributionTable: EmotionDistributionItem[];
  };
}

export interface BuildDossierOptions {
  classification?: ClassificationLevel;
  operationTitle?: string;
  operationCodename?: string;
  analystId?: string;
  activeTheme?: 'light' | 'dark';
}
