import { ExportPayload, ExportOptions } from './types';
import { AgentEpidemicState } from '../simulation/types';

function escCSV(val: unknown): string {
  const s = val === null || val === undefined ? '' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function row(cols: unknown[]): string {
  return cols.map(escCSV).join(',');
}

export function exportToCSV(payload: ExportPayload, opts: ExportOptions = {}): string {
  const { society, simState, telemetryHistory } = payload;
  const sections: string[] = [];

  // Section 1: Metadata
  sections.push('# SOCIAL GRAVITY — INTELLIGENCE REPORT');
  sections.push(`# Exported: ${payload.exportedAt}`);
  sections.push(`# Society: ${society.name} | Agents: ${society.agents.length}`);
  sections.push('');

  // Section 2: Nodes
  if (opts.includeAgents !== false) {
    sections.push('## NODES');
    sections.push(row([
      'id', 'name', 'communityId', 'role', 'isInfluencer', 'isBridge', 'isIsolated',
      'trust', 'influence', 'conformity', 'riskTolerance',
      'beliefStatus', 'emotionalState', 'degree', 'inDegree', 'outDegree', 'localClustering',
      'shareCount', 'epicdemicState', 'primaryEmotion', 'emotionIntensity',
    ]));
    for (const a of society.agents) {
      const epicdemicState: AgentEpidemicState =
        simState.agentStates.get(a.id) ?? 'SUSCEPTIBLE';
      sections.push(row([
        a.id, a.name, a.communityId, a.role,
        a.isInfluencer, a.isBridge, a.isIsolated,
        a.traits.trust, a.traits.influence, a.traits.conformity, a.traits.riskTolerance,
        a.state.beliefStatus, a.state.emotionalState,
        a.metrics.degree, a.metrics.inDegree, a.metrics.outDegree, a.metrics.localClustering,
        a.state.shareCount,
        epicdemicState,
        a.psychology.emotionProfile?.primaryEmotion ?? '',
        a.psychology.emotionProfile?.intensity ?? 0,
      ]));
    }
    sections.push('');
  }

  // Section 3: Edges
  if (opts.includeEdges !== false) {
    sections.push('## EDGES');
    sections.push(row(['source', 'target']));
    const seen = new Set<string>();
    for (const a of society.agents) {
      for (const c of a.connections) {
        const key = [a.id, c].sort().join('--');
        if (!seen.has(key)) {
          seen.add(key);
          sections.push(row([a.id, c]));
        }
      }
    }
    sections.push('');
  }

  // Section 4: Telemetry timeline
  if (opts.includeTelemetry !== false && telemetryHistory.length > 0) {
    sections.push('## TELEMETRY TIMELINE');
    sections.push(row([
      'round', 'timestamp', 'susceptibleCount', 'exposedCount', 'believerCount',
      'skepticCount', 'debunkerCount', 'newInfections', 'newDebunked', 'r0',
      'cascadeVelocity', 'maxCascadeDepth',
    ]));
    const [start, end] = opts.rounds ?? [0, Infinity];
    for (const t of telemetryHistory) {
      if (t.round < start || t.round > end) continue;
      sections.push(row([
        t.round, new Date(t.timestamp).toISOString(),
        t.susceptibleCount, t.exposedCount, t.believerCount,
        t.skepticCount, t.debunkerCount, t.newInfections, t.newDebunked,
        t.r0, t.cascadeVelocity, t.maxCascadeDepth,
      ]));
    }
    sections.push('');
  }

  return sections.join('\n');
}

export function downloadCSV(content: string, filename = 'social-gravity-report.csv'): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
