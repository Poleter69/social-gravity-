/**
 * Social Gravity — Project Aurora: Token Usage Audit Test
 * Scans component and workspace source files to verify that no
 * hardcoded legacy dark surface colors remain.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FORBIDDEN_PATTERNS = [
  'bg-[#111114]',
  'bg-[#18181B]',
  'bg-[#09090B]',
  'border-[#27272A]',
  'text-[#FAFAFA]',
];

const SCAN_DIRS = [
  path.resolve(__dirname, '../../src/ui/eclipse/workspaces'),
  path.resolve(__dirname, '../../src/ui/eclipse/components'),
  path.resolve(__dirname, '../../src/society/components'),
  path.resolve(__dirname, '../../src/onboarding'),
];

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export function testTokenUsage(): void {
  console.log('1. Scanning UI workspaces and components for hardcoded dark surfaces...');

  const filesToScan: string[] = [];
  for (const dir of SCAN_DIRS) {
    scanDirectory(dir, filesToScan);
  }

  console.log(`  Found ${filesToScan.length} component and workspace files to audit.`);

  const violations: { file: string; pattern: string; line: number }[] = [];

  for (const file of filesToScan) {
    // Skip theme definition files
    if (file.includes('theme.ts') || file.includes('ThemeProvider.tsx')) continue;

    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (line.includes(pattern)) {
          violations.push({
            file: path.relative(path.resolve(__dirname, '../../'), file),
            pattern,
            line: i + 1,
          });
        }
      }
    }
  }

  if (violations.length > 0) {
    const details = violations
      .map((v) => `  - ${v.file}:${v.line} -> contains forbidden pattern "${v.pattern}"`)
      .join('\n');
    throw new Error(
      `[TokenUsageTest] Detected ${violations.length} hardcoded dark color violations:\n${details}`
    );
  }

  console.log(`  ✓ 0 hardcoded dark color violations across ${filesToScan.length} audited files.`);
}
