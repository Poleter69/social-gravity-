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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
      <div className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[var(--text)] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-elevated)]/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-[var(--primary)]">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text)] font-mono flex items-center gap-2">
                <span>LOAD REAL-WORLD DATASET</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 font-mono">
                  V2 INGESTION
                </span>
              </h2>
              <p className="text-xs text-[var(--text-tertiary)]">
                Import authentic Reddit conversation trees, SNAP Facebook networks, or custom graph exports.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-tertiary)] hover:text-[var(--text)] p-1 rounded-lg hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[var(--border)] bg-[var(--surface-elevated)]/40 px-6 pt-2">
          <button
            onClick={() => { setActiveTab('benchmarks'); setErrorMsg(null); }}
            className={`pb-2.5 px-4 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'benchmarks'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text)]'
            }`}
          >
            Curated Empirical Benchmarks
          </button>
          <button
            onClick={() => { setActiveTab('upload'); setErrorMsg(null); }}
            className={`pb-2.5 px-4 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text)]'
            }`}
          >
            Custom File Import (.json / .edges / .txt)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 font-mono text-xs">
          {activeTab === 'benchmarks' ? (
            <div className="space-y-4">
              <label className="text-[var(--text-tertiary)] block font-semibold">Select Research Dataset:</label>
              <div className="grid grid-cols-1 gap-2.5">
                {datasets.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedId === d.id
                        ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--text)] shadow-sm'
                        : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-subtle)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm font-sans text-[var(--text)]">{d.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--primary)] border border-[var(--border)]">
                        {d.badge}
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)] text-xs font-sans mb-2">{d.description}</p>
                    <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)] font-mono">
                      <span>Nodes: <strong className="text-[var(--primary)]">{d.estimatedNodes}</strong></span>
                      <span>Edges: <strong className="text-amber-500">{d.estimatedEdges}</strong></span>
                      <span>Focus: <span className="text-[var(--text-secondary)]">{d.researchFocus}</span></span>
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
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                    : 'border-[var(--border)] bg-[var(--surface-elevated)]/40 hover:border-[var(--border-subtle)]'
                }`}
              >
                <Upload className="h-8 w-8 mx-auto mb-3 text-[var(--primary)]" />
                <p className="text-sm font-sans text-[var(--text)] font-bold mb-1">
                  Drag and drop your dataset file here
                </p>
                <p className="text-xs text-[var(--text-tertiary)] font-sans mb-4">
                  Supports Stanford SNAP edge-lists (<code className="text-[var(--primary)]">.edges</code>, <code className="text-[var(--primary)]">.txt</code>) and Reddit/Canonical exports (<code className="text-[var(--primary)]">.json</code>)
                </p>
                <label className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[var(--surface-elevated)] hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] cursor-pointer transition-colors">
                  <FileText className="h-4 w-4 text-[var(--primary)]" />
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
                  <div className="mt-3 text-[var(--primary)] text-xs font-mono">
                    Selected: <strong>{uploadedFileName}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center p-6 space-x-3 text-[var(--primary)] bg-[var(--surface-elevated)]/40 rounded-xl border border-[var(--border)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Ingesting and computing graph metrics...</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-start space-x-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <strong className="block font-bold">Ingestion Error:</strong>
                <span className="font-sans text-xs">{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Dataset Metadata Preview Card */}
          {previewResult && !isLoading && !errorMsg && (
            <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="font-bold text-[var(--text)] uppercase">{previewResult.society.name}</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                  VALIDATED ({previewResult.validationReport.validRecordsCount} records)
                </span>
              </div>

              {/* Topology Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
                <div className="bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border)]">
                  <span className="text-[var(--text-tertiary)] block">Total Nodes</span>
                  <span className="text-base font-bold text-[var(--text)]">{previewResult.society.summary.totalPopulation}</span>
                </div>
                <div className="bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border)]">
                  <span className="text-[var(--text-tertiary)] block">Total Edges</span>
                  <span className="text-base font-bold text-amber-500">{previewResult.society.edges.length}</span>
                </div>
                <div className="bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border)]">
                  <span className="text-[var(--text-tertiary)] block">Modularity Q</span>
                  <span className="text-base font-bold text-[var(--primary)]">{previewResult.canonicalGraph.modularity.toFixed(3)}</span>
                </div>
                <div className="bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border)]">
                  <span className="text-[var(--text-tertiary)] block">Communities</span>
                  <span className="text-base font-bold text-emerald-500">{previewResult.society.summary.communityCount}</span>
                </div>
              </div>

              {/* Dynamic Metrics Secondary Row */}
              <div className="flex flex-wrap gap-4 text-[11px] text-[var(--text-tertiary)] pt-1">
                <span>Density: <strong className="text-[var(--text-secondary)]">{(previewResult.society.summary.density * 100).toFixed(2)}%</strong></span>
                <span>Average Degree: <strong className="text-[var(--text-secondary)]">{previewResult.society.summary.averageDegree}</strong></span>
                <span>Bridges: <strong className="text-amber-500">{previewResult.society.summary.bridgeNodeCount}</strong></span>
                <span>Influencers: <strong className="text-[var(--primary)]">{previewResult.society.summary.influencerCount}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-elevated)]/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--surface-elevated)] hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] font-mono text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!previewResult || isLoading}
            className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--bg)] disabled:bg-[var(--surface-elevated)] disabled:text-[var(--text-tertiary)] font-mono text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Load Into Simulator</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
