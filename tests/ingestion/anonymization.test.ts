/**
 * Social Gravity V2 - Privacy Anonymizer Unit Tests
 *
 * Validates deterministic SHA-256 hashing, salt customization,
 * and reversible mapping export/import.
 */

import { Anonymizer } from '../../src/ingestion/anonymization/anonymizer';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testAnonymizer() {
  console.log('--- Testing Deterministic Privacy Anonymizer ---');

  // Test 1: Deterministic Hashing
  const anon1 = new Anonymizer({ salt: 'salt-a', prefix: 'usr_', labelPrefix: 'User_' });
  const anon2 = new Anonymizer({ salt: 'salt-a', prefix: 'usr_', labelPrefix: 'User_' });

  const res1 = anon1.anonymize('Alice Smith');
  const res2 = anon2.anonymize('Alice Smith');

  assert(
    res1.canonicalId === res2.canonicalId,
    `Identical raw ID and salt must produce identical canonicalId: ${res1.canonicalId} vs ${res2.canonicalId}`
  );
  assert(
    res1.label === 'User_1' && res2.label === 'User_1',
    'Labels must start monotonically from User_1'
  );

  // Test 2: Different Salt Produces Different Hash
  const anonDifferentSalt = new Anonymizer({ salt: 'salt-b' });
  const resDifferent = anonDifferentSalt.anonymize('Alice Smith');
  assert(
    res1.canonicalId !== resDifferent.canonicalId,
    'Different salts must yield different canonical identifiers'
  );

  // Test 3: Idempotency within same instance
  const resRepeat = anon1.anonymize('Alice Smith');
  assert(
    resRepeat.canonicalId === res1.canonicalId,
    'Repeated anonymization must return existing canonicalId'
  );
  assert(
    resRepeat.label === res1.label,
    'Repeated anonymization must return existing label'
  );

  // Test 4: Reversible Mapping Export and Import
  anon1.anonymize('Bob Jones');
  const exported = anon1.exportMapping();

  const restored = new Anonymizer();
  restored.importMapping(exported);

  assert(
    restored.deAnonymize(res1.canonicalId) === 'Alice Smith',
    'Restored mapping must resolve raw identity for Alice'
  );
  assert(restored.size === 2, `Restored mapping must contain 2 entries, got ${restored.size}`);

  console.log('✓ Privacy Anonymizer validated.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('anonymization.test.ts')) {
  testAnonymizer();
}
