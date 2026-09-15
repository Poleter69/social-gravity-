/**
 * Social Gravity - Society Resilience Scorer
 * Computes an overarching 0-100 Resilience Score and multi-axial defense breakdown
 * quantifying how effectively a society repels, isolates, or extinguishes misinformation.
 */

import { ExperimentTelemetry, ResilienceScore } from './types';

export class ResilienceScorer {
  /**
   * Evaluates the multi-axial resilience of a simulated society based on its experiment telemetry.
   */
  public static calculate(telemetry: ExperimentTelemetry): ResilienceScore {
    // 1. Epistemic Trust Defense (0 - 100)
    // High trust in verified sources + healthy resistance rate
    const trustScore = Math.min(1.0, telemetry.averageTrust * 1.1);
    const resistanceBonus = Math.min(1.0, telemetry.resistanceRate * 2.5);
    const epistemicTrustDefense = Math.round(
      Math.max(0, Math.min(100, (0.55 * trustScore + 0.45 * resistanceBonus) * 100))
    );

    // 2. Topological Containment (0 - 100)
    // Network's ability to bottleneck contagion within isolated clusters
    const bridgePenetrationPenalty = telemetry.bridgeInfectionRatio * 0.55;
    const overallAdoptionPenalty = telemetry.adoptionRate * 0.45;
    const topologicalContainment = Math.round(
      Math.max(0, Math.min(100, (1.0 - (bridgePenetrationPenalty + overallAdoptionPenalty)) * 100))
    );

    // 3. Emotional Composure (0 - 100)
    // Resistance against fear-salience / moral panic manipulation
    const fearExploitation = telemetry.rumorFearSalience * telemetry.adoptionRate;
    const emotionalComposure = Math.round(
      Math.max(0, Math.min(100, (1.0 - fearExploitation) * 100))
    );

    // 4. Intervention Receptivity (0 - 100)
    // Responsiveness to fact-checking and debunking inoculation
    let interventionReceptivity: number;
    if (telemetry.hasIntervention) {
      const debunkAdoption = Math.min(1.0, telemetry.debunkRate * 3.5);
      const r0Collapse = telemetry.finalR0 <= 0.8 ? 0.9 : Math.max(0, 1.0 - telemetry.finalR0 / 2.0);
      interventionReceptivity = Math.round(
        Math.max(0, Math.min(100, (0.6 * debunkAdoption + 0.4 * r0Collapse) * 100))
      );
    } else {
      // If no intervention deployed, evaluate natural extinction capacity
      const naturalExtinction = telemetry.finalR0 === 0 ? 0.85 : Math.max(0, 1.0 - telemetry.finalR0 / 2.0);
      interventionReceptivity = Math.round(naturalExtinction * 75);
    }

    // 5. Composite Weighted Score
    const overall = Math.round(
      0.30 * epistemicTrustDefense +
      0.25 * topologicalContainment +
      0.20 * emotionalComposure +
      0.25 * interventionReceptivity
    );

    let rating: ResilienceScore['rating'];
    let explanation: string;

    if (overall >= 85) {
      rating = 'Immune';
      explanation = `The society exhibited robust immune defense; peer verification and high dyadic trust rapidly extinguished transmission chains.`;
    } else if (overall >= 70) {
      rating = 'Robust Defense';
      explanation = `Strong structural and epistemic containment prevented widespread cascade penetration, isolating the rumor within peripheral nodes.`;
    } else if (overall >= 50) {
      rating = 'Moderate Resilience';
      explanation = `Mixed resilience profile: while local communities demonstrated skepticism, inter-community bridges allowed partial cross-cluster leakage.`;
    } else if (overall >= 30) {
      rating = 'Fragile';
      explanation = `Fragile social fabric: low baseline trust and high fear salience allowed the rumor to rapidly overcome normative conformity barriers.`;
    } else {
      rating = 'Critical Vulnerability';
      explanation = `Critical vulnerability detected: structural bridges and hyper-influential hubs amplified misinformation across all community clusters with minimal resistance.`;
    }

    return {
      overall,
      rating,
      subScores: {
        epistemicTrustDefense,
        topologicalContainment,
        emotionalComposure,
        interventionReceptivity,
      },
      explanation,
    };
  }
}
