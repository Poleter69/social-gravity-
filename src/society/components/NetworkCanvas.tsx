/**
 * Social Gravity - High-Performance 2D Canvas Network Visualizer
 * Renders clustered community nodes, bridge edges, and influencer gravitational hubs with HUD telemetry.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Society } from '../types/society';
import { Agent } from '../types/agent';
import { AgentEpidemicState } from '../../simulation/types';
import { LayoutService, ComputedNodePosition } from '../workers/layoutService';
import { EMOTION_COLOR_MAP, GoEmotionLabel } from '../../nlp/types';

interface NetworkCanvasProps {
  society: Society;
  selectedAgent: Agent | null;
  onSelectAgent: (agent: Agent | null) => void;
  simulationStates?: Map<string, AgentEpidemicState>;
  patientZeroIds?: string[];
  recentTransmissions?: Array<{ sourceId: string; targetId: string; type: 'rumor' | 'debunk' }>;
}

type NodePosition = ComputedNodePosition;

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
  const [colorMode, setColorMode] = useState<'state' | 'community' | 'emotion'>('state');
  const nodePositionsRef = useRef<Map<string, NodePosition>>(new Map());
  const animFrameIdRef = useRef<number | null>(null);

  // Compute 2D clustered layout asynchronously using LayoutService (Task 5: Web Worker / Async chunking)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isMounted = true;
    LayoutService.computeLayoutAsync(society, canvas.width, canvas.height).then((positions) => {
      if (!isMounted) return;
      nodePositionsRef.current = positions;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = requestAnimationFrame(draw);
    });

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [society]);

  // Redraw when simulation state, filter, or color mode changes
  useEffect(() => {
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    animFrameIdRef.current = requestAnimationFrame(draw);
  }, [selectedAgent, filterMode, colorMode, simulationStates, patientZeroIds, recentTransmissions, hoveredAgent]);

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

      // Color styling depending on colorMode (state | community | emotion)
      let fillColor = pos.agent.isInfluencer ? '#fbbf24' : pos.color;
      let intensity = 0;

      if (colorMode === 'emotion') {
        const profile = pos.agent.psychology.emotionProfile;
        const dominantEmotion: GoEmotionLabel = profile?.primaryEmotion ?? (
          pos.agent.psychology.emotions.fear >= 0.45 ? 'fear' :
          (pos.agent.psychology.emotions.anger && pos.agent.psychology.emotions.anger >= 0.40) ? 'anger' :
          pos.agent.state.emotionalState === 'anxious' ? 'fear' :
          pos.agent.state.emotionalState === 'indignant' ? 'anger' :
          pos.agent.state.emotionalState === 'optimistic' ? 'joy' : 'neutral'
        );
        fillColor = EMOTION_COLOR_MAP[dominantEmotion] || '#64748B';
        intensity = profile?.intensity ?? (pos.agent.psychology.emotions.fear >= 0.4 ? 0.7 : 0.2);
      } else if (colorMode === 'state') {
        const epState = simulationStates?.get(pos.agent.id);
        fillColor = pos.agent.isInfluencer ? '#fbbf24' : pos.color;
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
      } else {
        // Community cluster colors
        fillColor = pos.color;
      }

      // Emotional Intensity Glow (Stage 6)
      if (colorMode === 'emotion' && intensity >= 0.3) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.radius + Math.floor(intensity * 7), 0, 2 * Math.PI);
        ctx.fillStyle = `${fillColor}33`; // 20% alpha glow halo
        ctx.fill();
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
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Filter buttons */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <span className="text-[11px] font-mono text-slate-400 bg-gravity-900/90 px-2 py-1 rounded border border-gravity-800">
            Filter:
          </span>
          {(['all', 'influencers', 'bridges'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`text-[11px] font-mono px-2.5 py-1 rounded border transition-all cursor-pointer ${
                filterMode === mode
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-glow-cyan'
                  : 'bg-gravity-900/70 border-gravity-800 text-slate-400 hover:text-white'
              }`}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Color Mode buttons (Stage 6) */}
        <div className="flex items-center space-x-1.5 pointer-events-auto bg-gravity-900/90 p-1 rounded-lg border border-gravity-800">
          <span className="text-[10px] font-mono text-slate-400 px-1.5">Color:</span>
          {(['state', 'community', 'emotion'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setColorMode(mode)}
              className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all cursor-pointer ${
                colorMode === mode
                  ? mode === 'emotion'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold shadow-glow-purple'
                    : 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode === 'state' ? 'State' : mode === 'community' ? 'Community' : '✨ Emotion'}
            </button>
          ))}
        </div>
      </div>

      {/* Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-3 bg-gravity-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gravity-800 text-[10px] font-mono text-slate-400">
        {colorMode === 'emotion' ? (
          <>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: EMOTION_COLOR_MAP.joy }} />
              <span>Joy / Love</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: EMOTION_COLOR_MAP.anger }} />
              <span>Anger</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: EMOTION_COLOR_MAP.fear }} />
              <span>Fear / Anxiety</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: EMOTION_COLOR_MAP.curiosity }} />
              <span>Curiosity</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: EMOTION_COLOR_MAP.admiration }} />
              <span>Admiration</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: EMOTION_COLOR_MAP.surprise }} />
              <span>Surprise</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: EMOTION_COLOR_MAP.neutral }} />
              <span>Neutral</span>
            </div>
          </>
        ) : simulationStates && simulationStates.size > 0 && colorMode === 'state' ? (
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
              <span>Community Clusters</span>
            </div>
          </>
        )}
      </div>

      {/* Hover HUD Telemetry Card (Stage 6: Emotion Hover Panel) */}
      {hoveredAgent && (
        <div className="absolute top-14 right-3 z-20 bg-gravity-900/95 border border-cyan-500/50 rounded-lg p-3 w-64 shadow-xl backdrop-blur-md font-mono text-xs space-y-2 pointer-events-none">
          <div className="flex items-center justify-between border-b border-gravity-800 pb-1.5">
            <span className="text-cyan-400 font-bold">{hoveredAgent.id}</span>
            <div className="flex items-center gap-1">
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
          </div>
          <div>
            <div className="text-white font-sans font-bold">{hoveredAgent.name}</div>
            <div className="text-slate-400 text-[11px]">{hoveredAgent.role}</div>
          </div>

          {/* GoEmotions Multidimensional Affective Profile */}
          {(() => {
            const profile = hoveredAgent.psychology.emotionProfile;
            const primary = profile?.primaryEmotion ?? (
              hoveredAgent.psychology.emotions.fear >= 0.45 ? 'fear' :
              (hoveredAgent.psychology.emotions.anger && hoveredAgent.psychology.emotions.anger >= 0.40) ? 'anger' :
              hoveredAgent.state.emotionalState === 'anxious' ? 'fear' :
              hoveredAgent.state.emotionalState === 'indignant' ? 'anger' :
              hoveredAgent.state.emotionalState === 'optimistic' ? 'joy' : 'neutral'
            );
            const color = EMOTION_COLOR_MAP[primary as GoEmotionLabel] || '#64748B';
            const topList = profile?.topEmotions ?? [
              { emotion: primary as GoEmotionLabel, score: profile?.confidence ?? 0.75 },
              { emotion: 'curiosity' as GoEmotionLabel, score: hoveredAgent.psychology.emotions.uncertainty * 0.6 },
              { emotion: 'calm' as any, score: hoveredAgent.psychology.emotions.calm * 0.7 }
            ];

            return (
              <div className="pt-1.5 border-t border-gravity-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Primary Emotion:</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase" style={{ backgroundColor: color }}>
                    {primary}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Confidence: <strong className="text-white">{((profile?.confidence ?? 0.75) * 100).toFixed(0)}%</strong></span>
                  <span>Intensity: <strong className="text-white">{((profile?.intensity ?? 0.4) * 100).toFixed(0)}%</strong></span>
                </div>
                {/* Top 3 Emotion Score Bars */}
                <div className="space-y-1 pt-0.5">
                  {topList.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between text-[9px] text-slate-300">
                        <span className="capitalize">{item.emotion}</span>
                        <span>{(item.score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1 bg-gravity-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, item.score * 100)}%`,
                            backgroundColor: EMOTION_COLOR_MAP[item.emotion as GoEmotionLabel] || '#06B6D4'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-1 text-[11px] pt-1.5 border-t border-gravity-800">
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
