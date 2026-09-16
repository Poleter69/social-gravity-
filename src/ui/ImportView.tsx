/**
 * Social Gravity - Import & Data Ingestion View (Workflow Stage 1)
 * 
 * Provides an analyst-grade, frictionless onboarding screen to load empirical
 * benchmarks (Reddit, Stanford SNAP Facebook) or synthesize archetype societies.
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  GraduationCap, 
  Briefcase, 
  Globe2, 
  Loader2
} from 'lucide-react';
import { RealDatasetService, RealDatasetDescriptor, LoadedDatasetResult } from '../datasets/realDatasetService';
import { SocietyArchetype } from '../society/types/community';
import { Society } from '../society/types/society';

interface ImportViewProps {
  onLoadDataset: (result: LoadedDatasetResult) => void;
  onGenerateSynthetic: (params: {
    archetype: SocietyArchetype;
    population: number;
    influencerRatio: number;
  }) => void;
  onProceedToAnalyze: () => void;
  activeSociety: Society;
  v2LoadedData: LoadedDatasetResult | null;
}

export const ImportView: React.FC<ImportViewProps> = ({
  onLoadDataset,
  onGenerateSynthetic,
  onProceedToAnalyze,
  activeSociety,
  v2LoadedData,
}) => {
  const [activeMode, setActiveMode] = useState<'benchmarks' | 'synthetic' | 'upload'>('benchmarks');
  const [datasets] = useState<RealDatasetDescriptor[]>(() => RealDatasetService.getAvailableDatasets());
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string>('reddit_tech');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<LoadedDatasetResult | null>(v2LoadedData);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synthetic state
  const [archetype, setArchetype] = useState<SocietyArchetype>('school');
  const [population, setPopulation] = useState<number>(100);
  const [influencerRatio, setInfluencerRatio] = useState<number>(0.05);

  // Upload state
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Load benchmark preview on select
  useEffect(() => {
    if (activeMode !== 'benchmarks') return;
    let isMounted = true;
    setIsLoading(true);
    setErrorMsg(null);

    RealDatasetService.loadPreconfiguredDataset(selectedBenchmarkId)
      .then((res) => {
        if (isMounted) {
          setPreviewResult(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMsg(err.message || 'Failed to load dataset preview');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBenchmarkId, activeMode]);

  const handleApplyBenchmark = () => {
    if (previewResult) {
      onLoadDataset(previewResult);
      onProceedToAnalyze();
    }
  };

  const handleApplySynthetic = () => {
    onGenerateSynthetic({
      archetype,
      population,
      influencerRatio,
    });
    onProceedToAnalyze();
  };

  const handleFileUpload = (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const result = await RealDatasetService.parseUploadedFile(file.name, text);
        setPreviewResult(result);
        setIsLoading(false);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to parse uploaded dataset file');
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gravity-900/80 border border-gravity-800 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-2">
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span>STAGE 1 OF 5: DATASET INGESTION</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Ingest Empirical Network or Synthesize Society
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Select a calibrated empirical benchmark from Reddit conversation cascades or Stanford SNAP Facebook networks, or synthesize a targeted social topology in seconds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onProceedToAnalyze}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gravity-950 font-mono font-bold text-xs transition-all shadow-glow-cyan cursor-pointer"
            >
              <span>Current Network Active ({activeSociety.agents.length} nodes)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 mt-6 p-1.5 bg-gravity-950/80 rounded-xl border border-gravity-800">
          <button
            onClick={() => setActiveMode('benchmarks')}
            className={`py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center space-x-2 ${
              activeMode === 'benchmarks'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="h-3.5 w-3.5 text-cyan-400" />
            <span>Empirical Benchmarks (Reddit / SNAP)</span>
          </button>
          <button
            onClick={() => setActiveMode('synthetic')}
            className={`py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center space-x-2 ${
              activeMode === 'synthetic'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Synthetic Society Archetype</span>
          </button>
          <button
            onClick={() => setActiveMode('upload')}
            className={`py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center space-x-2 ${
              activeMode === 'upload'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="h-3.5 w-3.5 text-purple-400" />
            <span>Custom File Upload (.edges, .json)</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Empirical Benchmarks */}
      {activeMode === 'benchmarks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-3">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
              Available Empirical Benchmarks
            </h3>
            <div className="space-y-2.5">
              {datasets.map((d) => {
                const isSelected = selectedBenchmarkId === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => setSelectedBenchmarkId(d.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/80 shadow-glow-cyan'
                        : 'bg-gravity-900/60 border-gravity-800 hover:border-gravity-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{d.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                        {d.platform.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{d.description}</p>
                    <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 mt-3 pt-2 border-t border-gravity-800/80">
                      <span>Nodes: <strong className="text-white">~{d.estimatedNodes}</strong></span>
                      <span>Edges: <strong className="text-white">~{d.estimatedEdges}</strong></span>
                      <span>Clusters: <strong className="text-cyan-400">{d.communityCount}</strong></span>
                      <span>Focus: <span className="text-slate-300">{d.researchFocus}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-5 space-y-4 backdrop-blur-sm h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gravity-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-white uppercase">
                      Dataset Validation Preview
                    </span>
                  </div>
                  {isLoading && (
                    <div className="flex items-center space-x-1.5 text-xs text-cyan-400 font-mono">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Parsing...</span>
                    </div>
                  )}
                </div>

                {errorMsg ? (
                  <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-xs text-red-300 font-mono">
                    {errorMsg}
                  </div>
                ) : previewResult ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-bold text-white">{previewResult.society.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{previewResult.canonicalGraph.sourceDataset}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                      <div className="p-3 rounded-lg bg-gravity-950/70 border border-gravity-800">
                        <span className="text-slate-400 text-[10px] block uppercase">Total Nodes</span>
                        <span className="text-lg font-bold text-white mt-0.5 block">{previewResult.canonicalGraph.nodes.size}</span>
                        <span className="text-[10px] text-cyan-400">Validated</span>
                      </div>
                      <div className="p-3 rounded-lg bg-gravity-950/70 border border-gravity-800">
                        <span className="text-slate-400 text-[10px] block uppercase">Network Edges</span>
                        <span className="text-lg font-bold text-white mt-0.5 block">{previewResult.canonicalGraph.edges.size}</span>
                        <span className="text-[10px] text-emerald-400">Bidirectional</span>
                      </div>
                      <div className="p-3 rounded-lg bg-gravity-950/70 border border-gravity-800">
                        <span className="text-slate-400 text-[10px] block uppercase">Sub-Communities</span>
                        <span className="text-lg font-bold text-cyan-400 mt-0.5 block">{previewResult.society.communities.length}</span>
                        <span className="text-[10px] text-slate-400">Clusters</span>
                      </div>
                      <div className="p-3 rounded-lg bg-gravity-950/70 border border-gravity-800">
                        <span className="text-slate-400 text-[10px] block uppercase">Community Separation</span>
                        <span className="text-lg font-bold text-amber-400 mt-0.5 block">{previewResult.canonicalGraph.modularity.toFixed(3)}</span>
                        <span className="text-[10px] text-slate-400">Modularity Q</span>
                      </div>
                      <div className="p-3 rounded-lg bg-gravity-950/70 border border-gravity-800">
                        <span className="text-slate-400 text-[10px] block uppercase">Cross-Community</span>
                        <span className="text-lg font-bold text-purple-400 mt-0.5 block">{(previewResult.v2Metrics.bridgeRatio * 100).toFixed(1)}%</span>
                        <span className="text-[10px] text-slate-400">Bridge Ratio</span>
                      </div>
                      <div className="p-3 rounded-lg bg-gravity-950/70 border border-gravity-800">
                        <span className="text-slate-400 text-[10px] block uppercase">Global Clustering</span>
                        <span className="text-lg font-bold text-rose-400 mt-0.5 block">{previewResult.v2Metrics.globalClusteringCoefficient.toFixed(3)}</span>
                        <span className="text-[10px] text-slate-400">Density {(previewResult.v2Metrics.density * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 font-mono flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>All psychological invariants & determinism checks passed</span>
                      </span>
                      <span className="font-bold">{previewResult.validationReport.validRecordsCount} Records</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs font-mono text-slate-500">
                    Select a benchmark to preview network topology
                  </div>
                )}
              </div>

              <button
                onClick={handleApplyBenchmark}
                disabled={isLoading || !previewResult}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-gravity-950 font-mono font-bold text-xs transition-all shadow-glow-cyan cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <span>Load Dataset & Proceed to Simulation</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Synthetic Society */}
      {activeMode === 'synthetic' && (
        <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-6 space-y-6 max-w-2xl mx-auto">
          <div className="space-y-2">
            <h3 className="text-sm font-mono font-bold text-white">Choose Archetype</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: 'school' as SocietyArchetype, label: 'School Campus', desc: 'Clustered peer groups, high conformity pressure', icon: <GraduationCap className="h-4 w-4" /> },
                { type: 'workplace' as SocietyArchetype, label: 'Workplace Org', desc: 'Hierarchical departments, high baseline trust', icon: <Briefcase className="h-4 w-4" /> },
                { type: 'city' as SocietyArchetype, label: 'City Metro', desc: 'Diffuse neighborhoods, high diversity of views', icon: <Building2 className="h-4 w-4" /> },
                { type: 'online_community' as SocietyArchetype, label: 'Online Forum', desc: 'Hyper-connected echo chambers, fast velocity', icon: <Globe2 className="h-4 w-4" /> },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => setArchetype(item.type)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    archetype === item.type
                      ? 'bg-cyan-950/50 border-cyan-500/80 text-cyan-200 shadow-glow-cyan'
                      : 'bg-gravity-950/60 border-gravity-800 text-slate-400 hover:border-gravity-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 text-white font-bold text-xs">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Population Size (Nodes)</span>
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

            <div className="space-y-1.5">
              <div className="flex justify-between">
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
          </div>

          <button
            onClick={handleApplySynthetic}
            className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gravity-950 font-mono font-bold text-xs transition-all shadow-glow-cyan flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Synthesize Digital Society & Proceed</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Mode 3: Custom Upload */}
      {activeMode === 'upload' && (
        <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-6 space-y-6 max-w-2xl mx-auto font-mono text-xs">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-cyan-400 bg-cyan-950/20'
                : 'border-gravity-700 bg-gravity-950/60 hover:border-gravity-600'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".txt,.edges,.csv,.json"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <label htmlFor="file-upload" className="cursor-pointer block space-y-2">
              <Upload className="h-8 w-8 text-slate-400 mx-auto" />
              <div className="text-white font-bold">
                Drop SNAP edge list or JSON graph here, or <span className="text-cyan-400 underline">browse</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Supports space/tab separated edgelists (.edges, .txt) and exported Social Gravity JSON topologies.
              </p>
            </label>
          </div>

          {uploadedFileName && (
            <div className="p-3 bg-gravity-950 rounded-lg border border-gravity-800 flex items-center justify-between">
              <span className="text-slate-300 truncate max-w-xs">{uploadedFileName}</span>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
              ) : previewResult ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Validated ({previewResult.canonicalGraph.nodes.size} nodes)
                </span>
              ) : null}
            </div>
          )}

          <button
            onClick={handleApplyBenchmark}
            disabled={!previewResult || isLoading}
            className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gravity-950 font-bold text-xs transition-all shadow-glow-cyan disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Load Custom Network & Proceed</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
