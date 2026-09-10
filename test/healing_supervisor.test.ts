import { 
  Supervisor, 
  InMemoryEventLog, 
  createDefaultProbes, 
  RemediationContext, 
  RunMode,
  rebuildState,
  Subsystem,
  FailureCode,
  Health,
  Probe
} from '../server/healingSupervisor';
import { LeanSwarmOrchestrator } from '../server/orchestrator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runHealingSupervisorTest(): Promise<void> {
  let eventLog = new InMemoryEventLog();
  let journalLog = new InMemoryEventLog();
  let currentSeq = 0;

  const remediationCtx: RemediationContext = {
    log: eventLog,
    spawnLeanRepl: async () => ({ pid: 9999 }),
    checkpointReplState: async (stateId: string) => `blob_${stateId}`,
    restoreReplState: async (blobHash: string) => blobHash.replace('blob_', ''),
    journal: journalLog,
    gitRevertToLastGreen: async () => 'sha_head_123',
    emitStopReport: async () => {}
  };

  // 1. EventLog fold check using rebuildState
  await eventLog.append({ type: 'STEP_COMPLETED', payload: { seq: 1 }, at: new Date().toISOString() });
  await eventLog.append({ type: 'REPL_CRASHED', payload: { exitCode: 139 }, at: new Date().toISOString() });

  const folded = await rebuildState(eventLog, (acc, ev) => {
    if (ev.type === 'STEP_COMPLETED') acc.steps++;
    if (ev.type === 'REPL_CRASHED') acc.crashes++;
    return acc;
  }, { steps: 0, crashes: 0 });

  assert(folded.steps === 1, 'EventLog step count fold');
  assert(folded.crashes === 1, 'EventLog crash count fold');

  // 2. Probes check
  const probes = createDefaultProbes();
  assert(probes.length === 8, 'Probes count must be 8');

  for (const probe of probes) {
    const res = await probe.check();
    assert(res.subsystem === probe.subsystem, 'Probe subsystem match');
    assert([Health.OK, Health.DEGRADED, Health.DEAD].includes(res.health), 'Probe health status');
  }

  // 3. Degradation check
  const failingProbes: Probe[] = createDefaultProbes(() => ++currentSeq).map(p => {
    if (p.subsystem === Subsystem.LLM_ENDPOINT) {
      return {
        ...p,
        check: async () => ({
          subsystem: Subsystem.LLM_ENDPOINT,
          health: Health.DEAD,
          atSeq: currentSeq,
          latencyMs: 50,
          evidence: { errorCode: FailureCode.LLM_UNREACHABLE, detail: '503 Service Unavailable' }
        })
      };
    }
    return p;
  });

  const supervisor = new Supervisor(failingProbes, remediationCtx, {
    probeIntervalMs: 1000,
    failThreshold: 2,
    recoverThreshold: 2,
    maxRepairsPerHour: 5
  });

  let mode = await supervisor.step(1);
  assert(mode === RunMode.FULL, 'Mode step 1 should remain FULL');

  mode = await supervisor.step(2);
  assert(mode === RunMode.NO_LLM, 'Mode step 2 should degrade to NO_LLM');

  // 4. Canary Recovery check
  let llmHealth: Health = Health.DEAD;
  const dynamicProbes: Probe[] = createDefaultProbes(() => ++currentSeq).map(p => {
    if (p.subsystem === Subsystem.LLM_ENDPOINT) {
      return {
        ...p,
        check: async () => ({
          subsystem: Subsystem.LLM_ENDPOINT,
          health: llmHealth,
          atSeq: currentSeq,
          latencyMs: 10,
          evidence: { errorCode: FailureCode.LLM_UNREACHABLE, detail: 'Dynamic LLM status test' }
        })
      };
    }
    return p;
  });

  const supervisor2 = new Supervisor(dynamicProbes, remediationCtx, {
    probeIntervalMs: 1000,
    failThreshold: 2,
    recoverThreshold: 2,
    maxRepairsPerHour: 5
  });

  await supervisor2.step(1);
  await supervisor2.step(2); // degrades to NO_LLM
  assert(supervisor2.getStatus().mode === RunMode.NO_LLM, 'Supervisor2 degraded to NO_LLM');

  llmHealth = Health.OK;
  await supervisor2.step(3); // canary pass 1
  const recMode = await supervisor2.step(4); // canary pass 2 -> recovers
  assert(recMode === RunMode.FULL, 'Supervisor2 recovered to FULL');

  // 5. Orchestrator Integration check
  const orchestrator = new LeanSwarmOrchestrator('gate9_test_swarm');
  const tickResult = await orchestrator.runConductorTick();
  assert(tickResult.mcheVisits > 0, 'Conductor tick executed MCHE visits');

  const supervisorStatus = orchestrator.getSupervisorStatus();
  assert(supervisorStatus !== undefined && supervisorStatus.mode === 'FULL', 'Orchestrator supervisor state verified');

  console.log('✔ PASSED');
  console.log('          Self-Healing Supervisor Gate PASSED: 8-subsystem probes, event-sourced WAL replay, degradation lattice, canary re-admission, and conductor loop integration verified.');
}
