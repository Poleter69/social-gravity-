/**
 * Social Gravity - Live Incident Replay & Investigation Workspace Manager
 * Milestone M19 (Stages 7 & 16): Deterministic time-travel, live delta snapshots, and investigation workspaces
 */

import { ProcessedLivePost } from './pipeline';
import { LiveAlert } from './alertEngine';
import { UnifiedNarrative } from '../fusion/NarrativeFusionEngine';

export interface LiveStreamSnapshot {
  snapshotId: string;
  sequence: number;
  timestamp: number;
  timeLabel: string;
  totalPosts: number;
  postsDelta: ProcessedLivePost[];
  activeNarrativesCount: number;
  criticalAlertsCount: number;
  threatScoreAverage: number;
  dominantEmotion: string;
}

export interface IncidentWorkspaceRecord {
  incidentId: string;
  title: string;
  createdAt: string;
  narrativeId?: string;
  notes: string[];
  replayStartSnapshotIndex: number;
  replayEndSnapshotIndex: number;
  alertsSnapshot: LiveAlert[];
  narrativesSnapshot: UnifiedNarrative[];
  exportedBrief?: string;
}

export class LiveReplayManager {
  private snapshots: LiveStreamSnapshot[] = [];
  private currentReplayIndex: number | null = null; // null = live mode
  private isLiveStreaming: boolean = true;
  private workspaces: Map<string, IncidentWorkspaceRecord> = new Map();
  private maxSnapshots: number;

  constructor(maxSnapshots: number = 500) {
    this.maxSnapshots = maxSnapshots;
  }

  /**
   * Captures an incremental delta snapshot during live streaming without pausing ingestion.
   */
  public recordSnapshot(
    recentPosts: ProcessedLivePost[],
    narratives: UnifiedNarrative[],
    alerts: LiveAlert[]
  ): LiveStreamSnapshot {
    const sequence = this.snapshots.length;
    const now = Date.now();
    const dateObj = new Date(now);
    const timeLabel = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}:${dateObj.getSeconds().toString().padStart(2, '0')}`;

    const avgThreat = narratives.length > 0
      ? Math.round(narratives.reduce((acc, n) => acc + n.threatScore.score, 0) / narratives.length)
      : 20;

    const criticalCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;

    const snapshot: LiveStreamSnapshot = {
      snapshotId: `snap-${sequence}-${now}`,
      sequence,
      timestamp: now,
      timeLabel,
      totalPosts: recentPosts.length,
      postsDelta: recentPosts.slice(-15), // keep delta buffer
      activeNarrativesCount: narratives.length,
      criticalAlertsCount: criticalCount,
      threatScoreAverage: avgThreat,
      dominantEmotion: narratives[0]?.dominantEmotion || 'neutral',
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  public getSnapshots(): LiveStreamSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Rewind to a specific snapshot index.
   * Streaming continues in background; UI displays historical checkpoint.
   */
  public jumpToSnapshot(index: number): LiveStreamSnapshot | null {
    if (index < 0 || index >= this.snapshots.length) return null;
    this.currentReplayIndex = index;
    this.isLiveStreaming = false;
    return this.snapshots[index];
  }

  /**
   * Resumes real-time live mode.
   */
  public resumeLive(): void {
    this.currentReplayIndex = null;
    this.isLiveStreaming = true;
  }

  public isLive(): boolean {
    return this.isLiveStreaming;
  }

  public getCurrentSnapshot(): LiveStreamSnapshot | null {
    if (this.currentReplayIndex === null) {
      return this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : null;
    }
    return this.snapshots[this.currentReplayIndex] || null;
  }

  // --- Incident Workspaces (Git for investigations) ---

  public createWorkspace(
    title: string,
    narrative?: UnifiedNarrative,
    alerts: LiveAlert[] = []
  ): IncidentWorkspaceRecord {
    const incidentId = `inc-${Date.now()}-${this.workspaces.size + 1}`;
    const startIndex = Math.max(0, this.snapshots.length - 20);
    const endIndex = this.snapshots.length - 1;

    const workspace: IncidentWorkspaceRecord = {
      incidentId,
      title,
      createdAt: new Date().toISOString(),
      narrativeId: narrative?.id,
      notes: [`Investigation opened for narrative: ${narrative?.title || title}`],
      replayStartSnapshotIndex: startIndex,
      replayEndSnapshotIndex: endIndex,
      alertsSnapshot: alerts.slice(0, 10),
      narrativesSnapshot: narrative ? [narrative] : [],
    };

    this.workspaces.set(incidentId, workspace);
    return workspace;
  }

  public addNoteToWorkspace(incidentId: string, note: string): void {
    const ws = this.workspaces.get(incidentId);
    if (ws) ws.notes.push(note);
  }

  public getWorkspace(incidentId: string): IncidentWorkspaceRecord | undefined {
    return this.workspaces.get(incidentId);
  }

  public getAllWorkspaces(): IncidentWorkspaceRecord[] {
    return Array.from(this.workspaces.values());
  }
}
