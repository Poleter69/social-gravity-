/**
 * Social Gravity - Real Dataset Ingestion & Loader Modal
 *
 * Provides a Palantir-styled interface for selecting curated Reddit & Facebook
 * datasets or uploading custom files with live validation and topology previews.
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  X, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { 
  RealDatasetService, 
  RealDatasetDescriptor, 
  LoadedDatasetResult 
} from '../realDatasetService';

interface RealDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetLoaded: (result: LoadedDatasetResult) => void;
}

export const RealDatasetModal: React.FC<RealDatasetModalProps> = ({
  isOpen,
  onClose,
  onDatasetLoaded,
}) => {
  const [activeTab, setActiveTab] = useState<'benchmarks' | 'upload'>('benchmarks');
  const [datasets] = useState<RealDatasetDescriptor[]>(() => RealDatasetService.getAvailableDatasets());
  const [selectedId, setSelectedId] = useState<string>('reddit_tech');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<LoadedDatasetResult | null>(null);

  // File upload state
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Load selected benchmark preview
  useEffect(() => {
    if (!isOpen || activeTab !== 'benchmarks') return;

    let isMounted = true;
    setIsLoading(true);
    setErrorMsg(null);

    RealDatasetService.loadPreconfiguredDataset(selectedId)
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
  }, [selectedId, isOpen, activeTab]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (previewResult) {
      onDatasetLoaded(previewResult);
      onClose();
    }
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
    reader.onerror = () => {
      setErrorMsg('Error reading file from disk');
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gravity-950/80 backdrop-blur-md">
      <div className="bg-gravity-900 border border-cyan-500/30 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gravity-800 flex items-center justify-between bg-gravity-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>LOAD REAL-WORLD DATASET</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  V2 INGESTION
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Import authentic Reddit conversation trees, SNAP Facebook networks, or custom graph exports.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-gravity-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gravity-800 bg-gravity-950/40 px-6 pt-2">
          <button
            onClick={() => { setActiveTab('benchmarks'); setErrorMsg(null); }}
            className={`pb-2.5 px-4 text-xs font-mono font-semibold transition-all border-b-2 ${
              activeTab === 'benchmarks'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Curated Empirical Benchmarks
          </button>
          <button
            onClick={() => { setActiveTab('upload'); setErrorMsg(null); }}
            className={`pb-2.5 px-4 text-xs font-mono font-semibold transition-all border-b-2 ${
              activeTab === 'upload'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Custom File Import (.json / .edges / .txt)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 font-mono text-xs">
          {activeTab === 'benchmarks' ? (
            <div className="space-y-4">
              <label className="text-slate-400 block font-semibold">Select Research Dataset:</label>
              <div className="grid grid-cols-1 gap-2.5">
                {datasets.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedId === d.id
                        ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-glow-cyan'
                        : 'bg-gravity-950/50 border-gravity-800 text-slate-400 hover:border-gravity-700 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm font-sans text-white">{d.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-gravity-800 text-cyan-300 border border-gravity-700">
                        {d.badge}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs font-sans mb-2">{d.description}</p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
                      <span>Nodes: <strong className="text-cyan-400">{d.estimatedNodes}</strong></span>
                      <span>Edges: <strong className="text-amber-400">{d.estimatedEdges}</strong></span>
                      <span>Focus: <span className="text-slate-300">{d.researchFocus}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragActive
                    ? 'border-cyan-400 bg-cyan-950/20'
                    : 'border-gravity-800 bg-gravity-950/40 hover:border-gravity-700'
                }`}
              >
                <Upload className="h-8 w-8 mx-auto mb-3 text-cyan-400" />
                <p className="text-sm font-sans text-white font-bold mb-1">
                  Drag and drop your dataset file here
                </p>
                <p className="text-xs text-slate-400 font-sans mb-4">
                  Supports Stanford SNAP edge-lists (<code className="text-cyan-300">.edges</code>, <code className="text-cyan-300">.txt</code>) and Reddit/Canonical exports (<code className="text-cyan-300">.json</code>)
                </p>
                <label className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gravity-800 hover:bg-gravity-700 border border-gravity-700 text-white cursor-pointer transition-colors">
                  <FileText className="h-4 w-4 text-cyan-400" />
                  <span>Browse Files</span>
                  <input
                    type="file"
                    accept=".json,.edges,.txt,.circles"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
                {uploadedFileName && (
                  <div className="mt-3 text-cyan-400 text-xs font-mono">
                    Selected: <strong>{uploadedFileName}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center p-6 space-x-3 text-cyan-400 bg-gravity-950/40 rounded-xl border border-gravity-800">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Ingesting and computing graph metrics...</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/50 text-red-400 flex items-start space-x-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <strong className="block font-bold">Ingestion Error:</strong>
                <span className="font-sans text-xs">{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Dataset Metadata Preview Card */}
          {previewResult && !isLoading && !errorMsg && (
            <div className="bg-gravity-950/80 border border-gravity-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-gravity-800 pb-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="font-bold text-white uppercase">{previewResult.society.name}</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded font-mono">
                  VALIDATED ({previewResult.validationReport.validRecordsCount} records)
                </span>
              </div>

              {/* Topology Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
                <div className="bg-gravity-900/90 p-2.5 rounded-lg border border-gravity-800">
                  <span className="text-slate-500 block">Total Nodes</span>
                  <span className="text-base font-bold text-white">{previewResult.society.summary.totalPopulation}</span>
                </div>
                <div className="bg-gravity-900/90 p-2.5 rounded-lg border border-gravity-800">
                  <span className="text-slate-500 block">Total Edges</span>
                  <span className="text-base font-bold text-amber-400">{previewResult.society.edges.length}</span>
                </div>
                <div className="bg-gravity-900/90 p-2.5 rounded-lg border border-gravity-800">
                  <span className="text-slate-500 block">Modularity Q</span>
                  <span className="text-base font-bold text-cyan-400">{previewResult.canonicalGraph.modularity.toFixed(3)}</span>
                </div>
                <div className="bg-gravity-900/90 p-2.5 rounded-lg border border-gravity-800">
                  <span className="text-slate-500 block">Communities</span>
                  <span className="text-base font-bold text-emerald-400">{previewResult.society.summary.communityCount}</span>
                </div>
              </div>

              {/* Dynamic Metrics Secondary Row */}
              <div className="flex flex-wrap gap-4 text-[11px] text-slate-400 pt-1">
                <span>Density: <strong className="text-slate-200">{(previewResult.society.summary.density * 100).toFixed(2)}%</strong></span>
                <span>Average Degree: <strong className="text-slate-200">{previewResult.society.summary.averageDegree}</strong></span>
                <span>Bridges: <strong className="text-amber-300">{previewResult.society.summary.bridgeNodeCount}</strong></span>
                <span>Influencers: <strong className="text-cyan-300">{previewResult.society.summary.influencerCount}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gravity-800 bg-gravity-950/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gravity-800 hover:bg-gravity-700 text-slate-300 font-mono text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!previewResult || isLoading}
            className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-gravity-800 disabled:text-slate-500 text-gravity-950 font-mono text-xs font-bold transition-all shadow-glow-cyan cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Load Into Simulator</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
