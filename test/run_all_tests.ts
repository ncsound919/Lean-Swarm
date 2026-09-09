import { testLeanIntegrityGate } from './lean_integrity_gate.test';
import { testKernelCompiler } from './kernel_compiler.test';
import { testDeterministicCore } from './deterministic_core.test';
import { testMCHEEngine } from './mche_engine.test';
import { testSecurityConfigs } from './security_configs.test';
import { testGithubSwarmAndForceMultipliers } from './github_swarm_force_multipliers.test';

async function runAllTests() {
  console.log('===========================================================');
  console.log('  LEAN SWARM ORCHESTRATOR - DETERMINISTIC VERIFICATION GATES');
  console.log('===========================================================\n');

  const tests = [
    { name: 'Lean Integrity Gate (Zero-Sorry & Proof AST)', fn: testLeanIntegrityGate },
    { name: 'Kernel-Certificate Compiler & Conductor Loop', fn: testKernelCompiler },
    { name: 'Deterministic Core (PSLQ, SMT Farkas, Buchberger, Intervals)', fn: testDeterministicCore },
    { name: 'Monte Carlo Hyper-Tree Engine (MCHE & UCT)', fn: testMCHEEngine },
    { name: 'Security & Configuration Provenance Gate', fn: testSecurityConfigs },
    { name: 'GitHub Swarm Ledger & Force-Multipliers (ETP / Arena / Market / Golf)', fn: testGithubSwarmAndForceMultipliers },
  ];

  let allPassed = true;
  let passedCount = 0;

  for (const test of tests) {
    process.stdout.write(`[RUNNING] ${test.name}... `);
    try {
      const result = test.fn();
      if (result.passed) {
        console.log('✔ PASSED');
        console.log(`          ${result.message}`);
        passedCount++;
      } else {
        console.log('✖ FAILED');
        console.error(`          ${result.message}`);
        allPassed = false;
      }
    } catch (err: any) {
      console.log('✖ ERROR');
      console.error(`          Exception: ${err?.message || err}`);
      allPassed = false;
    }
    console.log('-----------------------------------------------------------');
  }

  console.log(`\nSUMMARY: ${passedCount}/${tests.length} test suites passed.`);
  if (!allPassed) {
    console.error('VERIFICATION GATE FAILED.');
    process.exit(1);
  } else {
    console.log('ALL VERIFICATION GATES PASSED CLEANLY.');
    process.exit(0);
  }
}

runAllTests();
