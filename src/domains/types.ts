/**
 * Social Gravity - V2.0 Multi-Domain Expansion Types
 * Modular domain adapters for finance, cybersecurity, emergency, enterprise, and supply chain.
 */


export type DomainType =
  | 'financial_panic'
  | 'cybersecurity_incident'
  | 'emergency_communication'
  | 'organizational_rumor'
  | 'supply_chain_disruption';

export interface DomainSignalTemplate {
  topic: string;
  content: string;
  emotionalSalience: number;
  emotionTag: string; // e.g. Fear, Panic, Urgency
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface DomainSpecification {
  domain: DomainType;
  name: string;
  description: string;
  recommendedTopology: 'core_periphery' | 'hierarchical' | 'spatial_grid' | 'scale_free' | 'bipartite';
  psychologicalPriors: {
    defaultTrust: number;
    defaultConformity: number;
    defaultRiskTolerance: number;
  };
  defaultSignals: DomainSignalTemplate[];
  interventionProtocols: string[];
}
