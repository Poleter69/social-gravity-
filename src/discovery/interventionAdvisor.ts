/**
 * Social Gravity - Strategic Intervention Recommendation Engine
 * Analyzes topological bottlenecks and behavioral vulnerabilities to recommend
 * the single most effective counter-misinformation intervention strategy.
 */

import { ExperimentTelemetry, InterventionRecommendation } from './types';

export class InterventionAdvisor {
  /**
   * Recommends the single optimal intervention strategy tailored to the simulation's empirical dynamics.
   */
  public static recommend(telemetry: ExperimentTelemetry): InterventionRecommendation {
    // 1. Diagnosis: Bridge Contagion Conduit
    if (telemetry.bridgeInfectionRatio >= 0.35 && telemetry.communityCount > 1) {
      return {
        id: 'rec-bridge-quarantine',
        title: 'Fortify and Inoculate Boundary Spanners (Bridge Nodes)',
        targetType: 'bridge_nodes',
        priority: 'CRITICAL',
        rationale: `Telemetric analysis revealed that ${(telemetry.bridgeInfectionRatio * 100).toFixed(0)}% of cross-community bridge nodes adopted the rumor, acting as informational vectors that infected ${telemetry.communityOutcomes.filter(c => c.penetrationRate >= 0.15).length} distinct sub-communities. Rather than attempting a broad mass broadcast, deploying fact-checking verification directly to bridge agents creates topological firewalls that quarantine the rumor within its origin cluster.`,
        expectedImpact: `Reduces inter-community cascade transmission by 55–75% and limits maximum cascade depth to <= 3 hops.`,
        simulationRecipe: `In the Inoculation panel, select "Bridge Node" as the injection target, or rerun with high baseline trust across cross-community edges.`,
      };
    }

    // 2. Diagnosis: Emotional Panic Exploit (Prospect Theory)
    if (telemetry.rumorFearSalience >= 0.70 && telemetry.peakVelocity >= 3) {
      return {
        id: 'rec-emotional-friction',
        title: 'Introduce Transmission Friction & Emotional Cooling Delays',
        targetType: 'delay_broadcast',
        priority: 'HIGH',
        rationale: `The rumor's ${(telemetry.rumorFearSalience * 100).toFixed(0)}% fear salience exploited loss aversion, bypassing epistemic scrutiny and driving a peak transmission velocity of ${telemetry.peakVelocity} new infections per round. Immediate sharing occurred before agents could evaluate source credibility. Enforcing a transmission friction delay allows natural emotional homeostasis to subside panic and restore calm.`,
        expectedImpact: `Lowers peak velocity by >45% and increases skepticism rates by >30% as agents regain cognitive composure.`,
        simulationRecipe: `Increase transmission delay min/max parameters to 2-3 rounds to model informational friction and verification pauses.`,
      };
    }

    // 3. Diagnosis: Echo-Chamber Polarization & Normative Herd Behavior
    if (telemetry.averageConformity >= 0.65 && telemetry.echoChamberPolarization >= 0.40) {
      return {
        id: 'rec-seed-skeptics',
        title: 'Seed Vocal Decentralized Skeptics in Dense Cliques',
        targetType: 'local_clusters',
        priority: 'HIGH',
        rationale: `High conformity (${(telemetry.averageConformity * 100).toFixed(0)}%) triggered Asch conformity cascades in dense sub-communities, establishing an echo-chamber polarization index of ${telemetry.echoChamberPolarization}. Within close-knit cliques, agents conform to local majority signals. Seeding even 2 vocal skeptics per cluster punctures perceived consensus unanimity and empowers independent evaluation.`,
        expectedImpact: `Disrupts normative conformity cascades, reducing intra-cluster adoption by 40–60%.`,
        simulationRecipe: `Lower the Conformity Pressure slider to 0.45 or inject counter-narratives into the most polarized sub-communities.`,
      };
    }

    // 4. Diagnosis: Low Institutional Trust Deficit
    if (telemetry.averageTrust <= 0.45) {
      return {
        id: 'rec-local-messengers',
        title: 'Deploy Trusted Peer Messengers Over Institutional Broadcasts',
        targetType: 'local_clusters',
        priority: 'HIGH',
        rationale: `With average baseline trust at only ${(telemetry.averageTrust * 100).toFixed(0)}%, institutional broadcasts are reflexively discounted. Agents default to horizontal peer relationships. Interventions must originate from local peers with high dyadic credibility rather than top-down authority nodes.`,
        expectedImpact: `Increases fact-check adoption rate from <10% to >40% by avoiding the institutional cynicism trap.`,
        simulationRecipe: `Raise baseline epistemic trust to 0.65+, or inoculate localized high-clustering peers directly.`,
      };
    }

    // 5. Default: Proactive Prebunking Protocol
    return {
      id: 'rec-proactive-prebunking',
      title: 'Deploy Proactive Inoculation (Prebunking) Protocol',
      targetType: 'prebunking',
      priority: 'MEDIUM',
      rationale: `The society already demonstrated resilient structural and epistemic properties (final R₀=${telemetry.finalR0}). In this regime, releasing prebunking educational signals prior to or simultaneous with rumor onset (t=0) equips agents with proactive debunking templates that eliminate patient-zero secondary infections entirely.`,
      expectedImpact: `Terminates transmission cascade at round t=1 with R₀ collapsing to 0.`,
      simulationRecipe: `Deploy fact-check intervention at t=0 to neutralize patient-zero reach.`,
    };
  }
}
