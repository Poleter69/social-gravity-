/**
 * Social Gravity — M22: usePlayback hook
 * 
 * Bridges PlaybackController (imperative state machine) → React state.
 * The round counter ALWAYS comes from engine.getState().currentRound,
 * never from a separate UI counter. This is the single source of truth.
 * 
 * Usage:
 *   const pb = usePlayback({ baseIntervalMs: 600, maxRounds: 40 });
 *   pb.startNewSimulation(society, hoax, seedIds);
 *   pb.play();
 *   <RoundDisplay round={pb.currentRound} />
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { RumorEngine } from '../simulation/rumorEngine';
import { SimulationState } from '../simulation/types';
import { PlaybackController, PlaybackState, PlaybackSpeed, PlaybackConfig } from '../simulation/playbackController';
import { InformationSignal } from '../psychology/types';
import { Society } from '../society/types/society';
import { WikipediaHoaxRecord } from '../datasets/types';
import { WikipediaHoaxAdapter } from '../datasets/adapters/wikipediaHoaxAdapter';
import { LoadedDatasetResult } from '../datasets/realDatasetService';
import { TickEngine } from '../graph/engine/tickEngine';

export interface UsePlaybackOptions extends Partial<PlaybackConfig> {
  onTransmission?: (sourceId: string, targetId: string) => void;
  onRoundStep?: (round: number) => void;
}

export interface UsePlaybackReturn {
  // State
  simState: SimulationState | null;
  playbackState: PlaybackState;
  currentRound: number;
  maxRecordedRound: number;
  speed: PlaybackSpeed;
  isPlaying: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  isIdle: boolean;
  // Diagnostics
  lastTickMs: number;
  isLoopActive: boolean;
  // Actions
  startNewSimulation: (
    society: Society,
    hoax: WikipediaHoaxRecord,
    seedStrategy: 'influencer' | 'bridge' | 'selected',
    loadedData?: LoadedDatasetResult | null,
    liveDynamicDecay?: boolean
  ) => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  step: () => void;
  restart: () => void;
  reset: () => void;
  scrubToRound: (round: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  // Engine access (for counterfactuals, debunking, etc.)
  engine: RumorEngine | null;
}

export function usePlayback(options: UsePlaybackOptions = {}): UsePlaybackReturn {
  const controllerRef = useRef<PlaybackController>(
    new PlaybackController({
      baseIntervalMs: options.baseIntervalMs ?? 600,
      maxRounds: options.maxRounds ?? 40,
    })
  );
  const engineRef = useRef<RumorEngine | null>(null);

  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [currentRound, setCurrentRound] = useState(0);
  const [maxRecordedRound, setMaxRecordedRound] = useState(0);
  const [speed, setSpeedState] = useState<PlaybackSpeed>(1);
  const [lastTickMs, setLastTickMs] = useState(0);
  const [isLoopActive, setIsLoopActive] = useState(false);

  // Subscribe to PlaybackController updates
  useEffect(() => {
    const controller = controllerRef.current;
    const unsubscribe = controller.subscribe((newSimState, status) => {
      // Round counter always sourced from engine — never a separate UI counter
      setSimState({ ...newSimState });
      setPlaybackState(status.state);
      setCurrentRound(status.currentRound);       // from engine.getState().currentRound
      setMaxRecordedRound(status.maxRecordedRound);
      setSpeedState(status.speed);
      setLastTickMs(status.lastTickMs);
      setIsLoopActive(status.isLoopActive);
    });

    return () => {
      unsubscribe();
      controller.destroy();
    };
  }, []);

  // Update controller config when options change
  useEffect(() => {
    controllerRef.current.setSpeed(speed); // re-apply speed if config changes
  }, [options.baseIntervalMs, speed]);

  // ─── startNewSimulation ──────────────────────────────────────────────────────
  const startNewSimulation = useCallback((
    society: Society,
    hoax: WikipediaHoaxRecord,
    seedStrategy: 'influencer' | 'bridge' | 'selected',
    loadedData?: LoadedDatasetResult | null,
    liveDynamicDecay = true
  ) => {
    const controller = controllerRef.current;

    // Build seed IDs
    let seedIds: string[] = [];
    if (seedStrategy === 'bridge') {
      const bridge = society.agents.find(a => a.isBridge);
      seedIds = [bridge ? bridge.id : society.agents[0].id];
    } else {
      const influencer = [...society.agents].sort((a, b) => b.traits.influence - a.traits.influence)[0];
      seedIds = [influencer ? influencer.id : society.agents[0].id];
    }

    const rumorSignal: InformationSignal = WikipediaHoaxAdapter.toSignal(hoax, seedIds[0], 0);

    // Create and initialize engine
    const newEngine = new RumorEngine(society, {
      maxRounds: options.maxRounds ?? 40,
      transmissionDelayMin: 1,
      transmissionDelayMax: 2,
      stochasticTransmission: true,
      enableHomeostasis: true,
    });

    // Wire side-effect callbacks (dynamic graph, tick engine)
    newEngine.onTransmission = (sourceId, targetId) => {
      options.onTransmission?.(sourceId, targetId);
      if (loadedData?.dynamicGraph) {
        try { loadedData.dynamicGraph.recordInteraction(sourceId, targetId); } catch { }
      }
    };

    newEngine.onRoundStep = (round: number) => {
      options.onRoundStep?.(round);
      if (loadedData?.dynamicGraph && liveDynamicDecay) {
        try {
          const tickEngine = new TickEngine(loadedData.dynamicGraph);
          tickEngine.tick();
        } catch { }
      }
    };

    const initial = newEngine.start(rumorSignal, seedIds);
    engineRef.current = newEngine;

    // Bind to controller (resets any previous loop cleanly)
    controller.bindEngine(newEngine);

    // Push initial state to React
    setSimState({ ...initial });
    setPlaybackState('idle');
    setCurrentRound(0);
    setMaxRecordedRound(0);
    setIsLoopActive(false);
  }, [options]);

  // ─── Actions ─────────────────────────────────────────────────────────────────

  const play = useCallback(() => {
    const controller = controllerRef.current;
    const eng = engineRef.current;

    if (!eng) return;

    const state = eng.getState();
    if (state.status === 'idle' || state.status === 'completed') {
      // Engine is exhausted — controller can't help, caller needs a new engine
      return;
    }

    controller.play();
  }, []);

  const pause = useCallback(() => {
    controllerRef.current.pause();
  }, []);

  const resume = useCallback(() => {
    controllerRef.current.resume();
  }, []);

  const togglePlay = useCallback(() => {
    const ctrl = controllerRef.current;
    const eng = engineRef.current;

    if (!eng) return;

    const sim = eng.getState();

    if (sim.status === 'idle' || sim.status === 'completed') {
      // Notify caller they need to start a new sim
      return;
    }

    ctrl.toggle();
  }, []);

  const step = useCallback(() => {
    const next = controllerRef.current.step();
    if (next) setSimState({ ...next });
  }, []);

  const restart = useCallback(() => {
    const next = controllerRef.current.restart();
    if (next) setSimState({ ...next });
  }, []);

  const reset = useCallback(() => {
    controllerRef.current.reset();
    engineRef.current = null;
    setSimState(null);
    setPlaybackState('idle');
    setCurrentRound(0);
    setMaxRecordedRound(0);
    setIsLoopActive(false);
  }, []);

  const scrubToRound = useCallback((round: number) => {
    const next = controllerRef.current.scrubToRound(round);
    if (next) setSimState({ ...next });
  }, []);

  const setSpeed = useCallback((s: PlaybackSpeed) => {
    controllerRef.current.setSpeed(s);
    setSpeedState(s);
  }, []);

  return {
    simState,
    playbackState,
    currentRound,
    maxRecordedRound,
    speed,
    isPlaying: playbackState === 'playing',
    isPaused: playbackState === 'paused',
    isCompleted: playbackState === 'completed',
    isIdle: playbackState === 'idle',
    lastTickMs,
    isLoopActive,
    startNewSimulation,
    play,
    pause,
    resume,
    togglePlay,
    step,
    restart,
    reset,
    scrubToRound,
    setSpeed,
    engine: engineRef.current,
  };
}
