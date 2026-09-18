/**
 * Social Gravity — Eclipse Top Command Bar
 * 56px fixed header with breadcrumbs, Ctrl+K command bar trigger,
 * connector health pills, alert counter, and invariant validation.
 */

import React from 'react';
import {
  Search,
  ShieldCheck,
  Bell,
  Sparkles,
  Command,
  LogOut,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '../../theme/ThemeToggle';
import { useAuth } from '../../../auth/authContext';

export interface CommandBarProps {
  currentWorkspaceName: string;
  onOpenCommandPalette: () => void;
  onOpenAlerts?: () => void;
  onOpenValidation?: () => void;
  onRunDiscovery?: () => void;
  isDiscovering?: boolean;
  activeAlertsCount?: number;
  redditActive?: boolean;
  rssActive?: boolean;
  blueskyActive?: boolean;
  commentsPerSec?: number;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  currentWorkspaceName,
  onOpenCommandPalette,
  onOpenAlerts,
  onOpenValidation,
  onRunDiscovery,
  isDiscovering = false,
  activeAlertsCount = 0,
  commentsPerSec = 0,
}) => {
  const { user, logout } = useAuth();
  return (
    <header
      className="h-14 border-b px-5 flex items-center justify-between select-none shrink-0 z-30"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Left: Breadcrumbs & Current View */}
      <div className="flex items-center gap-2.5">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
          SOCIAL GRAVITY
        </span>
        <span className="text-[var(--text-tertiary)] font-mono text-[12px]">/</span>
        <span className="text-[14px] font-semibold text-[var(--text)] tracking-tight">
          {currentWorkspaceName}
        </span>
      </div>

      {/* Center: Quick Search / Command Palette (Linear style) */}
      <motion.button
        whileHover={{ scale: 1.01, borderColor: 'var(--primary)' }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.12 }}
        onClick={onOpenCommandPalette}
        className="flex items-center gap-2.5 px-3 py-1.5 w-72 md:w-96 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer text-left shadow-sm"
      >
        <Search className="w-3.5 h-3.5 shrink-0 text-[var(--text-tertiary)]" />
        <span className="text-[13px] flex-1 truncate font-normal">
          Type a command or search nodes...
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--border)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-muted)]">
          <Command className="w-2.5 h-2.5" /> K
        </kbd>
      </motion.button>

      {/* Right: Telemetry, Connectors & Status Pills */}
      <div className="flex items-center gap-3">
        {/* Connector Pills */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[11px] font-mono">
          <span className="text-[var(--text-tertiary)] mr-1">SOURCES:</span>
          <span className="flex items-center gap-1 text-[#22C55E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> Reddit
          </span>
          <span className="text-[var(--text-tertiary)]">•</span>
          <span className="flex items-center gap-1 text-[#22C55E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> RSS
          </span>
          <span className="text-[var(--text-tertiary)]">•</span>
          <span className="flex items-center gap-1 text-[var(--text-tertiary)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]" /> Bluesky
          </span>
          {commentsPerSec > 0 && (
            <span className="ml-1 text-[#4F8CFF] font-bold">
              {commentsPerSec}/s
            </span>
          )}
        </div>

        {/* Invariant Auditor */}
        {onOpenValidation && (
          <button
            onClick={onOpenValidation}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            title="Verify mathematical invariants and determinism"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
            <span className="hidden sm:inline">Audit Invariants</span>
          </button>
        )}

        {/* AI Discovery Button */}
        {onRunDiscovery && (
          <button
            onClick={onRunDiscovery}
            disabled={isDiscovering}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#4F8CFF]/10 hover:bg-[#4F8CFF]/20 border border-[#4F8CFF]/30 text-[12px] font-medium text-[#4F8CFF] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isDiscovering ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">
              {isDiscovering ? 'Analyzing...' : 'AI Discovery'}
            </span>
          </button>
        )}

        {/* Alerts Badge */}
        <button
          onClick={onOpenAlerts}
          className={`relative p-2 rounded-lg border transition-colors cursor-pointer ${
            activeAlertsCount > 0
              ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/20'
              : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text)]'
          }`}
          title={`${activeAlertsCount} active threat alerts`}
        >
          <Bell className="w-4 h-4" />
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-mono font-bold flex items-center justify-center">
              {activeAlertsCount}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Avatar + Logout */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l" style={{ borderColor: 'var(--border)' }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #4F8CFF, #8B5CF6)' }}
              title={user.displayName}
            >
              {user.avatarInitials}
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg transition-colors cursor-pointer"
              style={{ color: 'var(--text-tertiary)' }}
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
