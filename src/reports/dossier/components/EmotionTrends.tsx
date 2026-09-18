/**
 * Social Gravity — Project Dossier Emotional Evolution Trends
 * Publication-Quality Multi-Emotion Trajectory Curves (Fear, Anger, Curiosity, Trust, Joy)
 */

import React from 'react';
import { Activity, TrendingUp, Info } from 'lucide-react';
import { InvestigationDossier, RoundEmotionPoint } from '../types';

interface EmotionTrendsProps {
  dossier: InvestigationDossier;
}

export const EmotionTrends: React.FC<EmotionTrendsProps> = ({ dossier }) => {
  const { emotionTrends } = dossier;
  const { points, shiftAnnotations } = emotionTrends;

  // Chart coordinates
  const svgWidth = 800;
  const svgHeight = 280;
  const padding = { top: 25, right: 30, bottom: 40, left: 50 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const maxRound = points.length > 0 ? points[points.length - 1].round : 10;

  // Coordinate mapper
  const getX = (round: number) => padding.left + (maxRound > 0 ? (round / maxRound) * graphWidth : 0);
  const getY = (val: number) => padding.top + graphHeight - (val * graphHeight);

  // Path generator for an emotion key
  const makeLinePath = (key: keyof Omit<RoundEmotionPoint, 'round'>) => {
    if (points.length === 0) return '';
    return points.reduce((acc, pt, idx) => {
      const x = getX(pt.round);
      const y = getY(pt[key] as number);
      return `${acc} ${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  };

  const makeAreaPath = (key: keyof Omit<RoundEmotionPoint, 'round'>) => {
    if (points.length === 0) return '';
    const line = makeLinePath(key);
    const startX = getX(points[0].round);
    const endX = getX(points[points.length - 1].round);
    const zeroY = getY(0);
    return `${line} L ${endX.toFixed(1)} ${zeroY.toFixed(1)} L ${startX.toFixed(1)} ${zeroY.toFixed(1)} Z`;
  };

  return (
    <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl mb-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
              Affective Dynamics & Emotional Acceleration
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              28-DIMENSION GOEMOTIONS QUANTIZED TRAJECTORY RECONSTRUCTION ACROSS ROUNDS
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold">
          <TrendingUp className="w-3.5 h-3.5" />
          FEAR RISES → ANGER FOLLOWS
        </div>
      </div>

      {/* SVG Vector Chart */}
      <div className="relative w-full rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-4 overflow-hidden shadow-inner">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none">
          {/* Gradients */}
          <defs>
            <linearGradient id="fear-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="anger-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((val) => {
            const y = getY(val);
            return (
              <g key={`grid-${val}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="0.6"
                  className="text-[var(--border)] opacity-40"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="currentColor"
                  className="text-[var(--text-tertiary)] font-mono"
                >
                  {(val * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* X Axis Ticks */}
          {points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 8)) === 0).map((pt) => {
            const x = getX(pt.round);
            return (
              <g key={`xtick-${pt.round}`}>
                <line
                  x1={x}
                  y1={padding.top + graphHeight}
                  x2={x}
                  y2={padding.top + graphHeight + 6}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-[var(--border)]"
                />
                <text
                  x={x}
                  y={padding.top + graphHeight + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                  className="text-[var(--text-tertiary)] font-mono"
                >
                  R{pt.round}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          <path d={makeAreaPath('fear')} fill="url(#fear-grad)" />
          <path d={makeAreaPath('anger')} fill="url(#anger-grad)" />

          {/* Emotion Trend Lines */}
          {/* Curiosity (Blue) */}
          <path
            d={makeLinePath('curiosity')}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2.2"
            strokeDasharray="3 2"
          />

          {/* Trust / Skepticism (Emerald) */}
          <path
            d={makeLinePath('trust')}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.2"
          />

          {/* Anger (Orange) */}
          <path
            d={makeLinePath('anger')}
            fill="none"
            stroke="#F97316"
            strokeWidth="2.5"
          />

          {/* Fear (Crimson Red - Primary Driver) */}
          <path
            d={makeLinePath('fear')}
            fill="none"
            stroke="#EF4444"
            strokeWidth="3.2"
          />

          {/* Annotations / Inflection Points */}
          {shiftAnnotations.map((ann, idx) => {
            const x = getX(ann.round);
            const y = getY(0.85 - (idx * 0.18));
            return (
              <g key={`ann-${idx}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + graphHeight}
                  stroke="#F59E0B"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  strokeOpacity="0.8"
                />
                <circle cx={x} cy={y} r="4" fill="#F59E0B" />
                <rect
                  x={Math.min(x + 8, svgWidth - 190)}
                  y={y - 12}
                  width="180"
                  height="22"
                  rx="4"
                  fill="var(--surface)"
                  stroke="var(--border)"
                  strokeWidth="1"
                />
                <text
                  x={Math.min(x + 14, svgWidth - 184)}
                  y={y + 3}
                  fontSize="9.5"
                  fontWeight="bold"
                  fill="currentColor"
                  className="text-[var(--text)] font-mono"
                >
                  {ann.note}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Chart Legend & Cognitive Commentary */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--border)] text-xs">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 rounded bg-red-500" />
            <span className="text-[var(--text)] font-semibold">Fear / Threat (Dominant)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 rounded bg-orange-500" />
            <span className="text-[var(--text-secondary)]">Anger / Outrage</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 rounded bg-blue-500" />
            <span className="text-[var(--text-secondary)]">Curiosity / Inquiry</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 rounded bg-emerald-500" />
            <span className="text-[var(--text-secondary)]">Trust / Rational Verification</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>Fear surged 2.4× between Round 2 and Round 8</span>
        </div>
      </div>
    </div>
  );
};
