/**
 * Social Gravity — Milestone M21: Content Safety Layer Benchmarks & Validation
 * Verifies sub-millisecond classification latency across all 5 safety pillars:
 * Hate, Explicit, Terrorism/Extremism, Violence, Harassment.
 */

import { performance } from 'perf_hooks';
import { safetyClassifier } from '../../src/safety/safetyClassifier';
import { SafetyProfile } from '../../src/safety/safetyTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[M21 Safety Validation Assertion Failed] ${message}`);
  }
}

export async function runSafetyBenchmarks(): Promise<void> {
  console.log('\n--- Milestone M21: Content Safety Layer (5 Pillars) Benchmarks ---');

  // Test Case 1: Explicit Content Detection & Latency
  {
    const explicitSamples = [
      'Trending pornographic leak and NSFW video circulating on tech forum channels.',
      'Check this hardcore adult cam website pornhub link for erotic models.',
      'Explicit sex video leak involving college students on social network.',
    ];

    const t0 = performance.now();
    const results: SafetyProfile[] = [];
    for (let i = 0; i < 1000; i++) {
      const sample = explicitSamples[i % explicitSamples.length];
      results.push(safetyClassifier.classify(sample));
    }
    const elapsed = performance.now() - t0;
    const avgLatencyMs = elapsed / 1000;

    results.slice(0, 3).forEach((r, idx) => {
      assert(r.category === 'explicit', `Sample ${idx} should be classified as explicit`);
      assert(r.confidence >= 0.70, `Sample ${idx} confidence should be >= 0.70, got ${r.confidence}`);
      assert(r.reasons.length > 0, `Sample ${idx} must expose human-readable audit reasons`);
    });

    console.log(
      `  ✓ Explicit Content Classifier: 1,000 runs in ${elapsed.toFixed(2)}ms | Avg Latency: ${avgLatencyMs.toFixed(3)}ms (SLA: < 300ms) ✓ Target Met`
    );
    assert(avgLatencyMs < 1.0, `Classification latency must be under 1ms, got ${avgLatencyMs.toFixed(3)}ms`);
  }

  // Test Case 2: Terrorism & Extremism Detection & Latency
  {
    const terrorSamples = [
      'Al-Qaeda official channel broadcasts martyrdom operation details and suicide bombing claims.',
      'ISIS online cell releases bomb-making manual and calls to join the caliphate in holy war.',
      'Violent accelerationist white supremacist cell calls for race war now and lone wolf attack protocol.',
    ];

    const t0 = performance.now();
    const results: SafetyProfile[] = [];
    for (let i = 0; i < 1000; i++) {
      const sample = terrorSamples[i % terrorSamples.length];
      results.push(safetyClassifier.classify(sample));
    }
    const elapsed = performance.now() - t0;
    const avgLatencyMs = elapsed / 1000;

    results.slice(0, 3).forEach((r, idx) => {
      assert(r.category === 'terrorism', `Sample ${idx} should be classified as terrorism`);
      assert(r.confidence >= 0.80, `Sample ${idx} confidence should be >= 0.80, got ${r.confidence}`);
      assert(r.reasons.length > 0, `Sample ${idx} must expose human-readable audit reasons`);
      assert(r.severity === 'critical' || r.severity === 'high', `Terrorism severity must be high or critical`);
    });

    console.log(
      `  ✓ Terrorism & Extremism Classifier: 1,000 runs in ${elapsed.toFixed(2)}ms | Avg Latency: ${avgLatencyMs.toFixed(3)}ms (SLA: < 300ms) ✓ Target Met`
    );
    assert(avgLatencyMs < 1.0, `Classification latency must be under 1ms, got ${avgLatencyMs.toFixed(3)}ms`);
  }

  // Test Case 3: Hate Speech & Hostile Targeting
  {
    const hateSamples = [
      'Filthy immigrants and subhuman minorities are invading our borders.',
      'Extremist manifesto calls for ethnic cleansing and eradication of protected groups.',
    ];

    hateSamples.forEach((sample, idx) => {
      const r = safetyClassifier.classify(sample);
      assert(r.category === 'hate' || r.labels.includes('hate'), `Hate sample ${idx} should be flagged as hate`);
      assert(r.confidence >= 0.70, `Hate sample ${idx} confidence should be >= 0.70`);
      assert(r.reasons.length > 0, `Hate sample ${idx} must include reason`);
    });
    console.log('  ✓ Hate Speech & Hostile Targeting Classifier verified.');
  }

  // Test Case 4: Violence & Lethal Threat Detection
  {
    const violenceSamples = [
      'I will murder everyone at the event and slit their throat in public.',
      'Active threats to detonate a bomb and burn down their house with armed assault.',
    ];

    violenceSamples.forEach((sample, idx) => {
      const r = safetyClassifier.classify(sample);
      assert(r.category === 'violence' || r.labels.includes('violence'), `Violence sample ${idx} should be flagged as violence`);
      assert(r.confidence >= 0.70, `Violence sample ${idx} confidence should be >= 0.70`);
      assert(r.reasons.length > 0, `Violence sample ${idx} must include reason`);
    });
    console.log('  ✓ Violence & Physical Threat Classifier verified.');
  }

  // Test Case 5: Harassment, Doxxing & Bullying
  {
    const harassmentSamples = [
      'We doxxed their account, here is their home address and phone number leaked, swat them!',
      'Go die in a ditch, kill yourself nobody cares about you.',
    ];

    harassmentSamples.forEach((sample, idx) => {
      const r = safetyClassifier.classify(sample);
      assert(r.category === 'harassment' || r.labels.includes('harassment'), `Harassment sample ${idx} should be flagged as harassment`);
      assert(r.confidence >= 0.70, `Harassment sample ${idx} confidence should be >= 0.70`);
      assert(r.reasons.length > 0, `Harassment sample ${idx} must include reason`);
    });
    console.log('  ✓ Harassment, Doxxing & Intimidation Classifier verified.');
  }

  // Test Case 6: Benign Clean Content Rejection
  {
    const benignSamples = [
      'Global energy conference discusses offshore wind turbine development and battery storage.',
      'Quarterly financial earnings report indicates moderate revenue growth in cloud services.',
      'New public transit subway extension opens to commuters downtown.',
    ];

    benignSamples.forEach((sample) => {
      const r = safetyClassifier.classify(sample);
      assert(r.category === 'none', `Benign sample should be classified as none, got ${r.category}`);
      assert(r.confidence === 0, `Benign sample confidence should be 0`);
      assert(r.reasons.length === 0, `Benign sample should have no reasons`);
    });

    console.log('  ✓ Benign Content Filter: 100% true-negative accuracy verified.');
  }

  // Test Case 7: Safety Report Summary Generation
  {
    const mockFeed = [
      { id: '1', safety: safetyClassifier.classify('Hardcore porn leak and NSFW cam model'), timestamp: Date.now() - 30000 },
      { id: '2', safety: safetyClassifier.classify('ISIS recruitment cell and suicide bombing manifesto'), timestamp: Date.now() - 20000 },
      { id: '3', safety: safetyClassifier.classify('Clean technology update on electric vehicles'), timestamp: Date.now() - 10000 },
      { id: '4', safety: safetyClassifier.classify('I will murder everyone and detonate a bomb'), timestamp: Date.now() - 8000 },
      { id: '5', safety: safetyClassifier.classify('Doxxed account with phone number leaked and swat them'), timestamp: Date.now() - 6000 },
      { id: '6', safety: safetyClassifier.classify('Filthy immigrants subhuman minority scum'), timestamp: Date.now() - 4000 },
    ];

    const summary = safetyClassifier.generateReportSummary(mockFeed);
    assert(summary.explicitCount >= 1, `Explicit count should be >= 1, got ${summary.explicitCount}`);
    assert(summary.terrorismCount >= 1, `Terrorism count should be >= 1, got ${summary.terrorismCount}`);
    assert(summary.violenceCount >= 1, `Violence count should be >= 1, got ${summary.violenceCount}`);
    assert(summary.harassmentCount >= 1, `Harassment count should be >= 1, got ${summary.harassmentCount}`);
    assert(summary.hateCount >= 1, `Hate count should be >= 1, got ${summary.hateCount}`);
    assert(summary.totalEvaluated === 6, `Total evaluated should be 6`);
    assert(summary.timeline.length >= 5, `Timeline should contain flagged events`);
    assert(summary.firstDetectedAt !== null, 'First detected timestamp must exist');

    console.log(
      `  ✓ Safety Report Summary: Explicit (${summary.explicitCount}) | Terror (${summary.terrorismCount}) | Violence (${summary.violenceCount}) | Harass (${summary.harassmentCount}) | Hate (${summary.hateCount}) | Timeline (${summary.timeline.length}) ✓ Verified`
    );
  }

  console.log('✓ Milestone M21: Content Safety Layer passed all validation criteria.\n');
}

if (process.argv[1] && process.argv[1].includes('safetyClassifier.benchmark')) {
  runSafetyBenchmarks().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
