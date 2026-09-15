/**
 * Social Gravity - Multi-Domain Adapter Registry
 *
 * Implements Milestone M7:
 * Modular domain specifications for finance, cybersecurity, emergency, enterprise, and supply chain.
 */

import { Society } from '../society/types/society';
import { InformationSignal } from '../psychology/types';
import { societyGenerator } from '../society/generators/societyGenerator';
import { DomainType, DomainSpecification } from './types';

export class DomainRegistry {
  private static domains: Map<DomainType, DomainSpecification> = new Map([
    [
      'financial_panic',
      {
        domain: 'financial_panic',
        name: 'Financial Liquidity & Depositor Contagion',
        description: 'Models run-on-the-bank cascades, margin calls, and systemic insolvency panics across core-periphery financial networks.',
        recommendedTopology: 'core_periphery',
        psychologicalPriors: {
          defaultTrust: 0.65,
          defaultConformity: 0.78,
          defaultRiskTolerance: 0.25, // Extreme loss aversion
        },
        defaultSignals: [
          {
            topic: 'Emergency Lender Facility Freeze',
            content: 'Federal regulator halting weekend liquidity transfers amid undisclosed balance-sheet impairment.',
            emotionalSalience: 0.95,
            emotionTag: 'Panic',
            severity: 'CRITICAL',
          },
        ],
        interventionProtocols: [
          'Coordinate joint central bank discount window liquidity guarantee.',
          'Brief tier-1 venture and institutional deposit anchors before market open.',
          'Temporarily throttle digital withdrawal velocity to suppress panic contagion.',
        ],
      },
    ],
    [
      'cybersecurity_incident',
      {
        domain: 'cybersecurity_incident',
        name: 'Cybersecurity Breach & Zero-Day Escalation',
        description: 'Models active exploitation rumors, ransomware extortion disclosures, and internal SOC panic.',
        recommendedTopology: 'hierarchical',
        psychologicalPriors: {
          defaultTrust: 0.80,
          defaultConformity: 0.45,
          defaultRiskTolerance: 0.30,
        },
        defaultSignals: [
          {
            topic: 'Pre-Auth RCE Gateway Zero-Day',
            content: 'Active unauthenticated remote code execution exploit observed across external perimeter clusters.',
            emotionalSalience: 0.92,
            emotionTag: 'Urgency',
            severity: 'CRITICAL',
          },
        ],
        interventionProtocols: [
          'Pre-emptively rotate all identity provider cryptographic token signing certificates.',
          'Issue signed security bulletin to engineering and DevOps gatekeepers.',
          'Isolate external border ingress gateways to quarantine suspicious payload traffic.',
        ],
      },
    ],
    [
      'emergency_communication',
      {
        domain: 'emergency_communication',
        name: 'Civil Emergency & Critical Evacuation',
        description: 'Models flood, wildfire, chemical hazard, and critical infrastructure evacuation compliance.',
        recommendedTopology: 'spatial_grid',
        psychologicalPriors: {
          defaultTrust: 0.70,
          defaultConformity: 0.65,
          defaultRiskTolerance: 0.35,
        },
        defaultSignals: [
          {
            topic: 'Mandatory Flash Hazard Evacuation',
            content: 'Zone 4 spillway failure imminent. Immediate evacuation ordered via Highway 101 North corridor.',
            emotionalSalience: 0.98,
            emotionTag: 'Fear',
            severity: 'CRITICAL',
          },
        ],
        interventionProtocols: [
          'Deploy multi-channel emergency alert system broadcast to all municipal cellular towers.',
          'Inoculate key neighborhood civic wardens with verified route clearance maps.',
          'Debunk unofficial shortcut rumors causing bottlenecks on impassable secondary bridges.',
        ],
      },
    ],
    [
      'organizational_rumor',
      {
        domain: 'organizational_rumor',
        name: 'Enterprise M&A & Workforce Contagion',
        description: 'Models corporate restructuring leaks, executive departures, and internal productivity paralysis.',
        recommendedTopology: 'hierarchical',
        psychologicalPriors: {
          defaultTrust: 0.50,
          defaultConformity: 0.70,
          defaultRiskTolerance: 0.40,
        },
        defaultSignals: [
          {
            topic: 'Hostile Acquisition & Redundancy Leak',
            content: 'Leaked board slide indicates planned 40% engineering headcount redundancy following acquisition.',
            emotionalSalience: 0.88,
            emotionTag: 'Nervousness',
            severity: 'HIGH',
          },
        ],
        interventionProtocols: [
          'Host mandatory all-hands session with executive team within 4 hours.',
          'Provide frontline engineering directors with verified retention roadmaps.',
          'Establish open anonymous Q&A forum to address salary and vesting uncertainties.',
        ],
      },
    ],
    [
      'supply_chain_disruption',
      {
        domain: 'supply_chain_disruption',
        name: 'Supply Chain Bottleneck & Hoarding Cascade',
        description: 'Models component shortages, maritime canal closures, and panic inventory hoarding.',
        recommendedTopology: 'bipartite',
        psychologicalPriors: {
          defaultTrust: 0.55,
          defaultConformity: 0.82,
          defaultRiskTolerance: 0.28,
        },
        defaultSignals: [
          {
            topic: 'Rare Earth Critical Export Freeze',
            content: 'Key mineral supplier declares force majeure; global fabrication inventory depleted in 21 days.',
            emotionalSalience: 0.91,
            emotionTag: 'Surprise',
            severity: 'HIGH',
          },
        ],
        interventionProtocols: [
          'Enforce contractual order quota caps to prevent inventory hoarding panic.',
          'Publish third-party audited warehouse inventory reserve figures.',
          'Activate qualified secondary supplier logistics corridors.',
        ],
      },
    ],
  ]);

  public static getDomain(domain: DomainType): DomainSpecification {
    const spec = this.domains.get(domain);
    if (!spec) throw new Error(`Domain ${domain} not registered in Social Gravity.`);
    return spec;
  }

  public static getAllDomains(): DomainSpecification[] {
    return Array.from(this.domains.values());
  }

  /**
   * Instantiates a domain-calibrated Society with tailored psychological priors and topology.
   */
  public static instantiateDomainSociety(
    domain: DomainType,
    populationSize = 80,
    seed = 42
  ): Society {
    const spec = this.getDomain(domain);
    const archetypeMap: Record<string, 'school' | 'workplace' | 'city' | 'online_community'> = {
      core_periphery: 'workplace',
      hierarchical: 'workplace',
      spatial_grid: 'city',
      scale_free: 'online_community',
      bipartite: 'city',
    };

    const archetype = archetypeMap[spec.recommendedTopology] || 'workplace';

    const society = societyGenerator.generate({
      name: `${spec.name} Network`,
      archetype,
      populationSize,
      seed,
    });

    // Modulate agent traits with domain priors
    const priors = spec.psychologicalPriors;
    society.agents.forEach(a => {
      a.traits.trust = Number((a.traits.trust * 0.4 + priors.defaultTrust * 0.6).toFixed(3));
      a.traits.conformity = Number((a.traits.conformity * 0.4 + priors.defaultConformity * 0.6).toFixed(3));
      a.traits.riskTolerance = Number((a.traits.riskTolerance * 0.4 + priors.defaultRiskTolerance * 0.6).toFixed(3));
    });

    return society;
  }

  /**
   * Generates a domain-specific threat signal.
   */
  public static createDomainSignal(
    domain: DomainType,
    signalIndex = 0,
    senderId = 'domain_patient_zero'
  ): InformationSignal {
    const spec = this.getDomain(domain);
    const template = spec.defaultSignals[signalIndex] || spec.defaultSignals[0];

    return {
      id: `sig_${domain}_${Date.now()}`,
      topic: template.topic,
      content: template.content,
      veracity: 'false',
      emotionalSalience: template.emotionalSalience,
      complexity: 0.25,
      senderId,
      round: 0,
    };
  }
}
