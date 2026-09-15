/**
 * Social Gravity V2 - Event Log
 *
 * Append-only, deterministic event log providing complete auditability
 * and underlying support for time-travel simulation replay.
 */

import { GraphEvent, GraphEventType } from '../types';

export type EventSubscriber = (event: GraphEvent) => void;

export class EventLog {
  private events: GraphEvent[] = [];
  private tickEventIndex: Map<number, number[]> = new Map();
  private subscribers: Set<EventSubscriber> = new Set();
  private seqCounter: number = 0;

  constructor() {}

  /**
   * Appends an event to the append-only log with strict monotonic sequence numbering.
   */
  public append<T = Record<string, unknown>>(
    tick: number,
    type: GraphEventType,
    payload: T,
    wallTimestamp: number = Date.now()
  ): GraphEvent<T> {
    this.seqCounter++;
    const event: GraphEvent<T> = {
      id: `evt_t${tick}_s${String(this.seqCounter).padStart(6, '0')}`,
      tick,
      seq: this.seqCounter,
      type,
      payload,
      wallTimestamp,
    };

    const index = this.events.length;
    this.events.push(event as unknown as GraphEvent);

    let tickIndices = this.tickEventIndex.get(tick);
    if (!tickIndices) {
      tickIndices = [];
      this.tickEventIndex.set(tick, tickIndices);
    }
    tickIndices.push(index);

    // Notify active subscribers
    for (const sub of this.subscribers) {
      try {
        sub(event as unknown as GraphEvent);
      } catch (err) {
        console.error(`[EventLog] Subscriber error on event ${event.id}:`, err);
      }
    }

    return event;
  }

  /**
   * Appends an already-constructed GraphEvent (used during deserialization or replay).
   */
  public appendRaw(event: GraphEvent): void {
    if (event.seq > this.seqCounter) {
      this.seqCounter = event.seq;
    }
    const index = this.events.length;
    this.events.push(event);

    let tickIndices = this.tickEventIndex.get(event.tick);
    if (!tickIndices) {
      tickIndices = [];
      this.tickEventIndex.set(event.tick, tickIndices);
    }
    tickIndices.push(index);
  }

  /**
   * Retrieves all recorded events in strictly monotonic order.
   */
  public getAll(): readonly GraphEvent[] {
    return this.events;
  }

  /**
   * Retrieves the current highest sequence number.
   */
  public getLatestSequence(): number {
    return this.seqCounter;
  }

  /**
   * Retrieves events that occurred strictly at the given simulation tick.
   */
  public getEventsForTick(tick: number): GraphEvent[] {
    const indices = this.tickEventIndex.get(tick);
    if (!indices || indices.length === 0) return [];
    return indices.map(idx => this.events[idx]);
  }

  /**
   * Retrieves events occurring within a discrete tick window [fromTick, toTick] inclusive.
   */
  public getEventsBetween(fromTick: number, toTick: number): GraphEvent[] {
    if (fromTick > toTick) return [];
    const results: GraphEvent[] = [];
    for (let t = fromTick; t <= toTick; t++) {
      const indices = this.tickEventIndex.get(t);
      if (indices) {
        for (const idx of indices) {
          results.push(this.events[idx]);
        }
      }
    }
    return results;
  }

  /**
   * Subscribes a reactive listener to incoming events.
   * Returns an unsubscribe function.
   */
  public subscribe(subscriber: EventSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  /**
   * Returns total count of events recorded.
   */
  public get size(): number {
    return this.events.length;
  }

  /**
   * Clears the event log and resets sequence counter.
   */
  public clear(): void {
    this.events = [];
    this.tickEventIndex.clear();
    this.seqCounter = 0;
  }
}
