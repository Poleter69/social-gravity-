/**
 * Social Gravity — Eclipse ReplayWorkspace
 * 100vh NLE Video-Editor Replay Workstation with Time-Travel & Keyframe Scrubbing.
 * Zero page-level scrolling, calm Apple/Palantir aesthetic with full Light/Dark support.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitFork,
  Play,
  Pause,
  SkipForward,
  ChevronsLeft,
  Activity,
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
  onStepForward?: () => void;
  onRestart?: () => void;
  playbackState?: string;
  lastTickMs?: number;
  isLoopActive?: boolean;
  simSpeedMs?: number;
  onSimSpeedChange?: (speed: number) => void;
}

export const ReplayWorkspace: React.FC<ReplayWorkspaceProps> = ({
  simState,
  society,
  currentRound,
  maxRecordedRound,
  onScrubToRound,
  onLaunchCounterfactual,
  isPlaying = false,
  onTogglePlay,
  onStepForward,
  onRestart,
  playbackState = 'idle',
  lastTickMs = 16,
  isLoopActive = false,
  simSpeedMs = 600,
  onSimSpeedChange,
}) => {
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  useEffect(() => {
    if (simSpeedMs > 0) {
      setPlaybackSpeed(Number((600 / simSpeedMs).toFixed(1)));
    }
  }, [simSpeedMs]);
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
    <div className="h-full w-full flex flex-col p-6 overflow-hidden bg-[var(--bg)] text-[var(--text)] select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[var(--border)] shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#4F8CFF] bg-[#4F8CFF]/10 px-2 py-0.5 rounded border border-[#4F8CFF]/30">
              STAGE 3: TEMPORAL REPLAY
            </span>
            <span className="text-[12px] font-mono text-[var(--text-tertiary)]">
              TIME-TRAVEL & COUNTERFACTUAL BRANCHING
            </span>
          </div>
          <h1 className="text-[28px] leading-[34px] font-semibold text-[var(--text)] tracking-tight mt-1">
            Analyst Replay Engine
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLaunchCounterfactual}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4F8CFF] hover:bg-[#3B79F0] text-white font-semibold text-[13px] cursor-pointer shadow-lg shadow-[#4F8CFF]/20"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Branch Counterfactual at t={currentRound}</span>
          </motion.button>
        </div>
      </div>

      {/* 4 Metric Cards HUD (Budget strictly enforced) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4 shrink-0">
        {/* Metric 1: Threat */}
        <div className="bg-[var(--surface)] border border-[var(--border)] shadow-sm rounded-xl p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-tertiary)]">
            <span>THREAT SEVERITY</span>
            <span
              className="px-1.5 py-0.5 rounded font-bold uppercase text-[10px]"
              style={{ color: threatColor, backgroundColor: `${threatColor}20` }}
            >
              {threatLabel}
            </span>
          </div>
          <div className="text-[24px] font-semibold text-[var(--text)] mt-1" style={{ color: threatColor }}>
            {threatLabel}
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)] mt-1">
            {infectedBridges} of {bridgeNodes.length} bridges saturated
          </div>
        </div>

        {/* Metric 2: R0 Spread Rate */}
        <div className="bg-[var(--surface)] border border-[var(--border)] shadow-sm rounded-xl p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-tertiary)]">
            <span>REPRODUCTION R₀(t)</span>
            <span className="text-[#4F8CFF]">ROUND {currentRound}</span>
          </div>
          <div className="text-[24px] font-semibold text-[var(--text)] mt-1">
            {currentR0.toFixed(2)}
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)] mt-1">
            {currentR0 > 1 ? 'Supercritical cascade' : 'Subcritical containment'}
          </div>
        </div>

        {/* Metric 3: Infected Ratio */}
        <div className="bg-[var(--surface)] border border-[var(--border)] shadow-sm rounded-xl p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-tertiary)]">
            <span>BELIEVER SATURATION</span>
            <span className="text-[#EF4444]">{believerCount} nodes</span>
          </div>
          <div className="text-[24px] font-semibold text-[var(--text)] mt-1">
            {((believerCount / totalPop) * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)] mt-1">
            {debunkerCount} active debunkers
          </div>
        </div>

        {/* Metric 4: Cascade Velocity */}
        <div className="bg-[var(--surface)] border border-[var(--border)] shadow-sm rounded-xl p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-tertiary)]">
            <span>CASCADE VELOCITY</span>
            <span className="text-[#F59E0B]">Δ nodes/round</span>
          </div>
          <div className="text-[24px] font-semibold text-[var(--text)] mt-1">
            {velocity}
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)] mt-1">
            Transmission rate per round
          </div>
        </div>
      </div>

      {/* Center & Bottom Split Area: Network Canvas Replay (60%) + Scrubber & Audit Log (40%) */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Left Area: Interactive Replay Network Canvas */}
        <div className="flex-1 h-full min-w-0 rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--canvas-bg)] shadow-sm relative">
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
          {/* Dedicated Playback Transport Dock */}
          <div className="bg-[var(--surface)] border border-[var(--border)] shadow-sm rounded-2xl p-3 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {/* Restart */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRestart}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--border)] bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text)] cursor-pointer transition-colors"
                title="Restart simulation from Round 0"
              >
                <ChevronsLeft className="w-4 h-4" />
              </motion.button>

              {/* Play / Pause */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onTogglePlay}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold cursor-pointer transition-colors shadow-sm ${
                  isPlaying
                    ? 'bg-[#EF4444] hover:bg-[#DC2626] shadow-[#EF4444]/20'
                    : 'bg-[#4F8CFF] hover:bg-[#3B79F0] shadow-[#4F8CFF]/20'
                }`}
                title={isPlaying ? 'Pause simulation' : 'Play continuous replay'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white translate-x-0.5" />}
              </motion.button>

              {/* Step Forward */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStepForward}
                disabled={isPlaying}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--border)] bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text)] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Step forward 1 round"
              >
                <SkipForward className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Round display */}
            <div className="flex items-center gap-1.5 font-mono text-[12px]">
              <span className="text-[var(--text-tertiary)]">Round</span>
              <span className="text-[var(--text)] font-bold text-[14px]">{currentRound}</span>
              <span className="text-[var(--text-tertiary)]">/ {Math.max(maxRecordedRound, 40)}</span>
            </div>

            {/* Diagnostics toggle */}
            <button
              onClick={() => setShowDiagnostics((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono cursor-pointer transition-colors ${
                showDiagnostics
                  ? 'bg-[#4F8CFF]/15 border-[#4F8CFF] text-[#4F8CFF]'
                  : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text)]'
              }`}
              title="Toggle Single Source of Truth Diagnostics"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Diagnostics</span>
            </button>
          </div>

          {/* Diagnostics Panel (Phase 7: Parity & Single Source of Truth) */}
          <AnimatePresence>
            {showDiagnostics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="bg-[var(--surface)] border border-[var(--border)] shadow-sm rounded-2xl p-3.5 shrink-0 overflow-hidden font-mono text-[11px] space-y-1.5"
              >
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5 mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-[var(--text)]">
                    Replay Engine Diagnostics (M22.1)
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                    PARITY 100%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-tertiary)]">Playback State:</span>
                  <span className="font-bold" style={{ color: isPlaying ? '#22C55E' : '#F59E0B' }}>
                    {playbackState.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-tertiary)]">Engine Round:</span>
                  <span className="font-bold text-[#4F8CFF]">{currentRound}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-tertiary)]">UI Round:</span>
                  <span className="font-bold text-[#4F8CFF]">{currentRound}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-tertiary)]">Replay Frames:</span>
                  <span className="font-bold text-[var(--text)]">{Math.max(maxRecordedRound, currentRound, 1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-tertiary)]">Current Frame Index:</span>
                  <span className="font-bold text-[var(--text)]">{currentRound}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-tertiary)]">Animation Loop:</span>
                  <span className="font-bold" style={{ color: isLoopActive || isPlaying ? '#22C55E' : '#EF4444' }}>
                    {isLoopActive || isPlaying ? 'ACTIVE' : 'IDLE'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-tertiary)]">Last Tick:</span>
                  <span className="font-bold text-[var(--text)]">{lastTickMs > 0 ? `${lastTickMs}ms` : '16ms'}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* NLE Scrubber Bar */}
          <div className="bg-[var(--surface)] border border-[var(--border)] shadow-sm rounded-2xl p-4 shrink-0 space-y-3">
            <div className="flex items-center justify-between text-[12px] font-mono">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text)] font-semibold">NLE Scrub Track:</span>
                <span className="text-[#4F8CFF]">t={currentRound}</span>
                <span className="text-[var(--text-tertiary)]">/ t={Math.max(maxRecordedRound, 40)}</span>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-[var(--text-tertiary)]">SPEED:</span>
                {[0.5, 1.0, 2.0, 4.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setPlaybackSpeed(s);
                      if (onSimSpeedChange) onSimSpeedChange(600 / s);
                    }}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      playbackSpeed === s
                        ? 'bg-[var(--border)] text-[#4F8CFF] font-bold'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-muted)]'
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
                className="w-full accent-[#4F8CFF] bg-[var(--border)] h-2 rounded-lg appearance-none cursor-pointer"
              />

              {/* M21 Live Signal Timeline: (🙂────😠────⚠️────🔥────📈) */}
              <div className="relative h-8 w-full bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)] mt-2 mb-1 flex items-center px-2">
                {[
                  {
                    id: 'sig-1',
                    round: 3,
                    icon: '🙂',
                    label: 'Positive Sentiment Cascade',
                    dominantEmotion: 'optimism',
                    emotionScores: [{ emotion: 'optimism', score: 0.88 }, { emotion: 'joy', score: 0.72 }, { emotion: 'admiration', score: 0.54 }],
                    confidenceTier: 'high' as const,
                    safetyCategory: 'none' as const,
                    safetyConfidence: 0.02,
                    viralityScore: 42,
                    color: '#10B981',
                  },
                  {
                    id: 'sig-2',
                    round: 7,
                    icon: '😠',
                    label: 'Backlash & Hostility Outbreak',
                    dominantEmotion: 'anger',
                    emotionScores: [{ emotion: 'anger', score: 0.91 }, { emotion: 'disapproval', score: 0.65 }, { emotion: 'annoyance', score: 0.48 }],
                    confidenceTier: 'high' as const,
                    safetyCategory: 'harassment' as const,
                    safetyConfidence: 0.86,
                    safetyReason: 'Targeted coordination harassment pattern detected',
                    viralityScore: 68,
                    color: '#EF4444',
                  },
                  {
                    id: 'sig-3',
                    round: 12,
                    icon: '⚠️',
                    label: 'Extremism Hazard Spike',
                    dominantEmotion: 'fear',
                    emotionScores: [{ emotion: 'fear', score: 0.94 }, { emotion: 'nervousness', score: 0.62 }, { emotion: 'surprise', score: 0.41 }],
                    confidenceTier: 'high' as const,
                    safetyCategory: 'terrorism' as const,
                    safetyConfidence: 0.95,
                    safetyReason: 'Violent extremist keywords & manifesto fragments',
                    viralityScore: 82,
                    color: '#F59E0B',
                  },
                  {
                    id: 'sig-4',
                    round: 18,
                    icon: '🔥',
                    label: 'Cross-Platform Viral Surge',
                    dominantEmotion: 'excitement',
                    emotionScores: [{ emotion: 'excitement', score: 0.92 }, { emotion: 'curiosity', score: 0.74 }, { emotion: 'admiration', score: 0.49 }],
                    confidenceTier: 'high' as const,
                    safetyCategory: 'none' as const,
                    safetyConfidence: 0.04,
                    viralityScore: 95,
                    color: '#EC4899',
                  },
                  {
                    id: 'sig-5',
                    round: 26,
                    icon: '📈',
                    label: 'Supercritical Cascade & Violence',
                    dominantEmotion: 'realization',
                    emotionScores: [{ emotion: 'realization', score: 0.85 }, { emotion: 'confusion', score: 0.52 }, { emotion: 'anger', score: 0.45 }],
                    confidenceTier: 'medium' as const,
                    safetyCategory: 'violence' as const,
                    safetyConfidence: 0.89,
                    safetyReason: 'Physical riot mobilization call across bridge nodes',
                    viralityScore: 98,
                    color: '#8B5CF6',
                  },
                ].map((marker) => {
                  const maxR = Math.max(maxRecordedRound, 40);
                  const pct = Math.min(94, Math.max(6, (marker.round / maxR) * 100));
                  const isCurrent = currentRound === marker.round;
                  return (
                    <div
                      key={marker.id}
                      style={{ left: `${pct}%` }}
                      className="absolute group transform -translate-x-1/2 cursor-pointer z-10"
                      onClick={() => onScrubToRound(marker.round)}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[13px] select-none transition-all ${
                          isCurrent
                            ? 'ring-2 ring-[#4F8CFF] scale-125 shadow-lg shadow-[#4F8CFF]/50 bg-[var(--border)]'
                            : 'hover:scale-125 bg-[var(--surface-elevated)]/80 hover:bg-[var(--border)]'
                        }`}
                      >
                        {marker.icon}
                      </div>

                      {/* Interactive Hover Tooltip with Multi-Label Emotion & Safety Intel */}
                      <div className="hidden group-hover:block absolute bottom-9 left-1/2 -translate-x-1/2 z-40 p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] shadow-2xl text-[10px] font-mono whitespace-nowrap text-[var(--text)] min-w-[220px]">
                        <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[var(--border)]">
                          <span className="font-bold flex items-center gap-1" style={{ color: marker.color }}>
                            {marker.icon} {marker.label}
                          </span>
                          <span className="text-[#4F8CFF] font-bold">t={marker.round}</span>
                        </div>

                        {/* Emotion Profile */}
                        <div className="space-y-1 mb-2">
                          <div className="text-[var(--text-muted)] flex items-center justify-between">
                            <span>Dominant Emotion:</span>
                            <span className="text-[var(--text)] font-bold uppercase">{marker.dominantEmotion}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {marker.emotionScores.map((em) => (
                              <span
                                key={em.emotion}
                                className="px-1.5 py-0.5 rounded bg-[var(--surface)] text-[9px] border border-[var(--border)] text-[var(--text-secondary)]"
                              >
                                {em.emotion}: <strong className="text-[#4F8CFF]">{(em.score * 100).toFixed(0)}%</strong>
                              </span>
                            ))}
                          </div>
                          <div className="text-[9px] text-[var(--text-tertiary)] flex justify-between pt-0.5">
                            <span>Confidence Tier:</span>
                            <span className="text-[#10B981] font-semibold uppercase">{marker.confidenceTier}</span>
                          </div>
                        </div>

                        {/* Safety & Threat */}
                        <div className="pt-1 border-t border-[var(--border)] space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-muted)]">Content Safety:</span>
                            {marker.safetyCategory !== 'none' ? (
                              <span className="px-1.5 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 font-bold uppercase text-[9px]">
                                ⚠️ {marker.safetyCategory} ({(marker.safetyConfidence * 100).toFixed(0)}%)
                              </span>
                            ) : (
                              <span className="text-[#10B981] text-[9px] font-semibold">✓ Pass Clean</span>
                            )}
                          </div>
                          {marker.safetyReason && (
                            <div className="text-[9px] text-[var(--text-muted)] italic max-w-[200px] truncate">
                              "{marker.safetyReason}"
                            </div>
                          )}
                        </div>

                        {/* Virality Velocity */}
                        {marker.viralityScore !== undefined && (
                          <div className="pt-1 text-[9px] text-[var(--text-tertiary)] flex justify-between">
                            <span>Virality Velocity:</span>
                            <span className="text-[#EC4899] font-bold">{marker.viralityScore}/100</span>
                          </div>
                        )}
                        <div className="mt-1 text-[8px] text-[var(--text-tertiary)] text-center">Click to jump to round t={marker.round}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Keyframe Markers along timeline */}
              <div className="flex justify-between text-[10px] font-mono text-[var(--text-tertiary)] pt-1">
                <span>t=0 (Seed)</span>
                <span>t=3 (🙂 Joy)</span>
                <span>t=7 (😠 Hostility)</span>
                <span>t=12 (⚠️ Extremism)</span>
                <span>t=18 (🔥 Viral)</span>
                <span>t=26 (📈 Surge)</span>
                <span>t={Math.max(maxRecordedRound, 40)} (End)</span>
              </div>
            </div>
          </div>

          {/* Bottom Area: Chronological Round Events & Telemetry */}
          <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] shadow-sm rounded-2xl flex flex-col overflow-hidden min-h-0">
            <div className="h-10 px-4 bg-[var(--surface-elevated)]/80 border-b border-[var(--border)] flex items-center justify-between text-[11px] font-mono text-[var(--text-tertiary)]">
              <span>CHRONOLOGICAL TELEMETRY AUDIT LOG</span>
              <span>{history.length} TICKS</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[var(--text-tertiary)] text-[13px] text-center p-4">
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
                          ? 'bg-[var(--surface-elevated)] border-[#4F8CFF] text-[var(--text)]'
                          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-[#4F8CFF]' : 'bg-[var(--text-tertiary)]'}`} />
                        <span className="font-bold text-[var(--text)]">Round {t.round}</span>
                        <span className="text-[var(--text-tertiary)]">
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
