/**
 * Social Gravity - Scenario Management Types
 * Defines the data contract for saving, loading, and versioning analyst investigations.
 */

import { Society } from '../society/types/society';
import { RoundTelemetry } from '../simulation/types';
import { DiscoveryReport } from '../discovery/types';
import { InformationSignal } from '../psychology/types';

export interface ScenarioMetadata {
  title: string;
  description: string;
  source: string;   // dataset source or 'synthetic'
  createdAt: string;  // ISO 8601
  updatedAt: string;
  author: string;
  tags: string[];
  version: number;
  archived: boolean;
}

export interface Scenario {
  id: string;
  metadata: ScenarioMetadata;
  society: Society;
  rumor: InformationSignal | null;
  telemetryHistory: RoundTelemetry[];
  discoveryReport: DiscoveryReport | null;
  currentRound: number;
  status: 'idle' | 'running' | 'paused' | 'completed';
  patientZeroIds: string[];
  agentBeliefs: Array<[string, string]>;
}

export interface ScenarioListItem {
  id: string;
  metadata: ScenarioMetadata;
  currentRound: number;
  status: Scenario['status'];
  agentCount: number;
  sizeBytes: number;
}
