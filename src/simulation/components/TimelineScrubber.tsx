/**
 * Social Gravity - Timeline Scrubber & Replay Controller
 *
 * Professional analyst-grade timeline control component.
 * Allows continuous scrubbing, jumping, rewind, and fast-forward
 * across historical simulation rounds with live tick indicators and cascade metrics.
 */

import React, { useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Zap, 
  Flame
} from 'lucide-react';
import { RoundTelemetry } from '../types';

interface TimelineScrubberProps {
  currentRound: number;
  maxRecordedRound: number;
  isPlaying: boolean;
  telemetryHistory: RoundTelemetry[];
  onScrub: (round: number) => void;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onJumpToStart: () => void;
  onJumpToEnd: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  currentRound,
  maxRecordedRound,
  isPlaying,
  telemetryHistory,
  onScrub,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onJumpToStart,
  onJumpToEnd,
  onDragStart,
  onDragEnd,
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Identify peak R0 and debunk events for visual marker pins
  const peakR0Round = telemetryHistory.reduce(
    (max, t) => (t.r0 > max.r0 ? { round: t.round, r0: t.r0 } : max),
    { round: 0, r0: 0 }
  );

  const calculateRoundFromMouseEvent = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      if (!barRef.current || maxRecordedRound <= 0) return 0;
      const rect = barRef.current.getBoundingClientRect();
      const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = offsetX / rect.width;
      return Math.round(percentage * maxRecordedRound);
    },
    [maxRecordedRound]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    onDragStart?.();
    const round = calculateRoundFromMouseEvent(e);
    onScrub(round);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const r = calculateRoundFromMouseEvent(moveEvent);
      onScrub(r);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      onDragEnd?.();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const progressPct = maxRecordedRound > 0 ? (currentRound / maxRecordedRound) * 100 : 0;
  const currentTelemetry = telemetryHistory.find(t => t.round === currentRound);

  return (
    <div className="bg-gravity-950/90 border border-gravity-800 rounded-xl p-4 space-y-3 font-mono text-xs shadow-xl backdrop-blur-md">
      {/* Top Header & Replay Status */}
      <div className="flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-cyan-400 animate-pulse" />
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            Cascade Temporal Replay Engine
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
            {maxRecordedRound === 0 ? 'LIVE STREAM' : `HISTORICAL BUFFER (${maxRecordedRound + 1} ROUNDS)`}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          {currentTelemetry && (
            <>
              <span className="text-red-400 flex items-center gap-1">
                <Flame className="h-3 w-3" />
                Infected: <strong>{currentTelemetry.believerCount}</strong>
              </span>
              <span className="text-amber-400 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                R₀: <strong>{currentTelemetry.r0}</strong>
              </span>
              <span className="text-cyan-400">
                Vel: <strong>+{currentTelemetry.cascadeVelocity}/rnd</strong>
              </span>
            </>
          )}
          <span className="text-white font-bold px-2 py-0.5 rounded bg-gravity-900 border border-gravity-700">
            Round {currentRound} / {maxRecordedRound}
          </span>
        </div>
      </div>

      {/* Draggable Scrubber Track */}
      <div 
        ref={barRef}
        onMouseDown={handleMouseDown}
        className="relative h-6 bg-gravity-900 border border-gravity-800 rounded-lg cursor-pointer select-none group flex items-center px-2"
        title="Click or drag to scrub historical cascade rounds"
      >
        {/* Progress Fill Bar */}
        <div 
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-950/60 via-cyan-900/50 to-cyan-500/30 rounded-l-lg transition-all"
          style={{ width: `${progressPct}%` }}
        />

        {/* Milestone Marker Pins */}
        {maxRecordedRound > 0 && peakR0Round.r0 > 0 && (
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 pointer-events-none"
            style={{ left: `${(peakR0Round.round / maxRecordedRound) * 100}%` }}
            title={`Peak R0 (${peakR0Round.r0}) at round ${peakR0Round.round}`}
          >
            <span className="absolute -top-3.5 -translate-x-1/2 text-[9px] text-amber-400 font-bold bg-gravity-950 px-1 rounded border border-amber-500/40">
              Peak R₀
            </span>
          </div>
        )}

        {/* Draggable Scrubber Thumb */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-5 bg-gradient-to-b from-cyan-400 to-cyan-600 border border-white rounded shadow-glow-cyan z-20 flex items-center justify-center transition-transform hover:scale-110"
          style={{ left: `${progressPct}%` }}
        >
          <div className="w-0.5 h-2.5 bg-gravity-950 rounded-full" />
        </div>

        {/* Subtle round tick notches */}
        {maxRecordedRound > 0 && maxRecordedRound <= 30 && (
          <div className="absolute inset-0 flex justify-between px-2 pointer-events-none opacity-20">
            {Array.from({ length: maxRecordedRound + 1 }).map((_, idx) => (
              <div key={idx} className="w-px h-full bg-slate-400" />
            ))}
          </div>
        )}
      </div>

      {/* Control Transport Deck */}
      <div className="flex items-center justify-between pt-1">
        {/* Playback Transport Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onJumpToStart}
            disabled={currentRound === 0}
            className="p-1.5 rounded-lg bg-gravity-900 hover:bg-gravity-800 border border-gravity-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
            title="Jump to Start (Round 0)"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={onStepBackward}
            disabled={currentRound === 0}
            className="p-1.5 rounded-lg bg-gravity-900 hover:bg-gravity-800 border border-gravity-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
            title="Rewind 1 Round"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-cyan-400" />
          </button>

          <button
            onClick={onTogglePlay}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 text-gravity-950 transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-400 hover:bg-amber-300 shadow-glow-amber'
                : 'bg-cyan-400 hover:bg-cyan-300 shadow-glow-cyan'
            }`}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={onStepForward}
            className="p-1.5 rounded-lg bg-gravity-900 hover:bg-gravity-800 border border-gravity-800 text-slate-300 transition-colors"
            title="Step Forward 1 Round"
          >
            <ChevronRight className="h-3.5 w-3.5 text-cyan-400" />
          </button>

          <button
            onClick={onJumpToEnd}
            disabled={currentRound === maxRecordedRound}
            className="p-1.5 rounded-lg bg-gravity-900 hover:bg-gravity-800 border border-gravity-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
            title="Fast-Forward to Latest Round"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span>Click/drag track to scrub time</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>Peak R₀ Milestone</span>
          </span>
        </div>
      </div>
    </div>
  );
};
