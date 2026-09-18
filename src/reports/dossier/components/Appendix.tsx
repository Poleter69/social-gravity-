/**
 * Social Gravity — Project Dossier Technical Appendix
 * Forensic Metadata, Replay Hashes, Connector Telemetry & Reproducibility Guarantees
 */

import React from 'react';
import { Database, Hash, Server, Cpu, FileCheck } from 'lucide-react';
import { InvestigationDossier } from '../types';

interface AppendixProps {
  dossier: InvestigationDossier;
}

export const Appendix: React.FC<AppendixProps> = ({ dossier }) => {
  const { appendix, networkEvidence } = dossier;

  return (
    <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl mb-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
              Technical Appendix & Reproducibility Ledger
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              CRYPTOGRAPHIC FINGERPRINTS, CONNECTOR AUDIT, AND STRUCTURAL INVARIANT PROOFS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
          <FileCheck className="w-3.5 h-3.5" />
          BITWISE VERIFIABLE
        </div>
      </div>

      {/* Grid: Hashes & Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Box 1: Cryptographic Integrity */}
        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--canvas)]">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400 mb-3 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5" />
            CRYPTOGRAPHIC PROVENANCE HASHES
          </h3>
          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Replay State Digest (SHA-256)</div>
              <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] select-all break-all mt-1">
                {appendix.replayHash}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Dossier Export Checksum</div>
              <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)] text-emerald-400 font-semibold select-all break-all mt-1">
                {appendix.exportChecksum}
              </div>
            </div>
          </div>
        </div>

        {/* Box 2: Topological Graph Metrics */}
        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--canvas)]">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 mb-3 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            TOPOLOGICAL INVARIANTS & GRAPH METRICS
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Graph Diameter</div>
              <div className="text-lg font-bold text-[var(--text)] mt-0.5">{appendix.graphTopologySummary.diameter} Hops</div>
            </div>
            <div className="p-2.5 rounded bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Clustering Coeff</div>
              <div className="text-lg font-bold text-[var(--text)] mt-0.5">{appendix.graphTopologySummary.clusteringCoeff}</div>
            </div>
            <div className="p-2.5 rounded bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Network Density</div>
              <div className="text-lg font-bold text-[var(--text)] mt-0.5">{networkEvidence.metrics.density}</div>
            </div>
            <div className="p-2.5 rounded bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Modularity Q</div>
              <div className="text-lg font-bold text-amber-400 mt-0.5">{networkEvidence.metrics.modularity}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table 1: Live Connector Health Matrix */}
      <div className="mb-8">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-3 flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5 text-emerald-400" />
          MULTI-STREAM DATA CONNECTOR TELEMETRY
        </h3>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-[var(--text-tertiary)] uppercase text-[10px]">
              <tr>
                <th className="p-3">Platform Connector</th>
                <th className="p-3">Operational Status</th>
                <th className="p-3">Events Ingested</th>
                <th className="p-3 text-right">Processing Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-[var(--canvas)]">
              {appendix.connectorStatus.map((conn, i) => (
                <tr key={i} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="p-3 font-semibold text-[var(--text)]">{conn.platform}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {conn.status}
                    </span>
                  </td>
                  <td className="p-3 text-[var(--text-secondary)]">{conn.eventCount.toLocaleString()} signals</td>
                  <td className="p-3 text-right text-[var(--text-secondary)]">{conn.latencyMs} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Emotion Prevalence Distributions */}
      <div>
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
          TAXONOMIC AFFECTIVE DISTRIBUTION (GOEMOTIONS 28-DIM CLUSTERS)
        </h3>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-[var(--text-tertiary)] uppercase text-[10px]">
              <tr>
                <th className="p-3">Emotion Category</th>
                <th className="p-3">Prevalence Share</th>
                <th className="p-3 text-right">Trend Velocity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-[var(--canvas)]">
              {appendix.emotionDistributionTable.map((row, i) => (
                <tr key={i} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="p-3 font-semibold text-[var(--text)]">{row.emotion}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-[var(--surface)] overflow-hidden border border-[var(--border)]">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${row.prevalencePct}%` }}
                        />
                      </div>
                      <span className="text-[var(--text)]">{row.prevalencePct}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <span
                      className={`font-bold ${
                        row.trend === 'RISING'
                          ? 'text-red-400'
                          : row.trend === 'FALLING'
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {row.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
