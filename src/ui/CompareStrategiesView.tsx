import React from 'react';
import { 
  GitFork, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight, 
  Zap, 
  Flame, 
  Sparkles,
  Info
} from 'lucide-react';
import { CounterfactualComparisonResult } from '../simulation/counterfactualEngine';

interface CompareStrategiesViewProps {
  comparisonResult: CounterfactualComparisonResult | null;
  currentRound: number;
  onRunComparison: () => void;
  onApplyBranch: (branchId: string) => void;
  onSwitchToAnalyze: () => void;
}

export const CompareStrategiesView: React.FC<CompareStrategiesViewProps> = ({
  comparisonResult,
  currentRound,
  onRunComparison,
  onApplyBranch,
  onSwitchToAnalyze,
}) => {
  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-6 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-mono mb-2">
            <GitFork className="w-3.5 h-3.5 text-purple-400" />
            <span>STAGE 4: INTERVENTION OPTIMIZER</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Compare Intervention Strategies
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Evaluate parallel prospective trajectories launched from Round {currentRound} with identical node psychologies. Identify the Pareto-optimal containment plan.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRunComparison}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-bold text-xs font-mono shadow-glow-purple transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Re-compute Strategies</span>
          </button>
        </div>
      </div>

      {/* Strategic Recommendation Banner */}
      {comparisonResult && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 px-6 flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-500/50 text-emerald-400 shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold uppercase text-xs tracking-wider">
                Recommended Decision Brief
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-900/70 text-emerald-300 border border-emerald-600">
                Pareto Optimal
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {comparisonResult.recommendationRationale}
            </p>
          </div>
        </div>
      )}

      {/* 3 Strategy Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Strategy 1: No Action */}
        <div className="rounded-2xl border border-red-500/30 bg-slate-900/70 p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-red-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4" />
                Strategy 1
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                Baseline (Unchecked)
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">No Action</h3>
              <p className="text-xs text-slate-400 mt-1">
                Passive observation without counter-narrative injection or network throttling.
              </p>
            </div>

            {/* Metrics */}
            <div className="space-y-2.5 pt-3 border-t border-slate-800/80 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Containment Rate</span>
                <span className="text-red-400 font-bold">0.0%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Resource Cost</span>
                <span className="text-slate-300 font-bold">0.0 Units</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Spread Reduction</span>
                <span className="text-red-400 font-bold">0 Nodes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Peak Spread Rate (R₀)</span>
                <span className="text-red-400 font-bold">
                  {comparisonResult?.branches.find(b => b.branchId === 'baseline')?.peakR0 ?? 2.4}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 font-bold text-slate-200 mb-1">
                <Info className="w-3.5 h-3.5 text-red-400" />
                <span>Risk Projection</span>
              </div>
              Narrative achieves runaway adoption across peripheral clusters within 8 rounds.
            </div>
          </div>

          <button
            disabled
            className="w-full py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-500 font-mono text-xs cursor-not-allowed"
          >
            Default Trajectory
          </button>
        </div>

        {/* Strategy 2: Public Debunk (Broadcast) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-amber-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                Strategy 2
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                Broad Broadcast
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Public Debunk</h3>
              <p className="text-xs text-slate-400 mt-1">
                High-volume public fact-check broadcast across general feed algorithms.
              </p>
            </div>

            {/* Metrics */}
            <div className="space-y-2.5 pt-3 border-t border-slate-800/80 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Containment Rate</span>
                <span className="text-amber-400 font-bold">
                  {((comparisonResult?.branches.find(b => b.branchId === 'influencer_containment')?.containmentEfficiency ?? 0.38) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Resource Cost</span>
                <span className="text-amber-400 font-bold">6.0 Units (High)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Spread Reduction</span>
                <span className="text-amber-300 font-bold">
                  -{Math.max(1, (comparisonResult?.branches.find(b => b.branchId === 'baseline')?.finalBelieverCount ?? 20) - (comparisonResult?.branches.find(b => b.branchId === 'influencer_containment')?.finalBelieverCount ?? 15))} Nodes
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Peak Spread Rate (R₀)</span>
                <span className="text-amber-400 font-bold">
                  {comparisonResult?.branches.find(b => b.branchId === 'influencer_containment')?.peakR0 ?? 1.6}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 font-bold text-slate-200 mb-1">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>Analytical Trade-Off</span>
              </div>
              Broad debunking reaches high-trust users, but risks triggering backfire effect in skeptical sub-communities.
            </div>
          </div>

          <button
            onClick={() => {
              onApplyBranch('influencer_containment');
              onSwitchToAnalyze();
            }}
            className="w-full py-2.5 rounded-xl border border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 font-bold font-mono text-xs transition-colors cursor-pointer"
          >
            Apply Public Debunk
          </button>
        </div>

        {/* Strategy 3: Bridge Targeting (Recommended) */}
        <div className="rounded-2xl border-2 border-emerald-500/80 bg-slate-900/95 p-6 flex flex-col justify-between space-y-6 shadow-glow-emerald ring-1 ring-emerald-500/30">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Strategy 3 ★ Recommended
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 border border-emerald-500 font-bold">
                Optimal
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Bridge Inoculation</h3>
              <p className="text-xs text-slate-400 mt-1">
                Surgical counter-briefing targeted at cross-community bridge brokers before cross-pollination.
              </p>
            </div>

            {/* Metrics */}
            <div className="space-y-2.5 pt-3 border-t border-slate-800/80 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Containment Rate</span>
                <span className="text-emerald-400 font-extrabold text-sm">
                  {((comparisonResult?.branches.find(b => b.branchId === 'bridge_inoculation')?.containmentEfficiency ?? 0.825) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Resource Cost</span>
                <span className="text-emerald-400 font-bold">2.0 Units (Minimal)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Spread Reduction</span>
                <span className="text-emerald-300 font-bold">
                  -{Math.max(5, (comparisonResult?.branches.find(b => b.branchId === 'baseline')?.finalBelieverCount ?? 20) - (comparisonResult?.branches.find(b => b.branchId === 'bridge_inoculation')?.finalBelieverCount ?? 6))} Nodes
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Peak Spread Rate (R₀)</span>
                <span className="text-emerald-400 font-bold">
                  {comparisonResult?.branches.find(b => b.branchId === 'bridge_inoculation')?.peakR0 ?? 1.1} (Contained)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Key Analyst Insight</span>
              </div>
              Neutralizing just 2 topological bridges isolates the cascade within its origin cluster, protecting 82.5% of the network.
            </div>
          </div>

          <button
            onClick={() => {
              onApplyBranch('bridge_inoculation');
              onSwitchToAnalyze();
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold font-mono text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Apply Bridge Inoculation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
