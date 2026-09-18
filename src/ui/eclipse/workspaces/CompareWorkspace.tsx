/**
 * Social Gravity — Eclipse CompareWorkspace
 * 100vh Counterfactual Intervention Optimizer with Apple/Palantir aesthetic.
 * 3 equal strategy cards, clear Pareto-optimal winner highlight, zero page scroll.
 * Fully supports Light & Dark themes via design tokens.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  Flame,
  Shield,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { CounterfactualComparisonResult } from '../../../simulation/counterfactualEngine';

export interface CompareWorkspaceProps {
  comparisonResult: CounterfactualComparisonResult | null;
  currentRound: number;
  onRunComparison: () => void;
  onApplyBranch: (branchId: string) => void;
  onNavigateToMission: () => void;
}

export const CompareWorkspace: React.FC<CompareWorkspaceProps> = ({
  comparisonResult,
  currentRound,
  onRunComparison,
  onApplyBranch,
}) => {
  const branches = comparisonResult?.branches || [];
  const baseline = branches.find((b) => b.branchId === 'baseline');
  const bridge = branches.find((b) => b.branchId === 'bridge_inoculation');
  const influencer = branches.find((b) => b.branchId === 'influencer_containment');

  return (
    <div className="h-full w-full flex flex-col p-6 overflow-hidden bg-[var(--bg)] text-[var(--text)] select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[var(--border)] shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#4F8CFF] bg-[#4F8CFF]/10 px-2 py-0.5 rounded border border-[#4F8CFF]/30">
              STAGE 4: STRATEGY OPTIMIZER
            </span>
            <span className="text-[12px] font-mono text-[var(--text-tertiary)]">
              EVALUATING FROM ROUND {currentRound}
            </span>
          </div>
          <h1 className="text-[28px] leading-[34px] font-semibold text-[var(--text)] tracking-tight mt-1">
            Counterfactual Strategy Comparison
          </h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
            Compare prospective contagion trajectories under parallel intervention hypotheses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.12 }}
            onClick={onRunComparison}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4F8CFF] hover:bg-[#3B79F0] text-white font-semibold text-[13px] cursor-pointer shadow-lg shadow-[#4F8CFF]/20"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Re-compute Trajectories</span>
          </motion.button>
        </div>
      </div>

      {/* Rationale Brief Banner (if computed) */}
      {comparisonResult && (
        <div className="my-4 px-4 py-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#22C55E]/20 flex items-center justify-center text-[#22C55E] shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#22C55E]">
                PARETO OPTIMAL RECOMMENDATION
              </span>
              <p className="text-[13px] text-[var(--text)] font-medium leading-snug">
                {comparisonResult.recommendationRationale}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-1 rounded bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40 shrink-0 uppercase font-bold">
            Target: {comparisonResult.recommendedBranchId.replace('_', ' ')}
          </span>
        </div>
      )}

      {/* 3 Strategy Columns (100vh isolated flex, equal 1/3 layout) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 min-h-0 pt-2 pb-2">
        {/* Strategy 1: Baseline / No Action */}
        <div className="bg-[var(--surface)] border border-[var(--border)] shadow-sm rounded-2xl p-5 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase font-bold text-[#EF4444] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> Strategy 1
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30">
                Baseline (Unchecked)
              </span>
            </div>

            <div>
              <h2 className="text-[18px] font-semibold text-[var(--text)]">Passive Observation</h2>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
                Zero counter-narrative injection or network throttling. Natural psychological cascade.
              </p>
            </div>

            {/* Metrics */}
            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
              <div className="flex justify-between text-[12px]">
                <span className="text-[var(--text-muted)]">Peak R₀</span>
                <span className="font-mono text-[#EF4444] font-bold">
                  {baseline ? baseline.peakR0.toFixed(2) : '1.85'}
                </span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[var(--text-muted)]">Final Believers</span>
                <span className="font-mono text-[#EF4444] font-bold">
                  {baseline ? `${baseline.finalBelieverCount} nodes (${baseline.finalAdoptionRate.toFixed(0)}%)` : '54%'}
                </span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[var(--text-muted)]">Intervention Cost</span>
                <span className="font-mono text-[#22C55E]">0 units (Free)</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[var(--text-muted)]">Containment Delta</span>
                <span className="font-mono text-[var(--text-tertiary)]">0% (Baseline Reference)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            <button
              onClick={() => onApplyBranch('baseline')}
              className="w-full py-2 px-3 rounded-lg bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              Simulate Baseline
            </button>
          </div>
        </div>

        {/* Strategy 2: Bridge Inoculation */}
        <div className={`bg-[var(--surface)] rounded-2xl p-5 flex flex-col justify-between overflow-y-auto relative shadow-sm ${
          comparisonResult?.recommendedBranchId === 'bridge_inoculation'
            ? 'border-2 border-[#22C55E] shadow-2xl shadow-[#22C55E]/10'
            : 'border border-[var(--border)]'
        }`}>
          {comparisonResult?.recommendedBranchId === 'bridge_inoculation' && (
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-[#22C55E] text-white text-[10px] font-mono font-bold uppercase tracking-wider">
              Recommended Choice
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase font-bold text-[#4F8CFF] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Strategy 2
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4F8CFF]/10 text-[#4F8CFF] border border-[#4F8CFF]/30">
                Topological Choke
              </span>
            </div>

            <div>
              <h2 className="text-[18px] font-semibold text-[var(--text)]">Bridge Inoculation</h2>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
                Vaccinates high-betweenness inter-community connector nodes to quarantine subgraphs.
              </p>
            </div>

            {/* Metrics */}
            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
              <div className="flex justify-between text-[12px]">
                <span className="text-[var(--text-muted)]">Peak R₀</span>
                <span className="font-mono text-[#22C55E] font-bold">
                  {bridge ? bridge.peakR0.toFixed(2) : '0.92'}
                </span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[var(--text-muted)]">Final Believers</span>
                <span className="font-mono text-[#22C55E] font-bold">
                  {bridge ? `${bridge.finalBelieverCount} nodes (${bridge.finalAdoptionRate.toFixed(0)}%)` : '12%'}
                </span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[var(--text-muted)]">Intervention Cost</span>
                <span className="font-mono text-[#F59E0B]">
                  {bridge ? `${bridge.inoculatedAgentIds.length * 5} units` : '15 units'}
                </span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[var(--text-muted)]">Containment Delta</span>
                <span className="font-mono text-[#22C55E] font-bold">
                  {bridge ? `+${(bridge.containmentEfficiency * 100).toFixed(0)}% containment` : '+78%'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onApplyBranch('bridge_inoculation')}
              className="w-full py-2.5 px-3 rounded-lg bg-[#22C55E] hover:bg-[#22C55E]/90 text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#22C55E]/20"
            >
              <span>Deploy Bridge Inoculation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        {/* Strategy 3: Influencer Containment */}
        <div className={`bg-[var(--surface)] rounded-2xl p-5 flex flex-col justify-between overflow-y-auto relative shadow-sm ${
          comparisonResult?.recommendedBranchId === 'influencer_containment'
            ? 'border-2 border-[#4F8CFF] shadow-2xl shadow-[#4F8CFF]/10'
            : 'border border-[var(--border)]'
        }`}>
          {comparisonResult?.recommendedBranchId === 'influencer_containment' && (
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-[#4F8CFF] text-white text-[10px] font-mono font-bold uppercase tracking-wider">
              Recommended Choice
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase font-bold text-[#F59E0B] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Strategy 3
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30">
                High-Salience Broadcaster
              </span>
            </div>

            <div>
              <h2 className="text-[18px] font-semibold text-[var(--text)]">Influencer Containment</h2>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
                Deploys authoritative debunking signals through top-k high-centrality influencers.
              </p>
            </div>

            {/* Metrics */}
            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
              <div className="flex justify-between text-[12px]">
                <span className="text-[var(--text-muted)]">Peak R₀</span>
                <span className="font-mono text-[#F59E0B] font-bold">
                  {influencer ? influencer.peakR0.toFixed(2) : '1.34'}
                </span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[var(--text-muted)]">Final Believers</span>
                <span className="font-mono text-[#F59E0B] font-bold">
                  {influencer ? `${influencer.finalBelieverCount} nodes (${influencer.finalAdoptionRate.toFixed(0)}%)` : '18%'}
                </span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[var(--text-muted)]">Intervention Cost</span>
                <span className="font-mono text-[#EF4444]">
                  {influencer ? `${influencer.inoculatedAgentIds.length * 8} units` : '42 units'}
                </span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[var(--text-muted)]">Containment Delta</span>
                <span className="font-mono text-[#F59E0B] font-bold">
                  {influencer ? `+${(influencer.containmentEfficiency * 100).toFixed(0)}% containment` : '+61%'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            <button
              onClick={() => onApplyBranch('influencer_containment')}
              className="w-full py-2 px-3 rounded-lg bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[12px] font-medium text-[var(--text)] transition-colors cursor-pointer"
            >
              Deploy Influencer Debunk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
