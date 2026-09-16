/**
 * Social Gravity — Interactive Node Intelligence Side Drawer (Stage 7)
 * Slide-out right panel (never a modal) providing deep forensic dossier:
 * Author, source platform, timestamp, GoEmotions affect capsule, spread lineage,
 * psychological traits, evidence, and direct replay jumps.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Target,
  Clock,
  Layers,
  GitBranch,
} from 'lucide-react';
import { CanvasNode } from '../canvas/types';
import { EMOTION_COLOR_MAP, GoEmotionLabel } from '../../nlp/types';

export interface NetworkNodeDrawerProps {
  node: CanvasNode | null;
  onClose: () => void;
  onFlyToNode: (node: CanvasNode) => void;
  onFocusNarrative?: (node: CanvasNode) => void;
  onInoculateNode?: (nodeId: string) => void;
  onReplayJump?: (round: number) => void;
  parentInfectionNode?: CanvasNode | null;
}

export const NetworkNodeDrawer: React.FC<NetworkNodeDrawerProps> = ({
  node,
  onClose,
  onFlyToNode,
  onFocusNarrative,
  onInoculateNode,
  onReplayJump,
  parentInfectionNode,
}) => {
  if (!node) return null;

  const raw = node.rawAgent;
  const emoColor = EMOTION_COLOR_MAP[node.emotion as GoEmotionLabel] || '#38BDF8';
  const stateColor =
    node.state === 'BELIEVER'
      ? '#EF4444'
      : node.state === 'DEBUNKER'
      ? '#10B981'
      : node.state === 'SKEPTIC'
      ? '#A855F7'
      : '#06B6D4';

  const riskColor =
    node.riskLevel === 'critical'
      ? '#EF4444'
      : node.riskLevel === 'high'
      ? '#F97316'
      : node.riskLevel === 'moderate'
      ? '#FBBF24'
      : '#10B981';

  return (
    <AnimatePresence>
      <motion.div
        key={node.id}
        initial={{ x: 380, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 380, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="absolute top-4 right-4 bottom-4 w-92 bg-[#111114]/95 border border-[#27272A] rounded-2xl shadow-2xl backdrop-blur-xl z-30 flex flex-col overflow-hidden text-[#FAFAFA] pointer-events-auto select-none"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#27272A] bg-[#18181B]/70 shrink-0">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: node.color }}
              />
              <span className="text-[12px] font-mono text-[#71717A] uppercase">
                {node.source} • {node.id}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-[#71717A] hover:text-[#FAFAFA] p-1 rounded cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#FAFAFA] tracking-tight">
                {node.label}
              </h2>
              <div className="text-[11px] font-mono text-[#A1A1AA]">
                {node.sublabel || node.communityName}
              </div>
            </div>

            {/* Role Badges */}
            <div className="flex flex-col items-end gap-1">
              {node.isPatientZero && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444]">
                  PATIENT ZERO
                </span>
              )}
              {node.isInfluencer && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#F59E0B]">
                  INFLUENCER HUB
                </span>
              )}
              {node.isBridge && !node.isInfluencer && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00F0FF]/20 border border-[#00F0FF]/40 text-[#00F0FF]">
                  BOUNDARY BRIDGE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Intelligence Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[12px]">
          {/* 1. State & Threat Severity Matrix */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-[#18181B] border border-[#27272A] space-y-1">
              <span className="text-[10px] font-mono text-[#71717A] uppercase">EPIDEMIC STATUS</span>
              <div className="flex items-center gap-1.5 font-bold" style={{ color: stateColor }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stateColor }} />
                <span>{node.state || 'SUSCEPTIBLE'}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#18181B] border border-[#27272A] space-y-1">
              <span className="text-[10px] font-mono text-[#71717A] uppercase">RISK SEVERITY</span>
              <div className="flex items-center gap-1.5 font-bold uppercase" style={{ color: riskColor }}>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{node.riskLevel}</span>
              </div>
            </div>
          </div>

          {/* 2. GoEmotions Affect Capsule */}
          <div className="p-3 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#71717A] uppercase">AFFECTIVE PROFILE</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white" style={{ backgroundColor: emoColor }}>
                {node.emotion}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A]">
              <span>Confidence: <strong className="text-[#FAFAFA]">{((node.emotionConfidence || 0.78) * 100).toFixed(0)}%</strong></span>
              <span>Degree Centrality: <strong className="text-[#00F0FF]">{node.metrics.degree}</strong></span>
            </div>

            {/* Top affect trait distribution */}
            {raw?.psychology?.emotionProfile?.topEmotions && (
              <div className="space-y-1 pt-1 border-t border-[#27272A]">
                {raw.psychology.emotionProfile.topEmotions.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="space-y-0.5 font-mono text-[10px]">
                    <div className="flex justify-between text-[#A1A1AA]">
                      <span className="capitalize">{item.emotion}</span>
                      <span>{(item.score * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1 bg-[#27272A] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, item.score * 100)}%`,
                          backgroundColor: EMOTION_COLOR_MAP[item.emotion] || '#00F0FF',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Psychological Trait Matrix */}
          <div className="p-3 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2">
            <span className="text-[10px] font-mono text-[#71717A] uppercase">PSYCHOMETRIC TENDENCIES</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div>
                <span className="text-[#71717A]">Epistemic Trust:</span>
                <div className="text-[#10B981] font-bold">{(node.traits.trust * 100).toFixed(0)}%</div>
              </div>
              <div>
                <span className="text-[#71717A]">Persuasive Pull:</span>
                <div className="text-[#F59E0B] font-bold">{(node.traits.influence * 100).toFixed(0)}%</div>
              </div>
              <div>
                <span className="text-[#71717A]">Asch Conformity:</span>
                <div className="text-[#38BDF8] font-bold">{(node.traits.conformity * 100).toFixed(0)}%</div>
              </div>
              <div>
                <span className="text-[#71717A]">Risk Tolerance:</span>
                <div className="text-[#EF4444] font-bold">{(node.traits.riskTolerance * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>

          {/* 4. Evidence / Narrative Content */}
          {node.content && (
            <div className="p-3 rounded-xl bg-[#18181B] border border-[#27272A] space-y-1.5">
              <span className="text-[10px] font-mono text-[#71717A] uppercase">OBSERVED EVIDENCE / CONTENT</span>
              <p className="text-[#D4D4D8] text-[11px] leading-relaxed line-clamp-4">
                "{node.content}"
              </p>
            </div>
          )}

          {/* 5. Spread Lineage & Parent */}
          <div className="p-3 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2">
            <span className="text-[10px] font-mono text-[#71717A] uppercase flex items-center gap-1.5">
              <GitBranch className="w-3 h-3 text-[#00F0FF]" />
              SPREAD LINEAGE
            </span>
            {parentInfectionNode ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#141417] border border-[#27272A]">
                <div>
                  <div className="text-[10px] text-[#71717A]">Infected By Vector:</div>
                  <div className="font-semibold text-[#FAFAFA]">{parentInfectionNode.label}</div>
                </div>
                <button
                  onClick={() => onFlyToNode(parentInfectionNode)}
                  className="px-2 py-1 rounded bg-[#27272A] hover:bg-[#3F3F46] text-[#00F0FF] text-[10px] font-mono cursor-pointer"
                >
                  Jump →
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-[#71717A] font-mono">
                {node.isPatientZero ? 'Root seed (Patient Zero)' : 'Direct community contagion vector.'}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-[#27272A] bg-[#18181B]/80 flex flex-col gap-2 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onFlyToNode(node)}
              className="px-3 py-2 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] text-[11px] font-mono font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Target className="w-3.5 h-3.5 text-[#00F0FF]" />
              Center View
            </button>

            {onFocusNarrative && (
              <button
                onClick={() => onFocusNarrative(node)}
                className="px-3 py-2 rounded-lg bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] text-[11px] font-mono font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                Focus Path
              </button>
            )}
          </div>

          {onReplayJump && raw?.state?.exposureTick !== undefined && raw.state.exposureTick !== null && (
            <button
              onClick={() => onReplayJump(raw.state.exposureTick!)}
              className="w-full px-3 py-2 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] text-[11px] font-mono font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-[#4F8CFF]" />
              Replay Jump to Exposure (t={raw.state.exposureTick})
            </button>
          )}

          {onInoculateNode && node.state !== 'DEBUNKER' && (
            <button
              onClick={() => onInoculateNode(node.id)}
              className="w-full px-3 py-2 rounded-lg bg-[#10B981]/20 hover:bg-[#10B981]/30 border border-[#10B981]/40 text-[#10B981] text-[11px] font-mono font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Deploy Inoculation at this Node
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
