/**
 * Social Gravity — M22: Playback Controller
 * Deterministic state machine for simulation playback.
 * 
 * The ONLY authority for starting/stopping simulation loops.
 * Replaces scattered boolean flags in App.tsx with explicit states.
 * 
 * State transitions:
 *   idle      → play()   → playing
 *   playing   → pause()  → paused
 *   paused    → resume() → playing
 *   playing   → step()   → paused (single step)
 *   any       → reset()  → idle
 *   playing   → [engine completed] → completed
 *   completed → play()   → playing (restarts)
 */

import { RumorEngine } from '../simulation/rumorEngine';
import { SimulationState } from '../simulation/types';

// ─── State Machine Types ──────────────────────────────────────────────────────

export type PlaybackState =
  | 'idle'
  | 'playing'
  | 'paused'
  | 'replaying'
  | 'completed';

export type PlaybackSpeed = 0.5 | 1 | 2 | 4 | 8;

export interface PlaybackConfig {
  baseIntervalMs: number;  // ms per round at 1× speed (default 600)
  maxRounds: number;
}

export interface PlaybackStatus {
  state: PlaybackState;
  currentRound: number;
  engineRound: number;
  uiRound: number;
  maxRecordedRound: number;
  totalFrames: number;
  currentFrameIndex: number;
  speed: PlaybackSpeed;
  isLoopActive: boolean;
  lastTickMs: number;
  fps: number;
}

export type PlaybackListener = (simState: SimulationState, status: PlaybackStatus) => void;

// ─── PlaybackController ───────────────────────────────────────────────────────

export class PlaybackController {
  private engine: RumorEngine | null = null;
  private config: PlaybackConfig;
  private pbState: PlaybackState = 'idle';
  private speed: PlaybackSpeed = 1;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private listeners: PlaybackListener[] = [];
  private lastTickMs = 0;
  private tickCount = 0;
  private startMs = 0;

  constructor(config?: Partial<PlaybackConfig>) {
    this.config = {
      baseIntervalMs: config?.baseIntervalMs ?? 600,
      maxRounds: config?.maxRounds ?? 40,
    };
  }

  // ─── Engine Binding ─────────────────────────────────────────────────────────

  /** Bind a freshly-started RumorEngine. Must be called before play(). */
  public bindEngine(engine: RumorEngine): void {
    this.stopLoop();
    this.engine = engine;
    this.pbState = 'idle';
    if (engine.config?.maxRounds) {
      this.config.maxRounds = engine.config.maxRounds;
    }
  }

  /** Detach engine and return to idle. */
  public unbindEngine(): void {
    this.stopLoop();
    this.engine = null;
    this.pbState = 'idle';
  }

  // ─── State Machine Actions ──────────────────────────────────────────────────

  /** Start continuous playback. Works from idle, paused, or completed. */
  public play(): void {
    if (!this.engine) return;

    const simState = this.engine.getState();
    const targetMax = this.engine.config?.maxRounds ?? this.config.maxRounds;

    // If playback reached the end, automatically rewind to Round 0 to replay
    if (simState.currentRound >= targetMax) {
      if (this.engine.hasSnapshot(0)) {
        this.engine.goToRound(0);
      }
    }

    if (this.pbState === 'playing') return; // already playing

    this.pbState = 'playing';
    this.startLoop();
    this.emit();
  }

  /** Pause active playback — preserves exact round. */
  public pause(): void {
    if (this.pbState !== 'playing' && this.pbState !== 'replaying') return;
    this.pbState = 'paused';
    this.stopLoop();
    this.emit();
  }

  /** Resume from paused — continues from exact same round, not round 1. */
  public resume(): void {
    if (this.pbState !== 'paused') return;
    this.play();
  }

  /** Toggle between play and pause. Safe to call from any state. */
  public toggle(): void {
    switch (this.pbState) {
      case 'idle':
      case 'completed':
        this.play();
        break;
      case 'playing':
      case 'replaying':
        this.pause();
        break;
      case 'paused':
        this.resume();
        break;
    }
  }

  /** Step exactly one round then pause. Advances live or through replay. */
  public step(): SimulationState | null {
    if (!this.engine) return null;
    const current = this.engine.getState().currentRound;
    const maxRecorded = this.engine.getMaxRecordedRound();
    const targetMax = this.engine.config?.maxRounds ?? this.config.maxRounds;

    if (current >= targetMax) {
      this.pbState = 'completed';
      return this.engine.getState();
    }

    this.stopLoop();
    this.pbState = 'paused';

    let next: SimulationState;
    if (current < maxRecorded) {
      next = this.engine.goToRound(current + 1);
    } else {
      next = this.engine.step();
    }

    if (next.currentRound >= targetMax || next.status === 'completed') {
      this.pbState = 'completed';
    }
    this.emit();
    return next;
  }

  /** Restart to Round 0 and pause. */
  public restart(): SimulationState | null {
    if (!this.engine) return null;
    this.stopLoop();
    this.pbState = 'paused';
    if (this.engine.hasSnapshot(0)) {
      const next = this.engine.goToRound(0);
      this.emit();
      return next;
    }
    return null;
  }

  /** Reset to idle — unbinds engine, caller must create a new one. */
  public reset(): void {
    this.stopLoop();
    this.engine = null;
    this.pbState = 'idle';
    this.tickCount = 0;
    this.lastTickMs = 0;
  }

  /** Scrub to a specific round via engine snapshot. Returns new state or null. */
  public scrubToRound(round: number): SimulationState | null {
    if (!this.engine) return null;
    const wasPlaying = this.pbState === 'playing';
    if (wasPlaying) {
      this.stopLoop();
    } else {
      this.pbState = 'paused';
    }

    try {
      if (this.engine.hasSnapshot(round)) {
        const next = this.engine.goToRound(round);
        if (wasPlaying) {
          if (next.currentRound >= this.config.maxRounds) {
            this.pbState = 'completed';
          } else {
            this.pbState = 'playing';
            this.startLoop();
          }
        }
        this.emit();
        return next;
      }
    } catch (e) {
      console.error('[PlaybackController] scrubToRound failed:', e);
    }

    return null;
  }

  // ─── Speed Control ──────────────────────────────────────────────────────────

  /** Change playback speed. Does not skip rounds. Active loop restarts at new speed. */
  public setSpeed(speed: PlaybackSpeed): void {
    this.speed = speed;
    if (this.pbState === 'playing') {
      // Restart loop at new interval without changing round or state
      this.stopLoop();
      this.startLoop();
    }
    this.emit();
  }

  public getSpeed(): PlaybackSpeed { return this.speed; }

  // ─── Status Queries ─────────────────────────────────────────────────────────

  public getState(): PlaybackState { return this.pbState; }
  public isPlaying(): boolean { return this.pbState === 'playing'; }
  public isPaused(): boolean { return this.pbState === 'paused'; }
  public isIdle(): boolean { return this.pbState === 'idle'; }
  public isCompleted(): boolean { return this.pbState === 'completed'; }

  public getStatus(): PlaybackStatus {
    const simState = this.engine?.getState();
    const current = simState?.currentRound ?? 0;
    const maxRec = this.engine?.getMaxRecordedRound?.() ?? 0;
    const elapsed = this.tickCount > 0 && this.startMs > 0
      ? (Date.now() - this.startMs) / 1000
      : 1;
    return {
      state: this.pbState,
      currentRound: current,
      engineRound: current,
      uiRound: current,
      maxRecordedRound: maxRec,
      totalFrames: Math.max(maxRec + 1, 1),
      currentFrameIndex: current,
      speed: this.speed,
      isLoopActive: this.intervalHandle !== null,
      lastTickMs: this.lastTickMs,
      fps: this.tickCount > 0 ? Math.round(this.tickCount / elapsed) : 0,
    };
  }

  // ─── Listener System ────────────────────────────────────────────────────────

  public subscribe(listener: PlaybackListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit(): void {
    if (!this.engine) return;
    const simState = this.engine.getState();
    const status = this.getStatus();
    this.listeners.forEach(fn => {
      try { fn(simState, status); } catch { /* listener error isolation */ }
    });
  }

  // ─── Internal Loop ──────────────────────────────────────────────────────────

  private get intervalMs(): number {
    return Math.round(this.config.baseIntervalMs / this.speed);
  }

  private startLoop(): void {
    this.stopLoop(); // Always clear first to prevent double-loops
    this.tickCount = 0;
    this.startMs = Date.now();

    this.intervalHandle = setInterval(() => {
      this.doTick();
    }, this.intervalMs);
  }

  private stopLoop(): void {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  private doTick(): void {
    if (!this.engine || this.pbState !== 'playing') {
      this.stopLoop();
      return;
    }

    const tickStart = Date.now();
    const current = this.engine.getState().currentRound;
    const maxRecorded = this.engine.getMaxRecordedRound();
    const targetMax = this.engine.config?.maxRounds ?? this.config.maxRounds;

    let next: SimulationState;

    if (current < maxRecorded) {
      // Replaying historical snapshot frame
      next = this.engine.goToRound(current + 1);
    } else if (current < targetMax) {
      // Live stepping forward to produce next round
      next = this.engine.step();
    } else {
      this.pbState = 'completed';
      this.stopLoop();
      this.emit();
      return;
    }

    this.lastTickMs = Date.now() - tickStart;
    this.tickCount++;

    if (next.currentRound >= targetMax || next.status === 'completed') {
      this.pbState = 'completed';
      this.stopLoop();
    }

    this.emit();
  }

  // ─── Cleanup ────────────────────────────────────────────────────────────────

  public destroy(): void {
    this.stopLoop();
    this.listeners = [];
    this.engine = null;
  }
}
