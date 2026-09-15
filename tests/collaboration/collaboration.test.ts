/**
 * Social Gravity - Analyst Collaboration Layer Tests (Milestone M3)
 */

import { InvestigationManager } from '../../src/collaboration/investigationStore';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testCollaborationLayer() {
  console.log('--- Testing Milestone M3: Analyst Collaboration Layer ---');

  const manager = new InvestigationManager({
    title: 'Operation Silicon Ripple: SVB Liquidity Rumor Audit',
    description: 'Multi-analyst investigation into rapid deposit drain contagion',
    author: 'Lead-Analyst-Vance',
    simulationSeed: 42000,
    societyArchetype: 'workplace',
    activeRumorTopic: 'SVB Capital Insolvency',
  });

  // 1. Add Bookmark
  const bm1 = manager.addBookmark(3, 'Cascade Breakout Point', 'Rumor breached executive cluster boundary', 'Lead-Analyst-Vance');
  assert(manager.getBookmarks().length === 1, 'Bookmark must be recorded');
  assert(manager.getBookmarks()[0].round === 3, 'Bookmark round must be 3');
  console.log(`  ✓ Replay bookmark created: [Round ${bm1.round}] "${bm1.label}"`);

  // 2. Add Annotation
  const ann1 = manager.addAnnotation('agent_0', 0, 'patient_zero', 'Originator of unverified deposit freeze rumor', 'Lead-Analyst-Vance');
  assert(manager.getAnnotationsForAgent('agent_0').length === 1, 'Annotation must be retrievable by agentId');
  console.log(`  ✓ Node annotation created: [${ann1.tag}] on ${ann1.agentId}`);

  // 3. Pin Evidence
  const ev1 = manager.pinEvidence(
    'R0 Surge at Tick 4',
    'r0_spike',
    4,
    { peakR0: 3.4, infectedFraction: 0.28, velocity: 14 },
    'Transmission velocity exceeded institutional debunking capacity by 3.2x',
    'Senior-Analyst-Chen'
  );
  assert(manager.getPinnedEvidence().length === 1, 'Pinned evidence must be recorded');
  console.log(`  ✓ Pinned evidence logged: "${ev1.title}"`);

  // 4. Add Review Comments
  const comm1 = manager.addComment('Senior-Analyst-Chen', 'Have we checked whether bridge inoculation at Tick 2 would prevent this?');
  const comm2 = manager.addComment('Lead-Analyst-Vance', 'Yes, simulation branch B shows 78.4% containment.', comm1.id);
  manager.markCommentStatus(comm1.id, 'addressed');
  assert(manager.getInvestigation().comments.length === 2, 'Two comments must be present');
  assert(manager.getInvestigation().comments[0].status === 'addressed', 'Comment status must update to addressed');
  console.log('  ✓ Threaded review comments verified with resolution status');

  // 5. Record Scenario Comparison
  manager.recordComparison(
    'Baseline Unmitigated',
    'Bridge Inoculation @ Tick 2',
    78.4,
    'Targeting 3 inter-community brokers extinguished transmission before retail cluster adoption.'
  );
  assert(manager.getInvestigation().comparisonHistory.length === 1, 'Comparison must be recorded');

  // 6. Test JSON Export & Import Parity
  const exportedJSON = manager.exportPackage();
  assert(exportedJSON.includes('Operation Silicon Ripple'), 'Export must contain title');

  const restoredManager = InvestigationManager.importPackage(exportedJSON);
  const restoredInv = restoredManager.getInvestigation();
  assert(restoredInv.title === manager.getInvestigation().title, 'Restored title must match');
  assert(restoredInv.bookmarks.length === 1, 'Restored bookmarks count must match');
  assert(restoredInv.annotations.length === 1, 'Restored annotations count must match');
  assert(restoredInv.pinnedEvidence.length === 1, 'Restored evidence count must match');
  assert(restoredInv.comments.length === 2, 'Restored comments count must match');
  console.log('  ✓ Full offline serialization & import parity validated.');

  console.log('✓ Analyst Collaboration Layer validated successfully.\n');
}
