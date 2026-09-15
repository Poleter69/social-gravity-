/**
 * Social Gravity V2 - Edge Weight Engine
 *
 * Transforms raw dyadic events (messages, replies, reactions, mentions, edits)
 * into calibrated transmission weights w in [0, 1] via configurable weighting profiles.
 */

import { CanonicalInteraction, WeightingProfile } from '../schemas';

export const DEFAULT_WEIGHTING_PROFILE: WeightingProfile = {
  name: 'default',
  defaultWeight: 0.3,
  weights: {
    friendship: 0.85,
    direct_message: 1.0,
    message: 0.8,
    mention: 0.7,
    share: 0.6,
    reply: 0.5,
    talk_edit: 0.7,
    hierarchy: 0.85,
    follow: 0.4,
    reaction: 0.2,
    co_membership: 0.3,
  },
  saturationCap: 1.0,
  recencyHalfLifeDays: 30,
};

export const REDDIT_WEIGHTING_PROFILE: WeightingProfile = {
  name: 'reddit',
  defaultWeight: 0.4,
  weights: {
    reply: 0.6,
    mention: 0.75,
    quote: 0.5,
    upvote: 0.15,
  },
  saturationCap: 1.0,
};

export const DISCORD_WEIGHTING_PROFILE: WeightingProfile = {
  name: 'discord',
  defaultWeight: 0.3,
  weights: {
    direct_message: 1.0,
    reply: 0.65,
    mention: 0.8,
    reaction: 0.25,
    thread_message: 0.5,
  },
  saturationCap: 1.0,
};

export const SLACK_WEIGHTING_PROFILE: WeightingProfile = {
  name: 'slack',
  defaultWeight: 0.4,
  weights: {
    direct_message: 1.0,
    thread_reply: 0.7,
    mention: 0.85,
    channel_broadcast: 0.3,
    reaction: 0.2,
  },
  saturationCap: 1.0,
};

export class EdgeWeightEngine {
  private profile: WeightingProfile;

  constructor(profile: Partial<WeightingProfile> = {}) {
    this.profile = {
      ...DEFAULT_WEIGHTING_PROFILE,
      ...profile,
      weights: {
        ...DEFAULT_WEIGHTING_PROFILE.weights,
        ...(profile.weights || {}),
      },
    };
  }

  public getProfile(): Readonly<WeightingProfile> {
    return this.profile;
  }

  /**
   * Computes individual interaction weight.
   */
  public getInteractionWeight(type: string): number {
    return this.profile.weights[type] ?? this.profile.defaultWeight;
  }

  /**
   * Aggregates a series of dyadic interactions into a unified transmission weight in [0, 1].
   * Uses exponential saturation function: w = 1 - exp(- (sum_i w_i) / K)
   *
   * Input: array of CanonicalInteraction between u and v
   * Output: aggregated weight in [0, 1]
   */
  public aggregateWeight(interactions: CanonicalInteraction[]): number {
    if (interactions.length === 0) {
      return this.profile.defaultWeight;
    }

    // Sum base weights
    let totalScore = 0;
    for (const inter of interactions) {
      const baseW = this.profile.weights[inter.type] ?? inter.weight ?? this.profile.defaultWeight;
      totalScore += baseW;
    }

    // Asymptotic saturation: 1 - exp(-totalScore / 3.0)
    const saturated = 1.0 - Math.exp(-totalScore / 3.0);
    const capped = Math.min(this.profile.saturationCap, Math.max(0.05, saturated));

    return Number(capped.toFixed(4));
  }
}
