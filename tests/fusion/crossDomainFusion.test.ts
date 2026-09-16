/**
 * Social Gravity - Cross-Domain Fusion Tests (Milestone M15)
 * 
 * Verifies Unified Intelligence Graph construction, Transfer Entropy
 * directional coupling, shared entity extraction, and multi-domain spillover prediction.
 */

import { CrossDomainFusionEngine } from '../../src/fusion/crossDomainFusionEngine';
import { CrossDomainSignal } from '../../src/fusion/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testCrossDomainFusion() {
  console.log('\n--- Testing Milestone M15: Cross-Domain Fusion Engine ---');

  const fusionEngine = new CrossDomainFusionEngine();

  // 1. Ingest multi-domain signals
  const cyberSignal: CrossDomainSignal = {
    id: 'sig_cyber_01',
    domain: 'cybersecurity_incident',
    timestamp: 2,
    headline: 'Zero-day vulnerability confirmed in ApexCloudGateway transaction core',
    entities: ['ApexCloudGateway', 'BankingCore', 'AuthProtocol'],
    fearSalience: 0.88,
    propagationVelocity: 4.5,
    communitySpreadCount: 3,
  };

  const financeSignal: CrossDomainSignal = {
    id: 'sig_fin_01',
    domain: 'financial_panic',
    timestamp: 4,
    headline: 'Depositors report transaction failures at RegionalApex Bank, withdrawal lines forming',
    entities: ['ApexCloudGateway', 'RegionalApex', 'LiquidityRun'],
    fearSalience: 0.92,
    propagationVelocity: 6.0,
    communitySpreadCount: 5,
  };

  const supplySignal: CrossDomainSignal = {
    id: 'sig_supply_01',
    domain: 'supply_chain_disruption',
    timestamp: 5,
    headline: 'Container freight scheduling platform down across West Coast ports',
    entities: ['PortAuthority', 'LogisticsCore'],
    fearSalience: 0.65,
    propagationVelocity: 2.0,
    communitySpreadCount: 2,
  };

  fusionEngine.ingestSignal(cyberSignal);
  fusionEngine.ingestSignal(financeSignal);
  fusionEngine.ingestSignal(supplySignal);

  // 2. Transfer Entropy & Coupling Calculation
  console.log('  Computing directional Transfer Entropy between Cyber and Financial domains...');
  const teResult = fusionEngine.computeTransferEntropy('cybersecurity_incident', 'financial_panic');

  assert(teResult.teBits > 0, 'Transfer entropy bits must be positive');
  assert(teResult.correlationScore > 0.5, 'Correlation score must be strong given shared entity');
  assert(teResult.sharedEntities.includes('ApexCloudGateway'), 'Must identify shared entity ApexCloudGateway');
  assert(teResult.lagTicks >= 1, 'Lag ticks must reflect temporal difference');

  console.log(`  ✓ Directional Coupling Verified: Cyber -> Finance`);
  console.log(`    - Transfer Entropy: ${teResult.teBits} bits`);
  console.log(`    - Correlation Score: ${teResult.correlationScore}`);
  console.log(`    - Shared Entities: [${teResult.sharedEntities.join(', ')}]`);
  console.log(`    - Average Temporal Lag: ${teResult.lagTicks} ticks`);

  // 3. Correlate Domains & Predict Spillovers
  console.log('  Executing Unified Graph multi-domain correlation...');
  const report = fusionEngine.correlateDomains();
  assert(report.couplingCount > 0, 'Must identify active cross-domain couplings');
  assert(report.predictedUpcomingSpillovers.length > 0, 'Must predict imminent spillover');
  assert(report.systemicContagionIndex > 0, 'Systemic contagion index must be computed');

  const spillover = report.predictedUpcomingSpillovers[0];
  console.log(`  ✓ Imminent Spillover Forecasted: [Tick ${spillover.spilloverTick}] ${spillover.primaryDomain} -> ${spillover.secondaryDomain}`);
  console.log(`    ↳ "${spillover.spilloverConsequence}"`);

  // 4. Unified Graph Export
  const unifiedGraph = fusionEngine.getUnifiedGraph();
  assert(unifiedGraph.activeDomains.length === 3, 'Must track 3 active domains');
  assert(unifiedGraph.registeredSignals.length === 3, 'Must contain all registered signals');
  console.log(`  ✓ Unified Intelligence Graph Generated: ${unifiedGraph.activeDomains.length} domains, ${unifiedGraph.couplingEdges.length} couplings, Systemic Index=${unifiedGraph.systemicContagionIndex}`);

  console.log('✓ Cross-Domain Fusion Engine validated successfully.');
}
