/**
 * Social Gravity V2 - Relationship Dynamics Model
 *
 * Mathematical formulation of dyadic tie strengthening and temporal decay.
 *
 * Mathematical Model:
 * 1. Strengthening (Repeated Interaction / Temporal Reinforcement):
 *    w_{t+1} = min(1.0, w_t + alpha * (1.0 - w_t))
 *    where alpha in (0, 1] is the asymptotic reinforcement rate.
 *    Diminishing marginal returns ensure bounded saturation at 1.0.
 *
 * 2. Temporal Decay (Inactivity / Tie Erosion):
 *    w_{t+1} = max(0.0, w_t * (1.0 - lambda))
 *    where lambda in (0, 1] is the exponential decay factor.
 *
 * 3. Lifecycle Threshold States:
 *    - 'active':  w >= activeThreshold (high transmission bandwidth)
 *    - 'weak':    weakThreshold <= w < activeThreshold (Granovetter weak tie)
 *    - 'dormant': dormantThreshold <= w < weakThreshold (latent tie)
 *    - 'removed': w < removalThreshold (pruned from diffusion topology)
 *
 * Reference:
 * - Granovetter, M. S. (1973). The strength of weak ties. American Journal of Sociology, 78(6), 1360-1380.
 * - Kossinets, G., & Watts, D. J. (2006). Empirical analysis of an evolving social network. Science, 311(5757), 88-90.
 */

import { EdgeStatus, RelationshipDynamicsConfig } from '../types';

export const DEFAULT_DYNAMICS_CONFIG: RelationshipDynamicsConfig = {
  strengtheningRate: 0.18,
  decayRate: 0.05,
  activeThreshold: 0.5,
  weakThreshold: 0.25,
  dormantThreshold: 0.08,
  removalThreshold: 0.02,
  dormantTicksBeforePruning: 12,
};

export class EdgeDynamicsModel {
  private config: RelationshipDynamicsConfig;

  constructor(config: Partial<RelationshipDynamicsConfig> = {}) {
    this.config = { ...DEFAULT_DYNAMICS_CONFIG, ...config };
  }

  public getConfig(): Readonly<RelationshipDynamicsConfig> {
    return this.config;
  }

  /**
   * Calculates new weight following an active dyadic interaction.
   * Asymptotic reinforcement: w_{t+1} = min(1.0, w_t + alpha * (1 - w_t))
   *
   * Input: currentWeight in [0, 1], customMultiplier optional
   * Output: newWeight in [0, 1]
   * Time Complexity: O(1)
   */
  public calculateStrengthenedWeight(
    currentWeight: number,
    multiplier: number = 1.0
  ): number {
    const effectiveAlpha = Math.min(1.0, this.config.strengtheningRate * multiplier);
    const newWeight = currentWeight + effectiveAlpha * (1.0 - currentWeight);
    return Math.min(1.0, Math.max(0.0, Number(newWeight.toFixed(6))));
  }

  /**
   * Calculates new weight following one tick of inactivity.
   * Exponential decay: w_{t+1} = max(0.0, w_t * (1 - lambda))
   *
   * Input: currentWeight in [0, 1]
   * Output: newWeight in [0, 1]
   * Time Complexity: O(1)
   */
  public calculateDecayedWeight(currentWeight: number): number {
    const newWeight = currentWeight * (1.0 - this.config.decayRate);
    if (newWeight < this.config.removalThreshold) {
      return 0.0;
    }
    return Math.min(1.0, Math.max(0.0, Number(newWeight.toFixed(6))));
  }

  /**
   * Derives categorical lifecycle status from scalar edge weight.
   * Time Complexity: O(1)
   */
  public deriveStatus(weight: number, consecutiveDormantTicks: number = 0): EdgeStatus {
    if (
      weight <= this.config.removalThreshold ||
      consecutiveDormantTicks >= this.config.dormantTicksBeforePruning
    ) {
      return 'removed';
    }
    if (weight >= this.config.activeThreshold) {
      return 'active';
    }
    if (weight >= this.config.weakThreshold) {
      return 'weak';
    }
    return 'dormant';
  }
}
