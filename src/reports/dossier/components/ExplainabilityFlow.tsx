/**
 * Social Gravity — Project Dossier Causal Explainability Flow
 * Step-by-Step Causal Reasoning Diagram Explaining AI Inferences
 */

import React from 'react';
import { ArrowDown, Cpu, Sparkles } from 'lucide-react';
import { InvestigationDossier } from '../types';

interface ExplainabilityFlowProps {
  dossier: InvestigationDossier;
}

export const ExplainabilityFlow: React.FC<ExplainabilityFlowProps> = ({ dossier }) => {
  const { explainabilityFlow } = dossier;

  return (
    <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl mb-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
              Causal Explainability & Inference Provenance
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              EXPLICIT DETERMINISTIC REASONING GRAPH: WHY THE AI REACHED THIS THREAT CLASSIFICATION
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 font-mono text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          WHITE-BOX AUDITABLE
        </div>
      </div>

      {/* Causal Flow Chain */}
      <div className="flex flex-col items-center max-w-2xl mx-auto space-y-3">
        {explainabilityFlow.map((step, idx) => (
          <React.Fragment key={step.step}>
            {/* Step Card */}
            <div className="w-full p-4 sm:p-5 rounded-xl border border-[var(--border)] bg-[var(--canvas)] shadow-md hover:border-teal-500/40 transition-all flex items-start gap-4">
              {/* Step Number Circle */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-cyan-500 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
                0{step.step}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-sm sm:text-base font-bold text-[var(--text)] tracking-tight">
                    {step.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/10 border border-teal-500/30 text-teal-400 uppercase">
                    {step.badge}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-mono leading-relaxed">
                  {step.detail}
                </p>
              </div>
            </div>

            {/* Down Arrow Connector */}
            {idx < explainabilityFlow.length - 1 && (
              <div className="flex flex-col items-center justify-center my-1 text-teal-400">
                <div className="w-0.5 h-3 bg-teal-500/40" />
                <ArrowDown className="w-4 h-4 text-teal-400 animate-bounce" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Audit Guarantee Note */}
      <div className="mt-8 pt-4 border-t border-[var(--border)] text-center text-xs font-mono text-[var(--text-muted)]">
        Every inference step is mathematically verifiable via logged edge interactions, quantized GoEmotions logits, and topological betweenness matrices.
      </div>
    </div>
  );
};
