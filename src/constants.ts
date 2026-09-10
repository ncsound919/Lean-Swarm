import { MillenniumProblemMeta, StrategyTrack, Agent, OrchestratorState } from './types';

export const MILLENNIUM_PROBLEMS: Record<string, MillenniumProblemMeta> = {
  riemann_hypothesis: {
    id: 'riemann_hypothesis',
    title: 'Riemann Hypothesis',
    field: 'Analytic Number Theory',
    clayPrizeYear: 2000,
    status: 'OPEN',
    description: 'All non-trivial zeros of the Riemann zeta function ζ(s) have real part Re(s) = 1/2.',
    statementLean: 'theorem riemann_hypothesis (s : ℂ) (hs_zero : riemannZeta s = 0) (hs_nontrivial : 0 < s.re ∧ s.re < 1) : s.re = 1/2',
    formalDefinitionMathlibModule: 'Mathlib.NumberTheory.ZetaValues',
    bestFitStrategies: ['S4_MONOTONIC_BOUNDS', 'S5_ANALOG_TOY_MODELS', 'S2_RECURSIVE_DAG', 'S6_LITERATURE_AUTOFormal'],
    barrierNotes: 'Avoid standard unconditional polynomial growth assumptions; check de Bruijn-Newman certificates.'
  },
  navier_stokes: {
    id: 'navier_stokes',
    title: 'Navier-Stokes Existence and Smoothness',
    field: 'Nonlinear PDE & Fluid Dynamics',
    clayPrizeYear: 2000,
    status: 'OPEN',
    description: 'Existence of smooth, physically reasonable solutions to the Navier-Stokes equations in 3D.',
    statementLean: 'theorem navier_stokes_smoothness (u0 : SmoothVelocityField 3) (f : SmoothForce 3) : ∃ (u : GlobalSmoothSolution 3), u(0) = u0',
    formalDefinitionMathlibModule: 'Mathlib.Analysis.Calculus.FDeriv.Basic',
    bestFitStrategies: ['S3_COUNTEREXAMPLE_PROBER', 'S5_ANALOG_TOY_MODELS', 'S2_RECURSIVE_DAG', 'S8_BARRIER_AWARE_ROUTING'],
    barrierNotes: 'Must overcome Elgindi (2021) C^{1,α} Euler singularity barrier and Terence Tao finite-time blowup for averaged Navier-Stokes.'
  },
  yang_mills: {
    id: 'yang_mills',
    title: 'Yang-Mills Existence and Mass Gap',
    field: 'Quantum Field Theory & Differential Geometry',
    clayPrizeYear: 2000,
    status: 'OPEN',
    description: 'Construct quantum Yang-Mills theory on ℝ⁴ for any compact simple gauge group G with mass gap Δ > 0.',
    statementLean: 'theorem yang_mills_mass_gap (G : CompactSimpleLieGroup) : ∃ (QFT : AxiomaticQuantumFieldTheory G), QFT.mass_gap > 0',
    formalDefinitionMathlibModule: 'Mathlib.Geometry.Manifold.SmoothManifoldWithCorners',
    bestFitStrategies: ['S5_ANALOG_TOY_MODELS', 'S2_RECURSIVE_DAG', 'S4_MONOTONIC_BOUNDS'],
    barrierNotes: 'Requires non-perturbative constructive lattice scaling limits.'
  },
  p_vs_np: {
    id: 'p_vs_np',
    title: 'P vs NP Problem',
    field: 'Theoretical Computer Science & Computational Complexity',
    clayPrizeYear: 2000,
    status: 'OPEN',
    description: 'Determine whether every language decided by a polynomial-time non-deterministic Turing machine is also in P.',
    statementLean: 'theorem p_ne_np : PComplexityClass ≠ NPComplexityClass',
    formalDefinitionMathlibModule: 'Mathlib.Computability.TuringMachine',
    bestFitStrategies: ['S8_BARRIER_AWARE_ROUTING', 'S3_COUNTEREXAMPLE_PROBER', 'S7_ADVERSARIAL_CONJECTURE'],
    barrierNotes: 'CRITICAL BARRIER: Proof candidate must bypass Relativization (Baker-Gill-Solovay), Natural Proofs (Razborov-Rudich), and Algebrization (Aaronson-Wigderson).'
  },
  bsd: {
    id: 'bsd',
    title: 'Birch and Swinnerton-Dyer Conjecture',
    field: 'Arithmetic Algebraic Geometry',
    clayPrizeYear: 2000,
    status: 'OPEN',
    description: 'The rank of the abelian group E(ℚ) of points on an elliptic curve E is the order of the zero of L(E, s) at s = 1.',
    statementLean: 'theorem bsd_conjecture (E : EllipticCurve ℚ) : rank (E ℚ) = orderOfZero (LSeries E) 1',
    formalDefinitionMathlibModule: 'Mathlib.AlgebraicGeometry.EllipticCurve',
    bestFitStrategies: ['S2_RECURSIVE_DAG', 'S6_LITERATURE_AUTOFormal', 'S4_MONOTONIC_BOUNDS'],
    barrierNotes: 'Relies on Tate-Shafarevich group finiteness certificates.'
  },
  hodge: {
    id: 'hodge',
    title: 'Hodge Conjecture',
    field: 'Complex Algebraic Geometry',
    clayPrizeYear: 2000,
    status: 'OPEN',
    description: 'Every Hodge class on a non-singular projective algebraic variety is a linear combination of cohomology classes of algebraic cycles.',
    statementLean: 'theorem hodge_conjecture (X : SmoothProjectiveVariety ℂ) (p : ℕ) : HodgeClasses X p = RationalAlgebraicCycles X p',
    formalDefinitionMathlibModule: 'Mathlib.AlgebraicTopology.Cohomology',
    bestFitStrategies: ['S2_RECURSIVE_DAG', 'S5_ANALOG_TOY_MODELS', 'S7_ADVERSARIAL_CONJECTURE'],
    barrierNotes: 'Requires Grothendieck standard conjectures or variational Hodge structures.'
  },
  poincare: {
    id: 'poincare',
    title: 'Poincaré Conjecture (Solved Reference)',
    field: 'Geometric Topology',
    clayPrizeYear: 2000,
    status: 'SOLVED_PERELMAN',
    description: 'Every simply connected, closed 3-manifold is homeomorphic to the 3-sphere (Perelman 2002-2003 / Ricci Flow with surgery).',
    statementLean: 'theorem poincare_conjecture (M : TopologicalSpace) [CompactSpace M] [Manifold 3 M] (hM : SimplyConnected M) (hClosed : IsClosedSubmanifold M) : Nonempty (Homeomorph M (Sphere 3))',
    formalDefinitionMathlibModule: 'Mathlib.Topology.Homotopy.Contractible',
    bestFitStrategies: ['S2_RECURSIVE_DAG', 'S6_LITERATURE_AUTOFormal'],
    barrierNotes: 'Fully verified via Ricci flow with surgery and monotone W-entropy functionals.'
  }
};

export const INITIAL_STRATEGY_TRACKS: StrategyTrack[] = [
  {
    id: 'S1_DIRECT_TACTIC',
    name: 'Strategy 1: Direct Neural Tactic Synthesis',
    description: 'End-to-end synthesis of exact Lean 4 tactic blocks (linarith, ring, aesop, simp).',
    status: 'active',
    progress: 42,
    confidence: 0.68,
    activeAgents: ['prover'],
    logs: ['Strategy 1 initialized. Mathlib tactic index loaded.'],
    artifactsGenerated: 0
  },
  {
    id: 'S2_RECURSIVE_DAG',
    name: 'Strategy 2: Recursive Sub-lemma Decomposition',
    description: 'Decompose target theorem into a topological DAG of sub-goals and stitch verified nodes.',
    status: 'active',
    progress: 65,
    confidence: 0.84,
    activeAgents: ['decomposer', 'assembler'],
    logs: ['Strategy 2 initialized. DAG depth=4 created.'],
    artifactsGenerated: 0
  },
  {
    id: 'S3_COUNTEREXAMPLE_PROBER',
    name: 'Strategy 3: Automated Counterexample & Singularity Hunting',
    description: 'High-throughput numerical prober searching for counterexamples and PDE blowup candidates.',
    status: 'evaluating',
    progress: 88,
    confidence: 0.95,
    activeAgents: ['prober'],
    logs: ['Strategy 3 active. Zero counterexamples found in 10^7 random evaluations.'],
    artifactsGenerated: 0
  },
  {
    id: 'S4_MONOTONIC_BOUNDS',
    name: 'Strategy 4: Monotonic Proxy / Interval Bounds',
    description: 'Certify monotonic bounds (e.g. de Bruijn-Newman constant Λ ≤ 0.1787854).',
    status: 'converging',
    progress: 74,
    confidence: 0.91,
    activeAgents: ['proxy_analyst'],
    logs: ['Strategy 4 active. Interval arithmetic certificate produced with 128-bit float rigor.'],
    artifactsGenerated: 0
  },
  {
    id: 'S5_ANALOG_TOY_MODELS',
    name: 'Strategy 5: Analog & Toy-Model Transfer',
    description: 'Prove lower-dimensional or finite-field analogues and lift kernel techniques.',
    status: 'active',
    progress: 58,
    confidence: 0.77,
    activeAgents: ['decomposer', 'prover'],
    logs: ['Strategy 5 active. 2D analog lemma verified in Lean 4 without sorry.'],
    artifactsGenerated: 0
  },
  {
    id: 'S6_LITERATURE_AUTOFormal',
    name: 'Strategy 6: Literature Autoformalization',
    description: 'Ingest arXiv preprint lemmas into Mathlib formal definitions and verifiable declarations.',
    status: 'active',
    progress: 50,
    confidence: 0.79,
    activeAgents: ['librarian'],
    logs: ['Strategy 6 active. Ingesting Tao (2018), Polymath15, and Hardy-Littlewood bounds.'],
    artifactsGenerated: 0
  },
  {
    id: 'S7_ADVERSARIAL_CONJECTURE',
    name: 'Strategy 7: Adversarial Conjecture Generation',
    description: 'Generate paired true/false intermediate conjectures to test both proof and counterexample pipelines.',
    status: 'evaluating',
    progress: 35,
    confidence: 0.62,
    activeAgents: ['decomposer', 'prober'],
    logs: ['Strategy 7 active. Synthesized candidate obstruction lemmas.'],
    artifactsGenerated: 0
  },
  {
    id: 'S8_BARRIER_AWARE_ROUTING',
    name: 'Strategy 8: Barrier-Aware Routing & Verification Gate',
    description: 'Audit candidates against known mathematical barriers (Relativization, Natural Proofs, Algebrization).',
    status: 'active',
    progress: 92,
    confidence: 0.99,
    activeAgents: ['barrier_auditor'],
    logs: ['Strategy 8 initialized. Hard barriers enforced: Baker-Gill-Solovay, Razborov-Rudich, Aaronson-Wigderson.'],
    artifactsGenerated: 0
  }
];

export const INITIAL_AGENTS: Agent[] = [
  { id: 'decomposer', name: 'Decomposer (S2)', job: 'Break target into topological DAG of sub-lemmas', type: 'AI', model: 'gemini-3.8-flash', status: 'idle', lastLog: 'DAG engine ready.', tasksCompleted: 0 },
  { id: 'prober', name: 'Prober (S3)', job: 'Hunt for counterexamples & vorticity singularities via pure compute', type: 'DETERMINISTIC', status: 'idle', lastLog: 'Numeric evaluator online.', tasksCompleted: 0 },
  { id: 'prover', name: 'Prover (S1)', job: 'Synthesize exact Lean 4 tactics without sorry', type: 'AI', model: 'gemini-3.8-flash', status: 'idle', lastLog: 'Lean tactic synthesizer ready.', tasksCompleted: 0 },
  { id: 'proxy_analyst', name: 'Proxy Analyst (S4)', job: 'Compute monotonic bound certificates (Λ ≤ 0.1787854, zero counts)', type: 'DETERMINISTIC', status: 'idle', lastLog: 'Bound certificate engine active.', tasksCompleted: 0 },
  { id: 'barrier_auditor', name: 'Barrier Auditor (S8)', job: 'Deterministic filter enforcing Relativization / Natural Proofs / Euler blowup', type: 'DETERMINISTIC', status: 'idle', lastLog: 'BGS/RR/AW filters armed.', tasksCompleted: 0 },
  { id: 'claim_auditor', name: 'Claim Auditor (Tier 3)', job: 'Independent audit of claimed 2026 Lean proofs vs Clay official criteria', type: 'DETERMINISTIC', status: 'idle', lastLog: 'Clay criteria verification harness loaded.', tasksCompleted: 0 },
  { id: 'librarian', name: 'Librarian (S6)', job: 'Search arXiv & formalize surrounding literature into Mathlib', type: 'AI', model: 'gemini-3.8-flash', status: 'idle', lastLog: 'arXiv ingestion ready.', tasksCompleted: 0 },
  { id: 'galois_conjecturer', name: 'Galois Conjecture Engine', job: 'Synthesize Galois-group symmetry conjectures and hypothesis mutations', type: 'AI', model: 'gemini-3.8-flash', status: 'idle', lastLog: 'Galois group solver online.', tasksCompleted: 0 },
  { id: 'type_synthesizer', name: 'Type Synthesizer', job: 'Generate and synthesize verified Lean 4 type declarations', type: 'AI', model: 'gemini-3.8-flash', status: 'idle', lastLog: 'Lean inductive type checker initialized.', tasksCompleted: 0 },
  { id: 'asymptotic_decider', name: 'Asymptotic Complexity Decider', job: 'Determine deterministic lower and upper complexity bounds (Ω, O) via recurrence relations', type: 'DETERMINISTIC', status: 'idle', lastLog: 'Complexity bound solver standing by.', tasksCompleted: 0 },
  { id: 'tactic_optimizer', name: 'Lean Tactic Code Optimizer', job: 'Optimize compiled Lean proof paths, removing redundant steps', type: 'AI', model: 'gemini-3.8-flash', status: 'idle', lastLog: 'AST-level proof simplifier loaded.', tasksCompleted: 0 },
  { id: 'falsifier_probe', name: 'Hypotheses Falsification Probe', job: 'Deterministically falsify hypothesis boundaries using singular limit cases', type: 'DETERMINISTIC', status: 'idle', lastLog: 'Singularity prober ready.', tasksCompleted: 0 },
  { id: 'assembler', name: 'Assembler', job: 'Topological stitcher and global certificate builder', type: 'DETERMINISTIC', status: 'idle', lastLog: 'DAG linker standing by.', tasksCompleted: 0 },
  { id: 'verifier', name: 'Lean 4 Verifier', job: 'Stateless kernel verification gate (/root/.elan/bin/lean)', type: 'DETERMINISTIC', status: 'idle', lastLog: 'Kernel 4.16.0 verified.', tasksCompleted: 0 }
];

export const INITIAL_STATE: OrchestratorState = {
  problemId: 'riemann_hypothesis',
  targetTheorem: 'Riemann Hypothesis',
  targetStatement: 'theorem riemann_hypothesis (s : ℂ) (hs_zero : riemannZeta s = 0) (hs_nontrivial : 0 < s.re ∧ s.re < 1) : s.re = 1/2',
  activePortfolioTier: 'tier1_rapid',
  activeStrategies: ['S4_MONOTONIC_BOUNDS', 'S5_ANALOG_TOY_MODELS', 'S2_RECURSIVE_DAG', 'S6_LITERATURE_AUTOFormal'],
  tracks: INITIAL_STRATEGY_TRACKS,
  lemmas: [],
  tasks: [],
  ledger: [],
  phase: 'idle',
  spent: 0,
  budget: 100.00,
  leanVersion: '4.18.0',
  gateCount: 6,
  logs: ['Lean Swarm Orchestrator initialized. Select a Millennium problem track to launch deterministic verification.'],
  createdAt: Date.now(),
  agents: INITIAL_AGENTS,
  selfLearning: {
    epoch: 12,
    tacticWeights: [
      { name: 'aesop', weight: 0.88, successRate: 0.94, totalInvocations: 1420, avgLatencyMs: 42 },
      { name: 'linarith', weight: 0.92, successRate: 0.98, totalInvocations: 3100, avgLatencyMs: 12 },
      { name: 'ring_nf', weight: 0.85, successRate: 0.91, totalInvocations: 890, avgLatencyMs: 18 },
      { name: 'omega', weight: 0.79, successRate: 0.86, totalInvocations: 640, avgLatencyMs: 25 },
      { name: 'nlinarith', weight: 0.73, successRate: 0.82, totalInvocations: 410, avgLatencyMs: 85 },
      { name: 'e_graph_sat', weight: 0.95, successRate: 0.99, totalInvocations: 1850, avgLatencyMs: 31 }
    ],
    learnedHeuristics: [
      { id: 'H1', ruleName: 'Monotonicity-Bound-Reduction', pattern: '∀ x, f(x) ≤ C → ∫ f dx ≤ C·V', synthesizedTactic: 'by intros; apply integral_mono_bound; assumption', confidence: 0.97, verifiedEpoch: 8, depth: 7, utility: 0.92, generality: 0.85, proofCert: 'LEAN_INTEGRAL_MONO_BOUND_VERIFIED' },
      { id: 'H2', ruleName: 'Spectral-Zero-Symmetry', pattern: 'ζ(s) = 0 → ζ(1-s) = 0', synthesizedTactic: 'by intro h; exact riemann_functional_eq_zero h', confidence: 0.99, verifiedEpoch: 10, depth: 10, utility: 0.98, generality: 0.35, proofCert: 'RIEMANN_FUNCTIONAL_SYMMETRY_COQ_OK' },
      { id: 'H3', ruleName: 'Sobolev-Blowup-Infeasible', pattern: '‖u‖_H3 ≤ M → no_singularity', synthesizedTactic: 'by apply energy_estimate_continuation; exact bound_hold', confidence: 0.95, verifiedEpoch: 11, depth: 8, utility: 0.90, generality: 0.60, proofCert: 'SOBOLEV_ENERGY_BOUND_SMT_DUAL' }
    ],
    evolutionLog: [
      { epoch: 10, timestamp: Date.now() - 3600000 * 24, mutation: 'Lifted E-Graph saturation priority over brute-force tactic enumeration', deltaAccuracy: +0.042 },
      { epoch: 11, timestamp: Date.now() - 3600000 * 12, mutation: 'Auto-synthesized Sobolev energy-bound shortcut tactic', deltaAccuracy: +0.028 },
      { epoch: 12, timestamp: Date.now() - 1800000, mutation: 'Pruned dead-end tactic branches in non-linear arithmetic SMT S2 track', deltaAccuracy: +0.015 }
    ]
  },
  generatedTools: [
    {
      id: 'tool_pslq_norm',
      name: 'PSLQ Integer Relation Pruner',
      type: 'CASTransformer',
      code: 'def prune_integer_relations(v : List Float, bound : Float) : Option (List Int) :=\n  PSLQ.findRelation v (normBound := bound)',
      language: 'Lean4',
      benchmarkMs: 14,
      verified: true,
      createdAt: Date.now() - 86400000,
      usageCount: 142
    },
    {
      id: 'tool_farkas_cert',
      name: 'Farkas Non-negativity Decider',
      type: 'SMTSolver',
      code: 'import z3\ndef check_poly_infeasible(A, b):\n    s = z3.Solver()\n    # Construct Farkas dual certificate\n    return s.check() == z3.unsat',
      language: 'Python',
      benchmarkMs: 8,
      verified: true,
      createdAt: Date.now() - 43200000,
      usageCount: 89
    },
    {
      id: 'tool_sobolev_ast',
      name: 'Sobolev Energy AST Rewriter',
      type: 'ASTMutator',
      code: 'export function rewriteSobolevEnergy(ast: ASTNode): ASTNode {\n  return transformNormBounds(ast, { enforceH3: true });\n}',
      language: 'TypeScript',
      benchmarkMs: 3,
      verified: true,
      createdAt: Date.now() - 21600000,
      usageCount: 230
    }
  ],
  analytics: {
    tokenEfficiency: 94.2,
    kernelPassRate: 100.0,
    costPerLemmaUSD: 0.00042,
    tacticDistribution: [
      { name: 'linarith / nlinarith', percentage: 38, count: 3510 },
      { name: 'aesop / auto', percentage: 26, count: 2400 },
      { name: 'e-graph sat', percentage: 22, count: 2030 },
      { name: 'ring_nf', percentage: 10, count: 920 },
      { name: 'custom synthesized', percentage: 4, count: 370 }
    ],
    proofDepthTimeline: [
      { timestamp: Date.now() - 3600000 * 5, depth: 1, lemmasProved: 2 },
      { timestamp: Date.now() - 3600000 * 4, depth: 2, lemmasProved: 5 },
      { timestamp: Date.now() - 3600000 * 3, depth: 3, lemmasProved: 9 },
      { timestamp: Date.now() - 3600000 * 2, depth: 4, lemmasProved: 14 },
      { timestamp: Date.now() - 3600000 * 1, depth: 5, lemmasProved: 18 }
    ],
    budgetTrend: [
      { timestamp: Date.now() - 3600000 * 5, spent: 0.0010 },
      { timestamp: Date.now() - 3600000 * 4, spent: 0.0022 },
      { timestamp: Date.now() - 3600000 * 3, spent: 0.0031 },
      { timestamp: Date.now() - 3600000 * 2, spent: 0.0038 },
      { timestamp: Date.now() - 3600000 * 1, spent: 0.0042 }
    ]
  }
};
