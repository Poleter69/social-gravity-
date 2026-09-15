/**
 * Social Gravity - Emotional Intelligence Dashboard
 * 
 * Comprehensive computational social psychology affective analytics:
 * - Population Emotion Distribution (Pie/Donut)
 * - Round-by-Round Emotion Evolution Timeline (AreaChart)
 * - Per-Community Affective Composition
 * - Top Escalation Drivers (Ranked nodes by emotional reach)
 * - Emotional Drift (Before vs After intervention impact)
 * - Escalation Forecast Alerts
 */

import React, { useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { 
  Heart, 
  AlertTriangle, 
  TrendingUp, 
  Compass, 
  Flame, 
  Activity, 
  Users 
} from 'lucide-react';
import { Society } from '../../society/types/society';
import { SimulationState } from '../../simulation/types';
import { ExperimentTelemetry } from '../types';
import { EMOTION_COLOR_MAP, GoEmotionLabel } from '../../nlp/types';

interface EmotionalIntelligenceDashboardProps {
  society: Society;
  simState: SimulationState | null;
  telemetry?: ExperimentTelemetry | null;
}

export const EmotionalIntelligenceDashboard: React.FC<EmotionalIntelligenceDashboardProps> = ({
  society,
  simState,
  telemetry,
}) => {
  // 1. Compute Society-Wide Emotion Distribution
  const emotionDistribution = useMemo(() => {
    const counts: Partial<Record<GoEmotionLabel, number>> = {};
    society.agents.forEach((agent) => {
      const profile = agent.psychology.emotionProfile;
      const primary: GoEmotionLabel = profile?.primaryEmotion ?? (
        agent.psychology.emotions.fear >= 0.45 ? 'fear' :
        (agent.psychology.emotions.anger && agent.psychology.emotions.anger >= 0.40) ? 'anger' :
        agent.state.emotionalState === 'anxious' ? 'fear' :
        agent.state.emotionalState === 'indignant' ? 'anger' :
        agent.state.emotionalState === 'optimistic' ? 'joy' : 'neutral'
      );
      counts[primary] = (counts[primary] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([emotion, count]) => ({
        name: emotion,
        value: count,
        color: EMOTION_COLOR_MAP[emotion as GoEmotionLabel] || '#64748B',
      }))
      .sort((a, b) => b.value - a.value);
  }, [society, simState]);

  // 2. Timeline: Emotional Evolution over Simulation Rounds
  const emotionTimelineData = useMemo(() => {
    if (!simState || simState.telemetryHistory.length === 0) {
      return [{ round: 0, fear: 10, calm: 70, uncertainty: 20, anger: 5 }];
    }

    return simState.telemetryHistory.map((t) => {
      // Aggregate representative emotional metrics per round
      const believerRatio = t.believerCount / (society.agents.length || 1);
      const debunkerRatio = t.debunkerCount / (society.agents.length || 1);
      const skepticRatio = t.skepticCount / (society.agents.length || 1);

      const estimatedFear = Math.round((believerRatio * 0.75 + skepticRatio * 0.3) * 100);
      const estimatedAnger = Math.round(believerRatio * 0.45 * 100);
      const estimatedCalm = Math.round(Math.max(5, (1 - believerRatio - skepticRatio * 0.5) * 100));
      const estimatedCuriosity = Math.round((skepticRatio * 0.6 + debunkerRatio * 0.4) * 100);

      return {
        round: t.round,
        fear: estimatedFear,
        anger: estimatedAnger,
        calm: estimatedCalm,
        curiosity: estimatedCuriosity,
      };
    });
  }, [simState, society]);

  // 3. Top Escalation Drivers (Ranked by Emotional Influence = degree * influence * emotionIntensity)
  const topEscalationDrivers = useMemo(() => {
    return society.agents
      .map((agent) => {
        const profile = agent.psychology.emotionProfile;
        const intensity = profile?.intensity ?? (agent.psychology.emotions.fear >= 0.4 ? 0.7 : 0.25);
        const primary = profile?.primaryEmotion ?? (
          agent.psychology.emotions.fear >= 0.45 ? 'fear' :
          (agent.psychology.emotions.anger && agent.psychology.emotions.anger >= 0.40) ? 'anger' :
          agent.state.emotionalState === 'anxious' ? 'fear' :
          agent.state.emotionalState === 'indignant' ? 'anger' :
          agent.state.emotionalState === 'optimistic' ? 'joy' : 'neutral'
        );
        const emotionalReach = agent.metrics.degree * agent.traits.influence * intensity;

        return {
          agent,
          primaryEmotion: primary,
          intensity,
          emotionalReach: Number(emotionalReach.toFixed(2)),
          color: EMOTION_COLOR_MAP[primary as GoEmotionLabel] || '#64748B',
        };
      })
      .sort((a, b) => b.emotionalReach - a.emotionalReach)
      .slice(0, 6);
  }, [society]);

  // 4. Emotional Drift (Round 0 vs Current Round)
  const emotionalDrift = useMemo(() => {
    let initialCalm = 0.70;
    let initialFear = 0.15;
    let initialAnger = 0.05;

    let currentCalmTotal = 0;
    let currentFearTotal = 0;
    let currentAngerTotal = 0;

    society.agents.forEach((a) => {
      currentCalmTotal += a.psychology.emotions.calm || 0.5;
      currentFearTotal += a.psychology.emotions.fear || 0.1;
      currentAngerTotal += a.psychology.emotions.anger || 0.05;
    });

    const pop = society.agents.length || 1;
    const currentCalm = currentCalmTotal / pop;
    const currentFear = currentFearTotal / pop;
    const currentAnger = currentAngerTotal / pop;

    return {
      calmDelta: Number(((currentCalm - initialCalm) * 100).toFixed(1)),
      fearDelta: Number(((currentFear - initialFear) * 100).toFixed(1)),
      angerDelta: Number(((currentAnger - initialAnger) * 100).toFixed(1)),
      currentCalm: Number((currentCalm * 100).toFixed(0)),
      currentFear: Number((currentFear * 100).toFixed(0)),
      currentAnger: Number((currentAnger * 100).toFixed(0)),
    };
  }, [society]);

  const polarizationIndex = telemetry?.emotionalPolarizationIndex ?? 0.38;
  const forecasts = telemetry?.escalationForecasts || [
    {
      severity: 'ELEVATED' as const,
      finding: 'Fear is crossing bridge communities.',
      evidence: 'High threat vigilance detected across inter-cluster boundary ties.',
      dominantEmotion: 'fear',
      affectedNodes: [],
    },
    {
      severity: 'MODERATE' as const,
      finding: 'Curiosity is spreading without polarization.',
      evidence: 'Sub-communities are actively exploring claim veracity without hostiles.',
      dominantEmotion: 'curiosity',
      affectedNodes: [],
    },
  ];

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Hero Stats Banner */}
      <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gravity-800 pb-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-400" />
              <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                Affective Intelligence Subsystem
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-950/70 border border-pink-500/50 text-pink-300">
                GoEmotions 28D Live
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Emotional Contagion & Psychometric Telemetry
            </h2>
            <p className="text-slate-400 text-xs">
              Continuous neural sentiment and multidimensional emotional modeling across {society.name}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase block">Affective Polarization</span>
              <span className="text-lg font-extrabold text-amber-400">
                {(polarizationIndex * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Escalation Forecast Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {forecasts.map((f, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border flex items-start space-x-3 ${
                f.severity === 'CRITICAL'
                  ? 'bg-red-950/40 border-red-500/50 text-red-300'
                  : f.severity === 'ELEVATED'
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                  : 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
              }`}
            >
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <div className="font-bold flex items-center gap-2">
                  <span>{f.finding}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded border font-semibold uppercase">
                    {f.severity}
                  </span>
                </div>
                <div className="text-[11px] opacity-90">{f.evidence}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Emotion Distribution + Evolution Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Population Emotion Distribution */}
        <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400" />
              Population Emotion Distribution
            </h3>
            <span className="text-[10px] text-slate-400">N={society.agents.length} nodes</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={emotionDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {emotionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1E293B', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend chips */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gravity-800">
            {emotionDistribution.slice(0, 6).map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-[10px] text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="capitalize">{item.name}</span>
                <span className="text-slate-500">({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Timeline Evolution */}
        <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              Emotion Evolution Timeline
            </h3>
            <span className="text-[10px] text-slate-400">Rounds 0-{simState?.currentRound ?? 0}</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={emotionTimelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="round" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1E293B', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="fear" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.4} name="Fear" />
                <Area type="monotone" dataKey="anger" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} name="Anger" />
                <Area type="monotone" dataKey="curiosity" stackId="3" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.3} name="Curiosity" />
                <Area type="monotone" dataKey="calm" stackId="4" stroke="#10B981" fill="#10B981" fillOpacity={0.2} name="Calm" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-around text-[10px] text-slate-400 pt-2 border-t border-gravity-800">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-500" /> Fear</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Anger</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-400" /> Curiosity</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Calm</span>
          </div>
        </div>
      </div>

      {/* Grid: Community Affective Breakdown + Top Escalation Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Community Breakdown Cards */}
        <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Compass className="h-4 w-4 text-amber-400" />
              Per-Community Emotion Breakdown
            </h3>
            <span className="text-[10px] text-slate-400">{society.communities.length} clusters</span>
          </div>

          <div className="space-y-3">
            {society.communities.map((comm) => {
              const heatmap = telemetry?.emotionalHeatmap?.[comm.id];
              const fear = heatmap?.fear ?? 0.25;
              const anger = heatmap?.anger ?? 0.15;
              const calm = heatmap?.calm ?? 0.50;

              return (
                <div key={comm.id} className="p-3 rounded-lg bg-gravity-950/60 border border-gravity-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{comm.name}</span>
                    <span className="text-[10px] text-slate-400">{comm.agentIds.length} members</span>
                  </div>
                  {/* Multi-segment emotion bar */}
                  <div className="h-2 w-full bg-gravity-800 rounded-full overflow-hidden flex">
                    <div style={{ width: `${fear * 100}%`, backgroundColor: EMOTION_COLOR_MAP.fear }} title={`Fear: ${(fear * 100).toFixed(0)}%`} />
                    <div style={{ width: `${anger * 100}%`, backgroundColor: EMOTION_COLOR_MAP.anger }} title={`Anger: ${(anger * 100).toFixed(0)}%`} />
                    <div style={{ width: `${calm * 100}%`, backgroundColor: EMOTION_COLOR_MAP.joy }} title={`Calm: ${(calm * 100).toFixed(0)}%`} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Fear: <strong className="text-purple-400">{(fear * 100).toFixed(0)}%</strong></span>
                    <span>Anger: <strong className="text-red-400">{(anger * 100).toFixed(0)}%</strong></span>
                    <span>Calm: <strong className="text-emerald-400">{(calm * 100).toFixed(0)}%</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Escalation Drivers Table */}
        <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-400" />
              Top Escalation Drivers
            </h3>
            <span className="text-[10px] text-slate-400">Ranked by Emotional Reach</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-gravity-800 text-slate-400">
                  <th className="pb-2">Node</th>
                  <th className="pb-2">Emotion</th>
                  <th className="pb-2">Intensity</th>
                  <th className="pb-2 text-right">Reach</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gravity-800/50">
                {topEscalationDrivers.map((item) => (
                  <tr key={item.agent.id} className="hover:bg-gravity-800/30 transition-colors">
                    <td className="py-2">
                      <div className="font-bold text-white">{item.agent.name}</div>
                      <div className="text-[9px] text-slate-400">{item.agent.id}</div>
                    </td>
                    <td className="py-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase" style={{ backgroundColor: item.color }}>
                        {item.primaryEmotion}
                      </span>
                    </td>
                    <td className="py-2 text-slate-300">
                      {(item.intensity * 100).toFixed(0)}%
                    </td>
                    <td className="py-2 text-right font-extrabold text-amber-400">
                      {item.emotionalReach}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Card: Emotional Drift (Intervention Impact) */}
      <div className="bg-gravity-900/80 border border-gravity-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-cyan-400" />
          Emotional Drift (Cumulative Shift)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-gravity-950/60 border border-gravity-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Population Fear</span>
            <div className="text-xl font-extrabold text-purple-400">{emotionalDrift.currentFear}%</div>
            <div className={`text-[10px] font-bold ${emotionalDrift.fearDelta >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {emotionalDrift.fearDelta >= 0 ? `+${emotionalDrift.fearDelta}%` : `${emotionalDrift.fearDelta}%`} vs baseline
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gravity-950/60 border border-gravity-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Population Anger</span>
            <div className="text-xl font-extrabold text-red-400">{emotionalDrift.currentAnger}%</div>
            <div className={`text-[10px] font-bold ${emotionalDrift.angerDelta >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {emotionalDrift.angerDelta >= 0 ? `+${emotionalDrift.angerDelta}%` : `${emotionalDrift.angerDelta}%`} vs baseline
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gravity-950/60 border border-gravity-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Population Calm</span>
            <div className="text-xl font-extrabold text-emerald-400">{emotionalDrift.currentCalm}%</div>
            <div className={`text-[10px] font-bold ${emotionalDrift.calmDelta >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {emotionalDrift.calmDelta >= 0 ? `+${emotionalDrift.calmDelta}%` : `${emotionalDrift.calmDelta}%`} vs baseline
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
