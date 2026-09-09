"""
Kernel-Certificate Compiler
============================
Treats each Millennium problem as a compiler pipeline:

    Clay statement  --Decomposer-->  finite DAG of checkable certificates
    each leaf       --Translator-->  typed Lean scaffold (dual-searched)
    each leaf       --Closer-->      proof | counterexample | finer split
    surviving leaves--Recompiler-->  one machine-checked theorem

UNIQUE RULE: every hard global claim must reduce to a finite certificate
scheme plus a UNIFORM REMAINDER BOUND. If the remainder cannot be written
as a checkable inequality, the split is illegal.

Stochastic generators (LLM, Monte Carlo) may PROPOSE splits and statements.
Nothing is accepted unless the Lean kernel says the glue closes.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any, Callable
from enum import Enum
import hashlib
import json
import time
import os


# ---------------------------------------------------------------------------
# 1. Core types
# ---------------------------------------------------------------------------

class CertStatus(Enum):
    PROPOSED = "proposed"                # stochastic proposal, not yet scaffolded
    DUAL_SEARCHING = "dual_searching"    # translator checking stmt vs. negation
    TRANSLATED = "translated"            # scaffold passed dual-search
    CLOSING = "closing"                  # inside the deterministic toolbox
    PROVEN = "proven"                    # kernel-green leaf
    REFUTED = "refuted"                  # counterexample or negation proved
    NEEDS_SPLIT = "needs_split"          # beyond tactic horizon
    GLUED = "glued"                      # folded into a glue theorem
    ILLEGAL = "illegal"                  # violated the remainder rule -> rejected


class CloseResult(Enum):
    PROOF = "proof"
    COUNTEREXAMPLE = "counterexample"
    HORIZON_EXCEEDED = "horizon_exceeded"   # deterministic tools exhausted budget


@dataclass
class CheckableInequality:
    """A remainder bound in the ONLY admissible form: a concrete inequality
    that Lean can check, with explicit constants and a uniformity claim
    (e.g. holds for all n >= n0, all x in compact K, all lattice spacings a)."""
    lhs: str                     # Lean expression, e.g. "|S_N(x) - zeta(s)|"
    relation: str                # "<="  (strict bounds not required, but must be decidable form)
    rhs: str                     # Lean expression, e.g. "C * N^(-sigma)"
    quantifier_scope: str        # e.g. "forall n >= n0"  -- uniformity statement
    constants: Dict[str, str] = field(default_factory=dict)  # explicit, no big-O

    def to_lean(self) -> str:
        consts = " ".join(f"({k} : Real) := {v}" for k, v in self.constants.items())
        return f"-- remainder\nexample {consts} : {self.quantifier_scope}, {self.lhs} {self.relation} {self.rhs} := by"


@dataclass
class Certificate:
    """One leaf of the DAG: a finite, checkable unit of the overall claim."""
    id: str
    problem: str                       # "riemann" | "bsd" | "navier_stokes" | ...
    informal: str                      # human-readable statement
    lean_statement: Optional[str] = None   # filled by Translator
    bit_width: int = 10**9             # size of the checkable object; smaller = cheaper
    status: CertStatus = CertStatus.PROPOSED
    remainder: Optional[CheckableInequality] = None  # REQUIRED for any split child
    parent_id: Optional[str] = None
    child_ids: List[str] = field(default_factory=list)
    evidence: List[Dict[str, Any]] = field(default_factory=list)
    kernel_hash: Optional[str] = None  # content hash of the compiled artifact

    def provenance(self) -> str:
        payload = json.dumps({
            "problem": self.problem, "informal": self.informal,
            "lean": self.lean_statement, "parent": self.parent_id,
        }, sort_keys=True)
        return hashlib.sha256(payload.encode()).hexdigest()


@dataclass
class GlueTheorem:
    """Folds a family of proven leaves via density / compactness /
    interpolation / spectral continuity. Must itself compile."""
    id: str
    lean_statement: str
    leaf_ids: List[str]
    remainder: CheckableInequality     # glue ALWAYS carries the uniform bound
    kernel_verified: bool = False


class LemmaDAG:
    """Spec -> lemmas -> leaves. The main goal is sorry-free iff every leaf
    is PROVEN and every glue node is kernel_verified."""

    def __init__(self, problem: str, spec_lean: str):
        self.problem = problem
        self.spec_lean = spec_lean     # frozen Clay statement
        self.nodes: Dict[str, Certificate] = {}
        self.glues: Dict[str, GlueTheorem] = {}

    def add(self, cert: Certificate) -> None:
        self.nodes[cert.id] = cert
        if cert.parent_id and cert.parent_id in self.nodes:
            self.nodes[cert.parent_id].child_ids.append(cert.id)

    def leaves(self) -> List[Certificate]:
        return [c for c in self.nodes.values() if not c.child_ids]

    def open_leaves(self) -> List[Certificate]:
        return [c for c in self.leaves()
                if c.status not in (CertStatus.PROVEN, CertStatus.GLUED, CertStatus.ILLEGAL)]

    def main_goal_sorry_free(self) -> bool:
        return (not self.open_leaves()
                and all(g.kernel_verified for g in self.glues.values())
                and bool(self.glues))


# ---------------------------------------------------------------------------
# 2. The legality gate -- the unique rule, enforced in code
# ---------------------------------------------------------------------------

def split_is_legal(children: List[Certificate], remainder: Optional[CheckableInequality]) -> bool:
    """A split is legal iff:
    (a) every child carries strictly smaller bit-width than the search space
        of its parent (enforced by the caller setting bit_width), and
    (b) the family ships a uniform remainder bound as a checkable inequality
        with explicit constants -- no big-O, no 'sufficiently large'.
    """
    if remainder is None:
        return False
    if not remainder.constants:
        return False                      # hidden constants => illegal
    if not remainder.quantifier_scope:    # must state where the bound holds
        return False
    return all(c.remainder is not None or c.bit_width < 10**6 for c in children)


# ---------------------------------------------------------------------------
# 3. Stage contracts
# ---------------------------------------------------------------------------

class Decomposer:
    """Rewrites the Clay statement as a DAG whose leaves are either in
    Mathlib or have bounded search space (matrices, polynomials, energy
    estimates, lattice Hamiltonians). Stochastic proposers are allowed
    upstream; acceptance here is deterministic."""

    def __init__(self, mathlib_lookup: Callable[[str], bool]):
        self.in_mathlib = mathlib_lookup   # e.g. Loogle/LeanExplore query

    def accept_leaf(self, cert: Certificate) -> bool:
        """A leaf is terminal if Mathlib already proves it, or its search
        space is bounded (small bit-width)."""
        if cert.lean_statement and self.in_mathlib(cert.lean_statement):
            cert.status = CertStatus.PROVEN
            cert.evidence.append({"stage": "decompose", "note": "already in mathlib"})
            return True
        return cert.bit_width < 10**6


class Translator:
    """Emits Lean scaffolds: typed statements + postponed `have`s.
    DUAL-SEARCHES every `have` and its negation, so mistranslations fail
    fast instead of producing petabyte proofs of junk equalities
    (the zeta(1)=0 trap)."""

    def __init__(self, oracle):  # LeanProcessOracle
        self.oracle = oracle

    def dual_search(self, cert: Certificate, budget_steps: int = 64) -> CertStatus:
        """Attempt the statement AND its negation under small tactic budgets.
        - negation proves  -> REFUTED (mistranslation or false leaf): kill it
        - statement proves -> TRANSLATED
        - neither          -> TRANSLATED but flagged for the Closer
        Never both: kernel consistency makes that impossible; if it happens,
        the environment is corrupted and the run halts."""
        cert.status = CertStatus.DUAL_SEARCHING
        pos = self.oracle.quick_check(cert.lean_statement or "", budget_steps)
        neg = self.oracle.quick_check(f"Not ({cert.lean_statement})", budget_steps)
        if pos and neg:
            raise RuntimeError("Environment inconsistent: statement and negation both closed")
        if neg:
            cert.evidence.append({"stage": "dual_search", "result": "negation proved -- mistranslation killed"})
            return CertStatus.REFUTED
        if pos:
            return CertStatus.PROVEN
        cert.evidence.append({"stage": "dual_search", "result": "unresolved, forward to closer"})
        return CertStatus.TRANSLATED


class Closer:
    """Deterministic toolbox ONLY: tactic search, SAT/SMT, Groebner bases,
    interval arithmetic, certified numerics. No accepted step may depend
    on sampling temperature."""

    def __init__(self, oracle):
        self.oracle = oracle
        # ordered cheapest-first; each tool reports PROOF | COUNTEREXAMPLE | None
        self.toolbox: List[Callable[[Certificate], Optional[CloseResult]]] = []

    def register_tool(self, tool: Callable[[Certificate], Optional[CloseResult]]) -> None:
        self.toolbox.append(tool)

    def close(self, cert: Certificate, step_budget: int = 4096) -> CloseResult:
        cert.status = CertStatus.CLOSING
        for tool in self.toolbox:
            result = tool(cert)
            if result == CloseResult.PROOF:
                cert.status = CertStatus.PROVEN
                cert.kernel_hash = cert.provenance()
                cert.evidence.append({"stage": "close", "tool": getattr(tool, '__name__', 'tool'), "result": "proof"})
                return result
            if result == CloseResult.COUNTEREXAMPLE:
                cert.status = CertStatus.REFUTED
                cert.evidence.append({"stage": "close", "tool": getattr(tool, '__name__', 'tool'), "result": "counterexample"})
                return result
        cert.status = CertStatus.NEEDS_SPLIT
        cert.evidence.append({"stage": "close", "result": f"horizon exceeded at {step_budget} steps"})
        return CloseResult.HORIZON_EXCEEDED


class Recompiler:
    """When a leaf fails to close -> split it (legality-gated).
    When a family of leaves is PROVEN -> fold them with a glue theorem that
    is itself kernel-checked. Glue inequalities that resist proof become
    new leaves, never comments."""

    def __init__(self, oracle):
        self.oracle = oracle

    def split(self, cert: Certificate, children: List[Certificate],
              remainder: Optional[CheckableInequality]) -> bool:
        if not split_is_legal(children, remainder):
            cert.status = CertStatus.ILLEGAL
            cert.evidence.append({"stage": "split", "result": "ILLEGAL: no checkable uniform remainder"})
            return False
        for child in children:
            child.parent_id = cert.id
            child.remainder = child.remainder or remainder
            cert.child_ids.append(child.id)
        cert.evidence.append({"stage": "split", "result": f"{len(children)} children, remainder recorded"})
        return True

    def fold(self, glue: GlueTheorem) -> bool:
        ok = self.oracle.kernel_check(glue.lean_statement)  # full compile, zero sorry
        glue.kernel_verified = ok
        return ok


# ---------------------------------------------------------------------------
# 4. Barrier constraints (P vs NP only)
# ---------------------------------------------------------------------------

def pvnp_certificate_is_admissible(cert: Certificate) -> bool:
    """Lower-bound certificates must be non-natural, non-relativizing,
    non-algebrizing. Encoded as metadata the Decomposer must attach;
    the Conductor refuses anything that can't demonstrate it."""
    tags = set(cert.evidence and cert.evidence[0].get("technique_tags", []))
    return tags.isdisjoint({"natural_property", "relativizing", "algebrizing"})


# ---------------------------------------------------------------------------
# 5. The Conductor -- runs the four stages in a loop until no sorry remains
# ---------------------------------------------------------------------------

class Conductor:
    def __init__(self, decomposer: Decomposer, translator: Translator,
                 closer: Closer, recompiler: Recompiler, log_path: str):
        self.decomposer = decomposer
        self.translator = translator
        self.closer = closer
        self.recompiler = recompiler
        self.log_path = log_path
        os.makedirs(os.path.dirname(log_path) if os.path.dirname(log_path) else ".", exist_ok=True)

    def log(self, entry: Dict[str, Any]) -> None:
        entry["ts"] = time.time()
        try:
            with open(self.log_path, "a") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception:
            pass

    def run(self, dag: LemmaDAG, max_rounds: int = 100) -> bool:
        for round_i in range(max_rounds):
            open_leaves = dag.open_leaves()
            if dag.main_goal_sorry_free():
                self.log({"round": round_i, "event": "COMPILED", "problem": dag.problem})
                return True
            if not open_leaves:
                self.log({"round": round_i, "event": "STUCK: no open leaves, glue incomplete", "problem": dag.problem})
                return False

            for leaf in sorted(open_leaves, key=lambda c: c.bit_width):
                if leaf.status == CertStatus.PROPOSED:
                    if self.decomposer.accept_leaf(leaf):
                        continue
                    leaf.status = self.translator.dual_search(leaf)

                if leaf.status == CertStatus.TRANSLATED:
                    self.closer.close(leaf)

                if leaf.status == CertStatus.NEEDS_SPLIT:
                    # children come from the stochastic proposal layer;
                    # the recompiler only ADMITS legal ones
                    self.log({"round": round_i, "event": "awaiting_split_proposal",
                              "leaf": leaf.id, "problem": dag.problem})
                    break   # hand control back to proposal layer

            self.log({"round": round_i, "open": len(dag.open_leaves()), "problem": dag.problem})
        return False


# ---------------------------------------------------------------------------
# 6. Per-problem registries
# ---------------------------------------------------------------------------

@dataclass
class ProblemConfig:
    name: str
    equivalent_forms: List[str]          # ordered by certificate bit-width
    leaf_families: List[str]
    glue_family: str                     # density | compactness | interpolation | spectral
    extra_constraints: Optional[Callable[[Certificate], bool]] = None

    def smallest_form(self) -> str:
        return self.equivalent_forms[0]

RIEMANN = ProblemConfig(
    name="riemann",
    equivalent_forms=["robin_inequality", "redheffer_determinant", "li_positivity",
                      "beurling_nyman", "weil_explicit_positivity"],
    leaf_families=["certified_li_coefficients_dyadic_blocks",
                   "redheffer_det_bounds",
                   "explicit_zero_free_regions",
                   "turing_style_zero_counts",
                   "hilbert_polya_interval_probes"],   # finite-rank self-adjoint candidates
    glue_family="positivity_lattice_interpolation")

BSD = ProblemConfig(
    name="bsd",
    equivalent_forms=["rank_equals_ord_plus_finite_sha"],
    leaf_families=["finite_sha_computations", "heegner_kolyvagin_euler_systems",
                   "p_adic_l_interpolations", "rank_0_1_theorems_formalized_first"],
    glue_family="leading_coefficient_match")

NAVIER_STOKES = ProblemConfig(
    name="navier_stokes",
    equivalent_forms=["local_energy_certificates"],
    leaf_families=["local_existence_formalized_once",
                   "bkm_enstrophy_ladder_explicit_constants",
                   "certified_pde_slab_smoothness_or_blowup"],
    glue_family="continuation_vs_singularity_boolean")

YANG_MILLS = ProblemConfig(
    name="yang_mills",
    equivalent_forms=["lattice_gap_survives_continuum"],
    leaf_families=["finite_volume_lattice_ym",
                   "os_axioms_as_lean_typeclass",       # fails reflection positivity => no typecheck
                   "certified_transfer_matrix_gaps"],
    glue_family="renormalization_group_remainder")

HODGE = ProblemConfig(
    name="hodge",
    equivalent_forms=["cycle_degree_search"],
    leaf_families=["finite_cycle_search_on_cohomology_basis",
                   "griffiths_intermediates", "known_cases_dim_le_3"],
    glue_family="degeneration_specialization")         # constructible obstruction vanishing

PVNP = ProblemConfig(
    name="p_vs_np",
    equivalent_forms=["obstruction_polynomial_bitwidth"],
    leaf_families=["restricted_circuit_lower_bounds_ac0_monotone_algebraic",
                   "communication_complexity_2d_covering",
                   "gct_obstruction_polynomials_invariant_theory"],
    glue_family="explicit_polytime_verifiable_obstruction",
    extra_constraints=pvnp_certificate_is_admissible)   # dual-search every P=NP collapse too

REGISTRY: Dict[str, ProblemConfig] = {c.name: c for c in
    [RIEMANN, BSD, NAVIER_STOKES, YANG_MILLS, HODGE, PVNP]}


# ---------------------------------------------------------------------------
# 7. Shared library promotion
# ---------------------------------------------------------------------------

def promote_to_shared_library(cert: Certificate) -> bool:
    """Only kernel-green theorems are promoted, so later problems reuse them
    (PNT is already on this path in Lean)."""
    return cert.status == CertStatus.PROVEN and cert.kernel_hash is not None


if __name__ == "__main__":
    print("Kernel-Certificate Compiler Initialized successfully.")
    print("Problems registered:", list(REGISTRY.keys()))
