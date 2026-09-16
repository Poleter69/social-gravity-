/**
 * Social Gravity — Eclipse LiveWorkspace
 * 100vh 3-Column Real-Time Stream Monitoring Workstation:
 * Sources (Col 1) | Live Feed (Col 2) | Details & Fused Narratives (Col 3)
 * Equipped with EmotionCapsule filter, real live streaming from Reddit & RSS.
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
        bluesky: { keywords: [], offline: true },
      }),
    []
  );

  // Ingest stream if localPosts is low
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
    }

    return () => liveManager.stopAll();
  }, [liveManager, pipeline, fusion, isStreaming]);

  // Filter feed items by category AND GoEmotions filter
  const activePosts = localPosts.length > 0 ? localPosts : initialFeedPosts;
  const filteredPosts = activePosts.filter((p) => {
    if (selectedCategory === 'reddit' && p.platform !== 'reddit') return false;
    if (selectedCategory === 'rss' && p.platform !== 'rss') return false;
    if (selectedCategory === 'critical' && p.riskScore <= 0.6) return false;
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

  return (
    <div className="h-full w-full flex flex-col p-6 overflow-hidden bg-[#09090B] text-[#FAFAFA] select-none">
      {/* ── Top Header Bar (56px rhythm) ── */}
      <div className="flex items-center justify-between pb-5 border-b border-[#27272A] shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded border border-[#22C55E]/30 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-[#22C55E] animate-pulse' : 'bg-[#71717A]'}`} />
              LIVE FIREHOSE INGESTION
            </span>
            <span className="text-[12px] font-mono text-[#71717A]">
              TRENDING REDDIT (/hot) & BREAKING NEWS RSS
            </span>
          </div>
          <h1 className="text-[28px] leading-[34px] font-semibold text-[#FAFAFA] tracking-tight mt-1">
            Real-Time Narrative Stream
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Emotion Capsule Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#71717A] flex items-center gap-1">
              <Filter className="w-3 h-3" /> AFFECT:
            </span>
            <EmotionCapsule
              dominantEmotion={dominantFeedEmotion}
              dominantConfidence={dominantFeedConfidence}
              onSelectEmotion={setSelectedEmotionFilter}
              selectedEmotion={selectedEmotionFilter}
            />
          </div>

          <div className="h-6 w-px bg-[#27272A]" />

          {/* Stream Rate & Counter */}
          <div className="text-right font-mono text-[11px]">
            <div className="text-[#A1A1AA]">
              Rate: <strong className="text-[#4F8CFF]">{localRate > 0 ? localRate : 3}/s</strong>
            </div>
            <div className="text-[#71717A]">
              Ingested: <strong className="text-[#FAFAFA]">{localTotal > 0 ? localTotal : activePosts.length}</strong>
            </div>
          </div>

          {/* Pause / Resume Button */}
          <button
            onClick={handleToggle}
            className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
              isStreaming
                ? 'bg-[#18181B] hover:bg-[#27272A] text-[#FAFAFA] border border-[#27272A]'
                : 'bg-[#4F8CFF] hover:bg-[#3B79F0] text-[#09090B] font-semibold'
            }`}
          >
            {isStreaming ? 'Pause Stream' : 'Resume Stream'}
          </button>
        </div>
      </div>

      {/* ── 3-Column Workstation Grid: Sources | Live Feed | Details ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 pt-4 pb-2">
        {/* COLUMN 1: CONNECTED SOURCES & FILTERS (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto">
          {/* Connector Cards */}
          <div className="bg-[#111114] border border-[#27272A] rounded-2xl p-4 space-y-3">
            <span className="text-[11px] font-mono uppercase font-bold text-[#71717A] tracking-wider">
              Connected Sources
            </span>

            {/* Reddit */}
            <div className="p-3 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#FAFAFA]">
                  <span className="w-2 h-2 rounded-full bg-[#FB923C]" />
                  Reddit Trending
                </div>
                <div className="text-[11px] text-[#71717A] font-mono mt-0.5">
                  r/technology, r/worldnews (/hot)
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
                ACTIVE
              </span>
            </div>

            {/* RSS Breaking News */}
            <div className="p-3 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#FAFAFA]">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                  Breaking News RSS
                </div>
                <div className="text-[11px] text-[#71717A] font-mono mt-0.5">
                  BBC, NYT, TechCrunch, Verge
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
                POLLING
              </span>
            </div>

            {/* Bluesky (Paused per directive) */}
            <div className="p-3 rounded-xl bg-[#18181B]/50 border border-[#27272A] flex items-center justify-between opacity-60">
              <div>
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#A1A1AA]">
                  <span className="w-2 h-2 rounded-full bg-[#71717A]" />
                  Bluesky Firehose
                </div>
                <div className="text-[11px] text-[#71717A] font-mono mt-0.5">
                  Offline per directive
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-[#71717A] border border-[#3F3F46]">
                PAUSED
              </span>
            </div>
          </div>

          {/* Stream Filters */}
          <div className="bg-[#111114] border border-[#27272A] rounded-2xl p-4 space-y-2">
            <span className="text-[11px] font-mono uppercase font-bold text-[#71717A] tracking-wider">
              Filter By Stream
            </span>
            {[
              { id: 'all', label: 'All Firehose Posts', count: activePosts.length },
              { id: 'reddit', label: 'Reddit Trending Only', count: activePosts.filter((p) => p.platform === 'reddit').length },
              { id: 'rss', label: 'RSS News Only', count: activePosts.filter((p) => p.platform === 'rss').length },
              { id: 'critical', label: 'High Cascade Risk (>60%)', count: activePosts.filter((p) => p.riskScore > 0.6).length },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedCategory(f.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${
                  selectedCategory === f.id
                    ? 'bg-[#18181B] text-[#FAFAFA] border border-[#4F8CFF]/50'
                    : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B]/40'
                }`}
              >
                <span>{f.label}</span>
                <span className="font-mono text-[11px] text-[#71717A]">{f.count}</span>
              </button>
            ))}

            {selectedEmotionFilter && (
              <div className="pt-2 border-t border-[#27272A] flex items-center justify-between text-[11px]">
                <span className="text-[#A1A1AA]">Active Affect Filter:</span>
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

        {/* COLUMN 2: LIVE FEED (5 Cols) — Strict Internal Scrolling */}
        <div className="lg:col-span-5 flex flex-col bg-[#111114] border border-[#27272A] rounded-2xl overflow-hidden">
          <div className="h-11 px-4 bg-[#18181B]/80 border-b border-[#27272A] flex items-center justify-between text-[11px] font-mono text-[#71717A]">
            <span className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-[#4F8CFF]" />
              SIGNAL FEED ({filteredPosts.length} POSTS)
            </span>
            <span className="text-[#22C55E]">STREAMING REAL-TIME</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredPosts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-[#71717A] space-y-2">
                <Activity className="w-8 h-8 animate-pulse text-[#4F8CFF]" />
                <p className="text-[13px]">Awaiting incoming Reddit & RSS firehose posts...</p>
              </div>
            ) : (
              filteredPosts.map((post) => {
                const isSelected = inspectedPost?.id === post.id;
                const platformColor = post.platform === 'reddit' ? '#FB923C' : '#38BDF8';
                const postUrl = (post as any).url as string | undefined;

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
                        ? 'bg-[#18181B] border-[#4F8CFF] shadow-lg shadow-[#4F8CFF]/10'
                        : 'bg-[#141417] border-[#27272A] hover:border-[#3F3F46]'
                    }`}
                  >
                    {/* Top Row: Author & Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: platformColor }}
                        />
                        <span className="text-[13px] font-medium text-[#FAFAFA] truncate max-w-[180px]">
                          {post.authorName}
                        </span>
                        <span className="text-[10px] font-mono uppercase text-[#71717A]">
                          {post.platform}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[#4F8CFF]/10 text-[#4F8CFF] border border-[#4F8CFF]/30">
                          {post.emotion.dominant} ({(post.emotion.confidence * 100).toFixed(0)}%)
                        </span>
                        {post.riskScore > 0.6 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EF4444]/20 text-[#EF4444]">
                            CRITICAL
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content text */}
                    <p className="text-[13px] text-[#D4D4D8] leading-relaxed line-clamp-3">
                      {post.content}
                    </p>

                    {/* Bottom Metadata */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A] mt-2.5 pt-2 border-t border-[#27272A]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#71717A]" />
                        Latency: {post.processingLatencyMs.toFixed(1)}ms
                      </span>
                      {postUrl && (
                        <a
                          href={postUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-[#4F8CFF] hover:underline"
                        >
                          Source <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 3: POST DETAILS & FUSED NARRATIVES (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto">
          {/* Post Inspector */}
          {inspectedPost ? (
            <div className="bg-[#111114] border border-[#27272A] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                <span className="text-[11px] font-mono uppercase font-bold text-[#4F8CFF]">
                  Signal Inspection
                </span>
                <span className="text-[11px] font-mono text-[#71717A]">
                  ID: {inspectedPost.id.slice(0, 8)}
                </span>
              </div>

              <div>
                <h3 className="text-[14px] font-semibold text-[#FAFAFA]">
                  {inspectedPost.authorName}
                </h3>
                <p className="text-[12px] text-[#71717A] font-mono">
                  Platform: {inspectedPost.platform.toUpperCase()}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#18181B] text-[13px] text-[#FAFAFA] leading-relaxed">
                {inspectedPost.content}
              </div>

              {/* Psychological Breakdown */}
              <div className="space-y-2 pt-2 border-t border-[#27272A]">
                <div className="text-[11px] font-mono text-[#A1A1AA] uppercase">
                  Psychological Dimensions (GoEmotions)
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#71717A]">Dominant Affect</span>
                  <span className="font-mono text-[#FAFAFA] capitalize font-semibold">
                    {inspectedPost.emotion.dominant}
                  </span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#71717A]">Confidence</span>
                  <span className="font-mono text-[#22C55E]">
                    {(inspectedPost.emotion.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#71717A]">Cascade Contagion Risk</span>
                  <span className="font-mono text-[#EF4444]">
                    {(inspectedPost.riskScore * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#111114] border border-[#27272A] rounded-2xl p-6 flex flex-col items-center justify-center text-center text-[#71717A] space-y-2 min-h-44">
              <Sparkles className="w-6 h-6 text-[#4F8CFF]" />
              <div className="text-[13px] font-medium text-[#FAFAFA]">Click Any Post to Inspect</div>
              <p className="text-[12px] text-[#71717A] max-w-xs">
                Examine GoEmotions scoring, NLP entities, and risk factors in high resolution.
              </p>
            </div>
          )}

          {/* Unified Emerging Narratives */}
          <div className="bg-[#111114] border border-[#27272A] rounded-2xl p-5 space-y-3">
            <span className="text-[11px] font-mono uppercase font-bold text-[#71717A] tracking-wider">
              Fused Narratives ({localNarratives.length})
            </span>

            {localNarratives.length === 0 ? (
              <p className="text-[12px] text-[#71717A]">
                Narratives synthesize automatically as multiple posts correlate.
              </p>
            ) : (
              localNarratives.slice(0, 3).map((n) => (
                <div key={n.id} className="p-3 rounded-xl bg-[#18181B] border border-[#27272A] space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-[#FAFAFA] truncate">
                      {n.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#F59E0B]">
                      {typeof n.threatScore === 'object' ? n.threatScore.score : n.threatScore}/100
                    </span>
                  </div>
                  <div className="text-[11px] text-[#71717A] flex items-center justify-between">
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
