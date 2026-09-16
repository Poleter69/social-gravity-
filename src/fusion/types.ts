/**
 * Social Gravity - Cross-Domain Fusion Types (M15)
 * Contracts for the Unified Intelligence Graph, cross-domain signal correlation,
 * transfer entropy spillover modeling, and systemic contagion risk.
 */

import { DomainType } from '../domains/types';

export type ExtendedDomainType = DomainType | 'geopolitical_narrative';

export interface CrossDomainSignal {
  id: string;
  domain: ExtendedDomainType;
  timestamp: number; // Tick
  headline: string;
  entities: string[]; // Key entity tokens (e.g. ['SwiftBank', 'Cloudflare', 'CrudeOil'])
  fearSalience: number;
  propagationVelocity: number;
  communitySpreadCount: number;
}

export interface CrossDomainCouplingEdge {
  sourceDomain: ExtendedDomainType;
  targetDomain: ExtendedDomainType;
  correlationScore: number;       // [0, 1]
  transferEntropy: number;        // Information theoretic bits
  estimatedLagTicks: number;       // Temporal delay before spillover
  sharedEntities: string[];
  spilloverMechanism: string;
}

export interface CrossDomainCascadeEvent {
  primaryDomain: ExtendedDomainType;
  secondaryDomain: ExtendedDomainType;
  spilloverTick: number;
  couplingStrength: number;
  triggerHeadline: string;
  spilloverConsequence: string;
}

export interface UnifiedIntelligenceGraph {
  activeDomains: ExtendedDomainType[];
  registeredSignals: CrossDomainSignal[];
  couplingEdges: CrossDomainCouplingEdge[];
  cascadingSpillovers: CrossDomainCascadeEvent[];
  systemicContagionIndex: number; // [0, 1] overall systemic fragility
}

export interface CrossDomainCorrelationReport {
  timestamp: number;
  analyzedSignalCount: number;
  couplingCount: number;
  systemicContagionIndex: number;
  topCrossDomainCouplings: CrossDomainCouplingEdge[];
  predictedUpcomingSpillovers: CrossDomainCascadeEvent[];
  executiveRiskAssessment: string;
}
