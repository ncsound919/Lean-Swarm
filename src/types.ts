export type MillenniumProblemId = 
  | 'riemann_hypothesis'
  | 'navier_stokes'
  | 'yang_mills'
  | 'p_vs_np'
  | 'bsd'
  | 'hodge'
  | 'poincare'; // Solved baseline

export type PortfolioTier = 'tier1_rapid' | 'tier2_depth' | 'tier3_verification';

export interface MillenniumProblemMeta {
  id: MillenniumProblemId;
  title: string;
  field: string;
  clayPrizeYear: number;
  status: 'OPEN' | 'SOLVED_PERELMAN' | 'OPEN_AUDITED';
  statementLean: string;
  bestFitStrategies: StrategyId[];
  description: string;
  formalDefinitionMathlibModule: string;
  barrierNotes: string;
}

export type StrategyId = 
  | 'S1_DIRECT_TACTIC'
  | 'S2_RECURSIVE_DAG'
  | 'S3_COUNTEREXAMPLE_PROBER'
  | 'S4_MONOTONIC_BOUNDS'
  | 'S5_ANALOG_TOY_MODELS'
  | 'S6_LITERATURE_AUTOFormal'
  | 'S7_ADVERSARIAL_CONJECTURE'
  | 'S8_BARRIER_AWARE_ROUTING';

export interface StrategyTrack {
  id: StrategyId;
  name: string;
  description: string;
  status: 'active' | 'evaluating' | 'converging' | 'blocked' | 'certified';
  progress: number;
  confidence: number;
  activeAgents: string[];
  logs: string[];
  artifactsGenerated: number;
}

export interface Agent {
  id: string;
  name: string;
  job: string;
  type: 'AI' | 'DETERMINISTIC';
  model?: string;
  status: 'idle' | 'running' | 'completed' | 'blocked';
  lastLog: string;
  tasksCompleted: number;
}

export interface LemmaNode {
  id: string;
  title: string;
  statement: string;
  proofCode?: string;
  dependencies: string[];
  status: 'unproven' | 'proving' | 'verified_lean4' | 'counterexample_found' | 'barrier_blocked';
  verifiedBy?: string;
  verificationHash?: string;
  kernelReceipt?: string;
  tacticsUsed?: string[];
  sorryCount: number;
}

export interface CASCertificate {
  id: string;
  engine: 'PSLQ' | 'SMT_FARKAS' | 'BUCHBERGER' | 'INTERVAL_ARITHMETIC' | 'E_GRAPH';
  target: string;
  provenance: string;
  verified: boolean;
  timestamp: number;
  payload: Record<string, any>;
  sha256Hash: string;
}

export interface SwarmTask {
  id: string;
  agentId: string;
  strategyId: StrategyId;
  title: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  outputSummary?: string;
}

export interface LedgerEntry {
  id: string;
  timestamp: number;
  strategyId: StrategyId;
  event: string;
  evidenceHash: string;
  costUSD: number;
  kernelValid: boolean;
}

export interface TacticWeight {
  name: string;
  weight: number;
  successRate: number;
  totalInvocations: number;
  avgLatencyMs: number;
}

export interface LearnedHeuristic {
  id: string;
  ruleName: string;
  pattern: string;
  synthesizedTactic: string;
  confidence: number;
  verifiedEpoch: number;
}

export interface SystemWeakness {
  id: string;
  type: 'low_tactic_yield' | 'high_latency_tool' | 'blocked_track' | 'dag_bottleneck' | 'budget_friction';
  severity: 'critical' | 'high' | 'medium' | 'low';
  targetComponent: string;
  description: string;
  detectedAt: number;
  status: 'detected' | 'remediating' | 'resolved';
  remediationAction: string;
  resolvedAt?: number;
  performanceImpact: string;
}

export interface RemediationEntry {
  id: string;
  weaknessId: string;
  timestamp: number;
  weaknessType: string;
  actionTaken: string;
  outcome: string;
  efficiencyGain: number;
}

export interface AutoRemediationStats {
  totalDetected: number;
  totalResolved: number;
  autoFixSuccessRate: number;
  avgResolutionTimeMs: number;
  criticalResolvedCount: number;
}

export interface SelfLearningEngineState {
  epoch: number;
  tacticWeights: TacticWeight[];
  learnedHeuristics: LearnedHeuristic[];
  evolutionLog: { epoch: number; timestamp: number; mutation: string; deltaAccuracy: number }[];
  detectedWeaknesses?: SystemWeakness[];
  remediationLog?: RemediationEntry[];
  autoRemediationStats?: AutoRemediationStats;
}

export interface GeneratedTool {
  id: string;
  name: string;
  type: 'LeanTactic' | 'SMTSolver' | 'CASTransformer' | 'ASTMutator';
  code: string;
  language: 'Lean4' | 'Python' | 'C++' | 'TypeScript';
  benchmarkMs: number;
  verified: boolean;
  createdAt: number;
  usageCount: number;
  promotedFromHeuristicId?: string;
  promotedAtEpoch?: number;
  efficiencyGainPercentage?: number;
  successRate?: number;
}

export type SubproblemDomain = 
  | 'analytic_nt'
  | 'pde'
  | 'qft'
  | 'tcs'
  | 'arithmetic_ag'
  | 'complex_ag'
  | 'geometric_topology';

export interface SubproblemWorkflowConfig {
  domain: SubproblemDomain;
  title: string;
  targetProblemId: MillenniumProblemId;
  parameters: Record<string, any>;
}

export interface SubproblemWorkflowResult {
  id: string;
  domain: SubproblemDomain;
  title: string;
  timestamp: number;
  verified: boolean;
  summary: string;
  leanSubLemmas: LemmaNode[];
  casCertificate: CASCertificate;
  metrics: Record<string, any>;
  barrierCheck: {
    passed: boolean;
    barrierName: string;
    reasoning: string;
  };
}

export interface DeepAnalytics {
  tokenEfficiency: number;
  kernelPassRate: number;
  costPerLemmaUSD: number;
  tacticDistribution: { name: string; percentage: number; count: number }[];
  proofDepthTimeline: { timestamp: number; depth: number; lemmasProved: number }[];
  budgetTrend: { timestamp: number; spent: number }[];
  toolPromotionMetrics?: {
    totalPromotedTools: number;
    avgEfficiencyGain: number;
    highestPerformingTool: string;
    autoPromotionCount: number;
    manualPromotionCount: number;
  };
}

export interface SupervisorState {
  mode: 'FULL' | 'NO_LLM' | 'NO_STORE' | 'DETERMINISTIC_ONLY' | 'SAFE_HALT';
  repairsThisHour: number;
  consecutiveFailures: Record<string, number>;
  consecutiveCanaries: Record<string, number>;
  lastProbes: Record<string, any>;
  lastStepSeq: number;
}

export interface OrchestratorState {
  id?: string;
  ownerId?: string;
  problemId: MillenniumProblemId;
  targetTheorem: string;
  targetStatement: string;
  activePortfolioTier: PortfolioTier;
  activeStrategies: StrategyId[];
  tracks: StrategyTrack[];
  lemmas: LemmaNode[];
  tasks: SwarmTask[];
  ledger: LedgerEntry[];
  phase: 'idle' | 'running' | 'paused' | 'converged' | 'completed';
  spent: number;
  budget: number;
  leanVersion?: string;
  gateCount?: number;
  logs: string[];
  createdAt: number;
  agents: Agent[];
  selfLearning?: SelfLearningEngineState;
  generatedTools?: GeneratedTool[];
  analytics?: DeepAnalytics;
  subproblemResults?: SubproblemWorkflowResult[];
  supervisor?: SupervisorState;
  recombinationData?: {
    poolSize: number;
    populationSize: number;
    topFitness: number;
    ledgerCount: number;
    minedGeneCount: number;
    topHybrids: Array<{ name: string; template: string; fitness: number; domainPath: string[] }>;
  };
  crossDomainAnalysis?: CrossDomainAnalysisReport;
  proxyData?: any;
}

export interface CrossDomainMapping {
  id: string;
  sourceDomain: string;
  targetDomain: string;
  sourceGeneName: string;
  targetGeneName: string;
  matchingSorts: string[];
  mappingType: 'isomorphism' | 'functorial_transfer' | 'pipeline_chain';
  isomorphismStrength: number;
  description: string;
}

export interface CrossDomainPathway {
  id: string;
  path: string[];
  activeGenes: string[];
  combinedTemplate: string;
  mathematicalSignificance: string;
}

export interface CrossDomainAnalysisReport {
  lastAnalyzedTimestamp: number;
  activeDomainsCount: number;
  domainIntersectionsCount: number;
  mappings: CrossDomainMapping[];
  pathways: CrossDomainPathway[];
  synthesizedHeuristicsCount: number;
}

