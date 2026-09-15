import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BrainCircuit,
  Compass,
  CheckCircle2,
  Lightbulb,
  Cpu,
  RefreshCw,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  Target,
  Layers,
  FlaskConical,
  BarChart3,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { DiscoveryReport } from '../types';
import { OllamaClient } from '../ollamaClient';

interface DiscoveryDashboardProps {
  report: DiscoveryReport | null;
  isAnalyzing: boolean;
  onRunAnalysis: (preferOllama: boolean) => void;
}

export const DiscoveryDashboard: React.FC<DiscoveryDashboardProps> = ({
  report,
  isAnalyzing,
  onRunAnalysis,
}) => {
  const [preferOllama, setPreferOllama] = useState<boolean>(true);
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null);
  const [copiedMd, setCopiedMd] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [epistemologyTab, setEpistemologyTab] = useState<'facts' | 'inferences' | 'predictions'>('facts');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Probe Ollama connectivity on mount
  useEffect(() => {
    let isMounted = true;
    OllamaClient.isAvailable(800).then((available) => {
      if (isMounted) setOllamaAvailable(available);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyMarkdown = () => {
    if (!report) return;
    const md = `# Social Gravity - Discovery & Intervention Report
**Report ID:** ${report.id}
**Generated:** ${report.generatedAt}
**Synthesis Engine:** ${report.generatorSource}
**Resilience Score:** ${report.resilienceScore.overall}/100 (${report.resilienceScore.rating})

---

## Executive Summary
${report.executiveSummary}

---

## Top Discovery
> "${report.topDiscovery}"

---

## Strategic Intervention Recommendation
- **Strategy:** ${report.intervention.title}
- **Priority:** ${report.intervention.priority}
- **Target:** ${report.intervention.targetType.replace('_', ' ').toUpperCase()}
- **Rationale:** ${report.intervention.rationale}
- **Expected Impact:** ${report.intervention.expectedImpact}
- **Simulation Recipe:** ${report.intervention.simulationRecipe}

---

## Empirical Hypotheses
${report.hypothesisCards
  .map(
    (c) => `### [${c.confidenceLabel} Confidence] ${c.title}
- **Category:** ${c.category}
- **Mechanism:** ${c.mechanism}
- **Evidence:** ${c.evidence}
- **Follow-up Experiment:** ${c.suggestedExperiment}
`
  )
  .join('\n')}

---

## Epistemic Separation: Measured Facts
${report.measuredFacts.map((f) => `- ${f}`).join('\n')}

## Inferred Observations
${report.inferredObservations.map((i) => `- ${i}`).join('\n')}
`;

    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleCopyJson = () => {
    if (!report) return;
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const getResilienceColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40';
    if (score >= 60) return 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40';
    if (score >= 40) return 'text-amber-400 border-amber-500/40 bg-amber-950/40';
    return 'text-rose-400 border-rose-500/40 bg-rose-950/40';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/50';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      default:
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50';
    }
  };

  if (!report && !isAnalyzing) {
    return (
      <div className="bg-gravity-900/60 border border-gravity-800 rounded-2xl p-12 text-center backdrop-blur-sm space-y-6">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
          <BrainCircuit className="h-8 w-8 animate-pulse" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-xl font-bold text-white tracking-tight">AI Discovery Engine Standby</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            Execute the epidemic simulation, then initialize discovery synthesis to extract empirical hypotheses, score society resilience, and formulate targeted intervention policies.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onRunAnalysis(preferOllama)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-gravity-950 font-bold text-xs font-mono flex items-center space-x-2 shadow-glow-cyan hover:opacity-95 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Synthesize Discovery Report</span>
          </button>
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gravity-950 border border-gravity-800 text-[11px] font-mono text-slate-400">
          <Cpu className="h-3.5 w-3.5 text-cyan-400" />
          <span>Local Ollama: </span>
          <span className={ollamaAvailable ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
            {ollamaAvailable === null ? 'Probing localhost:11434...' : ollamaAvailable ? 'Active (Llama 3.2 3B)' : 'Offline (Deterministic Fallback Ready)'}
          </span>
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="bg-gravity-900/60 border border-gravity-800 rounded-2xl p-16 text-center backdrop-blur-sm space-y-6">
        <div className="relative h-16 w-16 mx-auto">
          <div className="absolute inset-0 rounded-2xl bg-cyan-500/20 animate-ping"></div>
          <div className="relative h-16 w-16 rounded-2xl bg-cyan-950/80 border border-cyan-500 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white tracking-tight">Computing Computational Social Science Insights...</h3>
          <p className="text-xs text-slate-400 font-mono">
            Evaluating topological contagion, dyadic trust resistance, Asch conformity cascades, and generating policy interventions.
          </p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const filteredCards = selectedCategory === 'all'
    ? report.hypothesisCards
    : report.hypothesisCards.filter((c) => c.category === selectedCategory);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Controls & Status Bar */}
      <div className="bg-gravity-900/70 border border-gravity-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Discovery & Intervention Report
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gravity-950 border border-gravity-700 text-slate-400">
                {report.id}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400 mt-0.5">
              <span className="flex items-center space-x-1">
                <Cpu className="h-3 w-3 text-cyan-400" />
                <span>Engine: </span>
                <strong className={report.generatorSource.includes('ollama') ? 'text-purple-400' : 'text-emerald-400'}>
                  {report.generatorSource.includes('ollama') ? 'Ollama Llama 3.2 3B (Local)' : 'Deterministic Social Science Engine'}
                </strong>
              </span>
              <span>•</span>
              <span>N={report.telemetry.populationSize} Nodes</span>
              <span>•</span>
              <span>{report.hypothesisCards.length} Empirical Hypotheses</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <label className="hidden md:flex items-center space-x-2 text-[11px] font-mono text-slate-300 mr-2 cursor-pointer">
            <input
              type="checkbox"
              checked={preferOllama}
              onChange={(e) => setPreferOllama(e.target.checked)}
              className="rounded bg-gravity-950 border-gravity-700 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <span>Prefer Ollama</span>
          </label>

          <button
            onClick={() => onRunAnalysis(preferOllama)}
            className="px-3 py-1.5 rounded-lg bg-gravity-800 hover:bg-gravity-700 border border-gravity-700 text-xs font-mono text-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Re-run pipeline"
          >
            <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
            <span>Re-analyze</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="px-3 py-1.5 rounded-lg bg-gravity-800 hover:bg-gravity-700 border border-gravity-700 text-xs font-mono text-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Copy as formatted Markdown report"
          >
            {copiedMd ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
            <span>{copiedMd ? 'Copied MD' : 'Copy MD'}</span>
          </button>

          <button
            onClick={handleCopyJson}
            className="px-3 py-1.5 rounded-lg bg-gravity-800 hover:bg-gravity-700 border border-gravity-700 text-xs font-mono text-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Export full JSON payload"
          >
            {copiedJson ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Download className="h-3.5 w-3.5 text-slate-400" />}
            <span>{copiedJson ? 'Copied JSON' : 'JSON'}</span>
          </button>
        </div>
      </div>

      {/* Hero: Top Discovery Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cyan-950/40 via-gravity-900/90 to-emerald-950/30 border border-cyan-500/30 rounded-2xl p-6 backdrop-blur-sm shadow-glow-cyan">
        <div className="flex items-start space-x-4">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5" />
              <span>Top Empirical Social Science Discovery</span>
            </div>
            <h3 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
              "{report.topDiscovery}"
            </h3>
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              Based on network diffusion dynamics across {report.telemetry.communityCount} communities with an initial rumor fear-salience of {(report.telemetry.rumorFearSalience * 100).toFixed(0)}%.
            </p>
          </div>
        </div>
      </div>

      {/* Society Resilience Score & Sub-dimensions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Overall Score Gauge */}
        <div className="lg:col-span-4 bg-gravity-900/60 border border-gravity-800 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-sm">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono uppercase text-slate-400">Society Resilience Score</span>
              <span className={`text-xs font-mono px-2 py-0.5 rounded border ${getResilienceColor(report.resilienceScore.overall)}`}>
                {report.resilienceScore.rating}
              </span>
            </div>
            <div className="flex items-baseline space-x-2 pt-2">
              <span className="text-5xl font-extrabold font-mono text-white">
                {report.resilienceScore.overall}
              </span>
              <span className="text-slate-500 font-mono text-lg">/ 100</span>
            </div>
            <div className="w-full bg-gravity-950 h-2.5 rounded-full overflow-hidden border border-gravity-800 mt-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  report.resilienceScore.overall >= 75
                    ? 'bg-emerald-400'
                    : report.resilienceScore.overall >= 50
                    ? 'bg-cyan-400'
                    : report.resilienceScore.overall >= 30
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${report.resilienceScore.overall}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-4 border-t border-gravity-800/80 mt-4">
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              {report.resilienceScore.explanation}
            </p>
          </div>
        </div>

        {/* 4 Sub-Score Bars */}
        <div className="lg:col-span-8 bg-gravity-900/60 border border-gravity-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gravity-800 pb-3">
            <h4 className="text-xs font-mono uppercase text-white font-bold flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              <span>Resilience Dimensional Breakdown</span>
            </h4>
            <span className="text-[11px] font-mono text-slate-400">4-Factor Evaluation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Epistemic Trust Defense */}
            <div className="bg-gravity-950/70 border border-gravity-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Epistemic Defense
                </span>
                <span className="text-emerald-400 font-bold">{report.resilienceScore.subScores.epistemicTrustDefense}%</span>
              </div>
              <div className="w-full bg-gravity-900 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${report.resilienceScore.subScores.epistemicTrustDefense}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Healthy skepticism & baseline trust integrity.</p>
            </div>

            {/* Topological Containment */}
            <div className="bg-gravity-950/70 border border-gravity-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-cyan-400" />
                  Topological Containment
                </span>
                <span className="text-cyan-400 font-bold">{report.resilienceScore.subScores.topologicalContainment}%</span>
              </div>
              <div className="w-full bg-gravity-900 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full"
                  style={{ width: `${report.resilienceScore.subScores.topologicalContainment}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Modular clustering restricting cross-group leakage.</p>
            </div>

            {/* Emotional Composure */}
            <div className="bg-gravity-950/70 border border-gravity-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-rose-400" />
                  Emotional Composure
                </span>
                <span className="text-rose-400 font-bold">{report.resilienceScore.subScores.emotionalComposure}%</span>
              </div>
              <div className="w-full bg-gravity-900 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-400 rounded-full"
                  style={{ width: `${report.resilienceScore.subScores.emotionalComposure}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Resistance to sensational fear/panic exploitation.</p>
            </div>

            {/* Intervention Receptivity */}
            <div className="bg-gravity-950/70 border border-gravity-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1">
                  <TrendingDown className="h-3.5 w-3.5 text-amber-400" />
                  Intervention Receptivity
                </span>
                <span className="text-amber-400 font-bold">{report.resilienceScore.subScores.interventionReceptivity}%</span>
              </div>
              <div className="w-full bg-gravity-900 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${report.resilienceScore.subScores.interventionReceptivity}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Rapidity & depth of corrective fact-check adoption.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Policy Intervention Recommendation Card */}
      <div className="bg-gravity-900/80 border border-emerald-500/40 rounded-2xl p-6 backdrop-blur-sm shadow-glow-emerald space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gravity-800 pb-3">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Optimal Counter-Intervention Policy
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${getPriorityBadge(report.intervention.priority)}`}>
              PRIORITY: {report.intervention.priority}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gravity-950 border border-gravity-800 text-slate-400">
              TARGET: {report.intervention.targetType.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-base font-bold text-emerald-300 font-mono">
            {report.intervention.title}
          </h4>
          <p className="text-xs text-slate-300 font-mono leading-relaxed">
            {report.intervention.rationale}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-gravity-950/70 border border-gravity-800 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 block flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              Projected Empirical Impact
            </span>
            <p className="text-xs text-emerald-400 font-mono font-medium">
              {report.intervention.expectedImpact}
            </p>
          </div>

          <div className="bg-gravity-950/70 border border-gravity-800 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 block flex items-center gap-1">
              <FlaskConical className="h-3 w-3 text-cyan-400" />
              Simulation Recipe
            </span>
            <p className="text-xs text-slate-300 font-mono">
              {report.intervention.simulationRecipe}
            </p>
          </div>
        </div>
      </div>

      {/* Executive Summary Markdown Block */}
      <div className="bg-gravity-900/60 border border-gravity-800 rounded-2xl p-6 backdrop-blur-sm space-y-3">
        <div className="flex justify-between items-center border-b border-gravity-800 pb-3">
          <h4 className="text-xs font-mono uppercase text-white font-bold flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-purple-400" />
            <span>Executive Research Dispatch</span>
          </h4>
          <span className="text-[10px] font-mono text-slate-400">
            Synthesized {new Date(report.generatedAt).toLocaleTimeString()}
          </span>
        </div>
        <div className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-line bg-gravity-950/60 p-4 rounded-xl border border-gravity-800">
          {report.executiveSummary}
        </div>
      </div>

      {/* Empirical Hypothesis Cards Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gravity-800 pb-3">
          <div>
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <span>Computational Social Science Hypotheses ({report.hypothesisCards.length})</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Empirically grounded causal mechanisms linking network topology to behavioral adoption.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono">
            {['all', 'bridge_amplification', 'trust_resilience', 'influencer_reach', 'conformity_threshold', 'emotional_contagion'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg border transition-colors capitalize cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                    : 'bg-gravity-950/60 border-gravity-800 text-slate-400 hover:border-gravity-700'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCards.map((card) => {
            const isExpanded = expandedCardId === card.id;
            return (
              <div
                key={card.id}
                className="bg-gravity-900/70 border border-gravity-800 hover:border-cyan-500/40 rounded-2xl p-5 backdrop-blur-sm transition-all space-y-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-gravity-950 border border-gravity-800 text-cyan-400 font-semibold">
                      {card.category.replace('_', ' ')}
                    </span>
                    <h4 className="text-sm font-bold text-white tracking-tight mt-1">
                      {card.title}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold block">
                      {(card.confidence * 100).toFixed(0)}% {card.confidenceLabel}
                    </span>
                  </div>
                </div>

                {/* Evidence Snapshot */}
                <div className="bg-gravity-950/80 border border-gravity-800/80 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
                    Empirical Evidence:
                  </span>
                  <p className="text-xs text-slate-200 font-mono">
                    {card.evidence}
                  </p>
                </div>

                {/* Causal Mechanism */}
                <div className="space-y-1 text-xs font-mono">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Causal Mechanism:
                  </span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {card.mechanism}
                  </p>
                </div>

                {/* Collapsible Follow-Up Experiment */}
                <div className="pt-2 border-t border-gravity-800/80">
                  <button
                    onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                    className="flex items-center justify-between w-full text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <span>Suggested Counterfactual Experiment</span>
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 p-3 rounded-lg bg-gravity-950 border border-cyan-500/30 text-xs font-mono text-slate-300 animate-fadeIn">
                      {card.suggestedExperiment}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Epistemological Separation: Measured Facts vs Inferred Hypotheses */}
      <div className="bg-gravity-900/60 border border-gravity-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gravity-800 pb-3">
          <div>
            <h4 className="text-xs font-mono uppercase text-white font-bold flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-emerald-400" />
              <span>Rigorous Epistemological Separation</span>
            </h4>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Separating ground-truth empirical measurements from causal social science inferences.
            </p>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono">
            <button
              onClick={() => setEpistemologyTab('facts')}
              className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                epistemologyTab === 'facts'
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                  : 'bg-gravity-950/60 border-gravity-800 text-slate-400'
              }`}
            >
              Measured Facts ({report.measuredFacts.length})
            </button>
            <button
              onClick={() => setEpistemologyTab('inferences')}
              className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                epistemologyTab === 'inferences'
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold'
                  : 'bg-gravity-950/60 border-gravity-800 text-slate-400'
              }`}
            >
              Inferred Observations ({report.inferredObservations.length})
            </button>
            <button
              onClick={() => setEpistemologyTab('predictions')}
              className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                epistemologyTab === 'predictions'
                  ? 'bg-purple-950/60 border-purple-500 text-purple-300 font-bold'
                  : 'bg-gravity-950/60 border-gravity-800 text-slate-400'
              }`}
            >
              Future Hypotheses ({report.futureHypotheses.length})
            </button>
          </div>
        </div>

        <div className="bg-gravity-950/70 border border-gravity-800/80 rounded-xl p-4">
          {epistemologyTab === 'facts' && (
            <ul className="space-y-2">
              {report.measuredFacts.map((fact, idx) => (
                <li key={idx} className="text-xs font-mono text-slate-300 flex items-start space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          )}

          {epistemologyTab === 'inferences' && (
            <ul className="space-y-2">
              {report.inferredObservations.map((inf, idx) => (
                <li key={idx} className="text-xs font-mono text-slate-300 flex items-start space-x-2">
                  <BrainCircuit className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{inf}</span>
                </li>
              ))}
            </ul>
          )}

          {epistemologyTab === 'predictions' && (
            <ul className="space-y-2">
              {report.futureHypotheses.map((pred, idx) => (
                <li key={idx} className="text-xs font-mono text-slate-300 flex items-start space-x-2">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>{pred}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
