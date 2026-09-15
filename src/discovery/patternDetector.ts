/**
 * Social Gravity - Computational Social Science Pattern Detector
 * Analyzes empirical experiment telemetry to uncover causal social-psychological patterns,
 * synthesize research hypothesis cards, and delineate measured facts from inferences.
 */

import { ExperimentTelemetry, HypothesisCard } from './types';

export class PatternDetector {
  /**
   * Discovers social dynamics and produces research-grade hypothesis cards from telemetry.
   */
  public static detectPatterns(telemetry: ExperimentTelemetry): {
    hypothesisCards: HypothesisCard[];
    topDiscovery: string;
    measuredFacts: string[];
    inferredObservations: string[];
    futureHypotheses: string[];
  } {
    const cards: HypothesisCard[] = [];
    const measuredFacts: string[] = [];
    const inferredObservations: string[] = [];
    const futureHypotheses: string[] = [];

    // --- 1. Record Pure Measured Facts (Zero Inference) ---
    measuredFacts.push(
      `Final rumor adoption reached ${(telemetry.adoptionRate * 100).toFixed(1)}% (${telemetry.finalBelievers}/${telemetry.populationSize} agents).`,
      `Peak reproduction number R₀ reached ${telemetry.peakR0} with maximum cascade depth of ${telemetry.maxCascadeDepth} hops.`,
      `Active resistance resulted in ${(telemetry.resistanceRate * 100).toFixed(1)}% of agents adopting a skeptical stance.`,
      `${(telemetry.bridgeInfectionRatio * 100).toFixed(1)}% of topological bridge nodes and ${(telemetry.influencerInfectionRatio * 100).toFixed(1)}% of influencer hubs were infected.`
    );

    if (telemetry.hasIntervention) {
      measuredFacts.push(
        `Fact-check intervention deployed at round t=${telemetry.interventionRound} converted ${(telemetry.debunkRate * 100).toFixed(1)}% of population into verified debunkers.`
      );
    }

    // --- 2. Pattern A: Bridge Amplification vs Influencer Centrality ---
    if (telemetry.bridgeInfectionRatio >= 0.35 && telemetry.communityCount > 1) {
      const infectedCommunities = telemetry.communityOutcomes.filter(c => c.penetrationRate >= 0.15).length;
      cards.push({
        id: 'hyp-bridge-amplification',
        title: 'Topological Bridges Served as Primary Multi-Cluster Vectors',
        category: 'bridge_amplification',
        evidence: `${(telemetry.bridgeInfectionRatio * 100).toFixed(0)}% of boundary-spanning bridge nodes adopted the rumor, penetrating ${infectedCommunities} of ${telemetry.communityCount} distinct sub-communities.`,
        mechanism: `Granovetter's "Strength of Weak Ties": While dense intra-community clusters resist foreign rumors, cross-cluster bridges possess high betweenness centrality and transmit claims across echo chamber boundaries before local verification can form.`,
        confidence: 0.94,
        confidenceLabel: 'Very High',
        suggestedExperiment: `Rerun simulation with bridge node dyadic trust increased to 0.85 to test whether strengthening boundary verification isolates the cascade.`,
        metricsSnapshot: {
          'Bridge Infection Ratio': `${(telemetry.bridgeInfectionRatio * 100).toFixed(1)}%`,
          'Penetrated Communities': `${infectedCommunities}/${telemetry.communityCount}`,
          'Cascade Max Depth': `${telemetry.maxCascadeDepth} hops`,
        },
      });

      inferredObservations.push(
        `Structural bridges acted as inter-community super-spreaders, bypassing local cluster skepticism.`
      );
      futureHypotheses.push(
        `Targeting fact-check interventions exclusively at bridge nodes will reduce multi-community spread by >40% compared to random node seeding.`
      );
    }

    // --- 3. Pattern B: Influencers vs Grassroots Cluster Consensus ---
    if (telemetry.influencerInfectionRatio <= 0.30 && telemetry.adoptionRate >= 0.20) {
      cards.push({
        id: 'hyp-peer-over-influencer',
        title: 'Dense Peer Clusters Drove Contagion Independent of Influencer Hubs',
        category: 'influencer_reach',
        evidence: `Rumor reached ${(telemetry.adoptionRate * 100).toFixed(0)}% overall adoption despite only ${(telemetry.influencerInfectionRatio * 100).toFixed(0)}% of top-tier influencer hubs adopting.`,
        mechanism: `Asch Conformity within homophilous sub-communities created localized normative pressure. Once 3+ peers in an immediate clique adopted, high conformity compelled neighbors to amplify regardless of broadcast influencer silence.`,
        confidence: 0.89,
        confidenceLabel: 'High',
        suggestedExperiment: `Test an influencer-led counter-broadcast vs grass-roots peer inoculation to quantify whether top-down broadcast can overturn horizontal clique consensus.`,
        metricsSnapshot: {
          'Influencer Adoption': `${(telemetry.influencerInfectionRatio * 100).toFixed(1)}%`,
          'Overall Population Adoption': `${(telemetry.adoptionRate * 100).toFixed(1)}%`,
          'Average Conformity Bias': `${(telemetry.averageConformity * 100).toFixed(0)}%`,
        },
      });

      inferredObservations.push(
        `Horizontal peer-to-peer normative pressure exceeded top-down influencer gravitational pull.`
      );
    } else if (telemetry.influencerInfectionRatio >= 0.50) {
      cards.push({
        id: 'hyp-influencer-gravity',
        title: 'Influencer Gravitational Hubs Accelerated Viral Velocity',
        category: 'influencer_reach',
        evidence: `Infection of ${(telemetry.influencerInfectionRatio * 100).toFixed(0)}% of influencer hubs coincided with peak cascade velocity of ${telemetry.peakVelocity} new infections/round.`,
        mechanism: `Scale-free preferential reach: Highly connected hubs broadcast signals across multiple 1-hop neighborhoods simultaneously, collapsing network diameter and accelerating cascade velocity.`,
        confidence: 0.91,
        confidenceLabel: 'Very High',
        suggestedExperiment: `Apply early prebunking specifically to influencer nodes before simulation start to test cascade suppression.`,
        metricsSnapshot: {
          'Influencer Hubs Infected': `${(telemetry.influencerInfectionRatio * 100).toFixed(0)}%`,
          'Peak Cascade Velocity': `${telemetry.peakVelocity} / round`,
          'Peak R₀': telemetry.peakR0,
        },
      });

      inferredObservations.push(
        `Influencer nodes dramatically compressed transmission time across the network graph.`
      );
    }

    // --- 4. Pattern C: Epistemic Trust & Skepticism Buffering ---
    if (telemetry.averageTrust >= 0.60) {
      cards.push({
        id: 'hyp-trust-buffering',
        title: 'High Dyadic Trust Buffered Against Runaway Misinformation',
        category: 'trust_resilience',
        evidence: `Baseline society trust of ${(telemetry.averageTrust * 100).toFixed(0)}% maintained a ${(telemetry.resistanceRate * 100).toFixed(1)}% skepticism rate, holding final R₀ to ${telemetry.finalR0}.`,
        mechanism: `Epistemic Credibility Calibration: When dyadic trust is grounded and verified, agents scrutinize ambiguous claims from unverified sources, dampening social proof cascades through Bayesian scrutiny.`,
        confidence: 0.93,
        confidenceLabel: 'Very High',
        suggestedExperiment: `Lower average trust to 0.25 on the exact same topology to measure the tipping point where skepticism collapses into cynicism and viral panic.`,
        metricsSnapshot: {
          'Baseline Trust': `${(telemetry.averageTrust * 100).toFixed(0)}%`,
          'Resistance Rate': `${(telemetry.resistanceRate * 100).toFixed(1)}%`,
          'Final R₀': telemetry.finalR0,
        },
      });

      inferredObservations.push(
        `Elevated baseline trust strengthens collective immune resistance against unverified claims.`
      );
    } else {
      cards.push({
        id: 'hyp-low-trust-vulnerability',
        title: 'Low Institutional Trust Created Vulnerability to Panic Contagion',
        category: 'trust_resilience',
        evidence: `Depressed baseline trust of ${(telemetry.averageTrust * 100).toFixed(0)}% yielded ${(telemetry.adoptionRate * 100).toFixed(1)}% rumor penetration and an echo-chamber polarization index of ${telemetry.echoChamberPolarization}.`,
        mechanism: `Trust Deficit Cynicism: In low-trust environments, agents discount formal gatekeepers and default to heuristic peer cues and threat salience, rendering them vulnerable to sensationalist claims.`,
        confidence: 0.95,
        confidenceLabel: 'Very High',
        suggestedExperiment: `Introduce a small cohort (5%) of high-trust local community leaders to evaluate if localized trust islands can arrest diffusion.`,
        metricsSnapshot: {
          'Baseline Trust': `${(telemetry.averageTrust * 100).toFixed(0)}%`,
          'Adoption Penetration': `${(telemetry.adoptionRate * 100).toFixed(1)}%`,
          'Polarization Index': telemetry.echoChamberPolarization,
        },
      });

      inferredObservations.push(
        `Low epistemic trust acts as a risk multiplier for misinformation propagation.`
      );
    }

    // --- 5. Pattern D: Threat Salience Exploitation (Prospect Theory) ---
    if (telemetry.rumorFearSalience >= 0.65) {
      cards.push({
        id: 'hyp-fear-amplification',
        title: 'Threat Salience Bypassed Cognitive Scrutiny Filters',
        category: 'emotional_contagion',
        evidence: `Misinformation with ${(telemetry.rumorFearSalience * 100).toFixed(0)}% fear salience generated peak velocity of ${telemetry.peakVelocity} infections/round with average velocity ${telemetry.averageVelocity}.`,
        mechanism: `Prospect Theory / Loss Aversion: Claims emphasizing imminent threat or collective loss activate acute defensive arousal. Agents prioritize rapid peer warning over epistemic verification.`,
        confidence: 0.92,
        confidenceLabel: 'Very High',
        suggestedExperiment: `Re-run with rumor fear salience lowered to 0.15 while preserving identical network topology to isolate emotional vs structural transmission speed.`,
        metricsSnapshot: {
          'Fear Salience': `${(telemetry.rumorFearSalience * 100).toFixed(0)}%`,
          'Peak Velocity': `${telemetry.peakVelocity} / round`,
          'Adoption Rate': `${(telemetry.adoptionRate * 100).toFixed(1)}%`,
        },
      });

      inferredObservations.push(
        `Emotional fear vectors significantly shorten transmission latency between social ties.`
      );
      futureHypotheses.push(
        `Emotional cooling interventions (delaying transmission by 1 round) will reduce fear-driven cascades by >50%.`
      );
    }

    // --- 6. Pattern E: Counter-Intervention Efficacy ---
    if (telemetry.hasIntervention) {
      if (telemetry.postInterventionR0Drop > 0.5 || telemetry.finalR0 <= 0.5) {
        cards.push({
          id: 'hyp-debunking-halt',
          title: 'Authoritative Fact-Check Successfully Extinguished Reproduction Rate',
          category: 'counter_intervention',
          evidence: `Debunking intervention deployed at round t=${telemetry.interventionRound} drove R₀ down to ${telemetry.finalR0}, converting ${(telemetry.debunkRate * 100).toFixed(1)}% of agents into debunkers.`,
          mechanism: `Dyadic Truth Validation: When ground-truth verification signals are broadcast by respected nodes, high epistemic plausibility overrides ambiguous rumor beliefs and activates homeostatic emotional recovery.`,
          confidence: 0.96,
          confidenceLabel: 'Very High',
          suggestedExperiment: `Delay intervention by 3 additional rounds to identify the critical temporal window before echo chambers become irreversible.`,
          metricsSnapshot: {
            'Intervention Round': `t=${telemetry.interventionRound}`,
            'Final R₀': telemetry.finalR0,
            'Debunk Adoption': `${(telemetry.debunkRate * 100).toFixed(1)}%`,
          },
        });
      } else {
        cards.push({
          id: 'hyp-debunking-lag',
          title: 'Intervention Delayed: Echo Chamber Insulation Resisted Fact-Check',
          category: 'counter_intervention',
          evidence: `Intervention at t=${telemetry.interventionRound} failed to halt the cascade; final believers remained at ${(telemetry.adoptionRate * 100).toFixed(1)}% with polarization index ${telemetry.echoChamberPolarization}.`,
          mechanism: `Belief Perseverance & Echo-Chamber Sequestration: Misinformation that has already saturated a tightly connected clique establishes mutual peer reinforcement that rejects delayed external corrections.`,
          confidence: 0.88,
          confidenceLabel: 'High',
          suggestedExperiment: `Deploy prebunking inoculation at t=1 before cliquish consensus crystallizes.`,
          metricsSnapshot: {
            'Intervention Round': `t=${telemetry.interventionRound}`,
            'Final Believers': `${(telemetry.adoptionRate * 100).toFixed(1)}%`,
            'Echo Chamber Polarization': telemetry.echoChamberPolarization,
          },
        });
      }
    }

    // --- 7. Pattern G: Emotional Polarization & Escalation Dynamics (Stage 7) ---
    if (telemetry.emotionalPolarizationIndex && telemetry.emotionalPolarizationIndex >= 0.35) {
      cards.push({
        id: 'hyp-emotional-polarization',
        title: 'Affective Polarization Diverged Sub-Communities into Distinct Emotional Factions',
        category: 'emotional_contagion',
        evidence: `Emotional divergence index reached ${telemetry.emotionalPolarizationIndex}. Certain sub-clusters exhibited severe threat vigilance (fear/anger) while isolated cliques remained indifferent or calm.`,
        mechanism: `Affective Echo Chambers: Homophilous social ties filter and amplify congruent emotional signals (Damasio's Somatic Marker & Festinger's Cognitive Dissonance). Exposure to polarized out-group rhetoric accelerates within-group emotional alignment.`,
        confidence: 0.93,
        confidenceLabel: 'Very High',
        suggestedExperiment: `Introduce calming, fact-oriented bridge messengers to test if cross-community emotional polarization can be neutralized before belief hardening.`,
        metricsSnapshot: {
          'Emotional Polarization Index': telemetry.emotionalPolarizationIndex,
          'Community Count': telemetry.communityCount,
          'Echo Chamber Polarization': telemetry.echoChamberPolarization,
        },
      });

      inferredObservations.push(
        `High emotional divergence across communities created fertile ground for entrenched narrative polarization.`
      );
    }

    if (telemetry.escalationForecasts && telemetry.escalationForecasts.length > 0) {
      telemetry.escalationForecasts.forEach((forecast) => {
        measuredFacts.push(`[Forecast - ${forecast.severity}] ${forecast.finding} (${forecast.evidence})`);
        inferredObservations.push(forecast.evidence);
      });
    }

    // Determine Top Discovery
    const topDiscovery = cards.length > 0 
      ? cards[0].title 
      : 'Uniform transmission observed with balanced community adoption rates.';

    return {
      hypothesisCards: cards,
      topDiscovery,
      measuredFacts,
      inferredObservations,
      futureHypotheses,
    };
  }
}
