/**
 * Social Gravity — Project Aurora: Landing Page
 * Cinematic product reveal and "About Project" overview experience.
 *
 * Design inspiration: Apple product reveal × Arc Browser × Linear × Palantir Foundry.
 * 100vh viewport fit, adaptive scroll, 60FPS background network, dual-theme support,
 * feature cards, live stats strip, mission preview, and persistent skip preference.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Radio,
  Brain,
  GitFork,
  ShieldAlert,
  ArrowRight,
  Sun,
  Moon,
  LogOut,
  LogIn,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../auth/authContext';
import { useTheme } from '../ui/theme/ThemeProvider';
import { useOnboarding } from './OnboardingContext';
import { BackgroundNetwork } from './BackgroundNetwork';
import { FeatureCard } from './FeatureCard';
import { AnimatedStats } from './AnimatedStats';
import { MissionPreview } from './MissionPreview';

export interface LandingPageProps {
  onLaunch?: () => void;
  onGetStarted?: () => void;
  onLogin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch, onGetStarted, onLogin }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { skipLandingNextTime, setSkipLandingNextTime, completeLanding } = useOnboarding();
  const isLight = theme === 'light';

  const handleLaunch = () => {
    completeLanding();
    if (onGetStarted) {
      onGetStarted();
    } else if (onLaunch) {
      onLaunch();
    }
  };

  const handleToggleSkip = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkipLandingNextTime(e.target.checked);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative min-h-screen w-full overflow-y-auto overflow-x-hidden bg-[var(--bg)] text-[var(--text)] flex flex-col justify-between select-none"
      >
        {/* 60 FPS Ambient Network Canvas */}
        <BackgroundNetwork />

        {/* ─── 1. Top Navigation Bar ────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 px-4 sm:px-6 md:px-8 py-3 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md flex items-center justify-between shrink-0 transition-colors duration-200">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#00F0FF] flex items-center justify-center shadow-sm text-white"
            >
              <Activity className="w-4 h-4" />
            </motion.div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold tracking-tight text-[var(--text)] font-mono">
                  SOCIAL GRAVITY
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-tertiary)]">
                  AURORA // V3.0
                </span>
              </div>
              <p className="text-[10px] font-mono text-[var(--text-tertiary)] hidden sm:block">
                CLASSIFIED DECISION INTELLIGENCE WORKSTATION
              </p>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User authenticated pill or Guest Sign In */}
            {user ? (
              <>
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[11px] font-mono">
                  <div className="w-5 h-5 rounded-md bg-[var(--primary)] text-white text-[9px] font-bold flex items-center justify-center">
                    {user.avatarInitials}
                  </div>
                  <span className="hidden sm:inline text-[var(--text-secondary)] font-semibold">
                    {user.displayName}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold bg-[var(--primary-glow)] text-[var(--primary)] border border-[var(--primary)]/20">
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={handleLaunch}
                  aria-label="Go to Workstation Dashboard"
                  title="Go to Workstation Dashboard"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--primary)]/50 transition-colors text-[11px] font-mono font-medium cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Dashboard</span>
                </button>
              </>
            ) : (
              <button
                onClick={onLogin || handleLaunch}
                aria-label="Sign In"
                title="Sign into Social Gravity"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--primary)]/50 transition-colors text-[11px] font-mono font-medium cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>Sign In</span>
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
              title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
              className="p-1.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--border-subtle)] transition-colors duration-200 cursor-pointer"
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Logout Button (only shown if logged in) */}
            {user && (
              <button
                onClick={logout}
                aria-label="Log Out"
                title="End Analyst Session"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-tertiary)] hover:text-red-500 hover:border-red-500/30 transition-colors duration-200 text-[11px] font-mono cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </header>

        {/* ─── 2. Main Middle Viewport Content (Responsive & Adaptive) ─────────── */}
        <main className="relative z-10 flex-1 px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 max-w-7xl mx-auto w-full flex flex-col justify-between gap-4 sm:gap-6 md:gap-8 pb-8">
          {/* A. Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-3xl mx-auto space-y-1.5 sm:space-y-2 shrink-0 pt-1 sm:pt-2"
          >
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[9px] sm:text-[10px] font-mono tracking-wider text-[var(--primary)] shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>PROJECT AURORA // PRODUCT REVEAL</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--text)] via-[var(--primary)] to-[var(--text)] leading-tight">
              Social Gravity
            </h1>

            <h2 className="text-[12px] sm:text-[13px] md:text-[15px] font-semibold tracking-wide text-[var(--text-secondary)] font-mono">
              Computational Social Psychology Engine for Decision Intelligence
            </h2>

            <p className="text-[11px] sm:text-[12px] md:text-[13px] leading-relaxed text-[var(--text-muted)] max-w-2xl mx-auto">
              Monitor public conversations, identify emerging narratives, analyze emotional shifts,
              reconstruct information flow, and explore simulations through an interactive intelligence workstation.
            </p>

            {/* Prominent Hero CTA Button */}
            <div className="pt-2 sm:pt-3 flex items-center justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={handleLaunch}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-[12px] sm:text-[13px] font-mono font-bold tracking-wider uppercase shadow-lg shadow-[var(--primary)]/20 transition-all duration-200 group cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </motion.button>
              {isAuthenticated ? (
                <button
                  onClick={handleLaunch}
                  className="px-4 py-2.5 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] text-[12px] font-mono transition-colors cursor-pointer"
                >
                  Enter Dashboard
                </button>
              ) : (
                <button
                  onClick={onLogin || handleLaunch}
                  className="px-4 py-2.5 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] text-[12px] font-mono transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          </motion.div>

          {/* B. Capabilities Grid & Mission Preview Combined Rhythm */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 lg:gap-5 items-stretch my-auto">
            {/* Left: 4 Feature Capability Cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <FeatureCard
                index={0}
                icon={<Radio className="w-4 h-4" />}
                title="Live Intelligence"
                description="Monitor public conversations as they evolve in real time."
                badge="STREAMING"
                accentColor="#4F8CFF"
              />
              <FeatureCard
                index={1}
                icon={<Brain className="w-4 h-4" />}
                title="Emotion Mapping"
                description="Visualize Fear, Anger, Joy, Curiosity, and more across clusters."
                badge="GOEMOTIONS"
                accentColor="#10B981"
              />
              <FeatureCard
                index={2}
                icon={<GitFork className="w-4 h-4" />}
                title="Network Simulation"
                description="Replay and explore information spread with deterministic state machines."
                badge="M22 CONTROLLER"
                accentColor="#A855F7"
              />
              <FeatureCard
                index={3}
                icon={<ShieldAlert className="w-4 h-4" />}
                title="Risk Detection"
                description="Surface emerging patterns with explainable AI dossiers and safety filters."
                badge="SAFETY 4-WAY"
                accentColor="#F59E0B"
              />
            </div>

            {/* Right: Mission Control Teaser Preview */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <MissionPreview />
            </div>
          </div>

          {/* C. Live Animated Statistics Strip */}
          <div className="shrink-0 pt-1">
            <AnimatedStats />
          </div>
        </main>

        {/* ─── 3. Bottom Action Bar (Sticky Footer) ─────────────────────────────── */}
        <footer className="sticky bottom-0 z-30 px-4 sm:px-6 md:px-8 py-3 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg transition-colors duration-200">
          <div className="text-center sm:text-left">
            <div className="text-[12px] font-semibold text-[var(--text)]">
              Ready to begin?
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              Enter Mission Control and start analyzing live narratives.
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {/* Skip checkbox */}
            <label className="flex items-center gap-2 cursor-pointer text-[11px] font-mono text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
              <input
                type="checkbox"
                checked={skipLandingNextTime}
                onChange={handleToggleSkip}
                className="w-3.5 h-3.5 rounded border-[var(--border)] bg-[var(--surface-elevated)] accent-[var(--primary)] cursor-pointer"
              />
              <span>Skip this page next time</span>
            </label>

            {/* Primary Action Button */}
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={handleLaunch}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-[11px] sm:text-[12px] font-mono font-bold tracking-wider uppercase shadow-md transition-colors duration-200 group focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 shrink-0 cursor-pointer"
            >
              <span>Get Started</span>
              <span className="hidden sm:inline opacity-80 font-normal">| Launch Mission Control</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </motion.button>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
};
