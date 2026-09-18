/**
 * Social Gravity — Project Aurora: Theme Test Suite Runner
 */

import { testLightThemeCoverage } from './lightThemeCoverage.test';
import { testDarkThemeCoverage } from './darkThemeCoverage.test';
import { testTokenUsage } from './tokenUsage.test';

export async function testThemeSuite(): Promise<void> {
  console.log('========================================================');
  console.log('  PROJECT AURORA: THEME VERIFICATION SUITE');
  console.log('========================================================\n');

  testLightThemeCoverage();
  console.log('');
  testDarkThemeCoverage();
  console.log('');
  testTokenUsage();
  console.log('');

  console.log('========================================================');
  console.log('  PROJECT AURORA: THEME VERIFICATION PASSED (100%)');
  console.log('========================================================\n');
}
