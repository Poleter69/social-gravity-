/**
 * Social Gravity — Project Dossier Key Actors
 * Auto-Ranked Primary Influencers, Bridge Accounts, and Inoculation Pivots
 */

import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { InvestigationDossier, KeyActorDossier } from '../types';

interface KeyActorsProps {
  dossier: InvestigationDossier;
  onSelectActor?: (actor: KeyActorDossier) => void;
}

export const KeyActors: React.FC<KeyActorsProps> = ({ dossier, onSelectActor }) => {
  const { keyActors } = dossier;
  const [selectedActor, setSelectedActor] = useState<KeyActorDossier | null>(null);

  const handleActorClick = (actor: KeyActorDossier) => {
    setSelectedActor(actor);
    onSelectActor?.(actor);
  };

  const getRiskBadge = (risk: KeyActorDossier['risk']) => {
    switch (risk) {
      case 'Critical':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'High':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Moderate':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  const getReachBadge = (reach: KeyActorDossier['reach']) => {
    switch (reach) {
      case 'Critical':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'High':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl mb-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
              Key Actor Roster & Influence Attribution
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              AUTO-RANKED BY BETWEENNESS CENTRALITY, CLUSTER REACH, AND AMPLIFICATION VELOCITY
            </p>
          </div>
        </div>

        <div className="font-mono text-xs text-[var(--text-tertiary)]">
          TOP {keyActors.length} OPERATORS
        </div>
      </div>

      {/* Grid of Key Actors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {keyActors.map((actor, idx) => (
          <div
            key={actor.id}
            onClick={() => handleActorClick(actor)}
            className={`p-5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
              selectedActor?.id === actor.id
                ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500'
                : 'border-[var(--border)] bg-[var(--canvas)] hover:border-[var(--text-secondary)]'
            }`}
          >
            <div>
              {/* Card Header: Rank & Role */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-[var(--surface)] border border-[var(--border)] text-[11px] font-mono font-bold flex items-center justify-center text-[var(--text-muted)]">
                    #{idx + 1}
                  </span>
                  <span className="font-mono font-bold text-xs text-[var(--text)] tracking-wider">
                    {actor.alias}
                  </span>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getRiskBadge(actor.risk)}`}>
                  Risk: {actor.risk}
                </span>
              </div>

              {/* Role Title */}
              <div className="text-sm font-semibold text-[var(--text)] mb-2">
                {actor.role}
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs font-mono">
                <div>
                  <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Degree Reach</div>
                  <div className="font-bold text-[var(--text)] mt-0.5">{actor.degree} Connections</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Betweenness</div>
                  <div className="font-bold text-amber-400 mt-0.5">{(actor.betweenness * 100).toFixed(0)}th percentile</div>
                </div>
              </div>

              {/* Tactical Context */}
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-2">
                {actor.tacticalContext}
              </p>
            </div>

            {/* Bottom Community Tag & Reach Badge */}
            <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs font-mono">
              <span className="text-[var(--text-tertiary)] truncate max-w-[140px]">
                {actor.communityName}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getReachBadge(actor.reach)}`}>
                Reach: {actor.reach}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Expanded Actor Details Drawer (if selected) */}
      {selectedActor && (
        <div className="mt-6 p-4 rounded-xl border border-blue-500/40 bg-[var(--surface-hover)] flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-blue-400 font-bold uppercase tracking-wider mr-2">ACTOR DOSSIER:</span>
            <strong className="text-[var(--text)]">{selectedActor.alias}</strong> ({selectedActor.role}) — {selectedActor.emotionalTendency}
          </div>
          <button
            onClick={() => setSelectedActor(null)}
            className="px-2 py-1 rounded bg-[var(--canvas)] border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--text-secondary)]"
          >
            Close Details
          </button>
        </div>
      )}
    </div>
  );
};
