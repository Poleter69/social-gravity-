import React from 'react';

interface MetricCardProps {
  label: string;
  technicalLabel?: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'neutral' | 'info' | 'warning' | 'critical' | 'success';
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  technicalLabel,
  value,
  subtitle,
  badge,
  badgeVariant = 'neutral',
  icon,
  onClick,
}) => {
  const badgeClasses = {
    neutral: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    info: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40',
    warning: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
    critical: 'bg-rose-950/60 text-rose-300 border-rose-500/40 animate-pulse',
    success: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
  }[badgeVariant];

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-400">{label}</span>
            {technicalLabel && (
              <span
                className="text-[10px] font-mono text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity"
                title={`Technical variable: ${technicalLabel}`}
              >
                [{technicalLabel}]
              </span>
            )}
          </div>
          <div className="text-2xl font-extrabold font-mono tracking-tight text-white mt-1">
            {value}
          </div>
        </div>

        {icon && (
          <div className="p-2 rounded-lg bg-slate-800/60 text-slate-400 group-hover:text-slate-200 transition-colors">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/40">
        {subtitle && (
          <span className="text-[11px] text-slate-400 font-mono truncate">{subtitle}</span>
        )}
        {badge && (
          <span
            className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${badgeClasses}`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};
