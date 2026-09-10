import { GenePool, seedPool } from '../server/recombinationEngine';
import { SelfLearningEngine } from '../server/selfLearningEngine';
import { CrossDomainAnalyst } from '../server/crossDomainAnalyst';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

export async function runCrossDomainAnalystTest(): Promise<void> {
  console.log('[CROSS-DOMAIN ANALYST TEST] Starting test suite...');

  // 1. Initialize fresh GenePool, seed pool, and SelfLearningEngine
  const pool = new GenePool();
  seedPool(pool);
  
  const sle = new SelfLearningEngine();
  const analyst = new CrossDomainAnalyst(777);

  // 2. Perform deep structural cross-domain mapping and pathway extraction
  const { mappings, pathways } = analyst.analyze(pool);
  
  assert(mappings.length > 0, 'Analyst must discover cross-domain mappings');
  assert(pathways.length > 0, 'Analyst must construct cross-domain pathways');

  // Verify mappings details
  const mappingTypes = new Set(mappings.map(m => m.mappingType));
  assert(mappingTypes.has('isomorphism') || mappingTypes.has('functorial_transfer') || mappingTypes.has('pipeline_chain'), 'Must identify correct mapping types');
  
  const targetMappings = mappings.filter(m => m.mappingType === 'isomorphism');
  if (targetMappings.length > 0) {
    const firstIso = targetMappings[0];
    assert(firstIso.isomorphismStrength > 0, 'Isomorphism strength must be defined');
    assert(firstIso.sourceDomain !== firstIso.targetDomain, 'Isomorphism must span across distinct domains');
  }

  // 3. Test analyzeAndWire against SelfLearningEngine
  const initialHeuristicsCount = sle.getData().learnedHeuristics.length;
  const initialLogsCount = sle.getData().evolutionLog.length;

  const report = analyst.analyzeAndWire(pool, sle);

  assert(report.activeDomainsCount > 0, 'Report must show active domains');
  assert(report.domainIntersectionsCount > 0, 'Report must register cross-domain intersections');

  const finalHeuristicsCount = sle.getData().learnedHeuristics.length;
  const finalLogsCount = sle.getData().evolutionLog.length;

  assert(finalHeuristicsCount > initialHeuristicsCount, 'Wiring must prepend synthesized cross-domain heuristics');
  assert(finalLogsCount > initialLogsCount, 'Wiring must log cross-domain evolution events in log');

  // Check the synthesized heuristic details
  const synthesizedHeuristics = sle.getData().learnedHeuristics.filter(h => h.id.startsWith('H_CROSS_'));
  assert(synthesizedHeuristics.length > 0, 'Synthesized heuristics must bear cross ID prefix');
  assert(synthesizedHeuristics[0].ruleName.includes('CrossDomain-'), 'Rule name must follow cross-domain convention');
  assert(synthesizedHeuristics[0].confidence >= 0.90, 'Heuristic confidence must exceed 90%');

  console.log(`✔ [CROSS-DOMAIN ANALYST TEST PASSED] Verified cross-domain connections (${report.domainIntersectionsCount} intersections), pathway chains, and successfully wired ${report.synthesizedHeuristicsCount} synthesized heuristics into self-learning.`);
}
