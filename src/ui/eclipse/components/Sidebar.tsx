/**
 * Social Gravity — Eclipse Expandable Sidebar
 * Strictly 6 destinations, collapsed 72px / expanded 240px with deliberate 220ms motion.
 * "Arc Browser + Linear" layered hover physics, soft blue glow, and layoutId transitions.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Satellite,
  Radio,
  RotateCcw,
  Scale,
  FileText,
  Settings,
  Activity,
  User,
} from 'lucide-react';

export type WorkspaceDestination = 'mission' | 'live' | 'replay' | 'compare' | 'reports' | 'settings';

export interface SidebarProps {
  currentWorkspace: WorkspaceDestination;
  onSelectWorkspace: (dest: WorkspaceDestination) => void;
  isStreaming?: boolean;
  activeAlertsCount?: number;
}

const DESTINATIONS: Array<{
  id: WorkspaceDestination;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}> = [
  { id: 'mission', label: 'Mission Control', subtitle: 'Command Center', icon: Satellite },
  { id: 'live', label: 'Live Feed', subtitle: 'Firehose Ingestion', icon: Radio, badge: 'LIVE' },
  { id: 'replay', label: 'Replay', subtitle: 'Temporal Scrubber', icon: RotateCcw },
  { id: 'compare', label: 'Compare', subtitle: 'Strategy Optimizer', icon: Scale },
  { id: 'reports', label: 'Reports', subtitle: 'Dossiers & Audits', icon: FileText },
  { id: 'settings', label: 'Settings', subtitle: 'Priors & Invariants', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentWorkspace,
  onSelectWorkspace,
  isStreaming = true,
  activeAlertsCount = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<WorkspaceDestination | null>(null);

  return (
    <motion.aside
      animate={{ width: isExpanded ? 240 : 72 }}
      transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        setIsExpanded(false);
        setHoveredItem(null);
      }}
      className="relative h-screen bg-[#111114] border-r border-[#27272A] flex flex-col justify-between select-none z-40 shrink-0 overflow-hidden"
    >
      {/* Top: Logo & Branding */}
      <div>
        <div className="h-14 flex items-center px-4.5 gap-3 border-b border-[#27272A] overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center shrink-0 text-[#4F8CFF] shadow-[0_0_12px_rgba(79,140,255,0.15)]">
            <Activity className="w-4 h-4" />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.16 }}
                className="whitespace-nowrap overflow-hidden"
              >
                <div className="text-[14px] font-semibold tracking-tight text-[#FAFAFA]">
                  Social Gravity
                </div>
                <div className="text-[10px] font-mono tracking-widest text-[#71717A] uppercase">
                  v3.0.0 Workstation
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Items (strictly 6) */}
        <nav className="p-2.5 space-y-1.5 mt-2">
          {DESTINATIONS.map((item) => {
            const Icon = item.icon;
            const isActive = currentWorkspace === item.id;
            const isHovered = hoveredItem === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => onSelectWorkspace(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                whileTap={{ scale: 0.98 }}
                className="relative w-full flex items-center h-10 px-3 rounded-xl cursor-pointer text-left focus:outline-none"
              >
                {/* Active Background Pill with layoutId for smooth sliding transition */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavPill"
                    className="absolute inset-0 rounded-xl bg-[#18181B] border border-[#27272A] shadow-md"
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}

                {/* Hover Soft Glow Background (220ms ease, non-harsh) */}
                {!isActive && isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="absolute inset-0 rounded-xl bg-[#18181B]/70 border border-[#27272A]/80 shadow-[0_0_16px_-2px_rgba(79,140,255,0.2)]"
                  />
                )}

                {/* Active Glowing Left Accent Bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeAccentBar"
                    className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#4F8CFF] rounded-r shadow-[0_0_8px_rgba(79,140,255,0.7)]"
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}

                {/* Left Accent Bar on Hover (grows smoothly) */}
                {!isActive && isHovered && (
                  <motion.div
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 0.6 }}
                    exit={{ scaleY: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="absolute left-0 top-3 bottom-3 w-0.5 bg-[#4F8CFF]/50 rounded-r"
                  />
                )}

                {/* Icon (scales to 1.08 on hover over 220ms) */}
                <motion.div
                  animate={{
                    scale: isHovered || isActive ? 1.08 : 1.0,
                  }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="relative z-10 w-5 h-5 flex items-center justify-center shrink-0"
                >
                  <Icon
                    className={`w-4 h-4 transition-colors duration-200 ${
                      isActive
                        ? 'text-[#4F8CFF]'
                        : isHovered
                        ? 'text-[#FAFAFA]'
                        : 'text-[#A1A1AA]'
                    }`}
                  />
                </motion.div>

                {/* Label and Subtitle (slides in slightly x: 3 on hover) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{
                        opacity: 1,
                        x: isHovered ? 3 : 0,
                      }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="relative z-10 ml-3 flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap text-left"
                    >
                      <div className="truncate">
                        <div
                          className={`text-[13px] leading-tight transition-colors duration-200 ${
                            isActive
                              ? 'font-semibold text-[#FAFAFA]'
                              : isHovered
                              ? 'font-medium text-[#FAFAFA]'
                              : 'font-normal text-[#A1A1AA]'
                          }`}
                        >
                          {item.label}
                        </div>
                        <div className="text-[10px] text-[#71717A] leading-tight mt-0.5">
                          {item.subtitle}
                        </div>
                      </div>

                      {item.badge && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 shrink-0">
                          {item.badge}
                        </span>
                      )}

                      {item.id === 'mission' && activeAlertsCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 shrink-0">
                          {activeAlertsCount}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Connector Health & Profile */}
      <div className="p-2.5 border-t border-[#27272A] space-y-2">
        {/* Stream Health Mini Indicator */}
        <div className="px-2 py-1.5 rounded-lg bg-[#18181B]/60 border border-[#27272A] flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isStreaming ? 'bg-[#22C55E] animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-[#71717A]'
            }`}
          />
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                className="text-[11px] font-mono text-[#A1A1AA] truncate whitespace-nowrap"
              >
                {isStreaming ? 'Reddit + RSS Ingesting' : 'Stream Paused'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Analyst Profile */}
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[#71717A]">
          <div className="w-7 h-7 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center shrink-0 text-[#A1A1AA]">
            <User className="w-3.5 h-3.5" />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                className="overflow-hidden whitespace-nowrap text-left truncate"
              >
                <div className="text-[12px] font-medium text-[#FAFAFA] truncate">
                  Lead Analyst
                </div>
                <div className="text-[10px] font-mono text-[#71717A] truncate">
                  Palantir Foundry Clearance
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
};
