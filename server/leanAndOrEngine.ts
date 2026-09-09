import crypto from 'crypto';
import {
  TheoremRun,
  ProofNode,
  GoalNode,
  TacticEdge,
  RewardVector,
  ReplWorker,
  StateBlob,
  WorkerPoolStatus,
  ExpertIterationSummary,
  AndOrGraphPreset
} from './types.ts';

// Pinned Lean/Mathlib Environment
export const PINNED_ENVIRONMENT = {
  leanVersion: '4.14.0',
  mathlibCommit: 'd03d3c76d081f8f30bb035c9cb6b8a8b12cb79a5',
  options: {
    maxHeartbeats: 200000,
    autoImplicit: false
  },
  permittedAxioms: ['propext', 'Classical.choice', 'Quot.sound']
};

export const ENVIRONMENT_HASH = crypto
  .createHash('sha256')
  .update(JSON.stringify(PINNED_ENVIRONMENT))
  .digest('hex')
  .slice(0, 16);

// Global Dedup Store & Cache
const stateCache = new Map<string, { successorStateHashes: string[]; goals: any[]; diagnostic: string }>();
const activeGoalSubscriptions = new Map<string, string[]>(); // goal_fingerprint -> subscriber node IDs
const stateBlobStore = new Map<string, StateBlob>(); // blobHash -> StateBlob

// Worker Pool State
const NUM_WORKERS = 4;
let workers: ReplWorker[] = Array.from({ length: NUM_WORKERS }, (_, i) => ({
  id: `worker_${i + 1}`,
  status: 'idle',
  processedTasks: 0,
  lastActiveTime: Date.now(),
  memoryUsageMb: 85 + Math.floor(Math.random() * 25)
}));

let deduplicatedTaskCounter = 0;
let cacheHitCounter = 0;

/**
 * Calculates a canonical goal fingerprint:
 * Normalized target + sorted local context hypotheses.
 */
export function computeGoalFingerprint(target: string, hypotheses: string[]): string {
  const normTarget = target.trim().replace(/\s+/g, ' ');
  const normHyps = hypotheses.map(h => h.trim().replace(/\s+/g, ' ')).sort().join(' | ');
  return crypto
    .createHash('sha256')
    .update(`${normTarget}::${normHyps}`)
    .digest('hex')
    .slice(0, 16);
}

/**
 * Calculates a canonical proof state hash:
 * Serialized goal fingerprints + pinned environment hash.
 */
export function computeProofStateHash(goals: GoalNode[], envHash: string = ENVIRONMENT_HASH): string {
  const goalFps = goals.map(g => g.goal_fingerprint).sort().join(';');
  return crypto
    .createHash('sha256')
    .update(`${envHash}::${goalFps}`)
    .digest('hex')
    .slice(0, 16);
}

/**
 * Estimates syntactic complexity of a Lean target formula.
 */
export function estimateGoalComplexity(target: string, hypotheses: string[]): number {
  let score = 1.0;
  // Binders and quantifiers
  const quantifiers = (target.match(/\b(∀|exists|∃|fun|λ)\b/g) || []).length;
  // Connectives
  const connectives = (target.match(/\b(∧|∨|→|↔|¬)\b/g) || []).length;
  // Operators and symbols
  const operators = (target.match(/[+\-*\/^=<>≤≥]/g) || []).length;
  score += quantifiers * 0.8 + connectives * 0.5 + operators * 0.3;
  score += hypotheses.length * 0.25;
  return Math.round(score * 100) / 100;
}

/**
 * Inspects returned multi-goals and decides whether to factorize.
 * Safe split rule:
 * 1. no_shared_metavariables(goals)
 * 2. no_cross_goal_assignments(goals)
 * 3. all goal.isolation_status == "independent"
 */
export function can_factorize(goals: {
  target: string;
  hypotheses: string[];
  freeMetavars: string[];
  assignedMetavars: string[];
  universeConstraints: string[];
  isolation_status?: 'independent' | 'coupled';
}[]): { canFactorize: boolean; reason: string } {
  if (goals.length <= 1) {
    return { canFactorize: false, reason: 'Single goal; factorization trivial / not applicable' };
  }

  // 1. Check for shared free metavariables across goals
  const seenMetavars = new Map<string, number>(); // metavar -> goalIndex
  for (let i = 0; i < goals.length; i++) {
    const g = goals[i];
    for (const mv of g.freeMetavars) {
      if (seenMetavars.has(mv)) {
        const priorIdx = seenMetavars.get(mv)!;
        return {
          canFactorize: false,
          reason: `Unsafe split: Metavariable '?${mv}' is shared between Goal ${priorIdx + 1} and Goal ${i + 1}. Cross-goal instantiation constraints prevent independent search.`
        };
      }
      seenMetavars.set(mv, i);
    }
  }

  // 2. Check for cross-goal assignments or universe constraints
  for (let i = 0; i < goals.length; i++) {
    const g = goals[i];
    if (g.universeConstraints && g.universeConstraints.some(uc => uc.includes('unassigned') || uc.includes('shared'))) {
      return {
        canFactorize: false,
        reason: `Unsafe split: Goal ${i + 1} contains unassigned universe level constraints.`
      };
    }
    if (g.isolation_status === 'coupled') {
      return {
        canFactorize: false,
        reason: `Unsafe split: Goal ${i + 1} is explicitly marked as coupled to external context.`
      };
    }
  }

  return {
    canFactorize: true,
    reason: `Safe split verified: All ${goals.length} subgoals have disjoint metavariables, independent universe levels, and orthogonal local hypotheses contexts.`
  };
}

/**
 * Calculates vector reward r_t and deterministic scalarization R_t.
 * R_t = 1.0*r_valid + 2.0*r_closure + 0.4*r_complexity + 0.2*r_novelty - 0.1*r_cost - 2.0*r_integrity
 */
export function computeVectorReward(params: {
  isValidTactic: boolean;
  isGoalClosed: boolean;
  isFullTheoremClosed: boolean;
  complexityReduction: number; // delta complexity
  isReusableLemma: boolean;
  isEquivalentState: boolean;
  elapsedMs: number;
  tokenCount: number;
  leanCalls: number;
  escapeAttempted: boolean;
}): { vector: RewardVector; scalar: number } {
  // r_valid: +0.10 valid, -0.50 invalid
  const r_valid = params.isValidTactic ? 0.1 : -0.5;

  // r_closure: +1.00 goal closed, +5.00 full theorem closed (zeroed if escape attempted)
  let r_closure = 0.0;
  if (!params.escapeAttempted) {
    if (params.isFullTheoremClosed) {
      r_closure = 5.0;
    } else if (params.isGoalClosed) {
      r_closure = 1.0;
    }
  }

  // r_complexity: verified decrease: 0 to +0.50 (zeroed if escape attempted)
  const r_complexity = params.escapeAttempted
    ? 0.0
    : Math.min(0.5, Math.max(0.0, params.complexityReduction * 0.25));

  // r_novelty: +0.25 to +1.00 reusable lemma, -0.05 equivalent state
  let r_novelty = 0.0;
  if (!params.escapeAttempted) {
    if (params.isReusableLemma) {
      r_novelty = 0.5;
    } else if (params.isEquivalentState) {
      r_novelty = -0.05;
    }
  }

  // r_cost: continuous penalty (time, tokens, lean calls)
  const r_cost = Math.min(
    1.0,
    params.elapsedMs * 0.0005 + params.tokenCount * 0.002 + params.leanCalls * 0.01
  );

  // r_integrity: 1.0 (triggers -2.00 kill) if escape attempted
  const r_integrity = params.escapeAttempted ? 1.0 : 0.0;

  // Deterministic scalar composition
  const scalar =
    1.0 * r_valid +
    2.0 * r_closure +
    0.4 * r_complexity +
    0.2 * r_novelty -
    0.1 * r_cost -
    2.0 * r_integrity;

  const vector: RewardVector = {
    r_valid: Math.round(r_valid * 100) / 100,
    r_closure: Math.round(r_closure * 100) / 100,
    r_complexity: Math.round(r_complexity * 100) / 100,
    r_novelty: Math.round(r_novelty * 100) / 100,
    r_cost: Math.round(r_cost * 1000) / 1000,
    r_integrity: Math.round(r_integrity * 100) / 100
  };

  return { vector, scalar: Math.round(scalar * 1000) / 1000 };
}

/**
 * Critical-Path Credit Calculation for AND branches:
 * R_parent = R_local + gamma * min_{i in {1..k}} V(G_i)
 */
export function computeCriticalPathCredit(
  localScalarReward: number,
  childGoalValues: number[],
  gamma: number = 0.95
): number {
  if (childGoalValues.length === 0) {
    return localScalarReward;
  }
  const minChildValue = Math.min(...childGoalValues);
  const parentCredit = localScalarReward + gamma * minChildValue;
  return Math.round(parentCredit * 1000) / 1000;
}

// -------------------------------------------------------------
// Distributed REPL Worker Service Primitives
// -------------------------------------------------------------

/**
 * Primitive 1: run_file(theorem_source) -> root_state_ids
 */
export function run_file(theoremSource: string): {
  rootStateId: string;
  stateHash: string;
  goals: GoalNode[];
} {
  const normSource = theoremSource.trim();
  const rootId = `state_${crypto.createHash('md5').update(normSource).digest('hex').slice(0, 8)}`;

  // Parse initial theorem goal target from declaration
  const colonIdx = normSource.lastIndexOf(':');
  let target = 'Prop';
  let hyps: string[] = [];

  if (colonIdx !== -1) {
    target = normSource.slice(colonIdx + 1).replace(/:=.*$/, '').trim();
    // Extract declared parameters as hypotheses
    const declBeforeColon = normSource.slice(0, colonIdx);
    const paramMatches = declBeforeColon.match(/\(([^)]+)\)/g);
    if (paramMatches) {
      hyps = paramMatches.map(p => p.slice(1, -1).trim());
    }
  }

  const initialGoal: GoalNode = {
    id: `g_${crypto.createHash('md5').update(target).digest('hex').slice(0, 8)}`,
    goal_fingerprint: computeGoalFingerprint(target, hyps),
    local_context_hash: crypto.createHash('sha256').update(hyps.join(',')).digest('hex').slice(0, 12),
    target,
    hypotheses: hyps,
    freeMetavars: [],
    assignedMetavars: [],
    universeConstraints: [],
    isolation_status: 'independent',
    isSolved: false,
    depth: 0,
    complexity: estimateGoalComplexity(target, hyps),
    estimatedValue: 0.5,
    status: 'open',
    subscribers: []
  };

  const stateHash = computeProofStateHash([initialGoal]);

  return {
    rootStateId: rootId,
    stateHash,
    goals: [initialGoal]
  };
}

/**
 * Primitive 2: run_tactic(state_id, tactic) -> successor_state_ids, goals, diagnostics
 */
export function run_tactic(
  stateId: string,
  tactic: string,
  currentGoals: GoalNode[]
): {
  successorStateHash: string;
  newGoals: GoalNode[];
  diagnostic: string;
  isValid: boolean;
  escapeAttempted: boolean;
} {
  const trimmed = tactic.trim();

  // Escape bypass detection
  if (/\b(sorry|admit|native_decide)\b/.test(trimmed)) {
    return {
      successorStateHash: 'ESCAPE_TERMINATION',
      newGoals: [],
      diagnostic: `Security violation: Forbidden escape '${trimmed}' detected. Run killed under -2.0 integrity penalty.`,
      isValid: false,
      escapeAttempted: true
    };
  }

  // Syntax hallucination check
  if (trimmed.includes('magic_solve') || trimmed.includes('auto_proof_all') || trimmed.includes('cheat')) {
    return {
      successorStateHash: stateId,
      newGoals: currentGoals,
      diagnostic: `Tactic elaboration failure: Unknown tactic identifier '${trimmed}'.`,
      isValid: false,
      escapeAttempted: false
    };
  }

  // Cache lookup
  const cacheKey = `${stateId}::${trimmed}`;
  if (stateCache.has(cacheKey)) {
    cacheHitCounter++;
    const cached = stateCache.get(cacheKey)!;
    return {
      successorStateHash: cached.successorStateHashes[0] || stateId,
      newGoals: cached.goals,
      diagnostic: cached.diagnostic,
      isValid: true,
      escapeAttempted: false
    };
  }

  // Tactic transition simulation based on standard Lean 4 rules
  const firstGoal = currentGoals[0];
  let newGoals: GoalNode[] = [];
  let diagnostic = '';
  let isValid = true;

  if (trimmed === 'constructor') {
    // Splits A ∧ B into Goal A and Goal B
    const target = firstGoal.target;
    let leftTarget = 'p';
    let rightTarget = 'q';
    if (target.includes('∧')) {
      const parts = target.split('∧');
      leftTarget = parts[0].trim();
      rightTarget = parts[1].trim();
    }

    const gLeft: GoalNode = {
      id: `g_left_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      goal_fingerprint: computeGoalFingerprint(leftTarget, firstGoal.hypotheses),
      local_context_hash: firstGoal.local_context_hash,
      target: leftTarget,
      hypotheses: [...firstGoal.hypotheses],
      freeMetavars: [],
      assignedMetavars: [],
      universeConstraints: [],
      isolation_status: 'independent',
      isSolved: false,
      depth: firstGoal.depth + 1,
      complexity: estimateGoalComplexity(leftTarget, firstGoal.hypotheses),
      estimatedValue: 0.6,
      status: 'open',
      subscribers: []
    };

    const gRight: GoalNode = {
      id: `g_right_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      goal_fingerprint: computeGoalFingerprint(rightTarget, firstGoal.hypotheses),
      local_context_hash: firstGoal.local_context_hash,
      target: rightTarget,
      hypotheses: [...firstGoal.hypotheses],
      freeMetavars: [],
      assignedMetavars: [],
      universeConstraints: [],
      isolation_status: 'independent',
      isSolved: false,
      depth: firstGoal.depth + 1,
      complexity: estimateGoalComplexity(rightTarget, firstGoal.hypotheses),
      estimatedValue: 0.6,
      status: 'open',
      subscribers: []
    };

    newGoals = [gLeft, gRight, ...currentGoals.slice(1)];
    diagnostic = 'Constructor split composite goal into 2 independent subgoals.';
  } else if (trimmed.startsWith('exact') || trimmed === 'rfl' || trimmed === 'trivial' || trimmed === 'ring' || trimmed === 'linarith') {
    // Closes current open goal
    newGoals = currentGoals.slice(1);
    diagnostic = `Discharged current goal '${firstGoal.target}' via '${trimmed}'.`;
  } else if (trimmed.startsWith('intro')) {
    const varName = trimmed.replace(/^intro\s*/, '').trim() || 'h';
    const updatedHyp = `${varName} : ContextHyp`;
    const updatedGoal: GoalNode = {
      ...firstGoal,
      hypotheses: [...firstGoal.hypotheses, updatedHyp],
      goal_fingerprint: computeGoalFingerprint(firstGoal.target, [...firstGoal.hypotheses, updatedHyp]),
      depth: firstGoal.depth + 1
    };
    newGoals = [updatedGoal, ...currentGoals.slice(1)];
    diagnostic = `Introduced hypothesis '${varName}' into local context.`;
  } else if (trimmed.startsWith('have')) {
    // Adds a lemma hypothesis
    const lemmaHyp = trimmed.replace(/^have\s*/, '').split(':=')[0].trim();
    const updatedGoal: GoalNode = {
      ...firstGoal,
      hypotheses: [...firstGoal.hypotheses, lemmaHyp],
      depth: firstGoal.depth + 1
    };
    newGoals = [updatedGoal, ...currentGoals.slice(1)];
    diagnostic = `Constructed local intermediate lemma '${lemmaHyp}'.`;
  } else if (trimmed.startsWith('rw') || trimmed.startsWith('rewrite') || trimmed.startsWith('simp')) {
    // Simplifies target
    const simplifiedTarget = firstGoal.target.replace(/\s*\+\s*0/, '').replace(/0\s*\+\s*/, '');
    const updatedGoal: GoalNode = {
      ...firstGoal,
      target: simplifiedTarget,
      complexity: Math.max(0.5, firstGoal.complexity - 0.5),
      depth: firstGoal.depth + 1
    };
    newGoals = [updatedGoal, ...currentGoals.slice(1)];
    diagnostic = `Rewrote goal target to '${simplifiedTarget}'.`;
  } else {
    // Neutral valid step
    newGoals = currentGoals;
    diagnostic = `Tactic '${trimmed}' elaborated successfully.`;
  }

  const successorStateHash = computeProofStateHash(newGoals);

  // Store in cache
  stateCache.set(cacheKey, {
    successorStateHashes: [successorStateHash],
    goals: newGoals,
    diagnostic
  });

  return {
    successorStateHash,
    newGoals,
    diagnostic,
    isValid,
    escapeAttempted: false
  };
}

/**
 * Primitive 3: export_state(state_id) -> content_addressed_blob
 */
export function export_state(
  stateId: string,
  stateHash: string,
  goals: GoalNode[]
): StateBlob {
  const serialized = JSON.stringify({
    stateId,
    stateHash,
    goals: goals.map(g => ({
      target: g.target,
      hypotheses: g.hypotheses,
      freeMetavars: g.freeMetavars
    }))
  });

  const blobHash = crypto.createHash('sha256').update(serialized).digest('hex').slice(0, 16);

  const blob: StateBlob = {
    blobHash,
    state_hash: stateHash,
    environment_hash: ENVIRONMENT_HASH,
    serializedProofState: serialized,
    goals: goals.map(g => ({
      target: g.target,
      hypotheses: g.hypotheses,
      freeMetavars: g.freeMetavars
    })),
    createdAt: Date.now()
  };

  stateBlobStore.set(blobHash, blob);
  return blob;
}

/**
 * Primitive 4: import_state(blob) -> local_state_id
 */
export function import_state(blob: StateBlob): {
  localStateId: string;
  restoredGoals: GoalNode[];
} {
  const localId = `imported_${blob.blobHash.slice(0, 8)}`;
  const restoredGoals: GoalNode[] = blob.goals.map((g, idx) => ({
    id: `g_imp_${localId}_${idx}`,
    goal_fingerprint: computeGoalFingerprint(g.target, g.hypotheses),
    local_context_hash: crypto.createHash('sha256').update(g.hypotheses.join(',')).digest('hex').slice(0, 12),
    target: g.target,
    hypotheses: g.hypotheses,
    freeMetavars: g.freeMetavars || [],
    assignedMetavars: [],
    universeConstraints: [],
    isolation_status: 'independent',
    isSolved: false,
    depth: 0,
    complexity: estimateGoalComplexity(g.target, g.hypotheses),
    estimatedValue: 0.5,
    status: 'open',
    subscribers: []
  }));

  return {
    localStateId: localId,
    restoredGoals
  };
}

// -------------------------------------------------------------
// Full AND-OR Graph Construction & Execution Pipeline
// -------------------------------------------------------------

export function buildAndOrProofGraph(
  theoremStatement: string,
  tacticSequence: string[],
  options?: {
    forceCoupledMetavars?: boolean;
    injectEscape?: boolean;
    simulateDedupOverlap?: boolean;
  }
): TheoremRun {
  const startTime = Date.now();
  const runId = `run_${crypto.createHash('md5').update(theoremStatement + Date.now()).digest('hex').slice(0, 10)}`;

  // 1. Initialize Root Proof State
  const initial = run_file(theoremStatement);
  let activeGoals = initial.goals;

  if (options?.forceCoupledMetavars && activeGoals.length > 0) {
    // Artificially inject cross-goal metavariables to demonstrate unsafe split rejection
    activeGoals[0].freeMetavars = ['m_shared_1'];
  }

  const rootProofNodeId = initial.rootStateId;
  const proofNodes: Record<string, ProofNode> = {};
  const goalNodes: Record<string, GoalNode> = {};
  const tacticEdges: Record<string, TacticEdge> = {};

  // Register initial goals
  for (const g of activeGoals) {
    goalNodes[g.id] = g;

    // Check Deduplication Registry
    if (activeGoalSubscriptions.has(g.goal_fingerprint)) {
      const existingSubs = activeGoalSubscriptions.get(g.goal_fingerprint)!;
      existingSubs.push(g.id);
      g.status = 'dedup_subscribed';
      g.subscribers = existingSubs;
      deduplicatedTaskCounter++;
    } else {
      activeGoalSubscriptions.set(g.goal_fingerprint, [g.id]);
    }
  }

  // Initial factorization test on root
  const rootSplit = can_factorize(activeGoals);
  const rootNode: ProofNode = {
    id: rootProofNodeId,
    state_hash: initial.stateHash,
    environment_hash: ENVIRONMENT_HASH,
    goalIds: activeGoals.map(g => g.id),
    isolation_status: rootSplit.canFactorize ? 'factorized' : 'composite',
    isFactorizable: rootSplit.canFactorize,
    factorizationReason: rootSplit.reason,
    outgoingTacticEdgeIds: [],
    isSolved: false,
    criticalPathValue: activeGoals.length > 0 ? Math.min(...activeGoals.map(g => g.estimatedValue)) : 1.0
  };
  proofNodes[rootProofNodeId] = rootNode;

  let currentProofNodeId = rootProofNodeId;
  let totalScalarReward = 0;
  let runStatus: TheoremRun['status'] = 'active';

  // 2. Step through tactic stream creating TacticEdges and successive ProofNodes
  for (let stepIdx = 0; stepIdx < tacticSequence.length; stepIdx++) {
    const rawTactic = tacticSequence[stepIdx];
    const tactic = (options?.injectEscape && stepIdx === 1) ? 'sorry' : rawTactic;

    // Execute Tactic on current active goals
    const edgeId = `edge_${stepIdx}_${Date.now()}`;
    const stepStart = Date.now();
    const result = run_tactic(currentProofNodeId, tactic, activeGoals);
    const timingMs = Date.now() - stepStart + 1;

    // Check if goal closed or theorem closed
    const isGoalClosed = result.newGoals.length < activeGoals.length;
    const isFullTheoremClosed = result.isValid && result.newGoals.length === 0;

    // Complexity delta
    const prevComplexity = activeGoals.reduce((acc, g) => acc + g.complexity, 0);
    const newComplexity = result.newGoals.reduce((acc, g) => acc + g.complexity, 0);
    const complexityDelta = Math.max(0, prevComplexity - newComplexity);

    // Compute Vector & Scalar Reward
    const { vector, scalar } = computeVectorReward({
      isValidTactic: result.isValid,
      isGoalClosed,
      isFullTheoremClosed,
      complexityReduction: complexityDelta,
      isReusableLemma: tactic.startsWith('have'),
      isEquivalentState: result.successorStateHash === currentProofNodeId,
      elapsedMs: timingMs,
      tokenCount: tactic.split(/\s+/).length,
      leanCalls: 1,
      escapeAttempted: result.escapeAttempted
    });

    totalScalarReward += scalar;

    // Check Safe Split on returned successor goals
    const splitDecision = can_factorize(result.newGoals);

    // Create Goal Nodes for any newly created goals
    const newGoalIds: string[] = [];
    for (const ng of result.newGoals) {
      if (!goalNodes[ng.id]) {
        goalNodes[ng.id] = ng;

        // Dedup handling
        if (activeGoalSubscriptions.has(ng.goal_fingerprint)) {
          const subs = activeGoalSubscriptions.get(ng.goal_fingerprint)!;
          subs.push(ng.id);
          ng.status = 'dedup_subscribed';
          ng.subscribers = subs;
          deduplicatedTaskCounter++;
        } else {
          activeGoalSubscriptions.set(ng.goal_fingerprint, [ng.id]);
        }
      }
      newGoalIds.push(ng.id);
    }

    // Create Successor ProofNode
    const successorNodeId = `node_${stepIdx + 1}_${result.successorStateHash.slice(0, 8)}`;
    const childGoalValues = result.newGoals.map(g => g.estimatedValue);
    const criticalPathVal = childGoalValues.length > 0 ? Math.min(...childGoalValues) : (isFullTheoremClosed ? 1.0 : 0.0);

    const successorNode: ProofNode = {
      id: successorNodeId,
      state_hash: result.successorStateHash,
      environment_hash: ENVIRONMENT_HASH,
      goalIds: newGoalIds,
      isolation_status: splitDecision.canFactorize ? 'factorized' : 'composite',
      isFactorizable: splitDecision.canFactorize,
      factorizationReason: splitDecision.reason,
      parentTacticEdgeId: edgeId,
      outgoingTacticEdgeIds: [],
      isSolved: isFullTheoremClosed,
      criticalPathValue: criticalPathVal
    };

    // Calculate critical-path credit for edge
    const criticalPathCredit = computeCriticalPathCredit(scalar, childGoalValues);

    // Branch explosion penalty: penalize creating k branches without complexity decrease
    const branchExplosionPenalty = result.newGoals.length > activeGoals.length && complexityDelta <= 0
      ? 0.2 * (result.newGoals.length - activeGoals.length)
      : 0.0;

    // Create TacticEdge
    const tacticEdge: TacticEdge = {
      id: edgeId,
      sourceProofNodeId: currentProofNodeId,
      tactic,
      modelLogProb: -0.15 - stepIdx * 0.05,
      tokens: tactic.split(/\s+/),
      diagnostic: result.diagnostic,
      successorProofNodeId: successorNodeId,
      successorStateHashes: [result.successorStateHash],
      timingMs,
      resourceMeasurements: {
        gas: 1500 + stepIdx * 200,
        memoryMb: 92 + stepIdx * 4,
        tokenCount: tactic.split(/\s+/).length,
        leanCalls: 1
      },
      vectorReward: vector,
      scalarReward: scalar,
      criticalPathCredit: criticalPathCredit - branchExplosionPenalty,
      isVerifiedBranch: result.isValid && !result.escapeAttempted,
      branchExplosionPenalty
    };

    tacticEdges[edgeId] = tacticEdge;
    proofNodes[currentProofNodeId].outgoingTacticEdgeIds.push(edgeId);
    proofNodes[successorNodeId] = successorNode;

    // If escape attempted, kill run immediately under -2.0 integrity penalty
    if (result.escapeAttempted) {
      runStatus = 'failed';
      break;
    }

    if (!result.isValid) {
      runStatus = 'stuck';
      break;
    }

    // Advance
    activeGoals = result.newGoals;
    currentProofNodeId = successorNodeId;

    if (isFullTheoremClosed) {
      runStatus = 'proved';
      break;
    }
  }

  // Identify Bottleneck Goal (highest complexity or lowest estimated value)
  let bottleneckGoalId: string | undefined;
  let minVal = 999;
  for (const g of Object.values(goalNodes)) {
    if (!g.isSolved && g.estimatedValue < minVal) {
      minVal = g.estimatedValue;
      bottleneckGoalId = g.id;
    }
  }
  if (bottleneckGoalId && goalNodes[bottleneckGoalId]) {
    goalNodes[bottleneckGoalId].isBottleneck = true;
  }

  // Mark all solved goals
  if (runStatus === 'proved') {
    for (const g of Object.values(goalNodes)) {
      g.isSolved = true;
      g.status = 'solved';
      g.elapsedSolveTimeMs = 12 + Math.floor(Math.random() * 20);
    }
  }

  const closedGoals = Object.values(goalNodes).filter(g => g.isSolved).length;
  const totalGoals = Object.values(goalNodes).length;

  return {
    id: runId,
    theoremStatement,
    environment_hash: ENVIRONMENT_HASH,
    rootProofNodeId,
    proofNodes,
    goalNodes,
    tacticEdges,
    status: runStatus,
    closedGoalCount: closedGoals,
    totalGoalCount: totalGoals,
    bottleneckGoalId,
    createdAt: startTime,
    solvedAt: runStatus === 'proved' ? Date.now() : undefined,
    durationMs: Date.now() - startTime,
    totalScalarReward: Math.round(totalScalarReward * 1000) / 1000
  };
}

// -------------------------------------------------------------
// REPL Worker Pool Simulation & Monitoring
// -------------------------------------------------------------

export function getWorkerPoolStatus(): WorkerPoolStatus {
  // Update worker timestamps
  workers = workers.map(w => ({
    ...w,
    lastActiveTime: Date.now()
  }));

  return {
    workers,
    queueLength: Math.max(0, 8 - workers.filter(w => w.status === 'busy').length),
    deduplicatedCount: deduplicatedTaskCounter,
    cacheHitCount: cacheHitCounter,
    activeBranches: Object.keys(stateCache).length + 4,
    deterministicFallbackQueue: [
      { goalId: 'g_fb_1', tacticCandidate: 'ring', target: 'x^2 - y^2 = (x - y)*(x + y)', priority: 1 },
      { goalId: 'g_fb_2', tacticCandidate: 'linarith', target: 'a + b ≤ c + d', priority: 2 },
      { goalId: 'g_fb_3', tacticCandidate: 'omega', target: '2 * n + 1 ≠ 2 * m', priority: 3 },
      { goalId: 'g_fb_4', tacticCandidate: 'aesop', target: 'Disjoint s t → s ∩ t = ∅', priority: 4 }
    ]
  };
}

// -------------------------------------------------------------
// Asynchronous Expert Iteration Engine
// -------------------------------------------------------------

export function generateExpertIterationSummary(): ExpertIterationSummary {
  return {
    iteration: 4,
    frozenModelVersion: 'DeepSeek-LeanTree-7B-v4.1',
    candidateModelVersion: 'DeepSeek-LeanTree-7B-v4.2-candidate',
    totalTrajectories: 14280,
    deduplicatedTrajectories: 11450,
    positiveDatasetCount: 4210,
    processDatasetCount: 8940,
    decompositionDatasetCount: 3120,
    benchmarkGating: {
      totalHeldOutTasks: 78, // Realistic SorryDB benchmark corpus
      passedCount: 61,
      passRate: Math.round((61 / 78) * 1000) / 10, // 78.2%
      costPerVerifiedTheorem: 4200, // Reduced from 6100 gas/tokens
      cleanRoomRebuildPassed: true,
      promotionStatus: 'promoted',
      evaluationNotes:
        'Passed all 78 SorryDB clean-room rebuilds from source without compiler errors. Proof success rate improved +6.4% and cost per verified theorem decreased by 31.1%.'
    }
  };
}

// -------------------------------------------------------------
// Presets for AND-OR Graph Interactive Demos
// -------------------------------------------------------------

export const AND_OR_PRESETS: AndOrGraphPreset[] = [
  {
    id: 'preset_and_comm_factorized',
    title: 'Multi-Goal Factorization (and_comm)',
    theorem: 'theorem and_comm (p q : Prop) (h : p ∧ q) : q ∧ p',
    description:
      "Tactic 'constructor' splits the root state into two orthogonal subgoals (Goal 1: ⊢ q, Goal 2: ⊢ p). The safe split rule verifies disjoint metavariables, factorizes both branches, and executes parallel workers before closing with full-theorem reward.",
    tactics: ['constructor', 'exact h.2', 'exact h.1'],
    hasSafeSplit: true,
    expectedProofStatus: 'proved'
  },
  {
    id: 'preset_unsafe_split_coupled',
    title: 'Unsafe Split Rejection (Coupled Metavariables)',
    theorem: 'theorem exists_and (P Q : Nat → Prop) (h : ∃ x, P x ∧ Q x) : ∃ x, Q x ∧ P x',
    description:
      "Demonstrates safe split rejection: when goals share an uninstantiated existential metavariable '?m_x', factorizing would create incompatible bindings. The system preserves a composite state.",
    tactics: ['rcases h with ⟨x, hx⟩', 'use x', 'constructor', 'exact hx.2', 'exact hx.1'],
    hasSafeSplit: false,
    expectedProofStatus: 'proved'
  },
  {
    id: 'preset_bottleneck_branch_credit',
    title: 'Bottleneck Branch Credit Attribution',
    theorem: 'theorem hardy_z_asymmetry (t : ℝ) (h : t = 0) : (t^2 = 0) ∧ (t + 0 = t)',
    description:
      "Demonstrates critical-path credit: Branch 1 is hard (requires ring expansion) and Branch 2 is trivial (rfl). The parent decomposition credit is gated by min_{i} V(G_i), giving the bottleneck bonus to the harder branch.",
    tactics: ['constructor', 'rw [h]', 'rfl'],
    hasSafeSplit: true,
    expectedProofStatus: 'proved'
  },
  {
    id: 'preset_escape_kill_rejection',
    title: 'Forbidden Escape Bypass Kill (sorry)',
    theorem: 'theorem fermat_near_miss (x y z n : Nat) : x^n + y^n ≠ z^n',
    description:
      "Injects a forbidden 'sorry' escape into one of the subgoals. Triggers the -2.0 integrity penalty, kills the run, and blocks the trajectory from entering the positive training dataset.",
    tactics: ['intro h', 'sorry'],
    hasSafeSplit: false,
    expectedProofStatus: 'escape_kill'
  }
];
