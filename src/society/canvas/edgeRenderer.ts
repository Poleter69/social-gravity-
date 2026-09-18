/**
 * Social Gravity — Edge Intelligence & Transmission Pulses (Stage 8 & Stage 10)
 * Renders normal, bridge, active, and critical conduits with animated photon
 * pulses and narrative focus illumination.
 */

import { CanvasEdge, CanvasNode, TransmissionParticle } from './types';

export class EdgeRenderer {
  /**
   * Render network conduits with dynamic weights, glowing bridges, and narrative focus.
   */
  public static renderEdges(
    ctx: CanvasRenderingContext2D,
    edges: CanvasEdge[],
    nodeMap: Map<string, CanvasNode>,
    selectedNodeId: string | null,
    hoveredNodeId: string | null,
    focusNarrativeNodeIds: Set<string> | null,
    zoomScale: number,
    isLight: boolean = false
  ): void {
    const isFocusActive = focusNarrativeNodeIds !== null && focusNarrativeNodeIds.size > 0;
    const isMesoOrMicro = zoomScale >= 0.55;

    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      const n1 = nodeMap.get(e.source);
      const n2 = nodeMap.get(e.target);
      if (!n1 || !n2) continue;

      const isConnectedToSelected = selectedNodeId === e.source || selectedNodeId === e.target;
      const isConnectedToHovered = hoveredNodeId === e.source || hoveredNodeId === e.target;
      const isBridgeEdge = e.type === 'bridge' || (n1.isBridge && n2.isBridge);

      // Check Narrative Focus participation
      let isPartOfFocusNarrative = false;
      if (isFocusActive) {
        isPartOfFocusNarrative = focusNarrativeNodeIds.has(e.source) && focusNarrativeNodeIds.has(e.target);
      }

      // Edge Opacity calculation
      let opacity = isLight ? 0.32 : 0.22;
      if (isFocusActive) {
        opacity = isPartOfFocusNarrative ? 0.85 : 0.04;
      } else if (isConnectedToSelected || isConnectedToHovered) {
        opacity = 0.95;
      } else if (isBridgeEdge) {
        opacity = isLight ? 0.75 : 0.65;
      } else if (!isMesoOrMicro) {
        // Far zoom: only draw bridge edges to eliminate clutter
        if (!isBridgeEdge) continue;
        opacity = 0.4;
      }

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);

      // Conduit Styling
      if (isFocusActive && isPartOfFocusNarrative) {
        ctx.strokeStyle = `rgba(239, 68, 68, ${opacity})`; // Radiant crimson narrative path
        ctx.lineWidth = 2.4;
        ctx.shadowColor = '#EF4444';
        ctx.shadowBlur = 8;
      } else if (isConnectedToSelected || isConnectedToHovered) {
        ctx.strokeStyle = isLight ? `rgba(2, 132, 199, ${opacity})` : `rgba(0, 240, 255, ${opacity})`; // Cyan/sky highlight
        ctx.lineWidth = 2.0;
        ctx.shadowColor = isLight ? '#0284C7' : '#00F0FF';
        ctx.shadowBlur = 6;
      } else if (e.critical) {
        ctx.strokeStyle = `rgba(239, 68, 68, ${opacity})`; // Critical transmission vector
        ctx.lineWidth = Math.max(1.2, e.weight * 1.6);
      } else if (isBridgeEdge) {
        ctx.strokeStyle = isLight ? `rgba(217, 119, 6, ${opacity})` : `rgba(245, 158, 11, ${opacity})`; // Amber bridge
        ctx.lineWidth = Math.max(1.4, e.weight * 1.5);
        ctx.setLineDash([6, 4]);
      } else {
        ctx.strokeStyle = isLight ? `rgba(100, 116, 139, ${opacity})` : `rgba(148, 163, 184, ${opacity})`; // Subtle slate tie
        ctx.lineWidth = Math.max(0.7, e.weight);
      }

      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Render travelling transmission particles (photons) along edges.
   */
  public static renderParticles(
    ctx: CanvasRenderingContext2D,
    particles: TransmissionParticle[]
  ): void {
    if (particles.length === 0) return;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const curX = p.startX + (p.endX - p.startX) * p.progress;
      const curY = p.startY + (p.endY - p.startY) * p.progress;

      ctx.save();
      ctx.beginPath();
      ctx.arc(curX, curY, p.size, 0, Math.PI * 2);

      const photonColor = p.type === 'debunk' ? '#10B981' : p.type === 'rumor' ? '#EF4444' : '#38BDF8';
      ctx.fillStyle = photonColor;
      ctx.shadowColor = photonColor;
      ctx.shadowBlur = 10;
      ctx.fill();

      // Photon motion comet tail
      const tailX = p.startX + (p.endX - p.startX) * Math.max(0, p.progress - 0.08);
      const tailY = p.startY + (p.endY - p.startY) * Math.max(0, p.progress - 0.08);

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(curX, curY);
      ctx.strokeStyle = `${photonColor}66`;
      ctx.lineWidth = p.size * 0.8;
      ctx.stroke();

      ctx.restore();
    }
  }
}
