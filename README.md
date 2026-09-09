# Lean Swarm Orchestrator & Deterministic Kernel-Certificate Compiler

A production-grade, mathematically rigorous Lean 4 verification and swarm orchestration platform designed for formal mathematical decomposition, automated theorem proving, and certificate compilation for Clay Millennium Prize problems and advanced mathematical conjectures.

---

## System Architecture

```
                                  ┌────────────────────────┐
                                  │   Millennium Program   │
                                  │   (RH, NS, YM, P=NP)   │
                                  └───────────┬────────────┘
                                              │
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │   Monte Carlo Hyper-Tree Expansion (MCHE)  │
                        │   (Bit-Width Selection, UCT Routing)       │
                        └─────────────────────┬─────────────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
     ┌─────────────────────────────┐                     ┌─────────────────────────────┐
     │ Deterministic Closer Engine │                     │   LLM & Local Llama Swarms  │
     │ 1. Aesop / Grind (AST)      │                     │ (Conjecturing & Scaffolding)│
     │ 2. Z3 / CVC5 SMT Farkas     │                     └──────────────┬──────────────┘
     │ 3. Gröbner Buchberger Basis │                                    │
     │ 4. Certified Interval Numer.│                                    ▼
     └──────────────┬──────────────┘                     ┌─────────────────────────────┐
                    │                                    │   Translator Dual-Search    │
                    │                                    │   (Prove P ⊻ Prove ¬P)      │
                    │                                    └──────────────┬──────────────┘
                    │                                                   │
                    └─────────────────────────┬─────────────────────────┘
                                              │
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │  Kernel-Certificate Compiler (Conductor)  │
                        │  - split_is_legal() bit-width admission   │
                        │  - SHA-256 Content-Addressed Promotion    │
                        │  - Lean 4 Kernel Replay & Verification   │
                        └───────────────────────────────────────────┘
```

---

## Key Modules & Components

1. **Deterministic Core & Closers (`server/deterministicEngines.ts`, `kernel_certificate_compiler.py`)**:
   - **Tier 1 (Syntactic Normalization)**: Aesop / Grind congruence closure.
   - **Tier 2 (SMT Farkas Multipliers)**: Certified linear real arithmetic inconsistency bounds.
   - **Tier 3 (Gröbner Bases / Buchberger)**: Non-linear polynomial ideal membership and Nullstellensatz certificates.
   - **Tier 4 (Certified Interval Arithmetic)**: Rigorous interval Taylor enclosures.

2. **The Conductor Compilation Loop (`server/kernelCertificateCompiler.ts`)**:
   - `split_is_legal()`: Enforces strictly descending bit-width and explicit numerical quantifiers.
   - `Translator.dual_search()`: Traps inconsistent branches by attempting $P$ and $\neg P$ simultaneously.
   - `promote_to_shared_library()`: Only cryptographically sound, zero-`sorry` certificates enter the shared catalog.

3. **Monte Carlo Hyper-Tree Engine (`server/mcheEngine.ts`, `mche_engine.py`)**:
   - Multi-armed bandit UCT selection tailored for mathematical proof trees.
   - Rigorous branch refutation and proof progress scoring.

4. **Lean 4 Project Structure (`lakefile.toml`, `lean-toolchain`, `lake-manifest.json`)**:
   - Pinned Lean 4 toolchain `v4.18.0` with `mathlib4` integration.
   - Formal tracks in `LeanSwarmOrchestrator/` for RH, NS, YM, P vs NP, BSD, and Hodge.

5. **GitHub-Native Swarm Ledger & ETP Interface (`server/githubSwarmBridge.ts`, `.github/workflows/clean_room_gate.yml`)**:
   - **Leaves as Issues**: Automatically files `NEEDS_SPLIT` leaves emitted by the Conductor as GitHub issues with typed Lean 4 scaffolds, bit-width ratings, and explicit remainder constants.
   - **Branch-per-Leaf Topology**: Isolates exploration on `leaf/<id>` branches; merge promotion to `main` is gated by Clean-Room CI.
   - **Isolated Clean-Room CI**: Rebuilds proofs in pristine containers with pinned `v4.18.0` toolchain and generates 256-bit SHA-256 cryptographic artifact attestations.
   - **GitHub Projects DAG Mirror**: Syncs the live lemma DAG across Polymath proof stages.

6. **System-Level Creative Force-Multipliers (`server/creativeForceMultipliers.ts`, `src/components/GithubSwarmForceMultipliersPanel.tsx`)**:
   - **Internal Prediction Market**: Volume-weighted compute bidding on leaves, providing a live difficulty oracle and dynamically adjusting curriculum priorities.
   - **Nightly Prover Arena (ELO)**: Automated tournament benchmarks across Aesop AST normalizers, SMT Farkas multipliers, Gröbner Buchberger solvers, Certified Intervals, and local LLMs to dynamically sort Closer toolboxes.
   - **Adversarial Red-Team Refuter**: Actively falsifies proposed glue theorems via boundary fuzzing, singularity instantiation, and sign inversions before promotion.
   - **Proof-Golf Leaderboard**: Gamifies certificate bit-width compression and AST step reduction.
   - **Cross-Problem Lemma Broker**: Detects and promotes transferable PDE energy, harmonic analysis, and algebraic geometry machinery across Millennium problems.
   - **Dream-and-Distill Night Cycle**: Replays negative ledger error signatures offline to synthesize tactic rules and adjust priority queues.

---

## Codebase Hierarchy

- **Live Server & Web API (`server/`, `src/`)**: Active TypeScript backend and React UI powering the interactive proof studio and WebSocket stream.
- **Research CLI Kernels (`*.py`)**: Standalone reference implementations (`kernel_certificate_compiler.py`, `lean_process_oracle.py`, `mche_engine.py`) designed for batch benchmarking, Python-native CAS interop, and verification replay.

---

## Verification & CI Commands

```bash
# 1. Typecheck and AST Lint
npm run lint

# 2. Run Comprehensive Deterministic Test Suite
npm test

# 3. Production Build
npm run build
```
