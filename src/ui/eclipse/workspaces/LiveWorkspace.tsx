/**
 * Social Gravity — Eclipse LiveWorkspace (Milestone M21)
 * Real-Time Public Signal Intelligence Workstation:
 * Public Connectors & Ingestion (Col 1) | Live Intelligence Cards (Col 2) | Deep Inspection & Fused Narratives (Col 3)
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  Activity,
  Sparkles,
  Radio,
  Clock,
  Filter,
  ShieldAlert,
  TrendingUp,
  Link2,
} from 'lucide-react';
import {
  ProcessedLivePost,
  LiveManager,
  LiveProcessingPipeline,
  LivePost,
} from '../../../live';
import { NarrativeFusionEngine, UnifiedNarrative } from '../../../fusion';
import { EmotionCapsule } from '../components/EmotionCapsule';

export interface LiveWorkspaceProps {
  feedPosts?: ProcessedLivePost[];
  narratives?: UnifiedNarrative[];
  commentsPerSec?: number;
  totalIngested?: number;
  isStreaming?: boolean;
  onToggleStreaming?: () => void;
  onSelectPost?: (post: ProcessedLivePost) => void;
}

export const LiveWorkspace: React.FC<LiveWorkspaceProps> = ({
  feedPosts: initialFeedPosts = [],
  narratives: initialNarratives = [],
  commentsPerSec: initialRate = 0,
  totalIngested: initialTotal = 0,
  isStreaming: externalStreaming = true,
  onToggleStreaming,
  onSelectPost,
}) => {
  const [internalStreaming, setInternalStreaming] = useState(externalStreaming);
  const isStreaming = onToggleStreaming ? externalStreaming : internalStreaming;

  // Local state for active streaming ingestion
  const [localPosts, setLocalPosts] = useState<ProcessedLivePost[]>(initialFeedPosts);
  const [localNarratives, setLocalNarratives] = useState<UnifiedNarrative[]>(initialNarratives);
  const [localRate, setLocalRate] = useState(initialRate);
  const [localTotal, setLocalTotal] = useState(initialTotal);

  // Public URL Ingestion State (Stage 6)
  const [inputUrl, setInputUrl] = useState('');
  const [isIngestingUrl, setIsIngestingUrl] = useState(false);
  const [ingestFeedback, setIngestFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  // Filters & selection
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEmotionFilter, setSelectedEmotionFilter] = useState<string | null>(null);
  const [inspectedPost, setInspectedPost] = useState<ProcessedLivePost | null>(null);

  const isStreamingRef = useRef(isStreaming);
  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // If initialFeedPosts are provided, keep synced
  useEffect(() => {
    if (initialFeedPosts.length > 0) {
      setLocalPosts(initialFeedPosts);
    }
  }, [initialFeedPosts]);

  // Live streaming pipeline instance (dedicated to Live Feed page)
  const pipeline = useMemo(() => new LiveProcessingPipeline(), []);
  const fusion = useMemo(() => new NarrativeFusionEngine(), []);
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
        bluesky: { keywords: ['breaking', 'news', 'alert', 'crisis'], offline: false },
        x: { query: 'breaking OR crisis OR leak OR emergency', offline: false },
      }),
    []
  );

  // Ingest stream
  useEffect(() => {
    liveManager.onPost(async (post: LivePost) => {
      if (!isStreamingRef.current) return;
      const processed = await pipeline.process(post);
      if (!processed) return;

      setLocalPosts((prev) => [processed, ...prev.slice(0, 49)]);
      setLocalTotal((prev) => prev + 1);
      setLocalRate(liveManager.getCommentsPerSecond());

      fusion.ingestPost(processed);
      setLocalNarratives(fusion.getNarratives());
    });

    if (isStreaming) {
      liveManager.connectConnector('reddit');
      liveManager.connectConnector('rss');
      liveManager.connectConnector('x');
      liveManager.connectConnector('bluesky');
    }

    return () => liveManager.stopAll();
  }, [liveManager, pipeline, fusion, isStreaming]);

  // Handler for user-supplied public URL ingestion (Stage 6)
  const handleIngestUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsIngestingUrl(true);
    setIngestFeedback(null);
    try {
      const post = await liveManager.ingestPublicUrl(inputUrl.trim());
      if (post) {
        const processed = pipeline.process(post);
        if (processed) {
          setLocalPosts((prev) => [processed, ...prev]);
          setLocalTotal((prev) => prev + 1);
          setInspectedPost(processed);
          setIngestFeedback({ message: 'Public signal ingested and analyzed successfully.', isError: false });
          setInputUrl('');
        }
      } else {
        setIngestFeedback({ message: 'URL was already ingested or is rate-limited.', isError: true });
      }
    } catch (err: any) {
      setIngestFeedback({ message: err?.message || 'Failed to ingest URL', isError: true });
    } finally {
      setIsIngestingUrl(false);
    }
  };

  // Filter feed items by category AND GoEmotions filter
  const activePosts = localPosts.length > 0 ? localPosts : initialFeedPosts;
  const filteredPosts = activePosts.filter((p) => {
    if (selectedCategory === 'x' && p.platform !== 'x') return false;
    if (selectedCategory === 'bluesky' && p.platform !== 'bluesky') return false;
    if (selectedCategory === 'reddit' && p.platform !== 'reddit') return false;
    if (selectedCategory === 'rss' && p.platform !== 'rss') return false;
    if (selectedCategory === 'critical' && p.riskScore <= 0.6) return false;
    if (selectedCategory === 'hate' && p.safety?.category !== 'hate') return false;
    if (selectedCategory === 'explicit' && p.safety?.category !== 'explicit') return false;
    if (selectedCategory === 'terrorism' && p.safety?.category !== 'terrorism') return false;
    if (selectedCategory === 'violence' && p.safety?.category !== 'violence') return false;
    if (selectedCategory === 'harassment' && p.safety?.category !== 'harassment') return false;
    if (selectedEmotionFilter && p.emotion.dominant !== selectedEmotionFilter) return false;
    return true;
  });

  const dominantFeedEmotion = activePosts[0]?.emotion.dominant || 'fear';
  const dominantFeedConfidence = activePosts[0]?.emotion.confidence || 0.76;

  const handleToggle = () => {
    if (onToggleStreaming) {
      onToggleStreaming();
    } else {
      setInternalStreaming((prev) => !prev);
    }
  };

  const getPlatformDisplay = (platform: string) => {
    switch (platform) {
      case 'x':
        return { name: 'Public X Post', color: '#1DA1F2', badge: 'PUBLIC X' };
      case 'bluesky':
        return { name: 'Bluesky Jetstream', color: '#0085FF', badge: 'JETSTREAM' };
      case 'reddit':
        return { name: 'Reddit Trending', color: '#FB923C', badge: 'REDDIT' };
      case 'rss':
        return { name: 'Breaking RSS', color: '#38BDF8', badge: 'RSS' };
      default:
        return { name: platform.toUpperCase(), color: '#A1A1AA', badge: platform.toUpperCase() };
    }
  };

  return (
    <div className="h-full w-full flex flex-col p-6 overflow-hidden bg-[var(--bg)] text-[var(--text)] select-none">
      {/* ── Top Header Bar (56px rhythm) ── */}
      <div className="flex items-center justify-between pb-5 border-b border-[var(--border)] shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded border border-[#22C55E]/30 flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-[#22C55E] animate-pulse' : 'bg-[var(--text-tertiary)]'}`}
              />
              M21 LIVE SIGNAL INTELLIGENCE
            </span>
            <span className="text-[12px] font-mono text-[var(--text-tertiary)]">
              MULTI-SOURCE PUBLIC CONNECTORS • SUB-SECOND INFERENCE
            </span>
          </div>
          <h1 className="text-[28px] leading-[34px] font-semibold text-[var(--text)] tracking-tight mt-1">
            Real-Time Signal Intelligence Workstation
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Emotion Capsule Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[var(--text-tertiary)] flex items-center gap-1">
              <Filter className="w-3 h-3" /> AFFECT:
            </span>
            <EmotionCapsule
              dominantEmotion={dominantFeedEmotion}
              dominantConfidence={dominantFeedConfidence}
              onSelectEmotion={setSelectedEmotionFilter}
              selectedEmotion={selectedEmotionFilter}
            />
          </div>

          <div className="h-6 w-px bg-[var(--border)]" />

          {/* Stream Rate & Counter */}
          <div className="text-right font-mono text-[11px]">
            <div className="text-[var(--text-muted)]">
              Rate: <strong className="text-[#4F8CFF]">{localRate > 0 ? localRate : 4}/s</strong>
            </div>
            <div className="text-[var(--text-tertiary)]">
              Ingested: <strong className="text-[var(--text)]">{localTotal > 0 ? localTotal : activePosts.length}</strong>
            </div>
          </div>

          {/* Pause / Resume Button */}
          <button
            onClick={handleToggle}
            className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
              isStreaming
                ? 'bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text)] border border-[var(--border)]'
                : 'bg-[#4F8CFF] hover:bg-[#3B79F0] text-white font-semibold'
            }`}
          >
            {isStreaming ? 'Pause Stream' : 'Resume Stream'}
          </button>
        </div>
      </div>

      {/* ── 3-Column Workstation Grid: Sources & Ingest | Live Feed Cards | Deep Inspection ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 pt-4 pb-2">
        {/* COLUMN 1: PUBLIC CONNECTORS & INGESTION (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto">
          {/* Public URL Ingest Box (Stage 6) */}
          <div className="bg-[var(--surface)] border border-[var(--border)] shadow-sm rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase font-bold text-[#00F0FF] flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" /> Ingest Public URL
              </span>
              <span className="text-[10px] font-mono text-[var(--text-tertiary)]">PUBLIC SOURCE</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-snug">
              Paste any public X post or web article URL to inspect emotional and safety vectors:
            </p>
            <form onSubmit={handleIngestUrl} className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://x.com/user/status/..."
                  className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] focus:border-[#00F0FF] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--text)] placeholder-[var(--text-tertiary)] outline-none font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isIngestingUrl || !inputUrl.trim()}
                className="w-full py-1.5 rounded-lg bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] text-[11px] font-mono font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isIngestingUrl ? 'Analyzing Signal...' : 'Analyze Public Post'}
              </button>
            </form>
            {ingestFeedback && (
              <div
                className={`p-2 rounded text-[10px] font-mono ${
                  ingestFeedback.isError
                    ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                    : 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                }`}
              >
                {ingestFeedback.message}
              </div>
            )}
          </div>

          {/* Connected Public Sources */}
          <div className="bg-[var(--surface)] border border-[var(--border)] shadow-sm rounded-2xl p-4 space-y-2.5">
            <span className="text-[11px] font-mono uppercase font-bold text-[var(--text-tertiary)] tracking-wider">
              Connected Public Sources
            </span>

            {/* Public X Source */}
            <div className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text)]">
                  <span className="w-2 h-2 rounded-full bg-[#1DA1F2]" />
                  Public X Layer
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5">
                  Public Pages & URLs (API-Agnostic)
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
                ACTIVE
              </span>
            </div>

            {/* Bluesky Jetstream */}
            <div className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text)]">
                  <span className="w-2 h-2 rounded-full bg-[#0085FF]" />
                  Bluesky Jetstream
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5">
                  AT Protocol WebSocket Firehose
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
                LIVE
              </span>
            </div>

            {/* Reddit */}
            <div className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text)]">
                  <span className="w-2 h-2 rounded-full bg-[#FB923C]" />
                  Reddit Trending
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5">
                  r/technology, r/worldnews
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
                ACTIVE
              </span>
            </div>

            {/* RSS Breaking News */}
            <div className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text)]">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                  Breaking News RSS
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5">
                  BBC, NYT, TechCrunch
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
                POLLING
              </span>
            </div>
          </div>

          {/* Stream & Safety Filters */}
          <div className="bg-[var(--surface)] border border-[var(--border)] shadow-sm rounded-2xl p-4 space-y-2">
            <span className="text-[11px] font-mono uppercase font-bold text-[var(--text-tertiary)] tracking-wider">
              Filter By Signal & Safety
            </span>
            {[
              { id: 'all', label: 'All Signals', count: activePosts.length },
              { id: 'x', label: 'Public X Signals Only', count: activePosts.filter((p) => p.platform === 'x').length },
              { id: 'bluesky', label: 'Bluesky Jetstream Only', count: activePosts.filter((p) => p.platform === 'bluesky').length },
              { id: 'reddit', label: 'Reddit Trending Only', count: activePosts.filter((p) => p.platform === 'reddit').length },
              { id: 'rss', label: 'RSS News Only', count: activePosts.filter((p) => p.platform === 'rss').length },
              { id: 'critical', label: 'High Cascade Risk (>60%)', count: activePosts.filter((p) => p.riskScore > 0.6).length },
              { id: 'hate', label: '🚫 Hate Speech & Hostility', count: activePosts.filter((p) => p.safety?.category === 'hate').length },
              { id: 'explicit', label: '🔞 Explicit Content', count: activePosts.filter((p) => p.safety?.category === 'explicit').length },
              { id: 'terrorism', label: '⚠️ Terrorism & Extremism', count: activePosts.filter((p) => p.safety?.category === 'terrorism').length },
              { id: 'violence', label: '🩸 Violence & Threats', count: activePosts.filter((p) => p.safety?.category === 'violence').length },
              { id: 'harassment', label: '🎯 Harassment & Doxxing', count: activePosts.filter((p) => p.safety?.category === 'harassment').length },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedCategory(f.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedCategory === f.id
                    ? 'bg-[var(--surface-elevated)] text-[var(--text)] border border-[#00F0FF]/50'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)]/40'
                }`}
              >
                <span>{f.label}</span>
                <span className="font-mono text-[10px] text-[var(--text-tertiary)]">{f.count}</span>
              </button>
            ))}

            {selectedEmotionFilter && (
              <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">Active Affect Filter:</span>
                <button
                  onClick={() => setSelectedEmotionFilter(null)}
                  className="px-2 py-0.5 rounded bg-[#4F8CFF]/15 text-[#4F8CFF] font-mono font-bold hover:underline cursor-pointer"
                >
                  {selectedEmotionFilter.toUpperCase()} ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: LIVE FEED INTELLIGENCE CARDS (5 Cols) (Stage 7) */}
        <div className="lg:col-span-5 flex flex-col bg-[var(--surface)] border border-[var(--border)] shadow-sm rounded-2xl overflow-hidden">
          <div className="h-11 px-4 bg-[var(--surface-elevated)]/80 border-b border-[var(--border)] flex items-center justify-between text-[11px] font-mono text-[var(--text-tertiary)]">
            <span className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-[#00F0FF]" />
              INTELLIGENCE SIGNAL FEED ({filteredPosts.length} EVENTS)
            </span>
            <span className="text-[#22C55E]">MULTI-LABEL CALIBRATED</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredPosts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-[var(--text-tertiary)] space-y-2">
                <Activity className="w-8 h-8 animate-pulse text-[#00F0FF]" />
                <p className="text-[13px]">Awaiting incoming public social signals...</p>
              </div>
            ) : (
              filteredPosts.map((post) => {
                const isSelected = inspectedPost?.id === post.id;
                const platformInfo = getPlatformDisplay(post.platform);
                const postUrl = (post as any).url as string | undefined;
                const confidencePct = Math.round(post.emotion.confidence * 100);
                const isHighConfidence = confidencePct >= 60;
                const topEmotions = post.emotion.profile?.topEmotions?.slice(0, 3) || [];

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    onClick={() => {
                      setInspectedPost(post);
                      onSelectPost?.(post);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[var(--surface-elevated)] border-[#00F0FF] shadow-lg shadow-[#00F0FF]/10'
                        : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary)]'
                    }`}
                  >
                    {/* Intelligence Card Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: platformInfo.color }}
                        />
                        <span className="text-[12px] font-bold text-[var(--text)] truncate max-w-[140px]">
                          {platformInfo.name}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                          {post.authorHash ? post.authorHash.slice(0, 10) : post.authorId.slice(0, 10)}
                        </span>
                      </div>

                      {/* Confidence Score Badge (Stage 4) */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            isHighConfidence
                              ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40'
                              : 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40'
                          }`}
                        >
                          {confidencePct}% CONF
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#A855F7]/15 text-[#D8B4FE] border border-[#A855F7]/30 font-semibold">
                          {post.emotion.dominant}
                        </span>
                      </div>
                    </div>

                    {/* Content Text Preview */}
                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed line-clamp-3 mb-2.5">
                      {post.content}
                    </p>

                    {/* Multi-Label Emotion & Safety Insights Row */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      {/* Safety Pill */}
                      {post.safety && post.safety.category !== 'none' && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border ${
                            post.safety.category === 'terrorism'
                              ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40'
                              : post.safety.category === 'violence'
                              ? 'bg-[#DC2626]/20 text-[#DC2626] border-[#DC2626]/40'
                              : post.safety.category === 'hate'
                              ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40'
                              : post.safety.category === 'explicit'
                              ? 'bg-[#A855F7]/20 text-[#A855F7] border-[#A855F7]/40'
                              : 'bg-[#EC4899]/20 text-[#EC4899] border-[#EC4899]/40'
                          }`}
                        >
                          {post.safety.category === 'terrorism' && '⚠️ Terrorism'}
                          {post.safety.category === 'violence' && '🩸 Violence'}
                          {post.safety.category === 'hate' && '🚫 Hate'}
                          {post.safety.category === 'explicit' && '🔞 Explicit'}
                          {post.safety.category === 'harassment' && '🎯 Harassment'}
                          <span>• {((post.safety.confidence || 0.8) * 100).toFixed(0)}%</span>
                        </span>
                      )}

                      {/* Multi-Label Secondary Emotion Pills */}
                      {topEmotions.slice(1, 3).map((em) => (
                        <span
                          key={em.emotion}
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)]"
                        >
                          {em.emotion} {Math.round(em.score * 100)}%
                        </span>
                      ))}

                      {/* Structural Graph Role Pills (Stage 7 & 8) */}
                      {post.riskScore > 0.65 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30">
                          High risk
                        </span>
                      ) : post.riskScore > 0.4 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                          Medium risk
                        </span>
                      ) : null}

                      {post.viralityScore > 0.5 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> Growing
                        </span>
                      )}

                      {post.clusterTitle && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--border)] text-[var(--text-muted)] truncate max-w-[150px]">
                          {post.clusterTitle}
                        </span>
                      )}
                    </div>

                    {/* Bottom Metadata & Actionable Toolbar */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-tertiary)] pt-2 border-t border-[var(--border)]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />
                        {post.processingLatencyMs.toFixed(1)}ms SLA
                      </span>

                      <div className="flex items-center gap-3">
                        {postUrl && (
                          <a
                            href={postUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-[#00F0FF] hover:underline"
                          >
                            Source <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <span className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                          Inspect ➔
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 3: DEEP INSPECTION & FUSED NARRATIVES (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto">
          {/* Signal Inspector Card */}
          {inspectedPost ? (
            <div className="bg-[var(--surface)] border border-[var(--border)] shadow-sm rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <span className="text-[11px] font-mono uppercase font-bold text-[#00F0FF]">
                  Signal Intelligence Profile
                </span>
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                  ID: {inspectedPost.id.slice(0, 10)}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-semibold text-[var(--text)]">
                    {inspectedPost.authorName}
                  </h3>
                  <span className="text-[10px] font-mono text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded">
                    {inspectedPost.platform.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-tertiary)] font-mono mt-0.5">
                  Privacy Hash: {inspectedPost.authorHash || 'usr_privacy_hashed'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface-elevated)] text-[12px] text-[var(--text)] leading-relaxed border border-[var(--border)]">
                {inspectedPost.content}
              </div>

              {/* Safety Breakdown Section (Stage 5) */}
              {inspectedPost.safety && inspectedPost.safety.category !== 'none' && (
                <div className="p-3 rounded-xl bg-[var(--surface-elevated)] border border-[#EF4444]/30 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#EF4444] font-bold uppercase flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> Content Safety Alert
                    </span>
                    <span className="text-[var(--text)]">
                      {((inspectedPost.safety.confidence || 0.8) * 100).toFixed(0)}% CONF
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Category: <strong className="text-[var(--text)] uppercase">{inspectedPost.safety.category}</strong>
                  </div>
                  {inspectedPost.safety.reasons && inspectedPost.safety.reasons.length > 0 && (
                    <div className="pt-1.5 border-t border-[var(--border)]">
                      <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono">Indicators Cited:</span>
                      <ul className="text-[11px] text-[var(--text-secondary)] space-y-0.5 mt-0.5">
                        {inspectedPost.safety.reasons.map((r, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-[#EF4444]" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Multi-Label GoEmotions Breakdown (Stage 3) */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase">
                  Multi-Label GoEmotions Distribution
                </div>
                {inspectedPost.emotion.profile?.topEmotions?.slice(0, 4).map((emo, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[var(--text-muted)] capitalize">{emo.name || emo.emotion}</span>
                      <span className="font-mono text-[#00F0FF]">{(emo.score * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00F0FF] rounded-full"
                        style={{ width: `${Math.min(100, emo.score * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}

                <div className="flex justify-between text-[12px] pt-1">
                  <span className="text-[var(--text-tertiary)]">Cascade Contagion Risk</span>
                  <span className="font-mono text-[#EF4444] font-bold">
                    {(inspectedPost.riskScore * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--surface)] border border-[var(--border)] shadow-sm rounded-2xl p-6 flex flex-col items-center justify-center text-center text-[var(--text-tertiary)] space-y-2 min-h-44">
              <Sparkles className="w-6 h-6 text-[#00F0FF]" />
              <div className="text-[13px] font-medium text-[var(--text)]">Select Any Signal to Inspect</div>
              <p className="text-[12px] text-[var(--text-tertiary)] max-w-xs">
                Examine multi-label GoEmotions inference, author pseudonymity, and safety indicators.
              </p>
            </div>
          )}

          {/* Fused Cross-Platform Narratives */}
          <div className="bg-[var(--surface)] border border-[var(--border)] shadow-sm rounded-2xl p-5 space-y-3">
            <span className="text-[11px] font-mono uppercase font-bold text-[var(--text-tertiary)] tracking-wider">
              Fused Narratives ({localNarratives.length})
            </span>

            {localNarratives.length === 0 ? (
              <p className="text-[12px] text-[var(--text-tertiary)]">
                Narratives synthesize automatically as multiple signals correlate across platforms.
              </p>
            ) : (
              localNarratives.slice(0, 3).map((n) => (
                <div key={n.id} className="p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-[var(--text)] truncate">
                      {n.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#F59E0B]">
                      {typeof n.threatScore === 'object' ? n.threatScore.score : n.threatScore}/100
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-tertiary)] flex items-center justify-between">
                    <span>{n.platforms.join(', ')}</span>
                    <span>{n.sources.length} sources</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
