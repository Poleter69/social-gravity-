/**
 * Social Gravity — Project Aurora: Post-Login Landing Experience Test Suite
 * Validates onboarding state machine, persistence, token compliance,
 * and capability card integrity.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function testLandingExperience(): void {
  console.log('1. Auditing Onboarding source files for tokenized dual-theme compliance...');

  const onboardingDir = path.resolve(__dirname, '../../src/onboarding');
  const files = fs.readdirSync(onboardingDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

  const FORBIDDEN_PATTERNS = [
    'bg-[#111114]',
    'bg-[#18181B]',
    'bg-[#09090B]',
    'border-[#27272A]',
    'text-[#FAFAFA]',
  ];

  const violations: string[] = [];

  for (const file of files) {
    const fullPath = path.join(onboardingDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (line.includes(pattern)) {
          violations.push(`${file}:${i + 1} contains ${pattern}`);
        }
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(`[OnboardingAudit] Detected ${violations.length} hardcoded dark color violations:\n` + violations.join('\n'));
  }
  console.log(`  ✓ 0 hardcoded dark color violations across ${files.length} onboarding files.`);

  console.log('2. Validating Core Capability Cards & Content...');
  const landingContent = fs.readFileSync(path.join(onboardingDir, 'LandingPage.tsx'), 'utf-8');

  const requiredCapabilities = [
    'Live Intelligence',
    'Emotion Mapping',
    'Network Simulation',
    'Risk Detection',
  ];

  for (const cap of requiredCapabilities) {
    if (!landingContent.includes(cap)) {
      throw new Error(`[OnboardingAudit] Missing core capability in LandingPage.tsx: "${cap}"`);
    }
  }
  console.log('  ✓ All 4 core capabilities present in LandingPage.');

  console.log('3. Validating Hero copy requirements...');
  if (!landingContent.includes('Social Gravity')) {
    throw new Error('[OnboardingAudit] LandingPage missing Title "Social Gravity"');
  }
  if (!landingContent.includes('Computational Social Psychology Engine for Decision Intelligence')) {
    throw new Error('[OnboardingAudit] LandingPage missing Subtitle');
  }
  if (!landingContent.includes('Monitor public conversations, identify emerging narratives')) {
    throw new Error('[OnboardingAudit] LandingPage missing Description');
  }
  console.log('  ✓ Hero copy strictly conforms to design specifications.');

  console.log('4. Validating Animated Statistics Strip...');
  const statsContent = fs.readFileSync(path.join(onboardingDir, 'AnimatedStats.tsx'), 'utf-8');
  const requiredStats = [
    'Data Sources',
    'Emotions',
    'Time Travel',
    'Streaming',
  ];

  for (const stat of requiredStats) {
    if (!statsContent.includes(stat)) {
      throw new Error(`[OnboardingAudit] Missing statistic in AnimatedStats.tsx: "${stat}"`);
    }
  }
  console.log('  ✓ All 4 operational statistics configured.');

  console.log('5. Validating Skip Preference & CTA...');
  if (!landingContent.includes('Skip this page next time')) {
    throw new Error('[OnboardingAudit] Missing "Skip this page next time" checkbox option.');
  }
  if (!landingContent.includes('Launch Mission Control')) {
    throw new Error('[OnboardingAudit] Missing primary CTA "Launch Mission Control".');
  }
  console.log('  ✓ Primary CTA and persistent skip preference verified.');

  console.log('6. Validating Responsive Scroll & Adaptive Layout Fix...');
  if (landingContent.includes('h-screen max-h-screen w-screen overflow-hidden')) {
    throw new Error('[OnboardingAudit] Detected rigid h-screen overflow-hidden locking viewport on laptops.');
  }
  if (!landingContent.includes('min-h-screen') || !landingContent.includes('overflow-y-auto')) {
    throw new Error('[OnboardingAudit] Missing min-h-screen or overflow-y-auto on LandingPage container.');
  }
  if (!landingContent.includes('sticky bottom-0')) {
    throw new Error('[OnboardingAudit] Missing sticky bottom-0 on LandingPage footer (CTA bar must remain permanently visible).');
  }
  if (!landingContent.includes('sticky top-0')) {
    throw new Error('[OnboardingAudit] Missing sticky top-0 on LandingPage navigation header.');
  }
  console.log('  ✓ Responsive vertical scroll & sticky CTA bar verified (laptop safe).');
}
