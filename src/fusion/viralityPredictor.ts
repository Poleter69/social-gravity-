/**
 * Social Gravity - Virality Prediction Engine
 * Milestone M19 (Stage 11): Early trend detection using velocity, emotional intensity, and bridge activation
 */

export interface ViralityForecastInput {
  commentVelocity: number; // comments per minute
  temporalAcceleration: number; // change in velocity over last window (e.g. +1.5x)
  emotionalIntensity: number; // 0 to 1.0 (weighted fear, anger, high arousal)
  bridgeNodeActivation: number; // number of bridge users engaged
  communityExpansion: number; // distinct communities crossed
  repostRatio: number; // 0 to 1.0 (share/repost volume ratio)
}

export interface ViralityForecast {
  probability: number; // 0 to 1.0 (e.g. 0.81 for 81%)
  expectedPeakTime: string; // e.g. "45 minutes"
  expectedReach: number; // projected agents / impressions
  confidence: number; // 0 to 1.0
  reasoning: string;
  projectedSpread: 'contained' | 'moderate' | 'high' | 'explosive';
  factors: {
    velocityScore: number;
    accelerationScore: number;
    emotionScore: number;
    bridgeScore: number;
    communityScore: number;
  };
}

export class ViralityPredictor {
  /**
   * Forecasts whether a narrative is likely to trend or achieve explosive cross-community reach.
   */
  public static forecast(input: ViralityForecastInput): ViralityForecast {
    // 1. Velocity score (0 to 1, normalized against 20 comments/min baseline)
    const velocityScore = Math.min(1.0, input.commentVelocity / 20.0);

    // 2. Acceleration score (1.0 = steady, >2.0 = fast compounding)
    const accelerationScore = Math.min(1.0, Math.max(0, (input.temporalAcceleration - 1.0) / 2.0));

    // 3. Emotion intensity (0 to 1.0)
    const emotionScore = Math.min(1.0, Math.max(0, input.emotionalIntensity));

    // 4. Bridge score (bridge users / 10 normalized)
    const bridgeScore = Math.min(1.0, input.bridgeNodeActivation / 8.0);

    // 5. Community expansion (communities / 5 normalized)
    const communityScore = Math.min(1.0, input.communityExpansion / 4.0);

    // Composite logistic probability calculation
    const logit =
      -2.0 +
      velocityScore * 2.2 +
      accelerationScore * 1.8 +
      emotionScore * 1.5 +
      bridgeScore * 2.5 +
      communityScore * 1.8 +
      input.repostRatio * 1.2;

    const probability = Number((1.0 / (1.0 + Math.exp(-logit))).toFixed(2));

    // Project expected peak time
    let expectedPeakMinutes = 60;
    if (probability > 0.85) {
      expectedPeakMinutes = Math.max(15, Math.round(35 - velocityScore * 15));
    } else if (probability > 0.65) {
      expectedPeakMinutes = Math.max(30, Math.round(55 - velocityScore * 20));
    } else {
      expectedPeakMinutes = Math.round(90 - velocityScore * 30);
    }

    // Project reach
    const expectedReach = Math.round(
      50 +
      input.commentVelocity * 15 +
      input.communityExpansion * 250 +
      input.bridgeNodeActivation * 180 +
      probability * 1500
    );

    // Confidence
    const confidence = Number(
      Math.min(0.95, 0.60 + communityScore * 0.15 + bridgeScore * 0.15 + (input.commentVelocity > 5 ? 0.10 : 0)).toFixed(2)
    );

    let projectedSpread: ViralityForecast['projectedSpread'] = 'contained';
    if (probability >= 0.80) projectedSpread = 'explosive';
    else if (probability >= 0.60) projectedSpread = 'high';
    else if (probability >= 0.35) projectedSpread = 'moderate';

    const reasoning = `${Math.round(probability * 100)}% chance this narrative crosses ${
      input.communityExpansion > 1 ? `${input.communityExpansion} communities` : 'adjacent communities'
    } within ${expectedPeakMinutes} minutes. ${
      bridgeScore > 0.5 ? 'Significant bridge-node activation detected.' : 'Contained within initial community.'
    }`;

    return {
      probability,
      expectedPeakTime: `${expectedPeakMinutes} minutes`,
      expectedReach,
      confidence,
      reasoning,
      projectedSpread,
      factors: {
        velocityScore: Number(velocityScore.toFixed(2)),
        accelerationScore: Number(accelerationScore.toFixed(2)),
        emotionScore: Number(emotionScore.toFixed(2)),
        bridgeScore: Number(bridgeScore.toFixed(2)),
        communityScore: Number(communityScore.toFixed(2)),
      },
    };
  }
}
