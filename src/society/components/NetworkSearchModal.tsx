/**
 * Social Gravity — Node & Narrative Command Search (Stage 6)
 * Instant spotlight search with Ctrl+K shortcut, searching users, communities,
 * narratives, hashtags, and keywords with 300ms camera fly-to and spotlighting.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Users, ArrowRight, X } from 'lucide-react';
import { CanvasNode } from '../canvas/types';
import { Community } from '../types/community';

export interface SearchResultItem {
  id: string;
  type: 'node' | 'community' | 'narrative';
  title: string;
  subtitle: string;
  badge: string;
  badgeColor?: string;
  node?: CanvasNode;
  communityId?: string;
}

export interface NetworkSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: CanvasNode[];
  communities: Community[];
  onSelectNode: (node: CanvasNode) => void;
  onSelectCommunity?: (communityId: string) => void;
}

export const NetworkSearchModal: React.FC<NetworkSearchModalProps> = ({
  isOpen,
  onClose,
  nodes,
  communities,
  onSelectNode,
  onSelectCommunity,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Compute results
  const results: SearchResultItem[] = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default top suggestions (Influencers, Bridges, Patient Zero)
      const topPicks = nodes
        .filter((n) => n.isPatientZero || n.isInfluencer || n.isBridge)
        .slice(0, 8)
        .map((n) => ({
          id: n.id,
          type: 'node' as const,
          title: n.label,
          subtitle: `${n.sublabel || n.communityName} • Degree: ${n.metrics.degree} • Affect: ${n.emotion}`,
          badge: n.isPatientZero ? 'PATIENT ZERO' : n.isInfluencer ? 'INFLUENCER' : 'BRIDGE',
          badgeColor: n.isPatientZero ? '#EF4444' : n.isInfluencer ? '#F59E0B' : '#00F0FF',
          node: n,
        }));
      return topPicks;
    }

    const hits: SearchResultItem[] = [];

    // 1. Search Communities
    communities.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)) {
        hits.push({
          id: `comm-${c.id}`,
          type: 'community',
          title: c.name,
          subtitle: `Community Cluster • ${c.metrics.size} members`,
          badge: 'COMMUNITY',
          badgeColor: c.color,
          communityId: c.id,
        });
      }
    });

    // 2. Search Nodes (name, ID, role, content, emotion)
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const matchName = n.label.toLowerCase().includes(q);
      const matchId = n.id.toLowerCase().includes(q);
      const matchSub = n.sublabel?.toLowerCase().includes(q);
      const matchContent = n.content?.toLowerCase().includes(q);
      const matchEmotion = n.emotion.toLowerCase().includes(q);

      if (matchName || matchId || matchSub || matchContent || matchEmotion) {
        hits.push({
          id: n.id,
          type: 'node',
          title: n.label,
          subtitle: `${n.sublabel || n.communityName} • ${n.id} • ${n.emotion.toUpperCase()}`,
          badge: n.state || (n.isInfluencer ? 'INFLUENCER' : n.isBridge ? 'BRIDGE' : 'NODE'),
          badgeColor: n.state === 'BELIEVER' ? '#EF4444' : n.isInfluencer ? '#F59E0B' : '#38BDF8',
          node: n,
        });
      }
      if (hits.length >= 25) break;
    }

    return hits;
  }, [query, nodes, communities]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        selectItem(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const selectItem = (item: SearchResultItem) => {
    if (item.node) {
      onSelectNode(item.node);
      onClose();
    } else if (item.communityId && onSelectCommunity) {
      onSelectCommunity(item.communityId);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 pointer-events-auto select-none">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#09090B]/70 backdrop-blur-md"
          />

          {/* Search Palette Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            className="relative w-full max-w-xl bg-[#111114] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col text-[#FAFAFA]"
          >
            {/* Search Input Bar */}
            <div className="h-14 px-4 flex items-center gap-3 border-b border-[#27272A] bg-[#141417]/80">
              <Search className="w-5 h-5 text-[#00F0FF] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search nodes, communities, narratives, keywords... (Ctrl+K)"
                className="flex-1 bg-transparent border-none outline-none text-[14px] text-[#FAFAFA] placeholder-[#71717A] font-sans"
              />
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#27272A] text-[#71717A]">
                ESC
              </span>
              <button
                onClick={onClose}
                className="text-[#71717A] hover:text-[#FAFAFA] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-96 overflow-y-auto p-2 space-y-1">
              {results.length === 0 ? (
                <div className="p-8 text-center text-[#71717A] text-[13px] font-mono">
                  No matching nodes, communities, or narratives found.
                </div>
              ) : (
                results.map((res, idx) => {
                  const isCur = idx === selectedIndex;
                  return (
                    <button
                      key={res.id}
                      onClick={() => selectItem(res)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        isCur ? 'bg-[#18181B] border border-[#00F0FF]/40 text-[#FAFAFA]' : 'hover:bg-[#141417] text-[#D4D4D8]'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded-lg bg-[#1F1F23] flex items-center justify-center shrink-0 text-[#00F0FF]">
                          {res.type === 'community' ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className="truncate">
                          <div className="text-[13px] font-semibold text-[#FAFAFA] truncate">
                            {res.title}
                          </div>
                          <div className="text-[11px] font-mono text-[#71717A] truncate">
                            {res.subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
                          style={{
                            color: res.badgeColor || '#00F0FF',
                            backgroundColor: `${res.badgeColor || '#00F0FF'}15`,
                            border: `1px solid ${res.badgeColor || '#00F0FF'}33`,
                          }}
                        >
                          {res.badge}
                        </span>
                        {isCur && <ArrowRight className="w-3.5 h-3.5 text-[#00F0FF]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Hints */}
            <div className="h-9 px-4 border-t border-[#27272A] bg-[#141417]/60 flex items-center justify-between text-[11px] font-mono text-[#71717A]">
              <span>↑↓ Navigate • Enter to Fly Camera & Focus • ESC to Close</span>
              <span>{results.length} results</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
