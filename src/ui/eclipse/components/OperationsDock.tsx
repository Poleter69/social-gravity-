/**
 * Social Gravity — Eclipse Operations Dock
 * 56px fixed bottom operations bar with simulation controls,
 * timeline scrubber, and high-impact interventions.
 */

import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Database,
  GitFork,
  ShieldAlert,
} from 'lucide-react';
import { motion } from 'framer-motion';

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
}) => {
  const speeds = [100, 300, 600, 1200];

  return (
    <footer className="h-14 bg-[#111114] border-t border-[#27272A] px-5 flex items-center justify-between select-none shrink-0 z-30 gap-4">
      {/* Left: Playback Controls */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.12 }}
          onClick={onTogglePlay}
          className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
            isPlaying
              ? 'bg-[#F59E0B] text-[#09090B] hover:bg-[#F59E0B]/90'
              : 'bg-[#4F8CFF] text-[#09090B] hover:bg-[#4F8CFF]/90 font-semibold'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play</span>
            </>
          )}
        </motion.button>

        <button
          onClick={onStepForward}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-[12px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors cursor-pointer"
          title="Step forward +1 round (→)"
        >
          <FastForward className="w-3.5 h-3.5 text-[#4F8CFF]" />
          <span>Step</span>
        </button>

        <button
          onClick={onReset}
          className="p-1.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-[#71717A] hover:text-[#FAFAFA] transition-colors cursor-pointer"
          title="Reset simulation to round 0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Speed Selector */}
        <div className="hidden xl:flex items-center bg-[#18181B] border border-[#27272A] rounded-lg p-0.5 text-[11px] font-mono ml-2">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onSimSpeedChange(s)}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                simSpeedMs === s
                  ? 'bg-[#27272A] text-[#4F8CFF] font-bold'
                  : 'text-[#71717A] hover:text-[#A1A1AA]'
              }`}
            >
              {s}ms
            </button>
          ))}
        </div>
      </div>

      {/* Center: Timeline Scrubber */}
      <div className="flex-1 max-w-xl flex items-center gap-3">
        <span className="text-[11px] font-mono text-[#A1A1AA] whitespace-nowrap">
          Round <strong className="text-[#FAFAFA]">{currentRound}</strong> / {Math.max(currentRound, maxRecordedRound, maxRounds)}
        </span>

        <div className="flex-1 relative flex items-center">
          <input
            type="range"
            min={0}
            max={Math.max(maxRecordedRound, 40)}
            value={currentRound}
            onChange={(e) => onScrubToRound(Number(e.target.value))}
            className="w-full accent-[#4F8CFF] bg-[#27272A] h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <span className="text-[11px] font-mono text-[#71717A] hidden sm:inline">
          {isPlaying ? 'RUNNING' : 'SCRUBBABLE'}
        </span>
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="flex items-center gap-2">
        {onOpenDatasets && (
          <button
            onClick={onOpenDatasets}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-[12px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>Load Dataset</span>
          </button>
        )}

        {onInjectDebunk && (
          <button
            onClick={onInjectDebunk}
            disabled={!canInjectDebunk}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
              canInjectDebunk
                ? 'bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/30 cursor-pointer'
                : 'bg-[#18181B] text-[#71717A] border-[#27272A] cursor-not-allowed opacity-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Fact-Check</span>
          </button>
        )}

        {onOpenCompare && (
          <button
            onClick={onOpenCompare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-[12px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors cursor-pointer"
          >
            <GitFork className="w-3.5 h-3.5 text-[#4F8CFF]" />
            <span className="hidden sm:inline">Compare</span>
          </button>
        )}
      </div>
    </footer>
  );
};
