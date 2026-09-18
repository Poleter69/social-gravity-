/**
 * Social Gravity — Project Aurora: Animated Statistics Strip (Responsive)
 * Live status strip with animated count-up effects on first load,
 * fully adaptive across mobile, laptop (1366x768, 1080p), and 1440p+ desktop.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Activity, FastForward, Radio } from 'lucide-react';

interface StatItem {
  target: number | null;
  suffix?: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  accent: string;
  staticDisplay?: string;
}

const STATS_CONFIG: StatItem[] = [
  {
    target: 5,
    suffix: '+',
    label: 'Data Sources',
    sublabel: 'Bluesky, Reddit, X, RSS',
    icon: <Database className="w-3.5 h-3.5" />,
    accent: '#4F8CFF',
  },
  {
    target: 27,
    suffix: '',
    label: 'Emotions',
    sublabel: 'GoEmotions Affect Engine',
    icon: <Activity className="w-3.5 h-3.5" />,
    accent: '#10B981',
  },
  {
    target: null,
    staticDisplay: 'Replay',
    label: 'Time Travel',
    sublabel: 'Deterministic Snapshots',
    icon: <FastForward className="w-3.5 h-3.5" />,
    accent: '#A855F7',
  },
  {
    target: null,
    staticDisplay: 'Live',
    label: 'Streaming',
    sublabel: 'Sub-Second Ingestion',
    icon: <Radio className="w-3.5 h-3.5" />,
    accent: '#00F0FF',
  },
];

export const AnimatedStats: React.FC = () => {
  const [counts, setCounts] = useState<{ [key: number]: number }>({ 0: 0, 1: 0 });

  useEffect(() => {
    // Count-up animation for numeric stats over 1.2 seconds
    const duration = 1200;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      setCounts({
        0: Math.floor(eased * 5),
        1: Math.floor(eased * 27),
      });

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setCounts({ 0: 5, 1: 27 });
      }
    };

    const animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm"
    >
      {STATS_CONFIG.map((stat, idx) => {
        const displayVal =
          stat.target !== null
            ? `${counts[idx] ?? 0}${stat.suffix || ''}`
            : stat.staticDisplay;

        return (
          <div
            key={idx}
            className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)] flex items-center gap-2 sm:gap-3 transition-colors duration-200"
          >
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border shrink-0"
              style={{
                backgroundColor: `${stat.accent}12`,
                borderColor: `${stat.accent}30`,
                color: stat.accent,
              }}
            >
              {stat.icon}
            </div>

            <div className="min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-[14px] sm:text-[16px] font-mono font-bold tracking-tight text-[var(--text)]">
                  {displayVal}
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--text-secondary)] truncate">
                  {stat.label}
                </span>
              </div>
              <div className="text-[8px] sm:text-[9px] font-mono text-[var(--text-tertiary)] truncate">
                {stat.sublabel}
              </div>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
};
