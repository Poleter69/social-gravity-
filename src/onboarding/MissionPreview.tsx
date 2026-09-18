/**
 * Social Gravity — Project Aurora: Mission Preview
 * Miniature visual preview hint of the Mission Control workstation.
 * Non-interactive, lightweight CSS/SVG mockup with subtle scanning radar telemetry.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Radio, Play, Activity } from 'lucide-react';

export const MissionPreview: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-xl sm:rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden shadow-sm select-none group h-full flex flex-col justify-between"
    >
      {/* Top simulated workstation header */}
      <div className="px-3 py-2 bg-[var(--surface-elevated)] border-b border-[var(--border)] flex items-center justify-between text-[10px] font-mono shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500/70" />
            <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
            <span className="w-2 h-2 rounded-full bg-green-500/70" />
          </div>
          <span className="text-[var(--text-tertiary)] font-bold tracking-wider">
            MISSION CONTROL // WORKSPACE LIVE
          </span>
        </div>
        <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1 text-[var(--success)] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
            LIVE TELEMETRY
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[9px]">
            60 FPS
          </span>
        </div>
      </div>

      {/* Main simulated interface area */}
      <div className="relative flex-1 min-h-[140px] sm:min-h-[160px] bg-[var(--canvas-bg)] overflow-hidden flex">
        {/* Simulated mini sidebar */}
        <div className="w-12 bg-[var(--surface)] border-r border-[var(--border)] p-1.5 flex flex-col items-center justify-between shrink-0">
          <div className="space-y-1.5 w-full flex flex-col items-center">
            <div className="w-6 h-6 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div className="w-5 h-5 rounded-md bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-tertiary)]">
              <Radio className="w-2.5 h-2.5" />
            </div>
            <div className="w-5 h-5 rounded-md bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-tertiary)]">
              <Shield className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="w-4 h-4 rounded-full bg-[var(--border)]" />
        </div>

        {/* Simulated canvas with mini graph network */}
        <div className="relative flex-1 p-2.5 flex flex-col justify-between overflow-hidden">
          {/* Subtle radar scanline */}
          <motion.div
            animate={{ y: [0, 140, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-[var(--primary-glow)] to-transparent pointer-events-none opacity-40"
          />

          {/* Mini SVG Graph topology */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-85">
            {/* Edge conduits */}
            <line x1="25%" y1="35%" x2="50%" y2="25%" stroke="var(--primary)" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="50%" y1="25%" x2="70%" y2="40%" stroke="#00F0FF" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="50%" y1="25%" x2="45%" y2="70%" stroke="#10B981" strokeWidth="1" strokeOpacity="0.45" />
            <line x1="70%" y1="40%" x2="85%" y2="65%" stroke="#A855F7" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="25%" y1="35%" x2="35%" y2="75%" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="45%" y1="70%" x2="85%" y2="65%" stroke="var(--border)" strokeWidth="0.7" strokeDasharray="3 3" />

            {/* Nodes */}
            <circle cx="25%" cy="35%" r="5" fill="#4F8CFF" />
            <circle cx="50%" cy="25%" r="7" fill="#00F0FF" />
            <circle cx="70%" cy="40%" r="5" fill="#A855F7" />
            <circle cx="45%" cy="70%" r="6" fill="#10B981" />
            <circle cx="85%" cy="65%" r="4.5" fill="#EF4444" />
            <circle cx="35%" cy="75%" r="4" fill="#F59E0B" />
          </svg>

          {/* Top floating mini telemetry chips */}
          <div className="relative z-10 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-[var(--surface)]/90 backdrop-blur border border-[var(--border)] text-[9px] font-mono font-semibold text-[var(--text)] flex items-center gap-1 shadow-sm">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              <span>R0: 2.84</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--surface)]/90 backdrop-blur border border-[var(--border)] text-[9px] font-mono font-semibold text-[var(--text)] shadow-sm">
              Cascade: 82%
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--surface)]/90 backdrop-blur border border-[var(--border)] text-[9px] font-mono font-semibold text-[var(--text)] shadow-sm">
              Dominant: Curiosity
            </span>
          </div>

          {/* Bottom simulated OperationsDock */}
          <div className="relative z-10 self-center px-3 py-1 rounded-full bg-[var(--surface)]/95 backdrop-blur-md border border-[var(--border)] shadow-md flex items-center gap-2 text-[9px] font-mono text-[var(--text)]">
            <div className="w-4 h-4 rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
              <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
            </div>
            <span>Round 14 / 40</span>
            <span className="text-[var(--text-tertiary)]">|</span>
            <span className="text-[var(--primary)] font-bold">1× Speed</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
