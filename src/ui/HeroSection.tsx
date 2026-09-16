import React from 'react';
import { Database, Play, FileText, ChevronDown, ChevronUp, Sparkles, Shield, Cpu } from 'lucide-react';

interface HeroSectionProps {
  onLoadDataset: () => void;
  onRunDemo: () => void;
  onOpenReport: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onLoadDataset,
  onRunDemo,
  onOpenReport,
  isCollapsed,
  onToggleCollapse,
}) => {
  if (isCollapsed) {
    return (
      <div className="flex items-center justify-between px-6 py-2 bg-slate-900/40 border-b border-slate-800/60 backdrop-blur-sm text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">Social Gravity</span>
          <span className="text-slate-500">— Predict narrative cascades & evaluate interventions</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <span>Expand Hero</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950 p-8 md:p-10 shadow-2xl backdrop-blur-xl">
      {/* Background ambient radial gradients */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[280px] bg-gradient-to-b from-cyan-500/10 via-purple-500/5 to-transparent blur-3xl opacity-70" />
      <div className="pointer-events-none absolute -bottom-10 right-10 w-[300px] h-[200px] bg-emerald-500/5 blur-2xl opacity-60" />

      {/* Header Badges & Collapse */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/70 border border-slate-700/60 text-slate-300 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Decision Intelligence OS v2.0</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-medium">Offline-First WASM</span>
        </div>

        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-colors cursor-pointer"
          title="Minimize header to maximize workspace"
        >
          <span>Minimize</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4 py-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Predict how narratives spread{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            before they escalate.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed">
          Import a real discussion. Watch it evolve. Compare interventions.
        </p>

        {/* The 3 Primary Actions */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5">
          <button
            onClick={onLoadDataset}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-medium text-sm transition-all duration-150 shadow-lg hover:shadow-cyan-500/10 cursor-pointer"
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Load Dataset</span>
          </button>

          <button
            onClick={onRunDemo}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm transition-all duration-150 shadow-lg shadow-cyan-500/20 hover:scale-[1.02] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Run Demo (30s Tour)</span>
          </button>

          <button
            onClick={onOpenReport}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-medium text-sm transition-all duration-150 shadow-lg hover:shadow-purple-500/10 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Open Report</span>
          </button>
        </div>

        {/* Trust & Architecture Credentials */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 border-t border-slate-800/60 font-mono">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero Outbound Telemetry</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Local Google GoEmotions WASM</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            <span>Deterministic SplitMix32 Replay</span>
          </div>
        </div>
      </div>
    </section>
  );
};
