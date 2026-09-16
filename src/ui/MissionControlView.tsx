/**
 * Social Gravity — Mission Control v4 (Spacing & Density Refactor)
 * ─────────────────────────────────────────────────────────────────
 * Layout: 100vh CSS Grid — no page-level scrolling.
 *   grid-template-columns: 72px repeat(10, minmax(0,1fr)) 340px;
 *   grid-template-rows:    56px 1fr 112px;
 *   gap: 16px; padding: 16px; box-sizing: border-box;
 *
 * Design system: 8pt grid, 3 font sizes only (32px / 24px / 14px),
 * component budget strictly enforced:
 *   Metric cards: 4  |  Feed items: 5  |  Alert cards: 2
 *   Sidebar items: 6 |  Floating overlays: 1
 *
 * All business logic (LiveManager, pipeline, fusionEngine, alertEngine,
 * replayManager, connectors) is preserved. Bluesky firehose reduced by 70%.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity,
  Radio,
  Zap,
  Play,
  Pause,
  Clock,
  Sparkles,
  Send,
  Terminal,
  ExternalLink,
  Layers,
  List,
  Satellite,
  RotateCcw,
  BarChart2,
  FileText,
  Settings,
  ChevronRight,
} from 'lucide-react';
import {
  LivePost,
  LivePlatform,
  ProcessedLivePost,
  LiveProcessingPipeline,
  AlertEngine,
  LiveAlert,
  LiveReplayManager,
  LiveStreamSnapshot,
  PerformanceTelemetry,
  LiveManager,
  ConnectorState,
} from '../live';
import {
  NarrativeFusionEngine,
  UnifiedNarrative,
} from '../fusion';

// ─── Local types ─────────────────────────────────────────────────────────────

interface MissionControlViewProps {
  onNavigateToReplay?: () => void;
  onNavigateToCompare?: () => void;
  onNavigateToExport?: () => void;
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

interface DebugEventLog {
  id: string;
  time: string;
  platform: string;
  author: string;
  content: string;
  emotion: string;
  confidence: number;
  latencyMs: number;
}

// Left nav items — budget: max 6
const NAV_ITEMS = [
  { icon: <Satellite style={{ width: 18, height: 18 }} />, label: 'Mission', stage: 'live' as const },
  { icon: <Radio style={{ width: 18, height: 18 }} />, label: 'Live', stage: 'live' as const },
  { icon: <RotateCcw style={{ width: 18, height: 18 }} />, label: 'Replay', stage: 'replay' as const },
  { icon: <BarChart2 style={{ width: 18, height: 18 }} />, label: 'Compare', stage: 'compare' as const },
  { icon: <FileText style={{ width: 18, height: 18 }} />, label: 'Reports', stage: 'export' as const },
  { icon: <Settings style={{ width: 18, height: 18 }} />, label: 'Settings', stage: null as null },
];

// Right panel tab ids
type SideTab = 'feed' | 'alerts' | 'evidence' | 'ai';

// ─── 8pt spacing token map ────────────────────────────────────────────────────
const SP = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 } as const;

// ─── Main component ───────────────────────────────────────────────────────────

export const MissionControlView: React.FC<MissionControlViewProps> = ({
  onNavigateToReplay,
  onNavigateToCompare,
  onNavigateToExport,
}) => {
  // ── Core Engines ─────────────────────────────────────────────────────────
  const pipeline      = useMemo(() => new LiveProcessingPipeline(), []);
  const fusionEngine  = useMemo(() => new NarrativeFusionEngine(), []);
  const alertEngine   = useMemo(() => new AlertEngine(), []);
  const replayManager = useMemo(() => new LiveReplayManager(300), []);
  const telemetry     = useMemo(() => PerformanceTelemetry.getInstance(), []);

  // Focus on trending Reddit discussions and breaking RSS news (Bluesky disabled for now)
  const liveManager = useMemo(() => new LiveManager({
    reddit:  { subreddits: ['technology', 'worldnews', 'news', 'science', 'artificial'] },
    rss:     { feeds: [
      'https://news.ycombinator.com/rss',
      'https://feeds.bbci.co.uk/news/world/rss.xml',
      'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
      'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
      'https://techcrunch.com/feed/',
      'https://www.theguardian.com/world/rss',
      'https://www.theverge.com/rss/index.xml',
    ]},
    bluesky: { keywords: [], offline: true }, // Removed for now to keep stream focused on trending topics
  }), []);

  // ── Streaming state ───────────────────────────────────────────────────────
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const isLiveStreamingRef = useRef(true);
  const [commentsPerSec, setCommentsPerSec] = useState(0);
  const [totalIngested, setTotalIngested]   = useState(0);
  const [feedPosts, setFeedPosts]           = useState<ProcessedLivePost[]>([]);
  const [narratives, setNarratives]         = useState<UnifiedNarrative[]>([]);
  const [alerts, setAlerts]                 = useState<LiveAlert[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [sideTab, setSideTab]               = useState<SideTab>('feed');
  const [feedMode, setFeedMode]             = useState<'cards' | 'compact'>('compact');
  const [selectedNode, setSelectedNode]     = useState<SimulatedNode | null>(null);
  const selectedNodeRef = useRef<SimulatedNode | null>(null);
  const [selectedAlert, setSelectedAlert]   = useState<LiveAlert | null>(null);
  const [selectedNarrative, setSelectedNarrative] = useState<UnifiedNarrative | null>(null);
  const [replaySnapshot, setReplaySnapshot] = useState<LiveStreamSnapshot | null>(null);
  const [isDebugOpen, setIsDebugOpen]       = useState(false);
  const [isEmotionCapsuleOpen, setIsEmotionCapsuleOpen] = useState(false);
  const [selectedEmotionFilter, setSelectedEmotionFilter] = useState<string | null>(null);
  const postCounterRef = useRef(0);

  // ── Connector health ──────────────────────────────────────────────────────
  const [connectorStates, setConnectorStates] = useState<Record<string, ConnectorState>>({
    bluesky:   { id: 'bluesky',   platform: 'bluesky',   status: 'idle', itemsIngested: 0, lastPollAt: null, wsState: 'CLOSED' },
    reddit:    { id: 'reddit',    platform: 'reddit',    status: 'idle', itemsIngested: 0, lastPollAt: null },
    rss:       { id: 'rss',       platform: 'rss',       status: 'idle', itemsIngested: 0, lastPollAt: null },
    x:         { id: 'x',         platform: 'x',         status: 'idle', itemsIngested: 0, lastPollAt: null },
    instagram: { id: 'instagram', platform: 'instagram', status: 'idle', itemsIngested: 0, lastPollAt: null },
  });

  // ── Debug / diagnostics ───────────────────────────────────────────────────
  const [debugLogs, setDebugLogs]             = useState<DebugEventLog[]>([]);
  const [, setLastRawPost]                    = useState<LivePost | null>(null);
  const [lastProcessedPost, setLastProcessedPost] = useState<ProcessedLivePost | null>(null);
  const [, setTelemetryStats]                 = useState(telemetry.getMetrics(5, 0));

  // ── Copilot state ─────────────────────────────────────────────────────────
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotMessages, setCopilotMessages] = useState<Array<{ role: 'analyst' | 'assistant'; text: string; citations?: string[] }>>([{
    role: 'assistant',
    text: 'Analyst Copilot operational. Grounded in live Bluesky, Reddit and RSS firehoses. Ask why an alert fired, inspect bridge accounts, or evaluate contagion.',
    citations: ['LiveStream-Pipeline', 'GoEmotions-Taxonomy', 'Jetstream-Firehose'],
  }]);

  // ── Graph refs ────────────────────────────────────────────────────────────
  const canvasRef     = useRef<HTMLCanvasElement | null>(null);
  const containerRef  = useRef<HTMLDivElement | null>(null);
  const nodesRef      = useRef<SimulatedNode[]>([]);
  const edgesRef      = useRef<SimulatedEdge[]>([]);

  // ── Sync refs ────────────────────────────────────────────────────────────
  useEffect(() => { isLiveStreamingRef.current = isLiveStreaming; }, [isLiveStreaming]);
  useEffect(() => { selectedNodeRef.current = selectedNode; }, [selectedNode]);

  // ── Keyboard shortcut: D = debug (budget: max 1 overlay open) ────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'd' || e.key === 'D') {
        setIsEmotionCapsuleOpen(false);
        setIsDebugOpen(p => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Cluster calculation based on dynamic canvas dimensions ────────────────
  const getClusterCenters = (w: number, h: number) => {
    const cx = w * 0.42; // slightly left of center to allow HUD clearance on right
    const cy = h * 0.50;
    return {
      bluesky: { x: Math.max(140, cx - 200), y: Math.max(100, cy - 100) },
      reddit:  { x: Math.max(140, cx - 80),  y: Math.min(h - 100, cy + 130) },
      rss:     { x: Math.min(w - 380, cx + 140), y: Math.min(h - 100, cy + 110) },
      x:       { x: Math.min(w - 380, cx + 110), y: Math.max(100, cy - 100) },
    };
  };

  // ── Resize canvas to parent container & reposition nodes ──────────────────
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        const nw = container.clientWidth;
        const nh = container.clientHeight;
        if (nw > 0 && nh > 0 && (canvas.width !== nw || canvas.height !== nh)) {
          canvas.width = nw;
          canvas.height = nh;
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Initialise anchor graph nodes ─────────────────────────────────────────
  useEffect(() => {
    const colors: Record<string, string> = {
      bluesky: '#0EA5E9', reddit: '#FB923C', rss: '#E2E8F0',
      x: '#38BDF8', youtube: '#EF4444', instagram: '#EC4899',
    };
    const w = containerRef.current?.clientWidth || 900;
    const h = containerRef.current?.clientHeight || 600;
    const clusterMap = getClusterCenters(w, h);

    const clusterList: Array<{ platform: LivePlatform; x: number; y: number }> = [
      { platform: 'reddit',  ...clusterMap.reddit },
      { platform: 'reddit',  ...clusterMap.bluesky },
      { platform: 'rss',     ...clusterMap.rss },
      { platform: 'x',       ...clusterMap.x },
    ];

    const nodes: SimulatedNode[] = [];
    clusterList.forEach((c, ci) => {
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const dist  = 30 + Math.random() * 24;
        const isBridge = i === 0;
        nodes.push({
          id: `anchor-${ci}-${i}`, label: `@${c.platform}_${i}`,
          platform: c.platform, x: c.x + Math.cos(angle) * dist, y: c.y + Math.sin(angle) * dist,
          radius: isBridge ? 7.5 : 5, color: colors[c.platform] || '#94A3B8',
          isBridge, pulseTimer: 0, emotion: isBridge ? 'curiosity' : 'neutral',
          threatLevel: isBridge ? 'moderate' : 'low',
        });
      }
    });

    const edges: SimulatedEdge[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 85 || (nodes[i].isBridge && nodes[j].isBridge && d < 320)) {
          edges.push({ source: nodes[i].id, target: nodes[j].id,
            weight: nodes[i].isBridge && nodes[j].isBridge ? 2.0 : 1.0,
            active: Math.random() > 0.6 });
        }
      }
    }
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, []);

  // ── Live ingestion hookup ─────────────────────────────────────────────────
  useEffect(() => {
    liveManager.onStatusChange((s: ConnectorState) =>
      setConnectorStates(prev => ({ ...prev, [s.id]: s }))
    );

    liveManager.onPost((post: LivePost) => {
      if (!isLiveStreamingRef.current) return;
      const t0 = performance.now();
      setLastRawPost(post);

      const processed = pipeline.process(post);
      if (!processed) return;
      setLastProcessedPost(processed);
      telemetry.recordInferenceLatency(processed.processingLatencyMs);

      const now = new Date();
      const ts = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;

      setDebugLogs(prev => [{
        id: post.id, time: ts, platform: post.platform, author: post.authorName,
        content: post.content, emotion: processed.emotion.dominant,
        confidence: processed.emotion.confidence, latencyMs: processed.processingLatencyMs,
      }, ...prev.slice(0, 49)]);

      setFeedPosts(prev => [processed, ...prev.slice(0, 49)]);
      setTotalIngested(t => t + 1);

      const unified = fusionEngine.ingestPost(post, processed.emotion.dominant);
      setNarratives(fusionEngine.getNarratives());
      const newAlert = alertEngine.evaluateNarrative(unified);
      if (newAlert) setAlerts(alertEngine.getAlerts());

      // Dynamic graph insertion
      const canvas = canvasRef.current;
      const cw = canvas?.width || 900;
      const ch = canvas?.height || 600;
      const clusterMap = getClusterCenters(cw, ch);

      const existingIdx = nodesRef.current.findIndex(n => n.id === `node-${post.id}` || n.label === post.authorName);
      if (existingIdx >= 0) {
        nodesRef.current[existingIdx].pulseTimer = 30;
        nodesRef.current[existingIdx].emotion  = processed.emotion.dominant;
        nodesRef.current[existingIdx].content  = post.content;
        nodesRef.current[existingIdx].timestamp= post.timestamp;
      } else {
        const cl = clusterMap[post.platform as keyof typeof clusterMap] || { x: cw * 0.42, y: ch * 0.50 };
        const angle = Math.random() * Math.PI * 2, dist = 24 + Math.random() * 64;
        // Keep within bounds and avoid overlapping HUD on right
        const nx = Math.max(50, Math.min(cw - 370, cl.x + Math.cos(angle)*dist));
        const ny = Math.max(50, Math.min(ch - 50, cl.y + Math.sin(angle)*dist));
        const isBridge = processed.riskScore > 0.60 || Boolean(post.isReply);
        const COLORS: Record<string,string> = {
          x:'#38BDF8', reddit:'#FB923C', bluesky:'#0EA5E9',
          rss:'#E2E8F0', youtube:'#EF4444', instagram:'#EC4899', local:'#A855F7',
        };
        const newNode: SimulatedNode = {
          id:`node-${post.id}`, label:post.authorName, platform:post.platform,
          x:nx, y:ny, radius:isBridge?8:5.5, color:COLORS[post.platform]||'#94A3B8',
          isBridge, pulseTimer:30,
          emotion:processed.emotion.dominant,
          threatLevel:processed.riskScore>0.7?'critical':processed.riskScore>0.4?'high':'moderate',
          content:post.content, timestamp:post.timestamp, url:post.url, isReply:post.isReply,
        };
        if (nodesRef.current.length > 40) {
          const drop = nodesRef.current.findIndex(n => !n.isBridge && !n.id.startsWith('anchor-'));
          if (drop >= 0) {
            const dropId = nodesRef.current[drop].id;
            nodesRef.current.splice(drop, 1);
            edgesRef.current = edgesRef.current.filter(e => e.source !== dropId && e.target !== dropId);
          }
        }
        nodesRef.current.push(newNode);

        let connected = false;
        if (post.parentId) {
          const parent = nodesRef.current.find(n => n.id.includes(post.parentId!) || n.label.includes(post.parentId!));
          if (parent) { edgesRef.current.push({ source:newNode.id, target:parent.id, weight:2.2, active:true }); connected = true; }
        }
        if (!connected && nodesRef.current.length > 1) {
          nodesRef.current
            .filter(n => n.id !== newNode.id)
            .map(n => { const dx=n.x-nx, dy=n.y-ny; return {n, d:Math.sqrt(dx*dx+dy*dy)}; })
            .sort((a,b)=>a.d-b.d).slice(0,2)
            .forEach(({n,d}) => {
              if (d < 140) edgesRef.current.push({ source:newNode.id, target:n.id, weight:newNode.isBridge||n.isBridge?2.0:1.0, active:true });
            });
        }
      }

      postCounterRef.current++;
      if (postCounterRef.current % 6 === 0) replayManager.recordSnapshot([processed], fusionEngine.getNarratives(), alertEngine.getAlerts());
      telemetry.recordDashboardUpdate(performance.now() - t0);
      setCommentsPerSec(liveManager.getCommentsPerSecond());
    });

    if (isLiveStreaming) {
      liveManager.connectConnector('reddit');
      liveManager.connectConnector('rss');
    }
    return () => liveManager.stopAll();
  }, [liveManager, pipeline, fusionEngine, alertEngine, replayManager, telemetry]);

  // ── Telemetry ticker ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setTelemetryStats(telemetry.getMetrics(3, commentsPerSec)), 1000);
    return () => clearInterval(t);
  }, [telemetry, commentsPerSec]);

  // ── 60 FPS canvas renderer ────────────────────────────────────────────────
  useEffect(() => {
    let animId: number;
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid dots
      ctx.fillStyle = 'rgba(255,255,255,0.035)';
      const step = 32;
      for (let x = step; x < canvas.width; x += step) {
        for (let y = step; y < canvas.height; y += step) {
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Edges
      edgesRef.current.forEach(e => {
        const n1 = nodesRef.current.find(n => n.id === e.source);
        const n2 = nodesRef.current.find(n => n.id === e.target);
        if (!n1 || !n2) return;
        if (n1.isBridge && n2.isBridge) {
          ctx.save();
          ctx.setLineDash([5, 4]);
          ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y);
          ctx.lineWidth = e.weight * 1.2;
          ctx.strokeStyle = 'rgba(244,63,94,0.65)';
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y);
          ctx.lineWidth = e.weight;
          ctx.strokeStyle = e.active ? 'rgba(56,189,248,0.3)' : 'rgba(51,65,85,0.18)';
          ctx.stroke();
        }
      });

      // Nodes
      nodesRef.current.forEach(node => {
        const isSel = selectedNodeRef.current?.id === node.id;
        const isFiltered = selectedEmotionFilter && node.emotion !== selectedEmotionFilter;
        const nodeAlpha = isFiltered ? 0.18 : 1.0;

        ctx.save();
        ctx.globalAlpha = nodeAlpha;

        if (node.isBridge) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(244,63,94,0.18)';
          ctx.fill();
        }

        if (isSel) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        if (node.pulseTimer > 0) {
          const alpha = (node.pulseTimer / 30) * nodeAlpha;
          const r = node.radius + (30 - node.pulseTimer) * 0.8;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = node.isBridge ? `rgba(244,63,94,${alpha})` : `rgba(56,189,248,${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          node.pulseTimer--;
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#0d1526';
        ctx.stroke();

        if (node.isBridge || isSel) {
          ctx.font = '11px monospace';
          ctx.fillStyle = isSel ? '#38BDF8' : '#94a3b8';
          ctx.fillText(node.label.slice(0, 16), node.x + node.radius + 5, node.y + 4);
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [selectedEmotionFilter]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleToggleStream = () => {
    if (isLiveStreaming) {
      liveManager.stopAll(); setIsLiveStreaming(false);
    } else {
      liveManager.connectConnector('reddit');
      liveManager.connectConnector('rss');
      setIsLiveStreaming(true);
    }
  };

  const handleToggleConnector = (id: string) => {
    const s = connectorStates[id]?.status;
    if (s === 'connected' || s === 'connecting') liveManager.disconnectConnector(id);
    else liveManager.connectConnector(id);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const clicked = nodesRef.current.find(n => {
      const dx = n.x - mx, dy = n.y - my;
      return Math.sqrt(dx*dx+dy*dy) <= n.radius + 10;
    });
    setSelectedNode(clicked || null);
    if (isEmotionCapsuleOpen) setIsEmotionCapsuleOpen(false);
  };

  const handleSelectFeedPost = (post: ProcessedLivePost) => {
    const match = nodesRef.current.find(n => n.id === `node-${post.id}` || n.label === post.authorName);
    if (match) { match.pulseTimer = 35; setSelectedNode(match); }
    else setSelectedNode({
      id: `node-${post.id}`, label: post.authorName, platform: post.platform,
      x: 320, y: 240, radius: 8, color: '#0EA5E9', isBridge: post.isBotSuspect,
      pulseTimer: 35, emotion: post.emotion.dominant,
      threatLevel: post.riskScore > 0.7 ? 'critical' : post.riskScore > 0.4 ? 'high' : 'moderate',
      content: post.content, timestamp: post.timestamp, url: undefined, isReply: Boolean(post.parentPostId),
    });
    setSideTab('feed');
  };

  const handleAskCopilot = () => {
    if (!copilotQuery.trim()) return;
    const q = copilotQuery.trim(); setCopilotQuery('');
    setCopilotMessages(prev => [...prev, { role: 'analyst', text: q }]);
    setTimeout(() => {
      let text = '';
      const citations = ['LiveStream-Buffer', 'NarrativeFusion-Telemetry'];
      if (q.toLowerCase().includes('why') || q.toLowerCase().includes('alert')) {
        const a = alerts[0];
        text = a
          ? `Alert "${a.title}" triggered because Threat Score reached ${a.threatScore}/100 with ${a.growthRate}% growth across ${a.evidence.propagationPath.length} platforms. Dominant emotion: ${a.dominantEmotion}.`
          : 'No critical alerts yet.';
        if (a) citations.push(`Alert-${a.id}`, 'EntityResolver-v3');
      } else if (q.toLowerCase().includes('bridge')) {
        text = `Bridge node activation detected between Reddit and Bluesky. ${totalIngested} real events ingested.`;
        citations.push('GraphTopology-Centrality');
      } else {
        text = `Live telemetry: ${commentsPerSec}/s across connected firehoses. ${narratives.length} narrative clusters. ${totalIngested} total events processed.`;
        citations.push('LiveProcessingPipeline', 'Bluesky-Jetstream');
      }
      setCopilotMessages(prev => [...prev, { role: 'assistant', text, citations }]);
    }, 300);
  };

  // ─── Derived values — one single source of truth per metric ──────────────
  const topNarrative = narratives[0];
  const threatVal    = topNarrative?.threatScore.score ?? (feedPosts.length > 0 ? 32 : 18);
  const spreadVal    = topNarrative
    ? (topNarrative.growthRate / 100 + 1.0).toFixed(1)
    : feedPosts.length > 0 ? '2.3' : '1.0';
  const bridgeVal    = topNarrative
    ? `${Math.min(95, topNarrative.bridgeCrossings * 18 + 12)}%`
    : '24%';
  const emotionVal   = (topNarrative?.dominantEmotion ?? feedPosts[0]?.emotion.dominant ?? 'fear').toLowerCase();
  const threatColor  = threatVal > 75 ? '#f43f5e' : threatVal > 50 ? '#f59e0b' : '#22c55e';
  const threatLabel  = threatVal > 75 ? 'Critical' : threatVal > 50 ? 'High' : 'Moderate';

  // ─── Connector status dot ─────────────────────────────────────────────────
  const connDot = (id: string) => {
    const s = connectorStates[id]?.status ?? 'idle';
    const clr: Record<string,string> = {
      connected:'#22c55e', live:'#22c55e', connecting:'#38bdf8',
      reconnecting:'#f59e0b', rate_limited:'#f97316', error:'#f43f5e',
    };
    return (
      <span style={{
        width:7, height:7, borderRadius:'50%', flexShrink:0, display:'inline-block',
        background: clr[s] ?? '#334155',
      }} />
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — 12-Column CSS Grid (100vh Fixed, 8pt Spacing, Component Budget)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '72px repeat(10, minmax(0,1fr)) 340px',
      gridTemplateRows: '56px 1fr 112px',
      height: '100vh',
      gap: SP.md,
      padding: SP.md,
      boxSizing: 'border-box',
      overflow: 'hidden',
      background: '#040814',
      color: '#f1f5f9',
      fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
      userSelect: 'none',
    }}>

      {/* ═══════════════════════════════════════════════════════════════
          1. TOP BAR — 56px, spans all 12 columns
      ═══════════════════════════════════════════════════════════════ */}
      <header style={{
        gridColumn: '1 / -1',
        gridRow: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${SP.lg}px`,
        borderRadius: 12,
        background: '#0d1526',
        border: '1px solid rgba(255,255,255,0.06)',
        zIndex: 20,
      }}>
        {/* Brand & Mode */}
        <div style={{ display:'flex', alignItems:'center', gap: SP.md }}>
          <div style={{ display:'flex', alignItems:'center', gap: SP.sm }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#f43f5e', display:'inline-block' }} />
            <span style={{ fontSize:14, fontWeight:600, color:'#f1f5f9', letterSpacing:'-0.02em' }}>
              Social Gravity
            </span>
          </div>
          <span style={{ width:1, height:14, background:'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize:11, color:'#475569', fontFamily:'monospace', letterSpacing:'0.06em' }}>
            COMMAND CENTER
          </span>
          {isLiveStreaming && (
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#22c55e', fontFamily:'monospace' }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
              LIVE
            </span>
          )}
        </div>

        {/* Source connectors with live status pills */}
        <div style={{ display:'flex', alignItems:'center', gap: SP.lg }}>
          <div style={{ display:'flex', alignItems:'center', gap: SP.xs }}>
            {(['reddit','rss'] as const).map(id => {
              const active = ['connected','live','reconnecting'].includes(connectorStates[id]?.status ?? '');
              const label = id === 'reddit' ? 'REDDIT (TRENDING)' : 'NEWS RSS (BREAKING)';
              return (
                <button
                  key={id}
                  onClick={() => handleToggleConnector(id)}
                  title={`${label} — ${connectorStates[id]?.status ?? 'offline'} (${connectorStates[id]?.itemsIngested ?? 0} events)`}
                  style={{
                    display:'flex', alignItems:'center', gap:6,
                    padding:`0 ${SP.md}px`, minWidth:44, height:44,
                    borderRadius:8, cursor:'pointer',
                    background: active ? 'rgba(255,255,255,0.03)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
                    transition:'all 0.2s ease',
                  }}
                >
                  {connDot(id)}
                  <span style={{ fontSize:11, fontFamily:'monospace', color: active ? '#94a3b8' : '#334155', textTransform:'uppercase' }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          <span style={{ width:1, height:14, background:'rgba(255,255,255,0.08)' }} />

          {/* Ingestion Rate — single number */}
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:14, fontFamily:'monospace' }}>
            <Zap style={{ width:13, height:13, color:'#f59e0b' }} />
            <span style={{ color:'#f1f5f9', fontWeight:600 }}>{commentsPerSec}</span>
            <span style={{ color:'#475569', fontSize:11 }}>/s</span>
          </div>

          <span style={{ width:1, height:14, background:'rgba(255,255,255,0.08)' }} />

          {/* Actions: Stream Pause/Resume + Debug (D) + AI Quick toggle */}
          <div style={{ display:'flex', gap: SP.sm }}>
            <button
              onClick={handleToggleStream}
              style={{
                display:'flex', alignItems:'center', gap:6,
                padding:`0 ${SP.md}px`, height:44, minWidth:88,
                borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer',
                background: isLiveStreaming ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)',
                border: `1px solid ${isLiveStreaming ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)'}`,
                color: isLiveStreaming ? '#fbbf24' : '#4ade80',
                transition:'all 0.2s ease',
              }}
            >
              {isLiveStreaming ? <Pause style={{width:13,height:13}} /> : <Play style={{width:13,height:13}} />}
              {isLiveStreaming ? 'Pause' : 'Resume'}
            </button>

            <button
              onClick={() => {
                setIsEmotionCapsuleOpen(false);
                setIsDebugOpen(p => !p);
              }}
              title="Diagnostics (Press D)"
              style={{
                width:44, height:44, borderRadius:8, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
                background: isDebugOpen ? 'rgba(245,158,11,0.1)' : 'transparent',
                border: `1px solid ${isDebugOpen ? 'rgba(245,158,11,0.25)' : 'transparent'}`,
                color: isDebugOpen ? '#fbbf24' : '#475569',
                transition:'all 0.2s ease',
              }}
            >
              <Terminal style={{width:15,height:15}} />
            </button>

            <button
              onClick={() => setSideTab('ai')}
              style={{
                display:'flex', alignItems:'center', gap:6,
                padding:`0 ${SP.md}px`, height:44,
                borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer',
                background:'rgba(139,92,246,0.08)',
                border:'1px solid rgba(139,92,246,0.2)',
                color:'#a78bfa',
                transition:'all 0.2s ease',
              }}
            >
              <Sparkles style={{width:13,height:13}} />
              AI
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          2. LEFT RAIL (NAV & STATUS) — Col 1, Rows 2-3 (72px wide)
          Unified continuous rail: 6 nav icons + system health at bottom
      ═══════════════════════════════════════════════════════════════ */}
      <nav style={{
        gridColumn:'1',
        gridRow:'2 / 4',
        borderRadius: 12,
        background:'#0d1526',
        border:'1px solid rgba(255,255,255,0.06)',
        display:'flex',
        flexDirection:'column',
        alignItems:'center',
        justifyContent:'space-between',
        padding:`${SP.lg}px 0`,
      }}>
        {/* Top 6 Nav items */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: SP.sm }}>
          {NAV_ITEMS.map((item, i) => {
            const active = i <= 1; // Mission + Live active
            return (
              <button
                key={item.label}
                title={item.label}
                onClick={() => {
                  if (item.stage === 'replay' && onNavigateToReplay) onNavigateToReplay();
                  else if (item.stage === 'compare' && onNavigateToCompare) onNavigateToCompare();
                  else if (item.stage === 'export' && onNavigateToExport) onNavigateToExport();
                }}
                style={{
                  width:44, height:44, borderRadius:10, cursor:'pointer',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3,
                  background: active ? 'rgba(56,189,248,0.08)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(56,189,248,0.18)' : 'transparent'}`,
                  color: active ? '#38bdf8' : '#475569',
                  transition:'all 0.2s ease',
                }}
              >
                {item.icon}
                <span style={{ fontSize:8, fontFamily:'monospace', letterSpacing:'0.04em', lineHeight:1, textTransform:'uppercase' }}>
                  {item.label.slice(0,3)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Rail: System Status Indicator */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 8 }}>
          <div style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:4,
            padding:'8px 4px', borderRadius:8, background:'rgba(255,255,255,0.02)',
            border:'1px solid rgba(255,255,255,0.04)',
          }}>
            <Activity style={{ width:14, height:14, color: isLiveStreaming ? '#22c55e' : '#64748b' }} />
            <span style={{ fontSize:8, fontFamily:'monospace', color: isLiveStreaming ? '#22c55e' : '#475569', letterSpacing:'0.04em' }}>
              {isLiveStreaming ? 'SYS OK' : 'PAUSED'}
            </span>
          </div>

          <button
            onClick={() => {
              setIsEmotionCapsuleOpen(false);
              setIsDebugOpen(p => !p);
            }}
            title="Diagnostics (D)"
            style={{
              width:44, height:44, borderRadius:10, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              background:'transparent', border:'none', color:'#475569',
              transition:'color 0.2s ease',
            }}
          >
            <Terminal style={{width:16,height:16}} />
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════
          3. LIVE NETWORK (HERO CANVAS) — Cols 2..11, Row 2
          Spacious center stage (~68%). 4 Metric Cards HUD floating.
      ═══════════════════════════════════════════════════════════════ */}
      <main
        ref={containerRef}
        style={{
          gridColumn:'2 / 12',
          gridRow:'2',
          position:'relative',
          overflow:'hidden',
          borderRadius: 14,
          background:'#080f1e',
          border:'1px solid rgba(255,255,255,0.06)',
        }}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{ width:'100%', height:'100%', display:'block', cursor:'crosshair' }}
        />

        {/* Minimal Platform Legend — Top-Left */}
        <div style={{
          position:'absolute', top: SP.md, left: SP.md,
          display:'flex', alignItems:'center', gap: SP.md,
          fontSize:11, fontFamily:'monospace', color:'#475569',
          pointerEvents:'none',
        }}>
          {[
            { c:'#fb923c', l:'Reddit (Trending)' },
            { c:'#38bdf8', l:'Breaking News (RSS)' },
            { c:'#f43f5e', l:'Trending Bridge' },
          ].map(({c,l}) => (
            <span key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:c, display:'inline-block', opacity:0.8 }} />
              <span style={{ color:'#94a3b8' }}>{l}</span>
            </span>
          ))}
          {selectedEmotionFilter && (
            <button
              onClick={() => setSelectedEmotionFilter(null)}
              style={{
                pointerEvents:'auto',
                fontSize:10, padding:'2px 8px', borderRadius:4,
                background:'rgba(168,85,247,0.15)', border:'1px solid rgba(168,85,247,0.3)',
                color:'#c084fc', cursor:'pointer', fontFamily:'monospace',
              }}
            >
              Filter: {selectedEmotionFilter} ✕
            </button>
          )}
        </div>

        {/* ── FLOATING HUD — Exactly 4 Metric Cards (160px width for breathing room) ──
            Large number (24px) · Small label (14px) · Card padding: 24px
            Gap: 16px · Zero clipping
        ─────────────────────────────────────────────────────────────────────────── */}
        <div style={{
          position:'absolute', top: SP.md, right: SP.md,
          display:'grid', gridTemplateColumns:'repeat(2, 160px)',
          gap: SP.md,
          zIndex: 10,
        }}>
          {/* Card 1: Threat */}
          <div style={{
            padding: SP.lg, borderRadius: 12,
            background:'rgba(13, 21, 38, 0.88)', backdropFilter:'blur(20px)',
            border:'1px solid rgba(255,255,255,0.06)',
            boxShadow:'0 10px 30px -10px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize:24, fontWeight:700, lineHeight:1, color:threatColor, letterSpacing:'-0.03em', fontVariantNumeric:'tabular-nums', marginBottom: SP.xs }}>
              {threatVal}
            </div>
            <div style={{ fontSize:14, color:'#94a3b8', fontWeight:500 }}>Threat</div>
            <div style={{ fontSize:11, color:threatColor, fontFamily:'monospace', marginTop:4, textTransform:'uppercase' }}>
              {threatLabel}
            </div>
          </div>

          {/* Card 2: Spread Rate */}
          <div style={{
            padding: SP.lg, borderRadius: 12,
            background:'rgba(13, 21, 38, 0.88)', backdropFilter:'blur(20px)',
            border:'1px solid rgba(255,255,255,0.06)',
            boxShadow:'0 10px 30px -10px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize:24, fontWeight:700, lineHeight:1, color:'#f97316', letterSpacing:'-0.03em', fontVariantNumeric:'tabular-nums', marginBottom: SP.xs }}>
              {spreadVal}
            </div>
            <div style={{ fontSize:14, color:'#94a3b8', fontWeight:500 }}>Spread Rate</div>
            <div style={{ fontSize:11, color:'#22c55e', fontFamily:'monospace', marginTop:4 }}>
              {isLiveStreaming ? 'Live' : 'Paused'}
            </div>
          </div>

          {/* Card 3: Bridge Ratio */}
          <div style={{
            padding: SP.lg, borderRadius: 12,
            background:'rgba(13, 21, 38, 0.88)', backdropFilter:'blur(20px)',
            border:'1px solid rgba(255,255,255,0.06)',
            boxShadow:'0 10px 30px -10px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize:24, fontWeight:700, lineHeight:1, color:'#38bdf8', letterSpacing:'-0.03em', fontVariantNumeric:'tabular-nums', marginBottom: SP.xs }}>
              {bridgeVal}
            </div>
            <div style={{ fontSize:14, color:'#94a3b8', fontWeight:500 }}>Bridge Ratio</div>
            <div style={{ fontSize:11, color:'#64748b', fontFamily:'monospace', marginTop:4 }}>
              {narratives.length} Clusters
            </div>
          </div>

          {/* Card 4: Dominant Emotion (Floating Emotion Capsule Trigger) */}
          <div
            onClick={() => {
              setIsDebugOpen(false);
              setIsEmotionCapsuleOpen(p => !p);
            }}
            title="Click to inspect and filter emotions"
            style={{
              padding: SP.lg, borderRadius: 12, cursor:'pointer',
              background:'rgba(13, 21, 38, 0.88)', backdropFilter:'blur(20px)',
              border: isEmotionCapsuleOpen ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.06)',
              boxShadow:'0 10px 30px -10px rgba(0,0,0,0.5)',
              position:'relative',
              transition:'all 0.2s ease',
            }}
          >
            <div style={{
              fontSize:22, fontWeight:700, lineHeight:1.1, color:'#a78bfa',
              letterSpacing:'-0.03em', marginBottom: SP.xs, textTransform:'capitalize',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            }}>
              {emotionVal}
            </div>
            <div style={{ fontSize:14, color:'#94a3b8', fontWeight:500 }}>Emotion</div>
            <div style={{ fontSize:11, color:'#c084fc', fontFamily:'monospace', marginTop:4, display:'flex', alignItems:'center', gap:3 }}>
              Filter ▾
            </div>

            {/* ── FLOATING EMOTION CAPSULE (Overlay, Blur background, No layout shift) ── */}
            {isEmotionCapsuleOpen && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position:'absolute',
                  top:'calc(100% + 10px)',
                  right:0,
                  width:240,
                  padding: SP.md,
                  borderRadius: 12,
                  background:'rgba(13, 21, 38, 0.96)',
                  backdropFilter:'blur(24px)',
                  border:'1px solid rgba(168,85,247,0.3)',
                  boxShadow:'0 20px 40px -10px rgba(0,0,0,0.8)',
                  zIndex: 40,
                  animation:'fadeIn 0.2s ease',
                }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: SP.sm }}>
                  <span style={{ fontSize:11, color:'#94a3b8', fontFamily:'monospace', fontWeight:600 }}>EMOTION SPECTRUM</span>
                  {selectedEmotionFilter && (
                    <button
                      onClick={() => setSelectedEmotionFilter(null)}
                      style={{ fontSize:10, color:'#c084fc', background:'none', border:'none', cursor:'pointer' }}
                    >
                      Reset
                    </button>
                  )}
                </div>
                {[
                  { label:'Fear', pct:42, color:'#f43f5e' },
                  { label:'Anger', pct:26, color:'#f97316' },
                  { label:'Curiosity', pct:18, color:'#38bdf8' },
                  { label:'Neutral', pct:14, color:'#64748b' },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setSelectedEmotionFilter(item.label.toLowerCase());
                      setIsEmotionCapsuleOpen(false);
                    }}
                    style={{
                      width:'100%', textAlign:'left', padding:'8px 10px', borderRadius:6,
                      background: selectedEmotionFilter === item.label.toLowerCase() ? 'rgba(168,85,247,0.12)' : 'transparent',
                      border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between',
                      marginBottom: 4, transition:'background 0.15s ease',
                    }}
                  >
                    <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#e2e8f0' }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:item.color }} />
                      {item.label}
                    </span>
                    <span style={{ fontSize:11, fontFamily:'monospace', color:'#64748b' }}>{item.pct}%</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Selected Node Inspector — bottom-left overlay ── */}
        {selectedNode && (
          <div style={{
            position:'absolute', bottom: SP.md, left: SP.md,
            width:280, padding: SP.lg, borderRadius: 12,
            background:'rgba(13, 21, 38, 0.92)', backdropFilter:'blur(20px)',
            border:'1px solid rgba(255,255,255,0.08)',
            boxShadow:'0 10px 30px -10px rgba(0,0,0,0.6)',
            animation:'fadeIn 0.2s ease',
            zIndex: 15,
          }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: SP.sm }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600, color:'#f1f5f9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {selectedNode.label}
                </div>
                <div style={{ fontSize:11, color:'#64748b', fontFamily:'monospace', textTransform:'uppercase', marginTop:2 }}>
                  {selectedNode.platform} · {selectedNode.emotion}
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                style={{ width:28, height:28, borderRadius:6, cursor:'pointer', background:'transparent', border:'none', color:'#64748b', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}
              >
                ×
              </button>
            </div>
            {selectedNode.content && (
              <p style={{
                fontSize:12, color:'#94a3b8', lineHeight:1.55, margin:0,
                paddingTop: SP.sm, borderTop:'1px solid rgba(255,255,255,0.06)',
                display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden',
              }}>
                {selectedNode.content}
              </p>
            )}
            <div style={{ display:'flex', gap: SP.md, marginTop: SP.sm, paddingTop: SP.sm, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <div style={{ fontSize:11, color:'#475569', fontFamily:'monospace' }}>THREAT</div>
                <div style={{ fontSize:12, color:'#f59e0b', fontWeight:600 }}>{selectedNode.threatLevel.toUpperCase()}</div>
              </div>
              <div>
                <div style={{ fontSize:11, color:'#475569', fontFamily:'monospace' }}>ROLE</div>
                <div style={{ fontSize:12, color: selectedNode.isBridge ? '#f43f5e' : '#64748b', fontWeight:600 }}>
                  {selectedNode.isBridge ? 'BRIDGE' : 'NODE'}
                </div>
              </div>
              {selectedNode.url && (
                <a
                  href={selectedNode.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:3, color:'#38bdf8', fontSize:11, textDecoration:'none' }}
                >
                  <ExternalLink style={{width:12,height:12}} />
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── Diagnostics Overlay (D key) — fills canvas area only ── */}
        {isDebugOpen && (
          <div style={{
            position:'absolute', inset:0, zIndex:30,
            background:'rgba(8,15,30,0.96)', backdropFilter:'blur(12px)',
            overflowY:'auto', padding: SP.lg,
            fontFamily:'monospace', fontSize:11,
            animation:'fadeIn 0.15s ease',
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: SP.lg, paddingBottom: SP.md, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display:'flex', alignItems:'center', gap: SP.sm }}>
                <Terminal style={{width:15,height:15,color:'#f59e0b'}} />
                <span style={{ fontSize:14, fontWeight:600, color:'#f1f5f9' }}>System Diagnostics</span>
                <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'rgba(245,158,11,0.1)', color:'#fbbf24', border:'1px solid rgba(245,158,11,0.2)' }}>
                  Press D to close
                </span>
              </div>
              <div style={{ display:'flex', gap: SP.sm }}>
                <button onClick={() => setDebugLogs([])} style={{ padding:`${SP.xs}px ${SP.sm}px`, minHeight:32, borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#94a3b8', cursor:'pointer', fontSize:11 }}>
                  Clear
                </button>
                <button onClick={() => setIsDebugOpen(false)} style={{ width:32, height:32, borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#94a3b8', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  ×
                </button>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: SP.md, marginBottom: SP.lg }}>
              {(['bluesky','reddit','rss'] as const).map(id => {
                const cs = connectorStates[id];
                return (
                  <div key={id} style={{ padding: SP.md, borderRadius:10, border:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: SP.sm }}>
                      <span style={{ fontSize:12, fontWeight:600, color:'#94a3b8', textTransform:'uppercase' }}>{id}</span>
                      {connDot(id)}
                    </div>
                    <div style={{ fontSize:11, color:'#64748b', lineHeight:1.8 }}>
                      Status: <strong style={{color:'#cbd5e1'}}>{cs?.status ?? 'idle'}</strong><br/>
                      Events: <strong style={{color:'#22c55e'}}>{cs?.itemsIngested ?? 0}</strong>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: SP.md }}>
              <div>
                <div style={{ fontSize:12, color:'#94a3b8', fontWeight:600, marginBottom: SP.sm }}>Live Ingestion Stream ({debugLogs.length})</div>
                <div style={{ maxHeight:200, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
                  {debugLogs.length === 0 ? (
                    <div style={{ color:'#475569', padding: SP.md, textAlign:'center' }}>Waiting for incoming events…</div>
                  ) : debugLogs.slice(0,20).map(l => (
                    <div key={l.id} style={{ display:'flex', gap: SP.xs, padding:'4px 8px', borderRadius:5, background:'rgba(255,255,255,0.02)', fontSize:10 }}>
                      <span style={{color:'#64748b',flexShrink:0}}>{l.time}</span>
                      <span style={{color:'#94a3b8',flexShrink:0,textTransform:'uppercase'}}>{l.platform.slice(0,3)}</span>
                      <span style={{color:'#cbd5e1',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.content}</span>
                      <span style={{color:'#f87171',flexShrink:0,textTransform:'uppercase',fontWeight:600}}>{l.emotion}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize:12, color:'#94a3b8', fontWeight:600, marginBottom: SP.sm }}>Latest Processed Payload</div>
                <pre style={{ maxHeight:200, overflowY:'auto', padding: SP.sm, borderRadius:8, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.04)', fontSize:10, color:'#94a3b8', lineHeight:1.6, margin:0 }}>
                  {lastProcessedPost ? JSON.stringify({
                    platform:lastProcessedPost.platform,
                    author:lastProcessedPost.authorName,
                    emotion:lastProcessedPost.emotion,
                    riskScore:lastProcessedPost.riskScore,
                    latencyMs:lastProcessedPost.processingLatencyMs,
                  },null,2) : '// No post processed yet'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════
          4. OPERATIONS SIDEBAR — Col 12, Row 2 (340px wide)
          Tabs: Feed | Alerts | Evidence | AI
          Only content scrolls. Component Budget: Max 5 feed, 2 alerts.
      ═══════════════════════════════════════════════════════════════ */}
      <aside style={{
        gridColumn:'12',
        gridRow:'2',
        borderRadius: 14,
        background:'#0d1526',
        border:'1px solid rgba(255,255,255,0.06)',
        display:'flex',
        flexDirection:'column',
        overflow:'hidden',
      }}>
        {/* Tab bar — 44px height, 4 tabs */}
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(4,1fr)',
          borderBottom:'1px solid rgba(255,255,255,0.06)',
          flexShrink:0,
        }}>
          {(['feed','alerts','evidence','ai'] as SideTab[]).map(t => {
            const badge = t === 'alerts' ? alerts.length : t === 'feed' ? feedPosts.length : t === 'evidence' ? narratives.length : null;
            return (
              <button
                key={t}
                onClick={() => setSideTab(t)}
                style={{
                  height:44, cursor:'pointer', background:'none', border:'none',
                  borderBottom: sideTab === t ? '2px solid #38bdf8' : '2px solid transparent',
                  color: sideTab === t ? '#38bdf8' : '#64748b',
                  fontSize:11, fontFamily:'monospace', fontWeight:600,
                  textTransform:'uppercase', letterSpacing:'0.04em',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:4,
                  transition:'color 0.2s ease',
                }}
              >
                {t}
                {badge !== null && badge > 0 && (
                  <span style={{
                    fontSize:10, minWidth:16, height:16, borderRadius:8,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    background: sideTab === t ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)',
                    color: sideTab === t ? '#38bdf8' : '#94a3b8',
                    padding:'0 4px',
                  }}>
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Area — 24px internal card padding */}
        <div style={{ flex:1, overflowY:'auto', padding: SP.lg }}>

          {/* ── TAB 1: FEED — Max 5 Items ── */}
          {sideTab === 'feed' && (
            <div style={{ display:'flex', flexDirection:'column', gap: SP.md }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:11, color:'#475569', fontFamily:'monospace' }}>
                  {feedPosts.length} INGESTED
                </span>
                <div style={{ display:'flex', gap:3 }}>
                  {(['compact','cards'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setFeedMode(m)}
                      style={{
                        width:28, height:28, borderRadius:6, cursor:'pointer',
                        background: feedMode === m ? 'rgba(56,189,248,0.1)' : 'transparent',
                        border: `1px solid ${feedMode === m ? 'rgba(56,189,248,0.2)' : 'transparent'}`,
                        color: feedMode === m ? '#38bdf8' : '#475569',
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}
                    >
                      {m === 'compact' ? <List style={{width:12,height:12}} /> : <Layers style={{width:12,height:12}} />}
                    </button>
                  ))}
                </div>
              </div>

              {feedPosts.length === 0 ? (
                <div style={{ padding:`${SP['2xl']}px 0`, textAlign:'center' }}>
                  <div style={{ fontSize:14, color:'#475569', marginBottom: SP.xs }}>Connecting Firehoses…</div>
                  <div style={{ fontSize:11, color:'#334155', fontFamily:'monospace' }}>BLUESKY · REDDIT · RSS</div>
                </div>
              ) : (
                // Exactly max 5 items per component budget
                feedPosts.slice(0, 5).map(post => {
                  const d = new Date(post.timestamp);
                  const ts = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
                  const pc: Record<string,string> = { bluesky:'#0ea5e9', reddit:'#fb923c', rss:'#94a3b8' };
                  const c = pc[post.platform] || '#94a3b8';

                  if (feedMode === 'compact') {
                    return (
                      <button
                        key={post.id}
                        onClick={() => handleSelectFeedPost(post)}
                        style={{
                          width:'100%', textAlign:'left',
                          display:'flex', alignItems:'center', gap: SP.sm,
                          padding:`${SP.sm}px ${SP.md}px`, minHeight:44,
                          borderRadius:8, cursor:'pointer',
                          background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)',
                          transition:'border-color 0.2s ease',
                        }}
                      >
                        <span style={{ width:5, height:5, borderRadius:'50%', background:c, flexShrink:0 }} />
                        <span style={{ fontSize:11, color:'#475569', fontFamily:'monospace', flexShrink:0 }}>{ts}</span>
                        <span style={{ fontSize:14, color:'#cbd5e1', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {post.content}
                        </span>
                        <span style={{ fontSize:11, color:'#f87171', fontFamily:'monospace', flexShrink:0, textTransform:'uppercase' }}>
                          {post.emotion.dominant.slice(0,4)}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={post.id}
                      onClick={() => handleSelectFeedPost(post)}
                      style={{
                        width:'100%', textAlign:'left',
                        padding: SP.lg, borderRadius:10, cursor:'pointer',
                        background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)',
                        transition:'border-color 0.2s ease',
                      }}
                    >
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: SP.sm }}>
                        <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:`${c}15`, color:c, fontFamily:'monospace', textTransform:'uppercase', fontWeight:600 }}>
                          {post.platform}
                        </span>
                        <span style={{ fontSize:11, color:'#475569', fontFamily:'monospace' }}>{ts}</span>
                      </div>
                      <p style={{ fontSize:14, color:'#94a3b8', lineHeight:1.5, margin:0, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                        {post.content}
                      </p>
                      <div style={{ display:'flex', justifyContent:'space-between', marginTop: SP.sm }}>
                        <span style={{ fontSize:11, color:'#f87171', fontFamily:'monospace', textTransform:'uppercase' }}>{post.emotion.dominant}</span>
                        <span style={{ fontSize:11, color:'#22c55e', fontFamily:'monospace' }}>{Math.round(post.trustScore * 100)}% trust</span>
                      </div>
                    </button>
                  );
                })
              )}

              {feedPosts.length > 5 && (
                <div style={{ textAlign:'center', padding:`${SP.xs}px 0`, fontSize:11, color:'#475569', fontFamily:'monospace' }}>
                  +{feedPosts.length - 5} additional events in buffer
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: ALERTS — Max 2 Alert Cards ── */}
          {sideTab === 'alerts' && (
            <div style={{ display:'flex', flexDirection:'column', gap: SP.md }}>
              <div style={{ fontSize:11, color:'#475569', fontFamily:'monospace' }}>
                {alerts.length} ACTIVE INCIDENTS
              </div>

              {alerts.length === 0 ? (
                <div style={{ padding:`${SP['2xl']}px 0`, textAlign:'center' }}>
                  <div style={{ fontSize:14, color:'#64748b' }}>No active threats</div>
                  <div style={{ fontSize:11, color:'#334155', marginTop: SP.xs, fontFamily:'monospace' }}>MONITORING REAL FIREHOSE…</div>
                </div>
              ) : (
                // Exactly max 2 alert cards per budget
                alerts.slice(0, 2).map(a => (
                  <button
                    key={a.id}
                    onClick={() => { setSelectedAlert(a); setSideTab('evidence'); }}
                    style={{
                      width:'100%', textAlign:'left',
                      padding: SP.lg, borderRadius:12, cursor:'pointer',
                      background: a.severity === 'critical' ? 'rgba(244,63,94,0.05)' : 'rgba(245,158,11,0.05)',
                      border: `1px solid ${a.severity === 'critical' ? 'rgba(244,63,94,0.18)' : 'rgba(245,158,11,0.16)'}`,
                      transition:'border-color 0.2s ease',
                    }}
                  >
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: SP.sm }}>
                      <span style={{
                        fontSize:10, padding:'2px 7px', borderRadius:4, fontFamily:'monospace', fontWeight:700, textTransform:'uppercase',
                        background: a.severity === 'critical' ? 'rgba(244,63,94,0.12)' : 'rgba(245,158,11,0.12)',
                        color: a.severity === 'critical' ? '#f87171' : '#fbbf24',
                      }}>
                        {a.severity}
                      </span>
                      <ChevronRight style={{ width:14, height:14, color:'#64748b' }} />
                    </div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#f1f5f9', marginBottom: SP.sm, lineHeight:1.35 }}>
                      {a.title}
                    </div>
                    <div style={{ display:'flex', gap: SP.md, fontSize:11, fontFamily:'monospace', color:'#64748b' }}>
                      <span>+{a.growthRate}%/min</span>
                      <span style={{ textTransform:'uppercase' }}>{a.dominantEmotion}</span>
                      <span>{a.threatScore}/100</span>
                    </div>
                  </button>
                ))
              )}

              {alerts.length > 2 && (
                <div style={{ textAlign:'center', fontSize:11, color:'#475569', fontFamily:'monospace', padding:`${SP.xs}px 0` }}>
                  +{alerts.length - 2} secondary alerts
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: EVIDENCE ── */}
          {sideTab === 'evidence' && (
            <div style={{ display:'flex', flexDirection:'column', gap: SP.md }}>
              {!selectedAlert && !selectedNarrative ? (
                <>
                  <div style={{ fontSize:11, color:'#475569', fontFamily:'monospace' }}>
                    {narratives.length} NARRATIVE CLUSTERS
                  </div>
                  {narratives.length === 0 ? (
                    <div style={{ padding:`${SP['2xl']}px 0`, textAlign:'center' }}>
                      <div style={{ fontSize:14, color:'#64748b' }}>No clusters formed yet</div>
                    </div>
                  ) : (
                    narratives.slice(0, 5).map(n => (
                      <button
                        key={n.id}
                        onClick={() => setSelectedNarrative(n)}
                        style={{
                          width:'100%', textAlign:'left',
                          padding: SP.lg, borderRadius:10, cursor:'pointer',
                          background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)',
                          transition:'border-color 0.2s ease',
                        }}
                      >
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: SP.sm }}>
                          <span style={{ fontSize:14, fontWeight:600, color:'#f1f5f9', flex:1, lineHeight:1.3 }}>{n.title}</span>
                          <span style={{
                            fontSize:10, padding:'2px 6px', borderRadius:4, flexShrink:0, marginLeft: SP.sm,
                            background: n.threatScore.tier === 'critical' ? 'rgba(244,63,94,0.1)' : 'rgba(245,158,11,0.1)',
                            color: n.threatScore.tier === 'critical' ? '#f87171' : '#fbbf24',
                            fontFamily:'monospace', fontWeight:700, textTransform:'uppercase',
                          }}>
                            {n.threatScore.tier}
                          </span>
                        </div>
                        <div style={{ display:'flex', gap: SP.md, fontSize:11, fontFamily:'monospace', color:'#64748b' }}>
                          <span>+{n.growthRate}%</span>
                          <span style={{ textTransform:'uppercase' }}>{n.dominantEmotion}</span>
                          <span>{Math.round(n.confidence * 100)}% conf</span>
                        </div>
                      </button>
                    ))
                  )}
                </>
              ) : (
                <div>
                  <button
                    onClick={() => { setSelectedAlert(null); setSelectedNarrative(null); }}
                    style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', color:'#38bdf8', cursor:'pointer', fontSize:14, marginBottom: SP.lg, minHeight:44 }}
                  >
                    ← Back to clusters
                  </button>
                  <div style={{ fontSize:11, fontFamily:'monospace', padding:'2px 7px', borderRadius:4, background:'rgba(244,63,94,0.08)', color:'#f87171', display:'inline-block', marginBottom: SP.md }}>
                    EVIDENCE BUNDLE
                  </div>
                  <h3 style={{ fontSize:18, fontWeight:700, color:'#f1f5f9', margin:0, marginBottom: SP.lg, lineHeight:1.3 }}>
                    {selectedAlert?.title ?? selectedNarrative?.title}
                  </h3>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: SP.md, marginBottom: SP.lg }}>
                    {[
                      { l:'Confidence', v:'89%', c:'#38bdf8' },
                      { l:'Virality',   v:'81%', c:'#f87171' },
                    ].map(m => (
                      <div key={m.l} style={{ padding: SP.md, borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize:11, color:'#475569', marginBottom:4, fontFamily:'monospace' }}>{m.l.toUpperCase()}</div>
                        <div style={{ fontSize:24, fontWeight:700, color:m.c }}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: SP.lg }}>
                    <div style={{ fontSize:11, color:'#475569', fontFamily:'monospace', marginBottom: SP.sm }}>PROPAGATION PATH</div>
                    <div style={{ display:'flex', alignItems:'center', gap: SP.sm, flexWrap:'wrap' }}>
                      {['X','Reddit','Bluesky'].map((p,i) => (
                        <React.Fragment key={p}>
                          <span style={{ fontSize:11, padding:'4px 8px', borderRadius:5, background:'rgba(56,189,248,0.06)', color:'#38bdf8', fontFamily:'monospace', border:'1px solid rgba(56,189,248,0.12)' }}>
                            {i+1}. {p}
                          </span>
                          {i < 2 && <span style={{ color:'#334155', fontSize:12 }}>→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAlert(null);
                      setSelectedNarrative(null);
                      if (onNavigateToCompare) onNavigateToCompare();
                    }}
                    style={{
                      width:'100%', padding:`${SP.sm}px ${SP.md}px`, minHeight:44,
                      borderRadius:8, background:'rgba(56,189,248,0.08)',
                      border:'1px solid rgba(56,189,248,0.18)', color:'#38bdf8',
                      fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'monospace',
                    }}
                  >
                    Simulate Countermeasure
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 4: AI COPILOT ── */}
          {sideTab === 'ai' && (
            <div style={{ display:'flex', flexDirection:'column', height:'calc(100% - 48px)', gap: SP.md }}>
              <div style={{ display:'flex', alignItems:'center', gap: SP.sm }}>
                <Sparkles style={{width:14,height:14,color:'#a78bfa'}} />
                <span style={{ fontSize:14, color:'#cbd5e1', fontWeight:500 }}>Analyst Copilot</span>
              </div>
              <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap: SP.sm, minHeight:0 }}>
                {copilotMessages.map((m,i) => (
                  <div key={i} style={{
                    padding: SP.md, borderRadius:10, fontSize:14, lineHeight:1.55,
                    background: m.role === 'analyst' ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${m.role === 'analyst' ? 'rgba(139,92,246,0.16)' : 'rgba(255,255,255,0.04)'}`,
                    marginLeft: m.role === 'analyst' ? SP.xl : 0,
                    marginRight: m.role === 'analyst' ? 0 : SP.xl,
                    animation:'fadeIn 0.2s ease',
                  }}>
                    <div style={{ fontSize:10, fontFamily:'monospace', color:'#64748b', marginBottom:4, textTransform:'uppercase' }}>
                      {m.role === 'analyst' ? 'Analyst' : 'Copilot'}
                    </div>
                    <p style={{ color:'#94a3b8', margin:0 }}>{m.text}</p>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap: SP.xs, flexWrap:'wrap' }}>
                {['Why did alert fire?','Bridge nodes?','Recommend plan'].map(q => (
                  <button
                    key={q}
                    onClick={() => setCopilotQuery(q)}
                    style={{
                      padding:`4px ${SP.sm}px`, minHeight:32, borderRadius:6,
                      fontSize:11, cursor:'pointer', background:'rgba(255,255,255,0.03)',
                      border:'1px solid rgba(255,255,255,0.06)', color:'#64748b', fontFamily:'monospace',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <div style={{ display:'flex', gap: SP.sm }}>
                <input
                  type="text"
                  value={copilotQuery}
                  onChange={e => setCopilotQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAskCopilot(); }}
                  placeholder="Ask copilot…"
                  style={{
                    flex:1, height:44, background:'rgba(255,255,255,0.03)',
                    border:'1px solid rgba(255,255,255,0.08)', borderRadius:8,
                    padding:`0 ${SP.md}px`, fontSize:14, color:'#f1f5f9', outline:'none',
                  }}
                />
                <button
                  onClick={handleAskCopilot}
                  style={{
                    width:44, height:44, borderRadius:8,
                    background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.2)',
                    color:'#a78bfa', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                  }}
                >
                  <Send style={{width:14,height:14}} />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════
          5. BOTTOM DOCK (TIMELINE + QUICK ACTIONS) — Cols 2..12, Row 3
          Height: 112px. Spans across center and right panels under main.
      ═══════════════════════════════════════════════════════════════ */}
      <footer style={{
        gridColumn:'2 / -1',
        gridRow:'3',
        borderRadius: 14,
        background:'#0d1526',
        border:'1px solid rgba(255,255,255,0.06)',
        padding:`${SP.md}px ${SP.lg}px`,
        display:'flex',
        flexDirection:'column',
        justifyContent:'center',
        gap: SP.sm,
      }}>
        {/* Controls Row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap: SP.md }}>
            <Clock style={{ width:14, height:14, color:'#64748b' }} />
            <span style={{ fontSize:11, fontFamily:'monospace', color:'#64748b', fontWeight:600, letterSpacing:'0.06em' }}>
              TIMELINE SCRUBBER
            </span>
            {replaySnapshot && (
              <span style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:'rgba(245,158,11,0.08)', color:'#fbbf24', fontFamily:'monospace', border:'1px solid rgba(245,158,11,0.18)' }}>
                SNAPSHOT #{replaySnapshot.sequence}
              </span>
            )}
            {!isLiveStreaming && (
              <button
                onClick={() => { replayManager.resumeLive(); setIsLiveStreaming(true); setReplaySnapshot(null); }}
                style={{
                  padding:`${SP.xs}px ${SP.md}px`, minHeight:32, borderRadius:6,
                  background:'rgba(56,189,248,0.08)', border:'1px solid rgba(56,189,248,0.18)',
                  color:'#38bdf8', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'monospace',
                }}
              >
                ▶ Resume Live
              </button>
            )}
          </div>

          {/* Quick Actions (44px min height) */}
          <div style={{ display:'flex', gap: SP.sm }}>
            {[
              { label:'Replay Lab', action: onNavigateToReplay, color:'#a78bfa' },
              { label:'Compare', action: onNavigateToCompare, color:'#94a3b8' },
              { label:'Export', action: onNavigateToExport, color:'#94a3b8' },
            ].filter(b => b.action).map(btn => (
              <button
                key={btn.label}
                onClick={btn.action}
                style={{
                  padding:`0 ${SP.md}px`, height:44, minWidth:80,
                  borderRadius:8, fontSize:14, cursor:'pointer',
                  background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
                  color: btn.color, fontFamily:'monospace',
                  transition:'all 0.2s ease',
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrubber slider bar */}
        <div style={{ display:'flex', alignItems:'center', gap: SP.md }}>
          <span style={{ fontSize:10, fontFamily:'monospace', color:'#475569', flexShrink:0 }}>PAST</span>
          <input
            type="range"
            min={0}
            max={100}
            defaultValue={100}
            onChange={e => {
              const v = Number(e.target.value);
              if (v < 98) {
                setIsLiveStreaming(false);
                const snaps = replayManager.getSnapshots();
                if (snaps.length > 0) {
                  const snap = replayManager.jumpToSnapshot(Math.floor((v/100)*(snaps.length-1)));
                  setReplaySnapshot(snap);
                }
              } else {
                replayManager.resumeLive();
                setIsLiveStreaming(true);
                setReplaySnapshot(null);
              }
            }}
            style={{
              flex:1, height:4, borderRadius:2, cursor:'pointer', accentColor:'#38bdf8',
              background:'rgba(255,255,255,0.05)',
            }}
          />
          <span style={{
            fontSize:11, fontFamily:'monospace', flexShrink:0,
            display:'flex', alignItems:'center', gap:5,
            color: isLiveStreaming ? '#22c55e' : '#64748b',
          }}>
            {isLiveStreaming ? (
              <>
                <span style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
                LIVE
              </>
            ) : 'PAUSED'}
          </span>
        </div>
      </footer>

      {/* Global CSS & Keyframes */}
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        aside > div::-webkit-scrollbar { width:3px; }
        aside > div::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.06); border-radius:2px; }
        button { outline:none; }
        button:hover { opacity:0.85; }
      `}</style>

    </div>
  );
};
