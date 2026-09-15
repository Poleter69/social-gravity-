/**
 * Social Gravity - Multi-Domain Expansion Tests (Milestone M7)
 */

import { DomainRegistry } from '../../src/domains/domainRegistry';
import { DomainType } from '../../src/domains/types';
import { RumorEngine } from '../../src/simulation/rumorEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testDomainRegistry() {
  console.log('--- Testing Milestone M7: Multi-Domain Expansion Adapters ---');

  const domainList: DomainType[] = [
    'financial_panic',
    'cybersecurity_incident',
    'emergency_communication',
    'organizational_rumor',
    'supply_chain_disruption',
  ];

  assert(DomainRegistry.getAllDomains().length === 5, 'All 5 domain adapters must be registered');

  for (const domain of domainList) {
    const spec = DomainRegistry.getDomain(domain);
    assert(spec.name.length > 0, 'Domain must have name');
    assert(spec.interventionProtocols.length >= 2, 'Domain must define intervention protocols');

    // 1. Instantiation
    const society = DomainRegistry.instantiateDomainSociety(domain, 60, 100 + domain.length);
    assert(society.agents.length === 60, 'Society population must match requested size');

    // Verify domain specific prior shifts
    if (domain === 'financial_panic') {
      const avgRisk = society.agents.reduce((acc, a) => acc + a.traits.riskTolerance, 0) / 60;
      assert(avgRisk < 0.40, 'Financial panic must enforce low risk tolerance (loss aversion)');
    }

    // 2. Signal Generation
    const signal = DomainRegistry.createDomainSignal(domain);
    assert(signal.emotionalSalience >= 0.85, 'Domain crisis signal must have high emotional salience');

    // 3. Downstream Simulator Run
    const engine = new RumorEngine(society, { maxRounds: 5, seed: 42 });
    engine.start(signal, [society.agents[0].id]);
    engine.step(); // Tick 1
    engine.step(); // Tick 2
    assert(engine.getState().currentRound === 2, 'Must simulate 2 rounds cleanly');

    console.log(`  ✓ Domain [${domain}]: "${spec.name}" -> Simulated 2 ticks cleanly (Believers: ${engine.getState().telemetryHistory[1]?.believerCount || 1})`);
  }

  console.log('✓ Multi-Domain Expansion validated successfully.\n');
}
