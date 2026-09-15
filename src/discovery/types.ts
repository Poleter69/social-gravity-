/**
 * Social Gravity - Local AI Discovery Engine Types
 * Standard contracts for empirical experiment telemetry, resilience scoring,
 * hypothesis cards, intervention recommendations, and research reports.
 */

import { RoundTelemetry } from '../simulation/types';

export interface ExperimentTelemetry {
  id: string;
  timestamp: string;
  populationSize: number;
  communityCount: number;
  influencerCount: number;
  bridgeCount: number;
  isolatedCount: number;
  averageTrust: number;
  averageConformity: number;
  averageInfluence: number;
  averageRiskTolerance: number;
  networkDensity: number;
  clusteringCoefficient: number;
  
  // Rumor properties
  rumorTopic: string;
  rumorVeracity: string;
  rumorFearSalience: number;
  rumorComplexity: number;
  patientZeroIds: string[];
  
  // Epidemic outcomes
  totalRounds: number;
  peakBelievers: number;
  finalBelievers: number;
  finalDebunkers: number;
  finalSkeptics: number;
  finalSusceptible: number;
  adoptionRate: number; // Final believers / population
  debunkRate: number;   // Final debunkers / population
  resistanceRate: number; // Final skeptics / population
  
  // Transmission dynamics
  peakR0: number;
  finalR0: number;
  maxCascadeDepth: number;
  peakVelocity: number;
  averageVelocity: number;
  echoChamberPolarization: number;
  
  // Intervention metrics
  hasIntervention: boolean;
  interventionRound: number | null;
  postInterventionR0Drop: number;
  
  // Trajectory history
  roundTelemetry: RoundTelemetry[];
  
  // Community level outcomes
  communityOutcomes: Array<{
    communityId: string;
    name: string;
    total: number;
    believers: number;
    debunkers: number;
    skeptics: number;
    penetrationRate: number;
  }>;
  
  // Structural impact
  bridgeInfectionRatio: number; // Ratio of bridge nodes that became believers
  influencerInfectionRatio: number; // Ratio of influencers that became believers
}

export interface ResilienceScore {
  overall: number; // 0 to 100
  rating: 'Critical Vulnerability' | 'Fragile' | 'Moderate Resilience' | 'Robust Defense' | 'Immune';
  subScores: {
    epistemicTrustDefense: number;    // Resistance based on healthy skepticism & high dyadic trust
    topologicalContainment: number;   // Cluster isolation & bridge bottlenecks limiting reach
    emotionalComposure: number;       // Resilience against fear-salience exploitation
    interventionReceptivity: number;  // Rapidity and depth of fact-check adoption
  };
  explanation: string;
}

export type HypothesisCategory = 
  | 'bridge_amplification'
  | 'trust_resilience'
  | 'influencer_reach'
  | 'conformity_threshold'
  | 'emotional_contagion'
  | 'counter_intervention';

export interface HypothesisCard {
  id: string;
  title: string;
  category: HypothesisCategory;
  evidence: string;
  mechanism: string;
  confidence: number; // 0.0 to 1.0
  confidenceLabel: 'Very High' | 'High' | 'Moderate';
  suggestedExperiment: string;
  metricsSnapshot: Record<string, string | number>;
}

export interface InterventionRecommendation {
  id: string;
  title: string;
  targetType: 'bridge_nodes' | 'influencer_inoculation' | 'local_clusters' | 'delay_broadcast' | 'prebunking';
  rationale: string;
  expectedImpact: string;
  simulationRecipe: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface DiscoveryReport {
  id: string;
  experimentId: string;
  generatedAt: string;
  generatorSource: 'deterministic_engine' | 'ollama_llama3';
  resilienceScore: ResilienceScore;
  topDiscovery: string;
  intervention: InterventionRecommendation;
  hypothesisCards: HypothesisCard[];
  measuredFacts: string[];
  inferredObservations: string[];
  futureHypotheses: string[];
  executiveSummary: string;
  telemetry: ExperimentTelemetry;
}
