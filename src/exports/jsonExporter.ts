import { ExportPayload } from './types';
import { AgentEpidemicState } from '../simulation/types';

function replacer(_key: string, value: unknown): unknown {
  if (value instanceof Map) {
    return {
      __type: 'Map',
      data: Array.from((value as Map<unknown, unknown>).entries()),
    };
  }
  if (value instanceof Set) {
    return {
      __type: 'Set',
      data: Array.from((value as Set<unknown>).values()),
    };
  }
  return value;
}

export function exportToJSON(payload: ExportPayload): string {
  const agentBeliefs: Array<[string, AgentEpidemicState]> = Array.from(
    payload.simState.agentStates.entries()
  );

  return JSON.stringify(
    {
      __format: 'social-gravity-replay-v1',
      exportedAt: payload.exportedAt,
      version: payload.version,
      society: payload.society,
      simulationSummary: {
        status: payload.simState.status,
        currentRound: payload.simState.currentRound,
        patientZeroIds: payload.simState.patientZeroIds,
        agentBeliefs,
        telemetryHistory: payload.telemetryHistory,
        recentTransmissions: payload.simState.recentTransmissions,
      },
      discoveryReport: payload.discoveryReport,
    },
    replacer,
    2
  );
}

export function downloadJSON(
  content: string,
  filename = 'social-gravity-replay.json'
): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
