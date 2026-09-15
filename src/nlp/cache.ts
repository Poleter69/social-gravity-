/**
 * Social Gravity - High-Performance LRU Emotion Inference Cache
 * Caches multidimensional EmotionProfile objects for O(1) repeated retrieval.
 */

import { EmotionProfile } from './types';

export class EmotionCache {
  private cache: Map<string, EmotionProfile>;
  private readonly capacity: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(capacity: number = 5000) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  /**
   * Generates a deterministic normalized key from text for caching.
   */
  public static hashText(text: string): string {
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  public get(text: string): EmotionProfile | undefined {
    const key = EmotionCache.hashText(text);
    const item = this.cache.get(key);
    if (item) {
      this.hits++;
      // Refresh item in LRU order
      this.cache.delete(key);
      this.cache.set(key, item);
      return item;
    }
    this.misses++;
    return undefined;
  }

  public set(text: string, profile: EmotionProfile): void {
    const key = EmotionCache.hashText(text);
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Evict oldest entry (first item in Map iterator)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, profile);
  }

  public has(text: string): boolean {
    const key = EmotionCache.hashText(text);
    return this.cache.has(key);
  }

  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  public size(): number {
    return this.cache.size;
  }

  public getCapacity(): number {
    return this.capacity;
  }

  public getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? Number((this.hits / total).toFixed(4)) : 0;
  }

  public getStats(): { hits: number; misses: number; size: number; capacity: number; hitRate: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      capacity: this.capacity,
      hitRate: this.getHitRate(),
    };
  }
}
