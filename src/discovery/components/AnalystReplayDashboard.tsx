/**
 * Social Gravity - Analyst Replay Dashboard
 *
 * Professional command center interface providing:
 * - Threat-level assessment & early warning risk indicators
 * - Dynamic R0 and Cascade Velocity meters
 * - Bridge saturation & echo chamber containment metrics
 * - Chronological intervention audit log
 * - One-click counterfactual branching launcher
 */

import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  GitFork, 
  History, 
  Flame, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';
import { SimulationState } from '../../simulation/types';
import { Society } from '../../society/types/society';

interface AnalystReplayDashboardProps {
  simState: SimulationState | null;
  society: Society;
  currentRound: number;
  maxRecordedRound: number;
  onLaunchCounterfactual: () => void;
  onScrubToRound: (round: number) => void;
}

export const AnalystReplayDashboard: React.FC<AnalystReplayDashboardProps> = ({
  simState,
  society,
  currentRound,
  maxRecordedRound,
  onLaunchCounterfactual,
  onScrubToRound,
}) => {
  const history = simState?.telemetryHistory || [];
  const currentTelemetry = history.find(t => t.round === currentRound) || history[history.length - 1];

  const totalPop = society.summary.totalPopulation || 1;
  const believerCount = currentTelemetry?.believerCount ?? 0;
  const debunkerCount = currentTelemetry?.debunkerCount ?? 0;
  const currentR0 = currentTelemetry?.r0 ?? 0;
  const velocity = currentTelemetry?.cascadeVelocity ?? 0;

  // Calculate bridge saturation (proportion of bridge nodes that are believers)
  const bridgeNodes = society.agents.filter(a => a.isBridge);
  const infectedBridges = bridgeNodes.filter(
    a => simState?.agentStates.get(a.id) === 'BELIEVER'
  ).length;
  const bridgeSaturationPct = bridgeNodes.length > 0 
    ? Number(((infectedBridges / bridgeNodes.length) * 100).toFixed(1)) 
    : 0;

  // Threat Level logic
  const threatLevel: 'CRITICAL' | 'ELEVATED' | 'CONTAINED' | 'MINIMAL' = 
    currentR0 >= 2.0 || bridgeSaturationPct >= 50
      ? 'CRITICAL'
      : currentR0 >= 1.0 || velocity >= 3
      ? 'ELEVATED'
      : debunkerCount > believerCount
      ? 'CONTAINED'
      : 'MINIMAL';

  const threatColor = 
    threatLevel === 'CRITICAL' 
      ? 'text-red-400 bg-red-950/70 border-red-500/50 shadow-glow-red'
      : threatLevel === 'ELEVATED'
      ? 'text-amber-400 bg-amber-950/70 border-amber-500/50'
      : threatLevel === 'CONTAINED'
      ? 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50'
      : 'text-cyan-400 bg-cyan-950/70 border-cyan-500/50';

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Threat Assessment Hero Header */}
      <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
              Mission Threat Matrix
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${threatColor}`}>
              {threatLevel} SEVERITY
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Analyst Intelligence & Cascade Replay Center
          </h2>
          <p className="text-slate-400 text-xs">
            Temporal audit log at round <strong>t={currentRound}</strong> (max: <strong>t={maxRecordedRound}</strong>) across {society.name}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onLaunchCounterfactual}
            disabled={!simState || history.length === 0}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-bold transition-all shadow-glow-purple disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <GitFork className="h-4 w-4" />
            <span>Launch Counterfactual Branch</span>
          </button>
        </div>
      </div>

      {/* Primary Threat & Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-4 space-y-1">
          <span className="text-slate-400 uppercase text-[10px] block flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" /> Effective R₀(t)
          </span>
          <span className="text-2xl font-extrabold text-amber-400 block">
            {currentR0}
          </span>
          <span className="text-[10px] text-slate-500">
            {currentR0 > 1 ? 'Super-critical growth' : currentR0 === 0 ? 'Extinguished' : 'Sub-critical decay'}
          </span>
        </div>

        <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-4 space-y-1">
          <span className="text-slate-400 uppercase text-[10px] block flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-red-400" /> Cascade Velocity
          </span>
          <span className="text-2xl font-extrabold text-red-400 block">
            +{velocity} <span className="text-xs font-normal text-slate-500">infections/round</span>
          </span>
          <span className="text-[10px] text-slate-500">
            Depth: {currentTelemetry?.maxCascadeDepth ?? 0} hops from seed
          </span>
        </div>

        <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-4 space-y-1">
          <span className="text-slate-400 uppercase text-[10px] block flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-cyan-400" /> Bridge Saturation
          </span>
          <span className="text-2xl font-extrabold text-cyan-400 block">
            {bridgeSaturationPct}%
          </span>
          <span className="text-[10px] text-slate-500">
            {infectedBridges} of {bridgeNodes.length} brokers breached
          </span>
        </div>

        <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-4 space-y-1">
          <span className="text-slate-400 uppercase text-[10px] block flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Fact-Check Ratio
          </span>
          <span className="text-2xl font-extrabold text-emerald-400 block">
            {((debunkerCount / totalPop) * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500">
            {debunkerCount} confirmed debunkers
          </span>
        </div>
      </div>

      {/* Active Early-Warning Alert Feeds */}
      <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gravity-800">
          <span className="text-white font-bold uppercase text-[11px] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Active Early-Warning Threat Feeds
          </span>
          <span className="text-[10px] text-slate-400">
            Automated Algorithmic Threshold Alarms
          </span>
        </div>

        <div className="space-y-2">
          {bridgeSaturationPct >= 30 && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white font-bold">Cross-Community Bridge Containment Breach</strong>
                <span className="text-[11px] text-slate-300">
                  Over {bridgeSaturationPct}% of inter-cluster structural brokers have been compromised, enabling epidemic spillover into isolated sub-communities.
                </span>
              </div>
            </div>
          )}

          {currentR0 >= 1.5 && (
            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 flex items-start gap-2.5">
              <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white font-bold">Hyper-Propagation Velocity Warning</strong>
                <span className="text-[11px] text-slate-300">
                  Reproduction rate R₀ is currently {currentR0}, exceeding sustainable epidemic containment thresholds.
                </span>
              </div>
            </div>
          )}

          {currentTelemetry && currentTelemetry.newDebunked > 0 && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white font-bold">Counter-Intervention Inoculation Active</strong>
                <span className="text-[11px] text-slate-300">
                  Verified debunking signals registered +{currentTelemetry.newDebunked} adoptions in this round, establishing firewall boundaries.
                </span>
              </div>
            </div>
          )}

          {bridgeSaturationPct < 30 && currentR0 < 1.5 && (
            <div className="p-4 text-center text-slate-500 text-xs">
              No critical threat alarms active. Propagation metrics remain within baseline containment tolerances.
            </div>
          )}
        </div>
      </div>

      {/* Historical Audit Trail & Timeline Navigation */}
      <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gravity-800">
          <span className="text-white font-bold uppercase text-[11px] flex items-center gap-2">
            <History className="h-4 w-4 text-cyan-400" />
            Simulation Step History & Jump Points
          </span>
          <span className="text-[10px] text-slate-400">
            Click any step to scrub instant time travel
          </span>
        </div>

        {history.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {history.map((t) => {
              const isSelected = t.round === currentRound;
              return (
                <button
                  key={t.round}
                  onClick={() => onScrubToRound(t.round)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-glow-cyan'
                      : 'bg-gravity-950/60 border-gravity-800 text-slate-400 hover:border-gravity-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">t={t.round}</span>
                    {t.r0 > 1.5 && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                  </div>
                  <div className="text-[10px] text-red-400 mt-1 font-semibold">
                    {t.believerCount} inf
                  </div>
                  <div className="text-[9px] text-slate-500">
                    R₀: {t.r0}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            No historical telemetry logged yet. Begin simulation diffusion to record rounds.
          </div>
        )}
      </div>
    </div>
  );
};
