import React, { useState } from 'react';
import { 
  ChevronRight, 
  X, 
  Sparkles, 
  Database, 
  Play, 
  Pause, 
  GitFork, 
  FileText
} from 'lucide-react';

export interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDemoDataset: () => void;
  onStartSimulation: () => void;
  onPauseAtRound12: () => void;
  onOpenCompare: () => void;
  onOpenExport: () => void;
  currentRound: number;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  isOpen,
  onClose,
  onLoadDemoDataset,
  onStartSimulation,
  onPauseAtRound12,
  onOpenCompare,
  onOpenExport,
  currentRound,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: 'Load Built-In Discussion',
      description: 'Ingest an authentic multi-community Reddit tree modeling cross-subreddit discussion and influence ties.',
      actionLabel: 'Load Reddit Example',
      icon: <Database className="w-5 h-5 text-cyan-400" />,
      action: () => {
        onLoadDemoDataset();
        setCurrentStep(2);
      },
    },
    {
      step: 2,
      title: 'Start Diffusion Simulation',
      description: 'Watch how epistemic trust, peer conformity, and emotional resonance accelerate narrative propagation.',
      actionLabel: 'Start Simulation',
      icon: <Play className="w-5 h-5 text-emerald-400" />,
      action: () => {
        onStartSimulation();
        setCurrentStep(3);
      },
    },
    {
      step: 3,
      title: 'Pause & Inspect at Round 12',
      description: `Simulate until critical threshold (current round: ${currentRound}). Identify key opinion leaders and bridge brokers.`,
      actionLabel: 'Advance & Pause at Round 12',
      icon: <Pause className="w-5 h-5 text-amber-400" />,
      action: () => {
        onPauseAtRound12();
        setCurrentStep(4);
      },
    },
    {
      step: 4,
      title: 'Compare Intervention Strategies',
      description: 'Run 3 parallel counterfactual branches from this exact tick: No Action vs Public Debunk vs Bridge Inoculation.',
      actionLabel: 'Compare 3 Strategies',
      icon: <GitFork className="w-5 h-5 text-purple-400" />,
      action: () => {
        onOpenCompare();
        setCurrentStep(5);
      },
    },
    {
      step: 5,
      title: 'Export Executive Intelligence Brief',
      description: 'Download publication-grade executive brief, technical audit trail, or deterministic replay state bundle.',
      actionLabel: 'View Intelligence Reports',
      icon: <FileText className="w-5 h-5 text-emerald-400" />,
      action: () => {
        onOpenExport();
        onClose();
      },
    },
  ];

  const active = steps[currentStep - 1];

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-md animate-fade-in font-sans">
      <div className="overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-xl ring-1 ring-cyan-500/20">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                30-Second Guided Tour
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Step {currentStep} of {steps.length}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title="Close tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Dots */}
        <div className="mt-3 flex items-center gap-1.5">
          {steps.map((s) => (
            <div
              key={s.step}
              onClick={() => setCurrentStep(s.step)}
              className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all ${
                s.step === currentStep
                  ? 'bg-cyan-400'
                  : s.step < currentStep
                  ? 'bg-emerald-500'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Step Body */}
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-slate-800/80 p-2 border border-slate-700/60">
              {active.icon}
            </div>
            <h4 className="text-sm font-bold text-white tracking-tight">{active.title}</h4>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed pl-1">{active.description}</p>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 transition-colors cursor-pointer"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                Back
              </button>
            )}

            <button
              onClick={active.action}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <span>{active.actionLabel}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
