/**
 * Social Gravity - Alert Explainability Modal
 * Provides evidence-backed causal reasoning for simulation alerts.
 * Identifies the exact causal nodes, bridge amplifiers, and emotional drivers.
 */

import React from "react";
import { X, Sparkles, ShieldAlert, GitCommit, Heart, CheckCircle2, User } from "lucide-react";
import { AlertExplanation } from "../alertExplainer";

interface ExplainabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: AlertExplanation | null;
}

export const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({
  isOpen,
  onClose,
  explanation,
}) => {
  if (!isOpen || !explanation) return null;

  const severityColor = {
    critical: "text-red-400 bg-red-500/10 border-red-500/30",
    high: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    moderate: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    low: "text-green-400 bg-green-500/10 border-green-500/30",
  }[explanation.severity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto text-[var(--text)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--text)]">{explanation.alertTitle}</h2>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${severityColor}`}>
                  {explanation.severity}
                </span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">
                Evidence-backed causal diagnostic • Detected Round {explanation.roundDetected} • {(explanation.confidenceScore * 100).toFixed(0)}% Confidence
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text)] transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Why it triggered */}
        <div className="my-4">
          <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            Why It Triggered (Evidence)
          </h3>
          <div className="space-y-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3 text-xs text-[var(--text-secondary)]">
            {explanation.triggerEvidence.map((ev, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{ev}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Causal Agents & Bridge Amplifiers */}
        <div className="grid grid-cols-2 gap-3 my-4">
          {/* Causal Agents */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
            <h4 className="text-xs font-semibold text-[var(--text)] mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-500" />
              Top Causal Nodes
            </h4>
            {explanation.causalAgents.length === 0 ? (
              <div className="text-[11px] text-[var(--text-tertiary)]">None detected</div>
            ) : (
              <div className="space-y-1.5">
                {explanation.causalAgents.map((a) => (
                  <div key={a.agentId} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-[var(--surface)] border border-[var(--border)]">
                    <div>
                      <span className="font-semibold text-[var(--text)]">{a.agentName}</span>
                      <span className="text-[var(--text-tertiary)] text-[10px] ml-1.5">({a.role})</span>
                    </div>
                    <span className="text-blue-500 font-mono text-[10px]">{a.shareCount} shares</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bridge Amplifiers */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
            <h4 className="text-xs font-semibold text-[var(--text)] mb-2 flex items-center gap-1.5">
              <GitCommit className="w-3.5 h-3.5 text-purple-500" />
              Bridge Amplifiers
            </h4>
            {explanation.bridgeAmplifiers.length === 0 ? (
              <div className="text-[11px] text-[var(--text-tertiary)]">No cross-community bridges activated</div>
            ) : (
              <div className="space-y-1.5">
                {explanation.bridgeAmplifiers.map((a) => (
                  <div key={a.agentId} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-[var(--surface)] border border-[var(--border)]">
                    <div>
                      <span className="font-semibold text-[var(--text)]">{a.agentName}</span>
                      <span className="text-[var(--text-tertiary)] text-[10px] ml-1.5">[{a.communityId}]</span>
                    </div>
                    <span className="text-purple-500 font-mono text-[10px]">Bridge Vector</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Emotion Contributions */}
        {explanation.emotionContributions.length > 0 && (
          <div className="my-4">
            <h4 className="text-xs font-semibold text-[var(--text)] mb-2 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-pink-500" />
              Emotional Drivers
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {explanation.emotionContributions.map((ef) => (
                <div key={ef.emotion} className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[11px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold capitalize text-[var(--text)]">{ef.emotion}</span>
                    <span className={`text-[9px] px-1 py-0.2 rounded ${
                      ef.impact === "amplifying" ? "text-red-500 bg-red-500/10" : "text-green-500 bg-green-500/10"
                    }`}>
                      {ef.impact}
                    </span>
                  </div>
                  <div className="text-[var(--text-tertiary)] text-[10px]">
                    {ef.agentCount} agents • Intensity: {ef.avgIntensity.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Intervention */}
        <div className="my-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Recommended Counter-Intervention
          </h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{explanation.recommendedIntervention}</p>
        </div>

        <div className="flex justify-end pt-2 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
