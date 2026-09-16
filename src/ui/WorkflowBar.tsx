import React from 'react';
import { 
  Database, 
  Activity, 
  History, 
  GitFork, 
  FileText, 
  Sparkles, 
  Command,
  ShieldCheck,
  FolderHeart,
  Radio
} from 'lucide-react';

export type WorkflowStage = 'live' | 'import' | 'analyze' | 'replay' | 'compare' | 'export';

interface WorkflowBarProps {
  currentStage: WorkflowStage;
  onSelectStage: (stage: WorkflowStage) => void;
  onOpenTour: () => void;
  onOpenCommandPalette: () => void;
  onOpenScenarios: () => void;
  onAuditInvariants: () => void;
}

export const WorkflowBar: React.FC<WorkflowBarProps> = ({
  currentStage,
  onSelectStage,
  onOpenTour,
  onOpenCommandPalette,
  onOpenScenarios,
  onAuditInvariants,
}) => {
  const stages: Array<{
    id: WorkflowStage;
    number: number;
    label: string;
    subtitle: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'live',
      number: 0,
      label: 'Mission Control',
      subtitle: 'Live Firehose & Alerts',
      icon: <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />,
    },
    {
      id: 'import',
      number: 1,
      label: 'Import',
      subtitle: 'Datasets & Archetypes',
      icon: <Database className="w-3.5 h-3.5" />,
    },
    {
      id: 'analyze',
      number: 2,
      label: 'Analyze',
      subtitle: 'Live Network & Physics',
      icon: <Activity className="w-3.5 h-3.5" />,
    },
    {
      id: 'replay',
      number: 3,
      label: 'Replay',
      subtitle: 'Time-Travel & Emotion',
      icon: <History className="w-3.5 h-3.5" />,
    },
    {
      id: 'compare',
      number: 4,
      label: 'Compare',
      subtitle: 'Intervention Strategies',
      icon: <GitFork className="w-3.5 h-3.5" />,
    },
    {
      id: 'export',
      number: 5,
      label: 'Export',
      subtitle: 'Intelligence Briefs',
      icon: <FileText className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-400 text-slate-950 font-black text-sm shadow-glow-cyan">
            SG
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wider text-xs text-white uppercase font-mono">
                Social Gravity
              </span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                v2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Decision Intelligence OS
            </p>
          </div>
        </div>

        {/* Workflow-Based Navigation Stepper */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/90 shadow-inner overflow-x-auto max-w-full">
          {stages.map((stage) => {
            const isActive = currentStage === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => onSelectStage(stage.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
                title={`Step ${stage.number}: ${stage.subtitle} (Press '${stage.number}')`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {stage.number}
                </span>
                <div className="flex items-center gap-1">
                  {stage.icon}
                  <span>{stage.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Action Controls & Utilities */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenTour}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono transition-colors cursor-pointer"
            title="Launch 30-second guided onboarding"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tour</span>
          </button>

          <button
            onClick={onOpenScenarios}
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
            title="Scenarios Catalog (Ctrl+S)"
          >
            <FolderHeart className="w-3.5 h-3.5 text-blue-400" />
            <span>Scenarios</span>
          </button>

          <button
            onClick={onOpenCommandPalette}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
            title="Command Palette (Ctrl+K)"
          >
            <Command className="w-3.5 h-3.5 text-slate-400" />
            <kbd className="text-[10px] text-slate-400">⌘K</kbd>
          </button>

          <button
            onClick={onAuditInvariants}
            className="hidden lg:inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
            title="Audit Invariants"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
