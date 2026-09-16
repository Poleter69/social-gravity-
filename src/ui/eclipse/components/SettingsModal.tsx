/**
 * Social Gravity — Eclipse SettingsModal
 * System configuration, psychological biases, and invariant audit vault.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, ShieldCheck } from 'lucide-react';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trustBias: number;
  onTrustBiasChange: (v: number) => void;
  conformityBias: number;
  onConformityBiasChange: (v: number) => void;
  riskToleranceBias: number;
  onRiskToleranceBiasChange: (v: number) => void;
  onRunValidation: () => void;
  liveDynamicDecay: boolean;
  onToggleDynamicDecay: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  trustBias,
  onTrustBiasChange,
  conformityBias,
  onConformityBiasChange,
  riskToleranceBias,
  onRiskToleranceBiasChange,
  onRunValidation,
  liveDynamicDecay,
  onToggleDynamicDecay,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-lg bg-[#111114] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="h-14 px-6 border-b border-[#27272A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#4F8CFF]" />
              <h2 className="text-[16px] font-semibold text-[#FAFAFA]">System Configuration</h2>
            </div>
            <button
              onClick={onClose}
              className="text-[#71717A] hover:text-[#FAFAFA] p-1 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
            {/* Psychological Priors */}
            <div className="space-y-4">
              <span className="text-[11px] font-mono uppercase font-bold text-[#71717A] tracking-wider">
                Psychological Priors (Asch & Dual-Process)
              </span>

              {/* Trust */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#D4D4D8]">Baseline Epistemic Trust</span>
                  <span className="font-mono text-[#4F8CFF]">{(trustBias * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.95}
                  step={0.05}
                  value={trustBias}
                  onChange={(e) => onTrustBiasChange(Number(e.target.value))}
                  className="w-full accent-[#4F8CFF] bg-[#27272A] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Conformity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#D4D4D8]">Asch Conformity Susceptibility</span>
                  <span className="font-mono text-[#F59E0B]">{(conformityBias * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.95}
                  step={0.05}
                  value={conformityBias}
                  onChange={(e) => onConformityBiasChange(Number(e.target.value))}
                  className="w-full accent-[#F59E0B] bg-[#27272A] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Risk Tolerance */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#D4D4D8]">Risk / Uncertainty Tolerance</span>
                  <span className="font-mono text-[#22C55E]">{(riskToleranceBias * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.95}
                  step={0.05}
                  value={riskToleranceBias}
                  onChange={(e) => onRiskToleranceBiasChange(Number(e.target.value))}
                  className="w-full accent-[#22C55E] bg-[#27272A] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Dynamic Graph Mechanics */}
            <div className="space-y-3 pt-4 border-t border-[#27272A]">
              <span className="text-[11px] font-mono uppercase font-bold text-[#71717A] tracking-wider">
                Graph Neural Dynamics
              </span>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#18181B] border border-[#27272A]">
                <div>
                  <div className="text-[13px] font-medium text-[#FAFAFA]">
                    Temporal Edge Decay
                  </div>
                  <div className="text-[11px] text-[#71717A]">
                    Exponential tie decay across unexercised edges over time
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={liveDynamicDecay}
                  onChange={onToggleDynamicDecay}
                  className="w-4 h-4 accent-[#4F8CFF] cursor-pointer"
                />
              </div>
            </div>

            {/* Invariant Audit */}
            <div className="space-y-3 pt-4 border-t border-[#27272A]">
              <span className="text-[11px] font-mono uppercase font-bold text-[#71717A] tracking-wider">
                Mathematical Verification
              </span>

              <button
                onClick={() => {
                  onRunValidation();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#22C55E]/10 hover:bg-[#22C55E]/20 border border-[#22C55E]/30 text-[#22C55E] text-[13px] font-semibold transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Run Invariant & Determinism Audit</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="h-14 px-6 bg-[#18181B]/60 border-t border-[#27272A] flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#4F8CFF] hover:bg-[#3B79F0] text-[#09090B] text-[13px] font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
