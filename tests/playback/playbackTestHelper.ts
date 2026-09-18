/**
 * Social Gravity — Playback Test Helper
 * Provides standard test fixtures for RumorEngine and PlaybackController.
 */

import { RumorEngine } from '../../src/simulation/rumorEngine';
import { societyGenerator } from '../../src/society/generators/societyGenerator';
import { InformationSignal } from '../../src/psychology/types';

export function createTestRumorEngine(maxRounds = 40): RumorEngine {
  const society = societyGenerator.generate({
    name: 'Playback Test Society',
    archetype: 'online_community',
    populationSize: 150,
    influencerRatio: 0.15,
    seed: 42,
  });

  // Pick top 4 influencers as patient zero seeds
  const sortedByInfluence = [...society.agents].sort((a, b) => b.traits.influence - a.traits.influence);
  const seedIds = sortedByInfluence.slice(0, 4).map((a) => a.id);

  const signal: InformationSignal = {
    id: 'sig_playback_test',
    topic: 'Critical Contagion Scandal',
    content: 'BREAKING DANGER: Severe critical emergency alert triggering widespread fear and viral amplification.',
    veracity: 'false',
    emotionalSalience: 0.98,
    complexity: 0.1,
    senderId: seedIds[0],
    round: 0,
  };

  const engine = new RumorEngine(society, {
    maxRounds,
    transmissionDelayMin: 1,
    transmissionDelayMax: 4,
    stochasticTransmission: true,
    enableHomeostasis: false,
    seed: 42,
  });

  engine.start(signal, seedIds);
  return engine;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
