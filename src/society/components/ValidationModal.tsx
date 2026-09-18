/**
 * Social Gravity - Society Validation Report Modal
 * Shows real-time automated verification of topological invariants and trait bounds.
 */

import React from 'react';
import { ValidationReport } from '../validation/societyValidator';
import { CheckCircle2, AlertTriangle, X, ShieldAlert, Check } from 'lucide-react';

interface ValidationModalProps {
  report: ValidationReport;
  onClose: () => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 font-mono text-[var(--text)]">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center space-x-2.5">
            {report.isValid ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-rose-500" />
            )}
            <div>
              <h3 className="text-base font-bold text-[var(--text)]">System Integrity & Validation</h3>
              <p className="text-xs text-[var(--text-tertiary)]">Automated structural invariant verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Global Verdict Banner */}
        <div
          className={`p-3 rounded-lg border flex items-center justify-between ${
            report.isValid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {report.isValid ? <Check className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-rose-500" />}
            <span className="font-bold text-xs">
              {report.isValid ? 'ALL INVARIANTS SATISFIED — ZERO CORRUPTION' : 'INTEGRITY VIOLATION DETECTED'}
            </span>
          </div>
          <span className="text-[10px] text-[var(--text-tertiary)]">
            {new Date(report.timestamp).toLocaleTimeString()}
          </span>
        </div>

        {/* Individual Invariant Checks */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {report.checks.map((c, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] flex items-start justify-between gap-3 text-xs"
            >
              <div>
                <div className="font-bold text-[var(--text)]">{c.name}</div>
                <div className="text-[var(--text-secondary)] text-[11px] mt-0.5">{c.details}</div>
              </div>
              {c.passed ? (
                <span className="shrink-0 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  PASSED
                </span>
              ) : (
                <span className="shrink-0 px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                  FAILED
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--bg)] font-bold text-xs font-mono transition-all cursor-pointer"
          >
            Dismiss Report
          </button>
        </div>
      </div>
    </div>
  );
};
