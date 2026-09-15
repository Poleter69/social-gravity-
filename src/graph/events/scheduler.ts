/**
 * Social Gravity V2 - Deterministic Event Scheduler
 *
 * Priority-queued temporal task scheduler allowing actions, messages,
 * network mutations, and interventions to be planned for specific future ticks.
 */

import { GraphEventType, ScheduledTask } from '../types';

interface InternalScheduledTask extends ScheduledTask {
  insertSeq: number;
}

export class EventScheduler {
  private tasksByTick: Map<number, InternalScheduledTask[]> = new Map();
  private taskIndex: Map<string, { tick: number; id: string }> = new Map();
  private insertCounter: number = 0;

  constructor() {}

  /**
   * Schedules a task to execute at a discrete target tick.
   * Deterministic ordering within the tick is governed by priority (lowest number = first)
   * followed by insertion sequence.
   *
   * @param targetTick The future simulation tick when this task executes
   * @param type The type of graph event to trigger
   * @param payload Task payload parameters
   * @param priority Lower values execute before higher values (default 10)
   * @param customId Optional deterministic custom identifier
   * @returns Generated task ID
   */
  public schedule(
    targetTick: number,
    type: GraphEventType,
    payload: Record<string, unknown>,
    priority: number = 10,
    customId?: string
  ): string {
    this.insertCounter++;
    const id = customId || `sched_t${targetTick}_seq${this.insertCounter}`;

    const task: InternalScheduledTask = {
      id,
      targetTick,
      priority,
      type,
      payload,
      insertSeq: this.insertCounter,
    };

    let bucket = this.tasksByTick.get(targetTick);
    if (!bucket) {
      bucket = [];
      this.tasksByTick.set(targetTick, bucket);
    }
    bucket.push(task);
    this.taskIndex.set(id, { tick: targetTick, id });

    return id;
  }

  /**
   * Schedules a recurring task for a specified number of repetitions.
   */
  public scheduleRecurring(
    startTick: number,
    intervalTicks: number,
    iterations: number,
    type: GraphEventType,
    payload: Record<string, unknown>,
    priority: number = 10
  ): string[] {
    const ids: string[] = [];
    for (let i = 0; i < iterations; i++) {
      const target = startTick + i * intervalTicks;
      ids.push(this.schedule(target, type, { ...payload, iteration: i }, priority));
    }
    return ids;
  }

  /**
   * Cancels a scheduled task by ID before its target tick.
   * Returns true if cancelled, false if not found.
   */
  public cancel(taskId: string): boolean {
    const entry = this.taskIndex.get(taskId);
    if (!entry) return false;

    const bucket = this.tasksByTick.get(entry.tick);
    if (bucket) {
      const idx = bucket.findIndex(t => t.id === taskId);
      if (idx >= 0) {
        bucket.splice(idx, 1);
        if (bucket.length === 0) {
          this.tasksByTick.delete(entry.tick);
        }
      }
    }

    this.taskIndex.delete(taskId);
    return true;
  }

  /**
   * Retrieves and removes all tasks due for execution at currentTick.
   * Tasks are returned in strictly deterministic order:
   * 1. Priority ASC
   * 2. InsertSeq ASC
   */
  public poll(currentTick: number): ScheduledTask[] {
    const bucket = this.tasksByTick.get(currentTick);
    if (!bucket || bucket.length === 0) {
      this.tasksByTick.delete(currentTick);
      return [];
    }

    // Sort deterministically
    bucket.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.insertSeq - b.insertSeq;
    });

    for (const t of bucket) {
      this.taskIndex.delete(t.id);
    }
    this.tasksByTick.delete(currentTick);

    return bucket.map(({ insertSeq, ...rest }) => rest);
  }

  /**
   * Peeks at tasks scheduled for currentTick without removing them.
   */
  public peek(currentTick: number): ScheduledTask[] {
    const bucket = this.tasksByTick.get(currentTick);
    if (!bucket || bucket.length === 0) return [];

    const sorted = [...bucket].sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.insertSeq - b.insertSeq;
    });

    return sorted.map(({ insertSeq, ...rest }) => rest);
  }

  /**
   * Returns total count of pending scheduled tasks across all future ticks.
   */
  public get pendingCount(): number {
    return this.taskIndex.size;
  }

  /**
   * Clears all scheduled tasks and resets counters.
   */
  public clear(): void {
    this.tasksByTick.clear();
    this.taskIndex.clear();
    this.insertCounter = 0;
  }
}
