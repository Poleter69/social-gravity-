/**
 * Social Gravity — Eclipse MetricCard
 * Precision, calm telemetry card conforming to the 8pt grid & 24px padding.
 */

import React from 'react';
import { motion } from 'framer-motion';

export interface MetricCardProps {
  label: string;
  technicalLabel?: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  variant?: 'primary' | 'success' | 'warning' | 'critical' | 'neutral';
  trend?: { direction: 'up' | 'down' | 'neutral'; label: string };
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  technicalLabel,
  value,
  subtitle,
  badge,
  variant = 'primary',
  trend,
  icon,
  onClick,
  className = '',
}) => {
  const badgeStyles = {
    primary: 'bg-[#4F8CFF]/10 text-[#4F8CFF] border-[#4F8CFF]/30',
    success: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30',
    warning: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30',
    critical: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30',
    neutral: 'bg-[#27272A]/60 text-[#A1A1AA] border-[#3F3F46]/50',
  }[variant];

  const dotStyles = {
    primary: 'bg-[#4F8CFF]',
    success: 'bg-[#22C55E]',
    warning: 'bg-[#F59E0B]',
    critical: 'bg-[#EF4444]',
    neutral: 'bg-[#71717A]',
  }[variant];

  return (
    <motion.div
      whileHover={{ y: -1, borderColor: '#3F3F46' }}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className={`relative bg-[#111114] border border-[#27272A] rounded-xl p-5 flex flex-col justify-between select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Top row: Label & Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full ${dotStyles} shrink-0`} />
          <span className="text-[13px] font-medium text-[#A1A1AA] truncate tracking-[-0.01em]">
            {label}
          </span>
          {technicalLabel && (
            <span className="text-[11px] font-mono text-[#71717A] hidden xl:inline truncate">
              {technicalLabel}
            </span>
          )}
        </div>
        {badge && (
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider border ${badgeStyles} shrink-0`}>
            {badge}
          </span>
        )}
        {icon && !badge && (
          <div className="text-[#71717A] shrink-0">
            {icon}
          </div>
        )}
      </div>

      {/* Main value */}
      <div className="flex items-baseline gap-2 my-1">
        <span className="text-[24px] leading-[30px] font-semibold text-[#FAFAFA] tracking-tight font-sans">
          {value}
        </span>
        {trend && (
          <span className={`text-[12px] font-mono ${
            trend.direction === 'up' ? 'text-[#EF4444]' : trend.direction === 'down' ? 'text-[#22C55E]' : 'text-[#71717A]'
          }`}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.label}
          </span>
        )}
      </div>

      {/* Subtitle / context note */}
      {subtitle && (
        <p className="text-[12px] leading-[16px] text-[#71717A] truncate mt-1">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};
