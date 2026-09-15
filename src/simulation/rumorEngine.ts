/**
 * Social Gravity - Rumor Diffusion & Intervention Simulation Engine
 * Discrete-time, event-driven epidemiological orchestrator combining agent-level
 * psychological decision mechanics with macroscopic network propagation dynamics.
 */

import { Society } from '../society/types/society';
import { Agent } from '../society/types/agent';
import { InformationSignal } from '../psychology/types';
import { BehavioralDecisionEngine } from '../psychology/decisionEngine';
import { applyEmotionalHomeostasis } from '../psychology/rules/confidenceRecovery';
import { PRNG } from '../society/math/random';
import { TransmissionPriorityQueue } from './queue';
import { CascadeTracker } from './cascadeTracker';
import { 
  AgentEpidemicState, 
  SimulationConfig, 
  SimulationState 
} from './types';

export class RumorEngine {
  private society: Society;
  private config: SimulationConfig;
  private rng: PRNG;
  private queue: TransmissionPriorityQueue;

  private state: SimulationState;
  private adjacency: Map<string, string[]> = new Map();
  private agentIndex: Map<string, Agent> = new Map();

  constructor(society: Society, config?: Partial<SimulationConfig>) {
    this.society = society;
    this.config = {
      maxRounds: 40,
      transmissionDelayMin: 1,
      transmissionDelayMax: 2,
      stochasticTransmission: true,
      enableHomeostasis: true,
      seed: 42,
      ...config,
    };

    this.rng = new PRNG(this.config.seed ?? 42);
    this.queue = new TransmissionPriorityQueue();

    // Cache agents and build adjacency graph
    this.society.agents.forEach(a => this.agentIndex.set(a.id, a));
    this.buildAdjacency();

    this.state = {
      status: 'idle',
      currentRound: 0,
      activeRumor: null,
      activeDebunk: null,
      patientZeroIds: [],
      agentStates: new Map(),
      infectionParents: new Map(),
      telemetryHistory: [],
      recentTransmissions: [],
    };
  }

  /**
   * Index network graph adjacency for fast neighbor lookups.
   */
  private buildAdjacency(): void {
    this.adjacency.clear();
    this.society.agents.forEach(a => this.adjacency.set(a.id, []));
    this.society.edges.forEach(e => {
      if (this.adjacency.has(e.source)) this.adjacency.get(e.source)!.push(e.target);
      if (this.adjacency.has(e.target)) this.adjacency.get(e.target)!.push(e.source);
    });
  }

  /**
   * Initialize a new rumor diffusion simulation with seed infectors (Patient Zero).
   */
  public start(rumor: InformationSignal, patientZeroIds?: string[]): SimulationState {
    this.queue.clear();
    const states = new Map<string, AgentEpidemicState>();
    const parents = new Map<string, string>();

    // Default all agents to SUSCEPTIBLE and sync beliefStatus
    this.society.agents.forEach(a => {
      states.set(a.id, 'SUSCEPTIBLE');
      a.state.beliefStatus = 'uninformed';
      a.state.exposureTick = null;
      a.state.shareCount = 0;
    });

    // Select Patient Zero(s)
    let seeds = patientZeroIds;
    if (!seeds || seeds.length === 0) {
      const topInfluencer = [...this.society.agents].sort((a, b) => b.traits.influence - a.traits.influence)[0];
      seeds = [topInfluencer ? topInfluencer.id : this.society.agents[0].id];
    }

    // Set Patient Zeros to BELIEVER
    seeds.forEach(seedId => {
      states.set(seedId, 'BELIEVER');
      const seedAgent = this.agentIndex.get(seedId);
      if (seedAgent) {
        seedAgent.state.beliefStatus = 'believer';
        seedAgent.state.exposureTick = 0;
        seedAgent.state.shareCount = 1;
      }
    });

    this.state = {
      status: 'running',
      currentRound: 0,
      activeRumor: rumor,
      activeDebunk: null,
      patientZeroIds: seeds,
      agentStates: states,
      infectionParents: parents,
      telemetryHistory: [],
      recentTransmissions: [],
    };

    // Schedule initial transmissions from Patient Zeros to all neighbors for round 1
    seeds.forEach(seedId => {
      const neighbors = this.adjacency.get(seedId) || [];
      neighbors.forEach(neighborId => {
        const delay = this.calculateDelay();
        this.queue.enqueue({
          id: `tx_${seedId}_${neighborId}_r1`,
          sourceId: seedId,
          targetId: neighborId,
          signal: { ...rumor, senderId: seedId },
          scheduledRound: 1 + delay - 1, // Round 1
          priority: 10,
          transmitted: false,
        });
      });
    });

    // Record Round 0 snapshot
    const initialTelemetry = CascadeTracker.computeSnapshot(
      0,
      this.society,
      this.state.agentStates,
      this.state.infectionParents,
      null
    );
    this.state.telemetryHistory.push(initialTelemetry);

    return this.state;
  }

  /**
   * Step the simulation forward by 1 round (discrete time step t -> t + 1).
   */
  public step(): SimulationState {
    if (this.state.status !== 'running' && this.state.status !== 'paused') {
      return this.state;
    }

    this.state.currentRound++;
    const currentRound = this.state.currentRound;
    const readyEvents = this.queue.popReady(currentRound);
    const recentTransmissions: Array<{ sourceId: string; targetId: string; type: 'rumor' | 'debunk' }> = [];

    // Process all ready transmissions in this round
    for (const event of readyEvents) {
      const target = this.agentIndex.get(event.targetId);
      const source = this.agentIndex.get(event.sourceId);
      if (!target || !source) continue;

      const currentState = this.state.agentStates.get(target.id) || 'SUSCEPTIBLE';
      const isDebunkSignal = event.signal.veracity === 'true';

      // Redundant checks
      if (!isDebunkSignal && currentState === 'BELIEVER') continue;
      if (isDebunkSignal && currentState === 'DEBUNKER') continue;

      // Invoke Behavioral Decision Engine
      const signalWithSender: InformationSignal = {
        ...event.signal,
        senderId: source.id,
        round: currentRound,
      };

      const decisionLog = BehavioralDecisionEngine.evaluate(target, signalWithSender, this.society);

      recentTransmissions.push({
        sourceId: source.id,
        targetId: target.id,
        type: isDebunkSignal ? 'debunk' : 'rumor'
      });

      if (isDebunkSignal) {
        // Fact-check / debunking intervention
        if (decisionLog.action === 'adopt' || decisionLog.action === 'amplify') {
          this.state.agentStates.set(target.id, 'DEBUNKER');
          target.state.beliefStatus = 'debunker';

          if (decisionLog.action === 'amplify') {
            this.scheduleOutwardTransmissions(target.id, signalWithSender, currentRound);
          }
        }
      } else {
        // Rumor propagation
        switch (decisionLog.action) {
          case 'amplify': {
            this.state.agentStates.set(target.id, 'BELIEVER');
            target.state.beliefStatus = 'believer';
            if (!this.state.infectionParents.has(target.id)) {
              this.state.infectionParents.set(target.id, source.id);
            }
            this.scheduleOutwardTransmissions(target.id, signalWithSender, currentRound);
            break;
          }
          case 'adopt': {
            this.state.agentStates.set(target.id, 'BELIEVER');
            target.state.beliefStatus = 'believer';
            if (!this.state.infectionParents.has(target.id)) {
              this.state.infectionParents.set(target.id, source.id);
            }
            break;
          }
          case 'scrutinize': {
            if (currentState === 'SUSCEPTIBLE') {
              this.state.agentStates.set(target.id, 'SKEPTIC');
              target.state.beliefStatus = 'skeptical';
            }
            break;
          }
          case 'debunk': {
            this.state.agentStates.set(target.id, 'DEBUNKER');
            target.state.beliefStatus = 'debunker';
            // Counter-transmits skeptical refutation to neighbors
            const counterSignal: InformationSignal = {
              id: `debunk-auto-${target.id}-${currentRound}`,
              topic: `Debunk: ${event.signal.topic}`,
              content: `Peer refutation by ${target.name}: "${event.signal.topic}" is unfounded.`,
              veracity: 'true',
              emotionalSalience: 0.20,
              complexity: 0.30,
              senderId: target.id,
              round: currentRound,
            };
            this.scheduleOutwardTransmissions(target.id, counterSignal, currentRound);
            break;
          }
          case 'ignore': {
            // Remains in current state
            break;
          }
        }
      }
    }

    // Apply psychological homeostasis recovery over time if enabled
    if (this.config.enableHomeostasis) {
      this.society.agents.forEach(agent => {
        applyEmotionalHomeostasis(agent);
      });
    }

    // Compute round telemetry snapshot
    const prevTelemetry = this.state.telemetryHistory.length > 0 
      ? this.state.telemetryHistory[this.state.telemetryHistory.length - 1] 
      : null;

    const roundSnapshot = CascadeTracker.computeSnapshot(
      currentRound,
      this.society,
      this.state.agentStates,
      this.state.infectionParents,
      prevTelemetry
    );

    this.state.telemetryHistory.push(roundSnapshot);
    this.state.recentTransmissions = recentTransmissions.slice(0, 40);

    // Termination check
    if (this.queue.size === 0 || currentRound >= this.config.maxRounds) {
      this.state.status = 'completed';
    }

    return this.state;
  }

  /**
   * Helper to schedule transmissions to all neighbors of an agent.
   */
  private scheduleOutwardTransmissions(senderId: string, signal: InformationSignal, currentRound: number): void {
    const neighbors = this.adjacency.get(senderId) || [];
    const sender = this.agentIndex.get(senderId);

    for (const neighborId of neighbors) {
      const delay = this.calculateDelay();
      const scheduledRound = currentRound + delay;
      const priority = sender ? Math.floor(sender.traits.influence * 10) : 5;

      this.queue.enqueue({
        id: `tx_${senderId}_${neighborId}_r${scheduledRound}_${this.rng.nextFloat()}`,
        sourceId: senderId,
        targetId: neighborId,
        signal: { ...signal, senderId },
        scheduledRound,
        priority,
        transmitted: false,
      });
    }
  }

  /**
   * Calculate transmission delay between rounds (1-2 rounds default).
   */
  private calculateDelay(): number {
    if (!this.config.stochasticTransmission) {
      return this.config.transmissionDelayMin;
    }
    const range = this.config.transmissionDelayMax - this.config.transmissionDelayMin;
    return this.config.transmissionDelayMin + Math.floor(this.rng.nextFloat() * (range + 1));
  }

  /**
   * Inject a debunking counter-narrative intervention at chosen agents or influential authorities.
   */
  public injectDebunking(debunkSignal: InformationSignal, authorityNodeIds?: string[]): SimulationState {
    this.state.status = 'running';
    let seeds = authorityNodeIds;
    if (!seeds || seeds.length === 0) {
      // Pick top 2 most influential non-believer agents or top bridges
      const candidateAgents = this.society.agents.filter(a => this.state.agentStates.get(a.id) !== 'BELIEVER');
      candidateAgents.sort((a, b) => b.traits.influence - a.traits.influence);
      seeds = candidateAgents.slice(0, 2).map(a => a.id);
      if (seeds.length === 0) seeds = [this.society.agents[0].id];
    }

    this.state.activeDebunk = debunkSignal;

    seeds.forEach(seedId => {
      this.state.agentStates.set(seedId, 'DEBUNKER');
      const seedAgent = this.agentIndex.get(seedId);
      if (seedAgent) {
        seedAgent.state.beliefStatus = 'debunker';
        seedAgent.state.shareCount += 1;
      }
      this.scheduleOutwardTransmissions(seedId, debunkSignal, this.state.currentRound);
    });

    return this.state;
  }

  /**
   * Pause the active simulation.
   */
  public pause(): void {
    if (this.state.status === 'running') {
      this.state.status = 'paused';
    }
  }

  /**
   * Resume paused simulation.
   */
  public resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'running';
    }
  }

  /**
   * Reset the simulation to initial idle state.
   */
  public reset(): void {
    this.queue.clear();
    this.state = {
      status: 'idle',
      currentRound: 0,
      activeRumor: null,
      activeDebunk: null,
      patientZeroIds: [],
      agentStates: new Map(),
      infectionParents: new Map(),
      telemetryHistory: [],
      recentTransmissions: [],
    };
    this.society.agents.forEach(a => {
      a.state.beliefStatus = 'uninformed';
      a.state.exposureTick = null;
      a.state.shareCount = 0;
    });
  }

  public getState(): SimulationState {
    return this.state;
  }

  public getPendingQueueSize(): number {
    return this.queue.size;
  }
}
