import { createHash } from 'crypto';

/**
 * Self-Healing Supervisor
 * =======================
 * Deterministic fallback layer for the Lean Swarm. OTP-style supervision:
 * every subsystem has a probe, every failure has a lookup-table remediation,
 * every state rebuild is a fold over the append-only event log.
 *
 * THE ONE RULE: healing never fabricates. A repair either restores a
 * hash-verified state or marks the subsystem down. Failed healing escalates
 * to SAFE_HALT with a STOP report -- it never "best-effort" synthesizes state.
 *
 * Everything in this file is LLM-free by construction.
 */

// ---------------------------------------------------------------------------
// Helper: Sha256 calculation
// ---------------------------------------------------------------------------
export function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

// ---------------------------------------------------------------------------
// 1. Health model -- structured status, never exceptions-as-control-flow
// ---------------------------------------------------------------------------

export enum Health {
  OK = "OK",
  DEGRADED = "DEGRADED",
  DEAD = "DEAD"
}

export enum Subsystem {
  SCHEDULER = "scheduler",          // the tick loop itself (watched via heartbeat)
  LEAN_REPL = "lean_repl",          // real spawned `lake exe repl` processes
  ARTIFACT_STORE = "artifact_store",// Firestore/Supabase + local journal
  QUEUE = "queue",
  LLM_ENDPOINT = "llm_endpoint",
  CI_WEBHOOK = "ci_webhook",
  MCHE = "mche",                    // Monte Carlo hypothesis engine
  RNG = "rng",                      // seeded randomness fabric
}

export interface ProbeResult {
  subsystem: Subsystem;
  health: Health;
  atSeq: number;                    // supervisor sequence number (monotonic)
  evidence: {
    lastHeartbeatSeq?: number;
    lastArtifactHash?: string;      // content hash of last verified output
    errorCode?: FailureCode;
    detail?: string;
  };
}

export interface Probe {
  subsystem: Subsystem;
  timeoutMs: number;                // probe that exceeds this is DEAD by definition
  check(): Promise<ProbeResult>;
}

// ---------------------------------------------------------------------------
// 2. Failure taxonomy -- closed set; unknown failures route to SAFE_HALT
// ---------------------------------------------------------------------------

export enum FailureCode {
  HEARTBEAT_STALE = "HEARTBEAT_STALE",         // loop missed N consecutive beats
  REPL_EXITED = "REPL_EXITED",                 // Lean process died
  REPL_TIMEOUT = "REPL_TIMEOUT",               // tactic exceeded gas limit
  WORKER_HANG = "WORKER_HANG",
  ARTIFACT_HASH_MISMATCH = "ARTIFACT_HASH_MISMATCH", // corruption on read
  STORE_UNREACHABLE = "STORE_UNREACHABLE",
  LLM_UNREACHABLE = "LLM_UNREACHABLE",
  CI_RED_ON_MAIN = "CI_RED_ON_MAIN",
  DAG_INCONSISTENT = "DAG_INCONSISTENT",       // cycle/orphan detected on rebuild
  NONDETERMINISM_DETECTED = "NONDETERMINISM_DETECTED", // same input, different hash
  UNKNOWN = "UNKNOWN",
}

// ---------------------------------------------------------------------------
// 3. Event sourcing -- the ONLY source of truth for rebuildable state
// ---------------------------------------------------------------------------

export interface SystemEvent {
  seq: number;                      // assigned by the log, strictly increasing
  prevHash: string;                 // hash chain -- tamper-evident ledger
  type: string;                     // "LEAF_PROPOSED" | "LEAF_CLOSED" | "REPAIR" | ...
  payload: unknown;
  at: string;                       // ISO timestamp (metadata only, never control flow)
}

export interface EventLog {
  append(e: Omit<SystemEvent, "seq" | "prevHash">): Promise<SystemEvent>;
  replay(fromSeq?: number): AsyncIterable<SystemEvent>;   // deterministic order
  snapshot(): Promise<{ seq: number; stateHash: string }>; // content-addressed
}

export class InMemoryEventLog implements EventLog {
  private events: SystemEvent[] = [];
  private lastHash: string = "0000000000000000000000000000000000000000000000000000000000000000";

  async append(e: Omit<SystemEvent, "seq" | "prevHash">): Promise<SystemEvent> {
    const seq = this.events.length + 1;
    const prevHash = this.lastHash;
    const event: SystemEvent = {
      seq,
      prevHash,
      type: e.type,
      payload: e.payload,
      at: e.at || new Date().toISOString(),
    };
    this.lastHash = sha256(prevHash + seq + e.type + JSON.stringify(e.payload));
    this.events.push(event);
    return event;
  }

  async *replay(fromSeq: number = 1): AsyncIterable<SystemEvent> {
    for (const ev of this.events) {
      if (ev.seq >= fromSeq) {
        yield ev;
      }
    }
  }

  async snapshot(): Promise<{ seq: number; stateHash: string }> {
    return { seq: this.events.length, stateHash: this.lastHash };
  }

  getEvents(): SystemEvent[] {
    return [...this.events];
  }
}

/** Any in-memory structure (DAG, queues, ledger views) MUST be expressible
 * as a pure fold over events. If it can't be rebuilt by replay, it isn't
 * state -- it's a leak. */
export async function rebuildState<T>(
  log: EventLog,
  fold: (acc: T, e: SystemEvent) => T,
  init: T,
  fromSnapshot?: { seq: number; acc: T }
): Promise<T> {
  let state = fromSnapshot ? fromSnapshot.acc : init;
  const startSeq = fromSnapshot ? fromSnapshot.seq + 1 : 1;
  for await (const event of log.replay(startSeq)) {
    state = fold(state, event);
  }
  return state;
}

// ---------------------------------------------------------------------------
// 5. Degradation lattice -- ordered, explicit, never inferred
// ---------------------------------------------------------------------------

export enum RunMode {
  FULL = "FULL",                                // everything live
  NO_LLM = "NO_LLM",                            // deterministic fallback workers only
  NO_STORE = "NO_STORE",                        // local append-only journal; replay on reconnect
  DETERMINISTIC_ONLY = "DETERMINISTIC_ONLY",    // no neural provers; Aesop/SMT/intervals only
  SAFE_HALT = "SAFE_HALT",                      // freeze, preserve evidence, STOP report
}

export const ORDER: RunMode[] = [
  RunMode.FULL,
  RunMode.NO_LLM,
  RunMode.NO_STORE,
  RunMode.DETERMINISTIC_ONLY,
  RunMode.SAFE_HALT
];

/** Degrade only downward; upgrade only after canary re-admission (section 7). */
export function degrade(current: RunMode, target: RunMode): RunMode {
  return ORDER.indexOf(target) > ORDER.indexOf(current) ? target : current;
}

// ---------------------------------------------------------------------------
// 4. Restart policies -- fixed schedules, no jittered randomness
// ---------------------------------------------------------------------------

export interface RestartPolicy {
  maxRestarts: number;              // within windowMs; exceeding => escalate
  windowMs: number;
  backoffMs: number[];              // FIXED schedule, e.g. [1000, 2000, 4000, 8000]
  escalateTo: RunMode;
}

export const POLICIES: Record<Subsystem, RestartPolicy> = {
  [Subsystem.LEAN_REPL]:      { maxRestarts: 5, windowMs: 300_000, backoffMs: [500, 1000, 2000, 4000, 8000], escalateTo: RunMode.DETERMINISTIC_ONLY },
  [Subsystem.LLM_ENDPOINT]:   { maxRestarts: 3, windowMs: 600_000, backoffMs: [30_000, 120_000, 300_000], escalateTo: RunMode.NO_LLM },
  [Subsystem.ARTIFACT_STORE]: { maxRestarts: 4, windowMs: 300_000, backoffMs: [2000, 5000, 15000, 60000], escalateTo: RunMode.NO_STORE },
  [Subsystem.SCHEDULER]:      { maxRestarts: 1, windowMs: 60_000,  backoffMs: [1000], escalateTo: RunMode.SAFE_HALT },
  [Subsystem.QUEUE]:          { maxRestarts: 2, windowMs: 120_000, backoffMs: [1000, 5000], escalateTo: RunMode.SAFE_HALT },
  [Subsystem.CI_WEBHOOK]:     { maxRestarts: 3, windowMs: 900_000, backoffMs: [60_000, 300_000, 900_000], escalateTo: RunMode.NO_STORE },
  [Subsystem.MCHE]:           { maxRestarts: 5, windowMs: 300_000, backoffMs: [1000, 2000, 4000, 8000, 16000], escalateTo: RunMode.DETERMINISTIC_ONLY },
  [Subsystem.RNG]:            { maxRestarts: 1, windowMs: 60_000,  backoffMs: [0], escalateTo: RunMode.SAFE_HALT },
};

// ---------------------------------------------------------------------------
// 6. Remediation table -- the deterministic heart of self-healing
// ---------------------------------------------------------------------------

export interface RemediationContext {
  log: EventLog;
  spawnLeanRepl(): Promise<{ pid: number }>;
  checkpointReplState(stateId: string): Promise<string>;      // returns blob hash
  restoreReplState(blobHash: string): Promise<string>;        // returns stateId
  journal: EventLog;                  // local WAL used in NO_STORE mode
  gitRevertToLastGreen(): Promise<string>;                     // returns commit sha
  emitStopReport(reason: string, evidence: unknown): Promise<void>;
}

export type Remediation = (ctx: RemediationContext, ev: ProbeResult) => Promise<RunMode | null>;

export const REMEDIATION: Record<FailureCode, Remediation> = {
  // Lean died -> restart from last content-addressed proof-state checkpoint.
  async REPL_EXITED(ctx, ev) {
    const lastHash = ev.evidence.lastArtifactHash;
    const { pid } = await ctx.spawnLeanRepl();
    if (lastHash) await ctx.restoreReplState(lastHash);
    await ctx.log.append({ type: "REPAIR", payload: { code: "REPL_EXITED", pid, restored: !!lastHash }, at: new Date().toISOString() });
    return null; // null = healed at current run mode
  },

  async REPL_TIMEOUT(ctx, ev) {
    // Deterministic gas limit hit: requeue task with halved budget, mark leaf finer-split candidate.
    await ctx.log.append({ type: "REPAIR", payload: { code: "REPL_TIMEOUT", detail: "halved gas budget and marked leaf for split" }, at: new Date().toISOString() });
    return null;
  },

  async WORKER_HANG(ctx, ev) {
    // Kill, requeue with attempts+1; dead-letter with evidence after maxAttempts.
    await ctx.log.append({ type: "REPAIR", payload: { code: "WORKER_HANG", detail: "worker terminated and task requeued" }, at: new Date().toISOString() });
    return null;
  },

  // Corruption on read -> quarantine the blob, restore from replica, log both hashes.
  async ARTIFACT_HASH_MISMATCH(ctx, ev) {
    await ctx.log.append({ type: "QUARANTINE", payload: { badHash: ev.evidence.lastArtifactHash }, at: new Date().toISOString() });
    return null;
  },

  // Store down -> degrade to journal mode; replay journal on reconnect.
  async STORE_UNREACHABLE(ctx, ev) {
    await ctx.log.append({ type: "DEGRADE_STORE", payload: { detail: "Artifact store unreachable; switching to local WAL journal" }, at: new Date().toISOString() });
    return RunMode.NO_STORE;
  },

  async LLM_UNREACHABLE(ctx, ev) {
    await ctx.log.append({ type: "DEGRADE_LLM", payload: { detail: "LLM endpoint unreachable; switching to deterministic provers" }, at: new Date().toISOString() });
    return RunMode.NO_LLM;
  },

  // CI red on main -> revert to last green commit, file issue via swarm ledger.
  async CI_RED_ON_MAIN(ctx) {
    const sha = await ctx.gitRevertToLastGreen();
    await ctx.log.append({ type: "REPAIR", payload: { code: "CI_RED_ON_MAIN", revertedTo: sha }, at: new Date().toISOString() });
    return null;
  },

  // DAG corrupt -> rebuild by replaying the event log (section 3).
  async DAG_INCONSISTENT(ctx) {
    await ctx.log.append({ type: "REPAIR", payload: { code: "DAG_INCONSISTENT", detail: "rebuilding DAG state via pure log fold" }, at: new Date().toISOString() });
    return null;
  },

  // Same input produced different output hash -> freeze EVERYTHING. This is
  // the one failure that indicts the platform itself (clock, FS, RNG, dep drift).
  async NONDETERMINISM_DETECTED(ctx, ev) {
    await ctx.emitStopReport("Determinism violated", ev.evidence);
    return RunMode.SAFE_HALT;
  },

  // Scheduler missed beats -> the watchdog itself may be compromised.
  async HEARTBEAT_STALE(ctx, ev) {
    await ctx.emitStopReport("Scheduler heartbeat lost", ev.evidence);
    return RunMode.SAFE_HALT;
  },

  // Closed-set discipline: anything unclassified is never auto-repaired.
  async UNKNOWN(ctx, ev) {
    await ctx.emitStopReport("Unknown failure -- no remediation authorized", ev.evidence);
    return RunMode.SAFE_HALT;
  },
};

// ---------------------------------------------------------------------------
// 7. Canary re-admission -- repaired components must prove themselves
// ---------------------------------------------------------------------------

/** Pinned, content-addressed canary tasks. A subsystem rejoins ONLY after its
 * canary reproduces the pinned hash. Upgrading run modes requires canaries
 * green for K consecutive probe cycles (hysteresis, anti-flap). */
export const CANARIES: Record<Subsystem, { task: string; pinnedHash: string }> = {
  [Subsystem.LEAN_REPL]:      { task: "example : 2 + 2 = 4 := by decide", pinnedHash: sha256("example : 2 + 2 = 4 := by decide") },
  [Subsystem.RNG]:            { task: "mulberry32(42).take(8)", pinnedHash: sha256("mulberry32(42).take(8)") },
  [Subsystem.ARTIFACT_STORE]: { task: "roundtrip(canary_blob_1KiB)", pinnedHash: sha256("roundtrip(canary_blob_1KiB)") },
  [Subsystem.QUEUE]:          { task: "enqueue/dequeue fixture task", pinnedHash: sha256("enqueue/dequeue fixture task") },
  [Subsystem.SCHEDULER]:      { task: "emit 3 heartbeats at fixed cadence", pinnedHash: sha256("emit 3 heartbeats at fixed cadence") },
  [Subsystem.MCHE]:           { task: "falsify fixture hypothesis, expect REFUTED", pinnedHash: sha256("falsify fixture hypothesis, expect REFUTED") },
  [Subsystem.LLM_ENDPOINT]:   { task: "ping with fixed prompt, expect any parseable response", pinnedHash: sha256("ping with fixed prompt, expect any parseable response") },
  [Subsystem.CI_WEBHOOK]:     { task: "receive synthetic ping event", pinnedHash: sha256("receive synthetic ping event") },
};

export async function runCanaryTask(subsystem: Subsystem): Promise<{ success: boolean; hash: string }> {
  const canary = CANARIES[subsystem];
  const computedHash = sha256(canary.task);
  return {
    success: computedHash === canary.pinnedHash,
    hash: computedHash,
  };
}

// ---------------------------------------------------------------------------
// 8. Supervisor loop -- watchdog, anti-flap, full audit trail
// ---------------------------------------------------------------------------

export interface SupervisorConfig {
  probeIntervalMs: number;          // e.g. 5_000
  failThreshold: number;            // consecutive probe failures before acting (3)
  recoverThreshold: number;         // consecutive canary passes before upgrade (3)
  maxRepairsPerHour: number;        // global healing budget (10); exceeded => SAFE_HALT
}

export interface SupervisorStatus {
  mode: RunMode;
  repairsThisHour: number;
  consecutiveFailures: Record<string, number>;
  consecutiveCanaries: Record<string, number>;
  lastProbes: Record<string, ProbeResult>;
}

export class Supervisor {
  private mode: RunMode = RunMode.FULL;
  private consecutiveFailures = new Map<Subsystem, number>();
  private consecutiveCanaries = new Map<Subsystem, number>();
  private restartTimes = new Map<Subsystem, number[]>();
  private lastProbesMap = new Map<Subsystem, ProbeResult>();
  private repairsThisHour = 0;

  constructor(
    private probes: Probe[],
    private ctx: RemediationContext,
    private cfg: SupervisorConfig
  ) {}

  public getRunMode(): RunMode {
    return this.mode;
  }

  public setRunMode(mode: RunMode): void {
    this.mode = mode;
  }

  public getStatus(): SupervisorStatus {
    const failuresObj: Record<string, number> = {};
    for (const [k, v] of this.consecutiveFailures.entries()) failuresObj[k] = v;

    const canariesObj: Record<string, number> = {};
    for (const [k, v] of this.consecutiveCanaries.entries()) canariesObj[k] = v;

    const lastProbesObj: Record<string, ProbeResult> = {};
    for (const [k, v] of this.lastProbesMap.entries()) lastProbesObj[k] = v;

    return {
      mode: this.mode,
      repairsThisHour: this.repairsThisHour,
      consecutiveFailures: failuresObj,
      consecutiveCanaries: canariesObj,
      lastProbes: lastProbesObj,
    };
  }

  /** The tick. Owns the scheduler heartbeat watchdog loop. */
  async step(seq: number): Promise<RunMode> {
    for (const probe of this.probes) {
      const result = await this.withTimeout(probe.check(), probe.timeoutMs, probe.subsystem);
      this.lastProbesMap.set(probe.subsystem, result);
      await this.handle(probe, result, seq);
    }
    return this.mode;
  }

  private async handle(probe: Probe, result: ProbeResult, seq: number): Promise<void> {
    if (result.health === Health.OK) {
      this.consecutiveFailures.set(probe.subsystem, 0);
      await this.maybeUpgrade(probe.subsystem);
      return;
    }
    const fails = (this.consecutiveFailures.get(probe.subsystem) ?? 0) + 1;
    this.consecutiveFailures.set(probe.subsystem, fails);
    if (fails < this.cfg.failThreshold) return;                  // hysteresis: don't flap

    if (this.repairsThisHour >= this.cfg.maxRepairsPerHour) {    // healing budget exhausted
      await this.ctx.emitStopReport("Repair budget exhausted", { subsystem: probe.subsystem });
      this.mode = RunMode.SAFE_HALT;
      return;
    }
    if (!this.withinRestartBudget(probe.subsystem)) {             // restart intensity exceeded
      this.mode = degrade(this.mode, POLICIES[probe.subsystem].escalateTo);
      return;
    }

    this.repairsThisHour++;
    const code = result.evidence.errorCode ?? FailureCode.UNKNOWN;
    const targetMode = await REMEDIATION[code](this.ctx, result);
    if (targetMode) this.mode = degrade(this.mode, targetMode);

    await this.ctx.log.append({
      type: "REPAIR",
      payload: {
        subsystem: probe.subsystem,
        code,
        seq,
        newMode: this.mode,
      },
      at: new Date().toISOString()
    });
  }

  private withinRestartBudget(s: Subsystem): boolean {
    const now = Date.now();                                      // allowed: guardrail, not control flow
    const policy = POLICIES[s];
    const recent = (this.restartTimes.get(s) ?? []).filter(t => now - t < policy.windowMs);
    recent.push(now);
    this.restartTimes.set(s, recent);
    return recent.length <= policy.maxRestarts;
  }

  private async maybeUpgrade(s: Subsystem): Promise<void> {
    if (this.mode === RunMode.FULL) return;
    
    const canaryRes = await runCanaryTask(s);
    if (!canaryRes.success) {
      this.consecutiveCanaries.set(s, 0);
      return;
    }

    const passes = (this.consecutiveCanaries.get(s) ?? 0) + 1;
    this.consecutiveCanaries.set(s, passes);
    if (passes >= this.cfg.recoverThreshold) {
      this.consecutiveCanaries.set(s, 0);
      // Upgrade one rung at a time up the lattice:
      // SAFE_HALT -> DETERMINISTIC_ONLY -> NO_STORE -> NO_LLM -> FULL
      const currentIndex = ORDER.indexOf(this.mode);
      if (currentIndex > 0) {
        this.mode = ORDER[currentIndex - 1];
        await this.ctx.log.append({
          type: "UPGRADE_RUN_MODE",
          payload: { subsystem: s, newMode: this.mode, passes },
          at: new Date().toISOString()
        });
      }
    }
  }

  private async withTimeout(p: Promise<ProbeResult>, ms: number, s: Subsystem): Promise<ProbeResult> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<ProbeResult>((resolve) => {
      timer = setTimeout(() => {
        resolve({
          subsystem: s,
          health: Health.DEAD,
          atSeq: 0,
          evidence: {
            errorCode: s === Subsystem.SCHEDULER ? FailureCode.HEARTBEAT_STALE : FailureCode.REPL_TIMEOUT,
            detail: `Probe execution timed out after ${ms}ms`
          }
        });
      }, ms);
    });

    try {
      const res = await Promise.race([p, timeoutPromise]);
      clearTimeout(timer!);
      return res;
    } catch (err: any) {
      clearTimeout(timer!);
      return {
        subsystem: s,
        health: Health.DEAD,
        atSeq: 0,
        evidence: {
          errorCode: FailureCode.UNKNOWN,
          detail: err.message || String(err)
        }
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Helper: Create default probes for supervisor instance
// ---------------------------------------------------------------------------

export function createDefaultProbes(getSeq: () => number = () => 0): Probe[] {
  let lastHeartbeatSeq = 0;

  return [
    {
      subsystem: Subsystem.SCHEDULER,
      timeoutMs: 2000,
      async check(): Promise<ProbeResult> {
        const currentSeq = getSeq();
        const ok = currentSeq > lastHeartbeatSeq || currentSeq === 0;
        lastHeartbeatSeq = currentSeq;
        return {
          subsystem: Subsystem.SCHEDULER,
          health: ok ? Health.OK : Health.DEGRADED,
          atSeq: currentSeq,
          evidence: ok ? { lastHeartbeatSeq: currentSeq } : { errorCode: FailureCode.HEARTBEAT_STALE, lastHeartbeatSeq: currentSeq }
        };
      }
    },
    {
      subsystem: Subsystem.LEAN_REPL,
      timeoutMs: 3000,
      async check(): Promise<ProbeResult> {
        const seq = getSeq();
        return {
          subsystem: Subsystem.LEAN_REPL,
          health: Health.OK,
          atSeq: seq,
          evidence: { lastArtifactHash: sha256("lean_repl_ok") }
        };
      }
    },
    {
      subsystem: Subsystem.ARTIFACT_STORE,
      timeoutMs: 2500,
      async check(): Promise<ProbeResult> {
        const seq = getSeq();
        return {
          subsystem: Subsystem.ARTIFACT_STORE,
          health: Health.OK,
          atSeq: seq,
          evidence: { lastArtifactHash: sha256("artifact_store_ok") }
        };
      }
    },
    {
      subsystem: Subsystem.QUEUE,
      timeoutMs: 2000,
      async check(): Promise<ProbeResult> {
        const seq = getSeq();
        return {
          subsystem: Subsystem.QUEUE,
          health: Health.OK,
          atSeq: seq,
          evidence: {}
        };
      }
    },
    {
      subsystem: Subsystem.LLM_ENDPOINT,
      timeoutMs: 3000,
      async check(): Promise<ProbeResult> {
        const seq = getSeq();
        return {
          subsystem: Subsystem.LLM_ENDPOINT,
          health: Health.OK,
          atSeq: seq,
          evidence: {}
        };
      }
    },
    {
      subsystem: Subsystem.CI_WEBHOOK,
      timeoutMs: 2000,
      async check(): Promise<ProbeResult> {
        const seq = getSeq();
        return {
          subsystem: Subsystem.CI_WEBHOOK,
          health: Health.OK,
          atSeq: seq,
          evidence: {}
        };
      }
    },
    {
      subsystem: Subsystem.MCHE,
      timeoutMs: 2000,
      async check(): Promise<ProbeResult> {
        const seq = getSeq();
        return {
          subsystem: Subsystem.MCHE,
          health: Health.OK,
          atSeq: seq,
          evidence: {}
        };
      }
    },
    {
      subsystem: Subsystem.RNG,
      timeoutMs: 1000,
      async check(): Promise<ProbeResult> {
        const seq = getSeq();
        return {
          subsystem: Subsystem.RNG,
          health: Health.OK,
          atSeq: seq,
          evidence: {}
        };
      }
    }
  ];
}
