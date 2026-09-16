/**
 * Social Gravity — Project Eclipse Master Application Shell
 * "If Apple designed Palantir Foundry"
 * 
 * Strict 100vh grid, zero window scroll, 8pt spacing system,
 * expandable left sidebar (72px -> 240px), 56px command bar,
 * 56px operations dock, and Framer Motion transitions.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, WorkspaceDestination } from './components/Sidebar';
import { CommandBar } from './components/CommandBar';
import { OperationsDock } from './components/OperationsDock';
import { MissionControlWorkspace } from './workspaces/MissionControlWorkspace';
import { LiveWorkspace } from './workspaces/LiveWorkspace';
import { ReplayWorkspace } from './workspaces/ReplayWorkspace';
import { CompareWorkspace } from './workspaces/CompareWorkspace';
import { ReportCenterWorkspace } from './workspaces/ReportCenterWorkspace';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { SettingsModal } from './components/SettingsModal';
import { NotificationCenter, emitNotification } from '../NotificationCenter';
import { RealDatasetModal } from '../../datasets/components/RealDatasetModal';
import { ValidationModal } from '../../society/components/ValidationModal';
import { ExplainabilityModal } from '../../explainability/components/ExplainabilityModal';
import { AlertExplanation, alertExplainer } from '../../explainability';
import { Society } from '../../society/types/society';
import { SimulationState } from '../../simulation/types';
import { RumorEngine } from '../../simulation/rumorEngine';
import { LoadedDatasetResult } from '../../datasets/realDatasetService';
import { CounterfactualComparisonResult } from '../../simulation/counterfactualEngine';
import { DiscoveryReport } from '../../discovery';

export interface EclipseAppShellProps {
  activeSociety: Society;
  simState: SimulationState | null;
  engine: RumorEngine | null;
  isPlaying: boolean;
  simSpeedMs: number;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onScrubToRound: (round: number) => void;
  onSimSpeedChange: (speed: number) => void;
  onDatasetLoaded: (result: LoadedDatasetResult) => void;
  onRunValidation: () => void;
  validationReport: any;
  onCloseValidation: () => void;
  counterfactualResult: CounterfactualComparisonResult | null;
  onComputeComparison: () => void;
  onApplyCounterfactualBranch: (branchId: string) => void;
  onInjectDebunk: () => void;
  discoveryReport: DiscoveryReport | null;
  onRunDiscovery: () => void;
  isDiscovering: boolean;
  trustBias: number;
  onTrustBiasChange: (v: number) => void;
  conformityBias: number;
  onConformityBiasChange: (v: number) => void;
  riskToleranceBias: number;
  onRiskToleranceBiasChange: (v: number) => void;
  liveDynamicDecay: boolean;
  onToggleDynamicDecay: () => void;
  onResynthesize?: () => void;
  onSelectHoax?: (hoax: any) => void;
  onSelectSeedStrategy?: (strategy: any) => void;
}

export const EclipseAppShell: React.FC<EclipseAppShellProps> = ({
  activeSociety,
  simState,
  engine,
  isPlaying,
  simSpeedMs,
  onTogglePlay,
  onStepForward,
  onReset,
  onScrubToRound,
  onSimSpeedChange,
  onDatasetLoaded,
  onRunValidation,
  validationReport,
  onCloseValidation,
  counterfactualResult,
  onComputeComparison,
  onApplyCounterfactualBranch,
  onInjectDebunk,
  discoveryReport,
  onRunDiscovery,
  isDiscovering,
  trustBias,
  onTrustBiasChange,
  conformityBias,
  onConformityBiasChange,
  riskToleranceBias,
  onRiskToleranceBiasChange,
  liveDynamicDecay,
  onToggleDynamicDecay,
}) => {
  // Active Workspace Navigation
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceDestination>('mission');

  // Modals state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [isExplainabilityOpen, setIsExplainabilityOpen] = useState(false);
  const [activeAlertExplanation, setActiveAlertExplanation] = useState<AlertExplanation | null>(null);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '1') {
        setCurrentWorkspace('mission');
      } else if (e.key === '2') {
        setCurrentWorkspace('live');
      } else if (e.key === '3') {
        setCurrentWorkspace('replay');
      } else if (e.key === '4') {
        if (!counterfactualResult) onComputeComparison();
        setCurrentWorkspace('compare');
      } else if (e.key === '5') {
        setCurrentWorkspace('reports');
      } else if (e.key === '6') {
        setIsSettingsOpen(true);
      } else if (e.key === ' ') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onStepForward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [counterfactualResult, onComputeComparison, onTogglePlay, onStepForward]);

  // Causal explanation trigger for alerts
  const handleOpenAlertExplanation = (title: string) => {
    if (!simState) return;
    const exp = alertExplainer.explain(
      activeSociety,
      simState,
      simState.telemetryHistory,
      discoveryReport,
      title
    );
    setActiveAlertExplanation(exp);
    setIsExplainabilityOpen(true);
  };

  const currentRound = simState ? simState.currentRound : 0;
  const maxRecordedRound = engine ? engine.getMaxRecordedRound() : 0;

  const workspaceNames: Record<WorkspaceDestination, string> = {
    mission: 'MISSION CONTROL',
    live: 'LIVE STREAM INGESTION',
    replay: 'TEMPORAL REPLAY ENGINE',
    compare: 'COUNTERFACTUAL OPTIMIZER',
    reports: 'REPORT CENTER & VAULT',
    settings: 'SYSTEM CONFIGURATION',
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#09090B] text-[#FAFAFA] font-sans select-none antialiased">
      {/* 1. Left Expandable Sidebar (72px -> 240px) */}
      <Sidebar
        currentWorkspace={currentWorkspace}
        onSelectWorkspace={(dest) => {
          if (dest === 'settings') {
            setIsSettingsOpen(true);
          } else {
            if (dest === 'compare' && !counterfactualResult) {
              onComputeComparison();
            }
            setCurrentWorkspace(dest);
          }
        }}
        isStreaming={true}
        activeAlertsCount={simState && simState.currentRound > 5 ? 1 : 0}
      />

      {/* 2. Main Workstation Center Frame */}
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Command Bar (56px) */}
        <CommandBar
          currentWorkspaceName={workspaceNames[currentWorkspace]}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenAlerts={() => setCurrentWorkspace('mission')}
          onOpenValidation={onRunValidation}
          onRunDiscovery={onRunDiscovery}
          isDiscovering={isDiscovering}
          activeAlertsCount={simState && simState.currentRound > 5 ? 1 : 0}
          redditActive={true}
          rssActive={true}
          blueskyActive={false}
          commentsPerSec={3}
        />

        {/* Workspace Canvas & Content Area (Flex-1, 100vh bound) */}
        <main className="flex-1 min-h-0 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {currentWorkspace === 'mission' && (
              <motion.div
                key="workspace-mission"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="h-full w-full"
              >
                <MissionControlWorkspace
                  onNavigateToReplay={() => setCurrentWorkspace('replay')}
                  onNavigateToCompare={() => {
                    onComputeComparison();
                    setCurrentWorkspace('compare');
                  }}
                  onNavigateToExport={() => setCurrentWorkspace('reports')}
                  onOpenAlertExplanation={handleOpenAlertExplanation}
                  onDeployInoculation={() => {
                    onComputeComparison();
                    setCurrentWorkspace('compare');
                  }}
                  onInjectDebunk={onInjectDebunk}
                  isStreaming={true}
                />
              </motion.div>
            )}

            {currentWorkspace === 'live' && (
              <motion.div
                key="workspace-live"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="h-full w-full"
              >
                <LiveWorkspace
                  isStreaming={true}
                  onToggleStreaming={onTogglePlay}
                />
              </motion.div>
            )}

            {currentWorkspace === 'replay' && (
              <motion.div
                key="workspace-replay"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="h-full w-full"
              >
                <ReplayWorkspace
                  simState={simState}
                  society={activeSociety}
                  currentRound={currentRound}
                  maxRecordedRound={maxRecordedRound}
                  onScrubToRound={onScrubToRound}
                  onLaunchCounterfactual={() => {
                    onComputeComparison();
                    setCurrentWorkspace('compare');
                  }}
                  isPlaying={isPlaying}
                  onTogglePlay={onTogglePlay}
                />
              </motion.div>
            )}

            {currentWorkspace === 'compare' && (
              <motion.div
                key="workspace-compare"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="h-full w-full"
              >
                <CompareWorkspace
                  comparisonResult={counterfactualResult}
                  currentRound={currentRound}
                  onRunComparison={onComputeComparison}
                  onApplyBranch={(bId) => {
                    onApplyCounterfactualBranch(bId);
                    setCurrentWorkspace('mission');
                  }}
                  onNavigateToMission={() => setCurrentWorkspace('mission')}
                />
              </motion.div>
            )}

            {currentWorkspace === 'reports' && (
              <motion.div
                key="workspace-reports"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="h-full w-full"
              >
                <ReportCenterWorkspace
                  society={activeSociety}
                  simState={simState}
                  telemetryHistory={simState ? simState.telemetryHistory : []}
                  discoveryReport={discoveryReport}
                  onNotify={(n) => emitNotification({ ...n, autoClose: 4000 })}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom Operations Dock (56px) */}
        <OperationsDock
          isPlaying={isPlaying}
          onTogglePlay={onTogglePlay}
          onStepForward={onStepForward}
          onReset={onReset}
          currentRound={currentRound}
          maxRecordedRound={maxRecordedRound}
          onScrubToRound={onScrubToRound}
          simSpeedMs={simSpeedMs}
          onSimSpeedChange={onSimSpeedChange}
          onOpenDatasets={() => setIsDatasetModalOpen(true)}
          onOpenCompare={() => {
            onComputeComparison();
            setCurrentWorkspace('compare');
          }}
          onInjectDebunk={onInjectDebunk}
          canInjectDebunk={Boolean(simState && simState.status === 'running')}
        />
      </div>

      {/* ── Global Modals & Dialogs ── */}
      {/* 1. Command Palette */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(dest) => {
          if (dest === 'settings') {
            setIsSettingsOpen(true);
          } else {
            if (dest === 'compare' && !counterfactualResult) onComputeComparison();
            setCurrentWorkspace(dest);
          }
        }}
        onTogglePlay={onTogglePlay}
        isPlaying={isPlaying}
        onStepForward={onStepForward}
        onReset={onReset}
        onOpenDatasets={() => setIsDatasetModalOpen(true)}
        onRunDiscovery={onRunDiscovery}
        onRunValidation={onRunValidation}
        onInjectDebunk={onInjectDebunk}
      />

      {/* 2. System Settings */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        trustBias={trustBias}
        onTrustBiasChange={onTrustBiasChange}
        conformityBias={conformityBias}
        onConformityBiasChange={onConformityBiasChange}
        riskToleranceBias={riskToleranceBias}
        onRiskToleranceBiasChange={onRiskToleranceBiasChange}
        onRunValidation={onRunValidation}
        liveDynamicDecay={liveDynamicDecay}
        onToggleDynamicDecay={onToggleDynamicDecay}
      />

      {/* 3. Invariant Validation Modal */}
      {validationReport && (
        <ValidationModal
          report={validationReport}
          onClose={onCloseValidation}
        />
      )}

      {/* 4. Empirical Datasets Modal */}
      <RealDatasetModal
        isOpen={isDatasetModalOpen}
        onClose={() => setIsDatasetModalOpen(false)}
        onDatasetLoaded={onDatasetLoaded}
      />

      {/* 5. Causal Explainability Modal */}
      <ExplainabilityModal
        isOpen={isExplainabilityOpen}
        onClose={() => setIsExplainabilityOpen(false)}
        explanation={activeAlertExplanation}
      />

      {/* 6. Notifications */}
      <NotificationCenter />
    </div>
  );
};
