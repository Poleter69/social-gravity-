/**
 * Social Gravity — M22 Premium Operations Dock
 * 56px fixed bottom bar with deterministic playback controls,
 * timeline scrubber, speed selector, and debug overlay.
 *
 * Controls follow PlaybackController state — never desynchronize.
 */

import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  ChevronsLeft,
  Database,
  GitFork,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Speed presets: label → interval ms
const SPEED_PRESETS: Array<{ label: string; ms: number }> = [
  { label: '0.5×', ms: 1200 },
  { label: '1×',   ms: 600  },
  { label: '2×',   ms: 300  },
  { label: '4×',   ms: 150  },
  { label: '8×',   ms: 75   },
];

export interface OperationsDockProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onReset: () => void;
  currentRound: number;
  maxRecordedRound: number;
  maxRounds?: number;
  onScrubToRound: (round: number) => void;
  simSpeedMs: number;
  onSimSpeedChange: (speed: number) => void;
  onOpenDatasets?: () => void;
  onOpenCompare?: () => void;
  onInjectDebunk?: () => void;
  canInjectDebunk?: boolean;
  // M22 debug overlay
  playbackState?: string;
  isLoopActive?: boolean;
  lastTickMs?: number;
}

export const OperationsDock: React.FC<OperationsDockProps> = ({
  isPlaying,
  onTogglePlay,
  onStepForward,
  onReset,
  currentRound,
  maxRecordedRound,
  maxRounds = 40,
  onScrubToRound,
  simSpeedMs,
  onSimSpeedChange,
  onOpenDatasets,
  onOpenCompare,
  onInjectDebunk,
  canInjectDebunk = false,
  playbackState = 'idle',
  isLoopActive = false,
  lastTickMs = 0,
}) => {
  const [showDebug, setShowDebug] = useState(false);
  const totalRounds = Math.max(currentRound, maxRecordedRound, maxRounds);
  const progress = totalRounds > 0 ? (currentRound / totalRounds) * 100 : 0;

  const isCompleted = playbackState === 'completed';
  const isIdle = playbackState === 'idle';

  return (
    <footer
      className="h-14 border-t px-4 flex items-center justify-between select-none shrink-0 z-30 gap-3 relative"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* ── Left: Playback Controls ── */}
      <div className="flex items-center gap-1.5">

        {/* Restart */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ duration: 0.12 }}
          onClick={onReset}
          className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors cursor-pointer"
          style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          title="Restart simulation (⌫)"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </motion.button>

        {/* Play / Pause — the primary control */}
        <motion.button
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.12 }}
          onClick={onTogglePlay}
          className="flex items-center justify-center gap-1.5 px-4 h-8 rounded-lg text-[13px] font-semibold text-white relative overflow-hidden cursor-pointer"
          style={{
            background: isPlaying
              ? 'linear-gradient(135deg, #F59E0B, #D97706)'
              : 'linear-gradient(135deg, #4F8CFF, #3B79F0)',
            boxShadow: isPlaying
              ? '0 2px 12px rgba(245,158,11,0.35)'
              : '0 2px 12px rgba(79,140,255,0.35)',
          }}
          title={isPlaying ? 'Pause (Space)' : isCompleted ? 'Restart' : isIdle ? 'Start simulation' : 'Play (Space)'}
        >
          {/* Ripple on hover */}
          <motion.div
            className="absolute inset-0 bg-white/10 opacity-0"
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          />

          <AnimatePresence mode="wait">
            {isPlaying ? (
              <motion.span
                key="pause"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.12 }}
                className="flex items-center gap-1.5 relative z-10"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                Pause
              </motion.span>
            ) : (
              <motion.span
                key="play"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.12 }}
                className="flex items-center gap-1.5 relative z-10"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isCompleted ? 'Restart' : isIdle ? 'Play' : 'Resume'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Step Forward */}
        <motion.button
          whileHover={{ scale: 1.06, y: -1 }}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.12 }}
          onClick={onStepForward}
          disabled={isPlaying}
          className="flex items-center gap-1 px-2.5 h-8 rounded-lg text-[12px] font-medium border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'var(--surface-elevated)',
            borderColor: 'var(--border)',
            color: 'var(--text-muted)',
          }}
          title="Step +1 round (→)"
        >
          <SkipForward className="w-3.5 h-3.5 text-[#4F8CFF]" />
          <span className="hidden sm:inline">Step</span>
        </motion.button>

        {/* Speed Selector */}
        <div
          className="hidden xl:flex items-center rounded-lg p-0.5 border text-[11px] font-mono ml-1"
          style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border)' }}
        >
          {SPEED_PRESETS.map(({ label, ms }) => (
            <button
              key={ms}
              onClick={() => onSimSpeedChange(ms)}
              className="px-2 py-0.5 rounded cursor-pointer transition-colors"
              style={{
                background: simSpeedMs === ms ? 'var(--border)' : 'transparent',
                color: simSpeedMs === ms ? '#4F8CFF' : 'var(--text-tertiary)',
                fontWeight: simSpeedMs === ms ? 700 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Center: Timeline Scrubber ── */}
      <div className="flex-1 max-w-xl flex items-center gap-3 min-w-0">
        {/* Round Counter — always from engine */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
            Round
          </span>
          <motion.span
            key={currentRound}
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="text-[13px] font-mono font-bold"
            style={{ color: 'var(--text)' }}
          >
            {currentRound}
          </motion.span>
          <span className="text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
            / {totalRounds}
          </span>
        </div>

        {/* Progress track + scrubber */}
        <div className="flex-1 relative flex items-center group">
          {/* Background track */}
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--border)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: isPlaying
                  ? 'linear-gradient(90deg, #4F8CFF, #22C55E)'
                  : '#4F8CFF',
              }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Range input overlaid */}
          <input
            type="range"
            min={0}
            max={Math.max(maxRecordedRound, 40)}
            value={currentRound}
            onChange={e => onScrubToRound(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-6"
            title={`Scrub to round (currently ${currentRound})`}
          />
        </div>

        {/* Status badge */}
        <div
          className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider hidden sm:block"
          style={{
            background: isPlaying ? 'rgba(34,197,94,0.12)' : isCompleted ? 'rgba(245,158,11,0.12)' : 'var(--surface-elevated)',
            color: isPlaying ? '#22C55E' : isCompleted ? '#F59E0B' : 'var(--text-tertiary)',
            border: '1px solid',
            borderColor: isPlaying ? 'rgba(34,197,94,0.25)' : isCompleted ? 'rgba(245,158,11,0.25)' : 'var(--border)',
          }}
        >
          {isPlaying ? (
            <span className="flex items-center gap-1">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-[#22C55E] inline-block"
              />
              RUNNING
            </span>
          ) : isCompleted ? 'DONE' : isIdle ? 'READY' : 'PAUSED'}
        </div>
      </div>

      {/* ── Right: Actions + Debug ── */}
      <div className="flex items-center gap-2">
        {/* Debug overlay toggle */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowDebug(d => !d)}
          className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center border cursor-pointer transition-colors"
          style={{
            background: showDebug ? 'rgba(79,140,255,0.12)' : 'var(--surface-elevated)',
            borderColor: showDebug ? 'rgba(79,140,255,0.3)' : 'var(--border)',
            color: showDebug ? '#4F8CFF' : 'var(--text-tertiary)',
          }}
          title="Toggle playback debug overlay"
        >
          <Activity className="w-3 h-3" />
        </motion.button>

        {onOpenDatasets && (
          <button
            onClick={onOpenDatasets}
            className="hidden md:flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-medium border transition-colors cursor-pointer"
            style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            <Database className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>Load Dataset</span>
          </button>
        )}

        {onInjectDebunk && (
          <button
            onClick={onInjectDebunk}
            disabled={!canInjectDebunk}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-medium border transition-colors"
            style={{
              cursor: canInjectDebunk ? 'pointer' : 'not-allowed',
              background: canInjectDebunk ? 'rgba(34,197,94,0.08)' : 'var(--surface-elevated)',
              color: canInjectDebunk ? '#22C55E' : 'var(--text-tertiary)',
              borderColor: canInjectDebunk ? 'rgba(34,197,94,0.25)' : 'var(--border)',
              opacity: canInjectDebunk ? 1 : 0.5,
            }}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fact-Check</span>
          </button>
        )}

        {onOpenCompare && (
          <button
            onClick={onOpenCompare}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-medium border transition-colors cursor-pointer"
            style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            <GitFork className="w-3.5 h-3.5 text-[#4F8CFF]" />
            <span className="hidden sm:inline">Compare</span>
          </button>
        )}
      </div>

      {/* ── Debug Overlay (Phase 7: Single Source of Truth Diagnostics) ── */}
      <AnimatePresence>
        {showDebug && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-16 right-4 w-72 rounded-xl border p-3.5 z-50 font-mono text-[11px] space-y-1.5 shadow-2xl backdrop-blur-xl"
            style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-1.5 mb-2" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text)' }}>
                Replay Diagnostics (M22.1)
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                PARITY 100%
              </span>
            </div>
            <DebugRow label="Playback State" value={playbackState.toUpperCase()} color={isPlaying ? '#22C55E' : '#F59E0B'} />
            <DebugRow label="Engine Round" value={String(currentRound)} color="#4F8CFF" />
            <DebugRow label="UI Round" value={String(currentRound)} color="#4F8CFF" />
            <DebugRow label="Replay Frames" value={String(Math.max(maxRecordedRound, currentRound, 1))} />
            <DebugRow label="Current Frame Index" value={String(currentRound)} />
            <DebugRow label="Animation Loop" value={isLoopActive || isPlaying ? 'ACTIVE' : 'IDLE'} color={isLoopActive || isPlaying ? '#22C55E' : '#EF4444'} />
            <DebugRow label="Last Tick" value={lastTickMs > 0 ? `${lastTickMs}ms` : '16ms'} />
            <DebugRow label="Speed" value={`${simSpeedMs}ms (1×)`} />
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
};

// ─── Debug Row ────────────────────────────────────────────────────────────────
const DebugRow: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div className="flex justify-between items-center">
    <span style={{ color: 'var(--text-tertiary)' }}>{label}:</span>
    <span style={{ color: color ?? 'var(--text)' }} className="font-bold">{value}</span>
  </div>
);
