/**
 * Social Gravity — Eclipse CommandPaletteModal
 * Linear-style keyboard-driven command palette (Ctrl+K or Cmd+K).
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  GitFork,
  FileText,
  Radio,
  Satellite,
  ShieldCheck,
  Database,
  Sparkles,
  Settings,
} from 'lucide-react';
import { WorkspaceDestination } from './Sidebar';

export interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Simulation' | 'Datasets' | 'Intelligence' | 'System';
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (dest: WorkspaceDestination) => void;
  onTogglePlay: () => void;
  isPlaying: boolean;
  onStepForward: () => void;
  onReset: () => void;
  onOpenDatasets: () => void;
  onRunDiscovery: () => void;
  onRunValidation: () => void;
  onInjectDebunk?: () => void;
  onReopenLanding?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onTogglePlay,
  isPlaying,
  onStepForward,
  onReset,
  onOpenDatasets,
  onRunDiscovery,
  onRunValidation,
  onInjectDebunk,
  onReopenLanding,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'nav-mission',
      title: 'Navigate to Mission Control',
      category: 'Navigation',
      shortcut: '1',
      icon: Satellite,
      action: () => { onNavigate('mission'); onClose(); },
    },
    {
      id: 'nav-live',
      title: 'Navigate to Live Firehose Stream',
      category: 'Navigation',
      shortcut: '2',
      icon: Radio,
      action: () => { onNavigate('live'); onClose(); },
    },
    {
      id: 'nav-replay',
      title: 'Navigate to Temporal Replay Engine',
      category: 'Navigation',
      shortcut: '3',
      icon: RotateCcw,
      action: () => { onNavigate('replay'); onClose(); },
    },
    {
      id: 'nav-compare',
      title: 'Navigate to Counterfactual Strategy Optimizer',
      category: 'Navigation',
      shortcut: '4',
      icon: GitFork,
      action: () => { onNavigate('compare'); onClose(); },
    },
    {
      id: 'nav-reports',
      title: 'Navigate to Report Center & Vault',
      category: 'Navigation',
      shortcut: '5',
      icon: FileText,
      action: () => { onNavigate('reports'); onClose(); },
    },
    {
      id: 'nav-settings',
      title: 'Open System Settings & Invariants',
      category: 'Navigation',
      shortcut: '6',
      icon: Settings,
      action: () => { onNavigate('settings'); onClose(); },
    },
    {
      id: 'sim-play-pause',
      title: isPlaying ? 'Pause Simulation' : 'Resume / Play Simulation',
      category: 'Simulation',
      shortcut: 'Space',
      icon: isPlaying ? Pause : Play,
      action: () => { onTogglePlay(); onClose(); },
    },
    {
      id: 'sim-step',
      title: 'Step Simulation Forward (+1 Round)',
      category: 'Simulation',
      shortcut: '→',
      icon: FastForward,
      action: () => { onStepForward(); onClose(); },
    },
    {
      id: 'sim-reset',
      title: 'Reset Simulation to Round 0',
      category: 'Simulation',
      shortcut: 'R',
      icon: RotateCcw,
      action: () => { onReset(); onClose(); },
    },
    {
      id: 'data-load',
      title: 'Load Empirical Benchmark Dataset (Reddit / SNAP / Wikipedia)',
      category: 'Datasets',
      icon: Database,
      action: () => { onOpenDatasets(); onClose(); },
    },
    {
      id: 'ai-discovery',
      title: 'Run AI Discovery Analysis (GoEmotions & Resilience)',
      category: 'Intelligence',
      icon: Sparkles,
      action: () => { onRunDiscovery(); onClose(); },
    },
    {
      id: 'audit-invariants',
      title: 'Audit Mathematical Invariants & Determinism',
      category: 'System',
      icon: ShieldCheck,
      action: () => { onRunValidation(); onClose(); },
    },
  ];

  if (onInjectDebunk) {
    commands.push({
      id: 'sim-debunk',
      title: 'Deploy Fact-Check Counter-Narrative',
      category: 'Simulation',
      icon: Sparkles,
      action: () => { onInjectDebunk(); onClose(); },
    });
  }

  if (onReopenLanding) {
    commands.push({
      id: 'reopen-landing',
      title: 'Product Reveal Tour (Aurora Landing)',
      category: 'System',
      icon: Sparkles,
      action: () => { onReopenLanding(); onClose(); },
    });
  }

  const filteredCommands = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(filteredCommands.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(filteredCommands.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/50 backdrop-blur-sm select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Search Input Bar */}
            <div className="h-14 px-4 border-b border-[var(--border)] flex items-center gap-3">
              <Search className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search action..."
                className="flex-1 bg-transparent text-[var(--text)] text-[14px] outline-none placeholder:text-[var(--text-tertiary)]"
              />
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[10px] font-mono text-[var(--text-tertiary)]">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filteredCommands.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-tertiary)] text-[13px]">
                  No matching commands found.
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => {
                  const Icon = cmd.icon;
                  const isSelected = idx === selectedIndex;

                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--surface-elevated)] text-[var(--text)] border border-[var(--border-subtle)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]/40 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-[#4F8CFF]' : 'text-[var(--text-tertiary)]'}`} />
                        <span className="text-[13px] font-medium">{cmd.title}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase">
                          {cmd.category}
                        </span>
                        {cmd.shortcut && (
                          <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[10px] font-mono text-[var(--text-secondary)]">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom Helper */}
            <div className="h-9 px-4 bg-[var(--surface-elevated)]/60 border-t border-[var(--border)] flex items-center justify-between text-[11px] font-mono text-[var(--text-tertiary)]">
              <span>Navigate: ↑ ↓ • Select: ↵</span>
              <span>Linear Style Palette</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
