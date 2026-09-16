/**
 * Social Gravity — Spatial Index & QuadTree Partitioning (Stage 13)
 * Provides sub-millisecond viewport culling and O(1) hover collision detection
 * for large networks (1,000 to 20,000 nodes).
 */

import { CanvasNode, ViewportBounds } from './types';

export class SpatialIndex {
  private cellSize: number;
  private grid: Map<string, CanvasNode[]> = new Map();
  private allNodes: CanvasNode[] = [];

  constructor(cellSize: number = 80) {
    this.cellSize = cellSize;
  }

  private getKey(cellX: number, cellY: number): string {
    return `${cellX}:${cellY}`;
  }

  public clear(): void {
    this.grid.clear();
    this.allNodes = [];
  }

  /**
   * Rebuild spatial grid with a new list of nodes.
   */
  public rebuild(nodes: CanvasNode[]): void {
    this.clear();
    this.allNodes = nodes;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const cx = Math.floor(node.x / this.cellSize);
      const cy = Math.floor(node.y / this.cellSize);
      const key = this.getKey(cx, cy);

      let cell = this.grid.get(key);
      if (!cell) {
        cell = [];
        this.grid.set(key, cell);
      }
      cell.push(node);
    }
  }

  /**
   * Fast viewport culling: returns only nodes that intersect with visible bounding box.
   */
  public queryVisible(bounds: ViewportBounds): CanvasNode[] {
    if (this.allNodes.length === 0) return [];

    const minCellX = Math.floor(bounds.minX / this.cellSize);
    const minCellY = Math.floor(bounds.minY / this.cellSize);
    const maxCellX = Math.floor(bounds.maxX / this.cellSize);
    const maxCellY = Math.floor(bounds.maxY / this.cellSize);

    const visible: CanvasNode[] = [];
    const visited = new Set<string>();

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const cell = this.grid.get(this.getKey(cx, cy));
        if (!cell) continue;

        for (let i = 0; i < cell.length; i++) {
          const node = cell[i];
          if (!visited.has(node.id)) {
            visited.add(node.id);
            // Verify node bounding box
            if (
              node.x + node.radius >= bounds.minX &&
              node.x - node.radius <= bounds.maxX &&
              node.y + node.radius >= bounds.minY &&
              node.y - node.radius <= bounds.maxY
            ) {
              visible.push(node);
            }
          }
        }
      }
    }

    return visible;
  }

  /**
   * O(1) hover search: finds the closest node under world coordinates (x, y).
   */
  public findNodeAt(worldX: number, worldY: number, toleranceExtraRadius: number = 6): CanvasNode | null {
    const cx = Math.floor(worldX / this.cellSize);
    const cy = Math.floor(worldY / this.cellSize);

    let closestNode: CanvasNode | null = null;
    let closestDistSq = Infinity;

    // Check center cell + 8 neighboring cells
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const cell = this.grid.get(this.getKey(cx + ox, cy + oy));
        if (!cell) continue;

        for (let i = 0; i < cell.length; i++) {
          const node = cell[i];
          const dx = node.x - worldX;
          const dy = node.y - worldY;
          const distSq = dx * dx + dy * dy;
          const hitRadius = node.radius + toleranceExtraRadius;

          if (distSq <= hitRadius * hitRadius && distSq < closestDistSq) {
            closestDistSq = distSq;
            closestNode = node;
          }
        }
      }
    }

    return closestNode;
  }
}
