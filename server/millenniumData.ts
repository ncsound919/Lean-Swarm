import { MillenniumProblemMeta, StrategyTrack, StrategyId } from './types.ts';

export const MILLENNIUM_PROBLEMS: Record<string, MillenniumProblemMeta> = {
  riemann_hypothesis: {
    id: 'riemann_hypothesis',
    title: 'Riemann Hypothesis',
    clayPrizeYear: 2000,
    prizeAmount: '$1,000,000',
    informalStatement: 'All non-trivial zeros of the Riemann zeta function ζ(s) have real part equal to 1/2.',
    formalStatementLean: `import Mathlib.NumberTheory.ZetaValues

open Complex

/-- The Riemann Hypothesis: all non-trivial zeros of the Riemann zeta function lie on the critical line Re(s) = 1/2. -/
def RiemannHypothesis : Prop :=
  ∀ s : ℂ, riemannZeta s = 0 → 0 < s.re → s.re < 1 → s.re = 1 / 2`,
    clayOfficialDocUrl: 'https://www.claymath.org/millennium/riemann-hypothesis/',
    bestFitStrategies: ['S3_COUNTEREXAMPLE_HUNT', 'S4_MEASURABLE_PROXY', 'S6_AUTOFORMALIZATION'],
    recommendedTier: 'tier2_proxy',
    knownBarriers: [
      'Zero-free region barrier: Classical analytic methods stall at 1 - c/log(|t|)',
      'GUE hypothesis spectral interpretation obstruction',
      'Non-constructive mollifier limits for zero proportion bounds'
    ],
    activeObjective: 'Compress de Bruijn–Newman upper bound Λ ≤ 0.1787854 toward Λ ≤ 0; certify critical line zero proportion > 0.6725'
  },
  p_vs_np: {
    id: 'p_vs_np',
    title: 'P versus NP Problem',
    clayPrizeYear: 2000,
    prizeAmount: '$1,000,000',
    informalStatement: 'Is every problem whose solution can be efficiently verified by a computer also efficiently solvable (P = NP)?',
    formalStatementLean: `import Mathlib.Computability.Complexity

/-- P vs NP: Does polynomial-time deterministic computation equal non-deterministic polynomial time? -/
def P_ne_NP : Prop :=
  ComplexityClass.P ≠ ComplexityClass.NP`,
    clayOfficialDocUrl: 'https://www.claymath.org/millennium/p-vs-np/',
    bestFitStrategies: ['S2_RECURSIVE_DECOMP', 'S6_AUTOFORMALIZATION', 'S8_BARRIER_ROUTING'],
    recommendedTier: 'tier1_infra',
    knownBarriers: [
      'Relativization (Baker-Gill-Solovay 1975): Diagonalization techniques fail across oracles',
      'Natural Proofs (Razborov-Rudich 1997): Constructive combinatorics cannot prove circuit lower bounds under cryptographic PRG assumptions',
      'Algebrization (Aaronson-Wigderson 2008): Algebraic oracle extensions preserve class collapse'
    ],
    activeObjective: 'Enforce barrier-aware routing against BGS/RR/AW; target meta-complexity sub-lemmas (MCSP circuit lower bounds)'
  },
  navier_stokes: {
    id: 'navier_stokes',
    title: 'Navier–Stokes Existence & Smoothness',
    clayPrizeYear: 2000,
    prizeAmount: '$1,000,000',
    informalStatement: 'Do solutions to the 3D incompressible Navier–Stokes equations always exist and remain smooth for all positive time given smooth initial data?',
    formalStatementLean: `/-- Incompressible 3D Navier-Stokes equations on ℝ³ with kinematic viscosity ν > 0. -/
def IncompressibleNavierStokes3D (ν : ℝ) (hν : ν > 0) : Prop :=
  ∀ (u₀ : (Fin 3 → ℝ) → (Fin 3 → ℝ)),
    (∀ x, (∑ i : Fin 3, partialDeriv i (u₀ · i) x) = 0) →
    (IsRapidlyDecaying u₀) →
    ∃ (u : ℝ → (Fin 3 → ℝ) → (Fin 3 → ℝ)) (p : ℝ → (Fin 3 → ℝ) → ℝ),
      IsSmoothSolution u p ν ∧ (∀ t ≥ 0, KineticEnergy u t ≤ KineticEnergy u₀ 0)`,
    clayOfficialDocUrl: 'https://www.claymath.org/millennium/navier-stokes-equations/',
    bestFitStrategies: ['S3_COUNTEREXAMPLE_HUNT', 'S5_ANALOG_TOY_MODEL', 'S6_AUTOFORMALIZATION'],
    recommendedTier: 'tier3_audit',
    knownBarriers: [
      'Supercritical scaling barrier: Energy norm L² is supercritical with respect to 3D scaling',
      'Euler singularity formation: C^{1,α} blowup exists for Euler (Elgindi 2021), viscous dissipation must be preserved',
      'Depletion of nonlinearity mechanisms (vorticity alignment)'
    ],
    activeObjective: 'High-value audit of claimed 2026 Lean proofs (OpenAI claim verification) against Clay official formulation; 3D numerical singularity hunting'
  },
  yang_mills: {
    id: 'yang_mills',
    title: 'Yang–Mills Existence and Mass Gap',
    clayPrizeYear: 2000,
    prizeAmount: '$1,000,000',
    informalStatement: 'Establish mathematically rigorous quantum Yang–Mills theory on ℝ⁴ with gauge group SU(N) and prove a non-zero mass gap Δ > 0.',
    formalStatementLean: `/-- Yang-Mills Existence and Mass Gap on 4-dimensional Euclidean space ℝ⁴ with non-abelian gauge group SU(N). -/
def YangMillsMassGap (N : ℕ) (hN : N ≥ 2) : Prop :=
  ∃ (H : HilbertSpace) (H_Hamiltonian : SelfAdjointOperator H),
    (Spectrum H_Hamiltonian ⊆ Set.Ici 0) ∧
    (∃ (vac : H), H_Hamiltonian vac = 0) ∧
    (∃ (Δ : ℝ), Δ > 0 ∧ (Spectrum H_Hamiltonian ∩ Set.Ioo 0 Δ = ∅))`,
    clayOfficialDocUrl: 'https://www.claymath.org/millennium/yang-mills-and-mass-gap/',
    bestFitStrategies: ['S2_RECURSIVE_DECOMP', 'S5_ANALOG_TOY_MODEL', 'S6_AUTOFORMALIZATION'],
    recommendedTier: 'tier1_infra',
    knownBarriers: [
      'Constructive QFT ultraviolet divergence in 4D',
      'Gribov ambiguity in gauge fixing non-perturbative configurations',
      'Infrared confinement without perturbation theory'
    ],
    activeObjective: 'Formalize constructive QFT axioms in Lean 4; verify 2D/3D Yang-Mills toy-models and lattice transfer operators'
  },
  bsd: {
    id: 'bsd',
    title: 'Birch and Swinnerton-Dyer Conjecture',
    clayPrizeYear: 2000,
    prizeAmount: '$1,000,000',
    informalStatement: 'The algebraic rank of an elliptic curve E over ℚ is equal to the order of vanishing of its L-function L(E, s) at s = 1.',
    formalStatementLean: `import Mathlib.AlgebraicGeometry.EllipticCurve

/-- Birch and Swinnerton-Dyer Conjecture: rank(E(ℚ)) = ord_{s=1} L(E, s). -/
def BSD_Conjecture (E : EllipticCurve ℚ) : Prop :=
  AlgebraicRank E = OrderOfVanishingAtOne (LFunction E)`,
    clayOfficialDocUrl: 'https://www.claymath.org/millennium/birch-and-swinnerton-dyer-conjecture/',
    bestFitStrategies: ['S3_COUNTEREXAMPLE_HUNT', 'S5_ANALOG_TOY_MODEL', 'S6_AUTOFORMALIZATION'],
    recommendedTier: 'tier1_infra',
    knownBarriers: [
      'Finiteness of Tate-Shafarevich group Ш(E) is unproven in general',
      'Higher analytic rank (rank ≥ 2) lacks modular parameterization techniques'
    ],
    activeObjective: 'Compute and verify L-function Taylor expansions for elliptic curve databases; formalize Gross-Zagier & Kolyvagin rank 0/1 theorems'
  },
  hodge: {
    id: 'hodge',
    title: 'Hodge Conjecture',
    clayPrizeYear: 2000,
    prizeAmount: '$1,000,000',
    informalStatement: 'On a non-singular complex projective algebraic variety, every Hodge class is a linear combination with rational coefficients of the cohomology classes of algebraic cycles.',
    formalStatementLean: `/-- The Hodge Conjecture: Hodge classes are algebraic. -/
def HodgeConjecture (X : ComplexProjectiveManifold) (p : ℕ) : Prop :=
  HodgeClasses X p = (AlgebraicCyclesRat X p).map (CycleClassMap X p)`,
    clayOfficialDocUrl: 'https://www.claymath.org/millennium/hodge-conjecture/',
    bestFitStrategies: ['S3_COUNTEREXAMPLE_HUNT', 'S5_ANALOG_TOY_MODEL', 'S6_AUTOFORMALIZATION'],
    recommendedTier: 'tier1_infra',
    knownBarriers: [
      'Failure of integral Hodge conjecture (Atiyah-Hirzebruch counterexamples show torsion obstruction)',
      'Constructing algebraic subvarieties from transcendental cohomology data'
    ],
    activeObjective: 'Formalize Lefschetz (1,1)-theorem for divisors; counterexample search on non-projective Kähler analogs'
  },
  poincare: {
    id: 'poincare',
    title: 'Poincaré Conjecture (Solved)',
    clayPrizeYear: 2000,
    prizeAmount: '$1,000,000 (Declined by Perelman)',
    informalStatement: 'Every simply connected, closed 3-dimensional manifold is homeomorphic to the 3-sphere.',
    formalStatementLean: `/-- Poincaré Conjecture: Every closed simply connected 3-manifold is homeomorphic to S³. -/
def PoincareConjecture : Prop :=
  ∀ (M : TopologicalSpace) [CompactSpace M] [T2Space M] (hManifold : IsManifold 3 M),
    IsSimplyConnected M → Nonempty (Homeomorph M (Sphere 3))`,
    clayOfficialDocUrl: 'https://www.claymath.org/millennium/poincare-conjecture/',
    bestFitStrategies: ['S1_DIRECT_PROOF', 'S6_AUTOFORMALIZATION'],
    recommendedTier: 'tier1_infra',
    knownBarriers: [
      'Surgery across finite-time neckpinch singularities in Ricci flow'
    ],
    activeObjective: 'Benchmark corpus: Formalize Perelman Ricci flow with surgery in Lean 4 as an end-to-end autonomous validation suite'
  }
};

export const INITIAL_STRATEGY_TRACKS: StrategyTrack[] = [
  {
    id: 'S1_DIRECT_PROOF',
    name: 'Direct Proof Search',
    description: 'Tactic-level Lean search against the full formalized statement.',
    objectiveFunction: 'Find compileable tactic sequence: Lean 4 kernel exit code == 0 with 0 sorry',
    deterministicComponent: 'Stateless Lean 4 kernel execution gate (/root/.elan/bin/lean)',
    status: 'idle',
    progressPercent: 0,
    currentMetricLabel: 'Compile Status',
    currentMetricValue: 'IDLE',
    targetMetricValue: 'EXIT_0_NO_SORRY',
    activeAgents: ['prover', 'verifier'],
    logs: ['Strategy 1 initialized. Direct tactic synthesis pipeline ready.'],
    artifactsGenerated: 0
  },
  {
    id: 'S2_RECURSIVE_DECOMP',
    name: 'Recursive Decomposition',
    description: 'Break target into a lemma DAG; prove what is provable; isolate the irreducible crux.',
    objectiveFunction: 'Maximize DAG verified depth while isolating irreducible node with minimal dependencies',
    deterministicComponent: 'Acyclicity graph validator (Kahn topological sort) + per-node kernel checks',
    status: 'idle',
    progressPercent: 0,
    currentMetricLabel: 'DAG Solved Ratio',
    currentMetricValue: '0/0 Nodes',
    targetMetricValue: '100% DAG Verified',
    activeAgents: ['decomposer', 'prover', 'assembler'],
    logs: ['Strategy 2 initialized. DAG decomposition state machine ready.'],
    artifactsGenerated: 0
  },
  {
    id: 'S3_COUNTEREXAMPLE_HUNT',
    name: 'Counterexample Hunting',
    description: 'Computational search to kill conjectures or find obstructions using pure numeric/discrete compute.',
    objectiveFunction: 'Search parameter space {θ} to find witness x where P(x) = False',
    deterministicComponent: 'High-precision numerical evaluator, Ladyzhenskaya-Prodi-Serrin integrator, SAT solver',
    status: 'idle',
    progressPercent: 0,
    currentMetricLabel: 'Search Space Sampled',
    currentMetricValue: '0 samples',
    targetMetricValue: 'Witness or 10^7 Checked',
    activeAgents: ['prober'],
    logs: ['Strategy 3 initialized. Computational hunter online.'],
    artifactsGenerated: 0
  },
  {
    id: 'S4_MEASURABLE_PROXY',
    name: 'Measurable Proxy Tracks',
    description: 'Attack a real-valued proxy where progress is incremental (e.g., de Bruijn–Newman constant Λ ≤ 0.1787854).',
    objectiveFunction: 'Monotonic minimization: min Λ such that H_t has only real zeros (target: Λ ≤ 0)',
    deterministicComponent: 'Interval arithmetic bound certificate validator and sign-change zero counter',
    status: 'idle',
    progressPercent: 0,
    currentMetricLabel: 'Current Bound Λ',
    currentMetricValue: '0.1787854',
    targetMetricValue: 'Λ ≤ 0.0',
    activeAgents: ['proxy_analyst', 'verifier'],
    logs: ['Strategy 4 initialized. Real-valued proxy tracking active (Polymath 15 certificate Λ ≤ 0.1787854 loaded).'],
    artifactsGenerated: 1
  },
  {
    id: 'S5_ANALOG_TOY_MODEL',
    name: 'Analog & Toy-Model Transfer',
    description: 'Prove the function-field, 2D, or averaged version; lift the proof skeleton to target.',
    objectiveFunction: 'Kernel verification of toy-model theorem in Lean 4; extract structural tactic tactics',
    deterministicComponent: 'Lean 4 kernel check of analog formulation',
    status: 'idle',
    progressPercent: 0,
    currentMetricLabel: 'Analog Verification',
    currentMetricValue: '2D/1D Models Ready',
    targetMetricValue: 'Skeleton Transferred',
    activeAgents: ['prover', 'librarian'],
    logs: ['Strategy 5 initialized. Analog and toy-model library loaded (2D Navier-Stokes, Weil function-field).'],
    artifactsGenerated: 0
  },
  {
    id: 'S6_AUTOFORMALIZATION',
    name: 'Autoformalization',
    description: 'Formalize surrounding literature so the search space is reachable in Lean / Mathlib.',
    objectiveFunction: 'Compile literature paper definitions and intermediate theorems into typechecked Lean 4 modules',
    deterministicComponent: 'Mathlib typeclass elaboration and environment compilation',
    status: 'idle',
    progressPercent: 0,
    currentMetricLabel: 'Literature Ingested',
    currentMetricValue: 'ArXiv Connected',
    targetMetricValue: 'Mathlib PR Ready',
    activeAgents: ['librarian', 'prover'],
    logs: ['Strategy 6 initialized. Mathlib4 formalization engine active.'],
    artifactsGenerated: 0
  },
  {
    id: 'S7_ADVERSARIAL_CONJECTURE',
    name: 'Adversarial Conjecture Generation',
    description: 'Swarm proposes intermediate conjectures; parallel agents race to prove and disprove; survivors enter ledger.',
    objectiveFunction: 'Generate conjecture C; race Prover(C) vs CounterexampleHunter(¬C); filter unrefuted survivors',
    deterministicComponent: 'Dual-gate: Kernel check for proof vs numeric witness for disproof',
    status: 'idle',
    progressPercent: 0,
    currentMetricLabel: 'Conjecture Ledger',
    currentMetricValue: '0 proposed',
    targetMetricValue: 'Equivalence Filtered',
    activeAgents: ['decomposer', 'prober', 'prover'],
    logs: ['Strategy 7 initialized. Adversarial conjecture generation engine active.'],
    artifactsGenerated: 0
  },
  {
    id: 'S8_BARRIER_ROUTING',
    name: 'Barrier-Aware Routing',
    description: 'Encode known barrier theorems as hard constraints so agents avoid provably doomed technique classes.',
    objectiveFunction: 'Audit proof proposal: reject if Relativizing(T) ∨ NaturalProof(T) ∨ Algebrizing(T)',
    deterministicComponent: 'Deterministic constraint check in orchestrator against barrier theorem criteria',
    status: 'idle',
    progressPercent: 0,
    currentMetricLabel: 'Barrier Filters',
    currentMetricValue: '3 Active (BGS/RR/AW)',
    targetMetricValue: '0 Collisions Allowed',
    activeAgents: ['barrier_auditor'],
    logs: ['Strategy 8 initialized. Hard barriers enforced: Baker-Gill-Solovay, Razborov-Rudich, Aaronson-Wigderson.'],
    artifactsGenerated: 0
  }
];
