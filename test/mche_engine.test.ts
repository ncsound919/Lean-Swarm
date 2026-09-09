import { 
  SeededRNG, 
  MonteCarloTester, 
  EvolutionarySearch, 
  MCTSConjectureSearch 
} from '../server/mcheEngine';
import { Hypothesis } from '../server/types';

export function testMCHEEngine(): { passed: boolean; message: string } {
  // 1. Test Deterministic PRNG
  const rng = new SeededRNG(42);
  const v1 = rng.nextFloat(0.0, 1.0);
  const rng2 = new SeededRNG(42);
  const v2 = rng2.nextFloat(0.0, 1.0);
  if (v1 !== v2) {
    return { passed: false, message: 'SeededRNG non-deterministic with identical seed' };
  }

  // 2. Test Monte Carlo Tester on hypothesis
  const mc = new MonteCarloTester(0.05, 50, 42);
  const testHypothesis: Hypothesis = {
    id: 'hyp_rh_test',
    statement_template: 'Hardy Z-function zeros along critical line',
    domain: 'analysis',
    parent_ids: [],
    generation_method: 'evolutionary',
    stage: 'generated',
    trial_count: 0,
    counterexample_count: 0,
    evidence_log: [],
    content_hash: 'abc123hash',
    createdAt: Date.now(),
    lastUpdated: Date.now()
  };

  const falsificationResult = mc.runFalsificationPass(testHypothesis, 20);
  if (falsificationResult.trial_count !== 20) {
    return { passed: false, message: `MonteCarloTester failed to run exact trial count: got ${falsificationResult.trial_count}` };
  }

  // 3. Test Evolutionary Search
  const evo = new EvolutionarySearch(8, 101);
  const newHyps = evo.evolveGeneration(2);
  if (!Array.isArray(newHyps)) {
    return { passed: false, message: 'EvolutionarySearch failed to return array of mutated programs' };
  }

  // 4. Test MCTS Conjecture Search
  const mcts = new MCTSConjectureSearch('Riemann Hypothesis Critical Strip Bound', 'analysis', 7);
  const root = mcts.root;
  if (!root || root.visits !== 0 || root.untriedActions.length === 0) {
    return { passed: false, message: 'MCTS Search root initialization invalid' };
  }
  const selected = mcts.select(root);
  if (!selected) {
    return { passed: false, message: 'MCTS Search node selection failed' };
  }

  return { passed: true, message: 'Monte Carlo & Tree Search tests PASSED: SeededRNG, MonteCarloTester, EvolutionarySearch, MCTS verified.' };
}
