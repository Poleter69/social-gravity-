/**
 * Social Gravity — Community Hull Generator (Stage 14)
 * Generates organic, translucent, curved territory bubbles around communities
 * using Andrew's Monotone Chain 2D convex hull algorithm and Chaikin smoothing.
 */

import { CanvasNode, CommunityHull } from './types';

interface Point {
  x: number;
  y: number;
}

export class HullGenerator {
  /**
   * 2D Cross product of OA and OB vectors.
   * Returns positive if counter-clockwise turn, negative if clockwise, zero if collinear.
   */
  private static cross(o: Point, a: Point, b: Point): number {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  /**
   * Computes the 2D Convex Hull of a set of points using Andrew's Monotone Chain algorithm.
   * Complexity: O(N log N)
   */
  public static computeConvexHull(points: Point[]): Point[] {
    const n = points.length;
    if (n <= 1) return [...points];
    if (n === 2) return [...points];

    // Sort points lexicographically (by x, then by y)
    const sorted = [...points].sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

    // Build lower hull
    const lower: Point[] = [];
    for (let i = 0; i < n; i++) {
      while (
        lower.length >= 2 &&
        HullGenerator.cross(lower[lower.length - 2], lower[lower.length - 1], sorted[i]) <= 0
      ) {
        lower.pop();
      }
      lower.push(sorted[i]);
    }

    // Build upper hull
    const upper: Point[] = [];
    for (let i = n - 1; i >= 0; i--) {
      while (
        upper.length >= 2 &&
        HullGenerator.cross(upper[upper.length - 2], upper[upper.length - 1], sorted[i]) <= 0
      ) {
        upper.pop();
      }
      upper.push(sorted[i]);
    }

    // Remove last point of each half because it is repeated at beginning of other half
    lower.pop();
    upper.pop();

    return lower.concat(upper);
  }

  /**
   * Expands convex hull vertices outward from its centroid by an offset margin.
   */
  public static expandHull(hull: Point[], padding: number = 32): Point[] {
    if (hull.length === 0) return [];
    if (hull.length === 1) {
      const p = hull[0];
      const res: Point[] = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        res.push({ x: p.x + Math.cos(a) * padding, y: p.y + Math.sin(a) * padding });
      }
      return res;
    }

    let cx = 0;
    let cy = 0;
    hull.forEach((p) => {
      cx += p.x;
      cy += p.y;
    });
    cx /= hull.length;
    cy /= hull.length;

    return hull.map((p) => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      return {
        x: p.x + (dx / dist) * padding,
        y: p.y + (dy / dist) * padding,
      };
    });
  }

  /**
   * Chaikin's corner-cutting algorithm to turn polygonal hulls into silky smooth curves.
   */
  public static chaikinSmooth(points: Point[], iterations: number = 2): Point[] {
    if (points.length < 3) return points;

    let current = points;

    for (let it = 0; it < iterations; it++) {
      const next: Point[] = [];
      const len = current.length;

      for (let i = 0; i < len; i++) {
        const p0 = current[i];
        const p1 = current[(i + 1) % len];

        // Cut corners at 25% and 75% along the segment
        const q: Point = {
          x: 0.75 * p0.x + 0.25 * p1.x,
          y: 0.75 * p0.y + 0.25 * p1.y,
        };
        const r: Point = {
          x: 0.25 * p0.x + 0.75 * p1.x,
          y: 0.25 * p0.y + 0.75 * p1.y,
        };

        next.push(q, r);
      }
      current = next;
    }

    return current;
  }

  /**
   * Generates community hulls for all communities present in the nodes list.
   */
  public static generateAllHulls(
    nodes: CanvasNode[],
    communityCenters: Map<string, { x: number; y: number; color: string; name: string }>
  ): CommunityHull[] {
    const communityNodes = new Map<string, CanvasNode[]>();

    nodes.forEach((n) => {
      let list = communityNodes.get(n.communityId);
      if (!list) {
        list = [];
        communityNodes.set(n.communityId, list);
      }
      list.push(n);
    });

    const hulls: CommunityHull[] = [];

    communityNodes.forEach((cNodes, commId) => {
      const commInfo = communityCenters.get(commId) || {
        x: 0,
        y: 0,
        color: cNodes[0]?.communityColor || '#38BDF8',
        name: cNodes[0]?.communityName || 'Community',
      };

      if (cNodes.length === 0) return;

      const rawPoints: Point[] = cNodes.map((n) => ({ x: n.x, y: n.y }));
      const convex = HullGenerator.computeConvexHull(rawPoints);
      const expanded = HullGenerator.expandHull(convex, 28);
      const smooth = HullGenerator.chaikinSmooth(expanded, 2);

      // Centroid calculation
      let sumX = 0;
      let sumY = 0;
      let maxDistSq = 0;

      rawPoints.forEach((p) => {
        sumX += p.x;
        sumY += p.y;
      });
      const centroid = { x: sumX / rawPoints.length, y: sumY / rawPoints.length };

      rawPoints.forEach((p) => {
        const dx = p.x - centroid.x;
        const dy = p.y - centroid.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > maxDistSq) maxDistSq = distSq;
      });

      hulls.push({
        communityId: commId,
        name: commInfo.name,
        color: commInfo.color,
        centroid,
        polygon: expanded,
        smoothPoints: smooth,
        nodeCount: cNodes.length,
        radius: Math.sqrt(maxDistSq) + 32,
      });
    });

    return hulls;
  }

  /**
   * Draws smooth community hull onto the 2D canvas context.
   */
  public static renderHull(ctx: CanvasRenderingContext2D, hull: CommunityHull, isHovered: boolean = false): void {
    const pts = hull.smoothPoints;
    if (pts.length < 3) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();

    // Subtle ambient color fill
    const alpha = isHovered ? '28' : '14';
    ctx.fillStyle = `${hull.color}${alpha}`;
    ctx.fill();

    // Organic glowing boundary stroke
    ctx.strokeStyle = isHovered ? `${hull.color}77` : `${hull.color}33`;
    ctx.lineWidth = isHovered ? 2.0 : 1.2;
    ctx.setLineDash(isHovered ? [] : [6, 6]);
    ctx.stroke();

    ctx.restore();
  }
}
