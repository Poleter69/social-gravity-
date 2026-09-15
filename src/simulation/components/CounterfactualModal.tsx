/**
 * Social Gravity - Counterfactual Branching Comparison Modal
 *
 * Renders side-by-side comparative analysis of parallel simulation branches
 * launched from the exact same historical tick T_branch.
 */

import React from 'react';
import { 
  GitFork, 
  X, 
  CheckCircle2, 
  TrendingDown, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Flame
} from 'lucide-react';
import { CounterfactualComparisonResult } from '../counterfactualEngine';

interface CounterfactualModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CounterfactualComparisonResult | null;
  onApplyBranch?: (branchId: string) => void;
}

export const CounterfactualModal: React.FC<CounterfactualModalProps> = ({
  isOpen,
  onClose,
  result,
  onApplyBranch,
}) => {
  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="bg-gravity-950 border border-gravity-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gravity-800 flex items-center justify-between bg-gravity-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400">
              <GitFork className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white">
                  Counterfactual Branching Matrix
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-600">
                  Branched at Tick t={result.branchTick}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulated 3 parallel trajectories over {result.evaluationHorizonRounds} rounds from identical psychological state
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gravity-900 hover:bg-gravity-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Strategic Recommendation Banner */}
        <div className="bg-gradient-to-r from-purple-950/40 via-cyan-950/30 to-emerald-950/40 border-b border-gravity-800 p-4 px-6 flex items-center gap-3 text-xs">
          <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-500/50 text-emerald-400 shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider block">
              Optimal Counterfactual Recommendation
            </span>
            <span className="text-slate-200">
              {result.recommendationRationale}
            </span>
          </div>
        </div>

        {/* Side-by-Side 3-Branch Comparison Deck */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          {result.branches.map((branch) => {
            const isRecommended = branch.branchId === result.recommendedBranchId;
            const isBaseline = branch.branchId === 'baseline';

            return (
              <div
                key={branch.branchId}
                className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
                  isRecommended
                    ? 'bg-gravity-900/90 border-emerald-500/70 shadow-glow-emerald ring-1 ring-emerald-500/50'
                    : isBaseline
                    ? 'bg-gravity-900/60 border-red-500/30'
                    : 'bg-gravity-900/70 border-gravity-800'
                }`}
              >
                <div className="space-y-4">
                  {/* Branch Title & Badges */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        isBaseline
                          ? 'bg-red-950/60 border-red-500/40 text-red-300'
                          : isRecommended
                          ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                          : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                      }`}>
                        {isBaseline ? 'Control Group' : isRecommended ? 'Recommended' : 'Alternative'}
                      </span>
                      {branch.extinctionRound && (
                        <span className="text-[10px] text-emerald-400">
                          Extinct at t={branch.extinctionRound}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white">
                      {branch.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {branch.description}
                    </p>
                  </div>

                  {/* Primary Metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gravity-800 text-xs">
                    <div className="bg-gravity-950/80 p-2.5 rounded-lg border border-gravity-800/80">
                      <span className="text-[10px] text-slate-400 uppercase block flex items-center gap-1">
                        <Flame className="h-3 w-3 text-red-400" /> Infected
                      </span>
                      <span className="text-lg font-bold text-red-400 mt-0.5 block">
                        {branch.finalBelieverCount}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {branch.finalAdoptionRate}% adoption
                      </span>
                    </div>

                    <div className="bg-gravity-950/80 p-2.5 rounded-lg border border-gravity-800/80">
                      <span className="text-[10px] text-slate-400 uppercase block flex items-center gap-1">
                        <TrendingDown className="h-3 w-3 text-emerald-400" /> Prevention
                      </span>
                      <span className={`text-lg font-bold mt-0.5 block ${
                        branch.containmentEfficiency > 0 ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        {branch.containmentEfficiency > 0 ? `-${branch.containmentEfficiency}%` : '0%'}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        vs. baseline
                      </span>
                    </div>

                    <div className="bg-gravity-950/80 p-2.5 rounded-lg border border-gravity-800/80">
                      <span className="text-[10px] text-slate-400 uppercase block flex items-center gap-1">
                        <Zap className="h-3 w-3 text-amber-400" /> Peak R₀
                      </span>
                      <span className="text-base font-bold text-amber-400 mt-0.5 block">
                        {branch.peakR0}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        transmission rate
                      </span>
                    </div>

                    <div className="bg-gravity-950/80 p-2.5 rounded-lg border border-gravity-800/80">
                      <span className="text-[10px] text-slate-400 uppercase block flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-400" /> Fact-Checked
                      </span>
                      <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                        {branch.finalDebunkerCount}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        debunkers
                      </span>
                    </div>
                  </div>

                  {/* Visual Adoption Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Adoption Penetration</span>
                      <span className="font-bold text-white">{branch.finalAdoptionRate}%</span>
                    </div>
                    <div className="w-full bg-gravity-950 h-2 rounded-full overflow-hidden border border-gravity-800">
                      <div 
                        className={`h-full transition-all ${
                          isBaseline ? 'bg-red-500' : isRecommended ? 'bg-emerald-500' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${branch.finalAdoptionRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                {onApplyBranch && !isBaseline && (
                  <div className="pt-4 border-t border-gravity-800 mt-4">
                    <button
                      onClick={() => {
                        onApplyBranch(branch.branchId);
                        onClose();
                      }}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isRecommended
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-emerald'
                          : 'bg-gravity-800 hover:bg-gravity-700 text-slate-300'
                      }`}
                    >
                      <span>Deploy Counter-Intervention</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-gravity-800 bg-gravity-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>Social Gravity Counterfactual Engine • Isolated Branch Testing</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gravity-800 hover:bg-gravity-700 text-slate-200 transition-colors cursor-pointer"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
