/**
 * Social Gravity — Intelligent Camera System (Stage 1 & Stage 2)
 * Figma / Palantir-grade infinite canvas camera with spring interpolation,
 * cursor-centered zooming, trackpad pinch, and smooth 300ms fly-to animation.
 */

import { ViewportBounds } from './types';

export interface CameraOptions {
  minZoom?: number;
  maxZoom?: number;
  springFactor?: number; // lerp rate per frame [0.1 - 0.3]
}

export class IntelligentCamera {
  public x: number = 0;
  public y: number = 0;
  public scale: number = 1.0;

  public targetX: number = 0;
  public targetY: number = 0;
  public targetScale: number = 1.0;

  public readonly minZoom: number;
  public readonly maxZoom: number;
  public readonly springFactor: number;

  // Animation lock for programmatic fly-to
  private isFlying: boolean = false;
  private flyStartTime: number = 0;
  private flyDuration: number = 300; // 300ms as per specification
  private flyStartX: number = 0;
  private flyStartY: number = 0;
  private flyStartScale: number = 1.0;
  private flyTargetX: number = 0;
  private flyTargetY: number = 0;
  private flyTargetScale: number = 1.0;

  constructor(options: CameraOptions = {}) {
    this.minZoom = options.minZoom ?? 0.15;
    this.maxZoom = options.maxZoom ?? 8.0;
    this.springFactor = options.springFactor ?? 0.18;
  }

  public setScale(newScale: number): void {
    const clamped = Math.max(this.minZoom, Math.min(this.maxZoom, newScale));
    this.scale = clamped;
    this.targetScale = clamped;
  }

  public setPosition(newX: number, newY: number, newScale?: number): void {
    this.x = newX;
    this.targetX = newX;
    this.y = newY;
    this.targetY = newY;
    if (newScale !== undefined) {
      this.setScale(newScale);
    }
  }

  /**
   * Update camera physics on each animation frame.
   * Uses exponential spring dampening for butter-smooth zero-jitter motion.
   */
  public update(deltaTimeMs: number = 16.6): boolean {
    const now = performance.now();

    if (this.isFlying) {
      const elapsed = now - this.flyStartTime;
      const progress = Math.min(1.0, elapsed / this.flyDuration);
      // Cubic ease-out curve for smooth arrival
      const ease = 1 - Math.pow(1 - progress, 3);

      this.x = this.flyStartX + (this.flyTargetX - this.flyStartX) * ease;
      this.y = this.flyStartY + (this.flyTargetY - this.flyStartY) * ease;
      this.scale = this.flyStartScale + (this.flyTargetScale - this.flyStartScale) * ease;

      this.targetX = this.x;
      this.targetY = this.y;
      this.targetScale = this.scale;

      if (progress >= 1.0) {
        this.isFlying = false;
        return true;
      }
      return true;
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const ds = this.targetScale - this.scale;

    const isMoving = Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05 || Math.abs(ds) > 0.0005;

    if (isMoving) {
      // Scale-adaptive dampening for high-precision motion
      const factor = Math.min(1.0, this.springFactor * (deltaTimeMs / 16.6));
      this.x += dx * factor;
      this.y += dy * factor;
      this.scale += ds * factor;
    } else {
      this.x = this.targetX;
      this.y = this.targetY;
      this.scale = this.targetScale;
    }

    return isMoving;
  }

  /**
   * Translates camera instantly or sets target pan.
   */
  public panBy(deltaScreenX: number, deltaScreenY: number): void {
    if (this.isFlying) this.isFlying = false;
    this.targetX += deltaScreenX;
    this.targetY += deltaScreenY;
    this.x += deltaScreenX;
    this.y += deltaScreenY;
  }

  /**
   * Zooms smoothly centered around screen coordinates (e.g. mouse cursor).
   */
  public zoomAt(screenX: number, screenY: number, factor: number): void {
    if (this.isFlying) this.isFlying = false;

    const currentScale = this.targetScale;
    const nextScale = Math.max(this.minZoom, Math.min(this.maxZoom, currentScale * factor));
    if (Math.abs(nextScale - currentScale) < 0.0001) return;

    // World coordinate under cursor before zoom
    const worldX = (screenX - this.targetX) / currentScale;
    const worldY = (screenY - this.targetY) / currentScale;

    // Re-anchor target pan so cursor remains at same world point
    this.targetX = screenX - worldX * nextScale;
    this.targetY = screenY - worldY * nextScale;
    this.targetScale = nextScale;
  }

  /**
   * Zooms relative to canvas center by a delta factor.
   */
  public zoomStep(canvasWidth: number, canvasHeight: number, factor: number): void {
    this.zoomAt(canvasWidth / 2, canvasHeight / 2, factor);
  }

  /**
   * Double-click zoom into a specific screen point.
   */
  public doubleClickZoom(screenX: number, screenY: number): void {
    const factor = this.targetScale >= 2.0 ? 0.5 : 1.75;
    this.zoomAt(screenX, screenY, factor);
  }

  /**
   * Automatically fits and centers the graph so it occupies 70% to 80% of workspace.
   * Prevents any node stretching or edge clipping.
   */
  public fitToBounds(
    bounds: ViewportBounds,
    canvasWidth: number,
    canvasHeight: number,
    occupancyRatio: number = 0.75
  ): void {
    if (canvasWidth <= 0 || canvasHeight <= 0) return;

    const graphWidth = Math.max(100, bounds.maxX - bounds.minX);
    const graphHeight = Math.max(100, bounds.maxY - bounds.minY);
    const graphCenterX = (bounds.minX + bounds.maxX) / 2;
    const graphCenterY = (bounds.minY + bounds.maxY) / 2;

    const scaleX = (canvasWidth * occupancyRatio) / graphWidth;
    const scaleY = (canvasHeight * occupancyRatio) / graphHeight;
    const idealScale = Math.max(this.minZoom, Math.min(2.5, Math.min(scaleX, scaleY)));

    const nextTargetX = canvasWidth / 2 - graphCenterX * idealScale;
    const nextTargetY = canvasHeight / 2 - graphCenterY * idealScale;

    this.flyToTarget(nextTargetX, nextTargetY, idealScale, 400);
  }

  /**
   * Reset view to 1.0x centered in canvas.
   */
  public resetView(canvasWidth: number, canvasHeight: number, centerX: number = 0, centerY: number = 0): void {
    const targetX = canvasWidth / 2 - centerX;
    const targetY = canvasHeight / 2 - centerY;
    this.flyToTarget(targetX, targetY, 1.0, 300);
  }

  /**
   * Smoothly fly camera to center on a world point (e.g. searched node).
   */
  public flyToNode(
    worldX: number,
    worldY: number,
    canvasWidth: number,
    canvasHeight: number,
    zoom: number = 1.85,
    durationMs: number = 300
  ): void {
    const clampedZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    const targetX = canvasWidth / 2 - worldX * clampedZoom;
    const targetY = canvasHeight / 2 - worldY * clampedZoom;

    this.flyToTarget(targetX, targetY, clampedZoom, durationMs);
  }

  private flyToTarget(targetX: number, targetY: number, targetScale: number, durationMs: number): void {
    this.isFlying = true;
    this.flyStartTime = performance.now();
    this.flyDuration = durationMs;
    this.flyStartX = this.x;
    this.flyStartY = this.y;
    this.flyStartScale = this.scale;
    this.flyTargetX = targetX;
    this.flyTargetY = targetY;
    this.flyTargetScale = targetScale;
  }

  /**
   * Convert screen (pixel) coordinates to world coordinates.
   */
  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.x) / this.scale,
      y: (screenY - this.y) / this.scale,
    };
  }

  /**
   * Convert world coordinates to screen (pixel) coordinates.
   */
  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX * this.scale + this.x,
      y: worldY * this.scale + this.y,
    };
  }

  /**
   * Computes visible bounding box in world space for viewport culling.
   */
  public getVisibleBounds(canvasWidth: number, canvasHeight: number, margin: number = 80): ViewportBounds {
    const min = this.screenToWorld(-margin, -margin);
    const max = this.screenToWorld(canvasWidth + margin, canvasHeight + margin);

    return {
      minX: Math.min(min.x, max.x),
      minY: Math.min(min.y, max.y),
      maxX: Math.max(min.x, max.x),
      maxY: Math.max(min.y, max.y),
    };
  }

  /**
   * Apply 2D transform to CanvasRenderingContext2D.
   */
  public applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(this.scale, 0, 0, this.scale, this.x, this.y);
  }
}
