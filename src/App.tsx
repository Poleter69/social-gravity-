/**
 * Social Gravity - Computational Social Psychology Laboratory UI
 * 
 * Redesigned for v2.0.0-beta Product Design Sprint:
 * 5-Stage Guided Workflow: Import -> Analyze -> Replay -> Compare -> Export
 * Palantir Foundry × Arc Browser × Notion aesthetic.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  Network, 
  Search, 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  ShieldAlert, 
  Database, 
  Sparkles, 
  GitFork, 
  History, 
  FolderHeart, 
  Download, 
  Users, 
  Layers 
} from 'lucide-react';
import { 
  DiscoveryEngine, 
  DiscoveryReport, 
  DiscoveryDashboard, 
  AnalystReplayDashboard, 
  EmotionalIntelligenceDashboard 
} from './discovery';
import { ExportModal } from './exports/components/ExportModal';
import { ScenarioModal } from './scenarios/components/ScenarioModal';
import { Scenario } from './scenarios/types';
import { ExplainabilityModal } from './explainability/components/ExplainabilityModal';
import { alertExplainer, AlertExplanation } from './explainability';
import { 
  WorkflowBar, 
  WorkflowStage, 
  HeroSection, 
  GuidedTour, 
  MetricCard, 
  AdvancedAnalysisDrawer, 
  CompareStrategiesView, 
  ReportCenterView, 
  ImportView, 
  CommandPalette, 
  PaletteCommand, 
  NotificationCenter, 
  emitNotification, 
  useKeyboardShortcuts 
} from './ui';
import { societyGenerator } from './society/generators/societyGenerator';
import { SocietyArchetype, Community } from './society/types/community';
import { Society } from './society/types/society';
import { Agent } from './society/types/agent';
import { SocietyValidator, ValidationReport } from './society/validation/societyValidator';
import { NetworkCanvas } from './society/components/NetworkCanvas';
import { AgentInspector } from './society/components/AgentInspector';
import { ValidationModal } from './society/components/ValidationModal';
import { RumorEngine } from './simulation/rumorEngine';
import { SimulationState, RoundTelemetry } from './simulation/types';
import { InformationSignal } from './psychology/types';
import { WikipediaHoaxAdapter } from './datasets/adapters/wikipediaHoaxAdapter';
import { WIKIPEDIA_HOAX_FIXTURES } from './datasets/fixtures/wikipediaHoaxFixture';
import { WikipediaHoaxRecord } from './datasets/types';
import { RealDatasetModal } from './datasets/components/RealDatasetModal';
import { RealDatasetService, LoadedDatasetResult } from './datasets/realDatasetService';
import { TimelineScrubber } from './simulation/components/TimelineScrubber';
import { CounterfactualModal } from './simulation/components/CounterfactualModal';
import { CounterfactualEngine, CounterfactualComparisonResult } from './simulation/counterfactualEngine';
import { TickEngine } from './graph/engine/tickEngine';

export const App: React.FC = () => {
  // Workflow Stage Navigation
  const [currentStage, setCurrentStage] = useState<WorkflowStage>('analyze');
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isHeroCollapsed, setIsHeroCollapsed] = useState<boolean>(false);

  // Sub-tabs within Analyze stage
  const [analyzeSubTab, setAnalyzeSubTab] = useState<'topology' | 'communities' | 'agents' | 'discovery' | 'json'>('topology');

  // Synthesis parameters
  const [archetype, setArchetype] = useState<SocietyArchetype>('school');
  const [population, setPopulation] = useState<number>(100);
  const [influencerRatio, setInfluencerRatio] = useState<number>(0.05);
  const [trustBias, setTrustBias] = useState<number>(0.55);
  const [conformityBias, setConformityBias] = useState<number>(0.65);
  const [riskToleranceBias, setRiskToleranceBias] = useState<number>(0.50);

  // UI state
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentSearch, setAgentSearch] = useState<string>('');
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);

  // Real Dataset Ingestion & V2 State
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState<boolean>(false);
  const [v2LoadedData, setV2LoadedData] = useState<LoadedDatasetResult | null>(null);
  const [liveDynamicDecay, setLiveDynamicDecay] = useState<boolean>(true);

  // Counterfactual & Replay State
  const [isCounterfactualOpen, setIsCounterfactualOpen] = useState<boolean>(false);
  const [counterfactualResult, setCounterfactualResult] = useState<CounterfactualComparisonResult | null>(null);
  const wasPlayingBeforeDrag = useRef<boolean>(false);

  // Phase E: Modals & Analyst Tools State
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isExplainabilityOpen, setIsExplainabilityOpen] = useState<boolean>(false);
  const [activeAlertExplanation, setActiveAlertExplanation] = useState<AlertExplanation | null>(null);

  // Discovery Engine state
  const [discoveryReport, setDiscoveryReport] = useState<DiscoveryReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Active synthesized or ingested society
  const [activeSociety, setActiveSociety] = useState<Society>(() => {
    return societyGenerator.generate({
      name: 'Initial School Environment',
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
  const handleGenerate = () => {
    const generated = societyGenerator.generate({
      name: `${archetype.toUpperCase()} Research Synthesis`,
      archetype,
      populationSize: population,
      influencerRatio,
      baselineTrust: trustBias,
      baselineConformity: conformityBias,
      baselineRiskTolerance: riskToleranceBias,
      seed: Math.floor(Math.random() * 1000000),
    });
    setActiveSociety(generated);
    setV2LoadedData(null);
    setSelectedAgent(null);
    handleResetSimulation();
  };

  // Real Dataset Loaded from V2 Ingestion Engine
  const handleDatasetLoaded = (result: LoadedDatasetResult) => {
    setActiveSociety(result.society);
    setV2LoadedData(result);
    setSelectedAgent(null);
    handleResetSimulation();
    emitNotification({
      title: 'Dataset Ingested',
      message: `Successfully loaded ${result.society.name} with ${result.society.agents.length} nodes.`,
      type: 'success',
      autoClose: 4000,
    });
  };

  // Simulation Controls
  const handleStartSimulation = () => {
    const newEngine = new RumorEngine(activeSociety, {
      maxRounds: 40,
      transmissionDelayMin: 1,
      transmissionDelayMax: 2,
      stochasticTransmission: true,
      enableHomeostasis: true,
    });

    let seedIds: string[] = [];
    if (seedStrategy === 'selected' && selectedAgent) {
      seedIds = [selectedAgent.id];
    } else if (seedStrategy === 'bridge') {
      const bridge = activeSociety.agents.find(a => a.isBridge);
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
          // ignore if missing
        }
      }
    };

    newEngine.onRoundStep = () => {
      if (v2LoadedData?.dynamicGraph && liveDynamicDecay) {
        try {
          const tickEngine = new TickEngine(v2LoadedData.dynamicGraph);
          tickEngine.tick();
          const freshMetrics = v2LoadedData.dynamicGraph.getMetrics();
          setV2LoadedData(prev => prev ? { ...prev, v2Metrics: freshMetrics } : null);
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

  // Replay & Time-Travel Handlers
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

  const handleStepBackward = () => {
    if (!engine || !simState || simState.currentRound <= 0) return;
    handleScrubToRound(simState.currentRound - 1);
  };

  const handleStepForward = () => {
    if (!engine || !simState) return;
    const nextRound = simState.currentRound + 1;
    if (engine.hasSnapshot(nextRound)) {
      handleScrubToRound(nextRound);
    } else {
      handleStepSimulation();
    }
  };

  const handleJumpToStart = () => {
    handleScrubToRound(0);
  };

  const handleJumpToEnd = () => {
    if (!engine) return;
    handleScrubToRound(engine.getMaxRecordedRound());
  };

  // Counterfactual Comparison Handlers
  const handleLaunchCounterfactual = () => {
    if (!engine || !simState) return;
    setIsPlaying(false);
    const result = CounterfactualEngine.runStandardComparison(engine, 8);
    setCounterfactualResult(result);
    setIsCounterfactualOpen(true);
  };

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
        .filter(a => a.isBridge && simState.agentStates.get(a.id) !== 'BELIEVER')
        .map(a => a.id);
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
        .filter(a => a.isInfluencer && simState.agentStates.get(a.id) !== 'BELIEVER')
        .sort((a, b) => b.traits.influence - a.traits.influence)
        .slice(0, 3)
        .map(a => a.id);
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

  // Scenario Loading
  const handleLoadScenario = (scenario: Scenario) => {
    setActiveSociety(scenario.society);
    if (scenario.rumor) {
      const eng = new RumorEngine(scenario.society, { maxRounds: 40, seed: 42 });
      eng.start(scenario.rumor, scenario.patientZeroIds);
      eng.goToRound(scenario.currentRound);
      setEngine(eng);
      setSimState(eng.getState());
    }
    setDiscoveryReport(scenario.discoveryReport);
    setIsPlaying(false);
    emitNotification({
      title: 'Scenario Loaded',
      message: `Active investigation: ${scenario.metadata.title}`,
      type: 'success',
    });
  };

  // Invariant Audit
  const handleRunValidation = () => {
    const report = SocietyValidator.validate(activeSociety);
    setValidationReport(report);
  };

  // Epidemic Threat Alert Causal Explanation
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

  // JSON Copy
  const handleCopyJSON = () => {
    const jsonStr = societyGenerator.exportJSON(activeSociety);
    navigator.clipboard.writeText(jsonStr);
    emitNotification({
      title: 'JSON Copied',
      message: 'Network topology copied to system clipboard.',
      type: 'export',
    });
  };

  // 30-Second Guided Tour Automated Handlers
  const handleTourLoadDemo = async () => {
    try {
      const res = await RealDatasetService.loadPreconfiguredDataset('reddit_tech');
      setActiveSociety(res.society);
      setV2LoadedData(res);
      handleResetSimulation();
    } catch (err) {
      console.error('Tour failed to load Reddit fixture:', err);
    }
  };

  const handleTourStartSim = () => {
    setCurrentStage('analyze');
    handleStartSimulation();
    setIsPlaying(true);
  };

  const handleTourPauseAtRound12 = () => {
    if (engine) {
      while (engine.getState().currentRound < 12 && engine.getState().status === 'running') {
        engine.step();
      }
      setSimState({ ...engine.getState() });
      setIsPlaying(false);
    }
  };

  const handleTourOpenCompare = () => {
    handleComputeComparison();
    setCurrentStage('compare');
  };

  const handleTourOpenExport = () => {
    setCurrentStage('export');
  };

  // Run Demo Helper for Hero
  const handleRunHeroDemo = () => {
    handleTourLoadDemo();
    setTimeout(() => {
      setCurrentStage('analyze');
      handleStartSimulation();
      setIsPlaying(true);
    }, 400);
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

  // Global Keyboard Shortcuts
  useKeyboardShortcuts([
    {
      key: '1',
      description: 'Navigate to Import Stage',
      action: () => setCurrentStage('import'),
    },
    {
      key: '2',
      description: 'Navigate to Analyze Stage',
      action: () => setCurrentStage('analyze'),
    },
    {
      key: '3',
      description: 'Navigate to Replay Stage',
      action: () => setCurrentStage('replay'),
    },
    {
      key: '4',
      description: 'Navigate to Compare Stage',
      action: () => {
        handleComputeComparison();
        setCurrentStage('compare');
      },
    },
    {
      key: '5',
      description: 'Navigate to Export Stage',
      action: () => setCurrentStage('export'),
    },
    {
      key: ' ',
      description: 'Play/Pause simulation',
      action: () => handleTogglePlay(),
    },
    {
      key: 'ArrowRight',
      description: 'Step forward (+1 round)',
      action: () => handleStepSimulation(),
    },
    {
      key: 'e',
      ctrl: true,
      description: 'Open Export Modal',
      action: () => setIsExportModalOpen(true),
    },
    {
      key: 's',
      ctrl: true,
      description: 'Open Scenarios Catalog',
      action: () => setIsScenarioModalOpen(true),
    },
    {
      key: 'k',
      ctrl: true,
      description: 'Open Command Palette',
      action: () => setIsCommandPaletteOpen(true),
    },
  ]);

  // Palette Commands
  const paletteCommands: PaletteCommand[] = [
    {
      id: 'play-pause',
      title: isPlaying ? 'Pause Simulation' : 'Play / Step Simulation',
      category: 'Simulation',
      icon: isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />,
      shortcut: 'Space',
      action: () => handleTogglePlay(),
    },
    {
      id: 'step-forward',
      title: 'Step Simulation Forward (+1 Round)',
      category: 'Simulation',
      icon: <FastForward className="w-4 h-4 text-cyan-400" />,
      shortcut: '→',
      action: () => handleStepSimulation(),
    },
    {
      id: 'stage-import',
      title: 'Workflow: Stage 1 - Import Datasets',
      category: 'Navigation',
      icon: <Database className="w-4 h-4 text-cyan-400" />,
      shortcut: '1',
      action: () => setCurrentStage('import'),
    },
    {
      id: 'stage-analyze',
      title: 'Workflow: Stage 2 - Analyze Live Network',
      category: 'Navigation',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      shortcut: '2',
      action: () => setCurrentStage('analyze'),
    },
    {
      id: 'stage-replay',
      title: 'Workflow: Stage 3 - Replay & Heatmaps',
      category: 'Navigation',
      icon: <History className="w-4 h-4 text-purple-400" />,
      shortcut: '3',
      action: () => setCurrentStage('replay'),
    },
    {
      id: 'stage-compare',
      title: 'Workflow: Stage 4 - Compare Strategies',
      category: 'Navigation',
      icon: <GitFork className="w-4 h-4 text-indigo-400" />,
      shortcut: '4',
      action: () => {
        handleComputeComparison();
        setCurrentStage('compare');
      },
    },
    {
      id: 'stage-export',
      title: 'Workflow: Stage 5 - Export Intelligence',
      category: 'Navigation',
      icon: <Download className="w-4 h-4 text-amber-400" />,
      shortcut: '5',
      action: () => setCurrentStage('export'),
    },
    {
      id: 'start-tour',
      title: 'Start 30-Second Guided Tour',
      category: 'Help',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      action: () => setIsTourOpen(true),
    },
    {
      id: 'reset-sim',
      title: 'Reset Simulation to Round 0',
      category: 'Simulation',
      icon: <RotateCcw className="w-4 h-4 text-slate-400" />,
      action: () => handleResetSimulation(),
    },
    {
      id: 'open-export-modal',
      title: 'Open Export Briefing Modal',
      category: 'Export',
      icon: <Download className="w-4 h-4 text-purple-400" />,
      shortcut: 'Ctrl+E',
      action: () => setIsExportModalOpen(true),
    },
    {
      id: 'open-scenarios',
      title: 'Open Scenario Catalog',
      category: 'Scenarios',
      icon: <FolderHeart className="w-4 h-4 text-blue-400" />,
      shortcut: 'Ctrl+S',
      action: () => setIsScenarioModalOpen(true),
    },
    {
      id: 'open-datasets',
      title: 'Load Empirical Benchmark Dataset',
      category: 'Datasets',
      icon: <Database className="w-4 h-4 text-emerald-400" />,
      action: () => setIsDatasetModalOpen(true),
    },
    {
      id: 'audit-invariants',
      title: 'Audit Invariants & Determinism',
      category: 'Verification',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      action: () => handleRunValidation(),
    },
    {
      id: 'explain-alert',
      title: 'Explain Threat Progression Alert',
      category: 'Simulation',
      icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
      action: () => handleOpenAlertExplanation('Epidemic Cascade Progression Alert'),
    },
    {
      id: 'export-json-cmd',
      title: 'Export JSON Topology to Clipboard',
      category: 'Export',
      icon: <Download className="w-4 h-4 text-cyan-400" />,
      action: () => handleCopyJSON(),
    },
    {
      id: 're-synthesize',
      title: 'Synthesize New Random Society',
      category: 'Simulation',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      action: () => handleGenerate(),
    },
  ];

  // Latest round telemetry
  const latestTelemetry: RoundTelemetry | null = simState && simState.telemetryHistory.length > 0
    ? simState.telemetryHistory[simState.telemetryHistory.length - 1]
    : null;

  // Primary Metrics
  const totalNodes = activeSociety.summary.totalPopulation;
  const spreadRate = latestTelemetry ? latestTelemetry.r0 : (simState ? 0 : 1.45);
  const believerCount = latestTelemetry ? latestTelemetry.believerCount : (simState ? Array.from(simState.agentStates.values()).filter(s => s === 'BELIEVER').length : 0);
  const believerPercent = totalNodes > 0 ? (believerCount / totalNodes) * 100 : 0;
  
  // Risk assessment
  let riskLevel = 'Low';
  let riskBadgeVariant: 'neutral' | 'info' | 'warning' | 'critical' | 'success' = 'success';
  if (!simState) {
    riskLevel = 'Dormant';
    riskBadgeVariant = 'neutral';
  } else if (spreadRate > 1.4 || believerPercent > 35) {
    riskLevel = 'Critical';
    riskBadgeVariant = 'critical';
  } else if (spreadRate > 1.0 || believerPercent > 15) {
    riskLevel = 'Moderate';
    riskBadgeVariant = 'warning';
  }

  const crossCommunityPercent = v2LoadedData 
    ? (v2LoadedData.v2Metrics.bridgeRatio * 100).toFixed(1)
    : ((activeSociety.summary.bridgeNodeCount / (totalNodes || 1)) * 100).toFixed(1);

  const filteredAgents = activeSociety.agents.filter(
    (a) =>
      a.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
      a.role.toLowerCase().includes(agentSearch.toLowerCase()) ||
      a.id.toLowerCase().includes(agentSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 bg-grid-pattern text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* 1. Top Workflow Navigation Bar */}
      <WorkflowBar
        currentStage={currentStage}
        onSelectStage={(stage) => {
          if (stage === 'compare' && !counterfactualResult) {
            handleComputeComparison();
          }
          setCurrentStage(stage);
        }}
        onOpenTour={() => setIsTourOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenScenarios={() => setIsScenarioModalOpen(true)}
        onAuditInvariants={handleRunValidation}
      />
      <NotificationCenter />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        {/* Stage 1: Import */}
        {currentStage === 'import' && (
          <ImportView
            onLoadDataset={handleDatasetLoaded}
            onGenerateSynthetic={({ archetype: arch, population: pop, influencerRatio: inf }) => {
              setArchetype(arch);
              setPopulation(pop);
              setInfluencerRatio(inf);
              const generated = societyGenerator.generate({
                name: `${arch.toUpperCase()} Synthesized Society`,
                archetype: arch,
                populationSize: pop,
                influencerRatio: inf,
                baselineTrust: trustBias,
                baselineConformity: conformityBias,
                baselineRiskTolerance: riskToleranceBias,
              });
              setActiveSociety(generated);
              setV2LoadedData(null);
              setSelectedAgent(null);
              handleResetSimulation();
            }}
            onProceedToAnalyze={() => setCurrentStage('analyze')}
            activeSociety={activeSociety}
            v2LoadedData={v2LoadedData}
          />
        )}

        {/* Stage 2: Analyze (Mission Control) */}
        {currentStage === 'analyze' && (
          <div className="space-y-6 animate-fade-in">
            {/* Landing Hero Section */}
            <HeroSection
              onLoadDataset={() => setCurrentStage('import')}
              onRunDemo={handleRunHeroDemo}
              onOpenReport={() => setCurrentStage('export')}
              isCollapsed={isHeroCollapsed}
              onToggleCollapse={() => setIsHeroCollapsed(!isHeroCollapsed)}
            />

            {/* Stage 7: Primary Metric Cards HUD */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Spread Rate"
                technicalLabel="R₀(t)"
                value={spreadRate.toFixed(2)}
                subtitle={spreadRate > 1 ? 'Supercritical cascade' : spreadRate === 0 ? 'Extinguished' : 'Subcritical decline'}
                badge={spreadRate > 1 ? 'Growing' : 'Stable'}
                badgeVariant={spreadRate > 1 ? 'critical' : spreadRate === 0 ? 'neutral' : 'success'}
              />
              <MetricCard
                label="Total Nodes"
                technicalLabel="|V| Society Population"
                value={totalNodes}
                subtitle={`${activeSociety.summary.communityCount} communities active`}
                badge="Informed"
                badgeVariant="info"
              />
              <MetricCard
                label="Risk Level"
                technicalLabel="Exposure Severity"
                value={riskLevel}
                subtitle={`${believerPercent.toFixed(1)}% infected (${believerCount} nodes)`}
                badge={riskLevel.toUpperCase()}
                badgeVariant={riskBadgeVariant}
              />
              <MetricCard
                label="Cross-Community Activity"
                technicalLabel="Bridge Ratio"
                value={`${crossCommunityPercent}%`}
                subtitle={`${activeSociety.summary.bridgeNodeCount} bridge nodes`}
                badge="Inter-Cluster"
                badgeVariant="info"
              />
            </div>

            {/* Mission Control 2-Column Deck: Quick Actions & Canvas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Simulation Controls, Signals, Actions (4 Cols) */}
              <div className="lg:col-span-4 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-5 backdrop-blur-md">
                {/* Playback Control Bar */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 font-bold uppercase tracking-wider">Simulation Control</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      simState?.status === 'running' 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                        : simState?.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                    }`}>
                      {simState?.status ? simState.status.toUpperCase() : 'READY'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={handleTogglePlay}
                      className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-glow-amber'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-glow-cyan'
                      }`}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      <span>{isPlaying ? 'Pause' : 'Play'}</span>
                    </button>

                    <button
                      onClick={handleStepSimulation}
                      className="flex items-center justify-center space-x-1 py-2.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 transition-colors cursor-pointer"
                      title="Step forward by 1 round (→)"
                    >
                      <FastForward className="h-4 w-4 text-cyan-400" />
                      <span>Step +1</span>
                    </button>

                    <button
                      onClick={handleResetSimulation}
                      className="flex items-center justify-center space-x-1 py-2.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Reset simulation to round 0"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Reset</span>
                    </button>
                  </div>

                  {/* Speed Slider */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>Step Latency</span>
                      <span className="text-cyan-400 font-bold">{simSpeedMs}ms</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={1500}
                      step={50}
                      value={simSpeedMs}
                      onChange={(e) => setSimSpeedMs(Number(e.target.value))}
                      className="w-full accent-cyan-400 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Hoax Signal Selector (Wikipedia Fixtures) */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold uppercase text-slate-300">
                      <Database className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Misinformation Signal</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Wikipedia Corpus</span>
                  </label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {WIKIPEDIA_HOAX_FIXTURES.map((hoax) => (
                      <button
                        key={hoax.id}
                        onClick={() => {
                          setSelectedHoax(hoax);
                          if (engine) handleResetSimulation();
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                          selectedHoax.id === hoax.id
                            ? 'bg-cyan-950/50 border-cyan-500/80 text-cyan-200 shadow-glow-cyan'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold truncate text-white">{hoax.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between">
                          <span>Fear: {(hoax.fearSalience * 100).toFixed(0)}%</span>
                          <span>Plausibility: {(hoax.plausibility * 100).toFixed(0)}%</span>
                          <span className="text-rose-400 font-bold">Veracity: {hoax.veracity}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patient Zero Seeding Strategy */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400 font-bold uppercase text-slate-300">
                    First Source (Patient Zero)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                    <button
                      onClick={() => setSeedStrategy('influencer')}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${
                        seedStrategy === 'influencer'
                          ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Top Influencer
                    </button>
                    <button
                      onClick={() => setSeedStrategy('bridge')}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${
                        seedStrategy === 'bridge'
                          ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Bridge Node
                    </button>
                    <button
                      onClick={() => setSeedStrategy('selected')}
                      className={`p-2 rounded-lg border transition-all cursor-pointer truncate ${
                        seedStrategy === 'selected'
                          ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {selectedAgent ? selectedAgent.id : 'Selected Node'}
                    </button>
                  </div>
                </div>

                {/* Primary Fact-Check Intervention Action */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <button
                    onClick={handleInjectDebunk}
                    disabled={!simState || simState.status !== 'running'}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all ${
                      simState && simState.status === 'running'
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-glow-emerald cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span>Deploy Fact-Check Intervention</span>
                  </button>

                  <button
                    onClick={() => {
                      handleComputeComparison();
                      setCurrentStage('compare');
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-2 bg-purple-950/60 hover:bg-purple-900 border border-purple-500/50 text-purple-300 transition-all cursor-pointer"
                  >
                    <GitFork className="h-3.5 w-3.5 text-purple-400" />
                    <span>Compare Intervention Strategies</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Interactive Canvas & Timeline (8 Cols) */}
              <div className="lg:col-span-8 space-y-4">
                {/* Sub-tab switcher */}
                <div className="flex border-b border-slate-800 bg-slate-900/60 rounded-t-xl px-3 pt-2 text-xs font-mono">
                  <button
                    onClick={() => setAnalyzeSubTab('topology')}
                    className={`px-3.5 py-2 border-b-2 font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                      analyzeSubTab === 'topology'
                        ? 'border-cyan-400 text-cyan-300'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Network className="h-3.5 w-3.5" />
                    <span>Live Network Canvas</span>
                  </button>
                  <button
                    onClick={() => setAnalyzeSubTab('communities')}
                    className={`px-3.5 py-2 border-b-2 font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                      analyzeSubTab === 'communities'
                        ? 'border-cyan-400 text-cyan-300'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Communities ({activeSociety.communities.length})</span>
                  </button>
                  <button
                    onClick={() => setAnalyzeSubTab('agents')}
                    className={`px-3.5 py-2 border-b-2 font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                      analyzeSubTab === 'agents'
                        ? 'border-cyan-400 text-cyan-300'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Node Roster ({activeSociety.agents.length})</span>
                  </button>
                  <button
                    onClick={() => {
                      setAnalyzeSubTab('discovery');
                      if (!discoveryReport && !isAnalyzing) {
                        handleRunDiscovery(true);
                      }
                    }}
                    className={`px-3.5 py-2 border-b-2 font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                      analyzeSubTab === 'discovery'
                        ? 'border-cyan-400 text-cyan-300'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                    <span>AI Discovery {discoveryReport ? '✓' : ''}</span>
                  </button>
                </div>

                {/* Sub-tab view body */}
                {analyzeSubTab === 'topology' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className={selectedAgent ? 'md:col-span-7' : 'md:col-span-12'}>
                      <NetworkCanvas
                        society={activeSociety}
                        selectedAgent={selectedAgent}
                        onSelectAgent={(agent) => setSelectedAgent(agent)}
                        simulationStates={simState?.agentStates}
                        patientZeroIds={simState?.patientZeroIds}
                        recentTransmissions={simState?.recentTransmissions}
                      />

                      {/* Timeline Scrubber */}
                      <div className="mt-3">
                        <TimelineScrubber
                          currentRound={simState ? simState.currentRound : 0}
                          maxRecordedRound={engine ? engine.getMaxRecordedRound() : 0}
                          isPlaying={isPlaying}
                          telemetryHistory={simState ? simState.telemetryHistory : []}
                          onScrub={handleScrubToRound}
                          onTogglePlay={handleTogglePlay}
                          onStepForward={handleStepForward}
                          onStepBackward={handleStepBackward}
                          onJumpToStart={handleJumpToStart}
                          onJumpToEnd={handleJumpToEnd}
                          onDragStart={() => {
                            wasPlayingBeforeDrag.current = isPlaying;
                            setIsPlaying(false);
                          }}
                          onDragEnd={() => {
                            if (wasPlayingBeforeDrag.current) {
                              setIsPlaying(true);
                            }
                          }}
                        />
                      </div>
                      <div className="mt-2 text-[11px] font-mono text-slate-500 text-center">
                        Tip: Click any node to open its cognitive dossier, or drag timeline slider to scrub propagation.
                      </div>
                    </div>

                    {selectedAgent && (
                      <div className="md:col-span-5">
                        <AgentInspector
                          agent={selectedAgent}
                          society={activeSociety}
                          onClose={() => setSelectedAgent(null)}
                          onSelectNeighbor={(neighborId) => {
                            const neighbor = activeSociety.agents.find((a) => a.id === neighborId);
                            if (neighbor) setSelectedAgent(neighbor);
                          }}
                          onAgentUpdated={(updated) => {
                            setSelectedAgent(updated);
                            setActiveSociety({ ...activeSociety });
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {analyzeSubTab === 'communities' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeSociety.communities.map((comm: Community) => (
                      <div
                        key={comm.id}
                        className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: comm.color }}
                            />
                            <span className="font-mono text-xs font-bold text-white">
                              {comm.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {comm.agentIds.length} Members
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{comm.metadata.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                          <div>Avg Trust: {(comm.metrics.avgTrust * 100).toFixed(0)}%</div>
                          <div>Avg Influence: {(comm.metrics.avgInfluence * 100).toFixed(0)}%</div>
                          <div>Conformity: {(comm.metrics.avgConformity * 100).toFixed(0)}%</div>
                          <div>Internal Density: {(comm.metrics.internalDensity * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {analyzeSubTab === 'agents' && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search agents by name, ID, or structural role..."
                        value={agentSearch}
                        onChange={(e) => setAgentSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1 font-mono text-xs">
                      {filteredAgents.map((agent) => (
                        <div
                          key={agent.id}
                          onClick={() => setSelectedAgent(agent)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                            selectedAgent?.id === agent.id
                              ? 'bg-cyan-950/40 border-cyan-500/80 shadow-glow-cyan'
                              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-100">{agent.name}</span>
                              <span className="text-[10px] text-slate-500">({agent.id})</span>
                              {agent.isInfluencer && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                  INFLUENCER
                                </span>
                              )}
                              {agent.isBridge && (
                                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                                  BRIDGE
                                </span>
                              )}
                              {simState?.agentStates.get(agent.id) && (
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  simState.agentStates.get(agent.id) === 'BELIEVER'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                    : simState.agentStates.get(agent.id) === 'DEBUNKER'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                      : 'bg-purple-500/20 text-purple-400'
                                }`}>
                                  {simState.agentStates.get(agent.id)}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{agent.role}</div>
                          </div>

                          <div className="text-right text-[10px] text-slate-400 space-y-0.5">
                            <div>Trust: {(agent.traits.trust * 100).toFixed(0)}%</div>
                            <div>Influence: {(agent.traits.influence * 100).toFixed(0)}%</div>
                            <div>Connections: {agent.connections.length}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analyzeSubTab === 'discovery' && (
                  <DiscoveryDashboard
                    report={discoveryReport}
                    isAnalyzing={isAnalyzing}
                    onRunAnalysis={handleRunDiscovery}
                  />
                )}
              </div>
            </div>

            {/* Stage 5: Progressive Disclosure - Collapsible Advanced Analysis Drawer */}
            <AdvancedAnalysisDrawer
              society={activeSociety}
              v2LoadedData={v2LoadedData}
              simState={simState}
              liveDynamicDecay={liveDynamicDecay}
              onToggleDynamicDecay={() => setLiveDynamicDecay(!liveDynamicDecay)}
              trustBias={trustBias}
              onTrustBiasChange={setTrustBias}
              conformityBias={conformityBias}
              onConformityBiasChange={setConformityBias}
              riskToleranceBias={riskToleranceBias}
              onRiskToleranceBiasChange={setRiskToleranceBias}
              onOpenValidationModal={handleRunValidation}
            />
          </div>
        )}

        {/* Stage 3: Replay */}
        {currentStage === 'replay' && (
          <div className="space-y-6 animate-fade-in">
            <AnalystReplayDashboard
              simState={simState}
              society={activeSociety}
              currentRound={simState ? simState.currentRound : 0}
              maxRecordedRound={engine ? engine.getMaxRecordedRound() : 0}
              onLaunchCounterfactual={handleLaunchCounterfactual}
              onScrubToRound={handleScrubToRound}
            />

            {/* GoEmotions Emotional Heatmap */}
            <div className="mt-6">
              <EmotionalIntelligenceDashboard
                society={activeSociety}
                simState={simState}
                telemetry={discoveryReport?.telemetry}
              />
            </div>
          </div>
        )}

        {/* Stage 4: Compare Strategies */}
        {currentStage === 'compare' && (
          <CompareStrategiesView
            comparisonResult={counterfactualResult}
            currentRound={simState ? simState.currentRound : 0}
            onRunComparison={handleComputeComparison}
            onApplyBranch={(branchId) => {
              handleApplyCounterfactualBranch(branchId);
              setCurrentStage('analyze');
            }}
            onSwitchToAnalyze={() => setCurrentStage('analyze')}
          />
        )}

        {/* Stage 5: Export Intelligence */}
        {currentStage === 'export' && (
          <ReportCenterView
            society={activeSociety}
            simState={simState}
            telemetryHistory={simState ? simState.telemetryHistory : []}
            discoveryReport={discoveryReport}
            onNotify={(n) => emitNotification({ ...n, autoClose: 5000 })}
          />
        )}
      </main>

      {/* 30-Second Guided First-Run Tour */}
      <GuidedTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onLoadDemoDataset={handleTourLoadDemo}
        onStartSimulation={handleTourStartSim}
        onPauseAtRound12={handleTourPauseAtRound12}
        onOpenCompare={handleTourOpenCompare}
        onOpenExport={handleTourOpenExport}
        currentRound={simState ? simState.currentRound : 0}
      />

      {/* Invariant Validation Modal */}
      {validationReport && (
        <ValidationModal
          report={validationReport}
          onClose={() => setValidationReport(null)}
        />
      )}

      {/* Real Dataset Ingestion Modal */}
      <RealDatasetModal
        isOpen={isDatasetModalOpen}
        onClose={() => setIsDatasetModalOpen(false)}
        onDatasetLoaded={handleDatasetLoaded}
      />

      {/* Counterfactual Branching Matrix Modal */}
      <CounterfactualModal
        isOpen={isCounterfactualOpen}
        onClose={() => setIsCounterfactualOpen(false)}
        result={counterfactualResult}
        onApplyBranch={handleApplyCounterfactualBranch}
      />

      {/* Export Report Center Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        society={activeSociety}
        simState={
          simState || {
            status: 'idle',
            currentRound: 0,
            activeRumor: null,
            activeDebunk: null,
            patientZeroIds: [],
            agentStates: new Map(),
            infectionParents: new Map(),
            telemetryHistory: [],
            recentTransmissions: [],
          }
        }
        telemetryHistory={simState ? simState.telemetryHistory : []}
        discoveryReport={discoveryReport}
        onNotify={(n) => emitNotification({ ...n, autoClose: 5000 })}
      />

      {/* Scenario Catalog Modal */}
      <ScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        society={activeSociety}
        simState={
          simState || {
            status: 'idle',
            currentRound: 0,
            activeRumor: null,
            activeDebunk: null,
            patientZeroIds: [],
            agentStates: new Map(),
            infectionParents: new Map(),
            telemetryHistory: [],
            recentTransmissions: [],
          }
        }
        telemetryHistory={simState ? simState.telemetryHistory : []}
        discoveryReport={discoveryReport}
        rumor={simState?.activeRumor || null}
        onLoadScenario={handleLoadScenario}
        onNotify={(n) => emitNotification({ ...n, autoClose: 5000 })}
      />

      {/* Explainability Causal Diagnostic Modal */}
      <ExplainabilityModal
        isOpen={isExplainabilityOpen}
        onClose={() => setIsExplainabilityOpen(false)}
        explanation={activeAlertExplanation}
      />

      {/* Analyst Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={paletteCommands}
      />
    </div>
  );
};
