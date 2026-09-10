import { globalSubproblemEngine } from '../server/subproblemWorkflows';
import { LeanSwarmOrchestrator } from '../server/orchestrator';
import { SubproblemDomain } from '../src/types';

export async function runSubproblemWorkflowsTest(): Promise<void> {
  console.log('Testing Subproblem Agentic Workflows...');

  const domains: SubproblemDomain[] = [
    'analytic_nt',
    'pde',
    'qft',
    'tcs',
    'arithmetic_ag',
    'complex_ag',
    'geometric_topology'
  ];

  // 1. Test direct engine execution for all 7 subproblems
  for (const domain of domains) {
    const result = globalSubproblemEngine.executeDomainWorkflow(domain);
    if (!result.verified) {
      throw new Error(`Subproblem workflow verification failed for domain: ${domain}`);
    }
    if (result.leanSubLemmas.length === 0) {
      throw new Error(`No Lean sub-lemmas generated for domain: ${domain}`);
    }
    if (!result.casCertificate || !result.casCertificate.sha256Hash) {
      throw new Error(`Invalid CAS certificate for domain: ${domain}`);
    }
    if (!result.barrierCheck || !result.barrierCheck.passed) {
      throw new Error(`Barrier check failed for domain: ${domain}`);
    }
    console.log(`  ✓ ${domain.toUpperCase()}: ${result.title} [${result.casCertificate.engine}]`);
  }

  // 2. Test orchestrator integration
  const orchestrator = new LeanSwarmOrchestrator('test_subproblem_swarm', 'test_user', 'riemann_hypothesis');
  const state1 = orchestrator.executeSubproblemWorkflow('analytic_nt');
  if (!state1.subproblemResults || state1.subproblemResults.length === 0) {
    throw new Error('Orchestrator subproblemResults not updated');
  }
  if (state1.subproblemResults[0].domain !== 'analytic_nt') {
    throw new Error('Orchestrator domain mismatch');
  }

  // Test orchestrator domain resolution for Millennium problems
  const nsDomain = orchestrator.getDomainForProblemId('navier_stokes');
  if (nsDomain !== 'pde') throw new Error('Expected navier_stokes -> pde');

  const ymDomain = orchestrator.getDomainForProblemId('yang_mills');
  if (ymDomain !== 'qft') throw new Error('Expected yang_mills -> qft');

  const pnpDomain = orchestrator.getDomainForProblemId('p_vs_np');
  if (pnpDomain !== 'tcs') throw new Error('Expected p_vs_np -> tcs');

  const bsdDomain = orchestrator.getDomainForProblemId('bsd');
  if (bsdDomain !== 'arithmetic_ag') throw new Error('Expected bsd -> arithmetic_ag');

  const hodgeDomain = orchestrator.getDomainForProblemId('hodge');
  if (hodgeDomain !== 'complex_ag') throw new Error('Expected hodge -> complex_ag');

  const poincareDomain = orchestrator.getDomainForProblemId('poincare');
  if (poincareDomain !== 'geometric_topology') throw new Error('Expected poincare -> geometric_topology');

  // Test running conductor tick auto-triggers subproblem workflow on a fresh orchestrator
  const freshOrchestrator = new LeanSwarmOrchestrator('fresh_swarm', 'test_user', 'navier_stokes');
  if (freshOrchestrator.getState().subproblemResults?.length !== undefined) {
    // subproblemResults is undefined initially
  }
  await freshOrchestrator.runConductorTick();
  const freshStateAfter = freshOrchestrator.getState();
  if (!freshStateAfter.subproblemResults || freshStateAfter.subproblemResults.length === 0) {
    throw new Error('Conductor tick failed to auto-execute subproblem workflow on fresh orchestrator');
  }
  if (freshStateAfter.subproblemResults[0].domain !== 'pde') {
    throw new Error(`Expected pde domain for navier_stokes, got ${freshStateAfter.subproblemResults[0].domain}`);
  }

  console.log('  ✓ Conductor Tick Auto-Triggered PDE Subproblem Workflow for Navier-Stokes');
  console.log('✓ Subproblem Agentic Workflows Verification Suite PASSED');
}
