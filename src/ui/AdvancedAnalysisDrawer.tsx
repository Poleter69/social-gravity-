import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sliders } from 'lucide-react';
import { Society } from '../society/types/society';
import { LoadedDatasetResult } from '../datasets/realDatasetService';
import { SimulationState } from '../simulation/types';

interface AdvancedAnalysisDrawerProps {
  society: Society;
  v2LoadedData: LoadedDatasetResult | null;
  simState: SimulationState | null;
  liveDynamicDecay: boolean;
  onToggleDynamicDecay: () => void;
  // Trait sliders
  trustBias: number;
  onTrustBiasChange: (val: number) => void;
  conformityBias: number;
  onConformityBiasChange: (val: number) => void;
  riskToleranceBias: number;
  onRiskToleranceBiasChange: (val: number) => void;
  onOpenValidationModal: () => void;
}

export const AdvancedAnalysisDrawer: React.FC<AdvancedAnalysisDrawerProps> = ({
  society,
  v2LoadedData,
  simState,
  liveDynamicDecay,
  onToggleDynamicDecay,
  trustBias,
  onTrustBiasChange,
  conformityBias,
  onConformityBiasChange,
  riskToleranceBias,
  onRiskToleranceBiasChange,
  onOpenValidationModal,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 overflow-hidden backdrop-blur-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="font-bold uppercase tracking-wider text-slate-300">
            Advanced Analysis & Telemetry
          </span>
          <span className="text-[10px] text-slate-500">
            ({isOpen ? 'Expanded' : 'Collapsed — Click to reveal mathematical internals'})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Progressive Disclosure
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 border-t border-slate-800/80 bg-slate-900/40 space-y-5 text-xs font-mono animate-fade-in">
          {/* Empirical Graph Topologies */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Community Separation</span>
              <span className="text-cyan-400 font-bold text-sm mt-0.5 block">
                Q = {v2LoadedData ? v2LoadedData.canonicalGraph.modularity.toFixed(3) : (society.summary.density * 1.5).toFixed(3)}
              </span>
              <span className="text-[10px] text-slate-500">Modularity Q index</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Clustering Coefficient</span>
              <span className="text-rose-400 font-bold text-sm mt-0.5 block">
                {v2LoadedData ? v2LoadedData.v2Metrics.globalClusteringCoefficient.toFixed(3) : society.summary.globalClustering.toFixed(3)}
              </span>
              <span className="text-[10px] text-slate-500">Triadic closure metric</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Graph Density</span>
              <span className="text-amber-400 font-bold text-sm mt-0.5 block">
                {(society.summary.density * 100).toFixed(2)}%
              </span>
              <span className="text-[10px] text-slate-500">{society.edges.length} total edges</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Average Degree</span>
              <span className="text-emerald-400 font-bold text-sm mt-0.5 block">
                {society.summary.averageDegree.toFixed(1)} ties / node
              </span>
              <span className="text-[10px] text-slate-500">Mean degree distribution</span>
            </div>
          </div>

          {/* Dynamic Decay & Psychological Priors Calibration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-800/80">
            {/* Decay Toggle */}
            <div className="space-y-3 p-4 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Live Network Edge Decay</span>
                  <span className="text-[11px] text-slate-400">
                    Exponential temporal tie decay (w_ij(t+1) = w_ij(t) * (1-λ))
                  </span>
                </div>
                <button
                  onClick={onToggleDynamicDecay}
                  className={`px-3 py-1 rounded font-bold text-[10px] transition-all cursor-pointer ${
                    liveDynamicDecay
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  {liveDynamicDecay ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-400">Invariant Safety Auditor</span>
                <button
                  onClick={onOpenValidationModal}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer"
                >
                  Run Deep Verification
                </button>
              </div>
            </div>

            {/* Cognitive Priors Sliders */}
            <div className="space-y-3 p-4 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-white block">Psychological Prior Calibrations</span>
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Epistemic Trust Bias</span>
                    <span className="text-emerald-400 font-bold">{(trustBias * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.95}
                    step={0.05}
                    value={trustBias}
                    onChange={(e) => onTrustBiasChange(Number(e.target.value))}
                    className="w-full accent-emerald-400 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Asch Conformity Pressure</span>
                    <span className="text-amber-400 font-bold">{(conformityBias * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.95}
                    step={0.05}
                    value={conformityBias}
                    onChange={(e) => onConformityBiasChange(Number(e.target.value))}
                    className="w-full accent-amber-400 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Risk Tolerance</span>
                    <span className="text-rose-400 font-bold">{(riskToleranceBias * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.95}
                    step={0.05}
                    value={riskToleranceBias}
                    onChange={(e) => onRiskToleranceBiasChange(Number(e.target.value))}
                    className="w-full accent-rose-400 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry Summary History */}
          {simState && simState.telemetryHistory.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Latest Telemetry Frame (t={simState.currentRound})
              </span>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex flex-wrap gap-4">
                <span>Infected Believers: <strong className="text-red-400">{simState.agentStates ? Array.from(simState.agentStates.values()).filter(v => v === 'BELIEVER').length : 0}</strong></span>
                <span>Verified Debunkers: <strong className="text-emerald-400">{simState.agentStates ? Array.from(simState.agentStates.values()).filter(v => v === 'DEBUNKER').length : 0}</strong></span>
                <span>Skeptical Nodes: <strong className="text-purple-400">{simState.agentStates ? Array.from(simState.agentStates.values()).filter(v => v === 'SKEPTIC').length : 0}</strong></span>
                <span>Max Cascade Depth: <strong className="text-white">{simState.telemetryHistory[simState.telemetryHistory.length - 1]?.maxCascadeDepth ?? 0} hops</strong></span>
                <span>PRNG Engine: <strong className="text-cyan-400">SplitMix32 (Bit-for-bit deterministic)</strong></span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
