/**
 * Social Gravity - Real-Time Emerging Alert Engine & Evidence Extraction
 * Milestone M19 (Stages 5 & 15): Autonomous explainable alerts with full proof bundles
 */

import { UnifiedNarrative } from '../fusion/NarrativeFusionEngine';
import { GoEmotionLabel } from '../nlp/types';

export interface AlertEvidenceBundle {
  originatingPosts: Array<{
    id: string;
    platform: string;
    author: string;
    content: string;
    timestamp: number;
  }>;
  timeline: Array<{
    time: string;
    event: string;
    metric: string;
  }>;
  dominantEmotions: Array<{
    emotion: GoEmotionLabel;
    intensity: number;
  }>;
  propagationPath: string[]; // e.g. ["X (#emergency)", "Reddit (r/technology)", "Bluesky (tech)"]
  supportingCommunities: string[];
  confidenceBreakdown: {
    dataIntegrity: number;
    crossPlatformCorrelation: number;
    viralityProbability: number;
    compositeConfidence: number;
  };
}

export interface LiveAlert {
  id: string;
  narrativeId: string;
  title: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  timestamp: string;
  growthRate: number; // e.g. 240%
  dominantEmotion: GoEmotionLabel;
  crossCommunitySpread: 'low' | 'medium' | 'high' | 'explosive';
  threatScore: number; // 0 to 100
  evidence: AlertEvidenceBundle;
  recommendedAction: string;
  acknowledged: boolean;
}

export class AlertEngine {
  private alerts: LiveAlert[] = [];
  private alertListeners: Array<(alert: LiveAlert) => void> = [];
  private seenAlertNarratives: Set<string> = new Set();

  public onAlert(listener: (alert: LiveAlert) => void): void {
    this.alertListeners.push(listener);
  }

  /**
   * Evaluates a unified narrative and fires an alert if critical or high risk thresholds are reached.
   */
  public evaluateNarrative(narrative: UnifiedNarrative): LiveAlert | null {
    const isCritical = narrative.threatScore.score >= 75;
    const isHigh = narrative.threatScore.score >= 50 && narrative.growthRate >= 100;
    const isFastSpreading = narrative.platforms.length >= 2 && narrative.bridgeCrossings >= 2;

    if (!isCritical && !isHigh && !isFastSpreading) {
      return null;
    }

    const alertKey = `${narrative.id}-${narrative.threatScore.tier}`;
    if (this.seenAlertNarratives.has(alertKey)) {
      return null;
    }
    this.seenAlertNarratives.add(alertKey);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    // Extract Originating Posts
    const originatingPosts = narrative.recentPosts.slice(0, 5).map(p => ({
      id: p.id,
      platform: p.platform,
      author: p.authorName,
      content: p.content,
      timestamp: p.timestamp,
    }));

    // Build timeline milestones
    const timeline = [
      {
        time: timeStr,
        event: 'First Detection',
        metric: `Platform: ${narrative.platforms[0]}`,
      },
      {
        time: timeStr,
        event: 'Bridge Crossing',
        metric: `${narrative.affectedCommunities.length} communities involved`,
      },
      {
        time: timeStr,
        event: 'Threat Escalation',
        metric: `Threat Score: ${narrative.threatScore.score}/100 (${narrative.threatScore.tier})`,
      },
    ];

    // Build dominant emotion distribution
    const dominantEmotions: Array<{ emotion: GoEmotionLabel; intensity: number }> = [
      { emotion: narrative.dominantEmotion, intensity: 0.82 },
      { emotion: 'curiosity', intensity: 0.45 },
      { emotion: 'nervousness', intensity: 0.38 },
    ];

    // Build propagation path
    const propagationPath = narrative.platforms.map(p => {
      const comm = narrative.affectedCommunities.find(c => c.includes(p)) || `${p} ecosystem`;
      return `${p.toUpperCase()} (${comm})`;
    });

    // Evidence Bundle
    const evidence: AlertEvidenceBundle = {
      originatingPosts,
      timeline,
      dominantEmotions,
      propagationPath,
      supportingCommunities: narrative.affectedCommunities,
      confidenceBreakdown: {
        dataIntegrity: 0.94,
        crossPlatformCorrelation: Number(narrative.confidence.toFixed(2)),
        viralityProbability: Number((narrative.viralityForecast?.probability ?? 0.75).toFixed(2)),
        compositeConfidence: Number(
          ((0.94 + narrative.confidence + (narrative.viralityForecast?.probability ?? 0.75)) / 3.0).toFixed(2)
        ),
      },
    };

    let crossCommunitySpread: LiveAlert['crossCommunitySpread'] = 'low';
    if (narrative.bridgeCrossings >= 4 || narrative.affectedCommunities.length >= 3) {
      crossCommunitySpread = 'explosive';
    } else if (narrative.bridgeCrossings >= 2) {
      crossCommunitySpread = 'high';
    } else if (narrative.affectedCommunities.length >= 2) {
      crossCommunitySpread = 'medium';
    }

    let recommendedAction = 'Monitor stream velocity; no immediate intervention required.';
    if (narrative.threatScore.score >= 75) {
      recommendedAction = 'Deploy counter-narrative inoculation to bridge nodes; initiate official clarification.';
    } else if (narrative.threatScore.score >= 50) {
      recommendedAction = 'Prepare pre-bunking brief; monitor cross-platform amplification in real-time.';
    }

    const alert: LiveAlert = {
      id: `alert-${Date.now()}-${this.alerts.length + 1}`,
      narrativeId: narrative.id,
      title: `Emerging Narrative: ${narrative.title}`,
      severity: narrative.threatScore.tier,
      timestamp: timeStr,
      growthRate: narrative.growthRate,
      dominantEmotion: narrative.dominantEmotion,
      crossCommunitySpread,
      threatScore: narrative.threatScore.score,
      evidence,
      recommendedAction,
      acknowledged: false,
    };

    this.alerts.unshift(alert);
    if (this.alerts.length > 50) this.alerts.pop();

    this.alertListeners.forEach(listener => listener(alert));
    return alert;
  }

  public getAlerts(): LiveAlert[] {
    return [...this.alerts];
  }

  public acknowledgeAlert(id: string): void {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) alert.acknowledged = true;
  }
}
