/**
 * Social Gravity — Project Dossier Main Viewer Component
 * Complete Presentation-Ready Classified Intelligence Dossier Viewer
 * Integrates all 10 intelligence sections with tabs, instant PDF/HTML export and live preview.
 */

import React, { useState } from 'react';
import { Download, Printer, Share2 } from 'lucide-react';
import { InvestigationDossier } from '../types';
import { CoverPage } from './CoverPage';
import { ExecutiveSummary } from './ExecutiveSummary';
import { TimelineSection } from './TimelineSection';
import { NetworkEvidence } from './NetworkEvidence';
import { EmotionTrends } from './EmotionTrends';
import { NarrativeSection } from './NarrativeSection';
import { KeyActors } from './KeyActors';
import { EvidenceBoard } from './EvidenceBoard';
import { ExplainabilityFlow } from './ExplainabilityFlow';
import { RecommendationEngine } from './RecommendationEngine';
import { Appendix } from './Appendix';
import { ExportCenterModal } from './ExportCenterModal';
import { generateExecutivePDF } from '../generators/pdfGenerator';
import { generateInteractiveHTML } from '../generators/htmlGenerator';
import { downloadInteractiveHTML } from '../generators/jsonGenerator';

interface DossierViewerProps {
  dossier: InvestigationDossier;
  onNotify?: (n: { title: string; message: string; type: 'info' | 'success' | 'warning' | 'export' }) => void;
}

type ViewFilter = 'ALL' | 'EXECUTIVE' | 'EVIDENCE' | 'FORENSICS';

export const DossierViewer: React.FC<DossierViewerProps> = ({ dossier, onNotify }) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<ViewFilter>('ALL');

  const handleQuickPrint = () => {
    generateExecutivePDF(dossier);
    onNotify?.({
      title: 'Executive PDF Generated',
      message: 'Print preview dialog triggered.',
      type: 'export',
    });
  };

  const handleQuickHTML = () => {
    const html = generateInteractiveHTML(dossier);
    downloadInteractiveHTML(dossier, html);
    onNotify?.({
      title: 'Interactive HTML Saved',
      message: 'Standalone offline investigation file downloaded.',
      type: 'success',
    });
  };

  return (
    <div className="w-full flex flex-col h-full overflow-y-auto pr-1 select-text">
      {/* Top Floating Dossier Action Bar */}
      <div className="sticky top-0 z-30 mb-6 py-3 px-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md shadow-lg flex flex-wrap items-center justify-between gap-4">
        {/* Left Side: Title & Filter Tabs */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[var(--text)]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>INTELLIGENCE DOSSIER</span>
          </div>

          <div className="hidden md:flex items-center gap-1 border-l border-[var(--border)] pl-3">
            {(['ALL', 'EXECUTIVE', 'EVIDENCE', 'FORENSICS'] as ViewFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                  activeFilter === f
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Export Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickPrint}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] hover:bg-[var(--surface-hover)] text-xs font-mono font-medium text-[var(--text)] flex items-center gap-1.5 transition-colors"
            title="Instant Executive PDF"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Print PDF</span>
          </button>

          <button
            onClick={handleQuickHTML}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] hover:bg-[var(--surface-hover)] text-xs font-mono font-medium text-[var(--text)] flex items-center gap-1.5 transition-colors"
            title="Download Standalone HTML"
          >
            <Share2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Save HTML</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Intelligence Dossier</span>
          </button>
        </div>
      </div>

      {/* Main Dossier Content */}
      <div className="max-w-5xl mx-auto w-full pb-16">
        {/* Always show Cover & Executive Summary */}
        <CoverPage dossier={dossier} />
        <ExecutiveSummary dossier={dossier} />

        {/* Dynamic Sections Based on Filter */}
        {(activeFilter === 'ALL' || activeFilter === 'EXECUTIVE') && (
          <>
            <TimelineSection dossier={dossier} />
            <NarrativeSection dossier={dossier} />
            <RecommendationEngine dossier={dossier} />
          </>
        )}

        {(activeFilter === 'ALL' || activeFilter === 'EVIDENCE') && (
          <>
            <NetworkEvidence dossier={dossier} />
            <EmotionTrends dossier={dossier} />
            <KeyActors dossier={dossier} />
            <EvidenceBoard dossier={dossier} />
          </>
        )}

        {(activeFilter === 'ALL' || activeFilter === 'FORENSICS') && (
          <>
            <ExplainabilityFlow dossier={dossier} />
            <Appendix dossier={dossier} />
          </>
        )}
      </div>

      {/* Export Center Modal */}
      <ExportCenterModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        dossier={dossier}
        onNotify={onNotify}
      />
    </div>
  );
};
