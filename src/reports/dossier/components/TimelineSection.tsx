/**
 * Social Gravity — Project Dossier Incident Timeline
 * Visual Multi-Stage Forensic Timeline with Structured Evidence Markers
 */

import React from 'react';
import { Clock, AlertTriangle, Zap, Network, ShieldCheck, Flag, CheckCircle } from 'lucide-react';
import { InvestigationDossier, TimelineMilestone } from '../types';

interface TimelineSectionProps {
  dossier: InvestigationDossier;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({ dossier }) => {
  const { timeline } = dossier;

  const getMilestoneIcon = (type: TimelineMilestone['type']) => {
    switch (type) {
      case 'origin':
        return <Flag className="w-4 h-4 text-blue-400" />;
      case 'emotional_spike':
        return <Zap className="w-4 h-4 text-red-400" />;
      case 'bridge_crossing':
        return <Network className="w-4 h-4 text-purple-400" />;
      case 'peak_diffusion':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'intervention':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'equilibrium':
        return <CheckCircle className="w-4 h-4 text-cyan-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getBadgeColor = (type: TimelineMilestone['type']) => {
    switch (type) {
      case 'origin':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'emotional_spike':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'bridge_crossing':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'peak_diffusion':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'intervention':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'equilibrium':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl mb-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
              Incident Chronology & Transmission Timeline
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              RECONSTRUCTED EVENT ANCHORS WITH CORROBORATED FORENSIC EVIDENCE
            </p>
          </div>
        </div>

        <div className="font-mono text-xs text-[var(--text-tertiary)]">
          {timeline.length} CRITICAL PHASES
        </div>
      </div>

      {/* Visual Timeline Path */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-[var(--border)] ml-3 sm:ml-4 space-y-8">
        {timeline.map((item, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline Marker Bullet */}
            <div className="absolute -left-[35px] sm:-left-[43px] top-1 w-8 h-8 rounded-full border-2 border-[var(--border)] bg-[var(--canvas)] flex items-center justify-center shadow-md group-hover:border-blue-500 transition-colors">
              {getMilestoneIcon(item.type)}
            </div>

            {/* Event Card */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-5 hover:border-[var(--text-secondary)] transition-all">
              {/* Header Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getBadgeColor(item.type)}`}>
                    {item.label}
                  </span>
                  <span className="font-mono text-xs font-semibold text-[var(--text-tertiary)]">
                    Round {item.round} ({item.timeOffset})
                  </span>
                </div>

                {/* Metrics Chips */}
                <div className="flex items-center gap-2">
                  {item.metrics.map((m, mIdx) => (
                    <span key={mIdx} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                      {m.key}: <strong className="text-[var(--text)]">{m.value}</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-bold text-[var(--text)] tracking-tight">
                {item.headline}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                {item.description}
              </p>

              {/* Evidence Box */}
              <div className="mt-3 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-start gap-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold shrink-0 mt-0.5">
                  EVIDENCE:
                </div>
                <div className="text-xs font-mono text-[var(--text)] leading-relaxed">
                  {item.evidence}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
