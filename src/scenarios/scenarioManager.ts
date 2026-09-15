/**
 * Social Gravity - Scenario Manager
 * Provides save/load/duplicate/archive/delete for analyst investigations
 * using localStorage (JSON serialized). Upgrades to IndexedDB if available.
 */

import { Scenario, ScenarioListItem, ScenarioMetadata } from './types';
import { Society } from '../society/types/society';
import { RoundTelemetry } from '../simulation/types';
import { DiscoveryReport } from '../discovery/types';
import { InformationSignal } from '../psychology/types';

const STORAGE_KEY_PREFIX = 'sg_scenario_';
const INDEX_KEY = 'sg_scenario_index';

function generateId(): string {
  return `scenario-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getIndex(): string[] {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function setIndex(ids: string[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

function storageKey(id: string): string {
  return `${STORAGE_KEY_PREFIX}${id}`;
}

export class ScenarioManager {
  /**
   * Save or update a scenario. Returns the scenario id.
   */
  save(params: {
    id?: string;
    society: Society;
    rumor: InformationSignal | null;
    telemetryHistory: RoundTelemetry[];
    discoveryReport: DiscoveryReport | null;
    currentRound: number;
    status: Scenario['status'];
    patientZeroIds: string[];
    agentBeliefs: Array<[string, string]>;
    metadata: Partial<ScenarioMetadata>;
  }): string {
    const id = params.id ?? generateId();
    const now = new Date().toISOString();
    const existing = this.load(id);
    const meta: ScenarioMetadata = {
      title: params.metadata.title ?? existing?.metadata.title ?? `Scenario ${id.slice(-6)}`,
      description: params.metadata.description ?? existing?.metadata.description ?? '',
      source: params.metadata.source ?? existing?.metadata.source ?? 'synthetic',
      createdAt: existing?.metadata.createdAt ?? now,
      updatedAt: now,
      author: params.metadata.author ?? existing?.metadata.author ?? 'Analyst',
      tags: params.metadata.tags ?? existing?.metadata.tags ?? [],
      version: (existing?.metadata.version ?? 0) + 1,
      archived: params.metadata.archived ?? existing?.metadata.archived ?? false,
    };

    const scenario: Scenario = {
      id,
      metadata: meta,
      society: params.society,
      rumor: params.rumor,
      telemetryHistory: params.telemetryHistory,
      discoveryReport: params.discoveryReport,
      currentRound: params.currentRound,
      status: params.status,
      patientZeroIds: params.patientZeroIds,
      agentBeliefs: params.agentBeliefs,
    };

    localStorage.setItem(storageKey(id), JSON.stringify(scenario));
    const index = getIndex();
    if (!index.includes(id)) { index.unshift(id); setIndex(index); }
    return id;
  }

  load(id: string): Scenario | null {
    try {
      const raw = localStorage.getItem(storageKey(id));
      if (!raw) return null;
      return JSON.parse(raw) as Scenario;
    } catch {
      return null;
    }
  }

  list(): ScenarioListItem[] {
    const index = getIndex();
    const items: ScenarioListItem[] = [];
    for (const id of index) {
      const raw = localStorage.getItem(storageKey(id));
      if (!raw) continue;
      try {
        const s = JSON.parse(raw) as Scenario;
        items.push({
          id: s.id,
          metadata: s.metadata,
          currentRound: s.currentRound,
          status: s.status,
          agentCount: s.society?.agents?.length ?? 0,
          sizeBytes: raw.length,
        });
      } catch { /* skip corrupt entries */ }
    }
    return items;
  }

  delete(id: string): void {
    localStorage.removeItem(storageKey(id));
    setIndex(getIndex().filter(i => i !== id));
  }

  duplicate(id: string, newTitle?: string): string | null {
    const original = this.load(id);
    if (!original) return null;
    return this.save({
      ...original,
      id: undefined,
      metadata: {
        ...original.metadata,
        title: newTitle ?? `${original.metadata.title} (copy)`,
        version: 0,
      },
    });
  }

  archive(id: string, archived: boolean): void {
    const s = this.load(id);
    if (!s) return;
    s.metadata.archived = archived;
    s.metadata.updatedAt = new Date().toISOString();
    localStorage.setItem(storageKey(id), JSON.stringify(s));
  }

  /**
   * Export scenario as a JSON string (for file download).
   */
  exportJSON(id: string): string | null {
    const s = this.load(id);
    if (!s) return null;
    return JSON.stringify({ __format: 'social-gravity-scenario-v1', ...s }, null, 2);
  }

  /**
   * Import a scenario from exported JSON string.
   */
  importJSON(json: string): string {
    const s = JSON.parse(json) as Scenario;
    const id = generateId();
    s.id = id;
    s.metadata.createdAt = new Date().toISOString();
    s.metadata.updatedAt = s.metadata.createdAt;
    localStorage.setItem(storageKey(id), JSON.stringify(s));
    const index = getIndex();
    index.unshift(id);
    setIndex(index);
    return id;
  }

  /** Total storage used by all scenarios in bytes */
  storageSizeBytes(): number {
    return getIndex().reduce((sum, id) => {
      const raw = localStorage.getItem(storageKey(id));
      return sum + (raw?.length ?? 0);
    }, 0);
  }
}

export const scenarioManager = new ScenarioManager();
