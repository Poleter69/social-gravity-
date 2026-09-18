/**
 * Social Gravity — Project Dossier Narrative Evolution
 * Intelligence Briefing Storyline Reconstructing the Cascading Event
 */

import React from 'react';
import { BookOpen, ChevronRight, Bookmark } from 'lucide-react';
import { InvestigationDossier } from '../types';

interface NarrativeSectionProps {
  dossier: InvestigationDossier;
}

export const NarrativeSection: React.FC<NarrativeSectionProps> = ({ dossier }) => {
  const { narrativeEvolution } = dossier;

  return (
    <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl mb-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
              Narrative Reconstruction & Tactical Briefing
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              AI-RECONSTRUCTED STORYLINE OF CONTAGION GENESIS, CATALYSIS, AND DISSEMINATION
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-tertiary)]">
          <Bookmark className="w-3.5 h-3.5" />
          CHRONOLOGICAL DOSSIER
        </div>
      </div>

      {/* Storyline Cards */}
      <div className="space-y-4">
        {narrativeEvolution.map((story, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl border border-[var(--border)] bg-[var(--canvas)] hover:border-indigo-500/40 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[var(--text)] font-mono uppercase tracking-wide">
                {story.phase}
              </h3>
            </div>

            <p className="text-sm sm:text-base text-[var(--text)] leading-relaxed font-serif pl-8">
              {story.storyline}
            </p>

            <div className="mt-3 ml-8 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-start gap-2 text-xs font-mono text-[var(--text-secondary)]">
              <div className="text-amber-400 font-bold uppercase shrink-0 mt-0.5 flex items-center gap-1">
                <ChevronRight className="w-3 h-3" />
                TACTICAL INFERENCE:
              </div>
              <div className="leading-relaxed">
                {story.tacticalInference}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
