import { 
  runPSLQ, 
  EGraph,
  mutateTheorem,
  analyzeDagGaps,
  getAlwaysOnJobs,
  checkNoveltyAndNontriviality
} from '../server/deterministicEngines';
import { Lemma } from '../server/types';

export function testDeterministicCore(): { passed: boolean; message: string } {
  // 1. Test PSLQ algorithm on integer relation
  const pslqResult = runPSLQ([2.0, 4.0, 6.0], 50);
  if (!pslqResult || typeof pslqResult.found !== 'boolean') {
    return { passed: false, message: 'PSLQ failed to produce valid result structure' };
  }

  // 2. Test EGraph Equality Saturation
  const egraph = new EGraph();
  const id1 = egraph.addExpr('(add a b)');
  const id2 = egraph.addExpr('(add a b)');
  if (id1 !== id2) {
    return { passed: false, message: 'EGraph hashconsing failed on identical expressions' };
  }
  const id3 = egraph.addExpr('(add b a)');
  egraph.union(id1, id3);
  if (egraph.find(id1) !== egraph.find(id3)) {
    return { passed: false, message: 'EGraph union failed to equate classes' };
  }

  // 3. Test Rule-based Theorem Mutator
  const testLemma: Lemma = {
    id: 'L1',
    title: 'Test Inequality',
    statement: 'theorem test_ineq (x : ℝ) : x > 0 → x + 1 > 1',
    status: 'pending',
    dependencies: []
  };
  const mutations = mutateTheorem(testLemma);
  if (mutations.length === 0) {
    return { passed: false, message: 'Theorem mutator produced 0 mutations for inequality statement' };
  }

  // 4. Test DAG Gap Analysis
  const lemmas: Lemma[] = [
    { id: 'L1', title: 'Lemma 1', statement: 'True', status: 'verified', dependencies: [] },
    { id: 'L2', title: 'Lemma 2', statement: 'True', status: 'verified', dependencies: [] }
  ];
  const bridges = analyzeDagGaps(lemmas);
  if (bridges.length === 0) {
    return { passed: false, message: 'DAG Gap analysis failed to propose bridge between unlinked verified nodes' };
  }

  // 5. Test Always-On Workers registry
  const jobs = getAlwaysOnJobs();
  if (jobs.length < 5) {
    return { passed: false, message: 'Always-On workers registry missing Millennium Problem workers' };
  }

  return { passed: true, message: 'Deterministic Core tests PASSED: PSLQ, EGraph, Mutator, DAG Bridges, Workers verified.' };
}
