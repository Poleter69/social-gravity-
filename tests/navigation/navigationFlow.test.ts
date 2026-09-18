/**
 * Social Gravity — Navigation Flow & Route Ordering Test Suite
 * Validates the new flow: About Project (/) -> Login (/login) -> Main App (/dashboard)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { resolveRoute } from '../../src/navigation/NavigationContext';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function testNavigationFlow(): void {
  console.log('--- Social Gravity: Navigation Flow & Route Reordering Suite ---');

  // ─── 1. Universal Route Resolution Tests ────────────────────────────────────
  console.log('1. Validating canonical route resolution rules...');
  
  // Initial landing ("About Project")
  const defaultRoute = resolveRoute('/');
  if (defaultRoute.route !== 'landing' || defaultRoute.path !== '/') {
    throw new Error(`Expected resolveRoute('/') to yield landing route, got ${JSON.stringify(defaultRoute)}`);
  }

  const emptyRoute = resolveRoute('');
  if (emptyRoute.route !== 'landing' || emptyRoute.path !== '/') {
    throw new Error(`Expected resolveRoute('') to yield landing route, got ${JSON.stringify(emptyRoute)}`);
  }

  const hashLanding = resolveRoute('#/');
  if (hashLanding.route !== 'landing' || hashLanding.path !== '/') {
    throw new Error(`Expected resolveRoute('#/') to yield landing route, got ${JSON.stringify(hashLanding)}`);
  }

  // Login route
  const loginRoute = resolveRoute('/login');
  if (loginRoute.route !== 'login' || loginRoute.path !== '/login') {
    throw new Error(`Expected resolveRoute('/login') to yield login route, got ${JSON.stringify(loginRoute)}`);
  }

  const hashLoginRoute = resolveRoute('#/login');
  if (hashLoginRoute.route !== 'login' || hashLoginRoute.path !== '/login') {
    throw new Error(`Expected resolveRoute('#/login') to yield login route, got ${JSON.stringify(hashLoginRoute)}`);
  }

  // Dashboard / Workstation route
  const dashboardRoute = resolveRoute('/dashboard');
  if (dashboardRoute.route !== 'dashboard' || dashboardRoute.path !== '/dashboard') {
    throw new Error(`Expected resolveRoute('/dashboard') to yield dashboard route, got ${JSON.stringify(dashboardRoute)}`);
  }

  const appRoute = resolveRoute('/app');
  if (appRoute.route !== 'dashboard' || appRoute.path !== '/dashboard') {
    throw new Error(`Expected resolveRoute('/app') to yield dashboard route, got ${JSON.stringify(appRoute)}`);
  }

  const hashDashboard = resolveRoute('#/dashboard');
  if (hashDashboard.route !== 'dashboard' || hashDashboard.path !== '/dashboard') {
    throw new Error(`Expected resolveRoute('#/dashboard') to yield dashboard route, got ${JSON.stringify(hashDashboard)}`);
  }

  console.log('  ✓ Canonical route resolution verified for /, /login, /dashboard, and hash variations.');

  // ─── 2. LandingPage ("About Project") Interface Audit ───────────────────────
  console.log('2. Auditing LandingPage for prominent "Get Started" and navigation features...');
  const landingPagePath = path.resolve(__dirname, '../../src/onboarding/LandingPage.tsx');
  const landingContent = fs.readFileSync(landingPagePath, 'utf-8');

  if (!landingContent.includes('Get Started')) {
    throw new Error('[NavigationAudit] LandingPage missing prominent "Get Started" CTA button.');
  }

  if (!landingContent.includes('onGetStarted')) {
    throw new Error('[NavigationAudit] LandingPage missing onGetStarted prop support.');
  }

  if (!landingContent.includes('onLogin')) {
    throw new Error('[NavigationAudit] LandingPage missing onLogin prop support.');
  }

  if (!landingContent.includes('Sign In')) {
    throw new Error('[NavigationAudit] LandingPage missing guest Sign In button in header.');
  }

  // Ensure backwards compatibility with legacy tests
  if (!landingContent.includes('Launch Mission Control')) {
    throw new Error('[NavigationAudit] LandingPage must preserve "Launch Mission Control" label for test parity.');
  }

  console.log('  ✓ LandingPage contains prominent "Get Started" button, onGetStarted callback, and guest Sign In.');

  // ─── 3. LoginPage Interface & Return Navigation Audit ───────────────────────
  console.log('3. Auditing LoginPage for authentication preservation and back navigation...');
  const loginPagePath = path.resolve(__dirname, '../../src/auth/LoginPage.tsx');
  const loginContent = fs.readFileSync(loginPagePath, 'utf-8');

  if (!loginContent.includes('onBackToLanding')) {
    throw new Error('[NavigationAudit] LoginPage missing onBackToLanding prop.');
  }

  if (!loginContent.includes('Back to About Project') && !loginContent.includes('Return to About Project')) {
    throw new Error('[NavigationAudit] LoginPage missing Back to About Project navigation link.');
  }

  if (!loginContent.includes('onSuccess')) {
    throw new Error('[NavigationAudit] LoginPage missing onSuccess redirect callback.');
  }

  // Ensure all authentication methods remain intact
  if (!loginContent.includes('continueAsDemo') || !loginContent.includes('Continue as Demo')) {
    throw new Error('[NavigationAudit] LoginPage missing demo login capability.');
  }

  if (!loginContent.includes('loginWithOAuth') || !loginContent.includes('Continue with GitHub')) {
    throw new Error('[NavigationAudit] LoginPage missing OAuth authentication button.');
  }

  console.log('  ✓ LoginPage contains return to About Project link, onSuccess handler, and preserved auth mechanisms.');

  // ─── 4. ProtectedRoute Enforcement Audit ─────────────────────────────────────
  console.log('4. Auditing ProtectedRoute for unauthenticated redirection...');
  const protectedRoutePath = path.resolve(__dirname, '../../src/auth/ProtectedRoute.tsx');
  const protectedContent = fs.readFileSync(protectedRoutePath, 'utf-8');

  if (!protectedContent.includes('onRedirect')) {
    throw new Error('[NavigationAudit] ProtectedRoute missing onRedirect callback support.');
  }

  console.log('  ✓ ProtectedRoute supports unauthenticated redirection callbacks.');

  // ─── 5. App Orchestration Flow Audit ─────────────────────────────────────────
  console.log('5. Auditing App.tsx flow orchestration and route ordering...');
  const appPath = path.resolve(__dirname, '../../src/App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  if (!appContent.includes('NavigationProvider')) {
    throw new Error('[NavigationAudit] App.tsx must wrap application in NavigationProvider.');
  }

  if (!appContent.includes("route === 'landing'")) {
    throw new Error('[NavigationAudit] App.tsx missing landing route handler.');
  }

  if (!appContent.includes("route === 'login'")) {
    throw new Error('[NavigationAudit] App.tsx missing login route handler.');
  }

  if (!appContent.includes("route === 'dashboard'")) {
    throw new Error('[NavigationAudit] App.tsx missing dashboard route handler.');
  }

  // Ensure protected route redirects unauthenticated user from dashboard to login
  if (!appContent.includes("!isAuthenticated && route === 'dashboard'") || !appContent.includes('toLogin')) {
    throw new Error('[NavigationAudit] App.tsx must redirect unauthenticated access to dashboard toward login.');
  }

  // Ensure authenticated user visiting login is redirected to dashboard
  if (!appContent.includes("isAuthenticated && route === 'login'") || !appContent.includes('toDashboard')) {
    throw new Error('[NavigationAudit] App.tsx must redirect authenticated users from login toward dashboard.');
  }

  console.log('  ✓ App.tsx properly orchestrates About Project (/) -> Login (/login) -> Main App (/dashboard).');

  console.log('\n========================================================');
  console.log('  ✓ ALL NAVIGATION FLOW & REORDERING TESTS PASSED (100%)');
  console.log('========================================================\n');
}
