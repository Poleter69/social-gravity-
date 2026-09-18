/**
 * Social Gravity — Project Dossier Network Evidence
 * Printable & Publication-Ready Vector Graph with Community Hulls & Highlighted Bridge Nodes
 * Zero UI Buttons. Pure Forensic Topology.
 */

import React from 'react';
import { Share2, ShieldAlert } from 'lucide-react';
import { InvestigationDossier } from '../types';

interface NetworkEvidenceProps {
  dossier: InvestigationDossier;
}

export const NetworkEvidence: React.FC<NetworkEvidenceProps> = ({ dossier }) => {
  const { networkEvidence } = dossier;
  const { nodes, edges, communities, metrics } = networkEvidence;

  // ViewBox bounds (850 x 520)
  const width = 850;
  const height = 520;

  return (
    <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl mb-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
              Network Topology & Bridge Breach Evidence
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              PRINTABLE VECTOR GRAPH WITH COMMUNITY HULLS & STRUCTURAL BOTTLENECKS
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 font-mono text-xs text-[var(--text-secondary)]">
          <span>|V| = <strong>{metrics.totalNodes}</strong></span>
          <span>•</span>
          <span>|E| = <strong>{metrics.totalEdges}</strong></span>
          <span>•</span>
          <span>Modularity = <strong>{metrics.modularity}</strong></span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full rounded-xl border border-[var(--border)] bg-[var(--canvas)] overflow-hidden shadow-inner flex items-center justify-center p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[580px] select-none"
          style={{ fontFeatureSettings: '"tnum"' }}
        >
          {/* Subtle Grid Background */}
          <defs>
            <pattern id="dossier-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-[var(--border)] opacity-30" />
            </pattern>
            {/* Glow filters for bridge nodes */}
            <filter id="bridge-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width={width} height={height} fill="url(#dossier-grid)" />

          {/* 1. Community Hulls (Background Convex Boundaries) */}
          <g className="community-hulls">
            {communities.map((comm) => {
              if (comm.hullPoints.length < 3) return null;
              const pathD = comm.hullPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt[0]} ${pt[1]}`, '') + ' Z';
              return (
                <g key={`comm-${comm.id}`}>
                  <path
                    d={pathD}
                    fill={comm.color}
                    fillOpacity="0.08"
                    stroke={comm.color}
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    strokeOpacity="0.35"
                  />
                  {/* Community Label */}
                  <text
                    x={comm.hullPoints[0][0] - 30}
                    y={comm.hullPoints[0][1] - 14}
                    fill={comm.color}
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                    letterSpacing="1"
                    opacity="0.85"
                  >
                    {comm.name.toUpperCase()} ({comm.infectedPct}% INFECTED)
                  </text>
                </g>
              );
            })}
          </g>

          {/* 2. Edges */}
          <g className="edges">
            {edges.map((e, idx) => {
              const sNode = nodes.find((n) => n.id === e.source);
              const tNode = nodes.find((n) => n.id === e.target);
              if (!sNode || !tNode) return null;

              if (e.isCrossCommunity) {
                // Highlighted Cross-Community Bridge Highway
                return (
                  <line
                    key={`edge-${idx}`}
                    x1={sNode.x}
                    y1={sNode.y}
                    x2={tNode.x}
                    y2={tNode.y}
                    stroke="#F59E0B"
                    strokeWidth="2.2"
                    strokeOpacity="0.8"
                    strokeDasharray="6 3"
                  />
                );
              }

              // Standard Intra-Community Edge
              return (
                <line
                  key={`edge-${idx}`}
                  x1={sNode.x}
                  y1={sNode.y}
                  x2={tNode.x}
                  y2={tNode.y}
                  stroke="currentColor"
                  strokeWidth="0.7"
                  className="text-[var(--border)] opacity-40"
                />
              );
            })}
          </g>

          {/* 3. Nodes */}
          <g className="nodes">
            {nodes.map((node) => {
              // Color based on epidemic state
              let fillColor = '#64748B'; // Susceptible (Slate)
              if (node.state === 'BELIEVER') fillColor = '#EF4444'; // Red
              else if (node.state === 'DEBUNKER') fillColor = '#10B981'; // Green

              // Node radius
              const radius = node.isInfluencer ? 8 : (node.isBridge ? 7 : 4.5);

              return (
                <g key={`node-${node.id}`}>
                  {/* Bridge Node Highlight Outer Ring */}
                  {node.isBridge && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius + 5}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2"
                      filter="url(#bridge-glow)"
                      className="animate-pulse"
                    />
                  )}

                  {/* Core Node Circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius}
                    fill={fillColor}
                    stroke="#FFFFFF"
                    strokeWidth={node.isInfluencer || node.isBridge ? '1.5' : '0.7'}
                  />

                  {/* Label for Key Bridge / Influencer Nodes */}
                  {(node.isBridge || node.isInfluencer) && (
                    <text
                      x={node.x + radius + 4}
                      y={node.y + 3}
                      fill="currentColor"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      className="text-[var(--text)] opacity-90"
                    >
                      {node.name.slice(0, 10)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Top-Right Forensic Watermark */}
        <div className="absolute top-4 right-4 bg-[var(--surface)]/90 backdrop-blur-md p-3 rounded-lg border border-[var(--border)] text-xs font-mono">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            CRITICAL TOPOLOGY AUDIT
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Bridge Nodes: <strong className="text-[var(--text)]">{networkEvidence.bridges.length}</strong>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Density: <strong className="text-[var(--text)]">{metrics.density}</strong>
          </div>
        </div>
      </div>

      {/* Graph Legend & Topological Index */}
      <div className="mt-6 pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-white" />
            <span className="text-[var(--text-secondary)]">Believer (Infected)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-500 border border-white" />
            <span className="text-[var(--text-secondary)]">Susceptible (Unaware)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white" />
            <span className="text-[var(--text-secondary)]">Debunker (Resistant)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-amber-400 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </span>
            <span className="text-[var(--text)] font-semibold">Strategic Bridge Node</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-6 border-b-2 border-dashed border-amber-400" />
            <span className="text-[var(--text-secondary)]">Cross-Cluster Transmission Highway</span>
          </div>
        </div>

        <div className="font-mono text-[11px] text-[var(--text-tertiary)]">
          Zero UI Buttons // Ready for Official Briefing Dossier
        </div>
      </div>
    </div>
  );
};
