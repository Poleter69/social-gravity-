/**
 * Social Gravity — Project Orbit Flagship Network Canvas
 * Palantir Foundry × Figma Infinite Canvas × Obsidian Graph View
 *
 * Implements:
 * - Infinite Canvas with smooth 0.15x - 8.0x spring camera
 * - Adaptive Force-Directed Layout 2.0 with collision prevention
 * - Multi-Level Level-of-Detail (LOD) Rendering
 * - Translucent Community Hulls & Faint Intelligence Grid
 * - Edge Intelligence & Animated Transmission Photon Pulses
 * - 6 Intelligence View Modes (Network, Heatmap, Community, Emotion, Risk, Bridges)
 * - Narrative Focus Mode (15% opacity dimming)
 * - Sliding Left Filter Panel & Right Node Intelligence Drawer
 * - Ctrl+K Spotlight Search with 300ms camera fly-to
 * - 60 FPS performance with SpatialIndex viewport culling
 */

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Search,
  Layers,
  Flame,
  ShieldAlert,
  Sparkles,
  GitFork,
  X,
  Share2,
} from 'lucide-react';
import { Society } from '../types/society';
import { Agent } from '../types/agent';
import { AgentEpidemicState } from '../../simulation/types';
import { CanvasNode, CanvasEdge, ViewMode, FilterOptions, TransmissionParticle, CommunityHull } from '../canvas/types';
import { IntelligentCamera } from '../canvas/camera';
import { SpatialIndex } from '../canvas/spatialIndex';
import { AdaptiveForceLayout } from '../canvas/adaptiveLayout';
import { HullGenerator } from '../canvas/hullGenerator';
import { EdgeRenderer } from '../canvas/edgeRenderer';
import { HeatmapRenderer } from '../canvas/heatmapRenderer';
import { LODRenderer } from '../canvas/lodRenderer';
import { NetworkFilterPanel } from './NetworkFilterPanel';
import { NetworkSearchModal } from './NetworkSearchModal';
import { NetworkNodeDrawer } from './NetworkNodeDrawer';

export interface NetworkCanvasProps {
  society: Society;
  selectedAgent?: Agent | null;
  onSelectAgent?: (agent: Agent | null) => void;
  simulationStates?: Map<string, AgentEpidemicState>;
  patientZeroIds?: string[];
  recentTransmissions?: Array<{ sourceId: string; targetId: string; type: 'rumor' | 'debunk' }>;
  livePosts?: any[];
  narratives?: any[];
  onDeployInoculation?: (nodeId: string) => void;
  onScrubToRound?: (round: number) => void;
  className?: string;
}

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  society,
  selectedAgent,
  onSelectAgent,
  simulationStates,
  patientZeroIds,
  recentTransmissions,
  livePosts: _livePosts,
  narratives: _narratives,
  onDeployInoculation,
  onScrubToRound,
  className = '',
}) => {
  // Container & Canvas refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Engine Subsystems
  const cameraRef = useRef<IntelligentCamera>(new IntelligentCamera());
  const spatialIndexRef = useRef<SpatialIndex>(new SpatialIndex(90));

  // Graph state refs
  const nodesRef = useRef<CanvasNode[]>([]);
  const edgesRef = useRef<CanvasEdge[]>([]);
  const nodeMapRef = useRef<Map<string, CanvasNode>>(new Map());
  const communityCentersRef = useRef<Map<string, { x: number; y: number; color: string; name: string }>>(new Map());
  const hullsRef = useRef<CommunityHull[]>([]);
  const particlesRef = useRef<TransmissionParticle[]>([]);

  // Interactive UI state
  const [viewMode, setViewMode] = useState<ViewMode>('network');
  const [hoveredNode, setHoveredNode] = useState<CanvasNode | null>(null);
  const [activeSelectedNode, setActiveSelectedNode] = useState<CanvasNode | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [focusNarrativeNodeIds, setFocusNarrativeNodeIds] = useState<Set<string> | null>(null);
  const [focusNarrativeTitle, setFocusNarrativeTitle] = useState<string | null>(null);

  // FPS Telemetry
  const [currentFps, setCurrentFps] = useState<number>(60);
  const lastFpsTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const pulseTickRef = useRef<number>(0);

  // Drag & Pan state
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isSpacePressedRef = useRef<boolean>(false);
  const [isSpaceHandActive, setIsSpaceHandActive] = useState<boolean>(false);

  // Multi-dimensional filters
  const [filters, setFilters] = useState<FilterOptions>({
    sources: new Set(),
    emotions: new Set(),
    riskLevels: new Set(),
    communityIds: new Set(),
    states: new Set(),
    timeRange: 'all',
    onlyInfluencers: false,
    onlyBridges: false,
    onlyContagion: false,
    searchQuery: '',
  });

  // Sync external selectedAgent to activeSelectedNode
  useEffect(() => {
    if (selectedAgent) {
      const match = nodeMapRef.current.get(selectedAgent.id);
      if (match) setActiveSelectedNode(match);
    } else {
      setActiveSelectedNode(null);
    }
  }, [selectedAgent]);

  // 1. Compute Adaptive Layout on Society Change (Stage 3 & 14)
  useEffect(() => {
    const layout = AdaptiveForceLayout.computeLayout(
      society,
      simulationStates,
      patientZeroIds,
      { deterministicSeed: true }
    );

    nodesRef.current = layout.nodes;
    edgesRef.current = layout.edges;
    communityCentersRef.current = layout.communityCenters;

    const nMap = new Map<string, CanvasNode>();
    layout.nodes.forEach((n) => nMap.set(n.id, n));
    nodeMapRef.current = nMap;

    // Build spatial index for O(1) hit-testing & culling
    spatialIndexRef.current.rebuild(layout.nodes);

    // Compute translucent community hulls
    hullsRef.current = HullGenerator.generateAllHulls(layout.nodes, layout.communityCenters);

    // Auto-fit to screen initially occupying 75% of workspace
    const canvas = canvasRef.current;
    if (canvas) {
      cameraRef.current.fitToBounds(layout.bounds, canvas.width, canvas.height, 0.75);
    }
  }, [society]);

  // 2. React to Simulation State Changes (Stage 11: Replay Integration)
  useEffect(() => {
    if (!simulationStates) return;

    nodesRef.current.forEach((n) => {
      const st = simulationStates.get(n.id);
      n.state = st;
      if (st === 'BELIEVER') {
        n.riskScore = Math.max(n.riskScore, 0.85);
        n.riskLevel = 'critical';
      } else if (st === 'DEBUNKER') {
        n.riskScore = 0.2;
        n.riskLevel = 'low';
      }
    });
  }, [simulationStates]);

  // 3. React to Active Transmissions (Spawns Photon Particles along edges)
  useEffect(() => {
    if (!recentTransmissions || recentTransmissions.length === 0) return;

    const newParticles: TransmissionParticle[] = [];
    recentTransmissions.forEach((tx, idx) => {
      const src = nodeMapRef.current.get(tx.sourceId);
      const tgt = nodeMapRef.current.get(tx.targetId);
      if (!src || !tgt) return;

      newParticles.push({
        id: `photon-${Date.now()}-${idx}`,
        sourceId: tx.sourceId,
        targetId: tx.targetId,
        startX: src.x,
        startY: src.y,
        endX: tgt.x,
        endY: tgt.y,
        progress: 0,
        speed: 0.035 + Math.random() * 0.015,
        color: tx.type === 'debunk' ? '#10B981' : '#EF4444',
        size: tx.type === 'debunk' ? 3.5 : 4.0,
        type: tx.type,
      });
    });

    particlesRef.current = [...particlesRef.current.slice(-30), ...newParticles];
  }, [recentTransmissions]);

  // 4. Keyboard Shortcuts: Spacebar for Hand Tool & Ctrl+K for Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === ' ' && !isSpacePressedRef.current) {
        isSpacePressedRef.current = true;
        setIsSpaceHandActive(true);
      } else if (e.key === 'Escape') {
        if (focusNarrativeNodeIds) {
          setFocusNarrativeNodeIds(null);
          setFocusNarrativeTitle(null);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        isSpacePressedRef.current = false;
        setIsSpaceHandActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [focusNarrativeNodeIds]);

  // 5. High-Performance Render Loop (60 FPS Guaranteed)
  useEffect(() => {
    let animId: number;
    const camera = cameraRef.current;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      // FPS counter update
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastFpsTimeRef.current >= 1000) {
        setCurrentFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }
      pulseTickRef.current++;

      // Update camera physics
      camera.update(16.6);

      // Update live node entrance animations
      nodesRef.current.forEach((n) => {
        if (n.scaleFactor < 1.0) {
          n.scaleFactor = Math.min(1.0, n.scaleFactor + 0.08);
        }
      });

      // Update transmission photon particles
      const activeParticles: TransmissionParticle[] = [];
      particlesRef.current.forEach((p) => {
        p.progress += p.speed;
        if (p.progress < 1.0) {
          activeParticles.push(p);
        }
      });
      particlesRef.current = activeParticles;

      // 1. Reset screen transform & clear background
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#06080F'; // Obsidian deep canvas
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Render Faint Intelligence Grid in Screen Space (Stage 14)
      LODRenderer.renderIntelligenceGrid(ctx, canvas.width, canvas.height, camera.x, camera.y, camera.scale);

      // 3. Apply Camera World Transform
      camera.applyTransform(ctx);

      // 4. Viewport Culling via Spatial Index (Stage 13)
      const viewportBounds = camera.getVisibleBounds(canvas.width, canvas.height, 100);
      const visibleNodes = spatialIndexRef.current.queryVisible(viewportBounds);

      // Filter nodes based on active FilterOptions
      const filteredVisibleNodes = visibleNodes.filter((n) => {
        if (filters.onlyInfluencers && !n.isInfluencer) return false;
        if (filters.onlyBridges && !n.isBridge) return false;
        if (filters.onlyContagion && n.state !== 'BELIEVER') return false;
        if (filters.sources.size > 0 && !filters.sources.has(n.source)) return false;
        if (filters.emotions.size > 0 && !filters.emotions.has(n.emotion)) return false;
        if (filters.riskLevels.size > 0 && !filters.riskLevels.has(n.riskLevel)) return false;
        if (filters.communityIds.size > 0 && !filters.communityIds.has(n.communityId)) return false;
        if (filters.states.size > 0 && n.state && !filters.states.has(n.state)) return false;
        return true;
      });

      // 5. Render Community Hulls (Stage 14)
      if (viewMode === 'community' || camera.scale < 0.85) {
        hullsRef.current.forEach((hull) => {
          const isHov = hoveredNode?.communityId === hull.communityId;
          HullGenerator.renderHull(ctx, hull, isHov);
        });
      }

      // 6. Render Thermal Field if Heatmap Mode (Stage 9)
      if (viewMode === 'heatmap') {
        HeatmapRenderer.renderThermalField(ctx, filteredVisibleNodes);
      }

      // 7. Render Edges with Intelligent Conduits (Stage 8 & 10)
      EdgeRenderer.renderEdges(
        ctx,
        edgesRef.current,
        nodeMapRef.current,
        activeSelectedNode?.id || null,
        hoveredNode?.id || null,
        focusNarrativeNodeIds,
        camera.scale
      );

      // 8. Render Transmission Photons
      EdgeRenderer.renderParticles(ctx, particlesRef.current);

      // 9. Render Nodes with Multi-Level LOD & Polish (Stage 4 & 14)
      LODRenderer.renderNodes(
        ctx,
        filteredVisibleNodes,
        viewMode,
        activeSelectedNode?.id || null,
        hoveredNode?.id || null,
        focusNarrativeNodeIds,
        camera.scale,
        pulseTickRef.current
      );

      // 10. Render Macro Community Badges if Zoomed Out (<0.6x)
      if (camera.scale < 0.6) {
        LODRenderer.renderMacroLabels(ctx, hullsRef.current, hoveredNode?.communityId || null);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [viewMode, activeSelectedNode, hoveredNode, focusNarrativeNodeIds, filters]);

  // 6. Responsive Canvas Resize Observer with High-DPI Scaling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    return () => observer.disconnect();
  }, []);

  // 7. Mouse Event Handlers (Pan, Zoom, Hover, Click)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Left drag without space, middle click, or right click
    if (e.button === 0 || e.button === 1 || e.button === 2) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle Camera Pan Dragging
    if (isDraggingRef.current) {
      const dpr = window.devicePixelRatio || 1;
      const dx = (e.clientX - lastMousePosRef.current.x) * dpr;
      const dy = (e.clientY - lastMousePosRef.current.y) * dpr;
      cameraRef.current.panBy(dx, dy);
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Handle O(1) Spatial Hover Detection
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const screenX = (e.clientX - rect.left) * dpr;
    const screenY = (e.clientY - rect.top) * dpr;
    const worldPos = cameraRef.current.screenToWorld(screenX, screenY);

    const match = spatialIndexRef.current.findNodeAt(worldPos.x, worldPos.y, 8);
    setHoveredNode(match);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const screenX = (e.clientX - rect.left) * dpr;
    const screenY = (e.clientY - rect.top) * dpr;

    // Differentiate Trackpad Pan vs Mouse Wheel Zoom
    if (e.ctrlKey) {
      // Trackpad pinch-to-zoom
      const zoomFactor = Math.pow(1.01, -e.deltaY);
      cameraRef.current.zoomAt(screenX, screenY, zoomFactor);
    } else if (Math.abs(e.deltaX) > 0 && Math.abs(e.deltaY) < 10) {
      // Two-finger horizontal trackpad pan
      cameraRef.current.panBy(-e.deltaX * dpr, 0);
    } else {
      // Standard wheel zoom
      const zoomFactor = e.deltaY > 0 ? 0.88 : 1.14;
      cameraRef.current.zoomAt(screenX, screenY, zoomFactor);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const screenX = (e.clientX - rect.left) * dpr;
    const screenY = (e.clientY - rect.top) * dpr;
    cameraRef.current.doubleClickZoom(screenX, screenY);
  };

  const handleClick = () => {
    if (hoveredNode) {
      setActiveSelectedNode(hoveredNode);
      if (onSelectAgent && hoveredNode.rawAgent) {
        onSelectAgent(hoveredNode.rawAgent);
      }
    } else if (!isDraggingRef.current) {
      setActiveSelectedNode(null);
      if (onSelectAgent) {
        onSelectAgent(null);
      }
    }
  };

  // Fly Camera to Node (Stage 6)
  const handleFlyToNode = useCallback((node: CanvasNode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    cameraRef.current.flyToNode(node.x, node.y, canvas.width, canvas.height, 2.0, 300);
    setActiveSelectedNode(node);
    if (onSelectAgent && node.rawAgent) {
      onSelectAgent(node.rawAgent);
    }
  }, [onSelectAgent]);

  // Fit to screen
  const handleFitToScreen = () => {
    const canvas = canvasRef.current;
    if (!canvas || nodesRef.current.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodesRef.current.forEach((n) => {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });

    cameraRef.current.fitToBounds({ minX, minY, maxX, maxY }, canvas.width, canvas.height, 0.75);
  };

  // Focus Narrative Mode (Stage 10)
  const handleFocusNarrative = (node: CanvasNode) => {
    const focusSet = new Set<string>();
    focusSet.add(node.id);

    // Add connected neighbors
    edgesRef.current.forEach((e) => {
      if (e.source === node.id) focusSet.add(e.target);
      if (e.target === node.id) focusSet.add(e.source);
    });

    setFocusNarrativeNodeIds(focusSet);
    setFocusNarrativeTitle(`Focus: ${node.label} Contagion Tree (${focusSet.size} nodes)`);
  };

  // Count filtered matches
  const filteredCount = useMemo(() => {
    return nodesRef.current.filter((n) => {
      if (filters.onlyInfluencers && !n.isInfluencer) return false;
      if (filters.onlyBridges && !n.isBridge) return false;
      if (filters.onlyContagion && n.state !== 'BELIEVER') return false;
      if (filters.sources.size > 0 && !filters.sources.has(n.source)) return false;
      if (filters.emotions.size > 0 && !filters.emotions.has(n.emotion)) return false;
      if (filters.riskLevels.size > 0 && !filters.riskLevels.has(n.riskLevel)) return false;
      if (filters.communityIds.size > 0 && !filters.communityIds.has(n.communityId)) return false;
      if (filters.states.size > 0 && n.state && !filters.states.has(n.state)) return false;
      return true;
    }).length;
  }, [filters, nodesRef.current.length]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-[#06080F] select-none ${className}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 1. Main HTML5 Canvas Element */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onClick={handleClick}
        className={`w-full h-full block ${
          isSpaceHandActive ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
        }`}
      />

      {/* 2. Top-Center Floating Intelligence Toolbar (Stage 9 & View Modes) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1 rounded-2xl bg-[#111114]/90 border border-[#27272A] shadow-2xl backdrop-blur-xl pointer-events-auto">
        {(['network', 'heatmap', 'community', 'emotion', 'risk', 'bridges'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-mono capitalize transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === mode
                ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 font-bold shadow-sm shadow-[#00F0FF]/20'
                : 'text-[#A1A1AA] hover:text-[#FAFAFA] border border-transparent'
            }`}
          >
            {mode === 'network' && <Share2 className="w-3.5 h-3.5" />}
            {mode === 'heatmap' && <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />}
            {mode === 'community' && <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />}
            {mode === 'emotion' && <Sparkles className="w-3.5 h-3.5 text-[#A855F7]" />}
            {mode === 'risk' && <ShieldAlert className="w-3.5 h-3.5 text-[#EF4444]" />}
            {mode === 'bridges' && <GitFork className="w-3.5 h-3.5 text-[#F59E0B]" />}
            <span>{mode}</span>
          </button>
        ))}

        <div className="w-[1px] h-5 bg-[#27272A] mx-1" />

        {/* Command Search Button (Ctrl+K) */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-colors cursor-pointer"
          title="Search graph (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span>Search</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-[#27272A] text-[#71717A]">⌘K</span>
        </button>
      </div>

      {/* 3. Bottom-Right Floating Camera Dock (Stage 2: Camera Controls) */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 p-1 rounded-2xl bg-[#111114]/90 border border-[#27272A] shadow-2xl backdrop-blur-xl pointer-events-auto">
        <button
          onClick={() => {
            const canvas = canvasRef.current;
            if (canvas) cameraRef.current.zoomStep(canvas.width, canvas.height, 1.25);
          }}
          className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] cursor-pointer transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            const canvas = canvasRef.current;
            if (canvas) cameraRef.current.zoomStep(canvas.width, canvas.height, 0.8);
          }}
          className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] cursor-pointer transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-[#27272A] mx-0.5" />

        <button
          onClick={handleFitToScreen}
          className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] cursor-pointer transition-colors"
          title="Fit Graph to Screen (75%)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            const canvas = canvasRef.current;
            if (canvas) cameraRef.current.resetView(canvas.width, canvas.height);
          }}
          className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] cursor-pointer transition-colors"
          title="Reset View (1.0x)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-[#27272A] mx-0.5" />

        {/* Real-time FPS & Node Metric Badge */}
        <div className="px-2.5 py-1 text-[10px] font-mono text-[#71717A] flex items-center gap-2">
          <span>{nodesRef.current.length} nodes</span>
          <span>•</span>
          <span className={currentFps >= 50 ? 'text-[#22C55E]' : currentFps >= 30 ? 'text-[#F59E0B]' : 'text-[#EF4444]'}>
            {currentFps} FPS
          </span>
        </div>
      </div>

      {/* 4. Narrative Focus Banner Overlay (Stage 10) */}
      <AnimatePresence>
        {focusNarrativeNodeIds && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 shadow-xl backdrop-blur-md pointer-events-auto"
          >
            <div className="flex items-center gap-2 text-[#EF4444] text-[12px] font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
              <span>{focusNarrativeTitle}</span>
            </div>
            <button
              onClick={() => {
                setFocusNarrativeNodeIds(null);
                setFocusNarrativeTitle(null);
              }}
              className="text-[#71717A] hover:text-white p-1 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Hover Tooltip Telemetry Card (Stage 7: Hover Preview) */}
      {hoveredNode && !activeSelectedNode && (
        <div className="absolute top-18 right-4 z-20 bg-[#111114]/95 border border-[#00F0FF]/40 rounded-xl p-3 w-64 shadow-2xl backdrop-blur-xl font-mono text-xs space-y-1.5 pointer-events-none">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-1">
            <span className="text-[#00F0FF] font-bold">{hoveredNode.id}</span>
            <span className="text-[10px] uppercase font-bold text-[#F59E0B]">
              {hoveredNode.isPatientZero ? 'PATIENT ZERO' : hoveredNode.isInfluencer ? 'INFLUENCER' : hoveredNode.isBridge ? 'BRIDGE' : 'MEMBER'}
            </span>
          </div>
          <div>
            <div className="text-white font-sans font-bold">{hoveredNode.label}</div>
            <div className="text-[#71717A] text-[11px]">{hoveredNode.sublabel || hoveredNode.communityName}</div>
          </div>
          <div className="pt-1 border-t border-[#27272A] flex items-center justify-between text-[11px]">
            <span className="text-[#71717A]">Affect:</span>
            <span className="font-bold text-[#A855F7] uppercase">{hoveredNode.emotion}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#71717A]">Degree / Trust:</span>
            <span>
              <strong className="text-[#00F0FF]">{hoveredNode.metrics.degree}</strong> / <strong className="text-[#10B981]">{(hoveredNode.traits.trust * 100).toFixed(0)}%</strong>
            </span>
          </div>
        </div>
      )}

      {/* 6. Floating Left Filter Panel (Stage 5) */}
      <NetworkFilterPanel
        isOpen={isFilterPanelOpen}
        onToggleOpen={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
        filters={filters}
        onChangeFilters={setFilters}
        communities={society.communities}
        totalNodeCount={nodesRef.current.length}
        filteredNodeCount={filteredCount}
      />

      {/* 7. Slide-Out Right Node Intelligence Drawer (Stage 7) */}
      <NetworkNodeDrawer
        node={activeSelectedNode}
        onClose={() => {
          setActiveSelectedNode(null);
          if (onSelectAgent) onSelectAgent(null);
        }}
        onFlyToNode={handleFlyToNode}
        onFocusNarrative={handleFocusNarrative}
        onInoculateNode={onDeployInoculation}
        onReplayJump={onScrubToRound}
        parentInfectionNode={
          activeSelectedNode?.state === 'BELIEVER'
            ? nodesRef.current.find((n) => n.isPatientZero) || null
            : null
        }
      />

      {/* 8. Command Search Modal (Ctrl+K) (Stage 6) */}
      <NetworkSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        nodes={nodesRef.current}
        communities={society.communities}
        onSelectNode={handleFlyToNode}
        onSelectCommunity={(commId) => {
          const hull = hullsRef.current.find((h) => h.communityId === commId);
          const canvas = canvasRef.current;
          if (hull && canvas) {
            cameraRef.current.flyToNode(hull.centroid.x, hull.centroid.y, canvas.width, canvas.height, 1.2, 350);
          }
        }}
      />
    </div>
  );
};
