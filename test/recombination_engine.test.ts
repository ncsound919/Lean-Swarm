import {
  GenePool,
  RecombinationEngine,
  Gene,
  Genome,
  Signature,
  Operators,
  GateFailure,
  gateInterfaceCompatibility,
  gateDimensionConservation,
  gateBarrierConstraints,
  gateRemainderRule,
  fitnessScore,
  FitnessReport,
  seedPool,
  defaultGenePool
} from '../server/recombinationEngine';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

export async function runRecombinationEngineTest(): Promise<void> {
  console.log('[RECOMBINATION ENGINE TEST] Starting test suite...');

  // 1. Initialize fresh GenePool & RecombinationEngine
  const pool = new GenePool();
  seedPool(pool);
  assert(pool.genes.size === 9, 'Initial seed pool must contain 9 genes');

  const engine = new RecombinationEngine(pool, 42, 64);

  // 2. Test Operator 1: transfer (Analogy Engine)
  const strategyWeil = pool.genes.get('g_weil_pos')!;
  const systemEc = pool.genes.get('g_ec_lfunc')!;
  const transferGenome = Operators.transfer(strategyWeil, systemEc);
  assert(transferGenome !== null, 'Transfer operator should succeed on strategyWeil -> systemEc');
  assert(
    transferGenome!.instantiatedTemplate.includes('TRANSFER[weil_positivity -> elliptic_curve_L]'),
    'Transfer template signature match'
  );

  // Test Transfer 2: YM transfer_matrix_gap -> NS ns_semigroup
  const strategyGap = pool.genes.get('g_transfer_gap')!;
  const systemNs = pool.genes.get('g_ns_semigroup')!;
  const transferNs = Operators.transfer(strategyGap, systemNs);
  assert(transferNs !== null, 'Transfer operator should succeed on YM transfer_matrix_gap -> NS ns_semigroup');

  // 3. Test Operator 2: compose (Pipelines)
  const geneInterval = pool.genes.get('g_interval')!;
  const geneHilbertPolya = pool.genes.get('g_hilbert_polya')!;
  const composeGenome = Operators.compose(geneInterval, geneHilbertPolya);
  assert(composeGenome !== null, 'Compose operator should succeed on interval -> hilbert_polya');
  assert(composeGenome!.instantiatedTemplate.includes('∘'), 'Compose template signature match');

  // 4. Test Operator 3: substitute (Slot Filling)
  const hostPolya = pool.genes.get('g_hilbert_polya')!;
  const donorInterval = pool.genes.get('g_interval')!;
  const substituteGenome = Operators.substitute(hostPolya, donorInterval, 'global');
  assert(substituteGenome !== null, 'Substitute operator should fill slot');

  // 5. Test Operator 4: dualize (Order/Quantifier Flips)
  const dualGenome = Operators.dualize(strategyWeil);
  assert(dualGenome !== null, 'Dualize operator should succeed on dualizable gene');
  assert(dualGenome!.instantiatedTemplate.startsWith('DUAL('), 'Dualize template match');

  const nonDualizable = pool.genes.get('g_explicit_formula')!;
  assert(Operators.dualize(nonDualizable) === null, 'Dualize operator should fail on non-dualizable gene');

  // 6. Test Operator 5: perturb (Parameter Sweeps)
  const paramGene = new Gene({
    id: 'g_param_test',
    kind: 'formula',
    name: 'energy_exponent',
    domain: 'pde',
    signature: {
      inputSorts: ['vorticity_field'],
      outputSort: 'blowup_certificate',
      typeParams: { exponent: '3.0' }
    },
    template: 'H^s norm bound with exponent',
    slots: []
  });
  const perturbGenome = Operators.perturb(paramGene, 'exponent', 0.5);
  assert(perturbGenome !== null, 'Perturb operator should succeed on typeParam');
  assert(perturbGenome!.instantiatedTemplate.includes('exponent += 0.5'), 'Perturb template match');

  // 7. Test Legality Gate 1: gateInterfaceCompatibility
  const incompatibleGene = new Gene({
    id: 'g_incompatible',
    kind: 'formula',
    name: 'incompatible_output',
    domain: 'test',
    signature: { inputSorts: ['unmatched_sort'], outputSort: 'bogus_output' },
    template: 'bogus',
    slots: []
  });
  let gateErrorCaught = false;
  try {
    gateInterfaceCompatibility([incompatibleGene, strategyWeil]);
  } catch (e: any) {
    gateErrorCaught = true;
    assert(e instanceof GateFailure, 'Gate failure error type');
  }
  assert(gateErrorCaught, 'Incompatible interface sorts must be rejected by gate');

  // 8. Test Legality Gate 2: gateDimensionConservation
  const conflictingGene = new Gene({
    id: 'g_conflict',
    kind: 'formula',
    name: 'conflicting_units',
    domain: 'pde',
    signature: {
      inputSorts: ['vorticity_field'],
      outputSort: 'blowup_certificate',
      typeParams: { exponent: '2.0' }
    },
    template: 'conflict',
    slots: []
  });
  const conflictGenome = new Genome({
    genes: [paramGene, conflictingGene],
    operators: ['compose'],
    instantiatedTemplate: 'conflict',
    domainPath: ['pde']
  });
  let dimErrorCaught = false;
  try {
    gateDimensionConservation(conflictGenome);
  } catch (e: any) {
    dimErrorCaught = true;
    assert(e instanceof GateFailure, 'Gate failure error type');
  }
  assert(dimErrorCaught, 'Dimension/type parameter conflict must be rejected by gate');

  // 9. Test Legality Gate 3: gateBarrierConstraints
  const barrierTaintedGene = new Gene({
    id: 'g_tainted',
    kind: 'strategy',
    name: 'tainted_complexity',
    domain: 'complexity',
    signature: { inputSorts: ['representation'], outputSort: 'obstruction_polynomial' },
    template: 'tainted',
    slots: [],
    techniqueTags: new Set(['natural_property'])
  });
  const taintedGenome = new Genome({
    genes: [barrierTaintedGene],
    operators: ['test'],
    instantiatedTemplate: 'tainted',
    domainPath: ['complexity']
  });
  let barrierErrorCaught = false;
  try {
    gateBarrierConstraints(taintedGenome);
  } catch (e: any) {
    barrierErrorCaught = true;
    assert(e instanceof GateFailure, 'Gate failure error type');
  }
  assert(barrierErrorCaught, 'Barrier-tainted complexity hybrid must be rejected by gate');

  // 10. Test Legality Gate 4: gateRemainderRule
  const unremainderedGenome = new Genome({
    genes: [pool.genes.get('g_transfer_gap')!],
    operators: ['test'],
    instantiatedTemplate: 'global claim without remainder',
    domainPath: ['lattice_gauge']
  });
  let remainderErrorCaught = false;
  try {
    gateRemainderRule(unremainderedGenome);
  } catch (e: any) {
    remainderErrorCaught = true;
    assert(e instanceof GateFailure, 'Gate failure error type');
  }
  assert(remainderErrorCaught, 'Global strategy claim without remainder bound must be rejected by gate');

  // 11. Test Calibration Battery & Fitness Function
  const calScore = engine.runCalibrationBattery(composeGenome!);
  assert(calScore >= 1, 'Compose genome should score in calibration battery');

  const report: FitnessReport = {
    survivedFalsification: true,
    trialsSurvived: 1000,
    novelVsLibrary: true,
    rederivedKnownTheorems: calScore,
    certificateBitWidth: 100000,
    producedLeanScaffold: true
  };
  const score = fitnessScore(report);
  assert(score > 5.0, 'Calibrated surviving hybrid should earn high fitness score');

  // 12. Test Proposal Generation & Mining Cycle
  const candidateGenomes = engine.proposeGeneration(10);
  assert(candidateGenomes.length > 0, 'Engine must propose legal candidate genomes');

  const scoredCandidates = candidateGenomes.map((g) => {
    const cScore = engine.runCalibrationBattery(g);
    return {
      genome: g,
      report: {
        survivedFalsification: true,
        trialsSurvived: 500,
        novelVsLibrary: true,
        rederivedKnownTheorems: cScore,
        certificateBitWidth: 200000,
        producedLeanScaffold: true
      }
    };
  });

  const initialPoolSize = pool.genes.size;
  engine.ingestResults(scoredCandidates);

  assert(
    pool.genes.size > initialPoolSize,
    'Ingesting calibrated surviving hybrids must mine new genes into pool'
  );
  assert(engine.population.length > 0, 'Engine population must hold top surviving hybrids');
  assert(engine.lineageLedger.length > 0, 'Lineage ledger must record recombination events');

  const engineData = engine.getData();
  assert(engineData.minedGeneCount > 0, 'Telemetry must report mined gene count');
  assert(engineData.topFitness > 0, 'Telemetry must report positive top fitness');

  console.log(`✔ [RECOMBINATION ENGINE TEST PASSED] Verified 5 crossover operators, 4 legality gates, calibration battery score (${calScore}), mining (${engineData.minedGeneCount} new genes mined), and lineage ledger.`);
}
