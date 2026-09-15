/**
 * Social Gravity - Alert Explainability Engine
 * Generates evidence-backed explanations for every alert trigger.
 * No hallucinated reasoning - every claim references actual simulation data.
 */

import { Society } from '../society/types/society';
import { SimulationState, RoundTelemetry } from '../simulation/types';
import { DiscoveryReport } from '../discovery/types';

export interface AlertExplanation {
  alertTitle: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  triggerEvidence: string[];          // Why it triggered (data-backed)
  causalAgents: AgentContribution[];  // Which nodes caused it
  bridgeAmplifiers: AgentContribution[]; // Which bridges amplified
  emotionContributions: EmotionFactor[]; // Which emotions contributed
  recommendedIntervention: string;
  confidenceScore: number;            // 0-1
  roundDetected: number;
}

export interface AgentContribution {
  agentId: string;
  agentName: string;
  role: string;
  isInfluencer: boolean;
  isBridge: boolean;
  communityId: string;
  shareCount: number;
  beliefStatus: string;
  contributionWeight: number;  // 0-1 relative impact
}

export interface EmotionFactor {
  emotion: string;
  agentCount: number;
  avgIntensity: number;
  impact: 'amplifying' | 'dampening' | 'neutral';
}

function severity(r0: number, believerRatio: number): AlertExplanation['severity'] {
  if (r0 >= 3 || believerRatio > 0.4) return 'critical';
  if (r0 >= 2 || believerRatio > 0.25) return 'high';
  if (r0 >= 1 || believerRatio > 0.10) return 'moderate';
  return 'low';
}

export class AlertExplainer {
  explain(
    society: Society,
    simState: SimulationState,
    telemetryHistory: RoundTelemetry[],
    discoveryReport: DiscoveryReport | null,
    alertTitle: string
  ): AlertExplanation {
    const n = society.agents.length;
    if (n === 0) {
      return {
        alertTitle,
        severity: 'low',
        triggerEvidence: ['No agents in society.'],
        causalAgents: [],
        bridgeAmplifiers: [],
        emotionContributions: [],
        recommendedIntervention: 'Generate or load a society first.',
        confidenceScore: 0,
        roundDetected: 0,
      };
    }

    const latestTelemetry = telemetryHistory[telemetryHistory.length - 1];
    const peakR0 = Math.max(0, ...telemetryHistory.map(t => t.r0));
    const believers = society.agents.filter(a =>
      (simState.agentStates.get(a.id) ?? 'SUSCEPTIBLE') === 'BELIEVER'
    );
    const believerRatio = believers.length / n;

    // --- Causal agents (influencers and high-share agents) ---
    const causalAgents: AgentContribution[] = believers
      .sort((a, b) => b.state.shareCount - a.state.shareCount)
      .slice(0, 5)
      .map(a => ({
        agentId: a.id,
        agentName: a.name,
        role: a.role,
        isInfluencer: a.isInfluencer,
        isBridge: a.isBridge,
        communityId: a.communityId,
        shareCount: a.state.shareCount,
        beliefStatus: a.state.beliefStatus,
        contributionWeight: a.isInfluencer ? 0.9 : Math.min(1, a.state.shareCount / 10),
      }));

    // --- Bridge amplifiers ---
    const bridgeAmplifiers: AgentContribution[] = society.agents
      .filter(a => a.isBridge && (simState.agentStates.get(a.id) ?? '') === 'BELIEVER')
      .slice(0, 5)
      .map(a => ({
        agentId: a.id,
        agentName: a.name,
        role: a.role,
        isInfluencer: a.isInfluencer,
        isBridge: true,
        communityId: a.communityId,
        shareCount: a.state.shareCount,
        beliefStatus: a.state.beliefStatus,
        contributionWeight: 0.85,
      }));

    // --- Emotion contributions ---
    const emotionMap = new Map<string, { total: number; count: number }>();
    for (const agent of believers) {
      const primary = agent.psychology?.emotionProfile?.primaryEmotion ?? agent.state.emotionalState;
      const intensity = agent.psychology?.emotionProfile?.intensity ?? 0.5;
      const existing = emotionMap.get(primary) ?? { total: 0, count: 0 };
      emotionMap.set(primary, { total: existing.total + intensity, count: existing.count + 1 });
    }
    const emotionContributions: EmotionFactor[] = Array.from(emotionMap.entries())
      .map(([emotion, stats]) => ({
        emotion,
        agentCount: stats.count,
        avgIntensity: stats.total / stats.count,
        impact: (['fear', 'anger', 'nervousness', 'indignant', 'anxious'].includes(emotion)
          ? 'amplifying'
          : ['joy', 'calm', 'neutral', 'optimistic'].includes(emotion)
            ? 'dampening'
            : 'neutral') as EmotionFactor['impact'],
      }))
      .sort((a, b) => b.agentCount - a.agentCount)
      .slice(0, 5);

    // --- Trigger evidence (data-backed sentences) ---
    const triggerEvidence: string[] = [];
    if (latestTelemetry) {
      triggerEvidence.push(
        `Round ${latestTelemetry.round}: ${latestTelemetry.believerCount} agents adopted the signal (${(believerRatio * 100).toFixed(1)}% of population).`
      );
      triggerEvidence.push(
        `Peak reproductive number R₀ = ${peakR0.toFixed(2)} — each believer infected ${peakR0.toFixed(1)} others on average.`
      );
      if (latestTelemetry.maxCascadeDepth > 2) {
        triggerEvidence.push(
          `Cascade reached depth ${latestTelemetry.maxCascadeDepth}, propagating beyond immediate neighbors into secondary communities.`
        );
      }
    }
    if (causalAgents.some(a => a.isInfluencer)) {
      const inf = causalAgents.filter(a => a.isInfluencer);
      triggerEvidence.push(
        `${inf.length} influencer node${inf.length > 1 ? 's' : ''} (${inf.map(a => a.agentName).join(', ')}) amplified the signal across community boundaries.`
      );
    }
    if (bridgeAmplifiers.length > 0) {
      triggerEvidence.push(
        `${bridgeAmplifiers.length} bridge agent${bridgeAmplifiers.length > 1 ? 's' : ''} carried the signal across community boundaries, enabling cross-community contagion.`
      );
    }
    const ampEmotions = emotionContributions.filter(e => e.impact === 'amplifying');
    if (ampEmotions.length > 0) {
      triggerEvidence.push(
        `Amplifying emotions detected: ${ampEmotions.map(e => `${e.emotion} (${e.agentCount} agents, avg intensity ${e.avgIntensity.toFixed(2)})`).join('; ')}.`
      );
    }

    // --- Recommended intervention from discovery engine ---
    const recommendedIntervention =
      discoveryReport?.intervention?.rationale ??
      discoveryReport?.intervention?.title ??
      (peakR0 >= 2
        ? 'Deploy trusted peer messengers through bridge nodes to counter cross-community propagation.'
        : 'Monitor cascade velocity. Prepare fact-checking assets at influencer nodes.');

    const confidenceScore = Math.min(
      0.99,
      0.4 + (believers.length / n) * 0.3 + Math.min(peakR0 / 4, 0.3)
    );

    return {
      alertTitle,
      severity: severity(peakR0, believerRatio),
      triggerEvidence,
      causalAgents,
      bridgeAmplifiers,
      emotionContributions,
      recommendedIntervention,
      confidenceScore: Number(confidenceScore.toFixed(3)),
      roundDetected: latestTelemetry?.round ?? simState.currentRound,
    };
  }

  /** Produce a natural-language narrative of the explanation */
  toNarrative(exp: AlertExplanation): string {
    const lines: string[] = [
      `ALERT: ${exp.alertTitle}`,
      `Severity: ${exp.severity.toUpperCase()} | Confidence: ${(exp.confidenceScore * 100).toFixed(0)}% | Detected at Round ${exp.roundDetected}`,
      '',
      'WHY IT TRIGGERED:',
      ...exp.triggerEvidence.map(e => `  • ${e}`),
    ];

    if (exp.causalAgents.length > 0) {
      lines.push('', 'CAUSAL AGENTS:');
      exp.causalAgents.forEach(a =>
        lines.push(`  • ${a.agentName} (${a.role}) — ${a.shareCount} shares, weight ${(a.contributionWeight * 100).toFixed(0)}%`)
      );
    }

    if (exp.bridgeAmplifiers.length > 0) {
      lines.push('', 'BRIDGE AMPLIFIERS:');
      exp.bridgeAmplifiers.forEach(a =>
        lines.push(`  • ${a.agentName} bridged community "${a.communityId}"`)
      );
    }

    if (exp.emotionContributions.length > 0) {
      lines.push('', 'EMOTION CONTRIBUTIONS:');
      exp.emotionContributions.forEach(e =>
        lines.push(`  • ${e.emotion}: ${e.agentCount} agents, avg intensity ${e.avgIntensity.toFixed(2)} (${e.impact})`)
      );
    }

    lines.push('', 'RECOMMENDED INTERVENTION:', `  ${exp.recommendedIntervention}`);
    return lines.join('\n');
  }
}

export const alertExplainer = new AlertExplainer();
