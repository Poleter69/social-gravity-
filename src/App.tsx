/**
 * Social Gravity — Project Eclipse
 * Flagship Intelligence Workstation: "If Apple designed Palantir Foundry"
 * 
 * Master App container wiring 100% untouched simulation engines,
 * replay, live ingestion, and counterfactuals into the EclipseAppShell.
 */

import React, { useState, useEffect } from 'react';
import { EclipseAppShell } from './ui/eclipse';
import { societyGenerator } from './society/generators/societyGenerator';
import { SocietyArchetype } from './society/types/community';
import { Society } from './society/types/society';
import { SocietyValidator, ValidationReport } from './society/validation/societyValidator';
import { RumorEngine } from './simulation/rumorEngine';
import { SimulationState } from './simulation/types';
import { InformationSignal } from './psychology/types';
import { WikipediaHoaxAdapter } from './datasets/adapters/wikipediaHoaxAdapter';
import { WIKIPEDIA_HOAX_FIXTURES } from './datasets/fixtures/wikipediaHoaxFixture';
import { WikipediaHoaxRecord } from './datasets/types';
import { LoadedDatasetResult } from './datasets/realDatasetService';
import { CounterfactualEngine, CounterfactualComparisonResult } from './simulation/counterfactualEngine';
import { TickEngine } from './graph/engine/tickEngine';
import { DiscoveryEngine, DiscoveryReport } from './discovery';
import { emitNotification } from './ui/NotificationCenter';

export const App: React.FC = () => {
  // Synthesis parameters
  const [archetype, setArchetype] = useState<SocietyArchetype>('school');
  const [population, setPopulation] = useState<number>(100);
  const [influencerRatio, setInfluencerRatio] = useState<number>(0.05);
  const [trustBias, setTrustBias] = useState<number>(0.55);
  const [conformityBias, setConformityBias] = useState<number>(0.65);
  const [riskToleranceBias, setRiskToleranceBias] = useState<number>(0.50);

  // Ingestion & dynamic decay
  const [v2LoadedData, setV2LoadedData] = useState<LoadedDatasetResult | null>(null);
  const [liveDynamicDecay, setLiveDynamicDecay] = useState<boolean>(true);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);

  // Counterfactual & Discovery
  const [counterfactualResult, setCounterfactualResult] = useState<CounterfactualComparisonResult | null>(null);
  const [discoveryReport, setDiscoveryReport] = useState<DiscoveryReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Active synthesized or ingested society
  const [activeSociety, setActiveSociety] = useState<Society>(() => {
    return societyGenerator.generate({
      name: 'Initial Research Environment',
      archetype: 'school',
      populationSize: 100,
      influencerRatio: 0.05,
      seed: 42,
    });
  });

  // Simulation state
  const [engine, setEngine] = useState<RumorEngine | null>(null);
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simSpeedMs, setSimSpeedMs] = useState<number>(600);
  const [selectedHoax, setSelectedHoax] = useState<WikipediaHoaxRecord>(WIKIPEDIA_HOAX_FIXTURES[0]);
  const [seedStrategy, setSeedStrategy] = useState<'influencer' | 'bridge' | 'selected'>('influencer');

  // Society Generation
  const handleGenerate = (
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
  };

  // Real Dataset Loaded
  const handleDatasetLoaded = (result: LoadedDatasetResult) => {
    setActiveSociety(result.society);
    setV2LoadedData(result);
    handleResetSimulation();
    emitNotification({
      title: 'Dataset Ingested',
      message: `Successfully loaded ${result.society.name} with ${result.society.agents.length} nodes.`,
      type: 'success',
      autoClose: 4000,
    });
  };

  // Simulation Start & Stepping
  const handleStartSimulation = () => {
    const newEngine = new RumorEngine(activeSociety, {
      maxRounds: 40,
      transmissionDelayMin: 1,
      transmissionDelayMax: 2,
      stochasticTransmission: true,
      enableHomeostasis: true,
    });

    let seedIds: string[] = [];
    if (seedStrategy === 'bridge') {
      const bridge = activeSociety.agents.find((a) => a.isBridge);
      seedIds = [bridge ? bridge.id : activeSociety.agents[0].id];
    } else {
      const influencer = [...activeSociety.agents].sort((a, b) => b.traits.influence - a.traits.influence)[0];
      seedIds = [influencer ? influencer.id : activeSociety.agents[0].id];
    }

    const rumorSignal: InformationSignal = WikipediaHoaxAdapter.toSignal(
      selectedHoax,
      seedIds[0],
      0
    );

    const initial = newEngine.start(rumorSignal, seedIds);

    newEngine.onTransmission = (sourceId, targetId) => {
      if (v2LoadedData?.dynamicGraph) {
        try {
          v2LoadedData.dynamicGraph.recordInteraction(sourceId, targetId);
        } catch {
          // ignore
        }
      }
    };

    newEngine.onRoundStep = () => {
      if (v2LoadedData?.dynamicGraph && liveDynamicDecay) {
        try {
          const tickEngine = new TickEngine(v2LoadedData.dynamicGraph);
          tickEngine.tick();
          const freshMetrics = v2LoadedData.dynamicGraph.getMetrics();
          setV2LoadedData((prev) => (prev ? { ...prev, v2Metrics: freshMetrics } : null));
        } catch {
          // ignore
        }
      }
    };

    setEngine(newEngine);
    setSimState({ ...initial });
    setIsPlaying(false);
  };

  const handleTogglePlay = () => {
    if (!engine || !simState || simState.status === 'completed' || simState.status === 'idle') {
      handleStartSimulation();
      setIsPlaying(true);
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepSimulation = () => {
    if (!engine || !simState || simState.status === 'completed' || simState.status === 'idle') {
      handleStartSimulation();
      return;
    }
    const next = engine.step();
    setSimState({ ...next });
  };

  const handleResetSimulation = () => {
    if (engine) {
      engine.reset();
    }
    setEngine(null);
    setSimState(null);
    setIsPlaying(false);
    setDiscoveryReport(null);
  };

  // Replay Time-Travel Scrubber
  const handleScrubToRound = (round: number) => {
    if (!engine) return;
    try {
      if (engine.hasSnapshot(round)) {
        const next = engine.goToRound(round);
        setSimState({ ...next });
      }
    } catch (e) {
      console.error('Failed to scrub to round:', e);
    }
  };

  // Counterfactual Computation
  const handleComputeComparison = () => {
    if (!engine || !simState) {
      handleStartSimulation();
    }
    const targetEngine = engine || new RumorEngine(activeSociety, { maxRounds: 40 });
    if (!engine) {
      const rumorSignal = WikipediaHoaxAdapter.toSignal(selectedHoax, activeSociety.agents[0].id, 0);
      targetEngine.start(rumorSignal, [activeSociety.agents[0].id]);
      setEngine(targetEngine);
    }
    const result = CounterfactualEngine.runStandardComparison(targetEngine, 8);
    setCounterfactualResult(result);
  };

  const handleApplyCounterfactualBranch = (branchId: string) => {
    if (!engine || !simState) return;

    if (branchId === 'bridge_inoculation') {
      const bridgeCandidates = activeSociety.agents
        .filter((a) => a.isBridge && simState.agentStates.get(a.id) !== 'BELIEVER')
        .map((a) => a.id);
      const targets = bridgeCandidates.slice(0, 3);
      const debunkSignal = WikipediaHoaxAdapter.createDebunkingSignal(
        selectedHoax,
        'bridge_inoculator',
        simState.currentRound
      );
      const next = engine.injectDebunking(debunkSignal, targets);
      setSimState({ ...next });
      emitNotification({
        title: 'Bridge Strategy Applied',
        message: `Inoculated ${targets.length} critical network bridges.`,
        type: 'success',
      });
    } else if (branchId === 'influencer_containment') {
      const influencerCandidates = [...activeSociety.agents]
        .filter((a) => a.isInfluencer && simState.agentStates.get(a.id) !== 'BELIEVER')
        .sort((a, b) => b.traits.influence - a.traits.influence)
        .slice(0, 3)
        .map((a) => a.id);
      const debunkSignal = WikipediaHoaxAdapter.createDebunkingSignal(
        selectedHoax,
        'influencer_inoculator',
        simState.currentRound
      );
      const next = engine.injectDebunking(debunkSignal, influencerCandidates);
      setSimState({ ...next });
      emitNotification({
        title: 'Influencer Strategy Applied',
        message: `Deployed high-salience debunk to ${influencerCandidates.length} influencers.`,
        type: 'success',
      });
    }
  };

  // Inject Debunking Signal
  const handleInjectDebunk = () => {
    if (!engine || !simState) return;
    const debunkSignal = WikipediaHoaxAdapter.createDebunkingSignal(
      selectedHoax,
      'fact_checker_authority',
      simState.currentRound
    );
    const next = engine.injectDebunking(debunkSignal);
    setSimState({ ...next });
    emitNotification({
      title: 'Fact-Check Injected',
      message: 'Broadcasting counter-narrative signal to active network.',
      type: 'success',
    });
  };

  // Run AI Discovery
  const handleRunDiscovery = async (preferOllama: boolean = true) => {
    setIsAnalyzing(true);
    try {
      const defaultSimState: SimulationState = simState || {
        status: 'idle',
        currentRound: 0,
        activeRumor: null,
        activeDebunk: null,
        patientZeroIds: [],
        agentStates: new Map(),
        infectionParents: new Map(),
        telemetryHistory: [],
        recentTransmissions: [],
      };
      const report = await DiscoveryEngine.analyze(activeSociety, defaultSimState, { preferOllama });
      setDiscoveryReport(report);
      emitNotification({
        title: 'AI Discovery Complete',
        message: `Generated ${report.hypothesisCards.length} systemic insights & recommendations.`,
        type: 'info',
      });
    } catch (err) {
      console.error('Discovery Engine analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Invariant Audit
  const handleRunValidation = () => {
    const report = SocietyValidator.validate(activeSociety);
    setValidationReport(report);
  };

  // Playback timer interval
  useEffect(() => {
    if (!isPlaying || !engine) return;

    const interval = setInterval(() => {
      const next = engine.step();
      setSimState({ ...next });
      if (next.status === 'completed') {
        setIsPlaying(false);
      }
    }, simSpeedMs);

    return () => clearInterval(interval);
  }, [isPlaying, engine, simSpeedMs]);

  return (
    <EclipseAppShell
      activeSociety={activeSociety}
      simState={simState}
      engine={engine}
      isPlaying={isPlaying}
      simSpeedMs={simSpeedMs}
      onTogglePlay={handleTogglePlay}
      onStepForward={handleStepSimulation}
      onReset={handleResetSimulation}
      onScrubToRound={handleScrubToRound}
      onSimSpeedChange={setSimSpeedMs}
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
      onToggleDynamicDecay={() => setLiveDynamicDecay(!liveDynamicDecay)}
      onResynthesize={handleGenerate}
      onSelectHoax={setSelectedHoax}
      onSelectSeedStrategy={setSeedStrategy}
    />
  );
};
export default App;
