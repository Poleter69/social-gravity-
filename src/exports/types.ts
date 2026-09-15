import { Society } from '../society/types/society';
import { SimulationState, RoundTelemetry } from '../simulation/types';
import { DiscoveryReport } from '../discovery/types';

export interface ExportOptions {
  includeAgents?: boolean;
  includeEdges?: boolean;
  includeTelemetry?: boolean;
  includeEmotions?: boolean;
  rounds?: [number, number]; // [start, end] inclusive
}

export interface ExportPayload {
  society: Society;
  simState: SimulationState;
  telemetryHistory: RoundTelemetry[];
  discoveryReport?: DiscoveryReport | null;
  exportedAt: string;
  version: string;
}
