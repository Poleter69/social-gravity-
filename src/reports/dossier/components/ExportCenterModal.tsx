/**
 * Social Gravity — Project Dossier Export Center Modal
 * "Export Intelligence Dossier: Choose the format that best fits your audience"
 * Premium Palantir / Apple Keynote Modal Interface
 */

import React, { useState } from 'react';
import { X, FileText, Globe, Code, Shield, Download, Sparkles } from 'lucide-react';
import { InvestigationDossier, ClassificationLevel } from '../types';
import { generateExecutivePDF } from '../generators/pdfGenerator';
import { generateInteractiveHTML } from '../generators/htmlGenerator';
import { downloadMachineJSON, downloadInteractiveHTML } from '../generators/jsonGenerator';

interface ExportCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: InvestigationDossier;
  onNotify?: (n: { title: string; message: string; type: 'info' | 'success' | 'warning' | 'export' }) => void;
}

export const ExportCenterModal: React.FC<ExportCenterModalProps> = ({
  isOpen,
  onClose,
  dossier,
  onNotify,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'html' | 'json'>('pdf');
  const [classification, setClassification] = useState<ClassificationLevel>(dossier.metadata.classification);
  const [operationCodename, setOperationCodename] = useState<string>(dossier.metadata.operationCodename);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExecuteExport = () => {
    setIsExporting(true);
    // Update dossier options
    const activeDossier: InvestigationDossier = {
      ...dossier,
      metadata: {
        ...dossier.metadata,
        classification,
        operationCodename,
      },
    };

    try {
      if (selectedFormat === 'pdf') {
        generateExecutivePDF(activeDossier);
        onNotify?.({
          title: 'Executive PDF Generated',
          message: `Classification: ${classification}. Print dialogue opened.`,
          type: 'export',
        });
      } else if (selectedFormat === 'html') {
        const html = generateInteractiveHTML(activeDossier);
        downloadInteractiveHTML(activeDossier, html);
        onNotify?.({
          title: 'Interactive HTML Exported',
          message: 'Standalone offline investigation file downloaded.',
          type: 'success',
        });
      } else if (selectedFormat === 'json') {
        downloadMachineJSON(activeDossier);
        onNotify?.({
          title: 'Machine JSON Exported',
          message: 'Structured forensic telemetry downloaded.',
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-blue-400">
              STAGE 5: EXPORT VAULT
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]">
              Export Intelligence Dossier
            </h2>
          </div>
        </div>

        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Choose the deliverable format that best fits your audience. Each format is completely self-contained and requires zero post-export editing.
        </p>

        {/* 3 Format Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {/* Format 1: Executive PDF */}
          <div
            onClick={() => setSelectedFormat('pdf')}
            className={`p-4 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
              selectedFormat === 'pdf'
                ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                : 'border-[var(--border)] bg-[var(--canvas)] hover:border-[var(--text-secondary)]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <FileText className={`w-5 h-5 ${selectedFormat === 'pdf' ? 'text-blue-400' : 'text-[var(--text-secondary)]'}`} />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                  FLAGSHIP
                </span>
              </div>
              <div className="font-bold text-sm text-[var(--text)] mb-1">Executive PDF</div>
              <div className="text-xs text-[var(--text-muted)] leading-relaxed">
                Decision-makers & commanders. Formatted for A4/Letter print.
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[var(--border)] text-[11px] font-mono text-[var(--text-tertiary)]">
              Print-quality brief
            </div>
          </div>

          {/* Format 2: Interactive HTML */}
          <div
            onClick={() => setSelectedFormat('html')}
            className={`p-4 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
              selectedFormat === 'html'
                ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500'
                : 'border-[var(--border)] bg-[var(--canvas)] hover:border-[var(--text-secondary)]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <Globe className={`w-5 h-5 ${selectedFormat === 'html' ? 'text-purple-400' : 'text-[var(--text-secondary)]'}`} />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold">
                  INTERACTIVE
                </span>
              </div>
              <div className="font-bold text-sm text-[var(--text)] mb-1">Interactive HTML</div>
              <div className="text-xs text-[var(--text-muted)] leading-relaxed">
                Shareable investigation. Standalone offline file with scrubber.
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[var(--border)] text-[11px] font-mono text-[var(--text-tertiary)]">
              Zero dependencies
            </div>
          </div>

          {/* Format 3: Machine JSON */}
          <div
            onClick={() => setSelectedFormat('json')}
            className={`p-4 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
              selectedFormat === 'json'
                ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                : 'border-[var(--border)] bg-[var(--canvas)] hover:border-[var(--text-secondary)]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <Code className={`w-5 h-5 ${selectedFormat === 'json' ? 'text-emerald-400' : 'text-[var(--text-secondary)]'}`} />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                  API REPLAY
                </span>
              </div>
              <div className="font-bold text-sm text-[var(--text)] mb-1">Machine JSON</div>
              <div className="text-xs text-[var(--text-muted)] leading-relaxed">
                API pipelines, replay engines, and automated SIEM ingestion.
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[var(--border)] text-[11px] font-mono text-[var(--text-tertiary)]">
              SHA-256 verified
            </div>
          </div>
        </div>

        {/* Customization Options */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--canvas)] mb-6 space-y-4 text-xs font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold block mb-1.5 flex items-center gap-1">
                <Shield className="w-3 h-3 text-amber-400" />
                SECURITY CLASSIFICATION
              </label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value as ClassificationLevel)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-blue-500 font-mono text-xs"
              >
                <option value="UNCLASSIFIED // FOR OFFICIAL USE ONLY">UNCLASSIFIED // FOR OFFICIAL USE ONLY</option>
                <option value="RESTRICTED // INTERNAL INTELLIGENCE">RESTRICTED // INTERNAL INTELLIGENCE</option>
                <option value="CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE">CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE</option>
                <option value="SECRET // NOFORN">SECRET // NOFORN</option>
                <option value="TOP SECRET // SCI // EYES ONLY">TOP SECRET // SCI // EYES ONLY</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold block mb-1.5">
                OPERATION CODENAME
              </label>
              <input
                type="text"
                value={operationCodename}
                onChange={(e) => setOperationCodename(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-blue-500 font-mono text-xs uppercase"
              />
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] text-xs font-mono font-semibold text-[var(--text-secondary)] hover:text-[var(--text)]"
          >
            Cancel
          </button>

          <button
            onClick={handleExecuteExport}
            disabled={isExporting}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
          >
            <Download className="w-4 h-4" />
            {selectedFormat === 'pdf' ? 'Print / Export PDF' : selectedFormat === 'html' ? 'Download Standalone HTML' : 'Download Structured JSON'}
          </button>
        </div>
      </div>
    </div>
  );
};
