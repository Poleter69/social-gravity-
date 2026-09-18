/**
 * Social Gravity — Project Aurora: Feature Card (Responsive)
 * Interactive capability card with spring hover lift, subtle glow,
 * and 100% tokenized Light/Dark theme compatibility across all screen sizes.
 */

import React from 'react';
import { motion } from 'framer-motion';

export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  accentColor: string;
  index: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  badge,
  accentColor,
  index,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: 0.15 + index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{
        y: -3,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08), 0 0 20px rgba(79, 140, 255, 0.12)',
        transition: { type: 'spring', stiffness: 400, damping: 25 },
      }}
      className="group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[var(--surface)] border border-[var(--border)] transition-colors duration-220 flex flex-col justify-between overflow-hidden cursor-default shadow-sm select-none"
    >
      {/* Ambient accent corner bloom */}
      <div
        className="absolute -top-12 -right-12 w-24 sm:w-28 h-24 sm:h-28 rounded-full blur-2xl opacity-15 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />

      <div className="relative z-10 space-y-2 sm:space-y-2.5">
        {/* Card Header: Icon & optional Badge */}
        <div className="flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border border-[var(--border-subtle)] bg-[var(--surface-elevated)] transition-transform duration-220"
            style={{ color: accentColor }}
          >
            {icon}
          </motion.div>

          {badge && (
            <span
              className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border"
              style={{
                backgroundColor: `${accentColor}15`,
                borderColor: `${accentColor}35`,
                color: accentColor,
              }}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Title & Subtext */}
        <div className="space-y-0.5 sm:space-y-1">
          <h3 className="text-[12px] sm:text-[13px] font-semibold tracking-tight text-[var(--text)] group-hover:text-[var(--primary)] transition-colors duration-200">
            {title}
          </h3>
          <p className="text-[10px] sm:text-[11px] leading-relaxed text-[var(--text-secondary)]">
            {description}
          </p>
        </div>
      </div>

      {/* Subtle indicator conduit bar at card bottom */}
      <div className="relative z-10 mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-[var(--border-subtle)] flex items-center gap-1.5 text-[9px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
        <span>OPERATIONAL</span>
      </div>
    </motion.div>
  );
};
