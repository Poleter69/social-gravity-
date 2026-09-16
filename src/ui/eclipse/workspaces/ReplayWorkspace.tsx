/**
 * Social Gravity — Eclipse ReplayWorkspace
 * 100vh NLE Video-Editor Replay Workstation with Time-Travel & Keyframe Scrubbing.
 * Zero page-level scrolling, calm Apple/Palantir aesthetic.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitFork,
} from 'lucide-react';
import { SimulationState } from '../../../simulation/types';
import { Society } from '../../../society/types/society';
import { NetworkCanvas } from '../../../society/components/NetworkCanvas';

export interface ReplayWorkspaceProps {
  simState: SimulationState | null;
  society: Society;
  currentRound: number;
  maxRecordedRound: number;
  onScrubToRound: (round: number) => void;
  onLaunchCounterfactual: () => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

export const ReplayWorkspace: React.FC<ReplayWorkspaceProps> = ({
  simState,
  society,
  currentRound,
  maxRecordedRound,
  onScrubToRound,
  onLaunchCounterfactual,
}) => {
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const history = simState?.telemetryHistory || [];
  const currentTelemetry = history.find((t) => t.round === currentRound) || history[history.length - 1];

  const totalPop = society.summary.totalPopulation || 1;
  const believerCount = currentTelemetry?.believerCount ?? 0;
  const debunkerCount = currentTelemetry?.debunkerCount ?? 0;
  const currentR0 = currentTelemetry?.r0 ?? 0;
  const velocity = currentTelemetry?.cascadeVelocity ?? 0;

  // Bridge saturation
  const bridgeNodes = society.agents.filter((a) => a.isBridge);
  const infectedBridges = bridgeNodes.filter(
    (a) => simState?.agentStates.get(a.id) === 'BELIEVER'
  ).length;
  const bridgeSaturationPct = bridgeNodes.length > 0
    ? Number(((infectedBridges / bridgeNodes.length) * 100).toFixed(1))
    : 0;

  // Threat severity
  const isCritical = currentR0 >= 1.8 || bridgeSaturationPct >= 40;
  const isElevated = currentR0 >= 1.0 || velocity >= 3;
  const threatLabel = isCritical ? 'CRITICAL' : isElevated ? 'ELEVATED' : 'NOMINAL';
  const threatColor = isCritical ? '#EF4444' : isElevated ? '#F59E0B' : '#22C55E';

  return (
    <div className="h-full w-full flex flex-col p-6 overflow-hidden bg-[#09090B] text-[#FAFAFA] select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[#27272A] shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#4F8CFF] bg-[#4F8CFF]/10 px-2 py-0.5 rounded border border-[#4F8CFF]/30">
              STAGE 3: TEMPORAL REPLAY
            </span>
            <span className="text-[12px] font-mono text-[#71717A]">
              TIME-TRAVEL & COUNTERFACTUAL BRANCHING
            </span>
          </div>
          <h1 className="text-[28px] leading-[34px] font-semibold text-[#FAFAFA] tracking-tight mt-1">
            Analyst Replay Engine
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLaunchCounterfactual}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4F8CFF] hover:bg-[#3B79F0] text-[#09090B] font-semibold text-[13px] cursor-pointer shadow-lg shadow-[#4F8CFF]/20"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Branch Counterfactual at t={currentRound}</span>
          </motion.button>
        </div>
      </div>

      {/* 4 Metric Cards HUD (Budget strictly enforced) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4 shrink-0">
        {/* Metric 1: Threat */}
        <div className="bg-[#111114] border border-[#27272A] rounded-xl p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A]">
            <span>THREAT SEVERITY</span>
            <span
              className="px-1.5 py-0.2 rounded font-bold uppercase"
              style={{ color: threatColor, backgroundColor: `${threatColor}20` }}
            >
              {threatLabel}
            </span>
          </div>
          <div className="text-[24px] font-semibold text-[#FAFAFA] mt-1" style={{ color: threatColor }}>
            {threatLabel}
          </div>
          <div className="text-[11px] text-[#71717A] mt-1">
            {infectedBridges} of {bridgeNodes.length} bridges saturated
          </div>
        </div>

        {/* Metric 2: R0 Spread Rate */}
        <div className="bg-[#111114] border border-[#27272A] rounded-xl p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A]">
            <span>REPRODUCTION R₀(t)</span>
            <span className="text-[#4F8CFF]">ROUND {currentRound}</span>
          </div>
          <div className="text-[24px] font-semibold text-[#FAFAFA] mt-1">
            {currentR0.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#71717A] mt-1">
            {currentR0 > 1 ? 'Supercritical cascade' : 'Subcritical containment'}
          </div>
        </div>

        {/* Metric 3: Infected Ratio */}
        <div className="bg-[#111114] border border-[#27272A] rounded-xl p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A]">
            <span>BELIEVER SATURATION</span>
            <span className="text-[#EF4444]">{believerCount} nodes</span>
          </div>
          <div className="text-[24px] font-semibold text-[#FAFAFA] mt-1">
            {((believerCount / totalPop) * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-[#71717A] mt-1">
            {debunkerCount} active debunkers
          </div>
        </div>

        {/* Metric 4: Cascade Velocity */}
        <div className="bg-[#111114] border border-[#27272A] rounded-xl p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A]">
            <span>CASCADE VELOCITY</span>
            <span className="text-[#F59E0B]">Δ nodes/round</span>
          </div>
          <div className="text-[24px] font-semibold text-[#FAFAFA] mt-1">
            {velocity}
          </div>
          <div className="text-[11px] text-[#71717A] mt-1">
            Transmission rate per round
          </div>
        </div>
      </div>

      {/* Center & Bottom Split Area: Network Canvas Replay (60%) + Scrubber & Audit Log (40%) */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Left Area: Interactive Replay Network Canvas */}
        <div className="flex-1 h-full min-w-0 rounded-2xl overflow-hidden border border-[#27272A] relative">
          <NetworkCanvas
            society={society}
            simulationStates={simState?.agentStates}
            patientZeroIds={simState?.patientZeroIds}
            recentTransmissions={simState?.recentTransmissions}
            onScrubToRound={onScrubToRound}
            className="w-full h-full"
          />
        </div>

        {/* Right Area: NLE Scrubber & Chronological Audit Log (40%) */}
        <div className="w-96 flex flex-col gap-4 shrink-0 h-full min-h-0">
          {/* NLE Scrubber Bar */}
          <div className="bg-[#111114] border border-[#27272A] rounded-2xl p-4 shrink-0 space-y-3">
            <div className="flex items-center justify-between text-[12px] font-mono">
              <div className="flex items-center gap-2">
                <span className="text-[#FAFAFA] font-semibold">NLE Scrub Track:</span>
                <span className="text-[#4F8CFF]">t={currentRound}</span>
                <span className="text-[#71717A]">/ t={Math.max(maxRecordedRound, 40)}</span>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-[#71717A]">SPEED:</span>
                {[0.5, 1.0, 2.0, 4.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlaybackSpeed(s)}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      playbackSpeed === s
                        ? 'bg-[#27272A] text-[#4F8CFF] font-bold'
                        : 'text-[#71717A] hover:text-[#A1A1AA]'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Scrubber slider */}
            <div className="relative pt-1 pb-2">
              <input
                type="range"
                min={0}
                max={Math.max(maxRecordedRound, 40)}
                value={currentRound}
                onChange={(e) => onScrubToRound(Number(e.target.value))}
                className="w-full accent-[#4F8CFF] bg-[#27272A] h-2 rounded-lg appearance-none cursor-pointer"
              />

              {/* Keyframe Markers along timeline */}
              <div className="flex justify-between text-[10px] font-mono text-[#71717A] pt-1">
                <span>t=0 (Seed)</span>
                <span>t=3 (First Bridge)</span>
                <span>t=8 (Peak R₀)</span>
                <span>t=12 (Fact-Check)</span>
                <span>t={Math.max(maxRecordedRound, 40)} (End)</span>
              </div>
            </div>
          </div>

          {/* Bottom Area: Chronological Round Events & Telemetry */}
          <div className="flex-1 bg-[#111114] border border-[#27272A] rounded-2xl flex flex-col overflow-hidden min-h-0">
            <div className="h-10 px-4 bg-[#18181B]/80 border-b border-[#27272A] flex items-center justify-between text-[11px] font-mono text-[#71717A]">
              <span>CHRONOLOGICAL TELEMETRY AUDIT LOG</span>
              <span>{history.length} TICKS</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[#71717A] text-[13px] text-center p-4">
                  No round telemetry recorded yet. Start or step the simulation to record ticks.
                </div>
              ) : (
                history.map((t) => {
                  const isCurrent = t.round === currentRound;

                  return (
                    <button
                      key={t.round}
                      onClick={() => onScrubToRound(t.round)}
                      className={`w-full flex items-center justify-between p-2.5 px-3 rounded-xl border text-left font-mono text-[11px] transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[#18181B] border-[#4F8CFF] text-[#FAFAFA]'
                          : 'bg-[#141417] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-[#4F8CFF]' : 'bg-[#71717A]'}`} />
                        <span className="font-bold text-[#FAFAFA]">Round {t.round}</span>
                        <span className="text-[#71717A]">
                          R₀: <strong className={t.r0 > 1 ? 'text-[#EF4444]' : 'text-[#22C55E]'}>{t.r0.toFixed(1)}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-[#EF4444]">
                          {t.believerCount} Believers
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
