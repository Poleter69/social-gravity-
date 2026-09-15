/**
 * Social Gravity - High-Performance 2D Canvas Network Visualizer
 * Renders clustered community nodes, bridge edges, and influencer gravitational hubs with HUD telemetry.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Society } from '../types/society';
import { Agent } from '../types/agent';
import { AgentEpidemicState } from '../../simulation/types';

interface NetworkCanvasProps {
  society: Society;
  selectedAgent: Agent | null;
  onSelectAgent: (agent: Agent | null) => void;
  simulationStates?: Map<string, AgentEpidemicState>;
  patientZeroIds?: string[];
  recentTransmissions?: Array<{ sourceId: string; targetId: string; type: 'rumor' | 'debunk' }>;
}

interface NodePosition {
  x: number;
  y: number;
  radius: number;
  agent: Agent;
  color: string;
}

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  society,
  selectedAgent,
  onSelectAgent,
  simulationStates,
  patientZeroIds,
  recentTransmissions,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<Agent | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'influencers' | 'bridges'>('all');
  const nodePositionsRef = useRef<Map<string, NodePosition>>(new Map());

  // Compute 2D clustered layout
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const commMap = new Map(society.communities.map((c) => [c.id, c]));
    const commCount = society.communities.length;
    const commCenters = new Map<string, { x: number; y: number }>();

    // Arrange community centroids on an orbit
    const orbitRadius = commCount <= 1 ? 0 : Math.min(width, height) * 0.32;
    society.communities.forEach((c, idx) => {
      const angle = commCount > 1 ? (idx / commCount) * 2 * Math.PI - Math.PI / 2 : 0;
      commCenters.set(c.id, {
        x: centerX + Math.cos(angle) * orbitRadius,
        y: centerY + Math.sin(angle) * orbitRadius,
      });
    });

    const positions = new Map<string, NodePosition>();
    const communityMemberCounts = new Map<string, number>();

    // Place nodes around their community centroid with smooth spiral dispersion
    society.agents.forEach((agent) => {
      const commCenter = commCenters.get(agent.communityId) || { x: centerX, y: centerY };
      const comm = commMap.get(agent.communityId);
      const color = comm?.color || '#00f0ff';

      const commIdx = communityMemberCounts.get(agent.communityId) || 0;
      communityMemberCounts.set(agent.communityId, commIdx + 1);

      // Adaptive dispersion radius based on community size and total population
      const clusterBaseRadius = commCount <= 1 ? Math.min(width, height) * 0.38 : (agent.isBridge ? 65 : 45);
      const angle = (commIdx * 137.5 * Math.PI) / 180; // Golden angle spiral
      const dist = Math.min(clusterBaseRadius, Math.sqrt(commIdx + 1) * (commCount <= 1 ? 9 : 6.5));

      const x = Math.max(20, Math.min(width - 20, commCenter.x + Math.cos(angle) * dist));
      const y = Math.max(20, Math.min(height - 20, commCenter.y + Math.sin(angle) * dist));
      
      // Scale node radius for large networks so it doesn't become a blob
      const scaleFactor = society.agents.length > 500 ? 0.6 : society.agents.length > 200 ? 0.8 : 1.0;
      const baseRadius = agent.isInfluencer ? 6 : agent.isBridge ? 4.5 : 3.5;
      const radius = Math.max(2, baseRadius * scaleFactor);

      positions.set(agent.id, { x, y, radius, agent, color });
    });

    nodePositionsRef.current = positions;
    draw();
  }, [society, selectedAgent, filterMode, simulationStates, patientZeroIds, recentTransmissions]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const positions = nodePositionsRef.current;

    // Clear background
    ctx.fillStyle = '#060911';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 32;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // 1. Draw Edges
    society.edges.forEach((edge) => {
      const p1 = positions.get(edge.source);
      const p2 = positions.get(edge.target);
      if (!p1 || !p2) return;

      const isBridgeEdge = edge.type === 'bridge';
      const isSelectedEdge = selectedAgent && (edge.source === selectedAgent.id || edge.target === selectedAgent.id);

      if (filterMode === 'bridges' && !isBridgeEdge) return;
      if (filterMode === 'influencers' && !p1.agent.isInfluencer && !p2.agent.isInfluencer) return;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);

      if (isSelectedEdge) {
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.0;
      } else if (isBridgeEdge) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)'; // Amber bridge vector
        ctx.lineWidth = 1.2;
      } else {
        ctx.strokeStyle = 'rgba(30, 45, 80, 0.35)'; // Subtle intra-community tie
        ctx.lineWidth = 0.7;
      }
      ctx.stroke();
    });

    // 1.5 Draw Active Transmission Vectors (Rumor vs Debunk)
    if (recentTransmissions && recentTransmissions.length > 0) {
      recentTransmissions.forEach((tx) => {
        const p1 = positions.get(tx.sourceId);
        const p2 = positions.get(tx.targetId);
        if (!p1 || !p2) return;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = tx.type === 'debunk' ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 2.4;
        ctx.stroke();
      });
    }

    // 2. Draw Nodes
    positions.forEach((pos) => {
      const isSelected = selectedAgent?.id === pos.agent.id;
      const isHovered = hoveredAgent?.id === pos.agent.id;
      const isPatientZero = patientZeroIds?.includes(pos.agent.id);

      if (filterMode === 'influencers' && !pos.agent.isInfluencer) return;
      if (filterMode === 'bridges' && !pos.agent.isBridge) return;

      // Epidemic state styling
      const epState = simulationStates?.get(pos.agent.id);
      let fillColor = pos.agent.isInfluencer ? '#fbbf24' : pos.color;

      if (epState) {
        switch (epState) {
          case 'BELIEVER':
            fillColor = '#ef4444'; // Red
            break;
          case 'DEBUNKER':
            fillColor = '#10b981'; // Emerald
            break;
          case 'SKEPTIC':
            fillColor = '#a855f7'; // Purple
            break;
          case 'EXPOSED':
            fillColor = '#f59e0b'; // Amber
            break;
          case 'SUSCEPTIBLE':
            fillColor = '#06b6d4'; // Cyan
            break;
        }
      }

      // Patient zero aura
      if (isPatientZero) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.radius + 7, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Glow halo on Influencers
      if (pos.agent.isInfluencer) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.radius + 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
        ctx.fill();
      }

      // Outer highlight for Selected or Hovered
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.radius + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Bridge node indicator
      if (pos.agent.isBridge) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.radius + 2, 0, 2 * Math.PI);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Main node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pos.radius, 0, 2 * Math.PI);
      ctx.fillStyle = fillColor;
      ctx.fill();
    });
  };

  // Mouse interaction handling
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    let found: Agent | null = null;
    nodePositionsRef.current.forEach((pos) => {
      const dx = mouseX - pos.x;
      const dy = mouseY - pos.y;
      if (Math.sqrt(dx * dx + dy * dy) <= pos.radius + 4) {
        found = pos.agent;
      }
    });

    setHoveredAgent(found);
    draw();
  };

  const handleClick = () => {
    if (hoveredAgent) {
      onSelectAgent(hoveredAgent);
    } else {
      onSelectAgent(null);
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-gravity-800 bg-gravity-950">
      {/* Top Controls Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-2">
        <span className="text-[11px] font-mono text-slate-400 bg-gravity-900/90 px-2 py-1 rounded border border-gravity-800">
          Filter:
        </span>
        {(['all', 'influencers', 'bridges'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setFilterMode(mode)}
            className={`text-[11px] font-mono px-2.5 py-1 rounded border transition-all ${
              filterMode === mode
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-glow-cyan'
                : 'bg-gravity-900/70 border-gravity-800 text-slate-400 hover:text-white'
            }`}
          >
            {mode.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center space-x-3 bg-gravity-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gravity-800 text-[10px] font-mono text-slate-400">
        {simulationStates && simulationStates.size > 0 ? (
          <>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
              <span>Susceptible</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-glow-red" />
              <span>Believer (Infected)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span>Debunker</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
              <span>Skeptic</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span>Influencer Hub</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span>Influencer Hub</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-amber-400" />
              <span>Bridge Node</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
              <span>Community Member</span>
            </div>
          </>
        )}
      </div>

      {/* Hover HUD Telemetry Card */}
      {hoveredAgent && (
        <div className="absolute top-3 right-3 z-20 bg-gravity-900/95 border border-cyan-500/50 rounded-lg p-3 w-60 shadow-xl backdrop-blur-md font-mono text-xs space-y-2 pointer-events-none">
          <div className="flex items-center justify-between border-b border-gravity-800 pb-1.5">
            <span className="text-cyan-400 font-bold">{hoveredAgent.id}</span>
            {hoveredAgent.isInfluencer && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                INFLUENCER
              </span>
            )}
            {hoveredAgent.isBridge && !hoveredAgent.isInfluencer && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                BRIDGE
              </span>
            )}
          </div>
          <div>
            <div className="text-white font-sans font-bold">{hoveredAgent.name}</div>
            <div className="text-slate-400 text-[11px]">{hoveredAgent.role}</div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px] pt-1 border-t border-gravity-800">
            <div>Degree: <span className="text-amber-300">{hoveredAgent.metrics.degree}</span></div>
            <div>Trust: <span className="text-emerald-400">{(hoveredAgent.traits.trust * 100).toFixed(0)}%</span></div>
            <div>Influence: <span className="text-cyan-300">{(hoveredAgent.traits.influence * 100).toFixed(0)}%</span></div>
            <div>Conformity: <span className="text-amber-400">{(hoveredAgent.traits.conformity * 100).toFixed(0)}%</span></div>
          </div>
        </div>
      )}

      {/* Main Canvas Element */}
      <canvas
        ref={canvasRef}
        width={900}
        height={540}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredAgent(null)}
        onClick={handleClick}
        className="w-full h-auto cursor-crosshair block"
      />
    </div>
  );
};
