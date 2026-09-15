/**
 * Social Gravity - Computational Social Psychology Laboratory UI
 * Interactive workspace for synthesizing societies, loading empirical benchmarks (SNAP),
 * simulating epidemiological rumor diffusion, and evaluating debunking interventions.
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  Network, 
  Check, 
  Copy,
  Building2,
  GraduationCap,
  Briefcase,
  Globe2,
  Search,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Flame,
  ShieldAlert,
  Database,
  Radio,
  Zap,
  Sparkles
} from 'lucide-react';
import { DiscoveryEngine, DiscoveryReport, DiscoveryDashboard } from './discovery';
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
import { LoadedDatasetResult } from './datasets/realDatasetService';

export const App: React.FC = () => {
  // Synthesis parameters
  const [archetype, setArchetype] = useState<SocietyArchetype>('school');
  const [population, setPopulation] = useState<number>(100);
  const [influencerRatio, setInfluencerRatio] = useState<number>(0.05);
  const [trustBias, setTrustBias] = useState<number>(0.55);
  const [conformityBias, setConformityBias] = useState<number>(0.65);
  const [riskToleranceBias, setRiskToleranceBias] = useState<number>(0.50);

  // UI state
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'topology' | 'communities' | 'agents' | 'telemetry' | 'discovery' | 'json'>('topology');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentSearch, setAgentSearch] = useState<string>('');
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [sidebarMode, setSidebarMode] = useState<'simulation' | 'generator'>('simulation');

  // Real Dataset Ingestion & V2 State
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState<boolean>(false);
  const [v2LoadedData, setV2LoadedData] = useState<LoadedDatasetResult | null>(null);

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

  const handleInjectDebunk = () => {
    if (!engine || !simState) return;
    const debunkSignal = WikipediaHoaxAdapter.createDebunkingSignal(
      selectedHoax,
      'fact_checker_authority',
      simState.currentRound
    );
    const next = engine.injectDebunking(debunkSignal);
    setSimState({ ...next });
  };

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
      setActiveTab('discovery');
    } catch (err) {
      console.error('Discovery Engine analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
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

  const handleRunValidation = () => {
    const report = SocietyValidator.validate(activeSociety);
    setValidationReport(report);
  };

  const handleCopyJSON = () => {
    const jsonStr = societyGenerator.exportJSON(activeSociety);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const archetypeIcons: Record<SocietyArchetype, React.ReactNode> = {
    school: <GraduationCap className="h-4 w-4" />,
    workplace: <Briefcase className="h-4 w-4" />,
    city: <Building2 className="h-4 w-4" />,
    online_community: <Globe2 className="h-4 w-4" />,
  };

  const filteredAgents = activeSociety.agents.filter(
    (a) =>
      a.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
      a.role.toLowerCase().includes(agentSearch.toLowerCase()) ||
      a.id.toLowerCase().includes(agentSearch.toLowerCase())
  );

  // Latest round telemetry
  const latestTelemetry: RoundTelemetry | null = simState && simState.telemetryHistory.length > 0
    ? simState.telemetryHistory[simState.telemetryHistory.length - 1]
    : null;

  return (
    <div className="min-h-screen bg-gravity-950 bg-grid-pattern bg-radial-gradient text-slate-100 flex flex-col font-sans">
      {/* Top Telemetry Navigation */}
      <header className="border-b border-gravity-800/80 bg-gravity-900/70 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[1px] shadow-glow-cyan">
            <div className="h-full w-full bg-gravity-950 rounded-[7px] flex items-center justify-center">
              <Activity className="h-4 w-4 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-wider text-sm text-white">SOCIAL GRAVITY</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold">
                v0.4.0-mvp
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Computational Social Psychology & Misinformation Simulator</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono">
          <button
            onClick={handleRunValidation}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gravity-800/90 hover:bg-gravity-700 border border-gravity-700 text-slate-300 transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Audit Invariants</span>
          </button>

          <div className="hidden md:flex items-center space-x-2 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-emerald-400 font-medium">100% LOCAL DETERMINISTIC</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Header Hero Banner */}
        <div className="bg-gravity-900/60 border border-gravity-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-2">
              <Radio className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
              <span>CORE RESEARCH ENGINE: TRUST VS MISINFORMATION DIFFUSION</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Epidemiological Diffusion & Intervention Laboratory
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Simulate peer-to-peer rumor cascades across synthetic archetypes or Stanford SNAP social circles. 
              Evaluate how epistemic trust, Asch conformity, and emotional salience drive beliefs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleRunDiscovery(true)}
              disabled={isAnalyzing}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-gravity-950 text-xs font-mono font-bold transition-all shadow-glow-cyan cursor-pointer"
              title="Synthesize empirical discoveries and intervention recommendations"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isAnalyzing ? 'Analyzing...' : 'Run AI Discovery'}</span>
            </button>
            <button
              onClick={handleCopyJSON}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-gravity-800 hover:bg-gravity-700 border border-gravity-700 text-xs font-mono text-slate-300 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Export JSON'}</span>
            </button>
            <button
              onClick={() => setIsDatasetModalOpen(true)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/50 text-xs font-mono text-emerald-300 transition-all shadow-glow-emerald cursor-pointer"
              title="Load real-world Reddit conversation trees or SNAP Facebook ego networks"
            >
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              <span>Load Real Dataset</span>
            </button>
          </div>
        </div>

        {/* Real-World Dataset V2 Intelligence HUD Banner */}
        {v2LoadedData && (
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-lg">
            <div className="flex items-center space-x-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white font-bold">{v2LoadedData.society.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/70 text-emerald-300 border border-emerald-600">
                {v2LoadedData.canonicalGraph.sourceDataset}
              </span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 text-[11px]">
              <span>Modularity Q: <strong className="text-cyan-400">{v2LoadedData.canonicalGraph.modularity.toFixed(3)}</strong></span>
              <span>Bridge Ratio: <strong className="text-amber-400">{(v2LoadedData.v2Metrics.bridgeRatio * 100).toFixed(1)}%</strong></span>
              <span>Clustering: <strong className="text-rose-400">{v2LoadedData.v2Metrics.globalClusteringCoefficient.toFixed(3)}</strong></span>
              <span>Density: <strong className="text-slate-200">{(v2LoadedData.v2Metrics.density * 100).toFixed(2)}%</strong></span>
              <span>Avg Degree: <strong className="text-slate-200">{v2LoadedData.v2Metrics.averageDegree.toFixed(1)}</strong></span>
              <span>Records: <strong className="text-emerald-400">{v2LoadedData.validationReport.validRecordsCount}</strong></span>
            </div>
          </div>
        )}

        {/* Dynamic Telemetry HUD Banner (Switches between Society Summary and Live Epidemic Telemetry) */}
        {latestTelemetry ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-gravity-900/90 border border-red-500/40 rounded-xl p-3.5 shadow-glow-red">
              <span className="text-red-400 text-[10px] font-mono uppercase block flex items-center gap-1">
                <Flame className="h-3 w-3" /> Believers (Infected)
              </span>
              <span className="text-xl font-bold font-mono text-red-400 mt-0.5 block">
                {latestTelemetry.believerCount}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {((latestTelemetry.believerCount / activeSociety.summary.totalPopulation) * 100).toFixed(1)}% of population
              </span>
            </div>

            <div className="bg-gravity-900/90 border border-emerald-500/40 rounded-xl p-3.5">
              <span className="text-emerald-400 text-[10px] font-mono uppercase block flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Debunkers (Verified)
              </span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5 block">
                {latestTelemetry.debunkerCount}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {((latestTelemetry.debunkerCount / activeSociety.summary.totalPopulation) * 100).toFixed(1)}% fact-checked
              </span>
            </div>

            <div className="bg-gravity-900/80 border border-purple-500/30 rounded-xl p-3.5">
              <span className="text-purple-400 text-[10px] font-mono uppercase block">Skeptics (Resistant)</span>
              <span className="text-xl font-bold font-mono text-purple-400 mt-0.5 block">
                {latestTelemetry.skepticCount}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Refused adoption</span>
            </div>

            <div className="bg-gravity-900/80 border border-cyan-500/30 rounded-xl p-3.5">
              <span className="text-cyan-400 text-[10px] font-mono uppercase block">Susceptible</span>
              <span className="text-xl font-bold font-mono text-cyan-400 mt-0.5 block">
                {latestTelemetry.susceptibleCount}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Unreached nodes</span>
            </div>

            <div className="bg-gravity-900/80 border border-amber-500/30 rounded-xl p-3.5">
              <span className="text-amber-400 text-[10px] font-mono uppercase block flex items-center gap-1">
                <Zap className="h-3 w-3" /> Repro Rate R₀(t)
              </span>
              <span className="text-xl font-bold font-mono text-amber-400 mt-0.5 block">
                {latestTelemetry.r0}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {latestTelemetry.r0 > 1 ? 'Epidemic growing' : latestTelemetry.r0 === 0 ? 'Extinguished' : 'Dying out'}
              </span>
            </div>

            <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-3.5">
              <span className="text-slate-400 text-[10px] font-mono uppercase block">Round / Depth</span>
              <span className="text-xl font-bold font-mono text-white mt-0.5 block">
                t={latestTelemetry.round} <span className="text-xs font-normal text-slate-500">/ d={latestTelemetry.maxCascadeDepth}</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">
                Velocity: {latestTelemetry.cascadeVelocity} / rnd
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-3.5">
              <span className="text-slate-500 text-[10px] font-mono uppercase block">Population</span>
              <span className="text-xl font-bold font-mono text-white mt-0.5 block">
                {activeSociety.summary.totalPopulation}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">
                {activeSociety.summary.communityCount} Sub-groups
              </span>
            </div>

            <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-3.5">
              <span className="text-slate-500 text-[10px] font-mono uppercase block">Influencers</span>
              <span className="text-xl font-bold font-mono text-amber-400 mt-0.5 block">
                {activeSociety.summary.influencerCount}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {((activeSociety.summary.influencerCount / activeSociety.summary.totalPopulation) * 100).toFixed(1)}% Reach
              </span>
            </div>

            <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-3.5">
              <span className="text-slate-500 text-[10px] font-mono uppercase block">Bridges</span>
              <span className="text-xl font-bold font-mono text-cyan-400 mt-0.5 block">
                {activeSociety.summary.bridgeNodeCount}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Cross-community</span>
            </div>

            <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-3.5">
              <span className="text-slate-500 text-[10px] font-mono uppercase block">Avg Trust</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5 block">
                {(activeSociety.summary.avgTrust * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Epistemic prior</span>
            </div>

            <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-3.5">
              <span className="text-slate-500 text-[10px] font-mono uppercase block">Conformity</span>
              <span className="text-xl font-bold font-mono text-amber-300 mt-0.5 block">
                {(activeSociety.summary.avgConformity * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Asch pressure</span>
            </div>

            <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-3.5">
              <span className="text-slate-500 text-[10px] font-mono uppercase block">Clustering</span>
              <span className="text-xl font-bold font-mono text-rose-400 mt-0.5 block">
                {activeSociety.summary.globalClustering}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Density {(activeSociety.summary.density * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}

        {/* Two-Column Grid: Config Controls & Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Form (4 Cols) */}
          <div className="lg:col-span-4 bg-gravity-900/80 border border-gravity-800 rounded-xl p-5 space-y-5 backdrop-blur-sm">
            {/* Sidebar Mode Toggle */}
            <div className="grid grid-cols-2 gap-1 bg-gravity-950 p-1 rounded-lg border border-gravity-800 text-xs font-mono">
              <button
                onClick={() => setSidebarMode('simulation')}
                className={`py-1.5 px-2 rounded font-semibold transition-all ${
                  sidebarMode === 'simulation'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Diffusion Simulator
              </button>
              <button
                onClick={() => setSidebarMode('generator')}
                className={`py-1.5 px-2 rounded font-semibold transition-all ${
                  sidebarMode === 'generator'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Society Generator
              </button>
            </div>

            {sidebarMode === 'simulation' ? (
              <div className="space-y-4">
                {/* Simulation Playback Deck */}
                <div className="bg-gravity-950/70 border border-gravity-800 rounded-lg p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 uppercase font-semibold">Playback Controls</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      simState?.status === 'running' 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                        : simState?.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-gravity-800 text-slate-400'
                    }`}>
                      {simState?.status ? simState.status.toUpperCase() : 'IDLE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={handleTogglePlay}
                      className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all ${
                        isPlaying
                          ? 'bg-amber-500 hover:bg-amber-400 text-gravity-950 shadow-glow-amber'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-gravity-950 shadow-glow-cyan'
                      }`}
                    >
                      {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      <span>{isPlaying ? 'Pause' : 'Play'}</span>
                    </button>

                    <button
                      onClick={handleStepSimulation}
                      className="flex items-center justify-center space-x-1 py-2 px-2.5 rounded-lg bg-gravity-800 hover:bg-gravity-700 border border-gravity-700 text-xs font-mono text-slate-200 transition-colors"
                    >
                      <FastForward className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Step +1</span>
                    </button>

                    <button
                      onClick={handleResetSimulation}
                      className="flex items-center justify-center space-x-1 py-2 px-2.5 rounded-lg bg-gravity-800 hover:bg-gravity-700 border border-gravity-700 text-xs font-mono text-slate-400 hover:text-white transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>

                  {/* Speed Slider */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>Simulation Step Delay</span>
                      <span className="text-cyan-400 font-bold">{simSpeedMs}ms</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={1500}
                      step={50}
                      value={simSpeedMs}
                      onChange={(e) => setSimSpeedMs(Number(e.target.value))}
                      className="w-full accent-cyan-400 bg-gravity-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Hoax Signal Selector (Wikipedia Empirical Fixtures) */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Misinformation Signal (Wikipedia Hoax Corpus)</span>
                  </label>
                  <div className="space-y-1.5">
                    {WIKIPEDIA_HOAX_FIXTURES.map((hoax) => (
                      <button
                        key={hoax.id}
                        onClick={() => {
                          setSelectedHoax(hoax);
                          if (engine) handleResetSimulation();
                        }}
                        className={`w-full text-left p-2.5 rounded-lg border text-xs font-mono transition-all ${
                          selectedHoax.id === hoax.id
                            ? 'bg-cyan-950/50 border-cyan-500/80 text-cyan-200 shadow-glow-cyan'
                            : 'bg-gravity-950/60 border-gravity-800 text-slate-400 hover:border-gravity-700'
                        }`}
                      >
                        <div className="font-bold truncate text-white">{hoax.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between">
                          <span>Fear: {(hoax.fearSalience * 100).toFixed(0)}%</span>
                          <span>Plausibility: {(hoax.plausibility * 100).toFixed(0)}%</span>
                          <span className="text-red-400">Veracity: {hoax.veracity}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patient Zero Seeding Strategy */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400">Patient Zero Inoculation</label>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                    <button
                      onClick={() => setSeedStrategy('influencer')}
                      className={`p-2 rounded border transition-all ${
                        seedStrategy === 'influencer'
                          ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                          : 'bg-gravity-950/60 border-gravity-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Top Influencer
                    </button>
                    <button
                      onClick={() => setSeedStrategy('bridge')}
                      className={`p-2 rounded border transition-all ${
                        seedStrategy === 'bridge'
                          ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                          : 'bg-gravity-950/60 border-gravity-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Bridge Node
                    </button>
                    <button
                      onClick={() => setSeedStrategy('selected')}
                      className={`p-2 rounded border transition-all ${
                        seedStrategy === 'selected'
                          ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                          : 'bg-gravity-950/60 border-gravity-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {selectedAgent ? selectedAgent.id : 'Click Node'}
                    </button>
                  </div>
                </div>

                {/* Intervention Button */}
                <div className="pt-2 border-t border-gravity-800">
                  <button
                    onClick={handleInjectDebunk}
                    disabled={!simState || simState.status !== 'running'}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all ${
                      simState && simState.status === 'running'
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-gravity-950 shadow-glow-emerald cursor-pointer'
                        : 'bg-gravity-800 text-slate-500 cursor-not-allowed border border-gravity-700'
                    }`}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span>Deploy Fact-Check Intervention</span>
                  </button>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 text-center">
                    Tests whether high-trust communities halt the rumor vs low-trust polarization.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Archetype Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400">Society Archetype</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['school', 'workplace', 'city', 'online_community'] as SocietyArchetype[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setArchetype(type)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-mono transition-all border ${
                          archetype === type
                            ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 shadow-glow-cyan'
                            : 'bg-gravity-950/60 border-gravity-800 text-slate-400 hover:border-gravity-700'
                        }`}
                      >
                        {archetypeIcons[type]}
                        <span className="capitalize">{type.replace('_', ' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Population Size Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Population Size (N)</span>
                    <span className="text-cyan-400 font-bold">{population} Agents</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={500}
                    step={10}
                    value={population}
                    onChange={(e) => setPopulation(Number(e.target.value))}
                    className="w-full accent-cyan-400 bg-gravity-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Influencer Ratio */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Influencer Hub Ratio</span>
                    <span className="text-amber-400 font-bold">{(influencerRatio * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.01}
                    max={0.15}
                    step={0.01}
                    value={influencerRatio}
                    onChange={(e) => setInfluencerRatio(Number(e.target.value))}
                    className="w-full accent-amber-400 bg-gravity-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Trait Calibration Sliders */}
                <div className="space-y-3 pt-2 border-t border-gravity-800">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Baseline Epistemic Trust</span>
                      <span className="text-emerald-400 font-bold">{(trustBias * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={0.95}
                      step={0.05}
                      value={trustBias}
                      onChange={(e) => setTrustBias(Number(e.target.value))}
                      className="w-full accent-emerald-400 bg-gravity-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Conformity Pressure (Asch)</span>
                      <span className="text-amber-400 font-bold">{(conformityBias * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={0.95}
                      step={0.05}
                      value={conformityBias}
                      onChange={(e) => setConformityBias(Number(e.target.value))}
                      className="w-full accent-amber-400 bg-gravity-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Risk Tolerance</span>
                      <span className="text-rose-400 font-bold">{(riskToleranceBias * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={0.95}
                      step={0.05}
                      value={riskToleranceBias}
                      onChange={(e) => setRiskToleranceBias(Number(e.target.value))}
                      className="w-full accent-rose-400 bg-gravity-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-gravity-950 font-bold text-xs font-mono transition-all shadow-glow-cyan"
                >
                  Synthesize Digital Society
                </button>
              </div>
            )}
          </div>

          {/* Right Main Panel (8 Cols): Visualization & Inspector */}
          <div className="lg:col-span-8 space-y-4">
            {/* View Mode Selector Tabs */}
            <div className="flex border-b border-gravity-800 bg-gravity-900/60 rounded-t-xl px-4 pt-2">
              <button
                onClick={() => setActiveTab('topology')}
                className={`px-4 py-2 text-xs font-mono border-b-2 font-medium transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'topology'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Network className="h-3.5 w-3.5" />
                <span>Simulation Topology Canvas</span>
              </button>
              <button
                onClick={() => setActiveTab('communities')}
                className={`px-4 py-2 text-xs font-mono border-b-2 font-medium transition-colors ${
                  activeTab === 'communities'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Sub-Communities ({activeSociety.communities.length})
              </button>
              <button
                onClick={() => setActiveTab('agents')}
                className={`px-4 py-2 text-xs font-mono border-b-2 font-medium transition-colors ${
                  activeTab === 'agents'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Agent Roster ({activeSociety.agents.length})
              </button>
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`px-4 py-2 text-xs font-mono border-b-2 font-medium transition-colors ${
                  activeTab === 'telemetry'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Epidemic Telemetry ({simState ? simState.telemetryHistory.length : 0})
              </button>
              <button
                onClick={() => {
                  setActiveTab('discovery');
                  if (!discoveryReport && !isAnalyzing) {
                    handleRunDiscovery(true);
                  }
                }}
                className={`px-4 py-2 text-xs font-mono border-b-2 font-medium transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'discovery'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>AI Discovery & Policy {discoveryReport ? '✓' : ''}</span>
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`px-4 py-2 text-xs font-mono border-b-2 font-medium transition-colors ${
                  activeTab === 'json'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                JSON Protocol
              </button>
            </div>

            {/* Tab Body */}
            <div>
              {activeTab === 'topology' && (
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
                    <div className="mt-2 text-[11px] font-mono text-slate-500 text-center">
                      Tip: Click any node to open its cognitive dossier and evaluate live information signals against its neighborhood ties.
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

              {activeTab === 'communities' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeSociety.communities.map((comm: Community) => (
                    <div
                      key={comm.id}
                      className="bg-gravity-900/80 border border-gravity-800/80 rounded-xl p-4 space-y-3"
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
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gravity-800 text-slate-300">
                          {comm.agentIds.length} Members
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{comm.metadata.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-gravity-800/60">
                        <div>Avg Trust: {(comm.metrics.avgTrust * 100).toFixed(0)}%</div>
                        <div>Avg Influence: {(comm.metrics.avgInfluence * 100).toFixed(0)}%</div>
                        <div>Conformity: {(comm.metrics.avgConformity * 100).toFixed(0)}%</div>
                        <div>Internal Density: {(comm.metrics.internalDensity * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'agents' && (
                <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search agents by name, ID, or structural role..."
                      value={agentSearch}
                      onChange={(e) => setAgentSearch(e.target.value)}
                      className="w-full bg-gravity-950 border border-gravity-800 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
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
                            : 'bg-gravity-950/60 border-gravity-800/80 hover:border-gravity-700'
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
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
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

              {activeTab === 'telemetry' && (
                <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-4 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gravity-800">
                    <span className="font-mono text-xs font-bold text-white uppercase">
                      Discrete Round Telemetry History
                    </span>
                    <span className="text-xs font-mono text-cyan-400">
                      {simState ? `${simState.telemetryHistory.length} Rounds Logged` : 'No Active Simulation'}
                    </span>
                  </div>

                  {simState && simState.telemetryHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="border-b border-gravity-800 text-slate-400">
                            <th className="py-2 px-3">Round</th>
                            <th className="py-2 px-3 text-red-400">Believers</th>
                            <th className="py-2 px-3 text-emerald-400">Debunkers</th>
                            <th className="py-2 px-3 text-purple-400">Skeptics</th>
                            <th className="py-2 px-3 text-cyan-400">Susceptible</th>
                            <th className="py-2 px-3 text-amber-400">R₀</th>
                            <th className="py-2 px-3">Velocity</th>
                            <th className="py-2 px-3">Max Depth</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gravity-800/60 text-slate-300">
                          {simState.telemetryHistory.map((t) => (
                            <tr key={t.round} className="hover:bg-gravity-800/40">
                              <td className="py-2 px-3 font-bold text-white">t={t.round}</td>
                              <td className="py-2 px-3 text-red-400 font-semibold">{t.believerCount}</td>
                              <td className="py-2 px-3 text-emerald-400 font-semibold">{t.debunkerCount}</td>
                              <td className="py-2 px-3 text-purple-400">{t.skepticCount}</td>
                              <td className="py-2 px-3 text-cyan-400">{t.susceptibleCount}</td>
                              <td className="py-2 px-3 text-amber-400 font-bold">{t.r0}</td>
                              <td className="py-2 px-3">+{t.cascadeVelocity}</td>
                              <td className="py-2 px-3">{t.maxCascadeDepth} hops</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs font-mono text-slate-500">
                      No simulation rounds executed yet. Click &quot;Play&quot; or &quot;Step +1&quot; in the Diffusion Simulator to begin propagation.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'discovery' && (
                <DiscoveryDashboard
                  report={discoveryReport}
                  isAnalyzing={isAnalyzing}
                  onRunAnalysis={handleRunDiscovery}
                />
              )}

              {activeTab === 'json' && (
                <div className="bg-gravity-950 border border-gravity-800 rounded-xl p-4 overflow-x-auto max-h-[500px]">
                  <pre className="font-mono text-xs text-cyan-300">
                    {societyGenerator.exportJSON(activeSociety)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

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
    </div>
  );
};
