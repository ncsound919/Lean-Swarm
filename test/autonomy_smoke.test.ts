import { globalOrchestrator } from '../server/orchestrator';
import { SwarmScheduler } from '../server/scheduler';

export async function runAutonomySmokeTest(): Promise<boolean> {
  console.log('[AUTONOMY SMOKE TEST] Initializing SwarmScheduler against globalOrchestrator...');

  const scheduler = new SwarmScheduler(globalOrchestrator, 100); // 100ms rapid tick for test
  scheduler.start();

  // Wait for 5 ticks to execute autonomously
  await new Promise(resolve => setTimeout(resolve, 600));
  scheduler.stop();

  const state = globalOrchestrator.getState();

  // Assertions
  if (state.ledger.length === 0) {
    throw new Error('Autonomy Test Failed: Proof ledger remains empty after tick cycle!');
  }

  const latestEntry = state.ledger[state.ledger.length - 1];
  if (!latestEntry.evidenceHash || latestEntry.evidenceHash.length < 8) {
    throw new Error('Autonomy Test Failed: Ledger entry missing valid evidenceHash provenance!');
  }

  if (state.lemmas.length === 0) {
    throw new Error('Autonomy Test Failed: Topological sub-lemma DAG empty!');
  }

  // Self-Learning & Self-Healing assertions
  if (!state.selfLearning || state.selfLearning.epoch <= 12) {
    throw new Error('Autonomy Test Failed: Self-learning system failed to advance epoch across system feedback channels!');
  }

  if (!state.selfLearning.detectedWeaknesses || state.selfLearning.detectedWeaknesses.length === 0) {
    throw new Error('Autonomy Test Failed: Self-healing system failed to detect system shortcomings/weaknesses!');
  }

  if (!state.selfLearning.autoRemediationStats || state.selfLearning.autoRemediationStats.totalResolved === 0) {
    throw new Error('Autonomy Test Failed: Self-healing system failed to auto-remediate detected shortcomings!');
  }

  if (!state.selfLearning.tacticWeights || state.selfLearning.tacticWeights.length === 0) {
    throw new Error('Autonomy Test Failed: Self-learning tactic weights empty!');
  }

  console.log(`✔ [AUTONOMY SMOKE TEST PASSED] Verified ${state.ledger.length} ledger events, ${state.lemmas.length} DAG nodes, ${state.selfLearning.autoRemediationStats.totalResolved} auto-healed weaknesses, and Self-Learning Epoch ${state.selfLearning.epoch} generated autonomously with 0 human input.`);
  return true;
}
