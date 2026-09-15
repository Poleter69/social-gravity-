/**
 * Social Gravity - Rumor Diffusion Simulation Engine Types
 * Epidemiological state definitions, priority transmission events, cascade telemetry, and configuration contracts.
 */

import { InformationSignal } from '../psychology/types';

export type AgentEpidemicState = 
  | 'SUSCEPTIBLE'  // Has not received the signal
  | 'EXPOSED'      // Received signal, evaluating
  | 'BELIEVER'     // Adopted rumor, actively sharing
  | 'SKEPTIC'      // Rejected rumor, refusing to share
  | 'DEBUNKER';    // Adopted verified counter-narrative, actively debunking

export interface TransmissionEvent {
  id: string;
  sourceId: string;
  targetId: string;
  signal: InformationSignal;
  scheduledRound: number;
  priority: number; // Higher priority executes first in round
  transmitted: boolean;
}

export interface RoundTelemetry {
  round: number;
  timestamp: number;
  susceptibleCount: number;
  exposedCount: number;
  believerCount: number;
  skepticCount: number;
  debunkerCount: number;
  newInfections: number;
  newDebunked: number;
  r0: number; // Effective reproduction number
  cascadeVelocity: number; // Infections per round
  maxCascadeDepth: number;
  communityPenetration: Record<string, number>; // Ratio of believers per community
}

export interface SimulationConfig {
  maxRounds: number;
  transmissionDelayMin: number;
  transmissionDelayMax: number;
  stochasticTransmission: boolean;
  enableHomeostasis: boolean; // Agent emotional recovery over time
  seed?: number;
}

export interface SimulationState {
  status: 'idle' | 'running' | 'paused' | 'completed';
  currentRound: number;
  activeRumor: InformationSignal | null;
  activeDebunk: InformationSignal | null;
  patientZeroIds: string[];
  agentStates: Map<string, AgentEpidemicState>;
  infectionParents: Map<string, string>; // childId -> parentId (for cascade tree depth)
  telemetryHistory: RoundTelemetry[];
  recentTransmissions: Array<{ sourceId: string; targetId: string; type: 'rumor' | 'debunk' }>;
}
