export type MillenniumProblemId = 
  | 'riemann_hypothesis'
  | 'p_vs_np'
  | 'navier_stokes'
  | 'yang_mills'
  | 'bsd'
  | 'hodge'
  | 'poincare'
  | 'custom';

export type StrategyId = 
  | 'S1_DIRECT_PROOF'
  | 'S2_RECURSIVE_DECOMP'
  | 'S3_COUNTEREXAMPLE_HUNT'
  | 'S4_MEASURABLE_PROXY'
  | 'S5_ANALOG_TOY_MODEL'
  | 'S6_AUTOFORMALIZATION'
  | 'S7_ADVERSARIAL_CONJECTURE'
  | 'S8_BARRIER_ROUTING';

export type PortfolioTier = 
  | 'tier1_infra'
  | 'tier2_proxy'
  | 'tier3_audit'
  | 'tier4_moonshot';

export type ResourceClass = 
  | 'deterministic-only'
  | 'llm-preferred'
  | 'llm-required';

export type LadderStep = 
  | 'COUNTEREXAMPLE_PROBE'
  | 'DECISION_PROCEDURE'
  | 'AESOP_SEARCH'
  | 'EXTERNAL_ATP_SMT'
  | 'INDETERMINATE';

export type AgentId = 
  | 'decomposer'
  | 'prober'
  | 'prover'
  | 'librarian'
  | 'assembler'
  | 'verifier'
  | 'proxy_analyst'
  | 'barrier_auditor'
  | 'claim_auditor'
  | 'pslq_worker'
  | 'egraph_worker'
  | 'ramanujan_worker'
  | 'mutation_worker'
  | 'ladder_tester';

export interface Agent {
  id: AgentId;
  name: string;
  job: string;
  type: 'AI' | 'DETERMINISTIC';
  model?: string;
  status: 'idle' | 'working' | 'error' | 'verified';
  lastLog: string;
  tasksCompleted: number;
}

export interface Task {
  id: string;
  strategyId: StrategyId;
  agentId: AgentId;
  resourceClass: ResourceClass;
  input: any;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  createdAt: number;
  completedAt?: number;
}

export interface Lemma {
  id: string;
  title: string;
  statement: string;
  status: 'pending' | 'probing' | 'proving' | 'verified' | 'failed';
  dependencies: string[];
  proofHash?: string;
  leanSource?: string;
  strategyOrigin?: StrategyId;
  generationMethod?: 'grammar_enum' | 'egraph' | 'pslq' | 'ramanujan' | 'mutation' | 'dag_bridge' | 'llm_sketch';
  ladderResult?: TestLadderReport;
  verificationDetails?: {
    exitCode: number;
    compileTimeMs: number;
    kernelStdout: string;
    kernelStderr: string;
    leanVersion: string;
    hasSorry: boolean;
  };
}

export interface StrategyTrack {
  id: StrategyId;
  name: string;
  description: string;
  objectiveFunction: string;
  deterministicComponent: string;
  status: 'idle' | 'running' | 'completed' | 'barrier_blocked' | 'diverged';
  progressPercent: number;
  currentMetricLabel?: string;
  currentMetricValue?: string;
  targetMetricValue?: string;
  activeAgents: AgentId[];
  logs: string[];
  artifactsGenerated: number;
}

export interface MeasurableProxyData {
  problem: 'riemann_hypothesis';
  deBruijnNewmanConstant: {
    currentUpperCertificate: number;
    lowerBoundKnown: number;
    target: number;
    certificateHash: string;
    verifiedNumerically: boolean;
    verificationTimestamp: number;
  };
  criticalLineZerosProportion: {
    currentProportion: number;
    historicalLevinson: number;
    historicalConrey: number;
    target: number;
  };
  verifiedZerosCount: number;
  sampleHeightsVerified: { t: number; zValue: number; signChange: boolean }[];
}

export interface BarrierAuditResult {
  problem: 'p_vs_np' | 'navier_stokes';
  techniqueName: string;
  barrierStatus: {
    relativization: { violated: boolean; reason: string };
    naturalProofs: { violated: boolean; reason: string };
    algebrization: { violated: boolean; reason: string };
  };
  eulerBlowupCheck?: { violated: boolean; reason: string };
  verdict: 'PASSED_BARRIER_FILTER' | 'REJECTED_BY_BARRIER';
  recommendation: string;
}

export interface NavierStokesClaimAudit {
  claimTarget: string;
  domainChecked: 'R3' | 'T3';
  fidelityScore: number;
  clayOfficialCriteria: {
    dimension: { expected: 'R3 or T3', observed: string; pass: boolean };
    smoothness: { expected: 'C_infinity rapidly decaying', observed: string; pass: boolean };
    viscousDissipation: { expected: 'nu > 0 with energy bound', observed: string; pass: boolean };
    incompressibility: { expected: 'div u = 0', observed: string; pass: boolean };
    finiteTimeSingularityTest: { expected: 'sup_t ||u||_Linf = infty or global smooth', observed: string; pass: boolean };
  };
  leanReplayStatus: 'COMPILED' | 'KERNEL_FAILED' | 'SORRY_DETECTED' | 'UNVERIFIED';
  kernelVerificationOutput: string;
  discrepanciesFound: string[];
}

export interface BenchmarkTrackResult {
  trackId: string;
  problemId: MillenniumProblemId;
  name: string;
  category: 'proof_search' | 'conjecture_discovery' | 'counterexample_finding' | 'barrier_check';
  passed: boolean;
  score: number;
  executionReceipt: string;
}

export interface MillenniumProblemMeta {
  id: MillenniumProblemId;
  title: string;
  clayPrizeYear: number;
  prizeAmount: string;
  formalStatementLean: string;
  informalStatement: string;
  clayOfficialDocUrl: string;
  bestFitStrategies: StrategyId[];
  recommendedTier: PortfolioTier;
  knownBarriers: string[];
  activeObjective: string;
}

export interface NegativeResult {
  id: string;
  lemmaId: string;
  failureType: 'counterexample' | 'syntax_error' | 'tactic_timeout' | 'barrier_collision';
  details: string;
  timestamp: number;
  witness?: string;
}

export interface PSLQResult {
  found: boolean;
  coefficients?: number[];
  normBound?: number;
  residual?: number;
  inputVector: number[];
  formulaConjecture?: string;
  executionTimeMs: number;
}

export interface EGraphEquivalence {
  id: string;
  lhs: string;
  rhs: string;
  eclassId: number;
  rewritePath: string[];
  noveltyScore: number;
  leanEqualityStatement: string;
}

export interface RamanujanIdentity {
  targetConstant: string;
  a_poly: string;
  b_poly: string;
  convergents: number[];
  error: number;
  conjecturedFormula: string;
}

export interface MutatedTheorem {
  originalId: string;
  mutationType: 'weaken_hypothesis' | 'constant_to_variable' | 'dualize' | 'lift_dimension' | 'swap_quantifiers';
  originalStatement: string;
  mutatedStatement: string;
  rationale: string;
}

export interface DagBridgeProposal {
  sourceCluster: string[];
  targetCluster: string[];
  missingEdgeCost: number;
  conjecturedBridge: string;
  potentialPayoff: string;
}

export interface TestLadderReport {
  hypothesisId: string;
  decisiveStep: LadderStep;
  outcome: 'REFUTED' | 'PROVEN_DECISION' | 'PROVEN_AESOP' | 'PROVEN_ATP' | 'INDETERMINATE';
  timingMs: number;
  counterexampleWitness?: string;
  proofTactic?: string;
  evidenceTrail: string[];
  kernelVerificationHash?: string;
}

export interface BacklogBankStatus {
  llmCircuitBreaker: 'NORMAL' | 'TRIPPED_DRAINING_BACKLOG' | 'QUOTA_EXHAUSTED';
  bankedHypothesesCount: number;
  deterministicQueueDepth: number;
  drainedPerHour: number;
  bankedSurplusRate: number;
  compoundingLibrarySize: number;
}

export interface AlwaysOnJobStatus {
  jobId: string;
  problemId: MillenniumProblemId;
  name: string;
  status: 'RUNNING_24_7' | 'IDLE';
  itemsProcessed: number;
  lastProgressCheckpoint: string;
  runtimeSeconds: number;
}

export interface OrchestratorState {
  problemId: MillenniumProblemId;
  targetTheorem: string;
  targetStatement: string;
  activePortfolioTier: PortfolioTier;
  activeStrategies: StrategyId[];
  tracks: StrategyTrack[];
  lemmas: Lemma[];
  ledger: NegativeResult[];
  phase: 'idle' | 'decomposing' | 'executing' | 'assembling' | 'finalizing';
  agents: Agent[];
  logs: string[];
  spent: number;
  budget: number;
  proxyData?: MeasurableProxyData;
  barrierAudits: BarrierAuditResult[];
  claimAudits: NavierStokesClaimAudit[];
  benchmarkTracks: BenchmarkTrackResult[];
  backlogStatus?: BacklogBankStatus;
  alwaysOnJobs?: AlwaysOnJobStatus[];
  latestPslqResults?: PSLQResult[];
  latestEGraphEquivalences?: EGraphEquivalence[];
  latestRamanujanIdentities?: RamanujanIdentity[];
  latestMutations?: MutatedTheorem[];
  latestDagBridges?: DagBridgeProposal[];
  ladderReports?: TestLadderReport[];
  latestProcessOracleEval?: ProcessOracleEvaluation;
  latestTheoremRun?: TheoremRun;
}

// Lean 4 Tactic Process Oracle & RL Reward Types
export type ProcessFailureSeverity = 
  | 'none'
  | 'escape'
  | 'syntax_error'
  | 'tactic_error'
  | 'neutral'
  | 'subgoal'
  | 'kernel_confirmed'
  | 'timeout';

export interface TacticSpan {
  index: number;
  rawText: string;
  charStart: number;
  charEnd: number;
  tokenStartIdx?: number;
  tokenEndIdx?: number;
}

export interface TacticStepResult {
  stepIndex: number;
  tactic: string;
  valid: boolean;
  severity: ProcessFailureSeverity;
  goalsBefore: number;
  goalsAfter: number;
  openGoals?: string[];
  errorMessage?: string;
  scalarReward: number;
  cascadedFromStep?: number;
  replResponse?: any;
}

export interface GRPOTokenCredit {
  tokenIdx: number;
  tokenText: string;
  isTacticFirstToken: boolean;
  tacticIndex?: number;
  processAdvantage: number;
  outcomeAdvantage: number;
  totalAdvantage: number;
  dilutedBaselineAdvantage: number;
}

export interface ProcessOracleEvaluation {
  id: string;
  theoremDecl: string;
  tacticSteps: TacticStepResult[];
  firstErrorStep?: number;
  totalProcessReward: number;
  outcomeVerified: boolean;
  terminalBonus: number;
  tokenCredits: GRPOTokenCredit[];
  durationMs: number;
  replLog: string[];
  summaryText: string;
}

export interface ProcessOraclePreset {
  id: string;
  title: string;
  description: string;
  theoremDecl: string;
  proofBody: string;
  expectedOutcome: 'complete' | 'first_error_cascade' | 'escape_kill' | 'syntax_fail';
}

// ==========================================
// AND-OR Proof Graph & Factorization Types
// ==========================================

export interface RewardVector {
  r_valid: number;        // +0.10 valid transition, -0.50 invalid tactic
  r_closure: number;      // +1.00 single goal closed, +5.00 full theorem closed
  r_complexity: number;   // 0 to +0.50 verified decrease in normalized goal complexity
  r_novelty: number;      // +0.25 to +1.00 reusable lemma, -0.05 equivalent state
  r_cost: number;         // continuous penalty (time, tokens, lean calls, memory)
  r_integrity: number;    // 1.0 (leads to -2.00 kill penalty) if escape attempted
}

export interface GoalNode {
  id: string;
  goal_fingerprint: string;     // normalized target + relevant hypotheses hash
  local_context_hash: string;
  target: string;
  hypotheses: string[];
  freeMetavars: string[];
  assignedMetavars: string[];
  universeConstraints: string[];
  isolation_status: 'independent' | 'coupled';
  isSolved: boolean;
  depth: number;
  complexity: number;
  estimatedValue: number;       // V(G_i)
  status: 'open' | 'queued' | 'dedup_subscribed' | 'solving' | 'solved' | 'failed';
  subscribers: string[];        // worker/node IDs deduplicated onto this task
  solvingWorkerId?: string;
  solvingTacticEdgeId?: string;
  elapsedSolveTimeMs?: number;
  isBottleneck?: boolean;
}

export interface ProofNode {
  id: string;
  state_hash: string;           // canonical serialized proof state + pinned environment
  environment_hash: string;
  goalIds: string[];            // required AND-goals at this proof state
  isolation_status: 'factorized' | 'composite';
  isFactorizable: boolean;
  factorizationReason: string;
  parentTacticEdgeId?: string;
  outgoingTacticEdgeIds: string[]; // OR alternatives
  isSolved: boolean;
  criticalPathValue: number;    // min_{G in goalIds} V(G)
}

export interface TacticEdge {
  id: string;
  sourceProofNodeId: string;
  tactic: string;
  modelLogProb: number;
  tokens: string[];
  diagnostic: string;
  successorProofNodeId?: string;
  successorStateHashes: string[];
  timingMs: number;
  resourceMeasurements: {
    gas: number;
    memoryMb: number;
    tokenCount: number;
    leanCalls: number;
  };
  vectorReward: RewardVector;
  scalarReward: number;         // 1.0*r_v + 2.0*r_cl + 0.4*r_cx + 0.2*r_n - 0.1*r_co - 2.0*r_int
  criticalPathCredit: number;   // R_parent = R_local + gamma * min V(G_i)
  isVerifiedBranch: boolean;
  branchExplosionPenalty: number;
}

export interface TheoremRun {
  id: string;
  theoremStatement: string;
  environment_hash: string;
  rootProofNodeId: string;
  proofNodes: Record<string, ProofNode>;
  goalNodes: Record<string, GoalNode>;
  tacticEdges: Record<string, TacticEdge>;
  status: 'active' | 'proved' | 'stuck' | 'failed';
  closedGoalCount: number;
  totalGoalCount: number;
  bottleneckGoalId?: string;
  createdAt: number;
  solvedAt?: number;
  durationMs: number;
  totalScalarReward: number;
}

// Distributed REPL Worker Pool Types
export interface ReplWorker {
  id: string;
  status: 'idle' | 'busy' | 'restarting' | 'offline';
  currentGoalFingerprint?: string;
  currentGoalId?: string;
  processedTasks: number;
  lastActiveTime: number;
  memoryUsageMb: number;
}

export interface StateBlob {
  blobHash: string;
  state_hash: string;
  environment_hash: string;
  serializedProofState: string;
  goals: {
    target: string;
    hypotheses: string[];
    freeMetavars: string[];
  }[];
  createdAt: number;
}

export interface WorkerPoolStatus {
  workers: ReplWorker[];
  queueLength: number;
  deduplicatedCount: number;
  cacheHitCount: number;
  activeBranches: number;
  deterministicFallbackQueue: {
    goalId: string;
    tacticCandidate: 'aesop' | 'simp' | 'omega' | 'ring' | 'linarith' | 'norm_num' | 'sat_smt';
    target: string;
    priority: number;
  }[];
}

// Asynchronous Expert Iteration Dataset Types
export interface ExpertIterationSummary {
  iteration: number;
  frozenModelVersion: string;
  candidateModelVersion: string;
  totalTrajectories: number;
  deduplicatedTrajectories: number;
  positiveDatasetCount: number;
  processDatasetCount: number;
  decompositionDatasetCount: number;
  benchmarkGating: {
    totalHeldOutTasks: number;
    passedCount: number;
    passRate: number;
    costPerVerifiedTheorem: number; // in gas/tokens
    cleanRoomRebuildPassed: boolean;
    promotionStatus: 'promoted' | 'rejected' | 'evaluating';
    evaluationNotes: string;
  };
}

export interface AndOrGraphPreset {
  id: string;
  title: string;
  theorem: string;
  description: string;
  tactics: string[];
  hasSafeSplit: boolean;
  expectedProofStatus: 'proved' | 'stuck' | 'escape_kill';
}

// ============================================================================
// MONTE CARLO HYPOTHESIS ENGINE (MCHE) & 5-CAMP FRONTIER ARCHITECTURE TYPES
// ============================================================================

export type PromotionStage = 
  | 'generated'            // Raw candidate, unexamined
  | 'survived'             // Passed N random trials, no counterexample
  | 'significant'          // Passed corrected significance threshold
  | 'plausible'            // Passed symbolic/CAS cross-check
  | 'queued'               // Admitted to Lean formal queue
  | 'verified'             // Closed the loop: proved by Lean kernel
  | 'refuted';             // Counterexample found at any stage

export type GenerationMethod = 
  | 'mutation' 
  | 'pslq' 
  | 'enumeration' 
  | 'ramanujan' 
  | 'evolutionary' 
  | 'mcts_conjecture'
  | 'dag_gap_bridge';

export interface EvidenceLogEntry {
  stage: string;
  timestamp: number;
  trial?: number;
  trials_run?: number;
  counterexamples?: number;
  instance?: Record<string, any>;
  result?: string;
  observed_statistic?: number;
  raw_p_value?: number;
  corrected_alpha?: number;
  family_size?: number;
  passed?: boolean;
  note?: string;
}

export interface Hypothesis {
  id: string;
  statement_template: string;
  domain: 'number_theory' | 'analysis' | 'algebra' | 'combinatorics' | 'fluid_dynamics';
  parent_ids: string[];
  generation_method: GenerationMethod;
  stage: PromotionStage;
  trial_count: number;
  counterexample_count: number;
  p_value?: number | null;
  effect_size?: number | null;
  evidence_log: EvidenceLogEntry[];
  content_hash: string;
  createdAt: number;
  lastUpdated: number;
  lean_formalization?: string;
  kernel_verification_log?: string;
  priorityReceiptHash?: string;
}

export interface EvolutionaryProgram {
  id: string;
  program: string;
  score: number;
  domain: string;
  generation: number;
}

export interface MCTSNodeState {
  stateId: string;
  label: string;
  conjectureFragment: string;
  domain: string;
  visits: number;
  totalValue: number;
  ucb1: number;
  untriedActionsCount: number;
  childrenCount: number;
}

export interface LemmaMemoryItem {
  id: string;
  name: string;
  leanCode: string;
  summary: string;
  domain: string;
  provenance: string;
  kernelProofHash: string;
  retrievalCount: number;
  verifiedAt: number;
  tags: string[];
}

export interface CompilerRefinementFeedback {
  originalTactic: string;
  leanErrorCategory: 'type_mismatch' | 'unsolved_goals' | 'unknown_identifier' | 'max_heartbeats' | 'syntax_error';
  rawLeanMessage: string;
  suggestedTactic: string;
  iteration: number;
  success: boolean;
}

export interface DualLaneInferenceStatus {
  wideSweep: {
    activeLanes: number;
    maxDepth: number;
    gasBudgetPerBranch: number;
    candidatesEvaluated: number;
    survivingLeafCount: number;
  };
  deepSearch: {
    activeLanes: number;
    mctsRolloutCount: number;
    gasBudgetPerBranch: number;
    treeDepth: number;
    bestBranchValue: number;
  };
}

export interface SpecializedEngineResult {
  engine: 'PARI_GP' | 'OSCAR_GAP' | 'ARB_INTERVAL' | 'SYMPY_CAS' | 'Z3_SMT';
  domain: string;
  query: string;
  success: boolean;
  output: string;
  executionTimeMs: number;
  certifiedSound: boolean;
}

export interface BlueprintImplicationEdge {
  id: string;
  fromTheorem: string;
  toTheorem: string;
  status: 'proved' | 'refuted' | 'open' | 'pending_gate';
  assignedCampOrWorker?: string;
  evidenceHash?: string;
  leanFile?: string;
}

export interface PriorityProofReceipt {
  receiptHash: string;
  theoremId: string;
  statement: string;
  sourceHash: string;
  leanKernelVersion: string;
  mathlibCommit: string;
  axiomsUsed: string[];
  sorryCount: 0;
  timestamp: number;
  status: 'VERIFIED_AND_SEALED' | 'WITHHELD_PENDING_GATE';
  signature: string;
}

// ============================================================================
// COORDINATED MULTI-DECADE MILLENNIUM RESEARCH PROGRAM & SPECIALIZED TRACKS
// ============================================================================

export interface ThreePillarsMetrics {
  humanPillar: {
    activeFellows: number;
    conceptualDirectionsProposed: number;
    activeAdvisoryInstitutes: string[];
    monthlySteeringAudits: number;
    humanConstraintCertifications: number;
  };
  simulationPillar: {
    activeClusterNodes: number;
    totalFlopsAllocated: string;
    fluidGridResolution: string;
    latticeConfigurationsGenerated: number;
    zetaZerosIndexed: string;
    ellipticCurvesAnalyzed: number;
  };
  formalizationPillar: {
    formalProofAssistant: 'Lean 4' | 'Coq' | 'Isabelle';
    mathlibCommitPinned: string;
    verifiedLemmasCount: number;
    activeSorryCount: 0;
    cryptographicReceiptsSealed: number;
  };
}

export interface RiemannTrackState {
  zerosDatabase: {
    lowZeros: { index: number; t: number; zAbs: number; verified: boolean }[];
    totalZerosChecked: string;
    gramPointsSampled: number;
  };
  pairCorrelation: {
    gueTheoreticalCurve: { x: number; y: number }[];
    empiricalZetaPairs: { x: number; y: number }[];
    ksTestStat: number;
    pValueMatch: number;
  };
  deBruijnNewman: {
    upperBound: number;
    lowerBound: number;
    certificateHash: string;
    lastAuditTimestamp: number;
  };
  explicitFormulaResidual: {
    primeX: number;
    analyticSum: number;
    primeCountingPi: number;
    errorDelta: number;
  };
}

export interface BsdEllipticCurveRecord {
  cremonaLabel: string;
  weierstrassEquation: string;
  conductor: number;
  algebraicRank: number;
  analyticRank: number;
  realPeriodOmega: number;
  regulatorR: number;
  torsionOrder: number;
  tamagawaProduct: number;
  shaAnalyticOrder: number;
  bsdRatioCalculated: number;
  bsdRatioExpected: number;
  discrepancy: number;
  status: 'VERIFIED_EQUAL' | 'PARTIAL_BOUND' | 'UNTESTED';
}

export interface BsdTrackState {
  curves: BsdEllipticCurveRecord[];
  grossZagierKolyvaginScope: {
    rank0Status: 'COMPLETED_LEAN4';
    rank1Status: 'COMPLETED_LEAN4';
    rankGe2Status: 'ACTIVE_RESEARCH_TRACK';
  };
  selmerGroupBound: {
    curve: string;
    pVal: number;
    pSelmerRank: number;
    shaTorsionBound: string;
  };
}

export interface HodgeVarietyRecord {
  name: string;
  dimension: number;
  kodairaDimension: number;
  bettiNumbers: number[];
  hodgeDiamondRows: number[][];
  hodgeClassesCodimP: { p: number; dimHdg: number; dimAlgebraicCycles: number; ratio: number }[];
  lefschetz11Certified: boolean;
  atiyahHirzebruchTorsionExempt: boolean;
  algebraicCycleWitnesses: string[];
}

export interface HodgeTrackState {
  varieties: HodgeVarietyRecord[];
  casBridgeEngine: 'OSCAR_SINGULAR' | 'MACAULAY2' | 'GAP_HOMOLOGY';
  leanHomologyCompilationStatus: 'COMPILED' | 'IN_PROGRESS';
  activeConjectureFocus: string;
}

export interface NavierStokesSimulationSnapshot {
  timeT: number;
  viscosityNu: number;
  kineticEnergy: number;
  enstrophy: number;
  maxVorticityLInf: number;
  bkmIntegralEstimate: number;
  bkmThresholdExceeded: boolean;
  depletionOfNonlinearityRatio: number;
  resolutionMesh: string;
}

export interface NavierStokesTrackState {
  simulation: NavierStokesSimulationSnapshot[];
  bkmCriterionStatus: 'REGULAR_BOUNDED' | 'POTENTIAL_BLOWUP' | 'PROVED_LOCAL';
  openAiClaimAudit: {
    claimTarget: string;
    fidelityScore: number;
    clay5CriteriaStatus: {
      dimensionR3: boolean;
      smoothDecay: boolean;
      viscousNuPositive: boolean;
      divFree: boolean;
      noFiniteTimeSingularity: boolean;
    };
    leanReplay: 'COMPILED' | 'KERNEL_FAILED' | 'SORRY_DETECTED';
    unverifiedAssumptions: string[];
  };
}

export interface YangMillsLatticeState {
  gaugeGroup: 'SU(2)' | 'SU(3)';
  latticeDims: string;
  betaCoupling: number;
  averagePlaquette: number;
  wilsonLoopAreaLaw: { distanceR: number; potentialV: number }[];
  glueballCorrelationDecay: { timeSlice: number; corrValue: number }[];
  estimatedMassGapDelta: number;
  stringTensionSigma: number;
  continuumLimitSafe: boolean;
  wightmanAxiomAudit: {
    relativisticInvariance: boolean;
    spectralCondition: boolean;
    vacuumStateUnique: boolean;
    positivityScalarProduct: boolean;
  };
}

export interface PvsNpTrackState {
  circuitLowerBounds: {
    circuitClass: string;
    hardestLanguage: string;
    lowerBoundKnown: string;
    techniqueUsed: string;
    naturalProofExempt: boolean;
  }[];
  barrierAuditor: {
    relativizationBgsViolated: boolean;
    naturalProofsRrViolated: boolean;
    algebrizationAwViolated: boolean;
    recommendedBarrierAvoidance: string;
  };
  metaComplexityTarget: {
    conjecture: string;
    mcspReductionType: string;
    gapToPneNP: string;
  };
  knownReductionsGraph: { from: string; to: string; gadget: string }[];
}

export interface PoincareTrackState {
  perelmanMilestones: {
    title: string;
    lean4FormalizationStatus: 'SEALED' | 'IN_PROGRESS' | 'SKELETON';
    technique: string;
    transferTarget: string;
  }[];
  wEntropyMonotonicity: { tau: number; wValue: number; dW_dtau: number }[];
  singularityClassifications: {
    type: string;
    solitonModel: string;
    surgeryResolution: string;
  }[];
  geometricFlowTransferTactics: {
    sourceTactic: string;
    targetDomain: 'Navier_Stokes' | 'Yang_Mills' | 'Hodge_Kaehler';
    status: 'TRANSFERRED' | 'PROBING';
    notes: string;
  }[];
}

export interface MathOsKnowledgeEntry {
  id: string;
  problemId: MillenniumProblemId;
  title: string;
  category: 'theorem' | 'barrier' | 'conjecture' | 'simulation_data' | 'proof_sketch' | 'heuristic';
  provenance: string;
  authorOrCamp: string;
  timestamp: string;
  contentHash: string;
  formalCodeOrSnippet?: string;
  summary: string;
}

export interface MultiDecadeRoadmapPhase {
  phaseIndex: number;
  eraName: string;
  timeframe: string;
  strategicObjective: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED';
  keyMilestones: string[];
}


