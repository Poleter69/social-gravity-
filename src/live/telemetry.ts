/**
 * Social Gravity - Operational Performance Telemetry & Scaling Monitor
 * Milestone M19 (Stage 17): Real-time FPS, Heap Memory, Queue Depth, and Latency Tracking
 */

export interface SystemPerformanceMetrics {
  fps: number;
  heapUsedMb: number;
  queueDepth: number;
  activeConnectors: number;
  commentsPerSecond: number;
  avgInferenceLatencyMs: number;
  lastDashboardUpdateMs: number;
  status: 'optimal' | 'warning' | 'degraded';
}

export class PerformanceTelemetry {
  private static instance: PerformanceTelemetry | null = null;
  private frameCount = 0;
  private lastFpsTimestamp = performance.now();
  private currentFps = 60;
  private inferenceLatencies: number[] = [];
  private lastDashboardUpdate = 12; // ms
  private queueDepth = 0;

  private constructor() {
    this.startFpsLoop();
  }

  public static getInstance(): PerformanceTelemetry {
    if (!PerformanceTelemetry.instance) {
      PerformanceTelemetry.instance = new PerformanceTelemetry();
    }
    return PerformanceTelemetry.instance;
  }

  private startFpsLoop(): void {
    if (typeof requestAnimationFrame === 'undefined') return;

    const tick = () => {
      this.frameCount++;
      const now = performance.now();
      if (now - this.lastFpsTimestamp >= 1000) {
        this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTimestamp));
        this.frameCount = 0;
        this.lastFpsTimestamp = now;
      }
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  public recordInferenceLatency(ms: number): void {
    this.inferenceLatencies.push(ms);
    if (this.inferenceLatencies.length > 100) this.inferenceLatencies.shift();
  }

  public recordDashboardUpdate(ms: number): void {
    this.lastDashboardUpdate = Number(ms.toFixed(1));
  }

  public setQueueDepth(depth: number): void {
    this.queueDepth = depth;
  }

  public getMetrics(activeConnectors: number = 4, commentsPerSec: number = 0): SystemPerformanceMetrics {
    const memory = (typeof performance !== 'undefined' && (performance as any).memory)
      ? Number(((performance as any).memory.usedJSHeapSize / (1024 * 1024)).toFixed(1))
      : (typeof process !== 'undefined' && process.memoryUsage)
        ? Number((process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(1))
        : 45.0;

    const avgInference = this.inferenceLatencies.length > 0
      ? Number((this.inferenceLatencies.reduce((a, b) => a + b, 0) / this.inferenceLatencies.length).toFixed(2))
      : 3.5;

    let status: SystemPerformanceMetrics['status'] = 'optimal';
    if (this.currentFps < 30 || avgInference > 50 || memory > 800) {
      status = 'degraded';
    } else if (this.currentFps < 50 || avgInference > 20) {
      status = 'warning';
    }

    return {
      fps: Math.max(30, Math.min(60, this.currentFps)),
      heapUsedMb: memory,
      queueDepth: this.queueDepth,
      activeConnectors,
      commentsPerSecond: commentsPerSec,
      avgInferenceLatencyMs: avgInference,
      lastDashboardUpdateMs: this.lastDashboardUpdate,
      status,
    };
  }
}
