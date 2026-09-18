/**
 * Social Gravity — Project Dossier Executive Summary
 * 30-Second Briefing with High-Impact Metric Cards & AI Assessment TL;DR
 */

import React from 'react';
import { TrendingUp, Flame, Network, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { InvestigationDossier } from '../types';

interface ExecutiveSummaryProps {
  dossier: InvestigationDossier;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ dossier }) => {
  const { executiveSummary } = dossier;

  const riskBadgeColor =
    executiveSummary.riskLevel === 'Critical'
      ? 'text-red-400 bg-red-500/10 border-red-500/30'
      : executiveSummary.riskLevel === 'High'
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : executiveSummary.riskLevel === 'Moderate'
      ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  return (
    <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
              Executive Summary & Threat Triage
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              AUTO-GENERATED FROM COMPLETED ANALYSIS // TIME HORIZON T+{dossier.timeline[dossier.timeline.length - 1]?.round || 0}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-xs font-semibold uppercase">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          HIGH PRIORITY INTELLIGENCE
        </div>
      </div>

      {/* 4 Flagship Metric Cards — Apple Keynote / Palantir Aesthetic */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Metric 1: Narrative Growth */}
        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--canvas)] flex flex-col justify-between hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between text-[var(--text-tertiary)] mb-2">
            <span className="text-xs font-mono font-medium uppercase tracking-wider">Narrative Growth</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-blue-400">
            {executiveSummary.narrativeGrowth}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-2">
            Velocity factor from seed exposure
          </div>
        </div>

        {/* Metric 2: Dominant Emotion */}
        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--canvas)] flex flex-col justify-between hover:border-red-500/40 transition-colors">
          <div className="flex items-center justify-between text-[var(--text-tertiary)] mb-2">
            <span className="text-xs font-mono font-medium uppercase tracking-wider">Dominant Emotion</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-black tracking-tight text-red-400 truncate">
            {executiveSummary.dominantEmotion}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-2">
            Salience: {executiveSummary.dominantEmotionPct}% affective load
          </div>
        </div>

        {/* Metric 3: Communities Affected */}
        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--canvas)] flex flex-col justify-between hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between text-[var(--text-tertiary)] mb-2">
            <span className="text-xs font-mono font-medium uppercase tracking-wider">Communities Affected</span>
            <Network className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-purple-400">
            {executiveSummary.communitiesAffected} <span className="text-lg text-[var(--text-tertiary)]">/ {executiveSummary.totalCommunities}</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-2">
            Cluster penetration breadth
          </div>
        </div>

        {/* Metric 4: Risk Level */}
        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--canvas)] flex flex-col justify-between hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-[var(--text-tertiary)] mb-2">
            <span className="text-xs font-mono font-medium uppercase tracking-wider">Assessed Threat Level</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-black tracking-tight uppercase">
            <span className={`px-2.5 py-0.5 rounded text-2xl sm:text-3xl font-bold font-mono border ${riskBadgeColor}`}>
              {executiveSummary.riskLevel}
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-2 font-mono">
            Peak R₀ = {executiveSummary.peakR0}
          </div>
        </div>
      </div>

      {/* AI Assessment Statement Box (The "TL;DR") */}
      <div className="p-5 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/20 via-[var(--surface-hover)] to-transparent relative">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-md bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400 mb-1">
              AI FORENSIC ASSESSMENT (TL;DR)
            </div>
            <p className="text-sm sm:text-base text-[var(--text)] font-serif leading-relaxed">
              "{executiveSummary.aiAssessment}"
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-mono text-[var(--text-muted)]">
              <span>Confirmed Believers: <strong className="text-[var(--text)]">{executiveSummary.infectedCount} nodes</strong> ({executiveSummary.saturationPct}%)</span>
              <span>•</span>
              <span>Total Population: <strong className="text-[var(--text)]">{executiveSummary.totalPopulation} agents</strong></span>
              <span>•</span>
              <span>Replication Baseline: <strong className="text-[var(--text)]">R₀ = {executiveSummary.peakR0}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
