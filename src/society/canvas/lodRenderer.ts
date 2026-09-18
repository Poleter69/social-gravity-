/**
 * Social Gravity — Multi-Level Level-of-Detail (LOD) Renderer (Stage 4 & Stage 14)
 * Dynamically adjusts node detail, badges, confidence rings, label visibility,
 * and background intelligence grid based on camera zoom scale.
 */

import { CanvasNode, ViewMode, CommunityHull } from './types';
import { HeatmapRenderer } from './heatmapRenderer';

export class LODRenderer {
  /**
   * Renders the faint intelligence grid (Figma / Obsidian / Star Map style).
   * Never overpowers the graph. Uses dot grid and subtle coordinate crosses.
   */
  public static renderIntelligenceGrid(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    cameraX: number,
    cameraY: number,
    cameraScale: number,
    isLight: boolean = false
  ): void {
    ctx.save();
    // Grid in screen space for maximum crispness and zero scaling jitter
    const step = 32 * Math.max(0.5, Math.min(2.0, cameraScale));
    const offsetX = ((cameraX % step) + step) % step;
    const offsetY = ((cameraY % step) + step) % step;

    ctx.fillStyle = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.035)';
    for (let x = offsetX; x < canvasWidth; x += step) {
      for (let y = offsetY; y < canvasHeight; y += step) {
        ctx.fillRect(x, y, 1.2, 1.2);
      }
    }

    // Faint coordinate crosshairs at large macro intervals (e.g. 256px)
    const macroStep = 256 * cameraScale;
    if (macroStep > 60 && macroStep < 1200) {
      const macroOffsetX = ((cameraX % macroStep) + macroStep) % macroStep;
      const macroOffsetY = ((cameraY % macroStep) + macroStep) % macroStep;

      ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let mx = macroOffsetX; mx < canvasWidth; mx += macroStep) {
        for (let my = macroOffsetY; my < canvasHeight; my += macroStep) {
          ctx.beginPath();
          ctx.moveTo(mx - 4, my);
          ctx.lineTo(mx + 4, my);
          ctx.moveTo(mx, my - 4);
          ctx.lineTo(mx, my + 4);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  /**
   * Renders Macro View community badges when zoomed out (scale < 0.6x).
   */
  public static renderMacroLabels(
    ctx: CanvasRenderingContext2D,
    hulls: CommunityHull[],
    hoveredCommunityId: string | null
  ): void {
    ctx.save();
    ctx.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < hulls.length; i++) {
      const h = hulls[i];
      const isHovered = hoveredCommunityId === h.communityId;

      const label = `${h.name.toUpperCase()} (${h.nodeCount})`;
      const textWidth = ctx.measureText(label).width;
      const pillWidth = textWidth + 18;
      const pillHeight = 22;

      // Centered at centroid
      const px = h.centroid.x;
      const py = h.centroid.y;

      // Glassmorphic badge background
      ctx.fillStyle = isHovered ? 'rgba(9, 9, 11, 0.95)' : 'rgba(17, 17, 20, 0.85)';
      ctx.strokeStyle = isHovered ? h.color : `${h.color}55`;
      ctx.lineWidth = isHovered ? 1.5 : 1.0;

      ctx.beginPath();
      ctx.roundRect(px - pillWidth / 2, py - pillHeight / 2, pillWidth, pillHeight, 6);
      ctx.fill();
      ctx.stroke();

      // Badge text
      ctx.fillStyle = isHovered ? '#FAFAFA' : '#E4E4E7';
      ctx.fillText(label, px, py + 0.5);
    }

    ctx.restore();
  }

  /**
   * Renders nodes with Level-of-Detail (LOD), soft gradients, confidence rings, and labels.
   */
  public static renderNodes(
    ctx: CanvasRenderingContext2D,
    nodes: CanvasNode[],
    viewMode: ViewMode,
    selectedNodeId: string | null,
    hoveredNodeId: string | null,
    focusNarrativeNodeIds: Set<string> | null,
    activeSafetyCategories: Set<string> | null,
    zoomScale: number,
    pulseTick: number
  ): void {
    const isFocusActive = focusNarrativeNodeIds !== null && focusNarrativeNodeIds.size > 0;
    const isSafetyFilterActive = activeSafetyCategories !== null && activeSafetyCategories.size > 0;
    const isZoomedOut = zoomScale < 0.6;
    const isCloseZoom = zoomScale > 1.8;

    ctx.save();

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const isSelected = selectedNodeId === node.id;
      const isHovered = hoveredNodeId === node.id;
      const nodeColor = HeatmapRenderer.getNodeColorForMode(node, viewMode);

      // Check narrative focus dimming & M20 safety highlight mode
      let alpha = 1.0;
      if (isFocusActive) {
        const inFocus = focusNarrativeNodeIds.has(node.id);
        alpha = inFocus ? 1.0 : 0.12; // 15% opacity per specification
      }

      if (isSafetyFilterActive) {
        const matchesSafety = node.safety && activeSafetyCategories.has(node.safety.category);
        if (matchesSafety) {
          alpha = 1.0;
        } else {
          alpha = Math.min(alpha, 0.15); // Stage 5: Dim unrelated nodes
        }
      }

      // Live entrance growth animation
      const scale = node.scaleFactor < 1.0 ? node.scaleFactor : 1.0;
      const effectiveRadius = (isHovered ? node.radius * 1.3 : isSelected ? node.radius * 1.25 : node.radius) * scale;

      ctx.save();
      ctx.globalAlpha = alpha;

      // 1. Soft Ambient Glow Halo (Stage 14 & M21.2: Visual Polish & Emotional Resonance)
      if (
        node.isInfluencer || 
        node.isPatientZero || 
        isSelected || 
        isHovered || 
        viewMode === 'emotion' ||
        (node.pulseTimer && node.pulseTimer > 0) ||
        (viewMode === 'risk' && node.riskLevel === 'critical')
      ) {
        const haloRadius = effectiveRadius + (isSelected ? 9 : 6) + Math.sin(pulseTick * 0.05) * 1.5;
        const glowGrad = ctx.createRadialGradient(node.x, node.y, effectiveRadius * 0.5, node.x, node.y, haloRadius);
        const glowColor = isSelected ? '0, 240, 255' : node.isPatientZero ? '239, 68, 68' : nodeColor.startsWith('#') ? hexToRgb(nodeColor) : '245, 158, 11';

        glowGrad.addColorStop(0, `rgba(${glowColor}, ${isSelected ? 0.6 : 0.42})`);
        glowGrad.addColorStop(1, `rgba(${glowColor}, 0)`);

        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, haloRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Patient Zero & Selection Rings
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, effectiveRadius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 2.0;
        ctx.stroke();
      } else if (node.isPatientZero) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, effectiveRadius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      // 3. Bridge Node Indicator Aura (Stage 8 & 9)
      if (node.isBridge && !isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, effectiveRadius + 2.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3b. M20 Safety Indicator Outlines & Icons (Stage 4)
      if (node.safety && node.safety.category !== 'none') {
        if (node.safety.category === 'explicit') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, effectiveRadius + 3.5, 0, Math.PI * 2);
          ctx.strokeStyle = '#A855F7';
          ctx.lineWidth = 2.0;
          ctx.stroke();

          // Eye indicator dot
          ctx.fillStyle = '#A855F7';
          ctx.beginPath();
          ctx.arc(node.x + effectiveRadius * 0.7, node.y - effectiveRadius * 0.7, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (node.safety.category === 'terrorism') {
          const pulseOffset = Math.sin(pulseTick * 0.12) * 1.5;
          ctx.beginPath();
          ctx.arc(node.x, node.y, effectiveRadius + 3.0 + pulseOffset, 0, Math.PI * 2);
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 2.0;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(node.x, node.y, effectiveRadius + 5.5 + pulseOffset, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Shield alert dot
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.arc(node.x + effectiveRadius * 0.7, node.y - effectiveRadius * 0.7, 4.0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Main Node Body with Soft Radial Gradient
      const nodeGrad = ctx.createRadialGradient(
        node.x - effectiveRadius * 0.3,
        node.y - effectiveRadius * 0.3,
        effectiveRadius * 0.1,
        node.x,
        node.y,
        effectiveRadius
      );
      nodeGrad.addColorStop(0, lighten(nodeColor, 25));
      nodeGrad.addColorStop(1, nodeColor);

      ctx.beginPath();
      ctx.arc(node.x, node.y, effectiveRadius, 0, Math.PI * 2);
      ctx.fillStyle = nodeGrad;
      ctx.fill();

      // Subtle border ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // 5. Confidence Ring (Phase 6: Multi-tier Confidence Arc & Visual Calibration)
      if (!isZoomedOut && node.emotionConfidence > 0) {
        const conf = node.emotionConfidence;
        let ringLineWidth = 1.2;
        let ringAlpha = 0.55;

        if (conf >= 0.61) {
          // High confidence: prominent, crisp ring
          ringLineWidth = isCloseZoom ? 2.4 : 1.8;
          ringAlpha = 0.85;
        } else if (conf >= 0.31) {
          // Medium confidence: standard ring
          ringLineWidth = isCloseZoom ? 1.5 : 1.2;
          ringAlpha = 0.55;
        } else {
          // Low confidence: faint, thin ring
          ringLineWidth = 0.8;
          ringAlpha = 0.30;
        }

        ctx.beginPath();
        const confAngle = conf * Math.PI * 2;
        ctx.arc(node.x, node.y, effectiveRadius + 2.5, -Math.PI / 2, -Math.PI / 2 + confAngle);
        ctx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha})`;
        ctx.lineWidth = ringLineWidth;
        ctx.stroke();
      }

      // 6. Label Rendering depending on LOD
      // - Zoomed Out: NO labels (prevent clutter)
      // - Mid Zoom: Only Influencers, Bridges, Patient Zero, and Hovered/Selected
      // - Close Zoom: All visible nodes
      const shouldDrawLabel =
        !isZoomedOut &&
        (isCloseZoom || node.isInfluencer || node.isBridge || node.isPatientZero || isSelected || isHovered);

      if (shouldDrawLabel) {
        ctx.font = isSelected || isHovered
          ? 'bold 11px ui-sans-serif, system-ui, -apple-system, sans-serif'
          : '10px ui-sans-serif, system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const labelText = node.label.length > 20 && !isCloseZoom ? node.label.slice(0, 18) + '…' : node.label;
        const textWidth = ctx.measureText(labelText).width;
        const pillX = node.x - textWidth / 2 - 4;
        const pillY = node.y + effectiveRadius + 4;

        // Label pill background for crisp readability
        ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, textWidth + 8, 14, 3);
        ctx.fill();

        ctx.fillStyle = isSelected || isHovered ? '#FFFFFF' : '#D4D4D8';
        ctx.fillText(labelText, node.x, pillY + 1.5);
      }

      ctx.restore();
    }

    ctx.restore();
  }
}

function hexToRgb(hex: string): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
  const num = parseInt(c, 16);
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

function lighten(hex: string, percent: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
  const num = parseInt(c, 16);
  let r = Math.min(255, Math.floor(((num >> 16) & 255) * (1 + percent / 100)));
  let g = Math.min(255, Math.floor(((num >> 8) & 255) * (1 + percent / 100)));
  let b = Math.min(255, Math.floor((num & 255) * (1 + percent / 100)));
  return `rgb(${r}, ${g}, ${b})`;
}
