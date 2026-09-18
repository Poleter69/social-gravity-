/**
 * Social Gravity — Project Eclipse + M22 Playback Refactor
 * Flagship Intelligence Workstation: "If Apple designed Palantir Foundry"
 *
 * M22 Fix: All playback now flows through PlaybackController state machine.
 * The round counter is ALWAYS sourced from engine.getState().currentRound.
 * No separate UI round counter. No boolean isPlaying flag driving setInterval.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EclipseAppShell } from './ui/eclipse';
import { ProtectedRoute, SessionLoader } from './auth/ProtectedRoute';
import { LoginPage } from './auth/LoginPage';
import { useAuth } from './auth/authContext';
import { NavigationProvider, useNavigation } from './navigation';
import { societyGenerator } from './society/generators/societyGenerator';
import { SocietyArchetype } from './society/types/community';
import { Society } from './society/types/society';
import { SocietyValidator, ValidationReport } from './society/validation/societyValidator';
import { RumorEngine } from './simulation/rumorEngine';
import { SimulationState } from './simulation/types';
import { WikipediaHoaxAdapter } from './datasets/adapters/wikipediaHoaxAdapter';
import { WIKIPEDIA_HOAX_FIXTURES } from './datasets/fixtures/wikipediaHoaxFixture';
import { WikipediaHoaxRecord } from './datasets/types';
import { LoadedDatasetResult } from './datasets/realDatasetService';
import { CounterfactualEngine, CounterfactualComparisonResult } from './simulation/counterfactualEngine';
import { TickEngine } from './graph/engine/tickEngine';
import { DiscoveryEngine, DiscoveryReport } from './discovery';
import { emitNotification } from './ui/NotificationCenter';
import { PlaybackController, PlaybackState, PlaybackSpeed } from './simulation/playbackController';
import { InformationSignal } from './psychology/types';
import { OnboardingProvider, useOnboarding, LandingPage } from './onboarding';

export const App: React.FC = () => {
  // ─── Society Synthesis Parameters ───────────────────────────────────────────
  const [archetype, setArchetype] = useState<SocietyArchetype>('school');
  const [population, setPopulation] = useState<number>(100);
  const [influencerRatio, setInfluencerRatio] = useState<number>(0.05);
  const [trustBias, setTrustBias] = useState<number>(0.55);
  const [conformityBias, setConformityBias] = useState<number>(0.65);
  const [riskToleranceBias, setRiskToleranceBias] = useState<number>(0.50);

  // ─── Dataset & Society ───────────────────────────────────────────────────────
  const [v2LoadedData, setV2LoadedData] = useState<LoadedDatasetResult | null>(null);
  const [liveDynamicDecay, setLiveDynamicDecay] = useState<boolean>(true);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [activeSociety, setActiveSociety] = useState<Society>(() =>
    societyGenerator.generate({
      name: 'Initial Research Environment',
      archetype: 'school',
      populationSize: 100,
      influencerRatio: 0.05,
      seed: 42,
    })
  );

  // ─── Hoax & Strategy ─────────────────────────────────────────────────────────
  const [selectedHoax, setSelectedHoax] = useState<WikipediaHoaxRecord>(WIKIPEDIA_HOAX_FIXTURES[0]);
  const [seedStrategy, setSeedStrategy] = useState<'influencer' | 'bridge' | 'selected'>('influencer');

  // ─── M22: PlaybackController (single authority for play/pause/loop) ──────────
  // Stable ref — never recreated on render. The controller owns the setInterval.
  const controllerRef = useRef<PlaybackController>(
    new PlaybackController({ baseIntervalMs: 600, maxRounds: 40 })
  );

  // The engine lives in a ref so the controller's setInterval closure always
  // reads the latest engine without re-subscribing on every render.
  const engineRef = useRef<RumorEngine | null>(null);

  // ─── React-visible state (sourced from PlaybackController) ───────────────────
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [maxRecordedRound, setMaxRecordedRound] = useState<number>(0);
  const [lastTickMs, setLastTickMs] = useState<number>(0);
  const [isLoopActive, setIsLoopActive] = useState<boolean>(false);
  const [simSpeedMs, setSimSpeedMs] = useState<number>(600);

  // ─── Counterfactual & Discovery ───────────────────────────────────────────────
  const [counterfactualResult, setCounterfactualResult] = useState<CounterfactualComparisonResult | null>(null);
  const [discoveryReport, setDiscoveryReport] = useState<DiscoveryReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // ─── Subscribe to PlaybackController on mount ────────────────────────────────
  useEffect(() => {
    const controller = controllerRef.current;
    const unsubscribe = controller.subscribe((newSimState, status) => {
      // Round counter sourced from engine — never maintained separately
      setSimState({ ...newSimState });
      setPlaybackState(status.state);
      setMaxRecordedRound(status.maxRecordedRound);
      setLastTickMs(status.lastTickMs);
      setIsLoopActive(status.isLoopActive);
    });

    return () => {
      unsubscribe();
      controller.destroy();
    };
  }, []);

  // ─── Derived state from PlaybackController ────────────────────────────────────
  const isPlaying = playbackState === 'playing';
  const engine = engineRef.current;

  // ─── Build & start a new simulation ──────────────────────────────────────────
  const handleStartSimulation = useCallback((andPlay = false) => {
    const controller = controllerRef.current;

    // Resolve seed agents
    let seedIds: string[] = [];
    if (seedStrategy === 'bridge') {
      const bridge = activeSociety.agents.find(a => a.isBridge);
      seedIds = [bridge ? bridge.id : activeSociety.agents[0].id];
    } else {
      const influencer = [...activeSociety.agents].sort((a, b) => b.traits.influence - a.traits.influence)[0];
      seedIds = [influencer ? influencer.id : activeSociety.agents[0].id];
    }

    const rumorSignal: InformationSignal = WikipediaHoaxAdapter.toSignal(selectedHoax, seedIds[0], 0);

    const newEngine = new RumorEngine(activeSociety, {
      maxRounds: 40,
      transmissionDelayMin: 1,
      transmissionDelayMax: 2,
      stochasticTransmission: true,
      enableHomeostasis: true,
    });

    // Wire side-effect callbacks
    newEngine.onTransmission = (sourceId, targetId) => {
      if (v2LoadedData?.dynamicGraph) {
        try { v2LoadedData.dynamicGraph.recordInteraction(sourceId, targetId); } catch { }
      }
    };

    newEngine.onRoundStep = () => {
      if (v2LoadedData?.dynamicGraph && liveDynamicDecay) {
        try {
          const tickEngine = new TickEngine(v2LoadedData.dynamicGraph);
          tickEngine.tick();
          const freshMetrics = v2LoadedData.dynamicGraph.getMetrics();
          setV2LoadedData(prev => (prev ? { ...prev, v2Metrics: freshMetrics } : null));
        } catch { }
      }
    };

    const initial = newEngine.start(rumorSignal, seedIds);
    engineRef.current = newEngine;

    // Bind to controller — this cancels any existing loop first
    controller.bindEngine(newEngine);

    // Sync initial state to React
    setSimState({ ...initial });
    setPlaybackState('idle');

    // If called from togglePlay, immediately start
    if (andPlay) {
      controller.play();
    }
  }, [activeSociety, selectedHoax, seedStrategy, v2LoadedData, liveDynamicDecay]);

  // ─── Playback Controls (delegates entirely to PlaybackController) ─────────────
  const handleTogglePlay = useCallback(() => {
    const controller = controllerRef.current;
    const eng = engineRef.current;
    const state = eng?.getState();

    if (!eng || !state || state.status === 'idle') {
      // First play: build simulation and start
      handleStartSimulation(true);
      return;
    }

    // Running, paused, or completed: delegate to state machine
    controller.toggle();
  }, [handleStartSimulation]);

  const handleStepSimulation = useCallback(() => {
    const controller = controllerRef.current;
    const eng = engineRef.current;
    const state = eng?.getState();

    if (!eng || !state || state.status === 'idle') {
      handleStartSimulation(false);
      return;
    }

    const next = controller.step();
    if (next) setSimState({ ...next });
  }, [handleStartSimulation]);

  const handleRestartSimulation = useCallback(() => {
    const controller = controllerRef.current;
    const next = controller.restart();
    if (next) setSimState({ ...next });
  }, []);

  const handleResetSimulation = useCallback(() => {
    const controller = controllerRef.current;
    const eng = engineRef.current;
    if (eng) {
      try { eng.reset(); } catch { }
    }
    controller.reset();
    engineRef.current = null;
    setSimState(null);
    setPlaybackState('idle');
    setMaxRecordedRound(0);
    setDiscoveryReport(null);
  }, []);

  // ─── Scrubber — reads snapshot from engine, pauses loop ──────────────────────
  const handleScrubToRound = useCallback((round: number) => {
    const controller = controllerRef.current;
    const eng = engineRef.current;
    if (!eng) return;

    try {
      if (eng.hasSnapshot(round)) {
        const next = controller.scrubToRound(round);
        if (next) setSimState({ ...next });
      }
    } catch (e) {
      console.error('[App] scrubToRound failed:', e);
    }
  }, []);

  // ─── Speed Control ────────────────────────────────────────────────────────────
  const handleSimSpeedChange = useCallback((speedMs: number) => {
    setSimSpeedMs(speedMs);
    // Map ms → PlaybackSpeed multiplier (base is 600ms)
    const BASE = 600;
    const multiplier = (BASE / speedMs) as PlaybackSpeed;
    // Clamp to valid values
    const validSpeeds: PlaybackSpeed[] = [0.5, 1, 2, 4, 8];
    const closest = validSpeeds.reduce((prev, curr) =>
      Math.abs(curr - multiplier) < Math.abs(prev - multiplier) ? curr : prev
    );
    controllerRef.current.setSpeed(closest);
  }, []);

  // ─── Society Generation ───────────────────────────────────────────────────────
  const handleGenerate = useCallback((
    newArchetype = archetype,
    newPopulation = population,
    newRatio = influencerRatio
  ) => {
    setArchetype(newArchetype);
    setPopulation(newPopulation);
    setInfluencerRatio(newRatio);
    const generated = societyGenerator.generate({
      name: `${newArchetype.toUpperCase()} Research Synthesis`,
      archetype: newArchetype,
      populationSize: newPopulation,
      influencerRatio: newRatio,
      baselineTrust: trustBias,
      baselineConformity: conformityBias,
      baselineRiskTolerance: riskToleranceBias,
      seed: Math.floor(Math.random() * 1000000),
    });
    setActiveSociety(generated);
    setV2LoadedData(null);
    handleResetSimulation();
  }, [archetype, population, influencerRatio, trustBias, conformityBias, riskToleranceBias, handleResetSimulation]);

  // ─── Dataset Loading ──────────────────────────────────────────────────────────
  const handleDatasetLoaded = useCallback((result: LoadedDatasetResult) => {
    setActiveSociety(result.society);
    setV2LoadedData(result);
    handleResetSimulation();
    emitNotification({
      title: 'Dataset Ingested',
      message: `Successfully loaded ${result.society.name} with ${result.society.agents.length} nodes.`,
      type: 'success',
      autoClose: 4000,
    });
  }, [handleResetSimulation]);

  // ─── Counterfactual Computation ───────────────────────────────────────────────
  const handleComputeComparison = useCallback(() => {
    const eng = engineRef.current;
    if (!eng || !simState) {
      handleStartSimulation(false);
    }
    const targetEngine = eng || new RumorEngine(activeSociety, { maxRounds: 40 });
    if (!eng) {
      const rumorSignal = WikipediaHoaxAdapter.toSignal(selectedHoax, activeSociety.agents[0].id, 0);
      targetEngine.start(rumorSignal, [activeSociety.agents[0].id]);
      engineRef.current = targetEngine;
    }
    const result = CounterfactualEngine.runStandardComparison(targetEngine, 8);
    setCounterfactualResult(result);
  }, [simState, activeSociety, selectedHoax, handleStartSimulation]);

  const handleApplyCounterfactualBranch = useCallback((branchId: string) => {
    const eng = engineRef.current;
    if (!eng || !simState) return;

    if (branchId === 'bridge_inoculation') {
      const bridgeCandidates = activeSociety.agents
        .filter(a => a.isBridge && simState.agentStates.get(a.id) !== 'BELIEVER')
        .map(a => a.id);
      const targets = bridgeCandidates.slice(0, 3);
      const debunkSignal = WikipediaHoaxAdapter.createDebunkingSignal(selectedHoax, 'bridge_inoculator', simState.currentRound);
      const next = eng.injectDebunking(debunkSignal, targets);
      setSimState({ ...next });
      emitNotification({ title: 'Bridge Strategy Applied', message: `Inoculated ${targets.length} critical network bridges.`, type: 'success' });
    } else if (branchId === 'influencer_containment') {
      const influencerCandidates = [...activeSociety.agents]
        .filter(a => a.isInfluencer && simState.agentStates.get(a.id) !== 'BELIEVER')
        .sort((a, b) => b.traits.influence - a.traits.influence)
        .slice(0, 3)
        .map(a => a.id);
      const debunkSignal = WikipediaHoaxAdapter.createDebunkingSignal(selectedHoax, 'influencer_inoculator', simState.currentRound);
      const next = eng.injectDebunking(debunkSignal, influencerCandidates);
      setSimState({ ...next });
      emitNotification({ title: 'Influencer Strategy Applied', message: `Deployed high-salience debunk to ${influencerCandidates.length} influencers.`, type: 'success' });
    }
  }, [simState, activeSociety, selectedHoax]);

  // ─── Inject Debunking Signal ──────────────────────────────────────────────────
  const handleInjectDebunk = useCallback(() => {
    const eng = engineRef.current;
    if (!eng || !simState) return;
    const debunkSignal = WikipediaHoaxAdapter.createDebunkingSignal(selectedHoax, 'fact_checker_authority', simState.currentRound);
    const next = eng.injectDebunking(debunkSignal);
    setSimState({ ...next });
    emitNotification({ title: 'Fact-Check Injected', message: 'Broadcasting counter-narrative signal to active network.', type: 'success' });
  }, [simState, selectedHoax]);

  // ─── AI Discovery ─────────────────────────────────────────────────────────────
  const handleRunDiscovery = async (preferOllama = true) => {
    setIsAnalyzing(true);
    try {
      const defaultSimState: SimulationState = simState || {
        status: 'idle', currentRound: 0, activeRumor: null, activeDebunk: null,
        patientZeroIds: [], agentStates: new Map(), infectionParents: new Map(),
        telemetryHistory: [], recentTransmissions: [],
      };
      const report = await DiscoveryEngine.analyze(activeSociety, defaultSimState, { preferOllama });
      setDiscoveryReport(report);
      emitNotification({ title: 'AI Discovery Complete', message: `Generated ${report.hypothesisCards.length} systemic insights & recommendations.`, type: 'info' });
    } catch (err) {
      console.error('Discovery Engine analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── Invariant Audit ──────────────────────────────────────────────────────────
  const handleRunValidation = () => {
    const report = SocietyValidator.validate(activeSociety);
    setValidationReport(report);
  };

  // ─── Keyboard Shortcuts (delegated to PlaybackController) ────────────────────
  // No keyboard handler here — EclipseAppShell owns shortcuts.
  // onTogglePlay → handleTogglePlay → PlaybackController.toggle()

  return (
    <NavigationProvider>
      <OnboardingProvider>
        <AppFlow
          activeSociety={activeSociety}
          simState={simState}
          engine={engine}
          isPlaying={isPlaying}
          simSpeedMs={simSpeedMs}
          onTogglePlay={handleTogglePlay}
          onStepForward={handleStepSimulation}
          onRestart={handleRestartSimulation}
          onReset={handleResetSimulation}
          onScrubToRound={handleScrubToRound}
          onSimSpeedChange={handleSimSpeedChange}
          playbackState={playbackState}
          lastTickMs={lastTickMs}
          isLoopActive={isLoopActive}
          maxRecordedRound={maxRecordedRound}
          onDatasetLoaded={handleDatasetLoaded}
          onRunValidation={handleRunValidation}
          validationReport={validationReport}
          onCloseValidation={() => setValidationReport(null)}
          counterfactualResult={counterfactualResult}
          onComputeComparison={handleComputeComparison}
          onApplyCounterfactualBranch={handleApplyCounterfactualBranch}
          onInjectDebunk={handleInjectDebunk}
          discoveryReport={discoveryReport}
          onRunDiscovery={handleRunDiscovery}
          isDiscovering={isAnalyzing}
          trustBias={trustBias}
          onTrustBiasChange={setTrustBias}
          conformityBias={conformityBias}
          onConformityBiasChange={setConformityBias}
          riskToleranceBias={riskToleranceBias}
          onRiskToleranceBiasChange={setRiskToleranceBias}
          liveDynamicDecay={liveDynamicDecay}
          onToggleDynamicDecay={() => setLiveDynamicDecay(d => !d)}
          onResynthesize={handleGenerate}
          onSelectHoax={setSelectedHoax}
          onSelectSeedStrategy={setSeedStrategy}
        />
      </OnboardingProvider>
    </NavigationProvider>
  );
};

const AppFlow: React.FC<React.ComponentProps<typeof EclipseAppShell>> = (props) => {
  const { route, toDashboard, toLogin, toLanding } = useNavigation();
  const { isAuthenticated, isLoading } = useAuth();
  const { skipLandingNextTime, completeLanding } = useOnboarding();

  // If user previously marked "Skip this page next time" and is already authenticated on initial visit:
  useEffect(() => {
    if (!isLoading && isAuthenticated && skipLandingNextTime && route === 'landing') {
      toDashboard();
    }
  }, [isLoading, isAuthenticated, skipLandingNextTime, route, toDashboard]);

  // Protected route enforcement: if accessing /dashboard unauthenticated, redirect to /login
  useEffect(() => {
    if (!isLoading && !isAuthenticated && route === 'dashboard') {
      toLogin();
    }
  }, [isLoading, isAuthenticated, route, toLogin]);

  // If user visits /login while already authenticated, redirect to /dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && route === 'login') {
      toDashboard();
    }
  }, [isLoading, isAuthenticated, route, toDashboard]);

  if (isLoading) {
    return <SessionLoader />;
  }

  // 1. Landing Page ("About Project") — Default initial route (/)
  if (route === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => {
          if (isAuthenticated) {
            toDashboard();
          } else {
            toLogin();
          }
        }}
        onLaunch={() => {
          completeLanding();
          if (isAuthenticated) {
            toDashboard();
          } else {
            toLogin();
          }
        }}
        onLogin={toLogin}
      />
    );
  }

  // 2. Login Page (/login)
  if (route === 'login') {
    return (
      <LoginPage
        onSuccess={() => {
          completeLanding();
          toDashboard();
        }}
        onBackToLanding={toLanding}
      />
    );
  }

  // 3. Main App / Dashboard (/dashboard) — Protected Workstation
  return (
    <ProtectedRoute
      fallback={
        <LoginPage
          onSuccess={() => {
            completeLanding();
            toDashboard();
          }}
          onBackToLanding={toLanding}
        />
      }
      onRedirect={toLogin}
    >
      <EclipseAppShell
        {...props}
        onReopenLanding={toLanding}
      />
    </ProtectedRoute>
  );
};

export default App;
