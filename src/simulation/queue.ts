/**
 * Social Gravity - Transmission Priority Queue
 * Deterministic event queue for asynchronous message cascades across social network graph edges.
 */

import { TransmissionEvent } from './types';

export class TransmissionPriorityQueue {
  private queue: TransmissionEvent[] = [];

  /**
   * Enqueue a new transmission event.
   */
  public enqueue(event: TransmissionEvent): void {
    this.queue.push(event);
    // Sort primarily by scheduledRound ascending, then by priority descending
    this.queue.sort((a, b) => {
      if (a.scheduledRound !== b.scheduledRound) {
        return a.scheduledRound - b.scheduledRound;
      }
      return b.priority - a.priority;
    });
  }

  /**
   * Enqueue a batch of transmission events.
   */
  public enqueueBatch(events: TransmissionEvent[]): void {
    events.forEach(e => this.queue.push(e));
    this.queue.sort((a, b) => {
      if (a.scheduledRound !== b.scheduledRound) {
        return a.scheduledRound - b.scheduledRound;
      }
      return b.priority - a.priority;
    });
  }

  /**
   * Retrieve and remove all events scheduled for currentRound or earlier.
   */
  public popReady(currentRound: number): TransmissionEvent[] {
    const readyEvents: TransmissionEvent[] = [];
    while (this.queue.length > 0 && this.queue[0].scheduledRound <= currentRound) {
      readyEvents.push(this.queue.shift()!);
    }
    return readyEvents;
  }

  /**
   * Peek at next scheduled round.
   */
  public peekNextRound(): number | null {
    return this.queue.length > 0 ? this.queue[0].scheduledRound : null;
  }

  /**
   * Number of pending transmission events.
   */
  public get size(): number {
    return this.queue.length;
  }

  /**
   * Clear all pending transmissions.
   */
  public clear(): void {
    this.queue = [];
  }
}
