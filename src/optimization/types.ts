/**
 * Social Gravity - V2.0 Intervention Optimization Types
 * Algorithmic budget optimization, Pareto frontier search, and cost-efficiency analysis.
 */

export type InterventionStrategyType =
  | 'bridge_targeting'
  | 'influencer_targeting'
  | 'hybrid_pareto'
  | 'algorithmic_rate_limiting';

export interface OptimizedInterventionPlan {
  strategy: InterventionStrategyType;
  name: string;
  targetAgentIds: string[];
  targetCount: number;
  operationalCost: number; // Unit cost (e.g. 1 unit per node contacted, 0.5 per rate-limit)
  containmentEfficiency: number; // % reduction in infections vs unmitigated baseline
  costPerPercentContainment: number;
  isParetoOptimal: boolean;
  rationale: string;
}

export interface OptimizationReport {
  baselineInfections: number;
  evaluatedStrategiesCount: number;
  paretoFrontier: OptimizedInterventionPlan[];
  recommendedPlan: OptimizedInterventionPlan;
  comparisonTable: Array<{
    strategy: string;
    cost: string;
    containment: string;
  }>;
}
