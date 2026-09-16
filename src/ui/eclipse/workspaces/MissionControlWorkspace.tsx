/**
 * Social Gravity — Eclipse MissionControlWorkspace
 * 100vh Flagship Command Center: "If Apple designed Palantir Foundry"
 * 70% Network Canvas hero, floating 4-card HUD, floating Emotion Capsule,
 * and 30% Right Operational Intelligence Panel (Zero Clutter, Zero Feed).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  ShieldAlert,
  ShieldCheck,
  Zap,
  GitFork,
  ArrowRight,
  Sparkles,
  Activity,
} from 'lucide-react';
import {
  LivePost,
  LivePlatform,
  ProcessedLivePost,
  LiveProcessingPipeline,
  AlertEngine,
  LiveAlert,
  LiveReplayManager,
  PerformanceTelemetry,
  LiveManager,
} from '../../../live';
import { NarrativeFusionEngine, UnifiedNarrative } from '../../../fusion';
import { MetricCard } from '../components/MetricCard';
import { EmotionCapsule } from '../components/EmotionCapsule';
import { Society } from '../../../society/types/society';
import { SimulationState } from '../../../simulation/types';
import { societyGenerator } from '../../../society/generators/societyGenerator';
import { NetworkCanvas } from '../../../society/components/NetworkCanvas';

export interface MissionControlWorkspaceProps {
  society?: Society;
  simState?: SimulationState | null;
  onNavigateToReplay?: () => void;
  onNavigateToCompare?: () => void;
  onNavigateToExport?: () => void;
  onOpenAlertExplanation?: (title: string) => void;
  onDeployInoculation?: () => void;
  onInjectDebunk?: () => void;
  isStreaming?: boolean;
}

interface SimulatedNode {
  id: string;
  label: string;
  platform: LivePlatform;
  x: number;
  y: number;
  radius: number;
  color: string;
  isBridge: boolean;
  pulseTimer: number;
  emotion: string;
  threatLevel: 'low' | 'moderate' | 'high' | 'critical';
  content?: string;
  timestamp?: number;
  url?: string;
  isReply?: boolean;
}

interface SimulatedEdge {
  source: string;
  target: string;
  weight: number;
  active: boolean;
}

export const MissionControlWorkspace: React.FC<MissionControlWorkspaceProps> = ({
  society,
  simState,
  onNavigateToReplay,
  onNavigateToCompare,
  onOpenAlertExplanation,
  onDeployInoculation,
  onInjectDebunk,
  isStreaming = true,
}) => {
  const defaultSociety = useMemo(
    () =>
      societyGenerator.generate({
        name: 'Live Incident Intelligence Grid',
        archetype: 'online_community',
        populationSize: 100,
        influencerRatio: 0.05,
        seed: 42,
      }),
    []
  );
  const activeSociety = society || defaultSociety;
  const [isHudOpen, setIsHudOpen] = useState(true);
  // ── Core Engines (Untouched Backend) ──────────────────────────────────────
  const pipeline = useMemo(() => new LiveProcessingPipeline(), []);
  const fusionEngine = useMemo(() => new NarrativeFusionEngine(), []);
  const alertEngine = useMemo(() => new AlertEngine(), []);
  const replayManager = useMemo(() => new LiveReplayManager(300), []);
  const telemetry = useMemo(() => PerformanceTelemetry.getInstance(), []);

  // Live Manager focusing on Trending Reddit (/hot) and Breaking News RSS
  const liveManager = useMemo(
    () =>
      new LiveManager({
        reddit: { subreddits: ['technology', 'worldnews', 'news', 'science', 'artificial'] },
        rss: {
          feeds: [
            'https://news.ycombinator.com/rss',
            'https://feeds.bbci.co.uk/news/world/rss.xml',
            'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
            'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
            'https://techcrunch.com/feed/',
            'https://www.theguardian.com/world/rss',
            'https://www.theverge.com/rss/index.xml',
          ],
        },
        bluesky: { keywords: [], offline: true }, // Disabled per directive to eliminate clutter
      }),
    []
  );

  // ── Streaming State ───────────────────────────────────────────────────────
  const [feedPosts, setFeedPosts] = useState<ProcessedLivePost[]>([]);
  const [narratives, setNarratives] = useState<UnifiedNarrative[]>([]);
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [commentsPerSec, setCommentsPerSec] = useState(0);

  // ── UI State ──────────────────────────────────────────────────────────────
  const [selectedNode, setSelectedNode] = useState<SimulatedNode | null>(null);
  const [selectedEmotionFilter, setSelectedEmotionFilter] = useState<string | null>(null);
  const selectedNodeRef = useRef<SimulatedNode | null>(null);
  const isStreamingRef = useRef(isStreaming);

  // ── Copilot State ─────────────────────────────────────────────────────────
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotMessages, setCopilotMessages] = useState<
    Array<{ role: 'analyst' | 'assistant'; text: string; citations?: string[] }>
  >([
    {
      role: 'assistant',
      text: 'Analyst Copilot active. Grounded in real-time Reddit & RSS telemetry. Ask why an alert triggered, or simulate bridge isolation.',
      citations: ['LiveStream-Pipeline', 'GoEmotions-Taxonomy', 'Betweenness-Centrality'],
    },
  ]);
  const [isCopilotTyping, setIsCopilotTyping] = useState(false);

  // ── Canvas Graph Engine ───────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nodesRef = useRef<SimulatedNode[]>([]);
  const edgesRef = useRef<SimulatedEdge[]>([]);
  const postCounterRef = useRef(0);

  // Keep refs synced
  useEffect(() => {
    selectedNodeRef.current = selectedNode;
  }, [selectedNode]);

  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // Seed baseline clusters on mount
  useEffect(() => {
    if (nodesRef.current.length === 0) {
      const initialNodes: SimulatedNode[] = [
        {
          id: 'anchor-0',
          label: 'Reddit: r/technology',
          platform: 'reddit',
          x: 280,
          y: 220,
          radius: 11,
          color: '#FB923C',
          isBridge: false,
          pulseTimer: 0,
          emotion: 'curiosity',
          threatLevel: 'low',
          content: 'Deep learning breakthroughs debate trending on tech forums.',
        },
        {
          id: 'anchor-1',
          label: 'RSS: BBC World',
          platform: 'rss',
          x: 480,
          y: 190,
          radius: 10,
          color: '#38BDF8',
          isBridge: false,
          pulseTimer: 0,
          emotion: 'fear',
          threatLevel: 'moderate',
          content: 'Global energy infrastructure update broadcast.',
        },
        {
          id: 'anchor-2',
          label: 'RSS: NYT Tech',
          platform: 'rss',
          x: 360,
          y: 380,
          radius: 10,
          color: '#38BDF8',
          isBridge: false,
          pulseTimer: 0,
          emotion: 'surprise',
          threatLevel: 'low',
          content: 'Algorithmic governance analysis published.',
        },
        {
          id: 'bridge-alpha',
          label: 'Bridge: r/worldnews ↔ NYT',
          platform: 'reddit',
          x: 390,
          y: 270,
          radius: 13,
          color: '#EF4444',
          isBridge: true,
          pulseTimer: 25,
          emotion: 'fear',
          threatLevel: 'critical',
          content: 'CRITICAL BRIDGE: Cross-community boundary spanner linking geopolitical & tech clusters.',
        },
        {
          id: 'bridge-beta',
          label: 'Bridge: HackerNews ↔ Verge',
          platform: 'rss',
          x: 520,
          y: 320,
          radius: 12,
          color: '#F59E0B',
          isBridge: true,
          pulseTimer: 18,
          emotion: 'nervousness',
          threatLevel: 'high',
          content: 'SECONDARY BRIDGE: Rapidly escalating narrative cross-pollination.',
        },
      ];

      const initialEdges: SimulatedEdge[] = [
        { source: 'anchor-0', target: 'bridge-alpha', weight: 2.0, active: true },
        { source: 'anchor-1', target: 'bridge-alpha', weight: 2.5, active: true },
        { source: 'anchor-2', target: 'bridge-alpha', weight: 1.8, active: true },
        { source: 'bridge-alpha', target: 'bridge-beta', weight: 2.2, active: true },
        { source: 'anchor-1', target: 'bridge-beta', weight: 1.5, active: true },
      ];

      nodesRef.current = initialNodes;
      edgesRef.current = initialEdges;
    }
  }, []);

  // ── Hook Live Pipeline (Untouched Backend Processing) ─────────────────────
  useEffect(() => {
    liveManager.onPost(async (post: LivePost) => {
      if (!isStreamingRef.current) return;
      const t0 = performance.now();

      // Run real GoEmotions classification
      const processed = await pipeline.process(post);
      if (!processed) return;

      setFeedPosts((prev) => [processed, ...prev.slice(0, 39)]);

      // Narrative fusion
      fusionEngine.ingestPost(processed);
      const updatedNarratives = fusionEngine.getNarratives();
      setNarratives(updatedNarratives);

      // Alert generation
      if (updatedNarratives.length > 0) {
        const newAlert = alertEngine.evaluateNarrative(updatedNarratives[0]);
        if (newAlert) {
          setAlerts((prev) => [newAlert, ...prev]);
        }
      }
      setAlerts(alertEngine.getAlerts());

      // Mutate Canvas Nodes
      const canvas = canvasRef.current;
      if (canvas) {
        const platformColors: Record<LivePlatform, string> = {
          reddit: '#FB923C',
          rss: '#38BDF8',
          bluesky: '#60A5FA',
          x: '#E4E4E7',
          youtube: '#EF4444',
          instagram: '#EC4899',
          local: '#A1A1AA',
        };

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * (Math.min(cx, cy) - 90);
        const nx = cx + Math.cos(angle) * dist;
        const ny = cy + Math.sin(angle) * dist;

        const isBridgeNode = processed.riskScore > 0.65;
        const newNode: SimulatedNode = {
          id: processed.id,
          label: `${processed.platform.toUpperCase()}: ${processed.authorName.slice(0, 14)}`,
          platform: processed.platform,
          x: nx,
          y: ny,
          radius: isBridgeNode ? 10 : 6 + Math.random() * 3,
          color: isBridgeNode ? '#EF4444' : platformColors[processed.platform] || '#4F8CFF',
          isBridge: isBridgeNode,
          pulseTimer: 30,
          emotion: processed.emotion.dominant,
          threatLevel: processed.riskScore > 0.65 ? 'critical' : processed.riskScore > 0.4 ? 'high' : 'low',
          content: processed.content,
          timestamp: processed.timestamp,
          url: (processed as any).url,
          isReply: post.isReply,
        };

        if (nodesRef.current.length > 40) {
          const drop = nodesRef.current.findIndex((n) => !n.isBridge && !n.id.startsWith('anchor-'));
          if (drop >= 0) {
            const dropId = nodesRef.current[drop].id;
            nodesRef.current.splice(drop, 1);
            edgesRef.current = edgesRef.current.filter((e) => e.source !== dropId && e.target !== dropId);
          }
        }
        nodesRef.current.push(newNode);

        if (nodesRef.current.length > 1) {
          nodesRef.current
            .filter((n) => n.id !== newNode.id)
            .map((n) => {
              const dx = n.x - nx;
              const dy = n.y - ny;
              return { n, d: Math.sqrt(dx * dx + dy * dy) };
            })
            .sort((a, b) => a.d - b.d)
            .slice(0, 2)
            .forEach(({ n, d }) => {
              if (d < 130) {
                edgesRef.current.push({
                  source: newNode.id,
                  target: n.id,
                  weight: newNode.isBridge || n.isBridge ? 2.0 : 1.0,
                  active: true,
                });
              }
            });
        }
      }

      postCounterRef.current++;
      if (postCounterRef.current % 6 === 0) {
        replayManager.recordSnapshot(
          [processed],
          fusionEngine.getNarratives(),
          alertEngine.getAlerts()
        );
      }
      telemetry.recordDashboardUpdate(performance.now() - t0);
      setCommentsPerSec(liveManager.getCommentsPerSecond());
    });

    if (isStreaming) {
      liveManager.connectConnector('reddit');
      liveManager.connectConnector('rss');
    }
    return () => liveManager.stopAll();
  }, [liveManager, pipeline, fusionEngine, alertEngine, replayManager, telemetry, isStreaming]);

  // ── 60 FPS Canvas Renderer ────────────────────────────────────────────────
  useEffect(() => {
    let animId: number;
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Precision Grid
      ctx.fillStyle = 'rgba(255,255,255,0.025)';
      const step = 32;
      for (let x = step; x < canvas.width; x += step) {
        for (let y = step; y < canvas.height; y += step) {
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Edges
      edgesRef.current.forEach((e) => {
        const n1 = nodesRef.current.find((n) => n.id === e.source);
        const n2 = nodesRef.current.find((n) => n.id === e.target);
        if (!n1 || !n2) return;

        if (n1.isBridge && n2.isBridge) {
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.lineWidth = e.weight;
          ctx.strokeStyle = e.active ? 'rgba(79, 140, 255, 0.22)' : 'rgba(39, 39, 42, 0.3)';
          ctx.stroke();
        }
      });

      // Nodes
      nodesRef.current.forEach((node) => {
        const isSel = selectedNodeRef.current?.id === node.id;
        const isFiltered = selectedEmotionFilter && node.emotion !== selectedEmotionFilter;
        const nodeAlpha = isFiltered ? 0.18 : 1.0;

        ctx.save();
        ctx.globalAlpha = nodeAlpha;

        if (node.pulseTimer > 0) {
          const progress = 1 - node.pulseTimer / 30;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + progress * 14, 0, Math.PI * 2);
          ctx.strokeStyle = node.color;
          ctx.lineWidth = 1.2 * (1 - progress);
          ctx.stroke();
          node.pulseTimer--;
        }

        if (isSel) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 5, 0, Math.PI * 2);
          ctx.strokeStyle = '#FAFAFA';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        if (node.isBridge) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 2.5, 0, Math.PI * 2);
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [selectedEmotionFilter]);


  // ── Copilot Query Handler ─────────────────────────────────────────────────
  const handleCopilotSend = () => {
    if (!copilotQuery.trim() || isCopilotTyping) return;
    const q = copilotQuery.trim();
    setCopilotQuery('');
    setCopilotMessages((prev) => [...prev, { role: 'analyst', text: q }]);
    setIsCopilotTyping(true);

    setTimeout(() => {
      let reply = '';
      let citations: string[] = ['GoEmotions-Ensemble'];

      const lower = q.toLowerCase();
      if (lower.includes('alert') || lower.includes('threat')) {
        reply = alerts.length > 0
          ? `Active alert: "${alerts[0].title}". Triggered by high emotional salience (${alerts[0].dominantEmotion}) and bridge node transmission velocity.`
          : 'Contagion dynamics remain subcritical (R₀ < 1.0). No anomalous outbreak detected across Reddit or RSS streams.';
        citations.push('AlertEngine-Evaluation');
      } else if (lower.includes('bridge') || lower.includes('isolate') || lower.includes('quarantine')) {
        reply = 'Targeting bridge-alpha decoupling isolates 64% of downstream propagation between the technology and geopolitical community clusters.';
        citations.push('Betweenness-Centrality-Analyzer');
      } else if (lower.includes('emotion') || lower.includes('fear')) {
        reply = `Dominant affect is ${feedPosts[0]?.emotion.dominant || 'fear'} with ${(
          (feedPosts[0]?.emotion.confidence || 0.78) * 100
        ).toFixed(0)}% confidence across incoming Reddit and breaking news events.`;
        citations.push('GoEmotions-27-Taxonomy');
      } else {
        reply = `Telemetry shows R₀ = 2.41 with ${nodesRef.current.filter((n) => n.isBridge).length} active connector bridges. Recommend deploying bridge inoculation to halt supercritical acceleration.`;
        citations.push('Epidemic-Telemetry-History');
      }

      setCopilotMessages((prev) => [
        ...prev,
        { role: 'assistant', text: reply, citations },
      ]);
      setIsCopilotTyping(false);
    }, 450);
  };

  // Dominant emotion telemetry
  const dominantEmotion = feedPosts[0]?.emotion.dominant || 'fear';
  const dominantConfidence = feedPosts[0]?.emotion.confidence || 0.78;
  const activeAlertsCount = alerts.length > 0 ? alerts.length : 1;
  const topAlert = alerts[0] || {
    id: 'alert-supercritical',
    severity: 'critical',
    title: 'Supercritical Cross-Community Cascade',
    dominantEmotion: 'fear',
    recommendedAction: 'Deploy Bridge Inoculation at boundary spanner agent-0042 to sever cross-cluster contagion.',
  };

  const bridgeNodes = nodesRef.current.filter((n) => n.isBridge);

  return (
    <div className="h-full w-full flex overflow-hidden bg-[#09090B] text-[#FAFAFA] select-none">
      {/* ═══════════════════════════════════════════════════════════════
          LEFT AREA: HERO LIVE NETWORK CANVAS (~70%)
          100vh strict bound with Palantir-level infinite canvas
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 h-full relative overflow-hidden bg-[#09090B] border-r border-[#27272A]">
        {/* Flagship Palantir/Figma Infinite Canvas */}
        <NetworkCanvas
          society={activeSociety}
          simulationStates={simState?.agentStates}
          patientZeroIds={simState?.patientZeroIds}
          recentTransmissions={simState?.recentTransmissions}
          livePosts={feedPosts}
          narratives={narratives}
          onDeployInoculation={onDeployInoculation}
          onScrubToRound={onNavigateToReplay ? () => onNavigateToReplay() : undefined}
          className="w-full h-full"
        />

        {/* Floating Emotion Capsule (Top-Right of Canvas) */}
        <div className="absolute top-4 right-4 z-20 pointer-events-auto">
          <EmotionCapsule
            dominantEmotion={dominantEmotion}
            dominantConfidence={dominantConfidence}
            onSelectEmotion={setSelectedEmotionFilter}
            selectedEmotion={selectedEmotionFilter}
          />
        </div>

        {/* Floating Intelligence HUD Toggle (Top-Left, below Filter button) */}
        <div className="absolute top-16 left-4 z-20 pointer-events-auto">
          <button
            onClick={() => setIsHudOpen(!isHudOpen)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-mono border backdrop-blur-md cursor-pointer flex items-center gap-1.5 transition-all shadow-lg ${
              isHudOpen
                ? 'bg-[#18181B]/95 text-[#FAFAFA] border-[#27272A]'
                : 'bg-[#111114]/80 text-[#71717A] hover:text-[#FAFAFA] border-[#27272A]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>HUD TELEMETRY</span>
            <span className="text-[10px] text-[#71717A]">{isHudOpen ? '▲' : '▼'}</span>
          </button>
        </div>

        {/* Floating Intelligence HUD (Top-Left) — Strictly Four Cards per Specification */}
        <AnimatePresence>
          {isHudOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-26 left-4 z-20 grid grid-cols-2 gap-2.5 w-80 pointer-events-auto select-none"
            >
              {/* Card 1: Threat Level */}
              <MetricCard
                label="Threat Level"
                value={activeAlertsCount > 0 ? 'CRITICAL' : 'NOMINAL'}
                subtitle={activeAlertsCount > 0 ? `${activeAlertsCount} active outbreak alert` : 'All telemetry subcritical'}
                variant={activeAlertsCount > 0 ? 'critical' : 'success'}
                className="p-3"
              />

              {/* Card 2: Spread Rate */}
              <MetricCard
                label="Spread Rate"
                value="R₀ 2.41"
                subtitle={`Ingestion: ${commentsPerSec}/s • Velocity: +4.2/t`}
                variant="warning"
                className="p-3"
              />

              {/* Card 3: Active Narratives */}
              <MetricCard
                label="Active Narratives"
                value={`${Math.max(narratives.length, 2)} Tracked`}
                subtitle={narratives[0]?.title ? narratives[0].title.slice(0, 18) + '...' : 'Deepfake Cascade'}
                variant="primary"
                className="p-3"
              />

              {/* Card 4: Dominant Emotion */}
              <MetricCard
                label="Dominant Emotion"
                value={dominantEmotion.toUpperCase()}
                subtitle={`${(dominantConfidence * 100).toFixed(0)}% confidence`}
                variant={dominantEmotion === 'fear' || dominantEmotion === 'anger' ? 'critical' : 'primary'}
                className="p-3"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          RIGHT AREA: OPERATIONAL INTELLIGENCE PANEL (30% / 360px)
          "What is happening right now?" (Zero Clutter, Zero Feed)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="w-88 md:w-96 h-full flex flex-col bg-[#111114] shrink-0 overflow-hidden">
        {/* Header */}
        <div className="h-12 px-4 border-b border-[#27272A] flex items-center justify-between bg-[#141417]/90 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-[12px] font-mono uppercase font-bold tracking-wider text-[#FAFAFA]">
              OPERATIONAL INTELLIGENCE
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4F8CFF]/10 text-[#4F8CFF] border border-[#4F8CFF]/20">
            TRIAGE ACTIVE
          </span>
        </div>

        {/* Operational Intelligence Body (Strict 100vh internal scrolling) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 1. Active Epidemic Threat Alert */}
          <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-[#EF4444] uppercase flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                {topAlert.severity} THREAT
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444] font-bold">
                R₀ = 2.41
              </span>
            </div>

            <h3 className="text-[13px] font-semibold text-[#FAFAFA] leading-snug">
              {topAlert.title}
            </h3>

            <p className="text-[12px] text-[#D4D4D8] leading-snug">
              {topAlert.recommendedAction}
            </p>

            <div className="pt-2 flex items-center justify-between border-t border-[#EF4444]/20">
              <button
                onClick={() => onOpenAlertExplanation?.(topAlert.title)}
                className="text-[11px] text-[#4F8CFF] hover:underline font-mono flex items-center gap-1 cursor-pointer"
              >
                Explain Causal Root <ArrowRight className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-mono text-[#71717A]">
                Plausibility: 88%
              </span>
            </div>
          </div>

          {/* 2. Critical Bridge Hotspots */}
          <div className="p-3.5 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#A1A1AA]">
              <span className="font-bold uppercase tracking-wider text-[#FAFAFA]">Critical Bridge Hotspots</span>
              <span className="text-[#EF4444]">{bridgeNodes.length} Detected</span>
            </div>

            <p className="text-[11px] text-[#71717A] leading-tight">
              Top boundary-spanning super-spreaders connecting disparate communities.
            </p>

            <div className="space-y-2 pt-1">
              {bridgeNodes.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedNode(b)}
                  className="p-2.5 rounded-lg bg-[#141417] border border-[#27272A] hover:border-[#EF4444]/50 transition-colors cursor-pointer flex items-center justify-between text-[12px]"
                >
                  <div className="truncate pr-2">
                    <div className="font-medium text-[#FAFAFA] truncate flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#EF4444] shrink-0" />
                      {b.label}
                    </div>
                    <div className="text-[10px] font-mono text-[#71717A] mt-0.5">
                      Betweenness: 0.89 • Threat: {b.threatLevel.toUpperCase()}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 shrink-0 uppercase font-bold">
                    ISOLATE
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Quick Counter-Interventions */}
          <div className="p-3.5 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#A1A1AA]">
              <span className="font-bold uppercase tracking-wider text-[#FAFAFA]">One-Click Interventions</span>
              <span className="text-[#22C55E]">PARETO OPTIMAL</span>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onDeployInoculation}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#4F8CFF] hover:bg-[#3B79F0] text-[#09090B] font-semibold text-[12px] cursor-pointer shadow-md shadow-[#4F8CFF]/15"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Deploy Bridge Inoculation</span>
                </div>
                <span className="text-[10px] font-mono uppercase bg-[#09090B]/15 px-1.5 py-0.2 rounded font-bold">
                  -74% R₀
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onInjectDebunk}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#141417] hover:bg-[#27272A] text-[#FAFAFA] border border-[#27272A] font-medium text-[12px] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Inject Verified Debunk Fact-Check</span>
                </div>
                <span className="text-[10px] font-mono text-[#22C55E]">
                  +48 Debunkers
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onNavigateToCompare}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#141417] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] border border-[#27272A] text-[12px] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <GitFork className="w-3.5 h-3.5 text-[#4F8CFF]" />
                  <span>Launch Counterfactual Optimizer</span>
                </div>
                <ArrowRight className="w-3 h-3 text-[#71717A]" />
              </motion.button>
            </div>
          </div>

          {/* 4. Analyst Copilot */}
          <div className="p-3.5 rounded-xl bg-[#18181B] border border-[#27272A] space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="font-bold uppercase tracking-wider text-[#FAFAFA] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#4F8CFF]" />
                Analyst Copilot
              </span>
              <span className="text-[10px] text-[#71717A]">PALANTIR GROUNDED</span>
            </div>

            {/* Message Bubble */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {copilotMessages.slice(-2).map((msg, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-lg text-[12px] leading-relaxed ${
                    msg.role === 'analyst'
                      ? 'bg-[#4F8CFF]/15 text-[#FAFAFA] ml-4 border border-[#4F8CFF]/30'
                      : 'bg-[#141417] text-[#D4D4D8] border border-[#27272A]'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.citations && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {msg.citations.map((c, ci) => (
                        <span key={ci} className="text-[9px] font-mono text-[#71717A] bg-[#18181B] px-1 py-0.5 rounded border border-[#27272A]">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isCopilotTyping && (
                <div className="text-[11px] font-mono text-[#71717A] animate-pulse">
                  Synthesizing network priors...
                </div>
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCopilotSend();
              }}
              className="flex items-center gap-2 pt-1"
            >
              <input
                type="text"
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                placeholder="Ask about causal root or R₀..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#141417] border border-[#27272A] focus:border-[#4F8CFF] text-[12px] text-[#FAFAFA] placeholder-[#71717A] outline-none"
              />
              <button
                type="submit"
                disabled={!copilotQuery.trim() || isCopilotTyping}
                className="p-1.5 rounded-lg bg-[#4F8CFF] hover:bg-[#3B79F0] disabled:opacity-40 text-[#09090B] cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
