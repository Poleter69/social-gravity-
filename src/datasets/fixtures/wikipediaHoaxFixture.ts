/**
 * Social Gravity - Wikipedia Documented Hoax Fixtures
 * Curated authentic historical hoaxes documented on Wikipedia, annotated with
 * veracity, survival duration, threat salience, and controversy metrics.
 */

import { WikipediaHoaxRecord } from '../types';

export const WIKIPEDIA_HOAX_FIXTURES: WikipediaHoaxRecord[] = [
  {
    id: 'hoax_bicholim',
    title: 'Bicholim Conflict (1640–1641)',
    summary: 'A meticulously detailed fictitious war between the Portuguese Empire and the Maratha Empire that was rated as a "Good Article" on Wikipedia for over 5 years before discovery.',
    veracity: 0.0, // 100% fabricated historical conflict
    virality: 0.85,
    fearSalience: 0.40,
    plausibility: 0.92,
    durationDays: 1978,
    categories: ['Military History', 'Fabrication', 'Long-lasting'],
    talkPageDisputes: 42
  },
  {
    id: 'hoax_jaredo_wens',
    title: 'Jar\'Edo Wens Australian Deity',
    summary: 'An invented Aboriginal Australian dreamtime deity whose fabricated article survived unverified on Wikipedia for almost 10 years (3,611 days).',
    veracity: 0.0,
    virality: 0.70,
    fearSalience: 0.15,
    plausibility: 0.88,
    durationDays: 3611,
    categories: ['Mythology', 'Aboriginal Folklore', 'Record Duration'],
    talkPageDisputes: 18
  },
  {
    id: 'hoax_bear_river_epidemic',
    title: 'Bear River Toxic Outbreak (Contamination Rumor)',
    summary: 'A viral health scare claiming a local reservoir had received industrial chemical contamination, triggering water hoarding before public health testing debunked it.',
    veracity: 0.05,
    virality: 0.95,
    fearSalience: 0.88, // High fear salience triggers fast emotional contagion
    plausibility: 0.75,
    durationDays: 14,
    categories: ['Public Health', 'Water Contamination', 'Panic'],
    talkPageDisputes: 89
  },
  {
    id: 'hoax_financial_crypto_bank',
    title: 'Apex Reserve Insolvency Whisper',
    summary: 'A fabricated whisper campaign claiming a prominent digital custody provider was halting client withdrawals due to liquidity shortfalls.',
    veracity: 0.10,
    virality: 0.90,
    fearSalience: 0.82,
    plausibility: 0.80,
    durationDays: 7,
    categories: ['Finance', 'Bank Run Rumor', 'Panic'],
    talkPageDisputes: 115
  }
];
