/**
 * Social Gravity - Investigation Collaboration Manager
 *
 * Implements Milestone M3:
 * - Creates and manages shared analyst investigations
 * - Pinned evidence items, replay bookmarks, and node annotations
 * - Threaded review comments with status tracking
 * - Offline serialization for exporting and sharing investigation packages
 */

import {
  Investigation,
  ReplayBookmark,
  AgentAnnotation,
  PinnedEvidence,
  ReviewComment,
  ScenarioComparisonEntry,
} from './types';

export class InvestigationManager {
  private activeInvestigation: Investigation;

  constructor(initialData?: Partial<Investigation>) {
    this.activeInvestigation = {
      id: initialData?.id ?? `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: initialData?.title ?? 'Untitled Intelligence Investigation',
      description: initialData?.description ?? 'Threat contagion analysis session',
      author: initialData?.author ?? 'Analyst-1',
      createdAt: initialData?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      status: initialData?.status ?? 'open',
      simulationSeed: initialData?.simulationSeed ?? 42,
      societyArchetype: initialData?.societyArchetype ?? 'online_community',
      activeRumorTopic: initialData?.activeRumorTopic ?? 'General Rumor',
      bookmarks: initialData?.bookmarks ? [...initialData.bookmarks] : [],
      annotations: initialData?.annotations ? [...initialData.annotations] : [],
      pinnedEvidence: initialData?.pinnedEvidence ? [...initialData.pinnedEvidence] : [],
      comments: initialData?.comments ? [...initialData.comments] : [],
      comparisonHistory: initialData?.comparisonHistory ? [...initialData.comparisonHistory] : [],
    };
  }

  public getInvestigation(): Investigation {
    return { ...this.activeInvestigation };
  }

  public updateMetadata(title: string, description: string, status?: Investigation['status']): void {
    this.activeInvestigation.title = title;
    this.activeInvestigation.description = description;
    if (status) this.activeInvestigation.status = status;
    this.activeInvestigation.updatedAt = Date.now();
  }

  // --- BOOKMARKS ---
  public addBookmark(round: number, label: string, notes: string, author: string): ReplayBookmark {
    const bookmark: ReplayBookmark = {
      id: `bm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      round,
      label,
      notes,
      author,
      timestamp: Date.now(),
    };
    this.activeInvestigation.bookmarks.push(bookmark);
    this.activeInvestigation.updatedAt = Date.now();
    return bookmark;
  }

  public getBookmarks(): ReplayBookmark[] {
    return [...this.activeInvestigation.bookmarks].sort((a, b) => a.round - b.round);
  }

  // --- ANNOTATIONS ---
  public addAnnotation(
    agentId: string,
    round: number,
    tag: AgentAnnotation['tag'],
    note: string,
    author: string
  ): AgentAnnotation {
    const annotation: AgentAnnotation = {
      id: `ann-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      agentId,
      round,
      tag,
      note,
      author,
      timestamp: Date.now(),
    };
    this.activeInvestigation.annotations.push(annotation);
    this.activeInvestigation.updatedAt = Date.now();
    return annotation;
  }

  public getAnnotationsForAgent(agentId: string): AgentAnnotation[] {
    return this.activeInvestigation.annotations.filter(a => a.agentId === agentId);
  }

  // --- PINNED EVIDENCE ---
  public pinEvidence(
    title: string,
    type: PinnedEvidence['type'],
    round: number,
    metrics: Record<string, number | string>,
    rationale: string,
    author: string
  ): PinnedEvidence {
    const evidence: PinnedEvidence = {
      id: `ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      type,
      round,
      metrics,
      rationale,
      author,
      timestamp: Date.now(),
    };
    this.activeInvestigation.pinnedEvidence.push(evidence);
    this.activeInvestigation.updatedAt = Date.now();
    return evidence;
  }

  public getPinnedEvidence(): PinnedEvidence[] {
    return [...this.activeInvestigation.pinnedEvidence];
  }

  // --- REVIEW COMMENTS ---
  public addComment(author: string, text: string, replyToId?: string): ReviewComment {
    const comment: ReviewComment = {
      id: `comm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      author,
      text,
      timestamp: Date.now(),
      replyToId,
      status: 'open',
    };
    this.activeInvestigation.comments.push(comment);
    this.activeInvestigation.updatedAt = Date.now();
    return comment;
  }

  public markCommentStatus(commentId: string, status: 'open' | 'addressed'): void {
    const comm = this.activeInvestigation.comments.find(c => c.id === commentId);
    if (comm) {
      comm.status = status;
      this.activeInvestigation.updatedAt = Date.now();
    }
  }

  // --- SCENARIO COMPARISONS ---
  public recordComparison(
    scenarioA: string,
    scenarioB: string,
    containmentDelta: number,
    keyTakeaway: string
  ): ScenarioComparisonEntry {
    const entry: ScenarioComparisonEntry = {
      id: `comp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      scenarioA,
      scenarioB,
      containmentDelta,
      keyTakeaway,
      timestamp: Date.now(),
    };
    this.activeInvestigation.comparisonHistory.push(entry);
    this.activeInvestigation.updatedAt = Date.now();
    return entry;
  }

  // --- EXPORT & IMPORT ---
  public exportPackage(): string {
    return JSON.stringify(
      {
        __format: 'social-gravity-investigation-v2',
        exportedAt: new Date().toISOString(),
        investigation: this.activeInvestigation,
      },
      null,
      2
    );
  }

  public static importPackage(jsonString: string): InvestigationManager {
    const parsed = JSON.parse(jsonString);
    if (!parsed || parsed.__format !== 'social-gravity-investigation-v2' || !parsed.investigation) {
      throw new Error('Invalid Social Gravity investigation package format');
    }
    return new InvestigationManager(parsed.investigation);
  }
}
