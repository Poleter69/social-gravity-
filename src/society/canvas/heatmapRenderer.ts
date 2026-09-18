/**
 * Social Gravity — Heatmap & Specialized Visualization Modes (Stage 9)
 * Renders thermal density overlays, GoEmotions affective palettes,
 * risk escalation auras, and bridge bottleneck isolation.
 */

import { CanvasNode, ViewMode } from './types';
import { EMOTION_COLOR_MAP, GoEmotionLabel } from '../../nlp/types';

export class HeatmapRenderer {
  /**
   * Renders thermal radiation field underneath nodes for Heatmap and Emotion modes.
   */
  public static renderThermalField(
    ctx: CanvasRenderingContext2D,
    nodes: CanvasNode[],
    mode: ViewMode = 'heatmap'
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      // Thermal intensity driven by infection state, risk score, or arousal
      const intensity = n.state === 'BELIEVER' ? 0.9 : n.riskScore > 0.6 ? 0.75 : n.isInfluencer ? 0.6 : 0.35;
      const heatRadius = Math.max(30, n.radius * (intensity * 6 + 2));

      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, heatRadius);
      let heatColor = '56, 189, 248';

      if (mode === 'emotion') {
        const emo = (n.emotionProfile?.primaryEmotion || n.emotion) as GoEmotionLabel;
        const emoHex = EMOTION_COLOR_MAP[emo] || '#38BDF8';
        heatColor = hexToRgb(emoHex);
      } else {
        heatColor = n.state === 'BELIEVER' ? '239, 68, 68' : n.riskScore > 0.5 ? '245, 158, 11' : '56, 189, 248';
      }

      grad.addColorStop(0, `rgba(${heatColor}, ${0.35 * intensity})`);
      grad.addColorStop(0.5, `rgba(${heatColor}, ${0.12 * intensity})`);
      grad.addColorStop(1, `rgba(${heatColor}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, heatRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Computes the display color for a node based on the active ViewMode.
   * Milestone M21.2: Centralized color mapping grounded in real EmotionProfile.
   */
  public static getNodeColorForMode(node: CanvasNode, mode: ViewMode): string {
    const dominantEmotion = (node.emotionProfile?.primaryEmotion || node.emotion) as GoEmotionLabel;
    const emotionColor = EMOTION_COLOR_MAP[dominantEmotion] || '#64748B';

    switch (mode) {
      case 'emotion': {
        return emotionColor;
      }
      case 'risk': {
        switch (node.riskLevel) {
          case 'critical': return '#EF4444';
          case 'high': return '#F97316';
          case 'moderate': return '#FBBF24';
          case 'low': return '#10B981';
        }
      }
      case 'bridges': {
        return node.isBridge ? '#F59E0B' : node.isInfluencer ? '#38BDF8' : '#3F3F46';
      }
      case 'community': {
        return node.communityColor || '#38BDF8';
      }
      case 'heatmap': {
        return node.state === 'BELIEVER' ? '#EF4444' : emotionColor;
      }
      case 'network':
      default: {
        // Critical alerts maintain priority highlights; all baseline nodes reflect real emotion
        if (node.isPatientZero) return '#EF4444';
        if (node.state === 'BELIEVER') return '#EF4444';
        if (node.state === 'DEBUNKER') return '#10B981';
        return emotionColor;
      }
    }
  }
}

function hexToRgb(hex: string): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
  const num = parseInt(c, 16);
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}
