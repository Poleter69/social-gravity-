/**
 * Social Gravity — Project Dossier Cover Page
 * Authentic Classified Cover Page with Official Banners, Security Badges & Vector Logo
 */

import React from 'react';
import { Shield, Lock, FileText, Calendar, Database, Eye } from 'lucide-react';
import { InvestigationDossier } from '../types';

interface CoverPageProps {
  dossier: InvestigationDossier;
}

export const CoverPage: React.FC<CoverPageProps> = ({ dossier }) => {
  const { metadata } = dossier;

  // Determine banner color based on classification
  const isTopSecret = metadata.classification.includes('TOP SECRET');
  const isConfidential = metadata.classification.includes('CONFIDENTIAL') || metadata.classification.includes('SECRET');
  const bannerColor = isTopSecret
    ? 'bg-red-600 text-white border-red-700'
    : isConfidential
    ? 'bg-amber-600 text-black border-amber-500'
    : 'bg-emerald-600 text-white border-emerald-700';

  return (
    <div className="relative w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-12 shadow-2xl overflow-hidden mb-8 transition-colors">
      {/* Top Security Classification Header Banner */}
      <div className={`w-full py-1.5 px-4 rounded font-mono font-black text-center text-xs tracking-[0.25em] uppercase border shadow-inner mb-8 ${bannerColor}`}>
        {metadata.classification}
      </div>

      {/* Background Classified Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
        <span className="text-[120px] font-black tracking-widest uppercase rotate-[-25deg]">
          CLASSIFIED
        </span>
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10 flex flex-col justify-between min-h-[520px]">
        {/* Header Block: Logo & Agency Identity */}
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              {/* Vector Logo Emblem */}
              <div className="w-11 h-11 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-mono font-bold text-xl">
                SG
              </div>
              <div>
                <div className="text-[11px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase">
                  NATIONAL INFORMATION WARFARE INTELLIGENCE
                </div>
                <div className="text-[16px] font-bold text-[var(--text)] tracking-tight">
                  SOCIAL GRAVITY // SPECIAL OPERATIONS BRIEF
                </div>
              </div>
            </div>

            <div className="text-right font-mono text-xs text-[var(--text-muted)]">
              <div>DOC ID: <span className="text-[var(--text)] font-semibold">{metadata.id}</span></div>
              <div>AUTH: <span className="text-emerald-500 font-semibold">SHA256-VERIFIED</span></div>
            </div>
          </div>

          {/* Investigation Title & Codename */}
          <div className="mt-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold uppercase tracking-wider mb-4">
              <Shield className="w-3.5 h-3.5" />
              FORENSIC INCIDENT INVESTIGATION
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text)] leading-tight">
              {metadata.title}
            </h1>

            <div className="text-lg sm:text-xl font-mono text-[var(--text-secondary)] mt-2 font-medium">
              CODENAME: <span className="text-amber-400">{metadata.operationCodename}</span>
            </div>
          </div>

          {/* AI One-Line Intelligence Assessment Callout */}
          <div className="mt-8 p-5 rounded-lg border border-[var(--border)] bg-[var(--canvas)]/60 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
            <div className="text-[11px] font-mono uppercase tracking-widest text-blue-400 mb-1.5 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              EXECUTIVE INTELLIGENCE SYNTHESIS
            </div>
            <p className="text-base sm:text-lg italic font-serif text-[var(--text)] leading-relaxed">
              "{metadata.summaryOneLiner}"
            </p>
          </div>
        </div>

        {/* Metadata Matrix & Ingestion Data Sources */}
        <div className="mt-12 pt-6 border-t border-[var(--border)]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
            <div>
              <div className="text-[var(--text-tertiary)] uppercase font-mono text-[10px] tracking-wider flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                DATE & TIME
              </div>
              <div className="font-mono font-medium text-[var(--text)]">
                {new Date(metadata.generatedAt).toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-[var(--text-tertiary)] uppercase font-mono text-[10px] tracking-wider flex items-center gap-1 mb-1">
                <FileText className="w-3.5 h-3.5" />
                INVESTIGATOR
              </div>
              <div className="font-mono font-medium text-[var(--text)] truncate" title={metadata.analystId}>
                {metadata.analystId}
              </div>
            </div>

            <div>
              <div className="text-[var(--text-tertiary)] uppercase font-mono text-[10px] tracking-wider flex items-center gap-1 mb-1">
                <Lock className="w-3.5 h-3.5" />
                SECURITY CAVEAT
              </div>
              <div className="font-mono font-bold text-amber-400">
                NOFORN // ORCON
              </div>
            </div>

            <div>
              <div className="text-[var(--text-tertiary)] uppercase font-mono text-[10px] tracking-wider flex items-center gap-1 mb-1">
                <Database className="w-3.5 h-3.5" />
                DATA FEEDS
              </div>
              <div className="font-mono font-medium text-[var(--text)]">
                {metadata.dataSources.length} Multi-Stream Sources
              </div>
            </div>
          </div>

          {/* Sources Pill Row */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase">Sources:</span>
            {metadata.dataSources.map((src, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)]"
              >
                {src}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Security Classification Footer Banner */}
      <div className={`w-full py-1.5 px-4 rounded font-mono font-black text-center text-xs tracking-[0.25em] uppercase border shadow-inner mt-8 ${bannerColor}`}>
        {metadata.classification}
      </div>
    </div>
  );
};
