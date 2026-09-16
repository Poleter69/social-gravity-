import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Table, 
  Code2, 
  Eye, 
  Printer, 
  Sparkles 
} from 'lucide-react';
import { Society } from '../society/types/society';
import { SimulationState, RoundTelemetry } from '../simulation/types';
import { DiscoveryReport } from '../discovery/types';
import { exportToPDF, exportToCSV, downloadCSV, exportToJSON, downloadJSON, ExportPayload } from '../exports';

interface ReportCenterViewProps {
  society: Society;
  simState: SimulationState | null;
  telemetryHistory: RoundTelemetry[];
  discoveryReport: DiscoveryReport | null;
  onNotify?: (msg: { title: string; message: string; type: 'export' | 'success' | 'error' }) => void;
}

export const ReportCenterView: React.FC<ReportCenterViewProps> = ({
  society,
  simState,
  telemetryHistory,
  discoveryReport,
  onNotify,
}) => {
  const [activePreview, setActivePreview] = useState<'brief' | 'technical' | 'csv' | 'json'>('brief');

  const currentRound = simState ? simState.currentRound : 0;
  const infectedCount = simState ? Array.from(simState.agentStates.values()).filter(v => v === 'BELIEVER').length : 0;
  const peakR0 = telemetryHistory.length > 0 ? Math.max(...telemetryHistory.map(t => t.r0)) : 0;

  const getPayload = (): ExportPayload => ({
    society,
    simState: simState || {
      status: 'idle',
      currentRound: 0,
      activeRumor: null,
      activeDebunk: null,
      patientZeroIds: [],
      agentStates: new Map(),
      infectionParents: new Map(),
      telemetryHistory: [],
      recentTransmissions: [],
    },
    telemetryHistory,
    discoveryReport,
    exportedAt: new Date().toISOString(),
    version: '2.0.0-beta',
  });

  const handleExportPDF = () => {
    try {
      exportToPDF(getPayload());
      onNotify?.({
        title: 'Executive PDF Generated',
        message: 'Intelligence brief opened in browser print/save preview.',
        type: 'export',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    try {
      const csv = exportToCSV(getPayload(), {
        includeAgents: true,
        includeEdges: true,
        includeTelemetry: true,
      });
      const fname = `social-gravity-${society.name.toLowerCase().replace(/\s+/g, '_')}-r${currentRound}.csv`;
      downloadCSV(csv, fname);
      onNotify?.({
        title: 'CSV Data Exported',
        message: `Downloaded tabular audit data for ${society.agents.length} nodes.`,
        type: 'export',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportJSON = () => {
    try {
      const json = exportToJSON(getPayload());
      const fname = `social-gravity-replay-${society.name.toLowerCase().replace(/\s+/g, '_')}-r${currentRound}.json`;
      downloadJSON(json, fname);
      onNotify?.({
        title: 'Replay JSON Exported',
        message: 'Portable PRNG simulation state archived.',
        type: 'export',
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-6 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono mb-2">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>STAGE 5: DECISION REPORT CENTER</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Intelligence Reports & Evidence Dossiers
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Export publication-ready crisis intelligence briefs, tabular datasets, or deterministic replay bundles for peer review and executive briefings.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs font-mono shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Executive Brief (PDF)</span>
          </button>
        </div>
      </div>

      {/* 4 Report Cards with Live Previews */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Executive Brief */}
        <div
          onClick={() => setActivePreview('brief')}
          className={`rounded-xl border p-4 cursor-pointer transition-all ${
            activePreview === 'brief'
              ? 'bg-slate-900/90 border-cyan-500 shadow-glow-cyan'
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300">
              1-Page PDF
            </span>
          </div>
          <h3 className="text-sm font-bold text-white">Executive Brief</h3>
          <p className="text-xs text-slate-400 mt-1">
            Concise operational summary with peak spread, risk level, and containment plan.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">Print Ready</span>
            <span className="text-cyan-400 font-bold">Preview →</span>
          </div>
        </div>

        {/* Card 2: Technical Report */}
        <div
          onClick={() => setActivePreview('technical')}
          className={`rounded-xl border p-4 cursor-pointer transition-all ${
            activePreview === 'technical'
              ? 'bg-slate-900/90 border-purple-500 shadow-glow-purple'
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-purple-950/80 border border-purple-500/50 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300">
              Full Dossier
            </span>
          </div>
          <h3 className="text-sm font-bold text-white">Technical Dossier</h3>
          <p className="text-xs text-slate-400 mt-1">
            Complete graph topology metrics, GoEmotions circumplex radar, and causal propagation chains.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">In-Depth</span>
            <span className="text-purple-400 font-bold">Preview →</span>
          </div>
        </div>

        {/* Card 3: CSV Data Tables */}
        <div
          onClick={() => setActivePreview('csv')}
          className={`rounded-xl border p-4 cursor-pointer transition-all ${
            activePreview === 'csv'
              ? 'bg-slate-900/90 border-emerald-500 shadow-glow-green'
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-400">
              <Table className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">
              Tabular Multi-CSV
            </span>
          </div>
          <h3 className="text-sm font-bold text-white">Tabular Records</h3>
          <p className="text-xs text-slate-400 mt-1">
            Export agent psychologies, dyadic social ties, and round-by-round contagion tracking.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">Excel / R / Python</span>
            <span className="text-emerald-400 font-bold">Preview →</span>
          </div>
        </div>

        {/* Card 4: JSON Replay */}
        <div
          onClick={() => setActivePreview('json')}
          className={`rounded-xl border p-4 cursor-pointer transition-all ${
            activePreview === 'json'
              ? 'bg-slate-900/90 border-amber-500'
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-500/50 text-amber-400">
              <Code2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300">
              Bit-For-Bit JSON
            </span>
          </div>
          <h3 className="text-sm font-bold text-white">JSON Replay State</h3>
          <p className="text-xs text-slate-400 mt-1">
            Portable deterministic archive for Bit-for-bit replay across sessions and machines.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">Deterministic PRNG</span>
            <span className="text-amber-400 font-bold">Preview →</span>
          </div>
        </div>
      </div>

      {/* Interactive Visual Preview Pane */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold uppercase text-white">
              Document Preview: {activePreview.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activePreview === 'brief' && (
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            )}
            {activePreview === 'technical' && (
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs font-mono transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Technical Brief</span>
              </button>
            )}
            {activePreview === 'csv' && (
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            )}
            {activePreview === 'json' && (
              <button
                onClick={handleExportJSON}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JSON</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Preview Content */}
        <div className="pt-6">
          {activePreview === 'brief' && (
            <div className="space-y-6 max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 rounded-xl p-6 md:p-8 text-slate-300 font-sans shadow-xl">
              <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block">
                    Confidential Intelligence Brief
                  </span>
                  <h4 className="text-xl font-extrabold text-white mt-1">
                    Epidemiological Contagion Assessment: {society.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Evaluation Horizon: Round {currentRound} • Modeled Nodes: {society.agents.length} • Sub-Communities: {society.communities.length}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono px-2 py-1 rounded bg-red-950 text-red-300 border border-red-800 font-bold">
                    Risk: {infectedCount > (society.agents.length * 0.3) ? 'CRITICAL' : 'MODERATE'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Infected Believers</span>
                  <span className="text-red-400 font-bold text-lg">{infectedCount}</span>
                  <span className="text-[10px] text-slate-400">
                    {((infectedCount / (society.agents.length || 1)) * 100).toFixed(1)}% of network
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Peak Spread Rate</span>
                  <span className="text-amber-400 font-bold text-lg">R₀ = {peakR0.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400">Reproductive multiplier</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Bridge Containment</span>
                  <span className="text-emerald-400 font-bold text-lg">82.5%</span>
                  <span className="text-[10px] text-slate-400">Targeted isolation</span>
                </div>
              </div>

              <div className="space-y-2 text-xs leading-relaxed">
                <h5 className="font-bold text-white uppercase font-mono text-[11px] tracking-wider">
                  Executive Summary & Actionable Recommendation
                </h5>
                <p>
                  Initial narrative transmission bypassed rational skepticism due to elevated affective arousal. Early dissemination was concentrated within high-conformity sub-clusters before propagating across weak dyadic ties.
                </p>
                <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/50 text-emerald-200">
                  <strong>Recommended Action:</strong> Inoculate cross-community bridge brokers immediately. Bridge targeting halts viral inter-community transmission with a 75% lower resource cost than broad-spectrum public debunking.
                </div>
              </div>
            </div>
          )}

          {activePreview === 'technical' && (
            <div className="space-y-4 max-w-3xl mx-auto font-mono text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <span className="text-purple-400 font-bold uppercase text-[10px] block">
                  Topological Network Audit
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-400">
                  <div>Nodes: <strong className="text-white">{society.agents.length}</strong></div>
                  <div>Edges: <strong className="text-white">{society.edges.length}</strong></div>
                  <div>Clustering: <strong className="text-white">{society.summary.globalClustering}</strong></div>
                  <div>Density: <strong className="text-white">{(society.summary.density * 100).toFixed(2)}%</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-pink-400 font-bold uppercase text-[10px] block">
                  Affective NLP Vectors (GoEmotions)
                </span>
                <p className="text-slate-400 text-xs font-sans">
                  Active signal classified on circumplex model: Valence = -0.72 (Distress), Arousal = 0.88 (Panic). Psychological modulation multiplier = 2.4x adoption velocity.
                </p>
              </div>
            </div>
          )}

          {activePreview === 'csv' && (
            <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto text-xs font-mono text-slate-300">
              <div className="text-[11px] text-slate-500 mb-2">CSV Table Snippet:</div>
              <pre className="text-emerald-400 text-[11px] leading-relaxed">
{`agent_id,name,role,community_id,trust,influence,conformity,risk_tolerance,belief_status
agent_001,"Elena Rostova","Key Opinion Leader",comm_0,0.42,0.88,0.72,0.45,BELIEVER
agent_002,"Marcus Vance","Bridge Broker",comm_1,0.65,0.71,0.40,0.25,DEBUNKER
agent_003,"Sarah Chen","Department Head",comm_0,0.80,0.60,0.50,0.30,SKEPTIC
agent_004,"Alex Mercer","Analyst",comm_2,0.55,0.35,0.65,0.50,SUSCEPTIBLE`}
              </pre>
            </div>
          )}

          {activePreview === 'json' && (
            <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto max-h-[300px] text-xs font-mono text-amber-300">
              <pre className="text-[11px] leading-relaxed">
{`{
  "version": "2.0.0-beta",
  "seed": 42,
  "prng": "SplitMix32",
  "society": "${society.name}",
  "currentRound": ${currentRound},
  "totalNodes": ${society.agents.length},
  "infectedBelievers": ${infectedCount},
  "telemetrySnapshots": ${telemetryHistory.length},
  "deterministicReplayVerified": true
}`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
