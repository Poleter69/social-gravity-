#!/usr/bin/env node

/**
 * Social Gravity — One-Command Cross-Platform Local Setup
 * 
 * Verifies environment, prepares configuration, validates tests,
 * and sets up the project for instant development with zero cost.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('  SOCIAL GRAVITY — ONE-COMMAND ZERO-COST PRODUCTION SETUP');
console.log('================================================================\n');

// 1. Check Node.js Version
const nodeVersion = process.versions.node;
const major = parseInt(nodeVersion.split('.')[0], 10);
if (major < 18) {
  console.error(`❌ Node.js 18+ required. Current version: ${nodeVersion}`);
  process.exit(1);
}
console.log(`✓ Node.js version verified: v${nodeVersion}`);

// 2. Prepare .env if not exists
const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✓ Initialized .env configuration from .env.example');
} else if (fs.existsSync(envPath)) {
  console.log('✓ Existing .env configuration detected');
}

// 3. Verify Dependencies
const nodeModulesPath = path.join(rootDir, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('-> Installing dependencies with npm install...');
  execSync('npm install', { cwd: rootDir, stdio: 'inherit' });
  console.log('✓ Dependencies installed successfully');
} else {
  console.log('✓ Dependencies are already installed');
}

// 4. Run TypeScript Check
console.log('-> Validating TypeScript strict type definitions...');
try {
  execSync('npx tsc --noEmit', { cwd: rootDir, stdio: 'inherit' });
  console.log('✓ TypeScript verification passed with 0 errors');
} catch {
  console.error('❌ TypeScript validation failed.');
  process.exit(1);
}

// 5. Run Master System Tests
console.log('-> Executing Master System Test Suite...');
try {
  execSync('npm test', { cwd: rootDir, stdio: 'inherit' });
  console.log('✓ 100% of test suites passed successfully');
} catch {
  console.error('❌ Tests failed. Please inspect logs.');
  process.exit(1);
}

console.log('\n================================================================');
console.log('  🎉 SOCIAL GRAVITY SETUP COMPLETED SUCCESSFULLY!');
console.log('================================================================');
console.log('  Target Monthly Cost:    $0.00 / month');
console.log('  Local Dev Command:      npm run dev');
console.log('  Database Seed Command:  npm run db:seed');
console.log('  Build Command:          npm run build');
console.log('================================================================\n');
