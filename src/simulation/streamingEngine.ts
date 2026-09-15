/**
 * Social Gravity - Streaming Simulation Engine
 * Upgrades discrete-round simulation to continuous streaming execution.
 * Ingests live nodes/edges dynamically while maintaining deterministic replay guarantees.
 */

import { Society } from '../society/types/society';
import { Agent, AgentTraits, AgentState, AgentMetrics } from '../society/types/agent';
import { InformationSignal, PsychologicalState } from '../psychology/types';
import { createInitialPsychologicalState } from '../psychology/defaults';
import { BehavioralDecisionEngine } from '../psychology/decisionEngine';
import { RoundTelemetry } from './types';
import { RumorEngine } from './rumorEngine';
import { LiveGraphUpdate } from '../live/liveManager';

export interface StreamingConfig {
  tickIntervalMs: number; // e.g., 1000ms
  autoPropagate: boolean;
  maxStreamHistory: number;
}

export interface StreamingTelemetry {
  currentTick: number;
  activeNodes: number;
  activeEdges: number;
  liveInfections: number;
  instantaneousR0: number;
  emotionalDrift: {
    averageValence: number;
    averageArousal: number;
    dominantEmotion: string;
  };
}

export class StreamingSimulationEngine {
  private society: Society;
  private rumorEngine: RumorEngine;
  private config: StreamingConfig;
  private isStreaming = false;
  private streamTimer: ReturnType<typeof setInterval> | null = null;
  private currentTick = 0;
  private liveQueue: LiveGraphUpdate[] = [];
  private telemetryHistory: StreamingTelemetry[] = [];
  private listeners: Array<(telemetry: StreamingTelemetry) => void> = [];

  constructor(
    society: Society,
    rumorEngine: RumorEngine,
    config?: Partial<StreamingConfig>
  ) {
    this.society = society;
    this.rumorEngine = rumorEngine;
    this.config = {
      tickIntervalMs: config?.tickIntervalMs ?? 1000,
      autoPropagate: config?.autoPropagate ?? true,
      maxStreamHistory: config?.maxStreamHistory ?? 500,
    };
  }

  /**
   * Enqueue an incoming post / node update from live feeds (Reddit, Bluesky, RSS, Local)
   */
  public enqueueUpdate(update: LiveGraphUpdate): void {
    this.liveQueue.push(update);
  }

  /**
   * Start the continuous streaming simulation loop
   */
  public startStream(): void {
    if (this.isStreaming) return;
    this.isStreaming = true;
    this.streamTimer = setInterval(() => this.tick(), this.config.tickIntervalMs);
  }

  /**
   * Pause streaming
   */
  public pauseStream(): void {
    this.isStreaming = false;
    if (this.streamTimer) {
      clearInterval(this.streamTimer);
      this.streamTimer = null;
    }
  }

  public onTelemetry(listener: (telemetry: StreamingTelemetry) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Execute 1 continuous streaming tick:
   * 1. Drain pending live updates & dynamically create nodes/edges
   * 2. Advance rumors & evaluate psychological decisions on new connections
   * 3. Compute continuous R0 & emotional drift
   */
  public tick(): StreamingTelemetry {
    this.currentTick++;

    // 1. Process incoming live updates
    const batch = this.liveQueue.splice(0, 20); // ingest up to 20 nodes per tick
    for (const update of batch) {
      this.integrateLiveNode(update);
    }

    // 2. Step rumor engine if autoPropagate is true and active signal exists
    const simState = this.rumorEngine.getState();
    if (this.config.autoPropagate && simState.status === 'running') {
      this.rumorEngine.step();
    }

    // 3. Compute streaming telemetry
    const telemetry = this.computeStreamingTelemetry();
    this.telemetryHistory.push(telemetry);
    if (this.telemetryHistory.length > this.config.maxStreamHistory) {
      this.telemetryHistory.shift();
    }

    this.listeners.forEach(fn => fn(telemetry));
    return telemetry;
  }

  /**
   * Dynamically add a new agent and wire connections to existing nodes
   */
  public integrateLiveNode(update: LiveGraphUpdate): Agent {
    const existing = this.society.agents.find(a => a.id === update.newAgentId);
    if (existing) {
      // Node already exists, update activity/share count
      existing.state.shareCount++;
      return existing;
    }

    // Assign to an existing community or default community
    const targetCommunity = this.society.communities[0]?.id ?? 'comm-general';

    const defaultTraits: AgentTraits = {
      trust: 0.5,
      influence: 0.4,
      conformity: 0.6,
      riskTolerance: 0.45,
    };

    const defaultState: AgentState = {
      beliefStatus: 'uninformed',
      emotionalState: 'neutral',
      exposureTick: null,
      shareCount: 1,
    };

    const defaultMetrics: AgentMetrics = {
      degree: 1,
      inDegree: 1,
      outDegree: 0,
      localClustering: 0.1,
    };

    const psychology: PsychologicalState = {
      ...createInitialPsychologicalState(defaultTraits),
      skepticism: 0.35,
    };

    // Form connection to parentAgentId if given, or to a bridge node
    const connections: string[] = [];
    if (update.parentAgentId && this.society.agents.some(a => a.id === update.parentAgentId)) {
      connections.push(update.parentAgentId);
    } else if (this.society.agents.length > 0) {
      // Connect to a random existing influencer or agent
      const candidate = this.society.agents.find(a => a.isInfluencer) ?? this.society.agents[0];
      connections.push(candidate.id);
      candidate.connections.push(update.newAgentId);
    }

    const newAgent: Agent = {
      id: update.newAgentId,
      name: update.newAgentName,
      communityId: targetCommunity,
      role: `stream-${update.platform}`,
      traits: defaultTraits,
      state: defaultState,
      metrics: defaultMetrics,
      connections,
      isInfluencer: false,
      isBridge: false,
      isIsolated: connections.length === 0,
      peerTrustMap: {},
      psychology,
      metadata: {
        platform: update.platform,
        ingestedAt: update.timestamp,
        snippet: update.content.slice(0, 120),
      },
    };

    // Register into society
    this.society.agents.push(newAgent);

    // If an active rumor exists and parent was infected, evaluate immediate psychological adoption
    const activeRumor = this.rumorEngine.getState().activeRumor;
    if (activeRumor && connections.length > 0) {
      const parentId = connections[0];
      const parentState = this.rumorEngine.getState().agentStates.get(parentId);
      if (parentState === 'BELIEVER') {
        const signalWithSender: InformationSignal = {
          ...activeRumor,
          senderId: parentId,
          round: this.currentTick,
        };
        BehavioralDecisionEngine.evaluate(newAgent, signalWithSender, this.society);
      }
    }

    return newAgent;
  }

  /**
   * Calculate live emotional drift and continuous R0
   */
  private computeStreamingTelemetry(): StreamingTelemetry {
    const agents = this.society.agents;
    const simState = this.rumorEngine.getState();
    const believers = agents.filter(a => (simState.agentStates.get(a.id) ?? 'SUSCEPTIBLE') === 'BELIEVER');

    // Compute emotional drift across entire active population
    let totalValence = 0;
    let totalArousal = 0;
    const emotionFrequency: Record<string, number> = {};

    agents.forEach(a => {
      const prof = a.psychology?.emotionProfile;
      const valence = prof?.valence ?? 0;
      const arousal = prof?.arousal ?? 0.5;
      const emotion = prof?.primaryEmotion ?? a.state.emotionalState;

      totalValence += valence;
      totalArousal += arousal;
      emotionFrequency[emotion] = (emotionFrequency[emotion] || 0) + 1;
    });

    const dominantEmotion = Object.entries(emotionFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'neutral';

    // Estimate instantaneous R0 from recent telemetry history or believer ratio
    const latestRoundTelemetry: RoundTelemetry | undefined = simState.telemetryHistory[simState.telemetryHistory.length - 1];
    const instantaneousR0 = latestRoundTelemetry ? latestRoundTelemetry.r0 : (believers.length > 0 ? 1.2 : 0);

    const activeEdges = agents.reduce((sum, a) => sum + a.connections.length, 0) / 2;

    return {
      currentTick: this.currentTick,
      activeNodes: agents.length,
      activeEdges: Math.round(activeEdges),
      liveInfections: believers.length,
      instantaneousR0: Number(instantaneousR0.toFixed(2)),
      emotionalDrift: {
        averageValence: Number((totalValence / Math.max(1, agents.length)).toFixed(3)),
        averageArousal: Number((totalArousal / Math.max(1, agents.length)).toFixed(3)),
        dominantEmotion,
      },
    };
  }

  public getTelemetryHistory(): StreamingTelemetry[] {
    return [...this.telemetryHistory];
  }

  public getStatus(): 'streaming' | 'paused' {
    return this.isStreaming ? 'streaming' : 'paused';
  }
}
