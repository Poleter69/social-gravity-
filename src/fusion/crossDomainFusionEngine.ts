/**
 * Social Gravity - Cross-Domain Fusion Engine (M15)
 * 
 * Constructs a Unified Intelligence Graph connecting financial panics,
 * cybersecurity zero-days, emergency crises, enterprise leaks, and geopolitical narratives.
 * Quantifies directional spillover using Transfer Entropy and entity co-occurrence.
 */

import { 
  ExtendedDomainType, 
  CrossDomainSignal, 
  CrossDomainCouplingEdge, 
  CrossDomainCascadeEvent, 
  UnifiedIntelligenceGraph, 
  CrossDomainCorrelationReport 
} from './types';

export class CrossDomainFusionEngine {
  private signals: CrossDomainSignal[];
  private couplings: CrossDomainCouplingEdge[];
  private spillovers: CrossDomainCascadeEvent[];

  constructor() {
    this.signals = [];
    this.couplings = [];
    this.spillovers = [];
  }

  /**
   * Ingests an event signal from any domain into the unified intelligence pipeline.
   */
  public ingestSignal(signal: CrossDomainSignal): void {
    this.signals.push(signal);
  }

  /**
   * Calculates directional Transfer Entropy from source domain to target domain
   * Models the degree to which knowing past states of source domain reduces
   * uncertainty in the future trajectory of target domain.
   */
  public computeTransferEntropy(
    sourceDomain: ExtendedDomainType,
    targetDomain: ExtendedDomainType
  ): { teBits: number; correlationScore: number; lagTicks: number; sharedEntities: string[] } {
    const srcSignals = this.signals.filter(s => s.domain === sourceDomain);
    const tgtSignals = this.signals.filter(s => s.domain === targetDomain);

    if (srcSignals.length === 0 || tgtSignals.length === 0) {
      return { teBits: 0, correlationScore: 0, lagTicks: 0, sharedEntities: [] };
    }

    // Find shared named entities across domains
    const srcEntities = new Set(srcSignals.flatMap(s => s.entities));
    const shared = tgtSignals.flatMap(s => s.entities).filter(e => srcEntities.has(e));
    const uniqueShared = Array.from(new Set(shared));

    // Calculate temporal alignment and average lag
    let totalLag = 0;
    let lagPairs = 0;
    for (const src of srcSignals) {
      for (const tgt of tgtSignals) {
        if (tgt.timestamp > src.timestamp) {
          totalLag += (tgt.timestamp - src.timestamp);
          lagPairs++;
        }
      }
    }
    const avgLag = lagPairs > 0 ? Number((totalLag / lagPairs).toFixed(1)) : 2.0;

    // Transfer entropy heuristic calculation (Information bits)
    const entityOverlapBoost = Math.min(0.5, uniqueShared.length * 0.15);
    const velocityAmplification = (srcSignals.reduce((acc, s) => acc + s.propagationVelocity, 0) / srcSignals.length) * 0.1;
    const teBits = Number((0.25 + entityOverlapBoost + velocityAmplification).toFixed(3));
    const correlationScore = Number(Math.min(0.98, (0.4 + entityOverlapBoost + (teBits * 0.4))).toFixed(2));

    return {
      teBits,
      correlationScore,
      lagTicks: Math.max(1, Math.round(avgLag)),
      sharedEntities: uniqueShared,
    };
  }

  /**
   * Correlates all registered domain signals into unified coupling edges.
   */
  public correlateDomains(): CrossDomainCorrelationReport {
    this.couplings = [];
    this.spillovers = [];

    const domains: ExtendedDomainType[] = [
      'cybersecurity_incident',
      'financial_panic',
      'emergency_communication',
      'organizational_rumor',
      'supply_chain_disruption',
      'geopolitical_narrative',
    ];

    // Evaluate pair-wise directional cross-domain spillover potentials
    for (const src of domains) {
      for (const tgt of domains) {
        if (src === tgt) continue;
        const metrics = this.computeTransferEntropy(src, tgt);
        if (metrics.correlationScore > 0.45) {
          const mechanism = this.determineSpilloverMechanism(src, tgt);
          this.couplings.push({
            sourceDomain: src,
            targetDomain: tgt,
            correlationScore: metrics.correlationScore,
            transferEntropy: metrics.teBits,
            estimatedLagTicks: metrics.lagTicks,
            sharedEntities: metrics.sharedEntities,
            spilloverMechanism: mechanism,
          });

          // Detect active or imminent cascade spillovers
          const latestSrc = this.signals.filter(s => s.domain === src).pop();
          if (latestSrc && latestSrc.fearSalience > 0.7) {
            this.spillovers.push({
              primaryDomain: src,
              secondaryDomain: tgt,
              spilloverTick: latestSrc.timestamp + metrics.lagTicks,
              couplingStrength: metrics.correlationScore,
              triggerHeadline: latestSrc.headline,
              spilloverConsequence: `Projected secondary shock in ${tgt.replace('_', ' ')} with ${metrics.teBits} bits transfer coupling.`,
            });
          }
        }
      }
    }

    // Sort couplings by information strength
    this.couplings.sort((a, b) => b.transferEntropy - a.transferEntropy);

    // Calculate systemic contagion index (aggregate network vulnerability across domains)
    const systemicContagionIndex = Number(
      Math.min(1.0, (this.couplings.length * 0.12) + (this.spillovers.length * 0.15)).toFixed(2)
    );

    const assessment = this.spillovers.length > 0
      ? `CRITICAL CROSS-DOMAIN WARNING: Detected ${this.spillovers.length} cascading spillover channels. Primary driver: ${this.spillovers[0].primaryDomain} -> ${this.spillovers[0].secondaryDomain}.`
      : 'Systemic contagion channels monitored. All cross-domain transfer entropy couplings remain below critical excitation thresholds.';

    return {
      timestamp: Date.now(),
      analyzedSignalCount: this.signals.length,
      couplingCount: this.couplings.length,
      systemicContagionIndex,
      topCrossDomainCouplings: this.couplings.slice(0, 5),
      predictedUpcomingSpillovers: this.spillovers,
      executiveRiskAssessment: assessment,
    };
  }

  /**
   * Returns complete Unified Intelligence Graph representation
   */
  public getUnifiedGraph(): UnifiedIntelligenceGraph {
    const activeDomains = Array.from(new Set(this.signals.map(s => s.domain)));
    const correlation = this.correlateDomains();

    return {
      activeDomains,
      registeredSignals: this.signals,
      couplingEdges: this.couplings,
      cascadingSpillovers: this.spillovers,
      systemicContagionIndex: correlation.systemicContagionIndex,
    };
  }

  private determineSpilloverMechanism(src: ExtendedDomainType, tgt: ExtendedDomainType): string {
    if (src === 'cybersecurity_incident' && tgt === 'financial_panic') {
      return 'Cloud / transaction gateway downtime triggers panic liquidity withdrawals.';
    }
    if (src === 'supply_chain_disruption' && tgt === 'financial_panic') {
      return 'Critical resource shortages trigger commodity price spikes & equity dumping.';
    }
    if (src === 'geopolitical_narrative' && tgt === 'cybersecurity_incident') {
      return 'Geopolitical tension escalates state-sponsored retaliatory DDoS & defacements.';
    }
    if (src === 'organizational_rumor' && tgt === 'financial_panic') {
      return 'Executive fraud / restructuring rumor leads to immediate stock sell-off.';
    }
    return `Cross-sector informational resonance and investor / public sentiment contagion.`;
  }
}
