/**
 * Social Gravity V2 - EventLog & EventScheduler Unit Tests
 *
 * Validates deterministic event sequencing, range queries, and priority-queued scheduling.
 */

import { EventLog } from '../../src/graph/events/eventLog';
import { EventScheduler } from '../../src/graph/events/scheduler';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testEventLogAndScheduler() {
  console.log('--- Testing Event Log & Deterministic Scheduler ---');

  // Test 1: Event Log Monotonic Sequence & Slices
  const log = new EventLog();
  const recordedTypes: string[] = [];

  const unsubscribe = log.subscribe(ev => {
    recordedTypes.push(ev.type);
  });

  const ev1 = log.append(1, 'NODE_JOINED', { id: 'node_1' });
  const ev2 = log.append(1, 'EDGE_CREATED', { source: 'node_1', target: 'node_2' });
  const ev3 = log.append(2, 'INTERACTION', { source: 'node_1', target: 'node_2' });

  assert(ev1.seq === 1 && ev2.seq === 2 && ev3.seq === 3, 'Sequence numbers must strictly increment');
  assert(ev1.id === 'evt_t1_s000001', `Event ID format mismatch: ${ev1.id}`);
  assert(log.size === 3, 'Log size must equal 3');
  assert(recordedTypes.length === 3, 'Subscriber should have received all 3 events');

  unsubscribe();
  log.append(2, 'NODE_UPDATED', { id: 'node_1' });
  assert(recordedTypes.length === 3, 'Unsubscribed listener should not receive further events');

  // Query events by tick
  const tick1Events = log.getEventsForTick(1);
  assert(tick1Events.length === 2, `Expected 2 events for tick 1, got ${tick1Events.length}`);

  // Query events between ticks
  const rangeEvents = log.getEventsBetween(1, 2);
  assert(rangeEvents.length === 4, `Expected 4 events in range [1, 2], got ${rangeEvents.length}`);

  // Test 2: Event Scheduler Deterministic Priority Ordering
  const scheduler = new EventScheduler();

  // Schedule tasks with varied priorities at tick 10
  scheduler.schedule(10, 'NODE_JOINED', { name: 'Normal priority 1' }, 10, 'task_normal_1');
  scheduler.schedule(10, 'EDGE_REMOVED', { name: 'High priority urgent' }, 0, 'task_urgent');
  scheduler.schedule(10, 'NODE_JOINED', { name: 'Normal priority 2' }, 10, 'task_normal_2');
  scheduler.schedule(12, 'MESSAGE_SENT', { name: 'Future message' }, 5, 'task_future');

  assert(scheduler.pendingCount === 4, `Expected 4 pending tasks, got ${scheduler.pendingCount}`);

  // Poll for tick 10: Urgent (priority 0) must come before normal (priority 10), and normal_1 before normal_2
  const polled = scheduler.poll(10);
  assert(polled.length === 3, `Expected 3 polled tasks for tick 10, got ${polled.length}`);
  assert(polled[0].id === 'task_urgent', `First polled task must be urgent, got ${polled[0].id}`);
  assert(polled[1].id === 'task_normal_1', `Second polled task must be normal_1, got ${polled[1].id}`);
  assert(polled[2].id === 'task_normal_2', `Third polled task must be normal_2, got ${polled[2].id}`);

  assert(scheduler.pendingCount === 1, 'Only 1 task should remain pending for tick 12');

  // Test 3: Task Cancellation
  const recurringIds = scheduler.scheduleRecurring(15, 5, 3, 'INTERACTION', { factor: 1 });
  assert(recurringIds.length === 3, 'Should create 3 recurring tasks');
  assert(scheduler.pendingCount === 4, 'Total pending should be 4');

  const cancelled = scheduler.cancel(recurringIds[1]);
  assert(cancelled, 'Cancellation should succeed');
  assert(scheduler.pendingCount === 3, 'Pending count should be 3 after cancellation');

  console.log('✓ Event log and scheduler validated.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('eventLogAndScheduler.test.ts')) {
  testEventLogAndScheduler();
}
