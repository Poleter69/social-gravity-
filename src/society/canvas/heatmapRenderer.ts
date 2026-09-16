/**
 * Social Gravity — Heatmap & Specialized Visualization Modes (Stage 9)
 * Renders thermal density overlays, GoEmotions affective palettes,
 * risk escalation auras, and bridge bottleneck isolation.
 */

import { CanvasNode, ViewMode } from './types';
import { EMOTION_COLOR_MAP, GoEmotionLabel } from '../../nlp/types';

export class HeatmapRenderer {
  /**
   * Renders thermal radiation field underneath nodes for Heatmap mode.
   */
  public static renderThermalField(
    ctx: CanvasRenderingContext2D,
    nodes: CanvasNode[]
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      // Thermal intensity driven by infection state, risk score, or degree
      const intensity = n.state === 'BELIEVER' ? 0.9 : n.riskScore > 0.6 ? 0.75 : n.isInfluencer ? 0.6 : 0.25;
      const heatRadius = Math.max(30, n.radius * (intensity * 6 + 2));

      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, heatRadius);
      const heatColor = n.state === 'BELIEVER' ? '239, 68, 68' : n.riskScore > 0.5 ? '245, 158, 11' : '56, 189, 248';

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
   */
  public static getNodeColorForMode(node: CanvasNode, mode: ViewMode): string {
    switch (mode) {
      case 'emotion': {
        const emo = node.emotion as GoEmotionLabel;
        return EMOTION_COLOR_MAP[emo] || '#94A3B8';
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
        return node.state === 'BELIEVER' ? '#EF4444' : '#F59E0B';
      }
      case 'network':
      default: {
        // State or role-based default
        if (node.isPatientZero) return '#EF4444';
        if (node.state === 'BELIEVER') return '#EF4444';
        if (node.state === 'DEBUNKER') return '#10B981';
        if (node.state === 'SKEPTIC') return '#A855F7';
        if (node.state === 'SUSCEPTIBLE') return '#06B6D4';
        if (node.isInfluencer) return '#F59E0B';
        if (node.isBridge) return '#F59E0B';
        return node.communityColor || '#38BDF8';
      }
    }
  }
}
