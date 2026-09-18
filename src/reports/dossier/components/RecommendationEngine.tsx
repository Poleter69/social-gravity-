/**
 * Social Gravity — Project Dossier Recommendation Engine
 * Finding-Grounded Actionable Directives & Countermeasure Blueprint
 */

import React from 'react';
import { Target, ShieldCheck, CheckCircle, Zap, Eye, RotateCcw } from 'lucide-react';
import { InvestigationDossier, ActionableRecommendation } from '../types';

interface RecommendationEngineProps {
  dossier: InvestigationDossier;
}

export const RecommendationEngine: React.FC<RecommendationEngineProps> = ({ dossier }) => {
  const { recommendations } = dossier;

  const getPriorityBadge = (priority: ActionableRecommendation['priority']) => {
    switch (priority) {
      case 'P0 Immediate':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'P1 High':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  const getCategoryIcon = (category: ActionableRecommendation['category']) => {
    switch (category) {
      case 'Inoculation':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'Surveillance':
        return <Eye className="w-4 h-4 text-blue-400" />;
      case 'Forensics':
        return <RotateCcw className="w-4 h-4 text-purple-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl mb-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
              Operational Recommendations & Action Directives
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              MATHEMATICALLY GROUNDED IN EMPIRICAL TOPOLOGY AND AFFECTIVE ACCELERATION VECTORS
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
          <CheckCircle className="w-3.5 h-3.5" />
          ACTIONABLE MITIGATION PLAN
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="p-5 rounded-xl border border-[var(--border)] bg-[var(--canvas)] hover:border-emerald-500/40 transition-all"
          >
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getPriorityBadge(rec.priority)}`}>
                  {rec.priority}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] flex items-center gap-1">
                  {getCategoryIcon(rec.category)}
                  {rec.category}
                </span>
              </div>

              <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
                DIRECTIVE {rec.id}
              </span>
            </div>

            {/* Recommendation Title & Action Directive */}
            <h3 className="text-base font-bold text-[var(--text)] tracking-tight mt-1 mb-1">
              {rec.title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] font-mono leading-relaxed mb-3">
              {rec.action}
            </p>

            {/* Dual Finding vs Impact Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[var(--border)] text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <div className="text-[10px] text-amber-400 font-bold uppercase mb-1">
                  GROUNDED EVIDENCE FINDING:
                </div>
                <div className="text-[var(--text-secondary)] leading-relaxed">
                  {rec.findingReference}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <div className="text-[10px] text-emerald-400 font-bold uppercase mb-1">
                  PROJECTED MITIGATION IMPACT:
                </div>
                <div className="text-[var(--text)] font-medium leading-relaxed">
                  {rec.expectedImpact}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
