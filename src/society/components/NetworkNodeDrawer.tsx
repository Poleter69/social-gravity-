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
  Eye,
} from 'lucide-react';
import { CanvasNode } from '../canvas/types';
import { EMOTION_COLOR_MAP, GoEmotionLabel } from '../../nlp/types';
import { safetyClassifier } from '../../safety';

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
        className="absolute top-4 right-4 bottom-4 w-92 bg-[var(--surface-elevated)]/95 border border-[var(--border)] rounded-2xl shadow-2xl backdrop-blur-xl z-30 flex flex-col overflow-hidden text-[var(--text)] pointer-events-auto select-none"
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface)]/70 shrink-0">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: node.color }}
              />
              <span className="text-[12px] font-mono text-[var(--text-tertiary)] uppercase">
                {node.source} • {node.id}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--text-tertiary)] hover:text-[var(--text)] p-1 rounded cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[var(--text)] tracking-tight">
                {node.label}
              </h2>
              <div className="text-[11px] font-mono text-[var(--text-secondary)]">
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
                  INFLUENCER
                </span>
              )}
              {node.isBridge && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00F0FF]/20 border border-[#00F0FF]/40 text-[#00F0FF]">
                  BRIDGE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Intelligence Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[12px]">
          {/* 1. State & Threat Severity Matrix */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase">EPIDEMIC STATUS</span>
              <div className="flex items-center gap-1.5 font-bold" style={{ color: stateColor }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stateColor }} />
                <span>{node.state || 'SUSCEPTIBLE'}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase">RISK SEVERITY</span>
              <div className="flex items-center gap-1.5 font-bold uppercase" style={{ color: riskColor }}>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{node.riskLevel}</span>
              </div>
            </div>
          </div>

          {/* M20 Stage 9: Safety Intelligence Evidence Card */}
          {(() => {
            const safety = node.safety || safetyClassifier.classify(node.content || node.label);
            if (!safety || safety.category === 'none') return null;

            const isTerrorism = safety.category === 'terrorism';
            const accentColor = isTerrorism ? '#F59E0B' : '#A855F7';
            const bgClass = isTerrorism ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30' : 'bg-[#A855F7]/10 border-[#A855F7]/30';

            return (
              <div className={`p-3 rounded-xl border space-y-2 font-mono ${bgClass}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isTerrorism ? (
                      <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
                    ) : (
                      <Eye className="w-4 h-4 text-[#A855F7]" />
                    )}
                    <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--text)]">
                      {isTerrorism ? '⚠️ TERRORISM & EXTREMISM' : '🔞 EXPLICIT CONTENT'}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase text-[var(--text)] bg-[var(--surface-elevated)] border border-[var(--border)]">
                    {(safety.confidence * 100).toFixed(0)}% CONF
                  </span>
                </div>

                {/* Confidence Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                    <span>Model Confidence</span>
                    <span style={{ color: accentColor }}>{(safety.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${safety.confidence * 100}%`,
                        backgroundColor: accentColor,
                      }}
                    />
                  </div>
                </div>

                {/* Supporting Indicators / Reasons */}
                {safety.reasons && safety.reasons.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-tertiary)] uppercase">INDICATORS DETECTED:</span>
                    <ul className="space-y-0.5 text-[10px] text-[var(--text-secondary)]">
                      {safety.reasons.map((r, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Flagged Keywords */}
                {safety.flaggedKeywords && safety.flaggedKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {safety.flaggedKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded text-[9px] bg-[var(--surface-elevated)] text-[var(--text)] border border-[var(--border)]"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 1b. EMOTION ENGINE FORENSIC DEBUG OVERLAY (Milestone M21.2) */}
          <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[#00F0FF]/35 space-y-2.5 font-mono text-[11px] shadow-lg">
            <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border)]">
              <span className="text-[#00F0FF] font-bold text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                EMOTION PIPELINE FORENSIC TRACE
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                LIVE TELEMETRY
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-[var(--text-tertiary)]">Node ID:</span>
                <div className="text-[var(--text)] truncate font-bold" title={node.id}>{node.id}</div>
              </div>
              <div>
                <span className="text-[var(--text-tertiary)]">Source:</span>
                <div className="text-[#F59E0B] uppercase font-bold">{node.source}</div>
              </div>
              <div>
                <span className="text-[var(--text-tertiary)]">Primary Emotion:</span>
                <div className="font-bold uppercase" style={{ color: emoColor }}>{node.emotion}</div>
              </div>
              <div>
                <span className="text-[var(--text-tertiary)]">Confidence:</span>
                <div className="text-[var(--text)] font-bold">
                  {((node.emotionConfidence || 0.78) * 100).toFixed(1)}%
                  <span className="ml-1 text-[9px] text-[var(--text-tertiary)]">
                    ({(node.emotionConfidence || 0.78) >= 0.61 ? 'HIGH' : (node.emotionConfidence || 0.78) >= 0.31 ? 'MED' : 'LOW'})
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[var(--text-tertiary)]">Safety Category:</span>
                <div className={node.safety && node.safety.category !== 'none' ? 'text-[#EF4444] font-bold uppercase' : 'text-[#10B981]'}>
                  {node.safety?.category || 'none'}
                </div>
              </div>
              <div>
                <span className="text-[var(--text-tertiary)]">Narrative / Cluster:</span>
                <div className="text-[#38BDF8] truncate font-semibold" title={node.narrative || node.communityName}>
                  {node.narrative || node.communityName || 'Global'}
                </div>
              </div>
            </div>

            {node.content && (
              <div className="pt-1.5 border-t border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase">Raw Ingested Text:</span>
                <div className="mt-1 text-[var(--text-secondary)] text-[10px] bg-[var(--surface-elevated)] p-2 rounded border border-[var(--border)] leading-relaxed max-h-20 overflow-y-auto">
                  "{node.content}"
                </div>
              </div>
            )}
          </div>

          {/* 2. GoEmotions Affect Capsule */}
          <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[var(--text-tertiary)] uppercase">AFFECTIVE PROFILE</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white" style={{ backgroundColor: emoColor }}>
                {node.emotion}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-tertiary)]">
              <span>Confidence: <strong className="text-[var(--text)]">{((node.emotionConfidence || 0.78) * 100).toFixed(0)}%</strong></span>
              <span>Degree Centrality: <strong className="text-[#00F0FF]">{node.metrics.degree}</strong></span>
            </div>

            {/* Top affect trait distribution */}
            {(() => {
              const activeProfile = node.emotionProfile || raw?.psychology?.emotionProfile;
              const topEmos = activeProfile?.topEmotions || [];
              if (topEmos.length === 0) return null;

              return (
                <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
                  <span className="text-[9px] font-mono text-[var(--text-tertiary)] uppercase">Top Emotion Breakdown</span>
                  {topEmos.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="space-y-0.5 font-mono text-[10px]">
                      <div className="flex justify-between text-[var(--text-secondary)]">
                        <span className="capitalize">{item.emotion}</span>
                        <span>{(item.score * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.max(5, item.score * 100))}%`,
                            backgroundColor: EMOTION_COLOR_MAP[item.emotion] || '#00F0FF',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* 3. Psychological Trait Matrix */}
          <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
            <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase">PSYCHOMETRIC TENDENCIES</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div>
                <span className="text-[var(--text-tertiary)]">Epistemic Trust:</span>
                <div className="text-[#10B981] font-bold">{(node.traits.trust * 100).toFixed(0)}%</div>
              </div>
              <div>
                <span className="text-[var(--text-tertiary)]">Persuasive Pull:</span>
                <div className="text-[#F59E0B] font-bold">{(node.traits.influence * 100).toFixed(0)}%</div>
              </div>
              <div>
                <span className="text-[var(--text-tertiary)]">Asch Conformity:</span>
                <div className="text-[#38BDF8] font-bold">{(node.traits.conformity * 100).toFixed(0)}%</div>
              </div>
              <div>
                <span className="text-[var(--text-tertiary)]">Risk Tolerance:</span>
                <div className="text-[#EF4444] font-bold">{(node.traits.riskTolerance * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>

          {/* 4. Evidence / Narrative Content */}
          {node.content && (
            <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1.5">
              <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase">OBSERVED EVIDENCE / CONTENT</span>
              <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed line-clamp-4">
                "{node.content}"
              </p>
            </div>
          )}

          {/* 5. Spread Lineage & Parent */}
          <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
            <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase flex items-center gap-1.5">
              <GitBranch className="w-3 h-3 text-[#00F0FF]" />
              SPREAD LINEAGE
            </span>
            {parentInfectionNode ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)]">
                <div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">Infected By Vector:</div>
                  <div className="font-semibold text-[var(--text)]">{parentInfectionNode.label}</div>
                </div>
                <button
                  onClick={() => onFlyToNode(parentInfectionNode)}
                  className="px-2 py-1 rounded bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-[#00F0FF] text-[10px] font-mono cursor-pointer"
                >
                  Jump →
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-[var(--text-tertiary)] font-mono">
                {node.isPatientZero ? 'Root seed (Patient Zero)' : 'Direct community contagion vector.'}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)]/80 flex flex-col gap-2 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onFlyToNode(node)}
              className="px-3 py-2 rounded-lg bg-[var(--surface-elevated)] hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-[11px] font-mono font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
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
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-[11px] font-mono font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
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
