/**
 * Social Gravity — Premium Floating Filter Panel (Stage 5)
 * Glassmorphic panel that slides smoothly from the left margin,
 * offering instant zero-lag filtering across Source, Emotion, Risk, Community, and Epidemic State.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, RotateCcw, Check } from 'lucide-react';
import { FilterOptions, ThreatLevel } from '../canvas/types';
import { Community } from '../types/community';
import { AgentEpidemicState } from '../../simulation/types';

export interface NetworkFilterPanelProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  filters: FilterOptions;
  onChangeFilters: (next: FilterOptions) => void;
  communities: Community[];
  totalNodeCount: number;
  filteredNodeCount: number;
}

export const NetworkFilterPanel: React.FC<NetworkFilterPanelProps> = ({
  isOpen,
  onToggleOpen,
  filters,
  onChangeFilters,
  communities,
  totalNodeCount,
  filteredNodeCount,
}) => {
  const sources = ['reddit', 'bluesky', 'x', 'rss', 'local', 'synthetic'] as const;
  const emotions = ['fear', 'anger', 'joy', 'curiosity', 'surprise', 'sadness', 'neutral'] as const;
  const risks: ThreatLevel[] = ['low', 'moderate', 'high', 'critical'];
  const states: AgentEpidemicState[] = ['SUSCEPTIBLE', 'EXPOSED', 'BELIEVER', 'DEBUNKER', 'SKEPTIC'];

  const toggleSource = (src: string) => {
    const next = new Set(filters.sources);
    if (next.has(src)) next.delete(src);
    else next.add(src);
    onChangeFilters({ ...filters, sources: next });
  };

  const toggleEmotion = (emo: string) => {
    const next = new Set(filters.emotions);
    if (next.has(emo)) next.delete(emo);
    else next.add(emo);
    onChangeFilters({ ...filters, emotions: next });
  };

  const toggleRisk = (risk: ThreatLevel) => {
    const next = new Set(filters.riskLevels);
    if (next.has(risk)) next.delete(risk);
    else next.add(risk);
    onChangeFilters({ ...filters, riskLevels: next });
  };

  const toggleCommunity = (commId: string) => {
    const next = new Set(filters.communityIds);
    if (next.has(commId)) next.delete(commId);
    else next.add(commId);
    onChangeFilters({ ...filters, communityIds: next });
  };

  const toggleState = (st: AgentEpidemicState) => {
    const next = new Set(filters.states);
    if (next.has(st)) next.delete(st);
    else next.add(st);
    onChangeFilters({ ...filters, states: next });
  };

  const resetFilters = () => {
    onChangeFilters({
      sources: new Set(),
      emotions: new Set(),
      riskLevels: new Set(),
      communityIds: new Set(),
      states: new Set(),
      timeRange: 'all',
      onlyInfluencers: false,
      onlyBridges: false,
      onlyContagion: false,
      searchQuery: '',
    });
  };

  const activeFilterCount =
    filters.sources.size +
    filters.emotions.size +
    filters.riskLevels.size +
    filters.communityIds.size +
    filters.states.size +
    (filters.onlyInfluencers ? 1 : 0) +
    (filters.onlyBridges ? 1 : 0) +
    (filters.onlyContagion ? 1 : 0);

  return (
    <>
      {/* Floating Toggle Button (Always visible on left) */}
      <div className="absolute top-4 left-4 z-30 pointer-events-auto">
        <button
          onClick={onToggleOpen}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-mono transition-all backdrop-blur-md cursor-pointer shadow-lg ${
            isOpen || activeFilterCount > 0
              ? 'bg-[#18181B]/95 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[#00F0FF]/10'
              : 'bg-[#111114]/90 text-[#A1A1AA] hover:text-[#FAFAFA] border border-[#27272A]'
          }`}
          title="Toggle Filter Panel"
        >
          <Filter className="w-3.5 h-3.5" />
          <span className="font-semibold">FILTERS</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#00F0FF] text-[#09090B] font-bold text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Sliding Glassmorphic Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="absolute top-16 left-4 bottom-16 w-80 bg-[#111114]/95 border border-[#27272A] rounded-2xl shadow-2xl backdrop-blur-xl z-30 flex flex-col overflow-hidden text-[#FAFAFA] pointer-events-auto select-none"
          >
            {/* Header */}
            <div className="h-12 px-4 border-b border-[#27272A] flex items-center justify-between bg-[#18181B]/70 shrink-0">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#00F0FF]" />
                <span className="text-[12px] font-mono font-bold tracking-wider uppercase text-[#FAFAFA]">
                  INTELLIGENCE FILTERS
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-[11px] font-mono text-[#71717A] hover:text-[#FAFAFA] flex items-center gap-1 cursor-pointer"
                    title="Reset All Filters"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
                <button
                  onClick={onToggleOpen}
                  className="text-[#71717A] hover:text-[#FAFAFA] p-1 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Match Counter Badge */}
            <div className="px-4 py-2 bg-[#18181B]/40 border-b border-[#27272A] flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#71717A]">ACTIVE MATCHES:</span>
              <span className="text-[#00F0FF] font-bold">
                {filteredNodeCount} / {totalNodeCount} nodes ({totalNodeCount > 0 ? ((filteredNodeCount / totalNodeCount) * 100).toFixed(0) : 100}%)
              </span>
            </div>

            {/* Scrollable Filter Categories */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[11px] font-mono">
              {/* Quick High-Impact Toggles */}
              <div className="space-y-1.5">
                <span className="text-[#71717A] text-[10px] tracking-wider uppercase">STRUCTURAL ROLES</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => onChangeFilters({ ...filters, onlyInfluencers: !filters.onlyInfluencers })}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      filters.onlyInfluencers
                        ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B] font-bold'
                        : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    ★ Influencers Only
                  </button>
                  <button
                    onClick={() => onChangeFilters({ ...filters, onlyBridges: !filters.onlyBridges })}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      filters.onlyBridges
                        ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B] font-bold'
                        : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    ☍ Bridges Only
                  </button>
                  <button
                    onClick={() => onChangeFilters({ ...filters, onlyContagion: !filters.onlyContagion })}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      filters.onlyContagion
                        ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444] font-bold'
                        : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    ⚡ Active Believers
                  </button>
                </div>
              </div>

              {/* Source Stream Filter */}
              <div className="space-y-1.5 pt-2 border-t border-[#27272A]">
                <span className="text-[#71717A] text-[10px] tracking-wider uppercase">STREAM SOURCES</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {sources.map((src) => {
                    const isSelected = filters.sources.has(src);
                    return (
                      <button
                        key={src}
                        onClick={() => toggleSource(src)}
                        className={`px-2 py-1 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer uppercase text-[10px] ${
                          isSelected
                            ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF] font-bold'
                            : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
                        }`}
                      >
                        <span>{src}</span>
                        {isSelected && <Check className="w-3 h-3 text-[#00F0FF]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dominant Affect / GoEmotions Filter */}
              <div className="space-y-1.5 pt-2 border-t border-[#27272A]">
                <span className="text-[#71717A] text-[10px] tracking-wider uppercase">DOMINANT EMOTION (GOEMOTIONS)</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {emotions.map((emo) => {
                    const isSelected = filters.emotions.has(emo);
                    return (
                      <button
                        key={emo}
                        onClick={() => toggleEmotion(emo)}
                        className={`px-2 py-1 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer capitalize text-[10px] ${
                          isSelected
                            ? 'bg-[#A855F7]/20 border-[#A855F7] text-[#D8B4FE] font-bold'
                            : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
                        }`}
                      >
                        <span>{emo}</span>
                        {isSelected && <Check className="w-3 h-3 text-[#A855F7]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Threat Risk Level */}
              <div className="space-y-1.5 pt-2 border-t border-[#27272A]">
                <span className="text-[#71717A] text-[10px] tracking-wider uppercase">RISK SEVERITY</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {risks.map((risk) => {
                    const isSelected = filters.riskLevels.has(risk);
                    const riskColor = risk === 'critical' ? '#EF4444' : risk === 'high' ? '#F97316' : risk === 'moderate' ? '#FBBF24' : '#10B981';
                    return (
                      <button
                        key={risk}
                        onClick={() => toggleRisk(risk)}
                        className={`px-2 py-1 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer uppercase text-[10px] ${
                          isSelected
                            ? 'bg-[#18181B] font-bold shadow-sm'
                            : 'bg-[#18181B]/50 border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
                        }`}
                        style={{
                          borderColor: isSelected ? riskColor : undefined,
                          color: isSelected ? riskColor : undefined,
                        }}
                      >
                        <span>{risk}</span>
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Epidemic State Filter */}
              <div className="space-y-1.5 pt-2 border-t border-[#27272A]">
                <span className="text-[#71717A] text-[10px] tracking-wider uppercase">EPIDEMIC STATE</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {states.map((st) => {
                    const isSelected = filters.states.has(st);
                    const stateColor = st === 'BELIEVER' ? '#EF4444' : st === 'DEBUNKER' ? '#10B981' : st === 'SKEPTIC' ? '#A855F7' : '#06B6D4';
                    return (
                      <button
                        key={st}
                        onClick={() => toggleState(st)}
                        className={`px-2 py-1 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer uppercase text-[10px] ${
                          isSelected
                            ? 'bg-[#18181B] font-bold shadow-sm'
                            : 'bg-[#18181B]/50 border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
                        }`}
                        style={{
                          borderColor: isSelected ? stateColor : undefined,
                          color: isSelected ? stateColor : undefined,
                        }}
                      >
                        <span>{st}</span>
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Communities */}
              {communities.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#27272A]">
                  <span className="text-[#71717A] text-[10px] tracking-wider uppercase">COMMUNITY CLUSTERS</span>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {communities.map((comm) => {
                      const isSelected = filters.communityIds.has(comm.id);
                      return (
                        <button
                          key={comm.id}
                          onClick={() => toggleCommunity(comm.id)}
                          className={`w-full px-2 py-1 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer text-[10px] ${
                            isSelected
                              ? 'bg-[#18181B] font-bold border-cyan-500 text-cyan-300'
                              : 'bg-[#18181B]/50 border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: comm.color }} />
                            <span className="truncate">{comm.name}</span>
                          </div>
                          {isSelected && <Check className="w-3 h-3 shrink-0 text-cyan-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
