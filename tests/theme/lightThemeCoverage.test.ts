/**
 * Social Gravity — Project Aurora: Light Theme Coverage Test
 * Validates that LIGHT_VARS provides 100% complete token definitions
 * and conforms to contrast and formatting specifications.
 */

import { LIGHT_VARS, DARK_VARS } from '../../src/ui/theme/ThemeProvider';

const REQUIRED_TOKENS = [
  '--bg',
  '--surface',
  '--surface-elevated',
  '--surface-secondary',
  '--border',
  '--border-subtle',
  '--text',
  '--text-secondary',
  '--text-muted',
  '--text-tertiary',
  '--primary',
  '--primary-hover',
  '--primary-glow',
  '--success',
  '--warning',
  '--critical',
  '--card-shadow',
  '--card-shadow-hover',
  '--canvas-bg',
  '--grid-dot',
  '--grid-crosshair',
  '--edge-base',
];

export function testLightThemeCoverage(): void {
  console.log('1. Validating Light Theme token definitions...');

  for (const token of REQUIRED_TOKENS) {
    if (!(token in LIGHT_VARS)) {
      throw new Error(`[LightThemeTest] Missing required design token in LIGHT_VARS: ${token}`);
    }
    const val = LIGHT_VARS[token];
    if (!val || typeof val !== 'string' || val.trim().length === 0) {
      throw new Error(`[LightThemeTest] Token ${token} has empty or invalid value: ${val}`);
    }
  }
  console.log(`  ✓ All ${REQUIRED_TOKENS.length} required tokens present in LIGHT_VARS.`);

  console.log('2. Validating Light Theme surface and canvas tokens...');
  // Surface should be pure or near white in light mode
  if (LIGHT_VARS['--surface'].toUpperCase() !== '#FFFFFF') {
    throw new Error(`[LightThemeTest] --surface expected #FFFFFF, got ${LIGHT_VARS['--surface']}`);
  }
  // Canvas background should be crisp off-white #F8FAFC
  if (LIGHT_VARS['--canvas-bg'].toUpperCase() !== '#F8FAFC') {
    throw new Error(`[LightThemeTest] --canvas-bg expected #F8FAFC, got ${LIGHT_VARS['--canvas-bg']}`);
  }
  // Primary text must be high-contrast dark slate
  if (LIGHT_VARS['--text'].toUpperCase() !== '#0F172A') {
    throw new Error(`[LightThemeTest] --text expected #0F172A, got ${LIGHT_VARS['--text']}`);
  }
  console.log('  ✓ Light theme core color tokens verified (#FFFFFF surface, #F8FAFC canvas, #0F172A text).');

  console.log('3. Validating parity between Light and Dark token sets...');
  const lightKeys = Object.keys(LIGHT_VARS).sort();
  const darkKeys = Object.keys(DARK_VARS).sort();

  if (lightKeys.length !== darkKeys.length) {
    throw new Error(
      `[LightThemeTest] Token count mismatch: LIGHT_VARS has ${lightKeys.length} keys, DARK_VARS has ${darkKeys.length} keys.`
    );
  }

  for (const key of lightKeys) {
    if (!(key in DARK_VARS)) {
      throw new Error(`[LightThemeTest] Key ${key} present in LIGHT_VARS but missing from DARK_VARS.`);
    }
  }
  console.log(`  ✓ 100% token key parity achieved (${lightKeys.length} tokens verified).`);
}
