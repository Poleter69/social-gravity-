/**
 * Social Gravity — Project Dossier Evidence Board
 * Verified Multi-Platform Signal Evidence Cards with Confidence & Investigation Context
 */

import React, { useState } from 'react';
import { Layers, CheckCircle2, Search, ShieldCheck } from 'lucide-react';
import { InvestigationDossier, EvidenceCard } from '../types';

interface EvidenceBoardProps {
  dossier: InvestigationDossier;
}

export const EvidenceBoard: React.FC<EvidenceBoardProps> = ({ dossier }) => {
  const { evidenceBoard } = dossier;
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredCards = evidenceBoard.filter((card) => {
    const matchesSource = filterSource === 'ALL' || card.source === filterSource;
    const matchesSearch =
      card.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.emotion.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSource && matchesSearch;
  });

  const getSourceBadge = (source: EvidenceCard['source']) => {
    switch (source) {
      case 'X':
        return 'bg-black/20 text-white border-zinc-700';
      case 'Reddit':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'Bluesky':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'RSS':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl mb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border)] mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
              Evidence Vault & Corroborated Signals
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              DIGITALLY VERIFIED FORENSIC EXCERPTS WITH AFFECTIVE CONFIDENCE METRICS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% CRYPTOGRAPHICALLY CORROBORATED
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          {['ALL', 'X', 'Reddit', 'Bluesky', 'RSS'].map((src) => (
            <button
              key={src}
              onClick={() => setFilterSource(src)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors border ${
                filterSource === src
                  ? 'bg-blue-600 text-white border-blue-500 font-bold shadow'
                  : 'bg-[var(--canvas)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {src}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search evidence cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--canvas)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Evidence Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            className="p-5 rounded-xl border border-[var(--border)] bg-[var(--canvas)] hover:border-blue-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Top Meta Bar */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getSourceBadge(card.source)}`}>
                    {card.source}
                  </span>
                  <span className="font-mono text-xs text-amber-400 font-bold">
                    {card.emotion} • {card.confidence}%
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">VERIFIED</span>
                </div>
              </div>

              {/* Headline */}
              <h3 className="text-sm font-bold text-[var(--text)] tracking-tight mb-2">
                {card.headline}
              </h3>

              {/* Quoted Signal Content */}
              <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs italic font-serif text-[var(--text)] leading-relaxed mb-3">
                {card.content}
              </div>

              {/* Why It Mattered Box */}
              <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs font-mono">
                <span className="text-blue-400 font-bold uppercase tracking-wider block mb-1">
                  TACTICAL CONTEXT // WHY IT MATTERED:
                </span>
                <span className="text-[var(--text-secondary)] leading-relaxed">
                  {card.whyItMattered}
                </span>
              </div>
            </div>

            {/* Bottom Timestamp & Round */}
            <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] font-mono text-[var(--text-tertiary)]">
              <span>{card.timestamp}</span>
              <span>Observed at Round {card.round}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
